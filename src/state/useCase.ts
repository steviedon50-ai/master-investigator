/**
 * React binding for a single investigation.
 *
 * Autosaves on every change. The blueprint asks for notes that save
 * automatically; doing it at this level means every part of the case does,
 * and no screen has to remember to.
 */

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { CaseProgress, Investigation, Puzzle } from '../engine/types';
import { validate, type SolverContext } from '../engine/puzzles';
import { completionPercent, scoreCase } from '../engine/scoring';
import { localAdapter, type StorageAdapter } from './storage';
import {
  createProgress,
  currentPuzzle,
  isComplete,
  isUnlocked,
  reduce,
  visibleEvidence,
  type Action,
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
  const [progress, dispatch] = useReducer(
    (state: CaseProgress, action: Action) => reduce(state, action),
    investigation,
    (inv) => adapter.loadProgress(inv.caseFile.id) ?? createProgress(inv),
  );

  // Transient UI state — deliberately not persisted. A feedback message from
  // a wrong answer should not survive a reload.
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

  /** Live score while playing; final score once the case is submitted. */
  const score = useMemo(
    () => scoreCase(progress, investigation),
    [progress, investigation],
  );

  const documentFor = useCallback(
    (documentId: string | undefined) =>
      investigation.documents.find((d) => d.id === documentId) ?? null,
    [investigation],
  );

  const inspect = useCallback(
    (evidenceId: string) => {
      const item = investigation.evidence.find((e) => e.id === evidenceId);
      if (!item) return;
      dispatch({ type: 'inspect-evidence', evidenceId, name: item.name });
      if (item.documentId) {
        const doc = documentFor(item.documentId);
        if (doc) {
          dispatch({ type: 'view-document', documentId: doc.id, name: item.name });
        }
      }
    },
    [investigation, documentFor],
  );

  const answerStep = useCallback((puzzleId: string, stepId: string, answer: string) => {
    dispatch({ type: 'answer-step', puzzleId, stepId, answer });
  }, []);

  const submitAnswer = useCallback(
    (puzzle: Puzzle, answer: string): AnswerOutcome => {
      const context: SolverContext = {
        inspectedEvidence: progress.inspectedEvidence,
        stepAnswers: progress.puzzles[puzzle.id]?.stepAnswers ?? {},
      };

      const result = validate(puzzle, answer, context);

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

  const useHint = useCallback(
    (puzzle: Puzzle, level: Parameters<typeof reduce>[1] extends never ? never : string) => {
      const hint = puzzle.hints.find((h) => h.level === level);
      if (!hint) return null;
      dispatch({
        type: 'use-hint',
        puzzleId: puzzle.id,
        level: hint.level,
        title: puzzle.title,
      });
      return hint;
    },
    [],
  );

  const hintsUsedFor = useCallback(
    (puzzleId: string) => progress.puzzles[puzzleId]?.hintsUsed ?? [],
    [progress],
  );

  const addNote = useCallback((body: string, attachedTo?: Parameters<typeof reduce>[1] extends never ? never : undefined) => {
    dispatch({ type: 'add-note', body, attachedTo });
  }, []);

  const editNote = useCallback((noteId: string, body: string) => {
    dispatch({ type: 'edit-note', noteId, body });
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    dispatch({ type: 'delete-note', noteId });
  }, []);

  const linkEvidence = useCallback(
    (from: string, to: string, kind: string, note?: string) => {
      dispatch({ type: 'link-evidence', from, to, kind, note });
    },
    [],
  );

  const clearOutcome = useCallback(() => setLastOutcome(null), []);

  const restart = useCallback(() => {
    adapter.clearProgress(investigation.caseFile.id);
    window.location.reload();
  }, [adapter, investigation]);

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
    editNote,
    deleteNote,
    linkEvidence,
    clearOutcome,
    restart,
    isUnlocked: (puzzle: Puzzle) => isUnlocked(puzzle, progress),
  };
}
