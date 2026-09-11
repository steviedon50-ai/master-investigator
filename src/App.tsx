/**
 * Temporary shell. This proves the build pipeline end to end —
 * React mounts, TypeScript compiles, the CSS tokens load, Cloudflare serves it.
 * The title screen replaces this next.
 */

export default function App() {
  return (
    <main className="boot">
      <p className="boot__number">Case 000</p>
      <h1 className="boot__title">Identity unknown</h1>
      <p className="boot__note">
        A dossier was left for you. No covering letter, no sender, no case name —
        only a number.
      </p>
      <p className="boot__status">Build pipeline live.</p>
    </main>
  );
}
