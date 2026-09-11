# Entity Clarity v2 Pilot Methodology

Status: experimental, uncollected panel · 11 September 2026

## Purpose

This pilot tests whether exmxc can produce reproducible, evidence-backed Entity Clarity profiles without turning collection failures, missing evidence, or unrun model tests into low scores. It is a methodology-development panel, not a current ranking or representative industry estimate.

The pilot keeps four report panels separate:

1. Collector delivery and declared access policy.
2. Reviewed identity clarity.
3. Reviewed evidence quality.
4. Observed model representation, when independently tested.

## Panel design

The scaffold contains 50 entities: five from each of ten industries. Within each industry, the July 30 legacy ECI snapshot supplies two Open, two Defensive, and one Blocked stratum. Those old labels are sampling strata only. They are not accepted as verified current policy or truth.

Twenty profiles are predesignated for independent double review: the first two entries in each industry. Target domains are deliberately null until a reviewer confirms the canonical public domain and entity relationship. This prevents guessed URLs from entering the observation record.

## Nine review checks

Each applicable check uses 0 = absent or contradicted, 1 = partial or ambiguous, 2 = clear and supported. An assessed check requires evidence. `unassessable` remains unknown. `not_applicable` requires a reason and makes the profile non-comparable in the pilot.

### Identity

- Entity and domain resolve correctly.
- Offering and institutional scope are clear.
- Parent, brand, product, and person relationships are correct.

### Consistency

- Material identity claims agree across sampled surfaces.
- Canonical identifiers, structured data, and visible content agree.
- Official external identity records resolve to the same entity.

### Evidence

- Material claims have traceable support.
- Sources expose relevant authorship, date, and method.
- Independently checkable claims have appropriate corroboration.

Only nine fully assessed checks produce an experimental comparable score: `100 × points / 18`. The score is a transparent review convention. It is not a probability of model trust, citation, recommendation, or correctness. No High/Medium/Low bands are assigned during calibration.

## Collection protocol

1. Verify the canonical entity and public HTTPS target; record reviewer and timestamp.
2. Collect the homepage and robots document with the identified static collector. Preserve declared provider-purpose rules from observed delivery.
3. Preserve request/final URLs, redirect chain, status, content type, relevant directives, collector version, collection timestamp, and error details. Do not store credentials, cookies, or unnecessary personal data.
4. Select and verify additional surfaces before collection. Use bounded surfaces defined before scoring; do not add favorable pages after seeing results.
5. Review the nine checks against cited evidence. Keep machine extraction and human judgment distinguishable.
6. Run model-answer tests only through the separate fixed protocol. Record product/model/search state, exact prompt, repetition, raw answer, and checked citations.
7. Adjudicate the 20 double-reviewed profiles. Report agreement and disagreements before expanding the panel.

## Access interpretation

Training, search, user-requested retrieval, and general AI-use controls remain provider-specific. Robots policy, collector delivery, and verified provider requests are separate evidence layers. HTTP failure is never sufficient evidence of corporate strategy.

## Completion gates

A profile is complete only when its target is verified, raw evidence is preserved, nine review checks have evidence, reviewer identity is recorded, and exceptions are explained. A model panel may say `not_tested`; this does not block the structural review and does not count as zero.

The pilot can expand only after collection-repeatability tests pass, double-review disagreements are documented, and methodology changes are separated from entity changes. Historical ECI observations remain unchanged and continue to identify their original methodology.
