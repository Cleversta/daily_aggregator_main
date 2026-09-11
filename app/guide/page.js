import Link from 'next/link';
import { getPublishedIntents, GUIDE_CATEGORIES } from '../../lib/guide';
import GuideSearch from '../components/GuideSearch';
import GuideArtwork from '../components/GuideArtwork';
import Icon from '../components/Icon';

export const metadata = {
  title: 'Guide — Find the right tool',
  description: 'What are you trying to do? Search or browse to find the right tool for the job.',
  alternates: { canonical: '/guide' },
};

export default async function GuideIndexPage() {
  const intents = await getPublishedIntents();

  const byCategory = {};
  for (const intent of intents) {
    (byCategory[intent.category] ||= []).push(intent);
  }
  const featured = [...intents]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 6);
  const activeCategories = GUIDE_CATEGORIES.filter((cat) => byCategory[cat.slug]?.length);

  return (
    <div className="space-y-12">
      <section className="guide-hero rounded-3xl border border-line px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]"><div className="relative z-20">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">Practical guides</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl leading-[1.05]">Less searching.<br />More getting things done.</h1>
        <p className="text-slate text-lg leading-relaxed mt-5 max-w-2xl">From a smaller photo to a cleaner document. Find a task, pick a tool, and follow the steps.</p>
        <div className="mt-7 max-w-2xl">
          <GuideSearch />
        </div>
        </div><div className="guide-hero-art"><GuideArtwork category="images" className="w-full rounded-2xl" /><div className="guide-hero-note"><Icon name="check" /><span>A clear path from “how?” to done.</span></div></div></div>
        {activeCategories.length > 0 && <nav aria-label="Guide categories" className="mt-6 flex flex-wrap gap-2">{activeCategories.map(category => <a key={category.slug} href={`#${category.slug}`} className="guide-category-link inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold hover:border-wire"><span aria-hidden="true">{category.icon}</span> {category.title}</a>)}</nav>}
      </section>

      <Link href="/tools/calculator" className="surface-card flex items-center justify-between gap-4 p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-wire">Use it here · No signup</p><h2 className="mt-2 font-display text-2xl font-bold">Everyday calculator</h2><p className="mt-2 text-sm text-slate">Arithmetic, percentages, and percentage change, right in your browser.</p></div><span aria-hidden="true" className="hidden shrink-0 text-3xl sm:block">＋ − × ÷</span></Link>
      {intents.length === 0 ? (
        <p className="text-slate">
          Our first guides are being prepared. Check back soon.
        </p>
      ) : (
        <div className="space-y-12">
          {featured.length > 0 && <section><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Start here</p><h2 className="mt-1 font-display text-2xl font-bold">Recently updated guides</h2></div><span className="text-sm text-slate">{intents.length} live {intents.length === 1 ? 'guide' : 'guides'}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{featured.map(intent => <Link key={intent.slug} href={`/guide/${intent.slug}`} className="guide-visual-card surface-card group overflow-hidden"><GuideArtwork category={intent.category} className="w-full" /><div className="p-5"><span className="text-xs font-bold uppercase tracking-wide text-wire">{GUIDE_CATEGORIES.find(category => category.slug === intent.category)?.title || intent.category}</span><h3 className="mt-2 font-display text-lg font-bold group-hover:underline">{intent.name}</h3>{intent.description && <p className="mt-2 text-sm leading-relaxed text-slate">{intent.description}</p>}<span className="mt-4 block text-sm font-bold">Read guide →</span></div></Link>)}</div></section>}
          {activeCategories.map((cat) => (
            <section id={cat.slug} className="scroll-mt-5 border-t border-line pt-8" key={cat.slug}>
              <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2"><span aria-hidden="true">{cat.icon}</span> {cat.title}</h2><span className="text-sm text-slate">{byCategory[cat.slug].length}</span></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byCategory[cat.slug].map((intent) => (
                  <Link
                    key={intent.slug}
                    href={`/guide/${intent.slug}`}
                    className="guide-category-card group block rounded-xl border border-line bg-white p-4 transition-colors hover:border-wire hover:bg-[#FCF8ED]"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-paper p-2.5 text-wire"><Icon name={intent.category === 'coding' ? 'grid' : intent.category === 'images' ? 'sparkles' : 'book'} /></div>
                    <p className="font-display font-bold text-ink leading-snug">{intent.name}</p>
                    {intent.description && (
                      <p className="text-sm text-slate mt-1 leading-relaxed">{intent.description}</p>
                    )}
                    <span className="mt-3 block text-sm font-bold opacity-70 group-hover:opacity-100">Open guide →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
