import methodology from "../data/speg_index_v1/methodology.json" with { type: "json" };
import authoredRelease from "../data/speg_index_v1/releases/2026-09-17-rc1.json" with { type: "json" };
import authoredPublishedRelease from "../data/speg_index_v1/releases/2026-09-17-v1.json" with { type: "json" };

export const SPEG_INDEX_METHOD_ID = "speg-index-scarcity-v1.0.0";
export const SPEG_INDEX_SCHEMA_VERSION = "speg-index-profile-v1.0.0";
export const SPEG_INDEX_RELEASE_ID = "speg-index-2026-09-17-v1";
export const SPEG_INDEX_DRAFT_RELEASE_ID = "speg-index-2026-09-17-rc1";

const PRODUCT = "sPEG Index — durable scarcity selection with valuation context";
const API_ORIGIN = "https://mcp.exmxc.ai";
const DIMENSION_KEYS = [
  "constraint",
  "substitution_resistance",
  "economic_capture",
  "persistence",
  "cost_of_defense"
];
const DIMENSION_CODES = {
  constraint: "C",
  substitution_resistance: "S",
  economic_capture: "E",
  persistence: "P",
  cost_of_defense: "D"
};
const DIMENSION_FLOORS = {
  constraint: 3,
  substitution_resistance: 3,
  economic_capture: 3,
  persistence: 3,
  cost_of_defense: 2
};
const CONFIDENCE_RANK = { Unassessable: 0, Low: 1, Moderate: 2, High: 3 };
const DECISION_ORDER = { include: 0, watchlist: 1, insufficient_evidence: 2, exclude: 3 };

const SOURCE_META = {
  A1: ["ASML", "2026-07-15", "2026-07-15", "Q2 2026", "asml", "reported_fact", "Quarterly results and management discussion of current sales, margins, and capacity plans."],
  A2: ["ASML", null, null, null, "asml", "technical_description", "Product description for ASML extreme-ultraviolet lithography systems."],
  A3: ["Intel and ASML", "2026-09-08", "2026-09-08", null, "intel-asml-joint", "management_assertion", "Joint production update on Intel Foundry and ASML High-NA collaboration."],
  A4: ["ASML", null, null, "FY2025", "asml", "reported_fact", "Annual-report evidence on operating income and research and development spending."],
  A5: ["Reuters", "2026-05-19", "2026-05-19", null, "reuters-asml-adoption", "counterevidence", "External reporting of customer cost reservations and adoption timing for High-NA systems."],
  C1: ["Cadence Design Systems", "2026-07-27", "2026-07-27", "Q2 2026", "cadence", "reported_fact", "Quarterly financial results, reconciliation, research spending, and core EDA growth."],
  S1: ["Synopsys", "2026-08-26", "2026-08-26", "Q3 FY2026", "synopsys", "reported_fact", "Quarterly financial results, outlook, and acquisition-sensitive reconciliation."],
  X1: ["TSMC", null, null, null, "tsmc-eda-alliance", "counterevidence", "Foundry alliance and certification materials showing workflow integration and multiple competing EDA providers."],
  N1: ["NVIDIA", "2026-08-26", "2026-08-26", "Q2 FY2027", "nvidia", "reported_fact", "Quarterly financial results and accelerated-computing platform disclosures."],
  N2: ["Amazon Web Services", null, null, null, "aws-trainium", "counterevidence", "A competing integrated accelerator, software, and customer migration path."],
  N3: ["NVIDIA", "2026-09-03", "2026-09-03", null, "nvidia", "future_plan", "Agreement to acquire Hugging Face, including the stated consideration and commitments to preserve an open, multi-cloud, multi-accelerator platform."],
  T1: ["TSMC", "2026-07-16", "2026-07-16", "Q2 2026", "tsmc", "reported_fact", "Quarterly actual results and profitability."],
  T2: ["TSMC", "2026-07-16", "2026-07-16", "Q2 2026", "tsmc", "reported_fact", "Earnings release with the reported advanced-node wafer-revenue mix."],
  T3: ["TSMC", "2026-07-16", "2026-07-16", "Q2 2026", "tsmc", "management_assertion", "Earnings-call disclosures on capital spending and margin dilution from new-node and overseas ramps."],
  X2: ["Samsung Electronics", "2026-07-30", "2026-07-30", "Q2 2026", "samsung", "counterevidence", "Rival foundry and HBM activity, engagements, and planned ramps."],
  D1: ["Analog Devices", "2026-08-19", "2026-08-19", "Q3 FY2026", "analog-devices", "reported_fact", "Quarterly financial results and company-defined free cash flow."],
  D2: ["Analog Devices", null, null, null, "analog-devices", "management_assertion", "Issuer product-life-cycle and continuity policy."],
  D3: ["Texas Instruments", null, null, null, "texas-instruments", "counterevidence", "A rival product-life-cycle policy that limits a uniqueness inference from long product lives."],
  D4: ["Analog Devices", "2026-09-09", "2026-09-09", null, "analog-devices", "future_plan", "An acquisition announcement requiring a future perimeter review."],
  R1: ["Arista Networks", "2026-08-04", "2026-08-04", "Q2 2026", "arista", "reported_fact", "Quarterly results and disclosed customer, supplier, and competitive risks."],
  R2: ["Arista Networks", null, null, null, "arista", "counterevidence", "EOS architecture materials that describe integration alongside open standards and customer alternatives."],
  H1: ["SK hynix", "2026-07-29", "2026-07-29", "Q2 2026", "sk-hynix", "reported_fact", "Preliminary quarterly results, HBM shipments, contracts, and capacity plans."],
  H2: ["SK hynix", "2026-08-28", "2026-08-28", null, "sk-hynix", "future_plan", "A future Indiana investment and production-timing announcement."],
  M1: ["Micron Technology", "2026-06-24", "2026-06-24", "Q3 FY2026", "micron", "reported_fact", "Quarterly reported results from the prior mechanism pilot."],
  M2: ["Micron Technology", "2026-06-24", "2026-06-24", "Q3 FY2026", "micron", "management_assertion", "Prepared remarks on strategic agreements, planned capacity, capital spending, and deposits."],
  V1: ["Vertiv", "2026-07-29", "2026-07-29", "Q2 2026", "vertiv", "reported_fact", "Quarterly results, price-cost discussion, order conversion, and GAAP reconciliation."],
  V2: ["Schneider Electric and Motivair", "2026-02-18", "2026-02-18", null, "schneider-motivair", "counterevidence", "A rival liquid-cooling factory announcement showing expanding competing supply."]
};

