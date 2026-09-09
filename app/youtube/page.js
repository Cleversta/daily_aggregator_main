import YouTubeBrowser from '../components/YouTubeBrowser';
import Link from 'next/link';
import { YOUTUBE_CATEGORIES, YOUTUBE_REGIONS } from '../../lib/youtube';

export const metadata = {
  title: 'Trending YouTube Videos Today',
  description: 'Popular YouTube videos across selected global markets.',
  alternates: { canonical: '/youtube' },
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
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link href="/youtube/trending-today" className="rounded-xl border border-line bg-white p-4 hover:border-wire"><strong>Trending today</strong><span className="mt-1 block text-sm text-slate">A balanced global chart refreshed daily.</span></Link>
        <Link href="/youtube/most-viewed" className="rounded-xl border border-line bg-white p-4 hover:border-wire"><strong>Most viewed today</strong><span className="mt-1 block text-sm text-slate">Current popular videos ranked by views.</span></Link>
      </div>
      <YouTubeBrowser />
      <nav className="mt-12 border-t border-line pt-7" aria-label="YouTube SEO pages">
        <h2 className="font-display text-2xl font-bold">Browse by category</h2>
        <div className="mt-4 flex flex-wrap gap-2">{YOUTUBE_CATEGORIES.map((item) => <Link key={item.slug} href={`/youtube/category/${item.slug}`} className="rounded-full border border-line bg-white px-3 py-2 text-sm hover:border-wire">{item.label}</Link>)}</div>
        <h2 className="mt-7 font-display text-2xl font-bold">Browse by country</h2>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{YOUTUBE_REGIONS.map((item) => <Link key={item.code} href={`/youtube/country/${item.code.toLowerCase()}`} className="text-sm text-slate underline decoration-wire/40 underline-offset-4 hover:text-ink">{item.name}</Link>)}</div>
      </nav>
    </div>
  );
}
