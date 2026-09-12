/**
 * Which case the player is on.
 *
 * Kept apart from case progress: progress is per-case and disposable, the
 * journey is the player's path through them and outlives any single case.
 */

import { localAdapter } from './storage';
import { createInvestigatorId } from '../engine/rng';

const KEY = 'mi.v1.journey';

export interface Journey {
  investigatorId: string;
  /** Highest case number unlocked. 0 until Case 000 is solved. */
  unlocked: number;
  /** The case currently open. */
  current: number;
  completed: number[];
}

function read(): Journey | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Journey) : null;
  } catch {
    return null;
  }
}

function write(journey: Journey): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(journey));
  } catch {
    // Storage unavailable. The player keeps playing; they lose the save.
  }
}

export function loadJourney(): Journey {
  const existing = read();
  if (existing) return existing;

  const journey: Journey = {
    investigatorId: createInvestigatorId(),
    unlocked: 0,
    current: 0,
    completed: [],
  };
  write(journey);
  return journey;
}

export function completeCase(journey: Journey, caseNumber: number): Journey {
  const next: Journey = {
    ...journey,
    unlocked: Math.max(journey.unlocked, caseNumber + 1),
    completed: journey.completed.includes(caseNumber)
      ? journey.completed
      : [...journey.completed, caseNumber],
  };
  write(next);
  return next;
}

export function openCase(journey: Journey, caseNumber: number): Journey {
  const next: Journey = { ...journey, current: caseNumber };
  write(next);
  return next;
}

/** Wipes everything, including the investigator id. */
export function resetJourney(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // As above.
  }
  localAdapter.clearAll();
}
