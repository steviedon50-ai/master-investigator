/**
 * The game.
 *
 * Case 000 is authored and identical for everyone. From 001 the case is
 * generated from this player's own seed, so the same case number is a
 * different investigation for every investigator.
 */

import { useMemo, useState } from 'react';
import { caseFor } from './engine/cases';
import { useCase } from './state/useCase';
import {
  completeCase,
  loadJourney,
  openCase,
  resetJourney,
  type Journey,
} from './state/journey';
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
  const [journey, setJourney] = useState<Journey>(loadJourney);

  // The case is generated once per case number, not on every render —
  // generation walks the knowledge base and is not free.
  const investigation = useMemo(
    () => caseFor(journey.investigatorId, journey.current).investigation,
    [journey.investigatorId, journey.current],
  );

  const game = useCase(investigation);

  const isTutorial = journey.current === 0;

  const returning =
    game.progress.inspectedEvidence.length > 0 ||
    Object.keys(game.progress.puzzles).length > 0;

  const [screen, setScreen] = useState<Screen>(
    game.complete ? 'results' : returning ? 'playing' : 'title',
  );
  const [justSolved, setJustSolved] = useState<Puzzle | null>(null);

  const finish = (): void => {
    setJourney((current) => completeCase(current, current.current));
  };

  const nextCase = (): void => {
    setJourney((current) => openCase(current, current.current + 1));
    setScreen('title');
    setJustSolved(null);
  };

  if (screen === 'title') {
    return (
      <Title
        onBegin={() => setScreen('casefile')}
        estimatedMinutes={investigation.caseFile.estimatedMinutes}
        stageCount={investigation.puzzles.length}
        caseNumber={journey.current}
        caseTitle={isTutorial ? null : textOf(investigation.caseFile.title)}
      />
    );
  }

  if (screen === 'casefile') {
    return (
      <CaseFileView
        caseFile={investigation.caseFile}
        stageCount={investigation.puzzles.length}
        evidenceCount={investigation.evidence.length}
        onOpen={() => setScreen('playing')}
      />
    );
  }

  if (screen === 'reveal' && investigation.reveal) {
    return (
      <RevealView
        reveal={investigation.reveal}
        onContinue={() => setScreen('results')}
      />
    );
  }

  if (screen === 'results') {
    return (
      <Results
        score={game.score}
        caseTitle={textOf(investigation.caseFile.title)}
        onRestart={game.restart}
        onNext={nextCase}
      />
    );
  }

  const puzzle = game.active;

  return (
    <CaseView
      investigation={investigation}
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
          stageCount={investigation.puzzles.length}
          document={game.documentFor(puzzle.data.documentId as string | undefined)}
          evidence={game.evidence}
          fragments={game.progress.fragments}
          hintsUsed={game.hintsUsedFor(puzzle.id)}
          stepAnswers={game.progress.puzzles[puzzle.id]?.stepAnswers ?? {}}
          outcome={game.lastOutcome}
          onSubmit={(answer) => {
            const result = game.submitAnswer(puzzle, answer);
            if (!result.correct) return;

            const last = puzzle.nextPuzzles.length === 0;

            if (puzzle.type === 'meta.assembly') {
              finish();
              setScreen('reveal');
            } else if (last) {
              finish();
              setJustSolved(puzzle);
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
