/**
 * Step 2: engine and case data only, no state layer.
 * Green here means the fault is in src/state. Red means it is deeper.
 */

import case000 from './data/case000';
import { validateCase } from './engine/validator';
import { scoreCase } from './engine/scoring';
import { createProgress } from './state/progress';

export default function App() {
  const progress = createProgress(case000);
  const report = validateCase(case000);
  const score = scoreCase(progress, case000);

  return (
    <main className="boot">
      <p className="boot__number">Case 000</p>
      <h1 className="boot__title">Identity unknown</h1>
      <p className="boot__note">
        {case000.puzzles.length} puzzles · {report.issues.length} issues ·
        score {score.total} · rank {score.rank}
      </p>
      <p className="boot__status">
        {progress.log.length} log entries at start.
      </p>
    </main>
  );
}
