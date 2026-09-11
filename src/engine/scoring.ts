/**
 * Scoring.
 *
 * The blueprint asks for five reported dimensions plus an overall rank.
 * Penalties are capped so that a player who struggles and then gets there
 * still finishes with a real score — the game should reward persistence,
 * not punish it into the floor.
 */

import type {
  CaseProgress,
  Investigation,
  Rank,
  ScoreBreakdown,
  ScoringRules,
} from './types';

export function rankFor(total: number): Rank {
  if (total >= 100) return 'Legendary';
  if (total >= 90) return 'Master Investigator';
  if (total >= 80) return 'Senior Investigator';
  if (total >= 70) return 'Field Investigator';
  if (total >= 60) return 'Junior Investigator';
  return 'Probationary';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hintPenaltyTotal(progress: CaseProgress, rules: ScoringRules): number {
  let total = 0;
  for (const puzzle of Object.values(progress.puzzles)) {
    for (const level of puzzle.hintsUsed) {
      total += rules.hintPenalties[level] ?? 0;
    }
  }
  return total;
}

function wrongAnswerTotal(progress: CaseProgress, rules: ScoringRules): number {
  const attempts = Object.values(progress.puzzles).reduce(
    (sum, p) => sum + p.wrongAttempts,
    0,
  );
  return Math.min(attempts * rules.wrongAnswerPenalty, rules.wrongAnswerFloor);
}

/**
 * Accuracy: how cleanly the puzzles were solved.
 * A first-time-correct run is 100; each wrong attempt costs, with a floor
 * so that a hard-won solve is still worth having.
 */
function accuracyScore(progress: CaseProgress): number {
  const puzzles = Object.values(progress.puzzles);
  const solved = puzzles.filter((p) => p.solved).length;
  if (solved === 0) return 0;

  const wrong = puzzles.reduce((sum, p) => sum + p.wrongAttempts, 0);
  return clamp(100 - (wrong / solved) * 20, 30, 100);
}

/**
 * Reasoning: red herrings spotted, contradictions resolved, connections drawn.
 * Measured against what the case actually contains, so a case with no red
 * herrings does not penalise the player for failing to find one.
 */
function reasoningScore(
  progress: CaseProgress,
  investigation: Investigation,
): number {
  const herringsAvailable = investigation.evidence.filter(
    (e) => e.authoring?.redHerring,
  ).length;
  const contradictionsAvailable = investigation.evidence.filter(
    (e) => e.authoring?.unreliable,
  ).length;

  const herringsFound = investigation.evidence.filter(
    (e) => e.authoring?.redHerring && progress.evidenceStatus[e.id] === 'red-herring',
  ).length;
  const contradictionsFound = investigation.evidence.filter(
    (e) => e.authoring?.unreliable && progress.evidenceStatus[e.id] === 'contradicted',
  ).length;

  const available = herringsAvailable + contradictionsAvailable;
  if (available === 0) return 100;

  const found = herringsFound + contradictionsFound;
  const base = (found / available) * 100;

  // Drawing connections is credited, but cannot carry the score alone.
  const connections = progress.links.filter((l) => l.playerMade).length;
  return clamp(base + Math.min(connections * 2, 10), 0, 100);
}

/** Research: proportion of research steps answered without revealing. */
function researchScore(
  progress: CaseProgress,
  investigation: Investigation,
): number {
  const researchPuzzles = investigation.puzzles.filter((p) => p.researchRequired);
  if (researchPuzzles.length === 0) return 100;

  let score = 0;
  for (const puzzle of researchPuzzles) {
    const state = progress.puzzles[puzzle.id];
    if (!state?.solved) continue;
    score += state.hintsUsed.includes('reveal') ? 40 : 100;
  }
  return clamp(score / researchPuzzles.length, 0, 100);
}

/** Efficiency: time against par, plus restraint with hints. */
function efficiencyScore(
  progress: CaseProgress,
  rules: ScoringRules,
  timeSeconds: number,
): number {
  const ratio = timeSeconds / rules.parTimeSeconds;
  const timePart = ratio <= 1 ? 100 : clamp(100 - (ratio - 1) * 40, 40, 100);

  const hintCount = Object.values(progress.puzzles).reduce(
    (sum, p) => sum + p.hintsUsed.length,
    0,
  );
  return clamp(timePart - hintCount * 5, 0, 100);
}

export function scoreCase(
  progress: CaseProgress,
  investigation: Investigation,
  now: number = Date.now(),
): ScoreBreakdown {
  const rules = investigation.caseFile.scoring;
  const endedAt = progress.completedAt ?? now;
  const timeSeconds = Math.max(0, Math.round((endedAt - progress.startedAt) / 1000));

  const accuracy = accuracyScore(progress);
  const reasoning = reasoningScore(progress, investigation);
  const research = researchScore(progress, investigation);
  const efficiency = efficiencyScore(progress, rules, timeSeconds);

  const hintPenalty = hintPenaltyTotal(progress, rules);
  const wrongAnswerPenalty = wrongAnswerTotal(progress, rules);

  let bonuses = 0;
  const herringsFound = investigation.evidence.filter(
    (e) => e.authoring?.redHerring && progress.evidenceStatus[e.id] === 'red-herring',
  ).length;
  const contradictionsFound = investigation.evidence.filter(
    (e) => e.authoring?.unreliable && progress.evidenceStatus[e.id] === 'contradicted',
  ).length;
  if (herringsFound > 0) bonuses += rules.redHerringBonus;
  if (contradictionsFound > 0) bonuses += rules.contradictionBonus;
  if (progress.links.some((l) => l.playerMade)) bonuses += rules.connectionBonus;
  if (timeSeconds <= rules.parTimeSeconds) bonuses += rules.timeBonusMax;

  // The four dimensions average to the working score, then bonuses and
  // penalties apply. Capped at the base so 100 stays the ceiling.
  const core = (accuracy + reasoning + research + efficiency) / 4;
  const total = clamp(
    Math.round(core + bonuses - hintPenalty - wrongAnswerPenalty),
    0,
    rules.base,
  );

  return {
    total,
    accuracy: Math.round(accuracy),
    reasoning: Math.round(reasoning),
    research: Math.round(research),
    efficiency: Math.round(efficiency),
    timeSeconds,
    hintPenalty,
    wrongAnswerPenalty,
    bonuses,
    rank: rankFor(total),
  };
}

/** Live percentage for the top bar, before the case is submitted. */
export function completionPercent(
  progress: CaseProgress,
  investigation: Investigation,
): number {
  const total = investigation.puzzles.length;
  if (total === 0) return 0;
  const solved = Object.values(progress.puzzles).filter((p) => p.solved).length;
  return Math.round((solved / total) * 100);
}
