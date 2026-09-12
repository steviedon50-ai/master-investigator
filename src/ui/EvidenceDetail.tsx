/**
 * Evidence detail.
 *
 * Opens over the case as a full-screen sheet. On a phone the document should
 * own the screen — this is the moment the player is reading closely, and
 * surrounding chrome only competes with it.
 */

import { useEffect } from 'react';
import type { Evidence, EvidenceStatus, InvestigationDocument } from '../engine/types';
import DocumentView from './Document';

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  unresolved: 'Unresolved',
  confirmed: 'Confirmed',
  plausible: 'Plausible',
  contradicted: 'Contradicted',
  'red-herring': 'Red herring',
};

interface Props {
  evidence: Evidence;
  document: InvestigationDocument | null;
  status: EvidenceStatus;
  onClose: () => void;
}

export default function EvidenceDetail({ evidence, document, status, onClose }: Props) {
  // Escape closes it on a keyboard, the back arrow on a phone.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="detail" role="dialog" aria-label={evidence.name}>
      <header className="detail__bar">
        <button type="button" className="detail__back" onClick={onClose}>
          ← Back to evidence
        </button>
      </header>

      <div className="detail__body">
        <p className="detail__kind">{evidence.kind}</p>
        <h2 className="detail__name">{evidence.name}</h2>
        <p className="detail__summary">{evidence.summary}</p>

        {document ? (
          <DocumentView document={document} />
        ) : (
          <p className="detail__nodoc">
            No document. This is a physical item, recorded as found.
          </p>
        )}

        <dl className="detail__meta">
          <dt>Status</dt>
          <dd>{STATUS_LABEL[status]}</dd>
          {evidence.tags.length > 0 && (
            <>
              <dt>Filed under</dt>
              <dd>{evidence.tags.join(', ')}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
