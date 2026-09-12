/**
 * Case file.
 *
 * The same folder from the title screen, now open on the same desk. Continuity
 * matters more than novelty here — the player should feel they opened the thing
 * they were just looking at, not that they moved to a different screen.
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
    <main className="desk desk--open">
      <article className="folder folder--open">
        <div className="folder__tab" aria-hidden="true">
          <span className="folder__tab-text">000</span>
        </div>

        <div className="folder__body">
          <header className="sheet__head">
            <p className="sheet__ref">{textOf(caseFile.strapline)}</p>
            <h1 className="sheet__title">{textOf(caseFile.title)}</h1>
          </header>

          {/* Typed on a form, as a real file jacket would be. */}
          <dl className="sheet__facts">
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

          <p className="sheet__briefing">{textOf(caseFile.briefing)}</p>

          <p className="sheet__heading">Objectives</p>
          <ul className="sheet__objectives">
            {caseFile.objectives.map((objective) => (
              <li key={objective.id}>{objective.label}</li>
            ))}
          </ul>

          <p className="sheet__filed" aria-hidden="true">
            FILED — NO SENDER RECORDED
          </p>
        </div>
      </article>

      <button type="button" className="desk__begin" onClick={onOpen}>
        Open the dossier
      </button>
    </main>
  );
}
