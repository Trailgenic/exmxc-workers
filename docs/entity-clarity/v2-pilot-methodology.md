# Automated Entity Clarity v2.1 Pilot Methodology

Status: experimental, uncollected panel · 11 September 2026

## Purpose

This pilot tests whether exmxc can produce reproducible, evidence-backed Entity Clarity scores at batch scale without human review. It is a methodology-development panel, not a current ranking or representative industry estimate.

The contract keeps four observations separate:

1. Whether the collector received usable homepage HTML.
2. What provider-purpose access rules the site declares.
3. The automated Entity Clarity score derived from that HTML.
4. Observed model representation, only when a separate model test is run.

Collection failures, access restrictions, and unsupported content are unassessable. They never become zero Entity Clarity scores. Declared access posture never changes the Entity Clarity score.

## Minimum automated scorecard

The score uses 20 binary signals across five weighted dimensions:

| Dimension | Weight | Evidence tested |
| --- | ---: | --- |
| Identity resolution | 25 | Title, primary heading, named entity schema, discoverable institutional page |
| Entity consistency | 25 | Canonical origin, Open Graph origin, schema identifier origin, visible/structured name agreement |
| Relationship clarity | 15 | External identity references, organizational relationships, recognized identity-profile link |
| Evidence traceability | 15 | Description, about/company link, contact/help link, standards/newsroom/governance/legal link |
| Machine legibility | 20 | Language, canonical, valid JSON-LD, Open Graph identity, indexability |

Each signal contributes its published points when present and zero when absent. A delivered, non-empty HTML homepage measures all five dimensions and produces a 0–100 score. No High/Medium/Low bands are assigned during the pilot.

The score means only: structural identity clarity observed in delivered static homepage HTML. It is not a probability of model trust, citation, recommendation, factual correctness, or corporate intent. It does not grade writing quality or the truth of claims.

## Panel design

The scaffold contains 50 entities: five from each of ten industries. Within each industry, the July 30 legacy ECI snapshot supplies two Open, two Defensive, and one Blocked stratum. Those labels diversify test cases only; they are not accepted as verified current policy or truth.

Twenty profiles are predesignated for repeat collection. Repeat runs test score stability without requiring a person to inspect every result. Target URLs remain null until they can be populated by a deterministic canonical-domain source; ambiguous targets must remain excluded rather than guessed.

## Collection protocol

1. Resolve targets from a versioned canonical-domain source using stable entity identifiers.
2. Collect the homepage and robots document with the identified static collector.
3. Preserve request and final URLs, redirect chain, status, content type, directives, collector version, timestamp, content hash, and bounded error details.
4. Extract the published homepage signals and compute the five dimensions deterministically.
5. Preserve missing signals as absent only after usable HTML is delivered. Preserve collection failures as unassessable.
6. Repeat the designated 20 collections and report score changes alongside content hashes and delivery changes.
7. Run model-answer tests only through the separate fixed protocol. Model-test status never changes this structural score.

## Access interpretation

Training, search, user-requested retrieval, and general AI-use controls remain provider-specific. Robots policy, collector delivery, and verified provider requests are separate evidence layers. HTTP failure is never sufficient evidence of corporate strategy.

## Expansion gates

A scored profile requires delivered, non-empty HTML, a complete evidence object, all five computed dimensions, the methodology version, and collection provenance. A model panel may say `not_tested`; this does not block the automated structural score and does not count as zero.

The pilot can expand only after repeat-collection stability is published, target resolution is deterministic, schema validation passes, and methodology changes remain distinguishable from entity changes. Historical ECI observations remain unchanged under their original methodology.
