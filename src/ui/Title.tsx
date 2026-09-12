/**
 * Title screen.
 *
 * A case file on a desk under a lamp. Everything is drawn in CSS — no images,
 * because there is no asset pipeline and a phone-only workflow to maintain.
 *
 * The boldness is spent on one thing: the file itself as real paper. The desk
 * around it stays quiet.
 */

interface Props {
  onBegin: () => void;
  estimatedMinutes: number;
  stageCount: number;
}

export default function Title({ onBegin, estimatedMinutes, stageCount }: Props) {
  return (
    <main className="desk">
      {/* Papers beneath the file, only their edges showing. */}
      <div className="desk__under desk__under--a" aria-hidden="true" />
      <div className="desk__under desk__under--b" aria-hidden="true" />

      <article className="folder">
        <div className="folder__tab" aria-hidden="true">
          <span className="folder__tab-text">000</span>
        </div>

        <div className="folder__body">
          <p className="folder__ref">CASE 000</p>

          <p className="folder__stamp" aria-hidden="true">
            ?
          </p>

          <h1 className="folder__title">Identity unknown</h1>

          <p className="folder__rule" aria-hidden="true" />

          <p className="folder__lede">
            You are an investigator. A dossier has been left for you with no
            covering letter, no sender, and no case name — only a number.
          </p>

          <p className="folder__task">
            Work the evidence and the dossier will tell you what it is called.
            Finding that name is your first case.
          </p>

          <p className="folder__meta">
            {stageCount} stages · about {estimatedMinutes} minutes
          </p>
        </div>
      </article>

      <button type="button" className="desk__begin" onClick={onBegin}>
        Begin investigation
      </button>
    </main>
  );
}
