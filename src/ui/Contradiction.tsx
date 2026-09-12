/**
 * Contradiction puzzle.
 *
 * Two choices rather than a text box: which source is wrong, and why.
 * The reason matters as much as the source — spotting that something is off
 * is worth little if you cannot say what is off about it.
 */

import { useState } from 'react';
import type { Evidence } from '../engine/types';

interface ReasonOption {
  id: string;
  label: string;
}

interface Props {
  evidence: Evidence[];
  selectFrom: string[];
  reasonOptions: ReasonOption[];
  onSubmit: (answer: string) => void;
  feedback?: string;
}

export default function Contradiction({
  evidence,
  selectFrom,
  reasonOptions,
  onSubmit,
  feedback,
}: Props) {
  const [source, setSource] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState('');

  const options = selectFrom
    .map((id) => evidence.find((e) => e.id === id))
    .filter((e): e is Evidence => e !== undefined);

  const handleSubmit = (): void => {
    if (!source) {
      setError('Choose the source you think is unreliable.');
      return;
    }
    if (!reason) {
      setError('Say what is wrong with it.');
      return;
    }
    setError('');
    onSubmit(`${source}|${reason}`);
  };

  return (
    <div className="contra">
      <p className="contra__label">The unreliable source</p>
      <ul className="contra__options">
        {options.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`contra__option${source === item.id ? ' contra__option--on' : ''}`}
              onClick={() => {
                setSource(item.id);
                setError('');
              }}
              aria-pressed={source === item.id}
            >
              <span className="contra__option-name">{item.name}</span>
              <span className="contra__option-summary">{item.summary}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="contra__label">What is wrong with it</p>
      <ul className="contra__options">
        {reasonOptions.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={`contra__reason${reason === option.id ? ' contra__reason--on' : ''}`}
              onClick={() => {
                setReason(option.id);
                setError('');
              }}
              aria-pressed={reason === option.id}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="pz__error">{error}</p>}

      <button type="button" className="pz__submit" onClick={handleSubmit}>
        Submit finding
      </button>

      {feedback && (
        <p className="pz__feedback" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
