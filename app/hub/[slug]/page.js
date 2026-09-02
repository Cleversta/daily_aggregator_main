import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase-client';
import { HUBS } from '../../../lib/categories';

export function generateStaticParams() {
  return HUBS.map((hub) => ({ slug: hub.slug }));
}

export default async function HubPage({ params }) {
  const { slug } = await params;
  const hub = HUBS.find((item) => item.slug === slug);
  if (!hub) notFound();

  const activeCategories = hub.categories.filter((category) => category.active);
  const { data } = activeCategories.length
    ? await supabase.from('articles').select('*').in('category', activeCategories.map((category) => category.slug))
    : { data: [] };
  const articlesByCategory = Object.fromEntries((data || []).map((article) => [article.category, article]));

  return (
    <div>
      <section className="border-b border-line pb-10 mb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">News hub</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05]">
          <span aria-hidden="true" className="font-body text-[0.72em] font-normal text-wire">{hub.icon}</span> {hub.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">Latest reporting and daily briefs from this topic.</p>
      </section>

      {activeCategories.length === 0 ? (
        <p className="text-slate">This hub is coming soon. Choose another topic from the navigation.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {activeCategories.map((category) => {
            const article = articlesByCategory[category.slug];
            if (!article) return null;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="block rounded-xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: hub.accent.pillBg, color: hub.accent.pillText }}>
                  <span aria-hidden="true">{category.icon}</span> {category.title}
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-ink">{article.headline}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate line-clamp-3">{article.summary}</p>
                <span className="mt-5 inline-block text-xs font-bold uppercase tracking-wide text-ink">Read brief →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
