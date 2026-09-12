/**
 * Title screen.
 *
 * The game withholds its own name, so this screen has to do two jobs at once:
 * explain what you are about to do, and make the absence of a title feel
 * deliberate rather than broken.
 */

interface Props {
  onBegin: () => void;
  estimatedMinutes: number;
  stageCount: number;
}

export default function Title({ onBegin, estimatedMinutes, stageCount }: Props) {
  return (
    <main className="title">
      <div className="title__inner">
        <p className="title__number">Case 000</p>

        <p className="title__mark" aria-hidden="true">
          ?
        </p>

        <h1 className="title__name">Identity unknown</h1>

        <p className="title__lede">
          You are an investigator. A dossier has been left for you with no
          covering letter, no sender, and no case name — only a number.
        </p>

        <p className="title__task">
          Work the evidence and the dossier will tell you what it is called.
          Finding that name is your first case.
        </p>

        <button type="button" className="title__begin" onClick={onBegin}>
          Begin investigation
        </button>

        <p className="title__meta">
          {stageCount} stages · about {estimatedMinutes} minutes
        </p>
      </div>
    </main>
  );
}
