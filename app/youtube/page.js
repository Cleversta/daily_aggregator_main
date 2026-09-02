import YouTubeBrowser from '../components/YouTubeBrowser';

export const metadata = {
  title: 'YouTube | Daily Aggregator',
  description: 'Popular YouTube videos across selected global markets.',
};

export default function YouTubePage() {
  return (
    <div>
      <section className="border-b border-line pb-10 mb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">YouTube</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05]">Popular videos by category.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">
          Browse popular videos across selected global markets by topic.
        </p>
      </section>
      <YouTubeBrowser />
    </div>
  );
}
