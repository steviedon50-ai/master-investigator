/**
 * Document renderer.
 *
 * Paper is the star of an investigation game, so documents get real treatment
 * rather than a grey box with text in it. The body is rendered as preformatted
 * text: spacing carries meaning here — the Morse groups and the acrostic's
 * numbered lines both depend on it surviving intact.
 */

import type { InvestigationDocument } from '../engine/types';

interface Props {
  document: InvestigationDocument;
  /** Compact form for inline display inside a puzzle. */
  inline?: boolean;
  onClose?: () => void;
}

export default function DocumentView({ document, inline = false, onClose }: Props) {
  return (
    <article
      className={`doc doc--${document.style}${inline ? ' doc--inline' : ''}`}
      aria-label={document.header}
    >
      {onClose && (
        <button type="button" className="doc__close" onClick={onClose} aria-label="Close document">
          ×
        </button>
      )}

      <header className="doc__header">{document.header}</header>

      <pre className="doc__body">{document.body}</pre>

      {document.footnote && <footer className="doc__footnote">{document.footnote}</footer>}
    </article>
  );
}
