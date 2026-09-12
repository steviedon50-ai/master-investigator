/**
 * React binding for a single investigation. Autosaves on every change.
 *
 * Uses useState with an explicit type rather than useReducer: the reducer
 * lives in progress.ts either way, and this form gives the compiler nothing
 * to infer wrongly.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CaseProgress, HintLevel, Investigation, Puzzle } from '../engine/types';
import { validate } from '../engine/puzzles';
import { completionPercent, scoreCase } from '../engine/scoring';
import { localAdapter } from './storage';
import type { StorageAdapter } from './storage';
import type { Action } from './progress';
import {
  createProgress,
  currentPuzzle,
  isComplete,
  isUnlocked,
  reduce,
  visibleEvidence,
} from './progress';

export interface AnswerOutcome {
  correct: boolean;
  approximate: boolean;
  feedback?: string;
}

export function useCase(
  investigation: Investigation,
  adapter: StorageAdapter = localAdapter,
) {
  const [progress, setProgress] = useState<CaseProgress>(() => {
    const saved = adapter.loadProgress(investigation.caseFile.id);
    return saved ?? createProgress(investigation);
  });

  const [lastOutcome, setLastOutcome] = useState<AnswerOutcome | null>(null);

  const send = useCallback((action: Action) => {
    setProgress((current) => reduce(current, action));
  }, []);

  useEffect(() => {
    adapter.saveProgress(progress);
  }, [progress, adapter]);

  const evidence = useMemo(
    () => visibleEvidence(investigation, progress),
    [investigation, progress],
  );

  const active = useMemo(
    () => currentPuzzle(investigation, progress),
    [investigation, progress],
  );

  const complete = useMemo(
    () => isComplete(investigation, progress),
    [investigation, progress],
  );

  const percent = useMemo(
    () => completionPercent(progress, investigation),
    [progress, investigation],
  );

  const score = useMemo(
    () => scoreCase(progress, investigation),
    [progress, investigation],
  );

  const documentFor = useCallback(
    (documentId: string | undefined) => {
      if (!documentId) return null;
      return investigation.documents.find((d) => d.id === documentId) ?? null;
    },
    [investigation],
  );

  const inspect = useCallback(
    (evidenceId: string) => {
      const item = investigation.evidence.find((e) => e.id === evidenceId);
      if (!item) return;
      send({ type: 'inspect-evidence', evidenceId, name: item.name });
      if (item.documentId) {
        send({ type: 'view-document', documentId: item.documentId, name: item.name });
      }
    },
    [investigation, send],
  );

  const answerStep = useCallback(
    (puzzleId: string, stepId: string, answer: string) => {
      send({ type: 'answer-step', puzzleId, stepId, answer });
    },
    [send],
  );

  const submitAnswer = useCallback(
    (puzzle: Puzzle, answer: string): AnswerOutcome => {
      const result = validate(puzzle, answer, {
        inspectedEvidence: progress.inspectedEvidence,
        stepAnswers: progress.puzzles[puzzle.id]?.stepAnswers ?? {},
      });

      if (result.correct) {
        send({ type: 'solve-puzzle', puzzle });
        if (puzzle.type === 'meta.assembly') {
          send({ type: 'submit-final', answer });
        }
      } else {
        send({ type: 'wrong-answer', puzzleId: puzzle.id });
      }

      const outcome: AnswerOutcome = {
        correct: result.correct,
        approximate: result.approximate,
        feedback: result.feedback,
      };
      setLastOutcome(outcome);
      return outcome;
    },
    [progress, send],
  );

  const useHint = useCallback(
    (puzzle: Puzzle, level: HintLevel) => {
      const hint = puzzle.hints.find((h) => h.level === level);
      if (!hint) return null;
      send({ type: 'use-hint', puzzleId: puzzle.id, level, title: puzzle.title });
      return hint;
    },
    [send],
  );

  const hintsUsedFor = useCallback(
    (puzzleId: string): HintLevel[] => progress.puzzles[puzzleId]?.hintsUsed ?? [],
    [progress],
  );

  const addNote = useCallback(
    (body: string) => {
      send({ type: 'add-note', body });
    },
    [send],
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      send({ type: 'delete-note', noteId });
    },
    [send],
  );

  const clearOutcome = useCallback(() => {
    setLastOutcome(null);
  }, []);

  const restart = useCallback(() => {
    adapter.clearProgress(investigation.caseFile.id);
    window.location.reload();
  }, [adapter, investigation]);

  const unlocked = useCallback(
    (puzzle: Puzzle) => isUnlocked(puzzle, progress),
    [progress],
  );

  return {
    progress,
    evidence,
    active,
    complete,
    percent,
    score,
    lastOutcome,
    documentFor,
    inspect,
    submitAnswer,
    answerStep,
    useHint,
    hintsUsedFor,
    addNote,
    deleteNote,
    clearOutcome,
    restart,
    unlocked,
  };
}
