import methodology from '../data/ai_power_rankings/methodology.json' with { type: 'json' };
import manifest from '../data/ai_power_rankings/manifest.json' with { type: 'json' };
import { EDITIONS } from './ai-power-editions.js';

export const POWER_METHODOLOGY = methodology;
export const POWER_EDITIONS = manifest;
export function powerScore(forces) {
  const values = methodology.forces.map(key => forces[key]);
  if (values.some(v => !Number.isInteger(v) || v < 0 || v > 100 || v % 5)) throw new Error('Invalid Four Force scores');
  return Math.max(...values) / 2 + values.reduce((a, b) => a + b, 0) / 8;
}
export function comparePower(a, b, year) {
  const av = a.assessments[year], bv = b.assessments[year];
  const difference = powerScore(bv.forces) - powerScore(av.forces);
  if (difference) return difference;
  const aa = Object.values(av.forces).sort((x,y) => y-x);
  const bb = Object.values(bv.forces).sort((x,y) => y-x);
  for (let i=0; i<4; i++) if (aa[i] !== bb[i]) return bb[i]-aa[i];
  const an = a.company.toLowerCase(), bn = b.company.toLowerCase();
  return an < bn ? -1 : an > bn ? 1 : 0;
}
export function getPowerRankings({ edition = manifest.latest, year = '2026' } = {}) {
  const snapshot = EDITIONS[edition];
  if (!snapshot) return { success: false, status: 404, error: 'Unknown edition' };
  if (!snapshot.years.map(String).includes(String(year))) return { success: false, status: 400, error: 'Year must be 2026, 2027, or 2030' };
  const rows = snapshot.rows.map(row => ({ ...row, assessments: structuredClone(row.assessments) }));
  for (const target of snapshot.years) {
    [...rows].sort((a,b) => comparePower(a,b,target)).forEach((row,i) => {
      const value = row.assessments[target];
      value.score_unrounded = powerScore(value.forces);
      value.score = Math.round(value.score_unrounded * 10) / 10;
      value.rank = i + 1;
    });
  }
  rows.sort((a,b) => a.assessments[year].rank - b.assessments[year].rank);
  return { ...snapshot, sorted_by_year: Number(year), assessment_type: methodology.assessment_type, rows };
}
export const POWER_LATEST = getPowerRankings();
