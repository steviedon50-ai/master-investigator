/**
 * React binding for a single investigation. Autosaves on every change.
 */

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
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

function init(investigation: Investigation, adapter: StorageAdapter): CaseProgress {
  return adapter.loadProgress(investigation.caseFile.id) ?? createProgress(investigation);
}

export function useCase(
  investigation: Investigation,
  adapter: StorageAdapter = localAdapter,
) {
  const reducer = (state: CaseProgress, action: Action): CaseProgress =>
    reduce(state, action);

  const [progress, dispatch] = useReducer(reducer, init(investigation, adapter));

  const [lastOutcome, setLastOutcome] = useState<AnswerOutcome | null>(null);

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
      dispatch({ type: 'inspect-evidence', evidenceId, name: item.name });
      if (item.documentId) {
        dispatch({ type: 'view-document', documentId: item.documentId, name: item.name });
      }
    },
    [investigation],
  );

  const answerStep = useCallback((puzzleId: string, stepId: string, answer: string) => {
    dispatch({ type: 'answer-step', puzzleId, stepId, answer });
  }, []);

  const submitAnswer = useCallback(
    (puzzle: Puzzle, answer: string): AnswerOutcome => {
      const result = validate(puzzle, answer, {
        inspectedEvidence: progress.inspectedEvidence,
        stepAnswers: progress.puzzles[puzzle.id]?.stepAnswers ?? {},
      });

      if (result.correct) {
        dispatch({ type: 'solve-puzzle', puzzle });
        if (puzzle.type === 'meta.assembly') {
          dispatch({ type: 'submit-final', answer });
        }
      } else {
        dispatch({ type: 'wrong-answer', puzzleId: puzzle.id });
      }

      const outcome: AnswerOutcome = {
        correct: result.correct,
        approximate: result.approximate,
        feedback: result.feedback,
      };
      setLastOutcome(outcome);
      return outcome;
    },
    [progress],
  );

  const useHint = useCallback((puzzle: Puzzle, level: HintLevel) => {
    const hint = puzzle.hints.find((h) => h.level === level);
    if (!hint) return null;
    dispatch({ type: 'use-hint', puzzleId: puzzle.id, level, title: puzzle.title });
    return hint;
  }, []);

  const hintsUsedFor = useCallback(
    (puzzleId: string): HintLevel[] => progress.puzzles[puzzleId]?.hintsUsed ?? [],
    [progress],
  );

  const addNote = useCallback((body: string) => {
    dispatch({ type: 'add-note', body });
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    dispatch({ type: 'delete-note', noteId });
  }, []);

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
