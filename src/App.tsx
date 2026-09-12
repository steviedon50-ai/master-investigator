/**
 * The game.
 *
 * A correct answer holds on a confirmation screen before moving on, so the
 * player gets the moment and the explanation rather than a jump cut.
 */

import { useState } from 'react';
import case000 from './data/case000';
import { useCase } from './state/useCase';
import CaseView from './ui/Case';
import PuzzleView from './ui/Puzzle';
import RevealView from './ui/Reveal';
import Solved from './ui/Solved';
import type { Puzzle } from './engine/types';

export default function App() {
  const game = useCase(case000);
  const [showReveal, setShowReveal] = useState(false);
  const [justSolved, setJustSolved] = useState<Puzzle | null>(null);

  if (showReveal && case000.reveal) {
    return (
      <RevealView reveal={case000.reveal} onContinue={() => setShowReveal(false)} />
    );
  }

  const puzzle = game.active;

  return (
    <CaseView
      investigation={case000}
      progress={game.progress}
      evidence={game.evidence}
      percent={game.percent}
      score={game.score.total}
      onInspect={game.inspect}
      onAddNote={game.addNote}
      onDeleteNote={game.deleteNote}
    >
      {justSolved ? (
        <Solved
          puzzle={justSolved}
          fragment={justSolved.rewards.fragment}
          hintsUsed={game.hintsUsedFor(justSolved.id).length}
          onContinue={() => setJustSolved(null)}
        />
      ) : puzzle ? (
        <PuzzleView
          puzzle={puzzle}
          stageCount={case000.puzzles.length}
          document={game.documentFor(puzzle.data.documentId as string | undefined)}
          evidence={game.evidence}
          hintsUsed={game.hintsUsedFor(puzzle.id)}
          stepAnswers={game.progress.puzzles[puzzle.id]?.stepAnswers ?? {}}
          outcome={game.lastOutcome}
          onSubmit={(answer) => {
            const result = game.submitAnswer(puzzle, answer);
            if (!result.correct) return;

            if (puzzle.type === 'meta.assembly') {
              setShowReveal(true);
            } else {
              setJustSolved(puzzle);
            }
          }}
          onAnswerStep={(stepId, answer) => game.answerStep(puzzle.id, stepId, answer)}
          onUseHint={(level) => game.useHint(puzzle, level)}
          onClearOutcome={game.clearOutcome}
        />
      ) : (
        <section className="pz">
          <h2 className="pz__title">Case closed</h2>
          <p className="pz__description">
            {game.score.rank} · {game.score.total} out of 100
          </p>
          <button type="button" className="pz__submit" onClick={game.restart}>
            Start again
          </button>
        </section>
      )}
    </CaseView>
  );
}
