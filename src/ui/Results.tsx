/**
 * Results.
 *
 * Shown once the case is closed. The five dimensions the blueprint asks for,
 * with the rank as the headline — and each dimension explained in a word, so
 * a low score tells you what to do differently rather than just that you failed.
 */

import type { ScoreBreakdown } from '../engine/types';

interface Props {
  score: ScoreBreakdown;
  caseTitle: string;
  onRestart: () => void;
}

const DIMENSIONS: Array<{
  key: keyof Pick<ScoreBreakdown, 'accuracy' | 'reasoning' | 'research' | 'efficiency'>;
  label: string;
  note: string;
}> = [
  { key: 'accuracy', label: 'Accuracy', note: 'How cleanly you answered' },
  { key: 'reasoning', label: 'Reasoning', note: 'Red herrings and contradictions' },
  { key: 'research', label: 'Research', note: 'Answers found without revealing' },
  { key: 'efficiency', label: 'Efficiency', note: 'Time and restraint with hints' },
];

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function Results({ score, caseTitle, onRestart }: Props) {
  return (
    <main className="res">
      <div className="res__inner">
        <p className="res__label">Case closed</p>
        <h1 className="res__case">{caseTitle}</h1>

        <p className="res__rank">{score.rank}</p>

        <p className="res__total">
          <span className="res__total-value">{score.total}</span>
          <span className="res__total-max">/ 100</span>
        </p>

        <ul className="res__dimensions">
          {DIMENSIONS.map((dimension) => {
            const value = score[dimension.key];
            return (
              <li key={dimension.key} className="res__dimension">
                <div className="res__dimension-head">
                  <span className="res__dimension-label">{dimension.label}</span>
                  <span className="res__dimension-value">{value}</span>
                </div>
                <div className="res__bar">
                  <div className="res__bar-fill" style={{ width: `${value}%` }} />
                </div>
                <p className="res__dimension-note">{dimension.note}</p>
              </li>
            );
          })}
        </ul>

        <dl className="res__facts">
          <div>
            <dt>Time taken</dt>
            <dd>{duration(score.timeSeconds)}</dd>
          </div>
          <div>
            <dt>Bonuses</dt>
            <dd>+{score.bonuses}</dd>
          </div>
          <div>
            <dt>Hints</dt>
            <dd>−{score.hintPenalty}</dd>
          </div>
          <div>
            <dt>Wrong answers</dt>
            <dd>−{score.wrongAnswerPenalty}</dd>
          </div>
        </dl>

        <p className="res__next">
          Your real cases are next. Every one is generated for you alone — the
          same case number, a different investigation.
        </p>

        <button type="button" className="res__again" onClick={onRestart}>
          Investigate again
        </button>
      </div>
    </main>
  );
}
