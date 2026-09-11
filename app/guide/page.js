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
  const quickTasks = featured.slice(0, 5);
  const activeCategories = GUIDE_CATEGORIES.filter((cat) => byCategory[cat.slug]?.length);
  const toolLinks = [
    { href: '/tools/calculator', title: 'Everyday calculator', badge: 'No signup', icon: '＋ − × ÷', accent: 'text-[#285B50]' },
    { href: '/tools/unit-converter', title: 'Unit converter', badge: 'Instant results', icon: '⇄', accent: 'text-[#285B50]' },
    { href: '/tools/color-picker', title: 'Color picker', badge: 'Hex + RGB', icon: '◉', accent: 'text-[#6F4E9D]' },
    { href: '/tools/countdown', title: 'How long until…', badge: 'Your local time', icon: '📅', accent: 'text-[#9A7324]' },
    { href: '/tools/date-calculator', title: 'Date calculator', badge: 'Add / subtract days', icon: '📆', accent: 'text-[#285B50]' },
  ];

  return (
    <div className="space-y-10">
      <section className="guide-hero rounded-3xl border border-line px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.45fr_1fr]">
          <div className="relative z-20">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-wire">Practical guides</p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Less searching.<br />
              More getting things done.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">
              From a smaller photo to a cleaner document. Choose the task, open the guide, and follow the steps.
            </p>
            <div className="mt-7 max-w-2xl">
              <GuideSearch />
            </div>
            {quickTasks.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-wire">Popular now</p>
                <div className="flex flex-wrap gap-2">
                  {quickTasks.map((task) => (
                    <Link
                      key={task.slug}
                      href={`/guide/${task.slug}`}
                      className="inline-flex items-center rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-wire hover:bg-[#FCF8ED]"
                    >
                      {task.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="guide-hero-art">
            <GuideArtwork category="images" className="w-full rounded-2xl" />
            <div className="guide-hero-note">
              <Icon name="check" />
              <span>A clear path from “how?” to done.</span>
            </div>
          </div>
        </div>

        {activeCategories.length > 0 && (
          <nav aria-label="Guide categories" className="mt-6 flex flex-wrap gap-2">
            {activeCategories.map((category) => (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                className="guide-category-link inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold hover:border-wire"
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.title}
              </a>
            ))}
          </nav>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {toolLinks.map((tool) => (
          <Link key={tool.href} href={tool.href} className="surface-card flex min-h-[170px] flex-col justify-between gap-4 p-5 transition-colors hover:border-wire">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{tool.badge}</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink">{tool.title}</h2>
            </div>
            <span aria-hidden="true" className={`text-4xl ${tool.accent}`}>
              {tool.icon}
            </span>
          </Link>
        ))}
      </section>

      {intents.length === 0 ? (
        <p className="text-slate">Our first guides are being prepared. Check back soon.</p>
      ) : (
        <div className="space-y-12">
          {featured.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Start here</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">Popular guides</h2>
                </div>
                <span className="text-sm text-slate">
                  {intents.length} live {intents.length === 1 ? 'guide' : 'guides'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((intent) => (
                  <Link key={intent.slug} href={`/guide/${intent.slug}`} className="guide-visual-card surface-card group overflow-hidden">
                    <GuideArtwork category={intent.category} className="w-full" />
                    <div className="p-5">
                      <span className="text-xs font-bold uppercase tracking-wide text-wire">
                        {GUIDE_CATEGORIES.find((category) => category.slug === intent.category)?.title || intent.category}
                      </span>
                      <h3 className="mt-2 font-display text-lg font-bold group-hover:underline">{intent.name}</h3>
                      {intent.description && <p className="mt-2 text-sm leading-relaxed text-slate">{intent.description}</p>}
                      <span className="mt-4 block text-sm font-bold">Read guide →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Browse by task</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeCategories.map((cat) => (
                  <a
                    key={cat.slug}
                    href={`#${cat.slug}`}
                    className="surface-card flex items-center justify-between gap-3 p-4 text-left transition-colors hover:border-wire"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7F2E7] text-xl">
                        {cat.icon}
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold text-ink">{cat.title}</p>
                        <p className="text-sm text-slate">{byCategory[cat.slug].length} guides</p>
                      </div>
                    </div>
                    <span aria-hidden="true" className="text-lg text-wire">→</span>
                  </a>
                ))}
              </div>
            </div>

            <aside className="surface-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">What this guide is for</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate">
                <li className="flex gap-2"><span className="mt-1 text-wire">•</span><span>Search by the exact task you want to complete.</span></li>
                <li className="flex gap-2"><span className="mt-1 text-wire">•</span><span>Open a guide and follow the simplest path to a result.</span></li>
                <li className="flex gap-2"><span className="mt-1 text-wire">•</span><span>Use the built-in tools when the task needs a quick browser action.</span></li>
              </ul>
            </aside>
          </section>

          {activeCategories.map((cat) => (
            <section id={cat.slug} className="scroll-mt-5 border-t border-line pt-8" key={cat.slug}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.title}
                </h2>
                <span className="text-sm text-slate">{byCategory[cat.slug].length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory[cat.slug].map((intent) => (
                  <Link
                    key={intent.slug}
                    href={`/guide/${intent.slug}`}
                    className="guide-category-card group block rounded-xl border border-line bg-white p-4 transition-colors hover:border-wire hover:bg-[#FCF8ED]"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-paper p-2.5 text-wire">
                      <Icon name={intent.category === 'coding' ? 'grid' : intent.category === 'images' ? 'sparkles' : 'book'} />
                    </div>
                    <p className="font-display font-bold text-ink leading-snug">{intent.name}</p>
                    {intent.description && <p className="mt-1 text-sm leading-relaxed text-slate">{intent.description}</p>}
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