const PROFILE_CONTEXT = {
  asml: {
    legalName: "ASML Holding N.V.",
    mechanism: "advanced-lithography-ecosystem",
    family: "manufacturing_qualification",
    customerProblem: "Pattern leading-edge semiconductor layers at production scale with qualified process support.",
    perimeter: "Integrated advanced lithography, installed support, and process ecosystem; non-EUV products are not assumed equally scarce.",
    route: "integrated_capability",
    materiality: "adequate",
    materialityReason: "The integrated capability is central to ASML's principal operating business; no unsupported EUV revenue percentage is used.",
    dependencies: ["leading-edge foundry investment", "customer process adoption", "specialized suppliers", "export permissions"],
    counter: "Customer cost reservations and continued use of existing EUV constrain claims about universal or immediate High-NA adoption.",
    dimensionReasons: {
      constraint: "Relevant EUV capability has no demonstrated equivalent and requires multi-stage technical and supplier replication.",
      substitution_resistance: "Replacement at the relevant layers requires substantial process redesign and qualification.",
      economic_capture: "Current operating earnings remain after substantial R&D, but the packet does not isolate a measured scarcity rent.",
      persistence: "A three-to-five-year path is credible; current evidence does not justify assuming universal High-NA adoption or permanence.",
      cost_of_defense: "Material benefit remains after engineering and support spending, with future capacity and support costs still uncertain."
    },
    falsifiers: ["A commercially credible equivalent for relevant production layers", "Customer process changes that materially bypass the capability", "Sustained failure to retain economics after required development and support"],
    next: "Quantify customer willingness to pay and update adoption evidence after results or material customer news.",
    eventPass: true,
    sourcePacketPass: true
  },
  cadence: {
    legalName: "Cadence Design Systems, Inc.",
    mechanism: "process-linked-electronic-design-workflows",
    family: "design_workflow",
    customerProblem: "Design and verify increasingly complex semiconductors against qualified foundry processes.",
    perimeter: "Integrated EDA and system-design workflows; acquired system-analysis activity is not automatically assigned core EDA scarcity.",
    route: "integrated_capability",
    materiality: "adequate",
    materialityReason: "Core EDA is central across the company and supported by current operating and alliance evidence.",
    dependencies: ["foundry process roadmaps", "semiconductor design intensity", "customer workflow renewal", "engineering talent"],
    counter: "Foundry alliance materials document multiple qualified EDA providers and prevent a uniqueness claim.",
    dimensionReasons: {
      constraint: "Process-linked design workflows are difficult to reproduce, but multiple qualified providers exist.",
      substitution_resistance: "Migration requires workflow rebuilding, validation, and foundry-linked qualification.",
      economic_capture: "Current earnings persist after substantial R&D, although acquisition and compensation effects require continued review.",
      persistence: "Recurring process integration supports a three-to-five-year case while process transitions remain a named risk.",
      cost_of_defense: "Material operating benefit remains after reported research spending and compensation costs."
    },
    falsifiers: ["Loss of relevance at major process transitions", "Material customer migration to competing design flows", "Deteriorating retained economics despite rising engineering spending"],
    next: "Obtain renewal-pricing, switching-cost, cash-flow, and stock-compensation evidence at the next results review.",
    eventPass: true,
    sourcePacketPass: true
  },
  nvidia: {
    legalName: "NVIDIA Corporation",
    mechanism: "accelerated-computing-platform",
    family: "ecosystem_software",
    customerProblem: "Train and serve advanced AI workloads with integrated compute, networking, and software.",
    perimeter: "Accelerated-computing platform spanning hardware, networking, and software.",
    route: "quantitative_revenue",
    coverageNumerator: 89,
    coverageDenominator: 96.221,
    coveragePeriod: "Q2 FY2027",
    materiality: "adequate",
    materialityReason: "Reported Data Center revenue represented approximately 92.5% of quarterly revenue; that does not make every dollar a scarcity rent.",
    dependencies: ["foundry and advanced packaging capacity", "hyperscaler capital budgets", "customer financing and commitments", "software ecosystem continuity"],
    counter: "AWS Trainium and Neuron provide a concrete competing integrated architecture and migration path, although vendor performance claims are not independently verified here.",
    dimensionReasons: {
      constraint: "The integrated platform is difficult to reproduce at current scale, while custom accelerators remain credible alternatives.",
      substitution_resistance: "Software, networking, and operational integration impose material migration work without making substitution impossible.",
      economic_capture: "Strong current operating economics persist after operating spending, but supplier and customer leakage remain review items.",
      persistence: "Ecosystem continuity supports a three-to-five-year case, bounded by customer migration and custom-silicon responses.",
      cost_of_defense: "Current economics remain substantial after reported operating costs; future commitments and platform support must stay visible."
    },
    falsifiers: ["Documented migration that materially weakens platform retention", "Persistent margin or cash leakage to suppliers or customers", "Financing or support commitments that absorb retained benefit"],
    next: "Refresh customer concentration, purchase commitments, financing arrangements, and concrete migration evidence at earnings.",
    eventPass: true,
    sourcePacketPass: true
  },
  synopsys: {
    legalName: "Synopsys, Inc.",
    mechanism: "silicon-to-systems-design-workflow",
    family: "design_workflow",
    customerProblem: "Design, verify, and integrate semiconductors and systems against qualified process requirements.",
    perimeter: "Established EDA and IP capability, with newly consolidated Ansys operations separated from the core scarcity claim.",
    route: "integrated_capability",
    materiality: "adequate",
    materialityReason: "EDA and IP are central to the company; acquisition-driven revenue is not treated as proof of scarcity.",
    dependencies: ["foundry process roadmaps", "Ansys integration", "customer workflow renewal", "engineering talent"],
    counter: "Foundry alliance evidence shows multiple qualified design providers, and acquisition accounting creates a wide GAAP-adjusted gap.",
    dimensionReasons: {
      constraint: "Established process-linked workflows and IP are difficult to reproduce, but qualified alternatives exist.",
      substitution_resistance: "Workflow, model, and process migration impose substantial operational burden.",
      economic_capture: "Current operating earnings support capture, with acquisition effects and adjustments explicitly limiting the inference.",
      persistence: "Process-linked workflow integration supports a three-to-five-year case subject to continued qualification relevance.",
      cost_of_defense: "Acquisition integration and the GAAP-adjusted earnings gap make retained economics sensitive to full defense and integration costs."
    },
    falsifiers: ["Integration or funding costs that make D1 appropriate", "Loss of qualified relevance in core workflows", "Evidence that operating benefit is not retained"],
    next: "Assemble an acquisition-normalized cash, compensation, and integration-cost series at results.",
    eventPass: true,
    sourcePacketPass: true
  },
  tsmc: {
    legalName: "Taiwan Semiconductor Manufacturing Company Limited",
    mechanism: "advanced-foundry-qualification-ecosystem",
    family: "manufacturing_qualification",
    customerProblem: "Manufacture advanced semiconductors at qualified yield, scale, and process performance.",
    perimeter: "Advanced-process manufacturing and its qualification and design ecosystem, with advanced packaging as a related capability.",
    route: "integrated_capability",
    materiality: "adequate",
    materialityReason: "Advanced manufacturing is central across the foundry business; the reported 7nm-and-below wafer mix is not mislabeled as consolidated revenue.",
    dependencies: ["customer design commitments", "equipment supply", "geographic continuity", "capital deployment", "export permissions"],
    counter: "Samsung reports active 2nm and HBM engagements and ramps, demonstrating competitive response without proving equivalent yield or scale.",
    dimensionReasons: {
      constraint: "Few foundries can provide the relevant combined manufacturing, yield, and qualification capability at scale.",
      substitution_resistance: "Customer process integration and design qualification impose substantial migration burden.",
      economic_capture: "Reported operating margins show retained economics, though the packet does not isolate scarcity rent from cycle and mix.",
      persistence: "The qualification ecosystem supports a three-to-five-year path while rival ramps remain an explicit response.",
      cost_of_defense: "Large capital requirements and expected ramp dilution make retained economics sensitive to defense spending."
    },
    falsifiers: ["Rival production proves substitutable at relevant yield, performance, and scale", "Leading customers shift meaningful designs", "Defense investment persistently consumes retained economics"],
    next: "Update capital returns, customer switching evidence, rival yields, and overseas-ramp economics at results.",
    eventPass: true,
    sourcePacketPass: true
  },
  "analog-devices": {
    legalName: "Analog Devices, Inc.",
    mechanism: "long-life-signal-chain-components",
    family: "embedded_component",
    customerProblem: "Maintain qualified signal-chain performance over long industrial and automotive product lives.",
    perimeter: "Demanding signal-chain applications inside a broader industrial and automotive portfolio.",
    route: "not_established",
    materiality: "unassessable",
    materialityReason: "The packet does not establish which scarce applications represent a material company perimeter.",
    dependencies: ["industrial and automotive design cycles", "customer requalification behavior", "manufacturing continuity", "portfolio integration"],
    counter: "Texas Instruments also supports long product lives, limiting the inference that continuity alone is a unique constraint.",
    dimensionReasons: {
      constraint: "Qualified alternatives appear credible across too much of the portfolio to support C3 company-wide.",
      substitution_resistance: "Embedded designs can impose material requalification work, although application-level evidence is incomplete.",
      economic_capture: "Current operating and cash economics are positive across periods; scarcity attribution remains incomplete.",
      persistence: "Long product lives support persistence in selected designs, but the scarce perimeter is not established.",
      cost_of_defense: "Reported economics remain after capital spending, without a complete split between growth and defense."
    },
    falsifiers: ["Commodity-like replacement across claimed applications", "Cycle-normalized economics deteriorate despite normal defense spending", "The acquisition changes the relevant perimeter without a completed review"],
    next: "Identify demanding applications, qualified substitutes, requalification burdens, and their material company exposure.",
    eventPass: false,
    sourcePacketPass: false
  },
  arista: {
    legalName: "Arista Networks, Inc.",
    mechanism: "cloud-network-operating-stack",
    family: "systems_service",
    customerProblem: "Operate high-performance data-center networks consistently across large deployments.",
    perimeter: "Ethernet switching systems, EOS software, and support for cloud and AI data-center networks.",
    route: "integrated_capability",
    materiality: "adequate",
    materialityReason: "The integrated network operating stack is central to the company, while customer and supplier concentration remain explicit dependencies.",
    dependencies: ["large cloud customers", "merchant silicon", "network standards", "support renewal"],
    counter: "Open standards, disaggregation, SONiC, and rival systems provide real customer alternatives.",
    dimensionReasons: {
      constraint: "Technical integration exists, but qualified systems and disaggregated alternatives keep feasible supply broader than C3.",
      substitution_resistance: "Operational consistency and installed workflows create material switching work.",
      economic_capture: "Reported margins show current retention, without proving the portion caused by durable scarcity.",
      persistence: "Customer alternatives and concentration leave the three-to-five-year rent-retention case unresolved.",
      cost_of_defense: "Current retained economics remain material after operating investment."
    },
    falsifiers: ["Material customer migration", "Lower support renewal economics", "Supplier capture of the economic benefit"],
    next: "Obtain external customer evidence on migration cost and retention through rival offerings.",
    eventPass: true,
    sourcePacketPass: false
  },
  "sk-hynix": {
    legalName: "SK hynix Inc.",
    mechanism: "qualified-high-bandwidth-memory",
    family: "manufacturing_qualification",
    customerProblem: "Supply qualified high-bandwidth memory at required performance, packaging, and scale.",
    perimeter: "HBM design, manufacturing, and packaging capability inside a broader DRAM and NAND business.",
    route: "not_established",
    materiality: "unassessable",
    materialityReason: "The packet does not bridge the narrower HBM mechanism to the full company perimeter without importing broader memory-cycle economics.",
    dependencies: ["AI accelerator demand", "customer qualification", "packaging capacity", "memory pricing", "capital investment"],
    counter: "Samsung reports HBM4 sales and HBM4E sampling, while announced new capacity is not current qualified output.",
    dimensionReasons: {
      constraint: "HBM capability and packaging qualification create meaningful supply barriers with active qualified rivals.",
      substitution_resistance: "Customer qualification imposes material burden, though alternative supply exists.",
      economic_capture: "Current operating capture is visible but partly coincides with memory-price increases.",
      persistence: "Contract resets and rival ramps leave three-to-five-year retention unresolved.",
      cost_of_defense: "Continued capital investment makes residual economics plausible but sensitive."
    },
    falsifiers: ["Rival qualification erodes allocation or economics", "Contract resets fail to retain price-cost benefit", "Required investment absorbs retained economics"],
    next: "Verify contract coverage and resets, customer retention across generations, company materiality, and economics after rival ramps.",
    eventPass: true,
    sourcePacketPass: false
  },
  micron: {
    legalName: "Micron Technology, Inc.",
    mechanism: "qualified-high-bandwidth-memory",
    family: "manufacturing_qualification",
    customerProblem: "Supply qualified high-bandwidth memory through product transitions at required scale.",
    perimeter: "HBM and related advanced-memory capability inside a broader DRAM and NAND portfolio.",
    route: "not_established",
    materiality: "unassessable",
    materialityReason: "Executed coverage, contract units, and the bridge from HBM to company-wide economics are incomplete.",
    dependencies: ["AI accelerator demand", "customer qualification", "memory pricing", "capital spending", "contract resets"],
    counter: "Samsung and SK hynix document active rival progress; current tight-market economics cannot establish multi-cycle substitution resistance.",
    dimensionReasons: {
      constraint: "Manufacturing and qualification barriers are meaningful for HBM.",
      substitution_resistance: "The packet does not establish resistance to qualified rival supply across the company perimeter.",
      economic_capture: "Current reported economics are strong, but present-cycle capture is not durable-retention evidence by itself.",
      persistence: "Contract and pricing evidence does not yet support the three-to-five-year case.",
      cost_of_defense: "Large capital commitments and deposit obligations make retained economics sensitive to full investment needs."
    },
    falsifiers: ["Pricing normalizes without cost relief", "Executed customer coverage proves weaker than planned coverage", "Required investment rises faster than retained benefit"],
    next: "Verify executed coverage, resets, qualification and switching evidence, capital needs, and material company attribution.",
    eventPass: true,
    sourcePacketPass: false
  },
  vertiv: {
    legalName: "Vertiv Holdings Co",
    mechanism: "high-density-data-center-thermal-and-power-systems",
    family: "systems_service",
    customerProblem: "Deploy and service power and cooling infrastructure for high-density compute reliably and on schedule.",
    perimeter: "Data-center power, cooling, and service systems, with product and project economics not yet separated.",
    route: "not_established",
    materiality: "unassessable",
    materialityReason: "The packet lacks a product-specific materiality bridge and does not isolate organic scarcity economics from acquisition and FX effects.",
    dependencies: ["data-center construction", "project conversion", "component supply", "working capital", "rival capacity"],
    counter: "Schneider and Motivair are expanding competing liquid-cooling capacity, and order backlog does not prove bargaining power.",
    dimensionReasons: {
      constraint: "Demand is strong, but product-level alternatives and expanding competing capacity keep C below the admission floor.",
      substitution_resistance: "Project qualification can matter, but the packet does not establish customer switching burdens at company scale.",
      economic_capture: "Current operating capture is observed, with acquisition and FX components separated from organic growth claims.",
      persistence: "Price-cost retention through rival expansion and project cycles is unresolved.",
      cost_of_defense: "Capacity, working-capital, and service requirements leave residual retention plausible but sensitive."
    },
    falsifiers: ["Rival capacity eliminates lead-time or pricing advantage", "Order conversion weakens materially", "Capacity and working-capital needs absorb retained economics"],
    next: "Obtain product-specific qualification constraints, retained price-cost economics, and definitive transaction evidence.",
    eventPass: false,
    sourcePacketPass: false
  }
};

