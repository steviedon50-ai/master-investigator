/**
 * Persistence.
 *
 * Everything goes through StorageAdapter so the local prototype and a future
 * cloud save are interchangeable. No component ever touches localStorage.
 */

import type { CaseProgress, Profile } from '../engine/types';
import { createInvestigatorId } from '../engine/rng';

const PREFIX = 'mi.v1';
const PROFILE_KEY = `${PREFIX}.profile`;
const progressKey = (caseId: string): string => `${PREFIX}.progress.${caseId}`;

export interface StorageAdapter {
  loadProfile(): Profile | null;
  saveProfile(profile: Profile): void;
  loadProgress(caseId: string): CaseProgress | null;
  saveProgress(progress: CaseProgress): void;
  clearProgress(caseId: string): void;
  clearAll(): void;
}

/**
 * localStorage can throw: private browsing, quota, disabled storage.
 * A failed save must never take the game down mid-case, so reads return null
 * and writes fail silently. The player keeps playing; they lose the save.
 */
function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full. Nothing useful to do here.
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // As above.
  }
}

function parse<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const localAdapter: StorageAdapter = {
  loadProfile: () => parse<Profile>(safeGet(PROFILE_KEY)),
  saveProfile: (profile) => safeSet(PROFILE_KEY, JSON.stringify(profile)),
  loadProgress: (caseId) => parse<CaseProgress>(safeGet(progressKey(caseId))),
  saveProgress: (progress) =>
    safeSet(progressKey(progress.caseId), JSON.stringify(progress)),
  clearProgress: (caseId) => safeRemove(progressKey(caseId)),
  clearAll: () => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(PREFIX)) keys.push(key);
      }
      keys.forEach(safeRemove);
    } catch {
      // As above.
    }
  },
};

export function createProfile(now: number = Date.now()): Profile {
  return {
    investigatorId: createInvestigatorId(),
    titleDiscovered: false,
    casesCompleted: 0,
    casesAttempted: 0,
    puzzlesSolved: 0,
    bestScore: 0,
    averageScore: 0,
    hintsUsed: 0,
    redHerringsIdentified: 0,
    contradictionsIdentified: 0,
    achievements: [],
    createdAt: now,
  };
}

/** Loads the existing profile or makes one on first run. */
export function loadOrCreateProfile(adapter: StorageAdapter = localAdapter): Profile {
  const existing = adapter.loadProfile();
  if (existing) return existing;
  const profile = createProfile();
  adapter.saveProfile(profile);
  return profile;
}
