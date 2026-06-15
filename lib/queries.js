import { BUILD, BUNDLED_INDEX, DATASETS, ENTITY } from "./registry.js";

function rowsOf(dataset, keys) {
  if (Array.isArray(dataset)) return dataset;
  for (const key of keys) {
    if (Array.isArray(dataset?.[key])) return dataset[key];
    if (Array.isArray(dataset?.data?.[key])) return dataset.data[key];
  }
  return [];
}

function equalsIgnoreCase(value, expected) {
  return String(value ?? "").toLowerCase() === String(expected ?? "").toLowerCase();
}

export function getEntities(args = {}) {
  let results = [...rowsOf(DATASETS.entities.data, ["entities", "data"] )];
  for (const key of ["industry", "entity_type", "posture", "capability"]) {
    if (args[key]) results = results.filter((entity) => equalsIgnoreCase(entity?.[key], args[key]));
  }
  return results;
}

export function getSpeg(args = {}) {
  let results = [...rowsOf(DATASETS.speg.data, ["rows"] )];
  for (const key of ["sector", "scarcity_layer", "ticker"]) {
    if (args[key]) results = results.filter((row) => equalsIgnoreCase(row?.[key], args[key]));
  }
  return results;
}

export function getDatasetIndex() {
  return {
    dataset_index_version: "1.0",
    entity: { name: ENTITY.name, domain: ENTITY.domain },
    datasets: Object.values(DATASETS).map((dataset) => ({
      name: dataset.displayName,
      endpoint: `https://mcp.exmxc.ai${dataset.route}`,
      description: dataset.description,
      category: dataset.category
    })),
    status: "active",
    last_updated: BUILD.released
  };
}

export function getConvergenceLatest() {
  const data = DATASETS.convergence_monitor.data;
  const latest = Array.isArray(data?.log) && data.log.length ? data.log[0] : null;
  return {
    framework: data.framework,
    framework_url: data.framework_url,
    monitor_url: data.monitor_url,
    methodology: data.methodology,
    disclaimer: data.disclaimer,
    status_ladder: data.status_ladder,
    latest,
    last_updated: latest?.date ?? BUILD.released
  };
}

export function getConvergenceLog(args = {}) {
  const data = DATASETS.convergence_monitor.data;
  const log = Array.isArray(data?.log) ? data.log : [];
  const limitParam = Number.parseInt(args.limit ?? "", 10);
  const limited = Number.isFinite(limitParam) && limitParam > 0 ? log.slice(0, limitParam) : log;
  return {
    framework: data.framework,
    framework_url: data.framework_url,
    monitor_url: data.monitor_url,
    disclaimer: data.disclaimer,
    count: limited.length,
    total: log.length,
    log: limited,
    last_updated: log[0]?.date ?? BUILD.released
  };
}

export function getAiPowerIndex() {
  return DATASETS.ai_power_index.data;
}

export function getFourForces() {
  return DATASETS.four_forces.data;
}

export function getEntityInABox() {
  return DATASETS.entity_in_a_box.data;
}

export function getAiPowerTop(args = {}) {
  const limitParam = Number.parseInt(args.limit ?? "10", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;
  const results = [...rowsOf(DATASETS.ai_power_index.data, ["scores", "entities", "rows"])]
    .sort((a, b) => Number(b?.ai_power_index ?? -Infinity) - Number(a?.ai_power_index ?? -Infinity))
    .slice(0, limit);

  return {
    analysis: "AI Power Top Entities",
    limit,
    results,
    source_dataset: "ai_power_index_dataset_v1",
    generated_at: BUILD.released
  };
}

export function getIndex() {
  return {
    ...BUNDLED_INDEX,
    total_entities: getEntities().length,
    last_updated: BUILD.released
  };
}

export async function runEeiAudit(args = {}) {
  const rawUrl = String(args.url ?? "").trim();
  if (!rawUrl) return { success: false, error: "Missing required url parameter." };

  const auditUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`https://exmxc-audit.vercel.app/api/eei-public?url=${encodeURIComponent(auditUrl)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        success: false,
        error: payload?.error || payload?.message || `EEI audit request failed with status ${response.status}`
      };
    }

    return payload ?? { success: false, error: "EEI audit returned an empty or non-JSON response." };
  } catch (error) {
    const message = error?.name === "AbortError" ? "EEI audit request timed out after 30 seconds." : String(error?.message || error);
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export const TOOL_HANDLERS = {
  "ex.entities.get": getEntities,
  "ex.speg.get": getSpeg,
  "ex.datasets.index.get": getDatasetIndex,
  "ex.ai_power_index.get": getAiPowerIndex,
  "ex.four_forces.get": getFourForces,
  "ex.entity_in_a_box.get": getEntityInABox,
  "ex.ai_power.analysis.top": getAiPowerTop,
  "ex.eei.audit.run": runEeiAudit,
  "ex.convergence.latest": getConvergenceLatest,
  "ex.convergence.log": getConvergenceLog
};
