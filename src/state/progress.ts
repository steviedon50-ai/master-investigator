/**
 * Case progress.
 *
 * One reducer, one place where state changes. The investigation log is written
 * by the reducer itself rather than by components, so it is a true record
 * rather than whatever a screen remembered to report.
 */

import type {
  CaseProgress,
  EvidenceStatus,
  Fragment,
  HintLevel,
  Investigation,
  LogEntry,
  LogEventType,
  Note,
  Puzzle,
  PuzzleProgress,
} from '../engine/types';

export function createProgress(
  investigation: Investigation,
  now: number = Date.now(),
): CaseProgress {
  const evidenceStatus: Record<string, EvidenceStatus> = {};
  for (const item of investigation.evidence) evidenceStatus[item.id] = item.status;

  return {
    caseId: investigation.caseFile.id,
    startedAt: now,
    inspectedEvidence: [],
    viewedDocuments: [],
    evidenceStatus,
    links: [],
    puzzles: {},
    fragments: [],
    log: [{ at: now, type: 'case-opened', label: 'Case opened' }],
    notes: [],
  };
}

export type Action =
  | { type: 'inspect-evidence'; evidenceId: string; name: string }
  | { type: 'view-document'; documentId: string; name: string }
  | { type: 'solve-puzzle'; puzzle: Puzzle }
  | { type: 'wrong-answer'; puzzleId: string }
  | { type: 'use-hint'; puzzleId: string; level: HintLevel; title: string }
  | { type: 'answer-step'; puzzleId: string; stepId: string; answer: string }
  | { type: 'set-evidence-status'; evidenceId: string; status: EvidenceStatus; name: string }
  | { type: 'link-evidence'; from: string; to: string; kind: string; note?: string }
  | { type: 'unlink-evidence'; linkId: string }
  | { type: 'add-note'; body: string; attachedTo?: Note['attachedTo'] }
  | { type: 'edit-note'; noteId: string; body: string }
  | { type: 'delete-note'; noteId: string }
  | { type: 'submit-final'; answer: string };

function log(
  progress: CaseProgress,
  type: LogEventType,
  label: string,
  now: number,
  refId?: string,
): LogEntry[] {
  return [...progress.log, { at: now, type, label, refId }];
}

function puzzleState(progress: CaseProgress, id: string): PuzzleProgress {
  return (
    progress.puzzles[id] ?? { solved: false, wrongAttempts: 0, hintsUsed: [] }
  );
}

/**
 * Ids are generated from the clock plus a counter suffix so that two links
 * made in the same millisecond cannot collide.
 */
let sequence = 0;
function nextId(prefix: string, now: number): string {
  sequence += 1;
  return `${prefix}-${now}-${sequence}`;
}

