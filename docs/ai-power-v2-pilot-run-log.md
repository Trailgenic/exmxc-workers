# AI Power Index v2.0 Pilot Run Log

This log records non-publishing methodology diagnostics. Candidate artifacts remain private GitHub Actions artifacts and are not public AI Power assessments.

## Cohort diagnostics

| Run | Source mode | Attempt evidence | Attempt grades | Repeated evidence | Consensus grades | Tokens | Estimated standard cost |
|---|---|---:|---:|---:|---:|---:|---:|
| [Cohort 1](https://github.com/Trailgenic/exmxc-workers/actions/runs/34669229072) | Live collection per attempt | 89 / 94 | 2 / 2 | 14 | 0 | 1,130,454 | $0.46 |
| [Cohort 2](https://github.com/Trailgenic/exmxc-workers/actions/runs/34671408259) | One immutable snapshot | 108 / 87 | 3 / 2 | 45 | 0 | 1,140,352 | $0.47 |

Both runs used `gpt-5.6-luna` with Medium reasoning, two model passes per entity per attempt, 20 entities, 60 declared sources, and no repository or public API writes. Cost estimates apply the September 12, 2026 short-context standard rates of $0.20 per million input tokens and $1.20 per million output tokens from [OpenAI API pricing](https://developers.openai.com/api/docs/pricing). Actual billing remains the account usage record.

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
