/**
 * Step 4: the case shell. Evidence, log and notes, without the puzzle screen.
 */

import case000 from './data/case000';
import { useCase } from './state/useCase';
import CaseView from './ui/Case';

export default function App() {
  const game = useCase(case000);

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
      <p className="case__briefing">
        Current stage: {game.active ? game.active.title : 'none'}
      </p>
    </CaseView>
  );
}