const PUBLISHED_CONTEXT_OVERRIDES = {
  nvidia: {
    dependencies: ["foundry and advanced packaging capacity", "hyperscaler capital budgets", "customer financing and commitments", "software ecosystem continuity", "Hugging Face transaction funding, integration, and ecosystem neutrality"],
    counter: "AWS Trainium and Neuron provide a concrete competing architecture, while the announced Hugging Face transaction expressly preserves multi-cloud and multi-accelerator choice; neither source supports a no-substitute claim.",
    falsifiers: ["Documented migration that materially weakens platform retention", "Persistent margin or cash leakage to suppliers or customers", "Transaction funding, integration, or support commitments that absorb retained benefit", "Loss of Hugging Face's announced multi-platform posture"],
    next: "Review the Hugging Face transaction filing, financing, close, integration costs, ecosystem posture, customer concentration, commitments, and migration evidence at the earliest material update."
  }
};

const QUERY_ALIASES = {
  asml: ["ASML"],
  cadence: ["CDNS", "Cadence Design Systems"],
  nvidia: ["NVDA"],
  synopsys: ["SNPS"],
  tsmc: ["TSM", "Taiwan Semiconductor", "Taiwan Semiconductor Manufacturing Company"],
  "analog-devices": ["ADI"],
  arista: ["ANET", "Arista Networks"],
  "sk-hynix": ["SK hynix", "SK Hynix"],
  micron: ["MU", "Micron Technology"],
  vertiv: ["VRT", "Vertiv Holdings"]
};

