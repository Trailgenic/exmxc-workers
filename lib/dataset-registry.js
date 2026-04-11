export const datasetRegistry = {
  entities: {
    id: "entities",
    route: "/entities",
    rawUrl: "https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/entities.json",
    description:
      "Institutional entity intelligence dataset including industry, entity_type, posture, capability, and ECC scoring."
  },
  speg: {
    id: "speg",
    route: "/speg",
    rawUrl: "https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/speg_index.json",
    description:
      "Scarcity-adjusted PEG valuation dataset covering AI infrastructure companies."
  },
  ai_power_index: {
    id: "ai_power_index",
    route: "/datasets/ai_power_index",
    rawUrl:
      "https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/ai_power_index_dataset_v1.json",
    description:
      "Global AI ecosystem ranking dataset measuring compute, interface, alignment, and energy influence.",
    schemaRoute: "/datasets/ai_power_index/schema",
    schemaUrl:
      "https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/four_forces_dataset_v1.json"
  },
  entity_in_a_box: {
    id: "entity_in_a_box",
    route: "/datasets/entity_in_a_box_v1",
    type: "ontology",
    rawUrl:
      "https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/entity_in_a_box_v1.json",
    description:
      "System-level ontology dataset defining AI-era entity structure across ontology, dataset, schema, MCP endpoint, and interpretation layers."
  }
};
