import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BUILD, CONTENT_LINKS, DATA_TOOLS, ENTITY, MCP_PROTOCOL_VERSIONS, MCP_RESOURCES } from "./registry.js";
import { getDatasetIndex, getIndex, TOOL_HANDLERS } from "./queries.js";

export const TOOL_IDS = new Set(DATA_TOOLS.map((tool) => tool.id));

const SUPPORTED_SCHEMA_KEYS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "description",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "enum",
  "$schema"
]);

function assertSupportedSchema(schema, path = "schema") {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return;
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
      throw new Error(`Unsupported JSON Schema keyword at ${path}: ${key}`);
    }
  }
  if (schema.properties) {
    for (const [name, child] of Object.entries(schema.properties)) {
      assertSupportedSchema(child, `${path}.properties.${name}`);
    }
  }
}

export function jsonSchemaToZod(schema, path = "schema") {
  assertSupportedSchema(schema, path);
  let zodSchema;
  if (schema.enum) {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
      throw new Error(`Invalid enum at ${path}`);
    }
    zodSchema = z.enum(schema.enum.map(String));
  } else if (schema.type === "object") {
    const required = new Set(schema.required || []);
    const shape = {};
    for (const [name, child] of Object.entries(schema.properties || {})) {
      const childSchema = jsonSchemaToZod(child, `${path}.properties.${name}`);
      shape[name] = required.has(name) ? childSchema : childSchema.optional();
    }
    zodSchema = z.object(shape);
    if (schema.additionalProperties === false) zodSchema = zodSchema.strict();
  } else if (schema.type === "string") {
    zodSchema = z.string();
  } else if (schema.type === "integer") {
    zodSchema = z.number().int();
  } else if (schema.type === "number") {
    zodSchema = z.number();
  } else {
    throw new Error(`Unsupported JSON Schema type at ${path}: ${schema.type}`);
  }

  if (typeof schema.minimum === "number") zodSchema = zodSchema.min(schema.minimum);
  if (typeof schema.maximum === "number") zodSchema = zodSchema.max(schema.maximum);
  if (typeof schema.exclusiveMinimum === "number") zodSchema = zodSchema.gt(schema.exclusiveMinimum);
  if (typeof schema.exclusiveMaximum === "number") zodSchema = zodSchema.lt(schema.exclusiveMaximum);
  if (schema.description && typeof zodSchema.describe === "function") zodSchema = zodSchema.describe(schema.description);
  return zodSchema;
}

export function mcpResourceProjection() {
  return MCP_RESOURCES.filter((resource) => resource.includeInDiscovery).map((resource) => ({
    uri: resource.uri,
    name: resource.name,
    title: resource.name,
    description: resource.description,
    mimeType: resource.mimeType
  }));
}

export function contentIndexResource() {
  return {
    content_links: CONTENT_LINKS.map(({ title, description = title, url }) => ({
      title,
      description,
      canonical_url: url
    }))
  };
}

export function resolveMcpResource(uri) {
  if (uri === "exmxc://datasets/index") return getDatasetIndex();
  if (uri === "exmxc://content/index") return contentIndexResource();
  const resource = MCP_RESOURCES.find((candidate) => candidate.uri === uri);
  if (!resource) return null;
  if (resource.resolver === "index") return getIndex();
  if (resource.data) return resource.data;
  return null;
}

function toolResultFromHandlerResult(result) {
  const toolResult = {
    content: [{ type: "text", text: JSON.stringify(result) }]
  };
  if (result && typeof result === "object" && !Array.isArray(result)) {
    toolResult.structuredContent = result;
  }
  if (result?.success === false || result?.error) {
    toolResult.isError = true;
  }
  return toolResult;
}

function errorToolResult(message) {
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({ success: false, error: message }) }]
  };
}

export function createExmxcMcpServer() {
  // SDK >= 1.26 forbids reusing a connected McpServer across clients; create a fresh server for every request to avoid cross-client response leakage.
  const server = new McpServer(
    { name: ENTITY.name, version: BUILD.version },
    { capabilities: { tools: {}, resources: {} }, protocolVersion: MCP_PROTOCOL_VERSIONS[0] }
  );

  for (const tool of DATA_TOOLS) {
    const zodSchema = jsonSchemaToZod(tool.inputSchema);
    server.registerTool(
      tool.id,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: zodSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: tool.id === "ex.eei.audit.run"
        }
      },
      async (args) => {
        const parsed = zodSchema.safeParse(args ?? {});
        if (!parsed.success) return errorToolResult(`Invalid arguments: ${parsed.error.message}`);
        try {
          const result = await TOOL_HANDLERS[tool.id](parsed.data);
          return toolResultFromHandlerResult(result);
        } catch (error) {
          return errorToolResult(String(error?.message || error));
        }
      }
    );
  }

  for (const resource of MCP_RESOURCES.filter((entry) => entry.includeInDiscovery)) {
    const read = async (uri) => {
      const resolved = resolveMcpResource(String(uri));
      if (!resolved) throw new Error(`Unknown resource: ${uri}`);
      return {
        contents: [{ uri: String(uri), mimeType: resource.mimeType, text: JSON.stringify(resolved) }]
      };
    };
    if (resource.uri.includes("{")) {
      server.registerResource(resource.name, new ResourceTemplate(resource.uri, { list: undefined }), { title: resource.name, description: resource.description, mimeType: resource.mimeType }, read);
    } else {
      server.registerResource(resource.name, resource.uri, { title: resource.name, description: resource.description, mimeType: resource.mimeType }, read);
    }
  }

  return server;
}
