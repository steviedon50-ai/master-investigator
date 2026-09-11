/**
 * Case validator.
 *
 * A generated case is never published on trust. It is generated, validated,
 * and discarded if it fails. This is the gate.
 *
 * Case 000 runs through the same checks — if the authored case cannot pass,
 * the rules are wrong and every generated case would inherit the fault.
 */

import { validate } from './puzzles';
import { checkAnswer } from './answers';
import type { Investigation, Puzzle } from './types';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  severity: Severity;
  code: string;
  message: string;
  puzzleId?: string;
  evidenceId?: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

const error = (
  code: string,
  message: string,
  extra: Partial<ValidationIssue> = {},
): ValidationIssue => ({ severity: 'error', code, message, ...extra });

const warn = (
  code: string,
  message: string,
  extra: Partial<ValidationIssue> = {},
): ValidationIssue => ({ severity: 'warning', code, message, ...extra });

/* ---------------------------------------------------------------- */
/* Reachability                                                     */
/* ---------------------------------------------------------------- */

/**
 * Walks the graph from the entry node. Anything not reached is dead content:
 * a puzzle the player can never open, which usually means a generated case
 * has a broken dependency rather than an intentional optional branch.
 */
function reachablePuzzles(investigation: Investigation): Set<string> {
  const byId = new Map(investigation.puzzles.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const queue = [investigation.graph.entry];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    const puzzle = byId.get(id);
    if (!puzzle) continue;
    seen.add(id);
    queue.push(...puzzle.nextPuzzles);
  }

  return seen;
}

/* ---------------------------------------------------------------- */
/* Individual checks                                                */
/* ---------------------------------------------------------------- */

function checkIds(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const puzzle of investigation.puzzles) {
    if (seen.has(puzzle.id)) {
      issues.push(error('duplicate-puzzle-id', `Puzzle id used twice: ${puzzle.id}`, { puzzleId: puzzle.id }));
    }
    seen.add(puzzle.id);
  }

  const evidenceIds = new Set<string>();
  for (const item of investigation.evidence) {
    if (evidenceIds.has(item.id)) {
      issues.push(error('duplicate-evidence-id', `Evidence id used twice: ${item.id}`, { evidenceId: item.id }));
    }
    evidenceIds.add(item.id);
  }

  return issues;
}

function checkReferences(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const puzzleIds = new Set(investigation.puzzles.map((p) => p.id));
  const evidenceIds = new Set(investigation.evidence.map((e) => e.id));
  const documentIds = new Set(investigation.documents.map((d) => d.id));

  if (!puzzleIds.has(investigation.graph.entry)) {
    issues.push(error('bad-entry', `Graph entry points at a puzzle that does not exist: ${investigation.graph.entry}`));
  }

  for (const puzzle of investigation.puzzles) {
    for (const dep of puzzle.dependencies) {
      if (!puzzleIds.has(dep)) {
        issues.push(error('missing-dependency', `${puzzle.id} depends on unknown puzzle ${dep}`, { puzzleId: puzzle.id }));
      }
    }
    for (const next of puzzle.nextPuzzles) {
      if (!puzzleIds.has(next)) {
        issues.push(error('missing-next', `${puzzle.id} points at unknown puzzle ${next}`, { puzzleId: puzzle.id }));
      }
    }
    for (const condition of puzzle.unlockConditions) {
      if (condition.type === 'puzzleSolved' && !puzzleIds.has(condition.id)) {
        issues.push(error('missing-unlock', `${puzzle.id} unlocks on unknown puzzle ${condition.id}`, { puzzleId: puzzle.id }));
      }
      if (condition.type === 'evidenceInspected' && !evidenceIds.has(condition.id)) {
        issues.push(error('missing-unlock-evidence', `${puzzle.id} unlocks on unknown evidence ${condition.id}`, { puzzleId: puzzle.id }));
      }
    }
    for (const id of puzzle.rewards.evidence ?? []) {
      if (!evidenceIds.has(id)) {
        issues.push(error('missing-reward-evidence', `${puzzle.id} reveals unknown evidence ${id}`, { puzzleId: puzzle.id }));
      }
    }
    for (const entry of puzzle.rewards.setStatus ?? []) {
      if (!evidenceIds.has(entry.evidenceId)) {
        issues.push(error('missing-status-evidence', `${puzzle.id} sets status on unknown evidence ${entry.evidenceId}`, { puzzleId: puzzle.id }));
      }
    }
    const requires = (puzzle.data.requiresInspected as string[] | undefined) ?? [];
    for (const id of requires) {
      if (!evidenceIds.has(id)) {
        issues.push(error('missing-required-evidence', `${puzzle.id} requires unknown evidence ${id}`, { puzzleId: puzzle.id }));
      }
    }
  }

  for (const item of investigation.evidence) {
    if (item.documentId && !documentIds.has(item.documentId)) {
      issues.push(error('missing-document', `${item.id} points at unknown document ${item.documentId}`, { evidenceId: item.id }));
    }
    if (item.revealedBy && !puzzleIds.has(item.revealedBy)) {
      issues.push(error('missing-revealer', `${item.id} is revealed by unknown puzzle ${item.revealedBy}`, { evidenceId: item.id }));
    }
  }

  return issues;
}