const DIMENSION_SOURCE_IDS = {
  asml: {
    constraint: ["A2", "A3", "A5"],
    substitution_resistance: ["A2", "A3", "A5"],
    economic_capture: ["A1", "A4"],
    persistence: ["A3", "A5"],
    cost_of_defense: ["A1", "A4"]
  },
  cadence: {
    constraint: ["C1", "X1"],
    substitution_resistance: ["C1", "X1"],
    economic_capture: ["C1"],
    persistence: ["C1", "X1"],
    cost_of_defense: ["C1"]
  },
  nvidia: {
    constraint: ["N1", "N2"],
    substitution_resistance: ["N1", "N2", "N3"],
    economic_capture: ["N1"],
    persistence: ["N1", "N2", "N3"],
    cost_of_defense: ["N1", "N3"]
  },
  synopsys: {
    constraint: ["S1", "X1"],
    substitution_resistance: ["S1", "X1"],
    economic_capture: ["S1"],
    persistence: ["S1", "X1"],
    cost_of_defense: ["S1"]
  },
  tsmc: {
    constraint: ["T1", "T2", "X2"],
    substitution_resistance: ["T1", "T2", "X2"],
    economic_capture: ["T1", "T3"],
    persistence: ["T1", "T3", "X2"],
    cost_of_defense: ["T1", "T3"]
  },
  "analog-devices": {
    constraint: ["D2", "D3", "D4"],
    substitution_resistance: ["D2", "D3"],
    economic_capture: ["D1"],
    persistence: ["D2", "D3", "D4"],
    cost_of_defense: ["D1"]
  },
  arista: {
    constraint: ["R1", "R2"],
    substitution_resistance: ["R2"],
    economic_capture: ["R1"],
    persistence: ["R1", "R2"],
    cost_of_defense: ["R1"]
  },
  "sk-hynix": {
    constraint: ["H1", "X2"],
    substitution_resistance: ["H1", "X2"],
    economic_capture: ["H1"],
    persistence: ["H1", "X2"],
    cost_of_defense: ["H1", "H2"]
  },
  micron: {
    constraint: ["M1", "M2", "H1", "X2"],
    substitution_resistance: ["M2", "H1", "X2"],
    economic_capture: ["M1", "M2"],
    persistence: ["M2", "H1", "X2"],
    cost_of_defense: ["M2"]
  },
  vertiv: {
    constraint: ["V1", "V2"],
    substitution_resistance: ["V1", "V2"],
    economic_capture: ["V1"],
    persistence: ["V1", "V2"],
    cost_of_defense: ["V1", "V2"]
  }
};

