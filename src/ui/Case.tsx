/**
 * Case shell.
 *
 * Mobile-first: one section at a time, chosen from the bottom bar.
 * Tapping evidence opens it full-screen over everything else.
 */

import { useState } from 'react';
import type {
  CaseProgress,
  Evidence,
  EvidenceStatus,
  Investigation,
  LogEntry,
} from '../engine/types';
import EvidenceDetail from './EvidenceDetail';

type Tab = 'case' | 'evidence' | 'log' | 'notes';

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  unresolved: 'Unresolved',
  confirmed: 'Confirmed',
  plausible: 'Plausible',
  contradicted: 'Contradicted',
  'red-herring': 'Red herring',
};

/* Status is never carried by colour alone — each has a mark and a word. */
const STATUS_MARK: Record<EvidenceStatus, string> = {
  unresolved: '·',
  confirmed: '✓',
  plausible: '~',
  contradicted: '!',
  'red-herring': '✕',
};

function clockOf(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function textOf(value: { fallback: string } | string): string {
  return typeof value === 'string' ? value : value.fallback;
}

interface Props {
  investigation: Investigation;
  progress: CaseProgress;
  evidence: Evidence[];
  percent: number;
  score: number;
  children: React.ReactNode;
  onInspect: (evidenceId: string) => void;
  onAddNote: (body: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function CaseView({
  investigation,
  progress,
  evidence,
  percent,
  score,
  children,
  onInspect,
  onAddNote,
  onDeleteNote,
}: Props) {
  const [tab, setTab] = useState<Tab>('case');
  const [draft, setDraft] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const total = investigation.evidence.length;
  const open = evidence.find((e) => e.id === openId) ?? null;

  const openEvidence = (id: string): void => {
    onInspect(id);
    setOpenId(id);
  };

  if (open) {
    return (
      <EvidenceDetail
        evidence={open}
        document={
          investigation.documents.find((d) => d.id === open.documentId) ?? null
        }
        status={progress.evidenceStatus[open.id] ?? 'unresolved'}
        onClose={() => setOpenId(null)}
      />
    );
  }

  return (
    <div className="case">
      <header className="case__bar">
        <div>
          <p className="case__number">{textOf(investigation.caseFile.strapline)}</p>
          <h1 className="case__name">{textOf(investigation.caseFile.title)}</h1>
        </div>
        <div className="case__score">
          <span className="case__score-value">{score}</span>
          <span className="case__score-percent">{percent}%</span>
        </div>
      </header>

      <div
        className="case__progress"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="case__progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <main className="case__body">
        {tab === 'case' && <section className="case__panel">{children}</section>}

        {tab === 'evidence' && (
          <section className="case__panel">
            <p className="case__heading">
              Evidence · {evidence.length} of {total}
            </p>
            <ul className="ev">
              {evidence.map((item) => {
                const status = progress.evidenceStatus[item.id] ?? 'unresolved';
                const seen = progress.inspectedEvidence.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="ev__item"
                      onClick={() => openEvidence(item.id)}
                    >
                      <span className="ev__name">{item.name}</span>
                      <span className="ev__summary">{item.summary}</span>
                      <span className="ev__meta">
                        <span className={`ev__status ev__status--${status}`}>
                          <span aria-hidden="true">{STATUS_MARK[status]}</span>{' '}
                          {STATUS_LABEL[status]}
                        </span>
                        {!seen && <span className="ev__unread">Not yet examined</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'log' && (
          <section className="case__panel">
            <p className="case__heading">Investigation log</p>
            <ul className="log">
              {[...progress.log].reverse().map((entry: LogEntry, i) => (
                <li key={`${entry.at}-${i}`} className="log__entry">
                  <span className="log__time">{clockOf(entry.at)}</span>
                  <span className="log__label">{entry.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'notes' && (
          <section className="case__panel">
            <p className="case__heading">Notes</p>
            <textarea
              className="notes__input"
              value={draft}
              placeholder="What have you noticed?"
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="button"
              className="notes__add"
              onClick={() => {
                if (draft.trim().length === 0) return;
                onAddNote(draft.trim());
                setDraft('');
              }}
            >
              Add note
            </button>

            <ul className="notes">
              {progress.notes.map((note) => (
                <li key={note.id} className="notes__item">
                  <p className="notes__body">{note.body}</p>
                  <button
                    type="button"
                    className="notes__delete"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    Delete
                  </button>
                </li>
              ))}
              {progress.notes.length === 0 && (
                <li className="notes__empty">Anything you write here saves as you go.</li>
              )}
            </ul>
          </section>
        )}
      </main>

      <nav className="case__nav">
        {(['case', 'evidence', 'log', 'notes'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`case__tab${tab === id ? ' case__tab--active' : ''}`}
            onClick={() => setTab(id)}
            aria-current={tab === id}
          >
            {id === 'case'
              ? 'Case'
              : id === 'evidence'
                ? 'Evidence'
                : id === 'log'
                  ? 'Log'
                  : 'Notes'}
          </button>
        ))}
      </nav>
    </div>
  );
}
