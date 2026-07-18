import { BUILD, BUNDLED_INDEX, DATASETS, ENTITY, POWER_LENS_ALIASES } from "./registry.js";

const POWER_LENS_WEIGHTS = {
  compute: 0.30,
  interface: 0.25,
  alignment: 0.25,
  energy: 0.20
};

const FORCE_LABELS = {
  compute: "Compute",
  interface: "Interface",
  alignment: "Alignment",
  energy: "Energy"
};

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

function normalizeEntityKey(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function aliasesFor(entityName) {
  return Array.isArray(POWER_LENS_ALIASES?.entities?.[entityName])
    ? POWER_LENS_ALIASES.entities[entityName]
    : [];
}

function allNamesFor(entityName) {
  return [entityName, ...aliasesFor(entityName)];
}

function powerTier(score) {
  if (score >= 8.5) return "System-Shaping";
  if (score >= 7.5) return "Structural";
  if (score >= 6.5) return "Strategic";
  if (score >= 5.5) return "Participating";
  return "Peripheral";
}

function editDistance(left, right) {
  const a = String(left);
  const b = String(right);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return row[b.length];
}

function scoreSuggestions(query, records) {
  const needle = normalizeEntityKey(query);
  if (!needle) return [];
  return records
    .map((record) => {
      const candidates = allNamesFor(record.entity_name).map(normalizeEntityKey);
      const best = Math.max(...candidates.map((candidate) => {
        if (candidate === needle) return 100;
        if (candidate.length < 3 || needle.length < 3) return 0;
        const distance = editDistance(candidate, needle);
        if (distance <= 2) return 90 - distance * 5;
        if (candidate.startsWith(needle) || needle.startsWith(candidate)) return 80;
        if (candidate.includes(needle) || needle.includes(candidate)) return 60;
        return 0;
      }));
      return { name: record.entity_name, score: best };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((candidate) => candidate.name);
}

function findRelatedRecord(records, entityName, nameField) {
  const keys = new Set(allNamesFor(entityName).map(normalizeEntityKey));
  return records.find((record) => {
    if (keys.has(normalizeEntityKey(record?.[nameField]))) return true;
    return record?.ticker && aliasesFor(entityName).some((alias) => equalsIgnoreCase(alias, record.ticker));
  }) ?? null;
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

export function validatePowerLensQuery(raw, cap = 120) {
  const query = String(raw ?? "").trim();
  if (!query) return { ok: false, status: 400, error: "Missing required query parameter." };
  if (query.length > cap) return { ok: false, status: 414, error: "Power Lens query is too long." };
  return { ok: true, query };
}

export function getPowerLens(args = {}) {
  const validated = validatePowerLensQuery(args.query);
  if (!validated.ok) return { success: false, error: validated.error };

  const query = validated.query;
  const normalizedQuery = normalizeEntityKey(query);
  const scores = rowsOf(DATASETS.ai_power_index.data, ["scores", "entities", "rows"]);
  const record = scores.find((candidate) =>
    allNamesFor(candidate.entity_name).some((name) => normalizeEntityKey(name) === normalizedQuery)
  );

  if (!record) {
    return {
      product: "exmxc Power Lens",
      version: "1.0",
      query,
      found: false,
      generated_at: BUILD.released,
      suggestions: scoreSuggestions(query, scores),
      coverage: {
        universe_size: scores.length,
        scope: "Bundled exmxc AI Power universe",
        dynamic_company_generation: false
      },
      disclaimer: "No score was generated. Power Lens V1 resolves only entities in the bundled exmxc AI Power universe."
    };
  }

  const ranked = [...scores].sort((a, b) =>
    Number(b?.ai_power_index ?? -Infinity) - Number(a?.ai_power_index ?? -Infinity)
      || String(a?.entity_name).localeCompare(String(b?.entity_name))
  );
  const rank = ranked.findIndex((candidate) => candidate.entity_name === record.entity_name) + 1;
  const forceRows = Object.entries(POWER_LENS_WEIGHTS).map(([id, weight]) => {
    const score = Number(record[`${id}_exposure`]);
    return {
      id,
      label: FORCE_LABELS[id],
      score,
      weight,
      weighted_contribution: Number((score * weight).toFixed(2))
    };
  });
  const maximum = Math.max(...forceRows.map((force) => force.score));
  const minimum = Math.min(...forceRows.map((force) => force.score));
  const dominantForces = forceRows.filter((force) => force.score === maximum).map((force) => force.label);
  const lowestForces = forceRows.filter((force) => force.score === minimum).map((force) => force.label);
  const spread = maximum - minimum;
  const entityRecord = findRelatedRecord(getEntities(), record.entity_name, "company");
  const spegRecord = findRelatedRecord(getSpeg(), record.entity_name, "company");
  const matchedAlias = allNamesFor(record.entity_name).find((name) => normalizeEntityKey(name) === normalizedQuery);
  const matchBasis = normalizeEntityKey(record.entity_name) === normalizedQuery
    ? "canonical_name"
    : "alias_or_ticker";

  return {
    product: "exmxc Power Lens",
    version: "1.0",
    query,
    found: true,
    generated_at: BUILD.released,
    match: {
      canonical_entity: record.entity_name,
      matched_on: matchBasis,
      matched_value: matchedAlias,
      supported_aliases: aliasesFor(record.entity_name)
    },
    power: {
      ai_power_index: Number(record.ai_power_index),
      scale: "0-10",
      rank,
      universe_size: scores.length,
      tier: powerTier(Number(record.ai_power_index)),
      dominant_forces: dominantForces,
      lowest_exposure_forces: lowestForces,
      force_spread: spread,
      force_profile: spread <= 1.5 ? "Balanced" : spread <= 3 ? "Tilted" : "Concentrated"
    },
    four_forces: forceRows,
    entity_clarity: entityRecord ? {
      ecc: entityRecord.ecc,
      posture: entityRecord.posture,
      capability: entityRecord.capability,
      industry: entityRecord.industry,
      entity_type: entityRecord.entity_type
    } : null,
    scarcity: spegRecord ? {
      ticker: spegRecord.ticker,
      sector: spegRecord.sector,
      scarcity_layer: spegRecord.scarcity_layer,
      speg: spegRecord.speg,
      snapshot_date: spegRecord.date ?? DATASETS.speg.data?.metadata?.as_of_date,
      data_freshness: DATASETS.speg.data?.metadata?.data_freshness ?? "snapshot"
    } : null,
    interpretation: {
      summary: `${record.entity_name} ranks #${rank} of ${scores.length} in the bundled exmxc AI Power universe with an AI Power Index of ${record.ai_power_index}.`,
      strongest_exposure: `${dominantForces.join(" and ")} ${dominantForces.length === 1 ? "is" : "are"} the highest-scoring Four Forces exposure.`,
      lowest_exposure: `${lowestForces.join(" and ")} ${lowestForces.length === 1 ? "is" : "are"} the lowest-scoring exposure; this is not, by itself, evidence of a binding operational bottleneck.`,
      evidence_boundary: "This interpretation is derived only from bundled exmxc datasets and does not infer current company claims, operating results, or market conditions."
    },
    coverage: {
      ai_power_index: true,
      four_forces: true,
      entity_clarity: Boolean(entityRecord),
      scarcity_snapshot: Boolean(spegRecord),
      reality_gap: {
        status: "not_scored",
        reason: "Power Lens V1 does not yet contain the longitudinal claim-to-capability evidence required for a defensible Reality Gap score."
      }
    },
    provenance: {
      methodology: "Four Forces weights: Compute 30%, Interface 25%, Alignment 25%, Energy 20%.",
      methodology_url: "https://exmxc.ai/frameworks",
      source_datasets: [
        { id: "ai_power_index_dataset_v1", version: DATASETS.ai_power_index.data?.version },
        { id: "four_forces_exposure_dataset_v1", version: DATASETS.four_forces.data?.version },
        { id: "eci_dataset", version: DATASETS.entities.data?.version, included: Boolean(entityRecord) },
        { id: "speg_index", version: DATASETS.speg.data?.metadata?.version, as_of_date: DATASETS.speg.data?.metadata?.as_of_date, included: Boolean(spegRecord) }
      ]
    },
    suggestions: [],
    disclaimer: "Derived reference layer based on bundled exmxc datasets; not live market data or investment advice."
  };
}

export function getIndex() {
  return {
    ...BUNDLED_INDEX,
    total_entities: getEntities().length,
    last_updated: BUILD.released
  };
}

export function validateAuditTarget(raw, cap = 2048) {
  const rawUrl = String(raw ?? "").trim();
  if (!rawUrl) return { ok: false, status: 400, error: "Missing required url parameter." };
  if (rawUrl.length > cap) return { ok: false, status: 414, error: "Audit URL is too long." };
  let parsed;
  try { parsed = new URL(rawUrl); } catch { return { ok: false, status: 400, error: "Audit URL must be a valid HTTPS URL." }; }
  if (parsed.protocol !== "https:") return { ok: false, status: 400, error: "Audit URL must use HTTPS." };
  if (parsed.username || parsed.password) return { ok: false, status: 400, error: "Audit URL must not contain credentials." };
  if (parsed.port && parsed.port !== "443") return { ok: false, status: 400, error: "Audit URL must use the standard HTTPS port." };
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid")) return { ok: false, status: 400, error: "Audit URL host is not allowed." };
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return { ok: false, status: 400, error: "Audit URL IP-literal hosts are not allowed." };
  return { ok: true, url: parsed.toString() };
}

export async function runEeiAudit(args = {}) {
  const validated = validateAuditTarget(args.url);
  if (!validated.ok) return { success: false, error: validated.error };

  const auditUrl = validated.url;
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
    const message = error?.name === "AbortError" ? "EEI audit request timed out after 30 seconds." : "EEI audit upstream request failed.";
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
  "ex.power_lens.get": getPowerLens,
  "ex.ai_power.analysis.top": getAiPowerTop,
  "ex.eei.audit.run": runEeiAudit,
  "ex.convergence.latest": getConvergenceLatest,
  "ex.convergence.log": getConvergenceLog
};
