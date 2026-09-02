export const metadata = {
  title: 'About | Daily Aggregator',
  description: 'Learn about Daily Aggregator and how its daily briefings are made.',
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">About</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">A clearer way to follow the day.</h1>
      <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate">
        <p>Daily Aggregator publishes concise, topic-focused briefings to help readers understand important developments without sorting through an endless feed.</p>
        <p>Each briefing is an original synthesis based on current reporting from linked sources. It is designed to provide context and point readers back to the original work, not replace it.</p>
      </div>
    </article>
  );
}
