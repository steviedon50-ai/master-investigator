/**
 * Puzzle screen.
 *
 * One puzzle fills the screen. Whatever the puzzle depends on — a document,
 * or a bare piece of ciphertext — is shown directly above the input.
 * Puzzles that need a choice rather than a typed answer get their own control.
 */

import { useEffect, useState } from 'react';
import type {
  Evidence,
  HintLevel,
  InvestigationDocument,
  Puzzle,
} from '../engine/types';
import { validateResearchStep } from '../engine/puzzles';
import DocumentView from './Document';
import Contradiction from './Contradiction';

interface ResearchStep {
  id: string;
  prompt: string;
  solution: string;
  acceptedAnswers: string[];
  initial: string;
}

interface ReasonOption {
  id: string;
  label: string;
}

interface Props {
  puzzle: Puzzle;
  stageCount: number;
  document: InvestigationDocument | null;
  evidence: Evidence[];
  hintsUsed: HintLevel[];
  stepAnswers: Record<string, string>;
  outcome: { correct: boolean; approximate: boolean; feedback?: string } | null;
  onSubmit: (answer: string) => void;
  onAnswerStep: (stepId: string, answer: string) => void;
  onUseHint: (level: HintLevel) => void;
  onClearOutcome: () => void;
}

const HINT_LABELS: Record<HintLevel, string> = {
  direction: 'Direction',
  technique: 'Technique',
  strong: 'Strong hint',
  reveal: 'Reveal the answer',
};

/** Opens a search in a new tab. Leaving the game is safe — progress persists. */
function searchUrl(query: string): string {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

export default function PuzzleView({
  puzzle,
  stageCount,
  document,
  evidence,
  hintsUsed,
  stepAnswers,
  outcome,
  onSubmit,
  onAnswerStep,
  onUseHint,
  onClearOutcome,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [hintsOpen, setHintsOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAnswer('');
    setError('');
    setHintsOpen(false);
  }, [puzzle.id]);

  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
  const isResearch = puzzle.type === 'research.chain';
  const isInspection = puzzle.type === 'inspection';
  const isContradiction = puzzle.type === 'deduction.contradiction';

  const ciphertext =
    typeof puzzle.data.ciphertext === 'string' ? puzzle.data.ciphertext : null;

  const handleSubmit = (): void => {
    if (!isInspection && answer.trim().length === 0) {
      setError('Enter an answer first.');
      return;
    }
    setError('');
    onSubmit(answer.trim());
  };

  const revealed = puzzle.hints.filter((h) => hintsUsed.includes(h.level));

  return (
    <section className="pz">
      <p className="pz__stage">
        Stage {puzzle.stage} of {stageCount}
      </p>

      <h2 className="pz__title">{puzzle.title}</h2>
      <p className="pz__description">{puzzle.description}</p>

      {document && <DocumentView document={document} inline />}

      {!document && ciphertext && <p className="pz__cipher">{ciphertext}</p>}

      {isContradiction && (
        <Contradiction
          evidence={evidence}
          selectFrom={(puzzle.data.selectFrom as string[] | undefined) ?? []}
          reasonOptions={(puzzle.data.reasonOptions as ReasonOption[] | undefined) ?? []}
          onSubmit={onSubmit}
          feedback={outcome && !outcome.correct ? outcome.feedback : undefined}
        />
      )}

      {isResearch && (
        <div className="pz__steps">
          {steps.map((step, index) => {
            const given = stepAnswers[step.id] ?? '';
            const done = given.length > 0 && validateResearchStep(puzzle, step.id, given);
            return (
              <div key={step.id} className="pz__step">
                <label className="pz__step-prompt" htmlFor={`step-${step.id}`}>
                  <span className="pz__step-number">{index + 1}</span>
                  {step.prompt}
                </label>
                <div className="pz__step-row">
                  <input
                    id={`step-${step.id}`}
                    type="text"
                    className="pz__input"
                    value={given}
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Name"
                    onChange={(e) => onAnswerStep(step.id, e.target.value)}
                  />
                  <a
                    className="pz__search"
                    href={searchUrl(step.prompt)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Search for: ${step.prompt}`}
                  >
                    Search
                  </a>
                  <span className={`pz__step-mark${done ? ' pz__step-mark--done' : ''}`}>
                    {done ? '✓' : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isInspection && !isContradiction && (
        <div className="pz__answer">
          <label className="pz__label" htmlFor="answer">
            {isResearch ? 'The four initials spell' : 'Your answer'}
          </label>
          <input
            id="answer"
            type="text"
            className="pz__input"
            value={answer}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Enter the word"
            onChange={(e) => {
              setAnswer(e.target.value);
              if (error) setError('');
              if (outcome) onClearOutcome();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
          {error && <p className="pz__error">{error}</p>}
        </div>
      )}

      {!isContradiction && (
        <button type="button" className="pz__submit" onClick={handleSubmit}>
          {isInspection ? 'I have examined everything' : 'Check answer'}
        </button>
      )}

      {!isContradiction && outcome && !outcome.correct && (
        <p className="pz__feedback" role="status">
          {outcome.feedback ?? 'Not that. Look again.'}
        </p>
      )}

      <div className="pz__hints">
        <button
          type="button"
          className="pz__hints-toggle"
          onClick={() => setHintsOpen((open) => !open)}
          aria-expanded={hintsOpen}
        >
          Hints
          <span className="pz__hints-count">
            {hintsUsed.length > 0
              ? `${hintsUsed.length} used`
              : `${puzzle.hints.length} available`}
          </span>
        </button>

        {hintsOpen && (
          <ul className="pz__hint-list">
            {puzzle.hints.map((hint) => {
              const used = hintsUsed.includes(hint.level);
              return (
                <li key={hint.level} className="pz__hint">
                  {used ? (
                    <p className="pz__hint-text">{hint.text}</p>
                  ) : (
                    <button
                      type="button"
                      className="pz__hint-button"
                      onClick={() => onUseHint(hint.level)}
                    >
                      <span>{HINT_LABELS[hint.level]}</span>
                      <span className="pz__hint-cost">−{hint.penalty}%</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!hintsOpen && revealed.length > 0 && (
          <ul className="pz__hint-list">
            {revealed.map((hint) => (
              <li key={hint.level} className="pz__hint">
                <p className="pz__hint-text">{hint.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
