/**
 * The game.
 *
 * Title, case file, play, reveal, results. A returning player skips straight
 * back to where they were; a finished player lands on their score.
 */

import { useState } from 'react';
import case000 from './data/case000';
import { useCase } from './state/useCase';
import CaseView from './ui/Case';
import CaseFileView from './ui/CaseFile';
import PuzzleView from './ui/Puzzle';
import Results from './ui/Results';
import RevealView from './ui/Reveal';
import Solved from './ui/Solved';
import Title from './ui/Title';
import type { Puzzle } from './engine/types';

type Screen = 'title' | 'casefile' | 'playing' | 'reveal' | 'results';

function textOf(value: { fallback: string } | string): string {
  return typeof value === 'string' ? value : value.fallback;
}

export default function App() {
  const game = useCase(case000);

  const returning =
    game.progress.inspectedEvidence.length > 0 ||
    Object.keys(game.progress.puzzles).length > 0;

  const [screen, setScreen] = useState<Screen>(
    game.complete ? 'results' : returning ? 'playing' : 'title',
  );
  const [justSolved, setJustSolved] = useState<Puzzle | null>(null);

  if (screen === 'title') {
    return (
      <Title
        onBegin={() => setScreen('casefile')}
        estimatedMinutes={case000.caseFile.estimatedMinutes}
        stageCount={case000.puzzles.length}
      />
    );
  }

  if (screen === 'casefile') {
    return (
      <CaseFileView
        caseFile={case000.caseFile}
        stageCount={case000.puzzles.length}
        evidenceCount={case000.evidence.length}
        onOpen={() => setScreen('playing')}
      />
    );
  }

  if (screen === 'reveal' && case000.reveal) {
    return (
      <RevealView reveal={case000.reveal} onContinue={() => setScreen('results')} />
    );
  }

  if (screen === 'results') {
    return (
      <Results
        score={game.score}
        caseTitle={textOf(case000.caseFile.title)}
        onRestart={game.restart}
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
      onRestart={game.restart}
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
          fragments={game.progress.fragments}
          hintsUsed={game.hintsUsedFor(puzzle.id)}
          stepAnswers={game.progress.puzzles[puzzle.id]?.stepAnswers ?? {}}
          outcome={game.lastOutcome}
          onSubmit={(answer) => {
            const result = game.submitAnswer(puzzle, answer);
            if (!result.correct) return;

            if (puzzle.type === 'meta.assembly') {
              setScreen('reveal');
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
          <button
            type="button"
            className="pz__submit"
            onClick={() => setScreen('results')}
          >
            See your results
          </button>
        </section>
      )}
    </CaseView>
  );
}
