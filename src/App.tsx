/**
 * Temporary harness. Runs the validator against Case 000 and shows the result.
 * This is scaffolding — the title screen replaces it once the case passes.
 */

import case000 from './data/case000';
import { validateCase } from './engine/validator';

export default function App() {
  const report = validateCase(case000);
  const errors = report.issues.filter((i) => i.severity === 'error');
  const warnings = report.issues.filter((i) => i.severity === 'warning');

  return (
    <main className="boot">
      <p className="boot__number">Case 000</p>
      <h1 className="boot__title">Identity unknown</h1>

      <p className="boot__note">
        {case000.puzzles.length} puzzles, {case000.evidence.length} items of
        evidence, {case000.documents.length} documents.
      </p>

      <p className="boot__status">
        {report.valid ? 'Case validates.' : `${errors.length} errors.`}
      </p>

      {report.issues.length > 0 && (
        <ul>
          {report.issues.map((issue, i) => (
            <li key={i}>
              {issue.severity}: {issue.code} — {issue.message}
            </li>
          ))}
        </ul>
      )}

      {report.valid && warnings.length === 0 && (
        <p className="boot__note">No warnings either.</p>
      )}
    </main>
  );
}
