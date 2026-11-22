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

## The call (set 2026-11-22)
- Baseline: the first run.
- Target: unbranded citation rate on ChatGPT at 10% or more within 90 days.
- What would prove it wrong: after 60 days, below 5% with no upward trend despite content changes. Then AI-citation work is not worth the effort at our scale, and effort goes back to plain Google rankings.

## Cost
About 25 questions per engine per week. Expected well under $10 a month per engine at current API prices.

## Change log
- 2026-11-22: created. exmxc only. ChatGPT live; Perplexity and Claude wait on keys.
