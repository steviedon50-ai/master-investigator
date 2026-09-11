/**
 * Puzzle engine.
 *
 * Every puzzle type registers a solver here. The UI calls `validate` and gets
 * a uniform result back, so adding a cipher later never touches a component.
 */

import { checkAnswer, checkOrderedWords, normalise } from './answers';
import type { Puzzle, PuzzleType } from './types';

export interface ValidationResult {
  correct: boolean;
  approximate: boolean;
  /** Shown on a wrong answer when the puzzle can say something useful. */
  feedback?: string;
}

export interface SolverContext {
  /** Ids of evidence the player has opened. Used by inspection puzzles. */
  inspectedEvidence: string[];
  /** Answers already given for multi-step puzzles. */
  stepAnswers: Record<string, string>;
}

type Solver = (
  puzzle: Puzzle,
  answer: string,
  context: SolverContext,
) => ValidationResult;

/* ---------------------------------------------------------------- */
/* Morse                                                            */
/* ---------------------------------------------------------------- */

const MORSE: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
  '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
  '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
  '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
  '-.--': 'Y', '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
  '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
};

/** Decodes Morse. Groups split on spaces, words on ` / `. */
export function decodeMorse(input: string): string {
  return input
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .split(/\s+/)
        .filter(Boolean)
        .map((group) => MORSE[group] ?? '?')
        .join(''),
    )
    .join(' ');
}

/* ---------------------------------------------------------------- */
/* Ciphers                                                          */
/* ---------------------------------------------------------------- */

export function caesarShift(input: string, shift: number): string {
  const offset = ((shift % 26) + 26) % 26;
  return input.replace(/[a-z]/gi, (char) => {
    const base = char === char.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + offset) % 26) + base);
  });
}

export function decodeA1Z26(input: string): string {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return n >= 1 && n <= 26 ? String.fromCharCode(64 + n) : '?';
    })
    .join('');
}

export function decodeVigenere(input: string, key: string): string {
  const cleanKey = key.replace(/[^a-z]/gi, '').toUpperCase();
  if (cleanKey.length === 0) return input;

  let k = 0;
  return input.replace(/[a-z]/gi, (char) => {
    const base = char === char.toUpperCase() ? 65 : 97;
    const shift = (cleanKey.charCodeAt(k % cleanKey.length) - 65) as number;
    k += 1;
    return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

/* ---------------------------------------------------------------- */
/* Extraction helpers                                               */
/* ---------------------------------------------------------------- */

/** First letter of each line — the acrostic. Blank lines are skipped. */
export function firstLetters(body: string): string {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    // Drop any leading numbering such as "1. " before taking the letter.
    .map((line) => line.replace(/^[\d]+[.)]\s*/, ''))
    .map((line) => line.charAt(0).toUpperCase())
    .join('');
}

/** Last letter of each line — the telestich. */
export function lastLetters(body: string): string {
  return body
    .split('\n')
    .map((line) => line.trim().replace(/[^A-Za-z]+$/, ''))
    .filter(Boolean)
    .map((line) => line.charAt(line.length - 1).toUpperCase())
    .join('');
}

export function everyNthLetter(text: string, n: number): string {
  const letters = text.replace(/[^A-Za-z]/g, '');
  let out = '';
  for (let i = n - 1; i < letters.length; i += n) out += letters[i];
  return out.toUpperCase();
}

/** True when both strings use exactly the same letters. */
export function isAnagramOf(a: string, b: string): boolean {
  const key = (s: string): string =>
    normalise(s).replace(/ /g, '').split('').sort().join('');
  return key(a) === key(b) && key(a).length > 0;
}

/* ---------------------------------------------------------------- */
/* Solvers                                                          */
/* ---------------------------------------------------------------- */

const standardSolver: Solver = (puzzle, answer) => {
  const result = checkAnswer(answer, puzzle.acceptedAnswers);
  return { correct: result.correct, approximate: result.approximate };
};

const inspectionSolver: Solver = (puzzle, _answer, context) => {
  const required = (puzzle.data.requiresInspected as string[] | undefined) ?? [];
  const missing = required.filter((id) => !context.inspectedEvidence.includes(id));

  if (missing.length === 0) return { correct: true, approximate: false };

  return {
    correct: false,
    approximate: false,
    feedback:
      missing.length === 1
        ? 'One item is still unopened.'
        : `${missing.length} items are still unopened.`,
  };
};

/**
 * Research chains: each step is answered separately, then the combination
 * is checked. A step answered wrong reports which one, because hunting
 * blind through four lookups is tedious rather than difficult.
 */
interface ResearchStep {
  id: string;
  prompt: string;
  solution: string;
  acceptedAnswers: string[];
  initial: string;
}

const researchSolver: Solver = (puzzle, answer, context) => {
  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];

  const unanswered: string[] = [];
  for (const step of steps) {
    const given = context.stepAnswers[step.id] ?? '';
    if (!checkAnswer(given, step.acceptedAnswers).correct) unanswered.push(step.id);
  }

  if (unanswered.length > 0) {
    return {
      correct: false,
      approximate: false,
      feedback: `${unanswered.length} of ${steps.length} still to identify.`,
    };
  }

  const result = checkAnswer(answer, puzzle.acceptedAnswers);
  return { correct: result.correct, approximate: result.approximate };
};

/** Contradiction puzzles answer as "evidenceId|reasonKey". */
const contradictionSolver: Solver = (puzzle, answer) => {
  const expected = puzzle.solution ?? '';
  const [expectedEvidence, expectedReason] = expected.split('|');
  const [givenEvidence, givenReason] = answer.split('|');

  if (givenEvidence !== expectedEvidence) {
    return {
      correct: false,
      approximate: false,
      feedback: 'That source holds up against the others.',
    };
  }
  if (givenReason !== expectedReason) {
    return {
      correct: false,
      approximate: false,
      feedback: 'Right source. Wrong reason.',
    };
  }
  return { correct: true, approximate: false };
};

const metaSolver: Solver = (puzzle, answer) => {
  const expected = (puzzle.solution ?? '').split(' ');
  if (checkOrderedWords(answer, expected)) {
    return { correct: true, approximate: false };
  }

  const result = checkAnswer(answer, puzzle.acceptedAnswers);
  if (result.correct) return { correct: true, approximate: result.approximate };

  // All the right words in the wrong order is worth saying out loud.
  const given = normalise(answer).split(' ').filter(Boolean).sort().join(' ');
  const target = expected.map((w) => normalise(w)).sort().join(' ');
  if (given === target) {
    return {
      correct: false,
      approximate: false,
      feedback: 'Those are the four words. They are not yet in order.',
    };
  }

  return { correct: false, approximate: false };
};

const SOLVERS: Partial<Record<PuzzleType, Solver>> = {
  inspection: inspectionSolver,
  'research.chain': researchSolver,
  'deduction.contradiction': contradictionSolver,
  'meta.assembly': metaSolver,
};

/** Single entry point. Unknown types fall back to plain answer matching. */
export function validate(
  puzzle: Puzzle,
  answer: string,
  context: SolverContext,
): ValidationResult {
  const solver = SOLVERS[puzzle.type] ?? standardSolver;
  return solver(puzzle, answer, context);
}

/** Checks one step of a research chain, for live feedback as they type. */
export function validateResearchStep(
  puzzle: Puzzle,
  stepId: string,
  answer: string,
): boolean {
  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
  const step = steps.find((s) => s.id === stepId);
  if (!step) return false;
  return checkAnswer(answer, step.acceptedAnswers).correct;
}