/** No puzzle may need evidence that only appears after it is solved. */
function checkEvidenceTiming(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stageOf = new Map(investigation.puzzles.map((p) => [p.id, p.stage]));

  for (const item of investigation.evidence) {
    if (!item.revealedBy) continue;
    const revealStage = stageOf.get(item.revealedBy);
    if (revealStage === undefined) continue;

    for (const puzzle of investigation.puzzles) {
      const requires = (puzzle.data.requiresInspected as string[] | undefined) ?? [];
      const usesDocument = puzzle.data.documentId === item.documentId;
      const selectFrom = (puzzle.data.selectFrom as string[] | undefined) ?? [];

      const needsIt =
        requires.includes(item.id) || selectFrom.includes(item.id) || usesDocument;

      if (needsIt && puzzle.stage < revealStage) {
        issues.push(
          error(
            'evidence-too-late',
            `${puzzle.id} (stage ${puzzle.stage}) needs ${item.id}, which only appears at stage ${revealStage}`,
            { puzzleId: puzzle.id, evidenceId: item.id },
          ),
        );
      }
    }
  }

  return issues;
}

/** Every stated solution must actually pass its own solver. */
function checkSolvable(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const puzzle of investigation.puzzles) {
    if (puzzle.type === 'inspection') continue;

    if (puzzle.solution === null || puzzle.solution.length === 0) {
      issues.push(error('no-solution', `${puzzle.id} has no solution`, { puzzleId: puzzle.id }));
      continue;
    }

    const context = {
      inspectedEvidence: investigation.evidence.map((e) => e.id),
      stepAnswers: stepAnswersFor(puzzle),
    };

    const result = validate(puzzle, puzzle.solution, context);
    if (!result.correct) {
      issues.push(
        error('solution-rejected', `${puzzle.id}: its own solution "${puzzle.solution}" does not validate`, {
          puzzleId: puzzle.id,
        }),
      );
    }

    for (const accepted of puzzle.acceptedAnswers) {
      const check = validate(puzzle, accepted, context);
      if (!check.correct) {
        issues.push(
          warn('accepted-rejected', `${puzzle.id}: accepted answer "${accepted}" does not validate`, {
            puzzleId: puzzle.id,
          }),
        );
      }
    }
  }

  return issues;
}

interface ResearchStep {
  id: string;
  solution: string;
  acceptedAnswers: string[];
  initial: string;
}

function stepAnswersFor(puzzle: Puzzle): Record<string, string> {
  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
  const answers: Record<string, string> = {};
  for (const step of steps) answers[step.id] = step.solution;
  return answers;
}

/** Research chains must combine into the answer they claim. */
function checkResearchChains(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const puzzle of investigation.puzzles) {
    if (puzzle.type !== 'research.chain') continue;

    const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
    if (steps.length === 0) {
      issues.push(error('empty-chain', `${puzzle.id} has no research steps`, { puzzleId: puzzle.id }));
      continue;
    }

    for (const step of steps) {
      if (!checkAnswer(step.solution, step.acceptedAnswers).correct) {
        issues.push(
          error('step-solution-rejected', `${puzzle.id}/${step.id}: solution is not in its own accepted list`, {
            puzzleId: puzzle.id,
          }),
        );
      }
      if (step.initial.toUpperCase() !== step.solution.charAt(0).toUpperCase()) {
        issues.push(
          error('initial-mismatch', `${puzzle.id}/${step.id}: initial "${step.initial}" is not the first letter of "${step.solution}"`, {
            puzzleId: puzzle.id,
          }),
        );
      }
    }

    if (puzzle.data.combine === 'initials-in-order') {
      const combined = steps.map((s) => s.initial.toUpperCase()).join('');
      if (!checkAnswer(combined, puzzle.acceptedAnswers).correct) {
        issues.push(
          error('chain-mismatch', `${puzzle.id}: initials spell "${combined}", which is not the accepted answer`, {
            puzzleId: puzzle.id,
          }),
        );
      }
    }
  }

  return issues;
}