function normalizeText(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function profileMatches(profile, query) {
  const needle = normalizeText(query);
  if (!needle) return true;
  const names = [profile.identity.issuer_id, profile.identity.stable_slug, profile.identity.display_name, profile.identity.legal_name, ...(QUERY_ALIASES[profile.identity.issuer_id] || [])];
  return names.some((name) => normalizeText(name) === needle);
}

function sourceRecord(id, source) {
  const [publisher, publicationDate, eventDate, reportingPeriod, originGroup, claimType, factualSummary] = SOURCE_META[id] || ["Unknown publisher", null, null, null, `unknown-${id}`, "analyst_inference", source.title];
  return {
    id,
    publisher,
    url: source.url,
    title: source.title,
    publication_date: publicationDate,
    event_date: eventDate,
    reporting_period: reportingPeriod,
    retrieval_date: source.retrieved_on,
    locator: source.date_and_locator,
    origin_group: originGroup,
    claim_type: claimType,
    factual_summary: factualSummary,
    limitations: source.limitation
  };
}

function scoreVector(profile) {
  return DIMENSION_KEYS.map((key) => profile.scores?.[key] ?? null);
}

export function calculateSpegIndexScore(dimensions) {
  const values = DIMENSION_KEYS.map((key) => dimensions?.[key] ?? null);
  if (values.some((value) => value === null || value === undefined)) return null;
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 4)) {
    throw new Error("sPEG Index dimension values must be integers from 0 to 4 or null.");
  }
  return values.reduce((sum, value) => sum + value, 0);
}

export function evaluateSpegIndexEligibility({
  dimensions,
  dimensionConfidence,
  materialityStatus,
  sourcePacketPass,
  currentReviewPass,
  materialEventPass
}) {
  const dimensionFloorsPass = DIMENSION_KEYS.every((key) => Number.isInteger(dimensions?.[key]) && dimensions[key] >= DIMENSION_FLOORS[key]);
  const confidencePass = DIMENSION_KEYS.every((key) => (CONFIDENCE_RANK[dimensionConfidence?.[key]] ?? -1) >= CONFIDENCE_RANK.Moderate);
  const gates = {
    dimension_floors: { pass: dimensionFloorsPass, reason: dimensionFloorsPass ? "C/S/E/P meet 3 and D meets 2." : "At least one dimension is unknown or below its floor." },
    materiality: { pass: materialityStatus === "adequate", reason: materialityStatus === "adequate" ? "Company-level materiality route is documented." : `Company-level materiality is ${materialityStatus}.` },
    decisive_confidence: { pass: confidencePass, reason: confidencePass ? "Every decisive dimension is at least Moderate confidence." : "At least one decisive dimension is below Moderate confidence." },
    source_packet: { pass: Boolean(sourcePacketPass), reason: sourcePacketPass ? "Minimum admission packet is present for the draft judgment." : "Minimum admission packet is incomplete." },
    current_review: { pass: Boolean(currentReviewPass), reason: currentReviewPass ? "Structural review is current at the research cutoff." : "Structural review is not current." },
    material_event: { pass: Boolean(materialEventPass), reason: materialEventPass ? "No unresolved material eligibility event is recorded at the research cutoff." : "A material perimeter or eligibility event remains unresolved." }
  };
  const reasonCodes = Object.entries(gates).filter(([, gate]) => !gate.pass).map(([key]) => `${key}_failed`);
  return {
    eligible_for_inclusion: reasonCodes.length === 0,
    ...gates,
    reason_codes: reasonCodes
  };
}

