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

export function calculateRealityGapScores(row, metadata = DATASETS.reality_gap_index.data.metadata) {
  const narrativeWeights = metadata.narrative_weights;
  const capabilityWeights = metadata.capability_weights;
  const narrative = Object.entries(narrativeWeights).reduce(
    (sum, [key, weight]) => sum + Number(row.narrative_components?.[key] ?? 0) * Number(weight),
    0
  ) * 10;
  const capabilityBase = Object.entries(capabilityWeights).reduce(
    (sum, [key, weight]) => sum + Number(row.capability_components?.[key] ?? 0) * Number(weight),
    0
  ) * 10;
  const capability = Math.max(0, Math.min(100, capabilityBase - Number(row.third_party_dependence_penalty ?? 0)));
  const aiNarrativeScore = Number(narrative.toFixed(1));
  const aiCapabilityScore = Number(capability.toFixed(1));
  return {
    ai_narrative_score: aiNarrativeScore,
    ai_capability_score: aiCapabilityScore,
    reality_gap: Number((aiCapabilityScore - aiNarrativeScore).toFixed(1))
  };
}

export function realityGapClassification(gap, metadata = DATASETS.reality_gap_index.data.metadata) {
  const value = Number(gap);
  return metadata.classifications.find((band) => value >= band.minimum_gap && value <= band.maximum_gap) ?? null;
}

export function getRealityGap(args = {}) {
  const data = DATASETS.reality_gap_index.data;
  let results = [...rowsOf(data, ["rows"])];
  const query = String(args.query ?? "").trim();
  if (query) {
    const normalized = normalizeEntityKey(query);
    results = results.filter((row) =>
      normalizeEntityKey(row.ticker) === normalized
      || allNamesFor(row.entity_name).some((name) => normalizeEntityKey(name) === normalized)
    );
  }
  if (args.classification) {
    results = results.filter((row) => equalsIgnoreCase(row.classification, args.classification));
  }

  const comparators = {
    gap_ascending: (a, b) => Number(a.reality_gap) - Number(b.reality_gap),
    gap_descending: (a, b) => Number(b.reality_gap) - Number(a.reality_gap),
    capability_descending: (a, b) => Number(b.ai_capability_score) - Number(a.ai_capability_score),
    narrative_descending: (a, b) => Number(b.ai_narrative_score) - Number(a.ai_narrative_score)
  };
  const sort = Object.hasOwn(comparators, args.sort) ? args.sort : "gap_ascending";
  results.sort((a, b) => comparators[sort](a, b) || a.entity_name.localeCompare(b.entity_name));

  const limitParam = Number.parseInt(args.limit ?? "", 10);
  if (Number.isFinite(limitParam) && limitParam > 0) results = results.slice(0, Math.min(100, limitParam));

  return {
    product: data.metadata.product,
    version: data.metadata.version,
    methodology_version: data.metadata.methodology_version,
    snapshot_date: data.metadata.as_of_date,
    mode: query ? "entity" : "benchmark",
    query: query || null,
    found: query ? results.length > 0 : true,
    count: results.length,
    formula: data.metadata.gap_formula,
    score_scale: data.metadata.score_scale,
    interpretation: {
      positive_gap: "Observed AI capability leads public AI narrative.",
      negative_gap: "Public AI narrative leads observed AI capability.",
      tolerance_band: "Gaps from -7.9 through +7.9 are classified as broadly aligned."
    },
    methodology: {
      narrative_weights: data.metadata.narrative_weights,
      capability_weights: data.metadata.capability_weights,
      rounding_policy: data.metadata.rounding_policy,
      scoring_anchors: data.metadata.scoring_anchors,
      confidence_policy: data.metadata.confidence_policy,
      classifications: data.metadata.classifications,
      evidence_policy: data.metadata.evidence_policy
    },
    suggestions: query && results.length === 0 ? scoreSuggestions(query, rowsOf(data, ["rows"])) : [],
    results,
    disclaimer: data.metadata.disclaimer
  };
}

function strategicScenarioFor(raw) {
  const needle = normalizeEntityKey(raw);
  if (!needle) return null;
  return DATASETS.strategic_consequence_scenarios.data.scenarios.find((scenario) =>
    [scenario.id, scenario.title, ...scenario.aliases].some((value) => normalizeEntityKey(value) === needle)
  ) ?? null;
}

