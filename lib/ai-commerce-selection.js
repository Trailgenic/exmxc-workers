export function summarizeSelectionPilot(panel) {
  const errors = [];
  const ids = new Set(), cells = new Map();
  if (panel.status !== 'method_validation' || panel.representative !== false) errors.push('Selection pilot must declare nonrepresentative method validation.');
  if (new Set(panel.intents.map(row => row.intent_id)).size !== panel.intents.length) errors.push('Intent IDs must be unique.');
  for (const row of panel.attempts) {
    if (ids.has(row.attempt_id)) errors.push(`Repeated attempt ${row.attempt_id}.`);
    ids.add(row.attempt_id);
    if (!panel.intents.some(intent => intent.intent_id === row.intent_id)) errors.push(`Unknown intent ${row.intent_id}.`);
    if (!['ChatGPT', 'Gemini'].includes(row.surface)) errors.push('Unknown app surface.');
    if (!['single', 'joint', 'abstained', 'unranked', 'contradictory', 'technical_failure'].includes(row.outcome)) errors.push('Unknown outcome.');
    if (row.outcome === 'single' && (!row.selection?.brand || !row.selection?.product || row.turns_completed !== 2)) errors.push(`Incomplete selection ${row.attempt_id}.`);
    if (row.outcome !== 'single' && row.selection !== null) errors.push(`Non-selection credited to ${row.attempt_id}.`);
    if (row.outcome === 'technical_failure' && row.turns_completed !== 0) errors.push(`Failure has completed turns: ${row.attempt_id}.`);
    if (row.outcome === 'contradictory' && row.turns_completed !== 2) errors.push(`Contradiction lacks final answer: ${row.attempt_id}.`);
    if (!/^[0-9a-f]{64}$/.test(row.raw_capture_sha256)) errors.push(`Raw capture digest missing: ${row.attempt_id}.`);
    const key = `${row.intent_id}|${row.surface}`;
    cells.set(key, [...(cells.get(key) || []), row]);
  }
  if (cells.size !== panel.intents.length * 2) errors.push('Every intent needs an attempt on each declared app surface.');
  const cell_outcomes = [];
  for (const intent of panel.intents) for (const surface of ['ChatGPT', 'Gemini']) {
    const attempts = (cells.get(`${intent.intent_id}|${surface}`) || []).sort((a, b) => a.attempt_number - b.attempt_number);
    if (!attempts.length || attempts[0]?.attempt_number !== 1 || attempts.some((row, index) => row.attempt_number !== index + 1)) errors.push(`Nonconsecutive attempts for ${intent.intent_id}/${surface}.`);
    const completed = attempts.find(row => row.turns_completed === 2);
    cell_outcomes.push({ intent_id: intent.intent_id, surface, attempt_ids: attempts.map(row => row.attempt_id), outcome: completed?.outcome || 'technical_failure', primary_selection: completed?.selection || null });
  }
  if (errors.length) throw new Error(errors.join(' '));
  const count = outcome => panel.attempts.filter(row => row.outcome === outcome).length;
  const summary = {
    original_app_intent_cells: cell_outcomes.length,
    physical_attempts: panel.attempts.length,
    retry_attempts: panel.attempts.filter(row => row.attempt_number > 1).length,
    completed_two_turn_attempts: panel.attempts.filter(row => row.turns_completed === 2).length,
    clean_single_attempts: count('single'), contradictory_attempts: count('contradictory'),
    technical_failure_attempts: count('technical_failure'),
    clean_selection_cells: cell_outcomes.filter(row => row.outcome === 'single').length,
    contradictory_cells: cell_outcomes.filter(row => row.outcome === 'contradictory').length,
    unresolved_failure_cells: cell_outcomes.filter(row => row.outcome === 'technical_failure').length,
    selection_share: null,
    cell_outcomes
  };
  return { ...panel, summary };
}
