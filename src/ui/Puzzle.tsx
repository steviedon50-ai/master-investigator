/**
 * Puzzle screen.
 *
 * One puzzle fills the screen. Whatever the puzzle depends on — a document,
 * a piece of ciphertext, or the words recovered so far — is shown directly
 * above the input. Puzzles needing a choice rather than a typed answer get
 * their own control.
 */

import { useEffect, useState } from 'react';
import type {
  Evidence,
  Fragment,
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
  fragments: Fragment[];
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

/**
 * Fixed shuffle: the same four words in the same wrong order for every player,
 * every time. A shuffle that changed on each visit would make the puzzle feel
 * arbitrary rather than set.
 */
function shuffled(fragments: Fragment[]): Fragment[] {
  return [...fragments].sort((a, b) => {
    const key = (f: Fragment): number => (f.slot * 7919) % 11;
    return key(a) - key(b);
  });
}

export default function PuzzleView({
  puzzle,
  stageCount,
  document,
  evidence,
  fragments,
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
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setAnswer('');
    setError('');
    setHintsOpen(false);
    setCopied(null);
  }, [puzzle.id]);

  const steps = (puzzle.data.steps as ResearchStep[] | undefined) ?? [];
  const isResearch = puzzle.type === 'research.chain';
  const isInspection = puzzle.type === 'inspection';
  const isContradiction = puzzle.type === 'deduction.contradiction';
  const isMeta = puzzle.type === 'meta.assembly';

  const ciphertext =
    typeof puzzle.data.ciphertext === 'string' ? puzzle.data.ciphertext : null;

  const copyPrompt = async (step: ResearchStep): Promise<void> => {
    try {
      await navigator.clipboard.writeText(step.prompt);
      setCopied(step.id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked. Nothing useful to offer, so say nothing.
    }
  };

  const addWord = (word: string): void => {
    setAnswer((current) => (current ? `${current} ${word}` : word));
    if (error) setError('');
    if (outcome) onClearOutcome();
  };

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

      {isMeta && fragments.length > 0 && (
        <div className="pz__fragments">
          <p className="pz__label">Words you have recovered</p>
          <ul className="pz__fragment-list">
            {shuffled(fragments).map((fragment) => (
              <li key={fragment.slot}>
                <button
                  type="button"
                  className="pz__fragment"
                  onClick={() => addWord(fragment.word)}
                >
                  {fragment.word}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="pz__clear"
            onClick={() => setAnswer('')}
          >
            Clear
          </button>
        </div>
      )}

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
          <p className="pz__note">
            Copy a clue to look it up elsewhere, then come back. Your progress is saved.
          </p>

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
                  <button
                    type="button"
                    className="pz__copy"
                    onClick={() => void copyPrompt(step)}
                    aria-label={`Copy clue: ${step.prompt}`}
                  >
                    {copied === step.id ? 'Copied' : 'Copy'}
                  </button>
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
            placeholder={isMeta ? 'Tap the words, or type it' : 'Enter the word'}
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
