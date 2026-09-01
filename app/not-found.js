export default function NotFound() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-3">Not found</h1>
      <p className="text-slate mb-6">
        That category isn't live yet, or the page doesn't exist.
      </p>
      <a href="/" className="text-sm text-ink underline decoration-wire/50 underline-offset-4">
        ← Back to today's briefing
      </a>
    </div>
  );
}
