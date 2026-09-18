# AI Power Index: monthly ranked series

## Authority

Mike approved the 50-company 2026 / 2027 / 2030 ranked edition on September 18, 2026 and directed monthly updates under the same methodology. This supersedes the v2 pilot's no-composite policy for this new series. Research informs exmxc editorial judgments; do not turn missing disclosure into a blanket abstention rule. Preserve the original Four Forces: Compute, Interface, Alignment, Energy.

Methodology `ai-power-rankings-1.0.0` is locked. Its formula, five-point input steps, anchors, entity boundaries, rounding, and tie-breaks remain fixed. The ranked series starts here; do not splice legacy exposure rankings or v2 pilot grades into its history.

## Architecture

- Canonical source: this repository, `data/ai_power_rankings/`.
- `methodology.json`: fixed scoring constitution.
- `editions/YYYY-MM-DD.json`: immutable dated research judgments, all 600 force scores, source notes, central forecasts, and reconsideration conditions.
- `manifest.json`: chronological edition ledger, hashes, and latest pointer.
- `lib/ai-power-rankings.js`: single score/rank implementation for REST, MCP, and the Webflow generator.
- Public data: `https://mcp.exmxc.ai/ai-power/rankings?edition=2026-09-18&year=2030`.
- Edition ledger: `/ai-power/rankings/editions`; fixed method: `/ai-power/rankings/methodology`.
- MCP: `ex.ai_power.rankings.get`, optional `edition` and `year` arguments.
- Webflow: `https://www.exmxc.ai/ai-power-index` `/ai-power-index-methodology`, and `/power-lens`.

The Webflow HTML includes the complete latest table. A small browser script sorts the existing rows and retrieves archived editions. No iframe, framework, runtime model calls, paid API, or database is needed. Without JavaScript or network access, the saved table remains readable. With JavaScript, URLs retain the requested edition and sorting year.

## Monthly procedure

1. Read the current GitHub edition, method, and ledger. Research current primary disclosures. Reassess the same 50-company cohort, keeping stable company IDs and the named years 2026, 2027, 2030. Separate current deployments from announcements. Keep company ownership boundaries current and explicit.
2. Create a new edition file. Record the actual research cutoff and target dates, source access/publication labels, each force judgment, a company thesis, and what would change it. Add a concise `change_note` explaining meaningful changes. Distinguish a changed view of a fixed forecast horizon from elapsed time. Do not automatically advance the target years. Completed-year assessments remain historical; never substitute a later current assessment for an earlier year.
3. Preserve old edition bytes. Corrections use a new `-rN` edition with `supersedes` and `correction_reason`; keep the original address. No fictitious monthly history. Cohort changes require an explicit membership note and authorization; do not silently replace an acquired company or double count its assets.
4. Append a ledger entry with the new file's SHA-256 hash and point `latest` to it. Keep the methodology hash unchanged. Run `npm run build:ai-power-rankings`; it generates the edition imports and all six Webflow code blocks from the same source.
5. Run `npm test`, `npm run test:workers`, `npm run validate:json`, `npm run validate:webflow`, `npm run lint`, `npm run registry:check`, and `npm run deploy:dry-run`. Update build metadata and regenerate `node scripts/build-registry-packet.mjs` when releasing. Verify all three year sorts, edition selection, an unavailable-edition failure, mobile scrolling, static table readability, and displayed/API agreement.
6. Commit and open a pull request. Merge only after its checks pass, respecting current user authorization. Main deploys the data service. Verify the published data before updating Webflow.
7. Read current page code before changing it. Replace only the index, methodology, and Power Lens page head/footer blocks with the generated files, preserving site-wide code and unrelated pages. Update matching SEO/OG settings. Publish the scoped pages where supported. Verify public HTML, all three sorts, edition history, and metadata.
8. Report the dated edition, largest changes, and public link. Monthly reviews are scheduled for the 18th, beginning October 18, 2026, in America/Los_Angeles.

## Webflow identifiers

- Site: `68bf4541648aa50f5744573f`
- Index page: `6aa494125624023334f8b483`
- Methodology page: `6aa49413993a9a6b0fbd7c07`
- Power Lens page: `6a5bc61c8865bd19d1301203`

Reconfirm these through the connector when resuming. Power Lens now presents the ranked series. Legacy v2 API profiles remain historical and do not feed the public profile page. No scheduled paid model assessment is needed for rendering or sorting.

## Validation boundary

Tests prove faithful arithmetic, complete ranks, baseline preservation, and interface behavior. They do not claim the editorial forecasts are empirically validated. Company sources support premises; the force scores are exmxc judgments.

## Company profiles

Power Lens uses the same edition as the index, including all force scores, thesis, research premise, sources, and reconsideration condition. Index company links retain the selected edition. Profile links use `/power-lens?company=<stable-id>&edition=<edition-id>`. The browser derives the forecast movement text from stored scores; it does not invent a second forecast or rerank companies.

The generated head embeds a compact complete snapshot for all 50 companies; the footer includes a readable first profile and shared browser renderer. Both blocks must be published together and stay below Webflow's 50,000-character limit. The build enforces those limits. JSON is escaped for safe embedding. The saved edition works if the data service is unavailable. Archive requests are checked and failures retain a clearly labeled saved profile. Monthly history loads dated snapshots and never fabricates a prior month.

After a monthly build, publish all six generated blocks and test an index company link, company switching, edition preservation, the four-force table, and monthly history. Updating this runbook extends the existing monthly automation; do not create a duplicate schedule.