export function reduce(
  progress: CaseProgress,
  action: Action,
  now: number = Date.now(),
): CaseProgress {
  switch (action.type) {
    case 'inspect-evidence': {
      if (progress.inspectedEvidence.includes(action.evidenceId)) return progress;
      return {
        ...progress,
        inspectedEvidence: [...progress.inspectedEvidence, action.evidenceId],
        log: log(progress, 'evidence-inspected', `${action.name} inspected`, now, action.evidenceId),
      };
    }

    case 'view-document': {
      if (progress.viewedDocuments.includes(action.documentId)) return progress;
      return {
        ...progress,
        viewedDocuments: [...progress.viewedDocuments, action.documentId],
        log: log(progress, 'document-viewed', `${action.name} read`, now, action.documentId),
      };
    }

    case 'solve-puzzle': {
      const { puzzle } = action;
      const state = puzzleState(progress, puzzle.id);
      if (state.solved) return progress;

      const rewards = puzzle.rewards;

      const fragments: Fragment[] = rewards.fragment
        ? [...progress.fragments.filter((f) => f.slot !== rewards.fragment?.slot), rewards.fragment]
        : progress.fragments;

      const evidenceStatus = { ...progress.evidenceStatus };
      for (const entry of rewards.setStatus ?? []) {
        evidenceStatus[entry.evidenceId] = entry.status;
      }

      let entries = log(
        progress,
        'puzzle-solved',
        rewards.log ?? `${puzzle.title} solved`,
        now,
        puzzle.id,
      );

      // Status changes are logged separately so the record shows the reasoning,
      // not just that a puzzle was completed.
      for (const entry of rewards.setStatus ?? []) {
        const type: LogEventType =
          entry.status === 'red-herring' ? 'red-herring-identified' : 'contradiction-found';
        const label =
          entry.status === 'red-herring'
            ? 'Red herring identified'
            : 'Contradiction identified';
        entries = [...entries, { at: now, type, label, refId: entry.evidenceId }];
      }

      return {
        ...progress,
        puzzles: {
          ...progress.puzzles,
          [puzzle.id]: { ...state, solved: true, solvedAt: now },
        },
        fragments: fragments.sort((a, b) => a.slot - b.slot),
        evidenceStatus,
        log: entries,
      };
    }

    case 'wrong-answer': {
      const state = puzzleState(progress, action.puzzleId);
      return {
        ...progress,
        puzzles: {
          ...progress.puzzles,
          [action.puzzleId]: { ...state, wrongAttempts: state.wrongAttempts + 1 },
        },
      };
    }

    case 'use-hint': {
      const state = puzzleState(progress, action.puzzleId);
      if (state.hintsUsed.includes(action.level)) return progress;
      return {
        ...progress,
        puzzles: {
          ...progress.puzzles,
          [action.puzzleId]: { ...state, hintsUsed: [...state.hintsUsed, action.level] },
        },
        log: log(progress, 'hint-used', `Hint used — ${action.title}`, now, action.puzzleId),
      };
    }

    case 'answer-step': {
      const state = puzzleState(progress, action.puzzleId);
      return {
        ...progress,
        puzzles: {
          ...progress.puzzles,
          [action.puzzleId]: {
            ...state,
            stepAnswers: { ...(state.stepAnswers ?? {}), [action.stepId]: action.answer },
          },
        },
      };
    }

    case 'set-evidence-status': {
      if (progress.evidenceStatus[action.evidenceId] === action.status) return progress;
      const type: LogEventType =
        action.status === 'red-herring'
          ? 'red-herring-identified'
          : action.status === 'contradicted'
            ? 'contradiction-found'
            : 'evidence-inspected';
      return {
        ...progress,
        evidenceStatus: { ...progress.evidenceStatus, [action.evidenceId]: action.status },
        log: log(progress, type, `${action.name} marked ${action.status}`, now, action.evidenceId),
      };
    }

    case 'link-evidence': {
      const exists = progress.links.some(
        (l) => l.from === action.from && l.to === action.to && l.kind === action.kind,
      );
      if (exists) return progress;
      return {
        ...progress,
        links: [
          ...progress.links,
          {
            id: nextId('link', now),
            from: action.from,
            to: action.to,
            kind: action.kind as never,
            note: action.note,
            playerMade: true,
          },
        ],
        log: log(progress, 'evidence-connected', 'Evidence connected', now),
      };
    }

    case 'unlink-evidence':
      return { ...progress, links: progress.links.filter((l) => l.id !== action.linkId) };

    case 'add-note': {
      const note: Note = {
        id: nextId('note', now),
        body: action.body,
        createdAt: now,
        updatedAt: now,
        attachedTo: action.attachedTo,
      };
      return { ...progress, notes: [...progress.notes, note] };
    }

    case 'edit-note':
      return {
        ...progress,
        notes: progress.notes.map((n) =>
          n.id === action.noteId ? { ...n, body: action.body, updatedAt: now } : n,
        ),
      };

    case 'delete-note':
      return { ...progress, notes: progress.notes.filter((n) => n.id !== action.noteId) };

    case 'submit-final':
      return {
        ...progress,
        finalAnswer: action.answer,
        completedAt: now,
        log: log(progress, 'case-solved', 'Case solved', now),
      };

    default:
      return progress;
  }
}

/* ---------------------------------------------------------------- */
/* Derived state                                                    */
/* ---------------------------------------------------------------- */

/** Evidence the player can currently see. */
export function visibleEvidence(
  investigation: Investigation,
  progress: CaseProgress,
): typeof investigation.evidence {
  return investigation.evidence.filter(
    (item) => item.revealedBy === null || progress.puzzles[item.revealedBy]?.solved === true,
  );
}

/** Whether a puzzle's unlock conditions are all met. */
export function isUnlocked(puzzle: Puzzle, progress: CaseProgress): boolean {
  return puzzle.unlockConditions.every((condition) => {
    switch (condition.type) {
      case 'puzzleSolved':
        return progress.puzzles[condition.id]?.solved === true;
      case 'evidenceInspected':
        return progress.inspectedEvidence.includes(condition.id);
      case 'allFragments':
        return progress.fragments.length >= condition.count;
      default:
        return true;
    }
  });
}

/** The puzzle the player should be working on: first unlocked and unsolved. */
export function currentPuzzle(
  investigation: Investigation,
  progress: CaseProgress,
): Puzzle | null {
  const ordered = [...investigation.puzzles].sort((a, b) => a.stage - b.stage);
  return (
    ordered.find((p) => !progress.puzzles[p.id]?.solved && isUnlocked(p, progress)) ?? null
  );
}

export function isComplete(
  investigation: Investigation,
  progress: CaseProgress,
): boolean {
  return investigation.puzzles.every((p) => progress.puzzles[p.id]?.solved === true);
}
