/**
 * Case supply.
 *
 * The single place the app asks for a case. Case 000 is authored; everything
 * else is generated, validated, and regenerated on failure.
 *
 * Nothing reaches the player without passing the validator — that is the whole
 * point of generating and discarding rather than generating and hoping.
 */

import case000, { CASE_000_ID } from '../data/case000';
import { generateCase, GENERATOR_VERSION } from './generator';
import { validateCase } from './validator';
import type { Difficulty, Investigation, InvestigatorId } from './types';

/** Difficulty rises with case number. Deliberately gentle at the start. */
export function difficultyFor(caseNumber: number): Difficulty {
  if (caseNumber <= 3) return 'apprentice';
  if (caseNumber <= 8) return 'investigator';
  if (caseNumber <= 15) return 'expert';
  if (caseNumber <= 25) return 'master';
  return 'black';
}

export interface CaseResult {
  investigation: Investigation;
  attempts: number;
  /** True when every attempt failed and the case could not be built. */
  exhausted: boolean;
}

/**
 * Fetches a case for a player.
 *
 * Case 000 is the authored tutorial and identical for everyone. From 001 the
 * case is generated from the player's own seed, so two players at the same
 * number get different investigations.
 */
export function caseFor(
  investigatorId: InvestigatorId,
  caseNumber: number,
  maxAttempts = 25,
): CaseResult {
  if (caseNumber === 0) {
    return { investigation: case000, attempts: 1, exhausted: false };
  }

  const difficulty = difficultyFor(caseNumber);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateCase(
      {
        investigatorId,
        caseNumber,
        difficulty,
        generatorVersion: GENERATOR_VERSION,
      },
      attempt,
    );

    if (!candidate) continue;

    const report = validateCase(candidate);
    if (report.valid) {
      return { investigation: candidate, attempts: attempt + 1, exhausted: false };
    }
  }

  /*
   * Every attempt failed. Rather than ship something unsolvable, fall back to
   * the authored case and report it — a player replaying Case 000 is a poor
   * outcome, but a case that cannot be finished is worse.
   */
  return { investigation: case000, attempts: maxAttempts, exhausted: true };
}

export { CASE_000_ID };
