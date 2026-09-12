/**
 * The reveal.
 *
 * The words accumulate, then clear, then the title lands alone. The moment is
 * the transformation — four separate findings becoming one name — so the
 * stacked list must go before the title arrives, not sit above it.
 *
 * Reduced motion gets the same information with no movement.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Reveal } from '../engine/types';

interface Props {
  reveal: Reveal;
  onContinue: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function RevealView({ reveal, onContinue }: Props) {
  const reduced = useMemo(prefersReducedMotion, []);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const start = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - start), 80);
    return () => window.clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <section className="reveal reveal--static">
        <h1 className="reveal__title">{reveal.reducedMotionFallback.title}</h1>
        {reveal.reducedMotionFallback.lines.map((line) => (
          <p key={line} className="reveal__line">
            {line}
          </p>
        ))}
        <button type="button" className="reveal__continue" onClick={onContinue}>
          Continue
        </button>
      </section>
    );
  }

  const words = reveal.sequence.filter((s) => s.word);
  const titleStep = reveal.sequence.find((s) => s.title);
  const closingLines = reveal.sequence.filter((s) => s.text && s.at > 0);
  const opening = reveal.sequence.find((s) => s.text && s.at === 0);

  const titleAt = titleStep?.at ?? 3600;

  /* Phase 1: words appear one at a time.
     Phase 2: at titleAt they are gone and the title alone is on screen. */
  const inTitle = elapsed >= titleAt;
  const finished = elapsed >= titleAt + 2400;

  return (
    <section className="reveal">
      {!inTitle && (
        <div className="reveal__stage">
          {opening && elapsed >= opening.at && (
            <p className="reveal__opening">{opening.text}</p>
          )}
          {words.map(
            (step, i) =>
              elapsed >= step.at && (
                <span key={i} className="reveal__word">
                  {step.word}
                </span>
              ),
          )}
        </div>
      )}

      {inTitle && (
        <div className="reveal__stage">
          <h1 className="reveal__title">{titleStep?.title}</h1>

          {closingLines.map(
            (step, i) =>
              elapsed >= step.at && (
                <p key={i} className="reveal__line">
                  {step.text}
                </p>
              ),
          )}
        </div>
      )}

      {finished ? (
        <button type="button" className="reveal__continue" onClick={onContinue}>
          Continue
        </button>
      ) : (
        <button
          type="button"
          className="reveal__skip"
          onClick={() => setElapsed(titleAt + 2400)}
        >
          Skip
        </button>
      )}
    </section>
  );
}
