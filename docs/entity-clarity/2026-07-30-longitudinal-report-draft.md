# Entity Clarity Longitudinal Report — January to July 2026

**How 744 institutions moved across AI-facing posture, capability, and clarity over 191 days**

**Status:** Editorial draft  
**Release date:** 2026-07-30  
**Baseline date:** 2026-01-20  
**Methodology:** `eci-ecc-v1`  
**Dataset:** `2.0.0`  
**Registered entities:** 745  
**Matched panel:** 744  

## Executive summary

The Entity Clarity Index moved modestly upward between January 20 and July 30,
2026, but the aggregate conceals a more consequential structural reshuffling.
Across the 744-entity matched panel, mean ECC increased from 51.26 to 52.43
(+1.17), while the median moved from 63 to 64.

Most institutions did not move: 435 entities were fully stable and another 95
showed only one-to-four-point drift. Yet 214 entities registered a meaningful
score or structural change. That includes 97 structural movers, 74 score
movers, 21 legibility entries, and 22 legibility exits.

The system therefore became somewhat more capable without becoming more open.
High-capability observations increased from 107 to 147, while Blocked
observations edged from 138 to 139. Open posture declined from 460 to 453 and
Defensive posture rose from 146 to 152.

The implication is not that institutions broadly “performed better.” It is
that AI-facing capability deepened inside a system whose access posture became
slightly more guarded.

## What the index measures

The Entity Clarity Index evaluates each institution on three related but
distinct dimensions:

- **Posture:** whether the evaluated AI pathway is Open, Defensive, or Blocked.
- **Capability:** whether the institution provides Low, Medium, or High
  machine-readable structure, verification, and actionability.
- **ECC:** a contextual 0–100 Entity Clarity & Capability score interpreted
  alongside posture and capability.

Blocked observations receive ECC 0 by definition. ECC is not a standalone
performance ranking, and changes should not be read as a judgment about
financial quality, operating performance, or institutional importance.

The Entity Engineering Index website audit is a separate measurement family.
EEI and ECI/ECC results are not interchangeable.

## The central finding: capability rose faster than openness

The clearest longitudinal shift was in capability. High capability expanded by
40 observations, from 107 to 147. Medium capability declined from 313 to 285,
and Low capability declined from 324 to 312.

Posture moved in the opposite direction. The matched panel recorded one more
Blocked entity, seven fewer Open entities, and six more Defensive entities.
There were 21 entries out of Blocked and 22 exits into Blocked.

This is a system becoming more technically legible while remaining
institutionally selective. The strategic distinction matters: capability
improves what an AI system can understand or do when access exists; posture
determines whether that access exists at all.

## Movement was broad, but not uniform

The 744-entity panel divides into six change classes:

| Change class | Entities | Share of panel |
|---|---:|---:|
| Stable | 435 | 58.5% |
| Drift | 95 | 12.8% |
| Score Mover | 74 | 9.9% |
| Structural Mover | 97 | 13.0% |
| Legibility Entry | 21 | 2.8% |
| Legibility Exit | 22 | 3.0% |

The largest positive changes were generally legibility entries: Frost &
Sullivan (+88), RealReal (+86), NDTV (+86), Goldman Sachs (+85), Mubadala
(+85), and Seagate Technology (+83).

The largest negative changes were generally legibility exits: Blackstone
(-91), Applied Materials (-91), Yelp (-86), Sky News (-86), Globant (-83), and
Willis Towers Watson (-80).

These extremes are discontinuities, not incremental score movement. A move
into or out of Blocked should be interpreted as a change in the evaluated
pathway's availability, not as an 80- or 90-point change in conventional
business performance.

## Industry patterns

Healthcare (+5.78 mean ECC), Artificial Intelligence (+5.91), Energy (+3.12),
Technology (+2.26), Education (+1.62), and Marketplace (+2.78) improved across
the matched panel.

Cloud & Data Infrastructure (-5.56), E-Commerce & Retail (-2.27), Government
(-1.65), Financial (-0.61), Fintech (-0.46), Consulting (-0.40), and Media
(-0.15) declined.

Small verticals should be read with appropriate caution. Sovereign Wealth
Funds posted the largest mean increase (+9.30), but the vertical contains only
10 entities and the result is materially influenced by Mubadala's move from
Blocked to Open/High.

The most structurally active large vertical was Media: 21 structural movers,
14 score movers, four legibility entries, and five exits across 100
organizations. Technology followed with 12 structural movers and a balanced
two entries and two exits across 84 companies. Education recorded three
entries and one exit across 100 universities.

## Capital allocation implications

Entity clarity is not a valuation signal by itself. It is an increasingly
important condition for discoverability, verification, distribution, and
machine-mediated action.

For capital allocators, the longitudinal signal is most useful in four ways:

1. **Access discontinuity:** A legibility entry or exit can change whether an
   entity is visible and actionable inside an AI-mediated workflow.
2. **Capability compounding:** Persistent movement from Low to Medium or High
   capability can expand distribution and reduce machine interpretation cost.
3. **Posture risk:** A shift from Open to Defensive may preserve capability
   while increasing friction, ambiguity, or dependence on controlled pathways.
4. **Verification priority:** Large movements deserve source-level review
   before they inform investment, partnership, diligence, or policy decisions.

The relevant question is not “who ranks highest?” It is “which institutions
are becoming structurally easier—or harder—for machines to identify,
understand, verify, and engage?”

## Data quality and coverage

The supplied workbook contained 747 rows and 744 unique entities. Three
duplicate rows were removed: Federal Reserve, European Central Bank, and Bank
for International Settlements each appeared in both Financial Infrastructure
and Government. The canonical Government classification was retained.

The name “Itaú Unibanco” was repaired from a source encoding error. Cornerstone
Research remains in the 745-entity registry but had no July observation, so it
is excluded from the matched panel. Current observation coverage is therefore
744 of 745 registered entities, or 99.87%.

The supplied posture, capability, and ECC change columns reconcile exactly
with the computed comparison after those corrections. No Blocked/Low/ECC 0
invariant violations were found.

## Publication policy

This release establishes the longitudinal publication model:

- Keep a stable entity registry with durable identifiers.
- Append dated observations; never overwrite prior snapshots.
- Compute changes from adjacent snapshots.
- Publish coverage, exclusions, methodology, and source corrections with every
  release.
- Keep the PDF as the authoritative editorial artifact.
- Expose the same release metadata and datasets through machine-readable
  endpoints.

Future vertical reports should be generated from the same release ledger and
published only when movement clears an editorial threshold: at least 20% of
the vertical is a meaningful mover, at least three legibility entries or exits
occur, or the vertical's mean ECC changes by at least three points.

