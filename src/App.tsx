/**
 * Temporary harness: does the generator actually produce valid cases?
 * Generates a spread of cases for one investigator and reports the results.
 */

import { generateCase, GENERATOR_VERSION } from './engine/generator';
import { validateCase } from './engine/validator';
import { difficultyFor } from './engine/cases';

interface Row {
  caseNumber: number;
  ok: boolean;
  title: string;
  errors: string[];
}

export default function App() {
  const investigatorId = 'MI-TEST-01';
  const rows: Row[] = [];

  for (let caseNumber = 1; caseNumber <= 12; caseNumber += 1) {
    const candidate = generateCase({
      investigatorId,
      caseNumber,
      difficulty: difficultyFor(caseNumber),
      generatorVersion: GENERATOR_VERSION,
    });

    if (!candidate) {
      rows.push({
        caseNumber,
        ok: false,
        title: '—',
        errors: ['generator returned null'],
      });
      continue;
    }

    const report = validateCase(candidate);
    const title =
      typeof candidate.caseFile.title === 'string'
        ? candidate.caseFile.title
        : candidate.caseFile.title.fallback;

    rows.push({
      caseNumber,
      ok: report.valid,
      title,
      errors: report.issues
        .filter((i) => i.severity === 'error')
        .map((i) => `${i.code}: ${i.message}`),
    });
  }

  const passed = rows.filter((r) => r.ok).length;

  return (
    <main className="boot">
      <p className="boot__number">Generator test</p>
      <h1 className="boot__title">
        {passed} of {rows.length} valid
      </h1>

      <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0 0' }}>
        {rows.map((row) => (
          <li key={row.caseNumber} style={{ marginBottom: '1.25rem' }}>
            <p style={{ margin: 0, color: row.ok ? '#5dcaa5' : '#e2726a' }}>
              Case {String(row.caseNumber).padStart(3, '0')} — {row.ok ? 'valid' : 'failed'} —{' '}
              {row.title}
            </p>
            {row.errors.map((error, i) => (
              <p
                key={i}
                style={{
                  margin: '0.25rem 0 0 1rem',
                  fontSize: '0.8rem',
                  color: '#8e948f',
                }}
              >
                {error}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </main>
  );
}