export function validateStrategicConsequenceArgs(args = {}, cap = 120) {
  const scenario = strategicScenarioFor(args.scenario);
  if (!String(args.scenario ?? "").trim()) {
    return { ok: false, status: 400, error: "Missing required scenario parameter." };
  }
  if (!scenario) {
    return {
      ok: false,
      status: 400,
      error: "Unknown Strategic Consequence scenario.",
      valid_scenarios: DATASETS.strategic_consequence_scenarios.data.scenarios.map(({ id, title }) => ({ id, title }))
    };
  }
  const query = String(args.query ?? "").trim();
  if (query.length > cap) {
    return { ok: false, status: 414, error: "Strategic Consequence query is too long." };
  }
  const parsedLimit = Number.parseInt(args.limit ?? "5", 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(25, parsedLimit) : 5;
  return { ok: true, scenario, query, limit };
}

export function strategicConsequenceClassification(score, metadata = DATASETS.strategic_consequence_scenarios.data.metadata) {
  const value = Number(score);
  return metadata.classification_bands.find((band) =>
    value >= Number(band.minimum_score) && value <= Number(band.maximum_score)
  ) ?? null;
}

function strategicDriverText(force, contribution) {
  const label = FORCE_LABELS[force] ?? force;
  const direction = contribution >= 0 ? "supports relative advantage" : "creates relative pressure";
  return `${label} exposure ${direction} (${contribution >= 0 ? "+" : ""}${contribution.toFixed(2)}).`;
}

export function getStrategicConsequence(args = {}) {
  const validated = validateStrategicConsequenceArgs(args);
  if (!validated.ok) return { success: false, error: validated.error, valid_scenarios: validated.valid_scenarios ?? [] };

  const { scenario, query, limit } = validated;
  const data = DATASETS.strategic_consequence_scenarios.data;
  const metadata = data.metadata;
  const weights = metadata.force_weights;
  const scores = rowsOf(DATASETS.ai_power_index.data, ["scores", "entities", "rows"]);
  const spegRows = getSpeg();
  const realityRows = rowsOf(DATASETS.reality_gap_index.data, ["rows"]);

  const rawResults = scores.map((record) => {
    const forceContributions = Object.keys(weights).map((force) => {
      const exposure = Number(record[`${force}_exposure`] ?? 0);
      const scenarioDelta = Number(scenario.force_deltas[force] ?? 0);
      const modelWeight = Number(weights[force] ?? 0);
      return {
        force,
        exposure,
        scenario_delta: scenarioDelta,
        model_weight: modelWeight,
        contribution: Number((exposure * scenarioDelta * modelWeight).toFixed(4))
      };
    });
    const spegRecord = findRelatedRecord(spegRows, record.entity_name, "company");
    const scarcityAdjustment = Number(
      scenario.scarcity_layer_adjustments?.[spegRecord?.scarcity_layer] ?? 0
    );
    const realityGapRecord = findRelatedRecord(realityRows, record.entity_name, "entity_name");
    const realityModifier = realityGapRecord
      ? Math.max(-1, Math.min(1, Number(realityGapRecord.reality_gap) / 40)) * Number(scenario.reality_gap_weight ?? 0)
      : 0;
    const forceTotal = forceContributions.reduce((sum, force) => sum + force.contribution, 0);
    const rawImpactScore = Number((forceTotal + scarcityAdjustment + realityModifier).toFixed(4));
    return {
      record,
      forceContributions,
      spegRecord,
      scarcityAdjustment,
      realityGapRecord,
      realityModifier: Number(realityModifier.toFixed(4)),
      rawImpactScore
    };
  }).sort((left, right) =>
    right.rawImpactScore - left.rawImpactScore
      || String(left.record.entity_name).localeCompare(String(right.record.entity_name))
  );

  const maximum = Math.max(...rawResults.map((result) => result.rawImpactScore));
  const minimum = Math.min(...rawResults.map((result) => result.rawImpactScore));
  const range = maximum - minimum;
  const ranked = rawResults.map((result, index) => {
    const normalizedScore = range === 0
      ? 50
      : Number((((result.rawImpactScore - minimum) / range) * 100).toFixed(2));
    const band = strategicConsequenceClassification(normalizedScore, metadata);
    const forceDrivers = [...result.forceContributions]
      .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
      .slice(0, 2)
      .map((force) => strategicDriverText(force.force, force.contribution));
    const primaryDrivers = [...forceDrivers];
    if (result.spegRecord && result.scarcityAdjustment !== 0) {
      primaryDrivers.push(
        `${result.spegRecord.scarcity_layer} receives a ${result.scarcityAdjustment > 0 ? "positive" : "negative"} scenario adjustment (${result.scarcityAdjustment > 0 ? "+" : ""}${result.scarcityAdjustment.toFixed(2)}).`
      );
    }
    if (result.realityGapRecord && result.realityModifier !== 0) {
      primaryDrivers.push(
        `The versioned Reality Gap contributes ${result.realityModifier > 0 ? "+" : ""}${result.realityModifier.toFixed(2)} under this scenario's execution weighting.`
      );
    }

    return {
      entity_name: result.record.entity_name,
      scenario_rank: index + 1,
      universe_size: rawResults.length,
      scenario_advantage_score: normalizedScore,
      raw_impact_score: result.rawImpactScore,
      classification: band?.id ?? "mixed",
      classification_label: band?.label ?? "Mixed / Contingent",
      ai_power_index: Number(result.record.ai_power_index),
      force_contributions: result.forceContributions,
      scarcity: result.spegRecord ? {
        ticker: result.spegRecord.ticker,
        scarcity_layer: result.spegRecord.scarcity_layer,
        scenario_adjustment: result.scarcityAdjustment,
        snapshot_date: result.spegRecord.date ?? DATASETS.speg.data?.metadata?.as_of_date
      } : null,
      reality_gap: result.realityGapRecord ? {
        ticker: result.realityGapRecord.ticker,
        reality_gap: Number(result.realityGapRecord.reality_gap),
        classification: result.realityGapRecord.classification,
        scenario_modifier: result.realityModifier,
        snapshot_date: result.realityGapRecord.snapshot_date
      } : null,
      primary_drivers: primaryDrivers,
      coverage: {
        ai_power_index: true,
        four_forces: true,
        scarcity_snapshot: Boolean(result.spegRecord),
        reality_gap: result.realityGapRecord ? "scored" : "not_scored"
      }
    };
  });

  const normalizedQuery = normalizeEntityKey(query);
  const entityResult = query
    ? ranked.find((result) =>
      allNamesFor(result.entity_name).some((name) => normalizeEntityKey(name) === normalizedQuery)
    ) ?? null
    : null;

  return {
    product: metadata.product,
    version: metadata.version,
    methodology_version: metadata.methodology_version,
    generated_at: metadata.as_of_date,
    mode: query ? "entity" : "leaderboard",
    query: query || null,
    found: query ? Boolean(entityResult) : true,
    suggestions: query && !entityResult ? scoreSuggestions(query, scores) : [],
    scenario: {
      id: scenario.id,
      title: scenario.title,
      question: scenario.question,
      horizon: scenario.horizon,
      thesis: scenario.thesis,
      force_deltas: scenario.force_deltas
    },
    universe_size: ranked.length,
    methodology: {
      model_type: metadata.model_type,
      score_formula: metadata.score_formula,
      force_weights: metadata.force_weights,
      normalization_policy: metadata.normalization_policy,
      classification_bands: metadata.classification_bands,
      coverage_policy: metadata.coverage_policy,
      interpretation_policy: metadata.interpretation_policy
    },
    first_order: {
      logic: scenario.first_order_logic,
      most_advantaged: ranked.slice(0, limit),
      most_pressured: ranked.slice(-limit).reverse()
    },
    entity_result: entityResult,
    second_order_consequences: scenario.second_order_consequences,
    bottlenecks: scenario.bottlenecks,
    assumptions: scenario.assumptions,
    signals: {
      confirming: scenario.confirming_signals,
      invalidating: scenario.invalidating_signals
    },
    coverage: {
      ai_power_universe: ranked.length,
      scarcity_records_available: ranked.filter((result) => result.coverage.scarcity_snapshot).length,
      reality_gap_records_available: ranked.filter((result) => result.coverage.reality_gap === "scored").length,
      live_data: false,
      company_overrides: false
    },
    provenance: {
      scenario_dataset: {
        id: metadata.dataset_id,
        version: metadata.version,
        as_of_date: metadata.as_of_date
      },
      source_datasets: [
        { id: "ai_power_index_dataset_v1", version: DATASETS.ai_power_index.data?.version },
        { id: "four_forces_exposure_dataset_v1", version: DATASETS.four_forces.data?.version },
        { id: "speg_index", version: DATASETS.speg.data?.metadata?.version, as_of_date: DATASETS.speg.data?.metadata?.as_of_date },
        { id: "reality_gap_index_v1", version: DATASETS.reality_gap_index.data?.metadata?.version, as_of_date: DATASETS.reality_gap_index.data?.metadata?.as_of_date }
      ],
      methodology_url: "https://www.exmxc.ai/frameworks"
    },
    disclaimer: metadata.disclaimer
  };
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
  const realityGapRecord = findRelatedRecord(rowsOf(DATASETS.reality_gap_index.data, ["rows"]), record.entity_name, "entity_name");
  const matchedAlias = allNamesFor(record.entity_name).find((name) => normalizeEntityKey(name) === normalizedQuery);
  const matchBasis = normalizeEntityKey(record.entity_name) === normalizedQuery
    ? "canonical_name"
    : "alias_or_ticker";

  return {
    product: "exmxc Power Lens",
    version: "1.1",
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
      speg_display: spegRecord.speg_display ?? String(spegRecord.speg),
      forward_pe: spegRecord.forward_pe,
      forward_eps_growth_pct: spegRecord.forward_eps_growth_pct,
      growth_is_lower_bound: Boolean(spegRecord.growth_is_lower_bound),
      scarcity_multiplier: spegRecord.scarcity_multiplier,
      calculation_method: spegRecord.calculation_method,
      input_confidence: spegRecord.input_confidence,
      snapshot_date: spegRecord.date ?? DATASETS.speg.data?.metadata?.as_of_date,
      data_freshness: DATASETS.speg.data?.metadata?.data_freshness ?? "snapshot",
      snapshot_type: DATASETS.speg.data?.metadata?.snapshot_type,
      methodology_version: DATASETS.speg.data?.metadata?.methodology_version,
      caveats: DATASETS.speg.data?.metadata?.caveats ?? []
    } : null,
    reality_gap: realityGapRecord ? {
      ticker: realityGapRecord.ticker,
      ai_narrative_score: realityGapRecord.ai_narrative_score,
      ai_capability_score: realityGapRecord.ai_capability_score,
      reality_gap: realityGapRecord.reality_gap,
      classification: realityGapRecord.classification,
      classification_label: realityGapRecord.classification_label,
      confidence: realityGapRecord.confidence,
      summary: realityGapRecord.summary,
      evidence: realityGapRecord.evidence,
      snapshot_date: realityGapRecord.snapshot_date,
      methodology_version: DATASETS.reality_gap_index.data.metadata.methodology_version
    } : null,
    interpretation: {
      summary: `${record.entity_name} ranks #${rank} of ${scores.length} in the bundled exmxc AI Power universe with an AI Power Index of ${record.ai_power_index}.`,
      strongest_exposure: `${dominantForces.join(" and ")} ${dominantForces.length === 1 ? "is" : "are"} the highest-scoring Four Forces exposure.`,
      lowest_exposure: `${lowestForces.join(" and ")} ${lowestForces.length === 1 ? "is" : "are"} the lowest-scoring exposure; this is not, by itself, evidence of a binding operational bottleneck.`,
      claim_to_capability: realityGapRecord
        ? realityGapRecord.summary
        : "No versioned Reality Gap evidence ledger is bundled for this entity.",
      evidence_boundary: "This interpretation is derived only from bundled exmxc datasets. The July 16 scarcity layer uses user-supplied prices and forward fiscal EPS proxies, not licensed point-in-time NTM consensus data."
    },
    coverage: {
      ai_power_index: true,
      four_forces: true,
      entity_clarity: Boolean(entityRecord),
      scarcity_snapshot: Boolean(spegRecord),
      reality_gap: {
        status: realityGapRecord ? "scored" : "not_scored",
        reason: realityGapRecord
          ? "A versioned score grounded in dated official-company evidence is bundled for this entity."
          : "The Reality Gap V1 benchmark currently covers ten companies and does not infer scores outside that evidence ledger."
      }
    },
    provenance: {
      methodology: "Four Forces weights: Compute 30%, Interface 25%, Alignment 25%, Energy 20%.",
      methodology_url: "https://exmxc.ai/frameworks",
      source_datasets: [
        { id: "ai_power_index_dataset_v1", version: DATASETS.ai_power_index.data?.version },
        { id: "four_forces_exposure_dataset_v1", version: DATASETS.four_forces.data?.version },
        { id: "eci_dataset", version: DATASETS.entities.data?.version, included: Boolean(entityRecord) },
        { id: "speg_index", version: DATASETS.speg.data?.metadata?.version, as_of_date: DATASETS.speg.data?.metadata?.as_of_date, included: Boolean(spegRecord) },
        { id: "reality_gap_index_v1", version: DATASETS.reality_gap_index.data?.metadata?.version, as_of_date: DATASETS.reality_gap_index.data?.metadata?.as_of_date, included: Boolean(realityGapRecord) }
      ]
    },
    suggestions: [],
    disclaimer: "Derived reference layer based on bundled exmxc datasets and disclosed proxy inputs; not live market data or investment advice."
  };
}

export function getIndex() {
  return {
    ...BUNDLED_INDEX,
    total_entities: getEntities().length,
    current_observations: getEntities().length,
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
  "ex.reality_gap.get": getRealityGap,
  "ex.strategic_consequence.get": getStrategicConsequence,
  "ex.ai_power.analysis.top": getAiPowerTop,
  "ex.eei.audit.run": runEeiAudit,
  "ex.convergence.latest": getConvergenceLatest,
  "ex.convergence.log": getConvergenceLog
};
