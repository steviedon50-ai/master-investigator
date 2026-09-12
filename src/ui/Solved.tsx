/**
 * Solved confirmation.
 *
 * Shown between stages. This is the only place the explanation appears, and
 * it is the actual teaching moment: the player has just done the thing, so
 * now is when being told why it worked sticks.
 */

import type { Fragment, Puzzle } from '../engine/types';

interface Props {
  puzzle: Puzzle;
  fragment: Fragment | undefined;
  hintsUsed: number;
  onContinue: () => void;
}

export default function Solved({ puzzle, fragment, hintsUsed, onContinue }: Props) {
  return (
    <section className="solved">
      <p className="solved__mark">Solved</p>

      {fragment ? (
        <>
          <p className="solved__label">Word {fragment.slot} of 4 recovered</p>
          <p className="solved__word">{fragment.word}</p>
        </>
      ) : (
        <h2 className="solved__title">{puzzle.title}</h2>
      )}

      <p className="solved__explanation">{puzzle.explanation}</p>

      {hintsUsed === 0 && <p className="solved__clean">No hints used.</p>}

      <button type="button" className="solved__continue" onClick={onContinue}>
        Continue
      </button>
    </section>
  );
}