function downgradeSensitivity(profile) {
  const result = {};
  for (const key of DIMENSION_KEYS) {
    const downgraded = { ...profile.scores, [key]: profile.scores[key] === null ? null : Math.max(0, profile.scores[key] - 1) };
    result[key] = DIMENSION_KEYS.every((dimension) => Number.isInteger(downgraded[dimension]) && downgraded[dimension] >= DIMENSION_FLOORS[dimension]);
  }
  return result;
}

function dimensionRecord(profile, key, context, sources) {
  const value = profile.scores[key];
  const confidence = profile.dimension_confidence[key];
  return {
    value,
    anchor_id: value === null ? null : `${DIMENSION_CODES[key]}${value}`,
    reason: context.dimensionReasons[key],
    source_ids: DIMENSION_SOURCE_IDS[profile.issuer_id][key].filter((id) => Boolean(sources[id])),
    counterevidence: [context.counter],
    confidence,
    confidence_reason: confidence === "Low"
      ? "The frozen packet supports a tentative judgment but leaves an admission-critical company-level premise unresolved."
      : "The frozen packet contains traceable primary evidence and an external challenge, with visible limits on magnitude or duration.",
    plausible_alternative_anchor: confidence === "Low" && value > 0 ? value - 1 : null
  };
}

function buildProfile(profile, sources, releaseConfig) {
  const baseContext = PROFILE_CONTEXT[profile.issuer_id];
  if (!baseContext) throw new Error(`Missing sPEG Index context for ${profile.issuer_id}`);
  const context = releaseConfig.state === "released" && PUBLISHED_CONTEXT_OVERRIDES[profile.issuer_id]
    ? { ...baseContext, ...PUBLISHED_CONTEXT_OVERRIDES[profile.issuer_id] }
    : baseContext;
  const sourceDates = profile.sources.map((id) => sources[id]?.publication_date ?? null);
  const currentReviewPass = profile.reviewed_on === "2026-09-17";
  const eligibility = evaluateSpegIndexEligibility({
    dimensions: profile.scores,
    dimensionConfidence: profile.dimension_confidence,
    materialityStatus: context.materiality,
    sourcePacketPass: context.sourcePacketPass,
    currentReviewPass,
    materialEventPass: context.eventPass
  });
  const sensitivity = downgradeSensitivity(profile);
  return {
    identity: {
      issuer_id: profile.issuer_id,
      stable_slug: profile.issuer_id,
      legal_name: context.legalName,
      display_name: profile.name,
      securities: [],
      pricing_identity_status: "not_assembled"
    },
    scope: {
      mechanism_id: context.mechanism,
      mechanism_family: context.family,
      customer_problem: context.customerProblem,
      business_perimeter: context.perimeter,
      company_attribution_route: context.route,
      coverage: {
        numerator: context.coverageNumerator ?? null,
        denominator: context.coverageDenominator ?? null,
        period: context.coveragePeriod ?? null,
        qualitative_rationale: context.materialityReason
      },
      materiality_status: context.materiality,
      materiality_rationale: context.materialityReason,
      dependencies: context.dependencies
    },
    dimensions: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, dimensionRecord(profile, key, context, sources)])),
    score: {
      method_id: SPEG_INDEX_METHOD_ID,
      total: calculateSpegIndexScore(profile.scores),
      vector: scoreVector(profile),
      scale: "ordinal",
      label: "Scarcity Durability Score",
      meaning: "Ordinal research summary; not a probability, percentile, rank, or numerical valuation input."
    },
    eligibility,
    decision: {
      research_decision: profile.research_decision,
      membership_state: releaseConfig.state === "released"
        ? (profile.membership_state ?? (profile.research_decision === "include" && eligibility.eligible_for_inclusion ? "member" : null))
        : null,
      owner: "Mike Ye",
      prepared_by: "Ella",
      rationale: profile.rationale_and_falsifiers.trim(),
      falsifiers: context.falsifiers,
      next_observation: context.next,
      due_date: profile.next_review_due
    },
    review: {
      as_of_cutoff: profile.reviewed_on,
      reviewed_at: releaseConfig.reviewedAt ?? `${profile.reviewed_on}T23:59:59Z`,
      source_dates: sourceDates,
      next_review_due: profile.next_review_due,
      event_status: context.eventPass ? "clear_at_research_cutoff" : "review_open",
      publication_at: releaseConfig.publicationAt,
      effective_at: releaseConfig.effectiveAt
    },
    sensitivity: {
      single_dimension_downgrade_pass: sensitivity,
      binding_dimensions: Object.entries(sensitivity).filter(([, pass]) => !pass).map(([key]) => key),
      interpretation: "rule_sensitivity_not_confidence_interval"
    },
    release: {
      state: releaseConfig.state,
      release_id: releaseConfig.releaseId,
      predecessor_release_id: releaseConfig.predecessorReleaseId,
      change_reasons: releaseConfig.changeReasons,
      content_hash: releaseConfig.contentHash
    },
    valuation: {
      peg_eligible: false,
      peg: null,
      peg_null_reason: profile.peg_reason,
      economic_profile_id: null,
      economic_speg: null,
      economic_speg_null_reason: profile.economic_speg_reason,
      sds_used_as_valuation_input: false
    }
  };
}

