/**
 * The game.
 *
 * Three states: the title screen before you begin, the investigation itself,
 * and the reveal once the final answer lands.
 */

import { useState } from 'react';
import case000 from './data/case000';
import { useCase } from './state/useCase';
import CaseView from './ui/Case';
import PuzzleView from './ui/Puzzle';
import RevealView from './ui/Reveal';

type Screen = 'title' | 'playing' | 'reveal';

export default function App() {
  const game = useCase(case000);

  // Resume straight into the case if there is progress to resume.
  const started = game.progress.log.length > 1 || game.percent > 0;
  const [screen, setScreen] = useState<Screen>(
    game.progress.completedAt ? 'reveal' : started ? 'playing' : 'title',
  );

  if (screen === 'title') {
    return (
      <main className="boot">
        <p className="boot__number">Case 000</p>
        <h1 className="boot__title">Identity unknown</h1>
        <p className="boot__note">
          A dossier was left for you. No covering letter, no sender, no case name —
          only a number.
        </p>
        <button
          type="button"
          className="reveal__continue"
          onClick={() => setScreen('playing')}
        >
          Begin investigation
        </button>
        <p className="boot__status">
          Seven stages · about {case000.caseFile.estimatedMinutes} minutes
        </p>
      </main>
    );
  }

  if (screen === 'reveal' && case000.reveal) {
    return (
      <RevealView
        reveal={case000.reveal}
        onContinue={() => setScreen('playing')}
      />
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
      {puzzle ? (
        <PuzzleView
          puzzle={puzzle}
          stageCount={case000.puzzles.length}
          document={game.documentFor(puzzle.data.documentId as string | undefined)}
          hintsUsed={game.hintsUsedFor(puzzle.id)}
          stepAnswers={game.progress.puzzles[puzzle.id]?.stepAnswers ?? {}}
          outcome={game.lastOutcome}
          onSubmit={(answer) => {
            const result = game.submitAnswer(puzzle, answer);
            if (result.correct && puzzle.type === 'meta.assembly') {
              setScreen('reveal');
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
