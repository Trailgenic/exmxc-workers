# AI Power Index v2.0 Pilot Run Log

This log records non-publishing methodology diagnostics. Candidate artifacts remain private GitHub Actions artifacts and are not public AI Power assessments.

## Cohort diagnostics

| Run | Source mode | Attempt evidence | Attempt grades | Repeated evidence | Consensus grades | Tokens | Estimated standard cost |
|---|---|---:|---:|---:|---:|---:|---:|
| [Cohort 1](https://github.com/Trailgenic/exmxc-workers/actions/runs/34669229072) | Live collection per attempt | 89 / 94 | 2 / 2 | 14 | 0 | 1,130,454 | $0.46 |
| [Cohort 2](https://github.com/Trailgenic/exmxc-workers/actions/runs/34671408259) | One immutable snapshot | 108 / 87 | 3 / 2 | 45 | 0 | 1,140,352 | $0.47 |
| [Calibration 1](https://github.com/Trailgenic/exmxc-workers/actions/runs/34998172781) | One immutable four-entity snapshot | 24 / 25 | 8 / 8 | 13 | 3 | 270,831 | $0.11 |
| [Calibration 2](https://github.com/Trailgenic/exmxc-workers/actions/runs/35001146991) | One immutable four-entity deterministic-passage snapshot | 26 / 28 | 6 / 9 | 18 | 5 | 292,229 | $0.11 |\n| [Cohort 3](https://github.com/Trailgenic/exmxc-workers/actions/runs/35002407344) | One immutable 20-entity deterministic-passage snapshot | 71 / 81 | 15 / 12 | 46 | 8 | 1,291,337 | $0.46 |

All runs used `gpt-5.6-luna` with Medium reasoning, two model passes per entity per attempt, and no repository or public API writes. The cohort runs covered 20 entities; Calibration 1 was bounded to TSMC, NextEra Energy, Microsoft, and Anthropic. Cost estimates apply the September 12, 2026 short-context standard rates of $0.20 per million input tokens and $1.20 per million output tokens from [OpenAI API pricing](https://developers.openai.com/api/docs/pricing). Actual billing remains the account usage record.

## Findings

- The immutable snapshot correction increased repeated verified evidence from 14 to 45 records without relaxing claim identity or provenance rules.
- Cohort 2 retained only four records marked as anchor support in both attempts. Two TSMC records lacked current freshness. Two current NextEra Energy records came from one evidentiary origin. None passed all criterion and profile-wide gates.
- Proposed grades differed across attempts: Cohort 2 attempt A graded Microsoft Realized leverage and Anthropic Control and Durability; attempt B graded TSMC Realized leverage and Apple Control.
- One Cohort 2 Anthropic attempt exposed a criterion-scope assembler defect. The subsequent correction preserves verified contextual evidence and changes only the unsupported criterion to `unknown`.
- Zero consensus grades is a valid abstention result. It does not mean the entities have zero AI power; it means the current source packets and automated judgments did not establish repeatable anchored grades.

## Decision

Do not publish either candidate as a company assessment or ranking. Preserve the v1 compatibility surface unchanged. Before another full paid cohort, improve source selection for enforceable rights, switching constraints, mechanism-linked economics, and 24-month persistence, then validate the revised protocol on a small canary.

## Targeted calibration protocol

The next authorized run is bounded to TSMC, NextEra Energy, Microsoft, and Anthropic. Their manifests add dated issuer, filing, and counterparty evidence aimed at the exact failure modes observed in Cohort 2: current mechanism-linked economics, enforceable rights, substitution constraints, and forward durability.

The workflow must capture one immutable four-entity source snapshot before invoking a model, require two distinct delivered origins for every entity, run two `gpt-5.6-luna` Medium attempts against that same snapshot, and reconcile them with the unchanged conservative repeat policy. It writes no repository or public API state. A full 20-entity rerun remains unauthorized until this calibration demonstrates materially better repeatability without weakened evidence gates.

## Calibration 1 findings

- All 16 declared documents were delivered, both candidate attempts passed schema and semantic validation, and the reconciliation completed without repository or public API writes.
- NextEra Energy retained three Moderate-confidence consensus grades: Control 2, Realized leverage 2, and Durability 2. Substitution constraint remained unknown. Five evidence records repeated across the two attempts and the graded evidence spanned the Meta contract disclosure, Google agreement, and SEC-filed operating disclosure.
- Microsoft received Control 2, Substitution constraint 2, Realized leverage 2, and Durability 2 in both attempts. Reconciliation still withheld all four grades because only one current anchor-supporting origin repeated across the criteria; the profile-wide two-origin gate worked as designed.
- TSMC retained four repeated contextual records but no repeated anchor-supporting grade. Anthropic retained two repeated records, while the attempts disagreed on whether Durability 1 was supportable.

## Calibration 1 decision

Do not run the full 20-entity cohort yet and do not publish Calibration 1 as a company ranking. The improved packets demonstrate that stable automated judgments are possible, but one stable profile out of four is not sufficient evidence of cohort-scale reliability. The next pipeline change should give the model deterministic passage identifiers from each immutable source snapshot so repeat attempts select from the same candidate passages instead of regenerating quote boundaries. Evidence, freshness, source-diversity, primary-source, and abstention gates remain unchanged.

## Calibration 2 protocol

Calibration 2 keeps the same four entities, source manifests, `gpt-5.6-luna` Medium model configuration, two-attempt design, and non-publishing boundary. The only methodological change is evidence identity: snapshot v2 creates a deterministic passage catalog from each retained source, both model passes must cite supplied passage identifiers, and the assembler retrieves canonical locators and extracts from that catalog.

No scoring anchor or evidence gate changes. The full 20-entity cohort remains unauthorized unless Calibration 2 produces materially broader repeatability than Calibration 1 without reducing abstention discipline.

## Calibration 2 findings

- All 16 declared documents were delivered and deterministically segmented into 272 passages. Every one of the 72 evidence records across the two attempts and consensus used a canonical passage locator.
- Repeated evidence increased from 13 to 18 records, consensus grades increased from three to five, and profiles with at least one consensus grade increased from one to two without changing any anchor, freshness, source-diversity, primary-source, confidence, or abstention gate.
- NextEra Energy reproduced Control 2, Realized leverage 2, and Durability 2; Substitution constraint remained unknown.
- Anthropic retained Control 1 and Durability 2 from repeated anchor-supporting evidence across company and counterparty origins. Substitution constraint and Realized leverage remained unknown.
- TSMC retained five repeated passages, but freshness disagreement and attempt-level grade disagreement correctly withheld every grade. Microsoft retained six repeated passages, but neither attempt pair marked those repeated records as anchor support, so every grade remained unknown.

## Calibration 2 decision

The deterministic-passage correction produced materially broader repeatability while preserving abstention discipline. Authorize one full 20-entity, non-publishing Luna Medium cohort diagnostic against one immutable snapshot. The expansion is an evaluation of cross-cohort reliability, not authorization to publish company profiles or a ranking.


## Cohort 3 findings

- Fifty-eight of 64 declared documents were delivered. Every entity retained at least two distinct delivered origins, so all 20 passed the no-model eligibility gate. Snapshot v2 created 1,189 immutable passages.
- All 198 evidence records across both attempts and consensus used valid canonical passage locators. Forty-nine evidence identifiers repeated exactly across attempts; 46 survived the ordinary criterion-overlap consensus rule.
- Attempt-level grades increased to 15 and 12 from Cohort 2's three and two. Eight grades survived consensus across four partial profiles: Micron Realized leverage 1; Microsoft Control 2, Realized leverage 2, and Durability 2; Anthropic Control 1 and Durability 2; and NextEra Energy Control 2 and Durability 2.
- No profile was complete. Sixteen profiles remained insufficient evidence, and Substitution constraint was unknown for every entity. The system therefore produced no evidence-backed complete AI Power profile or publishable universal comparison.
- Cross-run stability remains inadequate even within the calibrated group. Microsoft moved from zero consensus grades in Calibration 2 to three in Cohort 3. NextEra Energy's previously repeated Realized-leverage grade moved from 2 to unknown because the Cohort 3 attempts selected grades 2 and 1. Anthropic's two grades repeated; TSMC remained fully unknown.

## Cohort 3 decision

Do not publish Cohort 3 as company profiles or a ranking, and do not spend on another unchanged model run. Deterministic passage identity fixed evidence-boundary instability but did not make the anchored judgments sufficiently repeatable. Preserve the artifact as a methodology diagnostic and keep the public v1 compatibility surface unchanged.

The next AI Power methodology build should add criterion-specific source adequacy before model calls, with explicit coverage for enforceable substitution constraints, and should reconcile passage-level criterion, support, and freshness labels before any anchored grade is proposed. A more expensive model or another identical run is not the recommended correction. Until that bounded v2.3 redesign is scheduled, table AI Power profile publication and continue the broader exmxc build.
