/**
 * The reveal.
 *
 * Timings come from the case data rather than being hard-coded here, so an
 * authored case can choreograph its own ending.
 *
 * Reduced motion is not a lesser path: the same words appear, all at once,
 * with no movement. Nobody misses the moment because of an accessibility setting.
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
  const [elapsed, setElapsed] = useState(reduced ? Number.MAX_SAFE_INTEGER : 0);

  useEffect(() => {
    if (reduced) return;

    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);

    return () => window.clearInterval(id);
  }, [reduced]);

  const finalStep = reveal.sequence[reveal.sequence.length - 1];
  const done = reduced || elapsed >= (finalStep?.at ?? 0) + 600;

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

  return (
    <section className="reveal">
      <div className="reveal__stage">
        {reveal.sequence.map((step, i) => {
          if (elapsed < step.at) return null;

          if (step.word) {
            return (
              <span key={i} className="reveal__word">
                {step.word}
              </span>
            );
          }

          if (step.title) {
            return (
              <h1 key={i} className="reveal__title">
                {step.title}
              </h1>
            );
          }

          return (
            <p key={i} className="reveal__line">
              {step.text}
            </p>
          );
        })}
      </div>

      {done && (
        <button type="button" className="reveal__continue" onClick={onContinue}>
          Continue
        </button>
      )}

      {!done && (
        <button type="button" className="reveal__skip" onClick={() => setElapsed(Number.MAX_SAFE_INTEGER)}>
          Skip
        </button>
      )}
    </section>
  );
}
