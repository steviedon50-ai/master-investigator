/**
 * Puzzle screen.
 *
 * One puzzle fills the screen. The document it depends on sits directly above
 * the input, so nobody has to hold a Morse group in their head while they
 * navigate somewhere else to type it.
 */

import { useEffect, useState } from 'react';
import type { HintLevel, InvestigationDocument, Puzzle } from '../engine/types';
import { validateResearchStep } from '../engine/puzzles';
import DocumentView from './Document';

interface ResearchStep {
  id: string;
  prompt: string;
  solution: string;
  acceptedAnswers: string[];
  initial: string;
}

interface Props {
  puzzle: Puzzle;
  stageCount: number;
  document: InvestigationDocument | null;
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

export default function PuzzleView({
  puzzle,
  stageCount,
  document,
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

  // A new puzzle means a clean slate, otherwise the previous answer lingers.
  useEffect(() => {
    setAnswer('');
    setError('');
    setHintsOpen(false);
  }, [puzzle.id]);

  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
  const isResearch = puzzle.type === 'research.chain';
  const isInspection = puzzle.type === 'inspection';

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
                  <span className={`pz__step-mark${done ? ' pz__step-mark--done' : ''}`}>
                    {done ? '✓' : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isInspection && (
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

      <button type="button" className="pz__submit" onClick={handleSubmit}>
        {isInspection ? 'I have examined everything' : 'Check answer'}
      </button>

      {outcome && !outcome.correct && (
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
            {hintsUsed.length > 0 ? `${hintsUsed.length} used` : `${puzzle.hints.length} available`}
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
