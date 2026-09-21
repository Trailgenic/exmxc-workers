-- Reference relational model for Consumer Intent Graph.
-- The current release is Git-versioned JSON; this DDL defines the durable store
-- for a later D1/Postgres ingestion deployment without coupling methodology to UI.

CREATE TABLE sources (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  terms_status TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE entities (
  entity_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  parent_entity_id TEXT REFERENCES entities(entity_id),
  ticker TEXT,
  aliases_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE categories (
  category_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  parent_category_id TEXT REFERENCES categories(category_id)
);

CREATE TABLE raw_observations (
  raw_observation_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  source_native_id TEXT,
  source_url TEXT,
  observed_at TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  raw_text TEXT,
  content_hash TEXT NOT NULL,
  access_basis TEXT NOT NULL,
  UNIQUE(source_id, source_native_id),
  UNIQUE(source_id, content_hash)
);

CREATE TABLE structured_observations (
  observation_id TEXT PRIMARY KEY,
  raw_observation_id TEXT NOT NULL REFERENCES raw_observations(raw_observation_id),
  category_id TEXT NOT NULL REFERENCES categories(category_id),
  entity_id TEXT REFERENCES entities(entity_id),
  parent_company_id TEXT REFERENCES entities(entity_id),
  consumer_action TEXT NOT NULL,
  direction TEXT NOT NULL,
  economic_driver TEXT,
  substitute_entity_id TEXT REFERENCES entities(entity_id),
  time_horizon TEXT NOT NULL,
  intensity REAL NOT NULL CHECK(intensity BETWEEN 0 AND 1),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  duplicate_cluster_id TEXT,
  spam_bot_probability REAL CHECK(spam_bot_probability BETWEEN 0 AND 1),
  promotion_probability REAL CHECK(promotion_probability BETWEEN 0 AND 1),
  geography TEXT,
  methodology_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE substitutions (
  substitution_id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL REFERENCES structured_observations(observation_id),
  from_entity_id TEXT REFERENCES entities(entity_id),
  to_entity_id TEXT REFERENCES entities(entity_id),
  from_category_id TEXT REFERENCES categories(category_id),
  to_category_id TEXT REFERENCES categories(category_id),
  reason TEXT,
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1)
);

CREATE TABLE methodology_versions (
  methodology_version TEXT PRIMARY KEY,
  effective_at TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE TABLE factor_readings (
  release_id TEXT NOT NULL,
  as_of TEXT NOT NULL,
  window TEXT NOT NULL,
  factor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  balance REAL,
  observation_count INTEGER NOT NULL,
  source_count INTEGER NOT NULL,
  confidence TEXT NOT NULL,
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(methodology_version),
  PRIMARY KEY(release_id, window, factor_id)
);

CREATE TABLE category_readings (
  release_id TEXT NOT NULL,
  as_of TEXT NOT NULL,
  window TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(category_id),
  factor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  balance REAL,
  observation_count INTEGER NOT NULL,
  source_count INTEGER NOT NULL,
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(methodology_version),
  PRIMARY KEY(release_id, window, category_id, factor_id)
);

CREATE TABLE entity_readings (
  release_id TEXT NOT NULL,
  as_of TEXT NOT NULL,
  window TEXT NOT NULL,
  entity_id TEXT NOT NULL REFERENCES entities(entity_id),
  factor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  balance REAL,
  observation_count INTEGER NOT NULL,
  source_count INTEGER NOT NULL,
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(methodology_version),
  PRIMARY KEY(release_id, window, entity_id, factor_id)
);

CREATE TABLE validation_results (
  validation_id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  outcome_series TEXT NOT NULL,
  test_type TEXT NOT NULL,
  horizon TEXT NOT NULL,
  result_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  methodology_version TEXT NOT NULL REFERENCES methodology_versions(methodology_version)
);

CREATE INDEX idx_structured_observed ON structured_observations(created_at);
CREATE INDEX idx_structured_entity ON structured_observations(entity_id, created_at);
CREATE INDEX idx_structured_category ON structured_observations(category_id, created_at);
CREATE INDEX idx_structured_duplicate ON structured_observations(duplicate_cluster_id);
