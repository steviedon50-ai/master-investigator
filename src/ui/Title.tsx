/**
 * Title screen.
 *
 * Case 000 withholds its own name — the folder is stamped with a question mark
 * and the player is told that finding the name is the job. Every later case has
 * a title, so the folder carries it plainly.
 */

interface Props {
  onBegin: () => void;
  estimatedMinutes: number;
  stageCount: number;
  caseNumber: number;
  /** Null for the tutorial, where the name is the thing being withheld. */
  caseTitle: string | null;
}

export default function Title({
  onBegin,
  estimatedMinutes,
  stageCount,
  caseNumber,
  caseTitle,
}: Props) {
  const ref = String(caseNumber).padStart(3, '0');
  const tutorial = caseTitle === null;

  return (
    <main className="desk">
      <div className="desk__under desk__under--a" aria-hidden="true" />
      <div className="desk__under desk__under--b" aria-hidden="true" />

      <article className="folder">
        <div className="folder__tab" aria-hidden="true">
          <span className="folder__tab-text">{ref}</span>
        </div>

        <div className="folder__body">
          <p className="folder__ref">CASE {ref}</p>

          {tutorial ? (
            <>
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
            </>
          ) : (
            <>
              <h1 className="folder__title">{caseTitle}</h1>

              <p className="folder__rule" aria-hidden="true" />

              <p className="folder__lede">
                This investigation was assembled for you alone. Another
                investigator opening case {ref} will find a different one.
              </p>

              <p className="folder__task">
                Read everything before you trust anything. Not every account
                of that night agrees.
              </p>
            </>
          )}

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