/** Meta-puzzles need every word they ask for to be produced by an earlier puzzle. */
function checkMeta(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const produced = new Map<number, string>();
  for (const puzzle of investigation.puzzles) {
    const fragment = puzzle.rewards.fragment;
    if (fragment) produced.set(fragment.slot, fragment.word);
  }

  for (const puzzle of investigation.puzzles) {
    if (puzzle.type !== 'meta.assembly') continue;

    const fragments = (puzzle.data.fragments as Array<{ slot: number; word: string }> | undefined) ?? [];
    for (const fragment of fragments) {
      const actual = produced.get(fragment.slot);
      if (actual === undefined) {
        issues.push(
          error('fragment-never-produced', `${puzzle.id} expects a word in slot ${fragment.slot}, which no puzzle awards`, {
            puzzleId: puzzle.id,
          }),
        );
      } else if (actual !== fragment.word) {
        issues.push(
          error('fragment-mismatch', `${puzzle.id} slot ${fragment.slot} expects "${fragment.word}" but the case awards "${actual}"`, {
            puzzleId: puzzle.id,
          }),
        );
      }
    }

    const assembled = fragments
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((f) => f.word)
      .join(' ');

    if (puzzle.solution && assembled.toUpperCase() !== puzzle.solution.toUpperCase()) {
      issues.push(
        error('meta-mismatch', `${puzzle.id}: fragments in slot order give "${assembled}", solution says "${puzzle.solution}"`, {
          puzzleId: puzzle.id,
        }),
      );
    }

    for (const condition of puzzle.unlockConditions) {
      if (condition.type === 'allFragments' && condition.count !== produced.size) {
        issues.push(
          warn('fragment-count', `${puzzle.id} waits for ${condition.count} fragments but the case awards ${produced.size}`, {
            puzzleId: puzzle.id,
          }),
        );
      }
    }
  }

  return issues;
}

/** Contradiction puzzles must point at evidence the author marked unreliable. */
function checkContradictions(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(investigation.evidence.map((e) => [e.id, e]));

  for (const puzzle of investigation.puzzles) {
    if (puzzle.type !== 'deduction.contradiction') continue;

    const [evidenceId, reason] = (puzzle.solution ?? '').split('|');
    if (!evidenceId || !reason) {
      issues.push(error('bad-contradiction-solution', `${puzzle.id}: solution must be "evidenceId|reason"`, { puzzleId: puzzle.id }));
      continue;
    }

    const target = byId.get(evidenceId);
    if (!target) {
      issues.push(error('contradiction-unknown-evidence', `${puzzle.id} names unknown evidence ${evidenceId}`, { puzzleId: puzzle.id }));
      continue;
    }
    if (!target.authoring?.unreliable) {
      issues.push(
        error('contradiction-not-marked', `${puzzle.id} names ${evidenceId} as unreliable, but it is not marked so`, {
          puzzleId: puzzle.id,
          evidenceId,
        }),
      );
    }

    const options = (puzzle.data.reasonOptions as Array<{ id: string }> | undefined) ?? [];
    if (!options.some((o) => o.id === reason)) {
      issues.push(error('reason-not-offered', `${puzzle.id}: reason "${reason}" is not one of the options`, { puzzleId: puzzle.id }));
    }

    const selectFrom = (puzzle.data.selectFrom as string[] | undefined) ?? [];
    if (!selectFrom.includes(evidenceId)) {
      issues.push(error('answer-not-selectable', `${puzzle.id}: the answer ${evidenceId} is not in the selectable list`, { puzzleId: puzzle.id }));
    }
  }

  return issues;
}

function checkHints(investigation: Investigation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const puzzle of investigation.puzzles) {
    if (puzzle.type === 'inspection') continue;

    const levels = puzzle.hints.map((h) => h.level);
    if (!levels.includes('reveal')) {
      issues.push(warn('no-reveal-hint', `${puzzle.id} has no reveal hint, so a stuck player cannot continue`, { puzzleId: puzzle.id }));
    }
    if (new Set(levels).size !== levels.length) {
      issues.push(warn('duplicate-hint-level', `${puzzle.id} has two hints at the same level`, { puzzleId: puzzle.id }));
    }
  }

  return issues;
}

function checkReachable(investigation: Investigation): ValidationIssue[] {
  const reached = reachablePuzzles(investigation);
  return investigation.puzzles
    .filter((p) => !reached.has(p.id))
    .map((p) =>
      error('unreachable-puzzle', `${p.id} cannot be reached from the entry point`, { puzzleId: p.id }),
    );
}

/* ---------------------------------------------------------------- */
/* Entry point                                                      */
/* ---------------------------------------------------------------- */

export function validateCase(investigation: Investigation): ValidationReport {
  const issues = [
    ...checkIds(investigation),
    ...checkReferences(investigation),
    ...checkReachable(investigation),
    ...checkEvidenceTiming(investigation),
    ...checkSolvable(investigation),
    ...checkResearchChains(investigation),
    ...checkMeta(investigation),
    ...checkContradictions(investigation),
    ...checkHints(investigation),
  ];

  return {
    valid: !issues.some((i) => i.severity === 'error'),
    issues,
  };
}

/**
 * Generate-and-discard loop for procedural cases.
 * Returns null rather than a broken case — the caller must handle exhaustion
 * rather than shipping something unsolvable.
 */
export function generateValidated(
  generate: (attempt: number) => Investigation,
  maxAttempts = 25,
): { investigation: Investigation; attempts: number } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generate(attempt);
    if (validateCase(candidate).valid) {
      return { investigation: candidate, attempts: attempt + 1 };
    }
  }
  return null;
}
