/**
 * Step 1 of reintroducing the game: exercise the state layer alone.
 * If this builds, the hook and reducer are sound and the fault is in a
 * UI component. If it fails, the fault is below the UI.
 */

import case000 from './data/case000';
import { useCase } from './state/useCase';

export default function App() {
  const game = useCase(case000);

  return (
    <main className="boot">
      <p className="boot__number">Case 000</p>
      <h1 className="boot__title">Identity unknown</h1>

      <p className="boot__note">
        {game.evidence.length} items visible · {game.percent}% complete ·
        score {game.score.total}
      </p>

      <p className="boot__status">
        Current stage: {game.active ? game.active.title : 'none'}
      </p>

      <button type="button" className="notes__add" onClick={() => game.inspect('ev-telegram')}>
        Inspect the telegram
      </button>
    </main>
  );
}