function releaseCoverage(profiles) {
  const count = (decision) => profiles.filter((profile) => profile.decision.research_decision === decision).length;
  return {
    candidate_count: profiles.length,
    include_recommendations: count("include"),
    watchlist: count("watchlist"),
    insufficient_evidence: count("insufficient_evidence"),
    exclude: count("exclude"),
    released_members: profiles.filter((profile) => profile.decision.membership_state === "member").length,
    qualified_member_count: profiles.filter((profile) => profile.decision.membership_state === "member" && profile.eligibility.eligible_for_inclusion).length
  };
}

function buildFullRelease(authored, releaseConfig) {
  const sourcesById = Object.fromEntries(Object.entries(authored.sources).map(([id, source]) => [id, sourceRecord(id, source)]));
  const profiles = authored.profiles.map((profile) => buildProfile(profile, sourcesById, releaseConfig));
  const sources = Object.values(sourcesById);
  return {
    product: PRODUCT,
    release_id: releaseConfig.releaseId,
    release_state: releaseConfig.state,
    method_id: SPEG_INDEX_METHOD_ID,
    schema_version: SPEG_INDEX_SCHEMA_VERSION,
    research_cutoff: releaseConfig.researchCutoff,
    publication_at: releaseConfig.publicationAt,
    effective_at: releaseConfig.effectiveAt,
    predecessor_release_id: releaseConfig.predecessorReleaseId,
    content_hash: releaseConfig.contentHash,
    membership_mutated: releaseConfig.membershipMutated,
    coverage: releaseCoverage(profiles),
    profiles,
    sources,
    provenance: {
      research_owner: "Mike Ye",
      prepared_by: "Ella",
      source_count: sources.length,
      source_origin_groups: [...new Set(sources.map((source) => source.origin_group))].sort(),
      notes: releaseConfig.notes
    },
    links: {
      self: `${API_ORIGIN}/speg/index/v1`,
      methodology: `${API_ORIGIN}/speg/index/v1/methodology`,
      schema: `${API_ORIGIN}/schemas/speg-index-profile-v1`,
      release: `${API_ORIGIN}/speg/index/v1/releases/${releaseConfig.releaseId}`,
      public_hub: "https://www.exmxc.ai/speg-index",
      public_methodology: "https://www.exmxc.ai/speg-methodology"
    }
  };
}

export const SPEG_INDEX_METHODOLOGY = methodology;
export const SPEG_INDEX_DRAFT_RELEASE = buildFullRelease(authoredRelease, {
  releaseId: SPEG_INDEX_DRAFT_RELEASE_ID,
  state: "draft",
  researchCutoff: "2026-09-17",
  reviewedAt: null,
  publicationAt: null,
  effectiveAt: null,
  predecessorReleaseId: null,
  contentHash: null,
  membershipMutated: false,
  changeReasons: ["initial_research_constitution"],
  notes: "RC1 is a frozen draft research constitution. Include recommendations are not released membership, every valuation field is null, and the packet makes no return claim."
});
export const SPEG_INDEX_RELEASE = buildFullRelease(authoredPublishedRelease, {
  releaseId: authoredPublishedRelease.release_id,
  state: "released",
  researchCutoff: authoredPublishedRelease.research_cutoff,
  reviewedAt: authoredPublishedRelease.reviewed_at,
  publicationAt: authoredPublishedRelease.publication_at,
  effectiveAt: authoredPublishedRelease.effective_at,
  predecessorReleaseId: authoredPublishedRelease.predecessor_release_id,
  contentHash: authoredPublishedRelease.content_hash,
  membershipMutated: authoredPublishedRelease.membership_mutated,
  changeReasons: ["initial_membership_release", "freshness_and_material_event_review"],
  notes: authoredPublishedRelease.notes
});
const RELEASES_BY_ID = new Map([
  [SPEG_INDEX_DRAFT_RELEASE.release_id, SPEG_INDEX_DRAFT_RELEASE],
  [SPEG_INDEX_RELEASE.release_id, SPEG_INDEX_RELEASE]
]);

function sourceSubset(release, profiles) {
  const ids = new Set(profiles.flatMap((profile) => DIMENSION_KEYS.flatMap((key) => profile.dimensions[key].source_ids)));
  return release.sources.filter((source) => ids.has(source.id));
}

function filterRelease(release, profiles) {
  const sources = sourceSubset(release, profiles);
  return {
    ...structuredClone(release),
    coverage: releaseCoverage(profiles),
    profiles: structuredClone(profiles),
    sources: structuredClone(sources),
    provenance: {
      ...release.provenance,
      source_count: sources.length,
      source_origin_groups: [...new Set(sources.map((source) => source.origin_group))].sort()
    }
  };
}

function suggestions(release, query) {
  const needle = normalizeText(query);
  if (!needle) return [];
  return release.profiles
    .filter((profile) => normalizeText(profile.identity.display_name).includes(needle) || needle.includes(normalizeText(profile.identity.display_name)))
    .map((profile) => profile.identity.display_name)
    .slice(0, 5);
}

export function validateSpegIndexQuery(args = {}) {
  const allowed = new Set(["query", "decision", "membership_state", "release"]);
  const unknown = Object.keys(args).filter((key) => !allowed.has(key));
  if (unknown.length) return { ok: false, error: `Unknown query field: ${unknown.join(", ")}` };
  if (args.decision && !["include", "watchlist", "insufficient_evidence", "exclude"].includes(args.decision)) return { ok: false, error: "Invalid research decision." };
  if (args.membership_state && !["member", "under_review", "removed"].includes(args.membership_state)) return { ok: false, error: "Invalid membership state." };
  return { ok: true };
}

