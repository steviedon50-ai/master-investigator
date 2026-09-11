/**
 * Answer normalisation and checking.
 *
 * The blueprint requires tolerance: case, spacing, punctuation, accents and
 * common alternate spellings should all pass. A player who knows the answer
 * should never be blocked by how they typed it.
 *
 * Normalisation is deliberately conservative — it strips noise, it does not
 * guess. "Mercator" must not become a match for "Mercury".
 */

/**
 * Lowercases, strips accents, removes punctuation, collapses whitespace.
 * "Galileo Galilei!" and "galileo  galilei" both become "galileo galilei".
 */
export function normalise(input: string): string {
  return input
    .normalize('NFD')
    // Combining marks: é -> e, ü -> u, ō -> o
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Normalised with all spaces removed — for answers where spacing is arbitrary. */
export function normaliseTight(input: string): string {
  return normalise(input).replace(/ /g, '');
}

/**
 * Levenshtein distance, capped for speed. Used only to allow a single typo
 * on long answers; short answers must be exact so that near-misses like
 * "cat"/"bat" never both pass.
 */
function editDistance(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;

  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const curr: number[] = [i];
    let rowMin = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        (curr[j - 1] as number) + 1,
        (prev[j] as number) + 1,
        (prev[j - 1] as number) + cost,
      );
      curr[j] = value;
      if (value < rowMin) rowMin = value;
    }

    if (rowMin > cap) return cap + 1;
    prev = curr;
  }

  return prev[b.length] as number;
}

export interface CheckOptions {
  /** Allow one typo on answers of 8+ characters. Default true. */
  allowTypo?: boolean;
  /** Ignore spacing entirely. Default true. */
  ignoreSpacing?: boolean;
}

export interface CheckResult {
  correct: boolean;
  /** True when the answer passed only because of typo tolerance. */
  approximate: boolean;
  matched?: string;
}

/**
 * Checks an answer against the accepted list.
 * `accepted` should already contain every deliberate variant the case author
 * wants (aliases, full names, local spellings); this function handles the
 * mechanical variation on top.
 */
export function checkAnswer(
  input: string,
  accepted: readonly string[],
  options: CheckOptions = {},
): CheckResult {
  const { allowTypo = true, ignoreSpacing = true } = options;

  const given = normalise(input);
  if (given.length === 0) return { correct: false, approximate: false };

  const givenTight = normaliseTight(input);

  for (const candidate of accepted) {
    const target = normalise(candidate);
    if (given === target) return { correct: true, approximate: false, matched: candidate };

    if (ignoreSpacing && givenTight === normaliseTight(candidate)) {
      return { correct: true, approximate: false, matched: candidate };
    }
  }

  if (allowTypo) {
    for (const candidate of accepted) {
      const target = normalise(candidate);
      if (target.length < 8) continue;
      if (editDistance(given, target, 1) <= 1) {
        return { correct: true, approximate: true, matched: candidate };
      }
    }
  }

  return { correct: false, approximate: false };
}

/**
 * Ordered multi-word answers, e.g. the final assembly.
 * Compares word by word after normalising, so extra spaces and punctuation
 * between words do not matter but the order does.
 */
export function checkOrderedWords(
  input: string,
  expected: readonly string[],
): boolean {
  const given = normalise(input).split(' ').filter(Boolean);
  if (given.length !== expected.length) return false;
  return given.every((word, i) => word === normalise(expected[i] as string));
}
