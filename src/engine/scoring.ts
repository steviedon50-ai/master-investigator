/**
 * Scoring.
 *
 * Five reported dimensions plus an overall rank. Two principles:
 *
 * 1. The dimensions must discriminate. A dimension that reads 100 for every
 *    competent run tells the player nothing.
 * 2. Rank is capped by difficulty. Legendary is not available on a tutorial —
 *    if the top rank were reachable at Apprentice it would mean nothing at Black.
 */

import type {
  CaseProgress,
  Difficulty,
  Investigation,
  Rank,
  ScoreBreakdown,
  ScoringRules,
} from './types';

/**
 * The best rank each difficulty can award. A perfect Apprentice run is a
 * Field Investigator — good work, but the ladder continues.
 */
const RANK_CEILING: Record<Difficulty, Rank> = {
  apprentice: 'Field Investigator',
  investigator: 'Senior Investigator',
  expert: 'Master Investigator',
  master: 'Legendary',
  black: 'Legendary',
};

const RANK_ORDER: Rank[] = [
  'Probationary',
  'Junior Investigator',
  'Field Investigator',
  'Senior Investigator',
  'Master Investigator',
  'Legendary',
];

function rankFromScore(total: number): Rank {
  if (total >= 100) return 'Legendary';
  if (total >= 90) return 'Master Investigator';
  if (total >= 80) return 'Senior Investigator';
  if (total >= 70) return 'Field Investigator';
  if (total >= 60) return 'Junior Investigator';
  return 'Probationary';
}

export function rankFor(total: number, difficulty: Difficulty = 'master'): Rank {
  const earned = rankFromScore(total);
  const ceiling = RANK_CEILING[difficulty];
  return RANK_ORDER.indexOf(earned) > RANK_ORDER.indexOf(ceiling) ? ceiling : earned;
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
 * Accuracy. A flawless run scores 100; each wrong attempt costs steeply,
 * because on an Apprentice case the answers are reachable without guessing.
 */
function accuracyScore(progress: CaseProgress): number {
  const puzzles = Object.values(progress.puzzles);
  const solved = puzzles.filter((p) => p.solved).length;
  if (solved === 0) return 0;

  const wrong = puzzles.reduce((sum, p) => sum + p.wrongAttempts, 0);
  return clamp(100 - (wrong / solved) * 30, 20, 100);
}

/**
 * Reasoning. Finding the planted red herring and contradiction is the floor,
 * not the ceiling — those are handed to you by the puzzle. The upper range is
 * reserved for judgements the player made unprompted: evidence they marked
 * themselves, connections they drew.
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

  const found = investigation.evidence.filter(
    (e) =>
      (e.authoring?.redHerring && progress.evidenceStatus[e.id] === 'red-herring') ||
      (e.authoring?.unreliable && progress.evidenceStatus[e.id] === 'contradicted'),
  ).length;

  const available = herringsAvailable + contradictionsAvailable;
  const base = available === 0 ? 75 : (found / available) * 75;

  // The last quarter has to be earned by your own analysis.
  const connections = progress.links.filter((l) => l.playerMade).length;
  const notes = progress.notes.length;

  const ownWork = Math.min(connections * 8, 15) + Math.min(notes * 3, 10);

  return clamp(base + ownWork, 0, 100);
}

/** Research: proportion answered without a strong hint or a reveal. */
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
    if (state.hintsUsed.includes('reveal')) score += 25;
    else if (state.hintsUsed.includes('strong')) score += 55;
    else if (state.hintsUsed.includes('technique')) score += 80;
    else score += 100;
  }
  return clamp(score / researchPuzzles.length, 0, 100);
}

/**
 * Efficiency. Par earns a solid score; the top of the range needs a genuinely
 * fast run. Hints cost here as well as in the penalty, because using them is
 * the opposite of efficient.
 */
function efficiencyScore(
  progress: CaseProgress,
  rules: ScoringRules,
  timeSeconds: number,
): number {
  const ratio = timeSeconds / rules.parTimeSeconds;

  // Half par or better is exceptional; par is respectable; over par decays.
  let timePart: number;
  if (ratio <= 0.5) timePart = 100;
  else if (ratio <= 1) timePart = 100 - (ratio - 0.5) * 50;
  else timePart = clamp(75 - (ratio - 1) * 45, 25, 75);

  const hintCount = Object.values(progress.puzzles).reduce(
    (sum, p) => sum + p.hintsUsed.length,
    0,
  );
  return clamp(timePart - hintCount * 6, 0, 100);
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

  // Bonuses are small and specific — they mark what you did, not a general
  // reward for finishing.
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
    rank: rankFor(total, investigation.caseFile.difficulty),
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
