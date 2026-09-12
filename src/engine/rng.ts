/**
 * Deterministic randomness for case generation.
 *
 * The rule the blueprint sets: the same seed parts must always produce the
 * same investigation. Nothing here may call Math.random or read the clock,
 * except createInvestigatorId, which runs once per player and is then stored.
 */

import type { CaseSeedParts } from './types';

/** FNV-1a, 32-bit. Turns a seed string into an integer. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Builds the canonical seed string, e.g.
 *   MI-7F42-91|CASE-014|MASTER|GENERATOR-V1
 *
 * The format is part of the contract: change it and every existing player's
 * cases regenerate differently. Bump generatorVersion instead.
 */
export function buildSeed(parts: CaseSeedParts): string {
  const caseNo = String(parts.caseNumber).padStart(3, '0');
  return [
    parts.investigatorId,
    `CASE-${caseNo}`,
    parts.difficulty.toUpperCase(),
    parts.generatorVersion.toUpperCase(),
  ].join('|');
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  sample<T>(items: readonly T[], n: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  chance(probability: number): boolean;
}

/** mulberry32. Small, fast, good enough for content selection. */
export function createRng(seed: number | string): Rng {
  let state = (typeof seed === 'string' ? hashSeed(seed) : seed) >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (max < min) throw new Error(`Bad range: ${min}..${max}`);
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('Cannot pick from an empty array');
    return items[int(0, items.length - 1)] as T;
  };

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      const a = out[i] as T;
      const b = out[j] as T;
      out[i] = b;
      out[j] = a;
    }
    return out;
  };

  const sample = <T,>(items: readonly T[], n: number): T[] =>
    shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));

  const chance = (probability: number): boolean => next() < probability;

  return { next, int, pick, sample, shuffle, chance };
}

/** Convenience: seed parts straight to a generator. */
export function rngForCase(parts: CaseSeedParts): Rng {
  return createRng(buildSeed(parts));
}

/**
 * Generates a display id like MI-7F42-91.
 * Called once per player, then stored — not derived from anything stable,
 * because two players must never collide.
 */
export function createInvestigatorId(randomSource = Math.random): string {
  const hex = (n: number): string =>
    Math.floor(randomSource() * 16 ** n)
      .toString(16)
      .toUpperCase()
      .padStart(n, '0');
  return `MI-${hex(4)}-${hex(2)}`;
}
