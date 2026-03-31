export default function Header() {
  return (
    <header className="text-center pt-12 pb-4 px-5">
      <p className="text-xs tracking-[4px] uppercase text-[var(--accent-pink)] mb-2">
        every f*ck, mapped
      </p>
      <h1 className="text-5xl font-extrabold tracking-tight">F-Bomb Tracker</h1>
      <p className="text-[var(--text-muted)] mt-2 text-sm">
        Search a movie. Watch the f-bombs pile up.
      </p>
    </header>
  );
}