export function getSpegIndexV1(args = {}) {
  const validation = validateSpegIndexQuery(args);
  if (!validation.ok) return { found: false, error: validation.error };
  const release = args.release ? RELEASES_BY_ID.get(args.release) : SPEG_INDEX_RELEASE;
  if (!release) {
    return { found: false, error: "Unknown sPEG Index release.", release_id: args.release };
  }
  let profiles = [...release.profiles];
  if (args.query) profiles = profiles.filter((profile) => profileMatches(profile, args.query));
  if (args.decision) profiles = profiles.filter((profile) => profile.decision.research_decision === args.decision);
  if (args.membership_state) profiles = profiles.filter((profile) => profile.decision.membership_state === args.membership_state);
  if (args.query && profiles.length === 0) {
    return { found: false, error: "Unknown sPEG Index issuer.", query: args.query, suggestions: suggestions(release, args.query) };
  }
  profiles.sort((a, b) => (DECISION_ORDER[a.decision.research_decision] - DECISION_ORDER[b.decision.research_decision]) || a.identity.display_name.localeCompare(b.identity.display_name));
  return filterRelease(release, profiles);
}

export function getSpegIndexMethodologyV1() {
  return structuredClone(SPEG_INDEX_METHODOLOGY);
}

export function getSpegIndexReleasesV1() {
  return {
    product: PRODUCT,
    method_id: SPEG_INDEX_METHOD_ID,
    latest_published_release_id: SPEG_INDEX_RELEASE_ID,
    draft_release_ids: [SPEG_INDEX_DRAFT_RELEASE_ID],
    releases: [SPEG_INDEX_RELEASE, SPEG_INDEX_DRAFT_RELEASE].map((release) => ({
      release_id: release.release_id,
      state: release.release_state,
      research_cutoff: release.research_cutoff,
      publication_at: release.publication_at,
      effective_at: release.effective_at,
      predecessor_release_id: release.predecessor_release_id,
      content_hash: release.content_hash,
      membership_mutated: release.membership_mutated,
      change_reasons: release.profiles[0]?.release.change_reasons ?? []
    }))
  };
}

export function spegIndexReleaseHashPayload(release) {
  const payload = structuredClone(release);
  payload.content_hash = null;
  for (const profile of payload.profiles) profile.release.content_hash = null;
  return payload;
}

export function validateSpegIndexReleaseSemantics(release) {
  const errors = [];
  const sourceIds = new Set(release.sources.map((source) => source.id));
  for (const profile of release.profiles) {
    const id = profile.identity.issuer_id;
    const values = Object.fromEntries(DIMENSION_KEYS.map((key) => [key, profile.dimensions[key].value]));
    const expectedTotal = calculateSpegIndexScore(values);
    if (profile.score.total !== expectedTotal) errors.push(`${id}: score total does not equal the deterministic five-dimension sum`);
    if (JSON.stringify(profile.score.vector) !== JSON.stringify(DIMENSION_KEYS.map((key) => values[key]))) errors.push(`${id}: score vector is not in C/S/E/P/D order`);
    const expectedEligibility = evaluateSpegIndexEligibility({
      dimensions: values,
      dimensionConfidence: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, profile.dimensions[key].confidence])),
      materialityStatus: profile.scope.materiality_status,
      sourcePacketPass: profile.eligibility.source_packet.pass,
      currentReviewPass: profile.eligibility.current_review.pass,
      materialEventPass: profile.eligibility.material_event.pass
    });
    if (profile.eligibility.eligible_for_inclusion !== expectedEligibility.eligible_for_inclusion) errors.push(`${id}: eligibility result does not match independent gates`);
    if (profile.decision.research_decision === "include" && !profile.eligibility.eligible_for_inclusion) errors.push(`${id}: include recommendation fails an admission gate`);
    if (profile.release.state === "draft" && profile.decision.membership_state !== null) errors.push(`${id}: draft recommendation cannot set live membership`);
    if (profile.valuation.sds_used_as_valuation_input !== false) errors.push(`${id}: SDS must never feed valuation numerically`);
    if (!profile.valuation.peg_eligible && profile.valuation.peg !== null) errors.push(`${id}: ineligible PEG must be null`);
    if (profile.valuation.economic_profile_id === null && profile.valuation.economic_speg !== null) errors.push(`${id}: economic sPEG requires a qualified economic profile`);
    const expectedSensitivity = downgradeSensitivity({ scores: values });
    if (JSON.stringify(profile.sensitivity.single_dimension_downgrade_pass) !== JSON.stringify(expectedSensitivity)) errors.push(`${id}: downgrade sensitivity drift`);
    for (const key of DIMENSION_KEYS) {
      for (const sourceId of profile.dimensions[key].source_ids) {
        if (!sourceIds.has(sourceId)) errors.push(`${id}.${key}: missing source ${sourceId}`);
      }
    }
  }
  if (release.release_state === "draft") {
    if (release.membership_mutated) errors.push("draft release cannot mutate membership");
    if (release.publication_at !== null || release.effective_at !== null || release.content_hash !== null) errors.push("draft release cannot claim publication, effectiveness, or final content hash");
  }
  if (release.release_state === "released") {
    if (!release.publication_at || !release.effective_at || !release.content_hash) errors.push("released snapshot requires publication, effective time, and content hash");
    if (release.profiles.some((profile) => profile.decision.membership_state === "member" && (!profile.eligibility.eligible_for_inclusion || profile.decision.research_decision !== "include"))) errors.push("released members must be eligible include decisions");
    if (release.profiles.some((profile) => profile.decision.research_decision === "include" && profile.eligibility.eligible_for_inclusion && !["member", "under_review"].includes(profile.decision.membership_state))) errors.push("eligible released include decisions require member or under-review state");
    if (release.profiles.some((profile) => profile.decision.research_decision !== "include" && profile.decision.membership_state === "member")) errors.push("non-include decisions cannot be released members");
  }
  if (release.coverage.candidate_count !== release.profiles.length) errors.push("coverage candidate count drift");
  if (release.provenance.source_count !== release.sources.length) errors.push("provenance source count drift");
  return { ok: errors.length === 0, errors };
}
