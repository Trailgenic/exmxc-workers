# Agentic commerce signal: product direction

Status: design proposal, 2026-09-25. The legacy Consumer Intent Graph pilot remains a historical foundation, not evidence of agentic commerce. No observations or directional readings have been promoted from that pilot.

## Research question

Where is AI entering the consumer purchase journey, for which products and merchants, with what degree of delegated authority, and what do people report about the experience?

The primary unit is an **AI-mediated shopping episode** with an explicit link between a consumer, an AI tool, a shopping task, and an outcome. A generic brand purchase, retail review, search for a brand, or mention of AI without a shopping task does not qualify.

## Separate constructs

| Construct | Required evidence | Permitted claim |
| --- | --- | --- |
| AI shopping use | First-person report or instrumented event naming an AI tool and a shopping task | An observed use in the covered source; prevalence only with a representative denominator |
| Shopping task | Research, comparison, recommendation, deal finding, cart preparation, checkout, or post-purchase help | Which task was described, without assuming a transaction |
| Delegation | Consumer asked, AI suggested, AI prepared an action, consumer approved, or AI executed with prior authorization | Degree of autonomy actually supported by the evidence |
| Product and merchant | Explicit category, product, brand, and merchant references with unresolved states | What the episode concerned; never infer items from a platform announcement |
| Outcome | Considering, clicked through, added to cart, purchased, abandoned, returned, or unknown | The reported or instrumented result; an AI referral is not itself a sale |
| Experience | Explicit satisfaction, usefulness, trust, accuracy, price confidence, privacy, control, disclosure, friction, or failure | A classified account of an experience, not general consumer sentiment |

Store `platform`, `source_type`, `event_date`, `geo`, `evidence_type` (self-report, survey, referral analytics, transaction), `quote_or_reference`, `source_url`, `consent_or_access_basis`, and `classification_confidence`. Keep tool identity and merchant identity separate. Deduplicate reposts and distinguish retailer marketing, product announcements, sponsored content, and real consumer episodes.

## Source lanes and what they can prove

| Source | Free usable path | Role and limitation |
| --- | --- | --- |
| [Adobe Digital Insights AI traffic research](https://business.adobe.com/resources/sdk/.2026-q2-ai-traffic-report/q2-2026-adi-ai-sourced-traffic-insights.pdf) and its published consumer survey | Public reports and aggregates | Adoption and referral benchmarks; published aggregates cannot reveal individual prompts, products bought, or merchant-level conversions. |
| [Adobe 2026 consumer report](https://business.adobe.com/resources/digital-trends-consumer-report.html) | Public report | Survey context for research use, trust, and autonomy; record sample, wording, field dates, and geography before comparing periods. |
| [Google Trends](https://trends.google.com/trends/) | Public charts and CSV exports | Search interest in explicit AI-shopping terms, as a contextual discovery signal. It is sampled, normalized search share, not the count of AI shoppers or agent purchases. The automated [Trends API](https://developers.google.com/search/apis/trends) is limited-access alpha; do not depend on it for the production feed. |
| Public first-person accounts and reviews where access terms permit | Source-specific permission and stable individual URLs | Qualitative tasks, product categories, experiences, and failures; self-selected anecdotes, not prevalence. No open-ended scraping or assumed free commercial API access. |
| Merchant or agent referral / checkout telemetry | Only with an explicit data-sharing agreement | Stronger click, cart, and transaction evidence with proper consent and definitions. Until available, label purchase outcomes self-reported and do not claim agent-attributed GMV. |

Platform feature announcements (for example [ChatGPT shopping research](https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt) and [Google's shopping agents](https://blog.google/products-and-platforms/products/shopping/google-shopping-cart/)) define available capabilities and ecosystem changes, not consumer adoption.

## Publication rules

1. Do not compute an overall sentiment or adoption index from unlike sources. Show survey estimates, search interest, referral analytics, and episode classifications in distinct panels with dates and denominators.
2. Attribute a product category to AI-assisted shopping only when the source explicitly joins the tool, task, and category in one episode or in a survey question measuring that relationship.
3. Label `agent purchase` only for evidence of actual delegated checkout. Research and recommendation are `AI-assisted shopping`, even if the person later purchased independently.
4. Do not treat positive sentiment toward a product as positive sentiment toward shopping with AI. The sentiment target must be the AI shopping experience.
5. Use publication gates by evidence type and category; show `insufficient evidence` when coverage, source diversity, dates, or outcome verification fail.

## Migration

Keep `consumer_intent_v1` immutable as the audit trail. Build a versioned agentic-commerce ontology and a small historical baseline from published, methodologically described reports. Then pilot narrow, permitted first-person episode collection; measure acceptance and category coverage before scheduling it. The public surface should be relabeled around AI-mediated commerce only after the new evidence and release contract pass review.
