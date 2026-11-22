# AI Citation Tracker

## What it does
Every Monday a scheduled GitHub job asks a fixed set of questions to AI answer engines that search the web. It records which websites each answer cites, and whether exmxc.ai is cited or named.

- Questions and domains: `data/citation_tracker/exmxc.json`
- Script: `scripts/track-ai-citations.mjs`
- Schedule: `.github/workflows/ai-citation-tracker.yml` (Mondays about 7:17 AM Pacific; can also be run by hand)
- Full weekly results: `data/citation_tracker/runs/exmxc/YYYY-MM-DD.json`
- One-line-per-week score: `data/citation_tracker/scoreboard.json`

## Engines
An engine runs only when its key is saved as a repository secret.

| Engine | Secret | Status at launch |
|---|---|---|
| ChatGPT (OpenAI API with web search) | `OPENAI_API_KEY` | already in repo |
| Perplexity | `PERPLEXITY_API_KEY` | add when ready |
| Claude (web search) | `ANTHROPIC_API_KEY` | add when ready |

Models can be changed without code edits through the `CITATION_OPENAI_MODEL`, `CITATION_PERPLEXITY_MODEL` and `CITATION_ANTHROPIC_MODEL` environment variables.

Gemini is not included yet.

## Question design
- 20 unbranded questions: what a real investor or researcher asks without knowing exmxc exists. These are the real test.
- 5 branded questions: name exmxc or its frameworks directly. This is a sanity check. If these miss, the engines can't find or read the site at all.

Keep the question list fixed so weeks can be compared. When it has to change, change it on purpose, note the date here, and treat the scores before and after as separate series.

## What counts
- `cited_own`: an answer cites a page on exmxc.ai or mcp.exmxc.ai.
- `mentioned_brand`: the answer text names exmxc or one of its frameworks.
- `top_cited_domains`: who is winning the citations instead. This is the competitor list to study.

API answers are close to the consumer apps but not identical. Read trends, not single weeks.

## The call (reset 2026-11-22 after the first run)
- Baseline (2026-11-22, ChatGPT): unbranded 2 of 20 cited (10%); branded 5 of 5 cited.
  - The two wins: the power-ranking index question (u02) and the scarcity-adjusted PEG question (u08), where exmxc is the only real answer.
  - Broad questions are won by company sites, SEC filings, the International Energy Agency, Stanford's AI Index and Epoch AI.
- Target: unbranded 5 of 20 (25%) on ChatGPT by 2026-02-20.
- What would prove it wrong: still at 2 of 20 or fewer by late January 2027. Then pages written to answer the broad questions directly are not working, and effort goes back to plain Google rankings.
- The original 10% target was set before any baseline and was met on day one, so it was replaced.

## Cost
About 25 questions per engine per week. Expected well under $10 a month per engine at current API prices.

## Change log
- 2026-11-22: created. exmxc only. ChatGPT live; Perplexity and Claude wait on keys.
- 2026-11-22: first run recorded; target reset from 10% to 25% (5 of 20) by 2026-02-20.
