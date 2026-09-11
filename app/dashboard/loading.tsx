/**
 * Shown while the dashboard route resolves.
 *
 * On a direct visit this is never seen — the server answers with the
 * redirect itself and sends no body. It covers the client-side navigation
 * case, where React holds this Suspense fallback for the moment between the
 * click and the redirect being followed.
 *
 * The fonts come from the <link> in app/layout.tsx and are named explicitly
 * here: the --font-playfair CSS variable is only defined inside the /rsvp and
 * /welcome layouts, so the Tailwind font-playfair utility would resolve to
 * nothing on this route.
 */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-parchment px-6 py-10 text-center text-mocha"
      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
    >
      <p
        className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.35em] text-sand"
        style={{ fontFamily: "'Cinzel', Georgia, serif" }}
      >
        Ashley &amp; Jared
      </p>

      <div aria-hidden="true" className="h-1 w-24 overflow-hidden bg-sand/25">
        <div className="h-full w-1/3 animate-pulse bg-peach" />
      </div>

      <p className="mt-4 text-sm italic text-sand" role="status">
        Taking you to the RSVP dashboard...
      </p>
    </div>
  );
}
