/**
 * Case file.
 *
 * Shown once, before the first stage. The briefing lives here rather than
 * above every puzzle — it is read once and then referred back to, which is
 * how a real case file works.
 */

import type { CaseFile as CaseFileData } from '../engine/types';

function textOf(value: { fallback: string } | string): string {
  return typeof value === 'string' ? value : value.fallback;
}

interface Props {
  caseFile: CaseFileData;
  stageCount: number;
  evidenceCount: number;
  onOpen: () => void;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  apprentice: 'Apprentice',
  investigator: 'Investigator',
  expert: 'Expert',
  master: 'Master',
  black: 'Black',
};

export default function CaseFileView({
  caseFile,
  stageCount,
  evidenceCount,
  onOpen,
}: Props) {
  return (
    <main className="cf">
      <div className="cf__inner">
        <p className="cf__number">{textOf(caseFile.strapline)}</p>
        <h1 className="cf__title">{textOf(caseFile.title)}</h1>

        <dl className="cf__facts">
          <div>
            <dt>Difficulty</dt>
            <dd>{DIFFICULTY_LABEL[caseFile.difficulty] ?? caseFile.difficulty}</dd>
          </div>
          <div>
            <dt>Stages</dt>
            <dd>{stageCount}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{evidenceCount} items</dd>
          </div>
          <div>
            <dt>Estimated</dt>
            <dd>{caseFile.estimatedMinutes} min</dd>
          </div>
        </dl>

        <p className="cf__briefing">{textOf(caseFile.briefing)}</p>

        <p className="cf__heading">Objectives</p>
        <ul className="cf__objectives">
          {caseFile.objectives.map((objective) => (
            <li key={objective.id}>{objective.label}</li>
          ))}
        </ul>

        <button type="button" className="cf__open" onClick={onOpen}>
          Open the dossier
        </button>
      </div>
    </main>
  );
}
