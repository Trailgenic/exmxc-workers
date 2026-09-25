import { createHash } from 'node:crypto';

const TERMS = ['ChatGPT shopping', 'AI shopping assistant'];

export function parseAiCommerceTrendsCsv(csv, { asOf, rawFile }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('A dated export is required.');
  const lines = csv.trim().split(/\r?\n/);
  if (lines[0] !== 'Category: All categories' || lines[1] !== '' ||
    lines[2] !== 'Week,ChatGPT shopping: (United States),AI shopping assistant: (United States)') {
    throw new Error('Google Trends CSV header or query terms changed.');
  }
  const points = lines.slice(3).map(line => {
    const match = /^(\d{4}-\d{2}-\d{2}),(\d{1,3}|<1),(\d{1,3}|<1)$/.exec(line);
    if (!match) throw new Error(`Invalid Google Trends row: ${line}`);
    if (match.includes('<1')) throw new Error('Suppressed low-volume values need explicit handling.');
    const [, week, left, right] = match;
    if (new Date(`${week}T00:00:00Z`).getUTCDay() !== 0 ||
      new Date(`${week}T00:00:00Z`).toISOString().slice(0, 10) !== week) throw new Error('Week must be a valid Sunday.');
    const values = [Number(left), Number(right)];
    if (values.some(value => value > 100)) throw new Error('Google Trends index must be 0–100.');
    return { week, values };
  });
  if (!points.length || points.some((point, index) => index &&
    Date.parse(`${point.week}T00:00:00Z`) - Date.parse(`${points[index - 1].week}T00:00:00Z`) !== 7 * 86400000)) {
    throw new Error('Weekly rows must be contiguous.');
  }
  const complete = points.filter(point => Date.parse(`${point.week}T00:00:00Z`) + 7 * 86400000 <= Date.parse(`${asOf}T00:00:00Z`));
  if (!complete.length) throw new Error('No completed weeks in export.');
  return {
    source: 'Google Trends',
    source_url: 'https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=ChatGPT%20shopping,AI%20shopping%20assistant',
    exported_on: asOf,
    raw_file: rawFile,
    raw_sha256: createHash('sha256').update(csv).digest('hex'),
    geography: 'US', search_type: 'Web Search', category: 'All categories',
    window: `Past 12 months as of ${asOf}`, interval: 'week',
    scale: 'Jointly normalized 0–100 search-interest index for these two terms and this query window; not search volume, shopper share, AI use, sentiment, or purchases. Different exports need not share a scale.',
    last_complete_week: complete.at(-1).week,
    excluded_incomplete_weeks: points.filter(point => !complete.includes(point)).map(point => point.week),
    series: TERMS.map((term, index) => ({ term, points: complete.map(point => ({ week: point.week, index: point.values[index] })) }))
  };
}
