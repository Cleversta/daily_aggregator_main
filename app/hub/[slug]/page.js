import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase-client';
import { HUBS } from '../../../lib/categories';
import HubArticlesBrowser from '../../components/HubArticlesBrowser';

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

  const liveArticles = activeCategories
    .filter((category) => articlesByCategory[category.slug])
    .map((category) => {
      const article = articlesByCategory[category.slug];
      return {
        slug: category.slug,
        title: category.title,
        icon: category.icon,
        headline: article.headline,
        summary: article.summary,
        accent: hub.accent,
      };
    });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    url: `https://dailyaggregator.online/hub/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Daily Aggregator', url: 'https://dailyaggregator.online' },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line pb-10 mb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">News hub</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05]">
          <span aria-hidden="true" className="font-body text-[0.72em] font-normal text-wire">{hub.icon}</span> {hub.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">Latest reporting and daily briefs from this topic.</p>
      </section>

      {activeCategories.length === 0 ? (
        <p className="text-slate">This hub is coming soon. Choose another topic from the navigation.</p>
      ) : liveArticles.length === 0 ? (
        <p className="text-slate">No briefs published yet for this hub — run <code>npm run fetch-news</code> and rebuild.</p>
      ) : (
        // Grid works fine for a handful of briefs; the search box only
        // appears once a hub has enough categories to make scrolling
        // worthwhile (see HubArticlesBrowser).
        <HubArticlesBrowser articles={liveArticles} />
      )}
    </div>
  );
}