import { supabase } from '../lib/supabase-client';
import { HUBS } from '../lib/categories';
import HotNow from './components/HotNow';
import CreatorIdeas from './components/CreatorIdeas';
import TopicPreferences from './components/TopicPreferences';
import SavedItems from './components/SavedItems';
import PersonalizedFeed from './components/PersonalizedFeed';
import Subscribe from './components/Subscribe';

// Runs at build time (`next build`), not per-visitor — the CI job in
// .github/workflows/daily-fetch.yml triggers a rebuild after the data updates.
async function getArticlesByCategory() {
  const { data, error } = await supabase.from('articles').select('*');

  if (error) {
    console.error('Failed to load articles at build time:', error.message);
    return {};
  }

  const byCategory = {};
  for (const row of data || []) {
    byCategory[row.category] = row;
  }
  return byCategory;
}

export default async function HomePage() {
  const articlesByCategory = await getArticlesByCategory();
  const hasAnyLiveArticle = Object.keys(articlesByCategory).length > 0;
  const mostRecentArticle = Object.values(articlesByCategory).sort(
    (a, b) => new Date(b.fetched_at) - new Date(a.fetched_at)
  )[0];
  const recentDate = mostRecentArticle ? new Date(mostRecentArticle.fetched_at) : null;
  const briefingDate = recentDate && !Number.isNaN(recentDate.getTime())
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(recentDate)
    : null;
  const creatorIdeas = HUBS.flatMap((hub) =>
    hub.categories.flatMap((category) => {
      const article = articlesByCategory[category.slug];
      return (article?.creator_ideas || []).map((idea, index) => ({
        ...idea,
        id: `${category.slug}-${index}`,
        category: `${category.icon} ${category.title}`,
      }));
    })
  ).slice(0, 6);
  const preferenceTopics = HUBS.flatMap((hub) =>
    hub.categories
      .filter((category) => category.active && articlesByCategory[category.slug])
      .map((category) => ({
        slug: category.slug,
        title: category.title,
        icon: category.icon,
        headline: articlesByCategory[category.slug].headline,
        summary: articlesByCategory[category.slug].summary,
      }))
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Daily Aggregator',
    url: 'https://dailyaggregator.online',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://dailyaggregator.online/topics?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-12 sm:space-y-14">
        <section className="border-b border-line pb-8 sm:pb-10">
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">
            {briefingDate || 'Today’s briefing'}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl leading-[1.05]">
            The essential stories, in a few minutes.
          </h1>
          <p className="text-slate text-lg leading-relaxed mt-5 max-w-2xl">
            A focused daily read across the topics that matter to you. Every brief links back to the reporting behind it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#today" className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Read today&apos;s briefing</a>
            <a href="/guide" className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-wire">Find a practical guide</a>
          </div>
        </section>

        {!hasAnyLiveArticle && (
          <p className="text-slate">
            No briefs yet — run <code>npm run fetch-news</code> and rebuild.
          </p>
        )}

        {hasAnyLiveArticle && <section id="today" className="scroll-mt-5 space-y-10 sm:space-y-12" aria-labelledby="today-heading">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Today</p><h2 id="today-heading" className="mt-1 font-display text-3xl font-bold">Your daily briefing</h2></div>
            {briefingDate && <span className="hidden text-sm text-slate sm:block">{briefingDate}</span>}
          </div>
          <PersonalizedFeed hubs={HUBS} articlesByCategory={articlesByCategory} />
        </section>}

        <HotNow />

        <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-2">Get it in your inbox</p>
          <div className="grid items-end gap-5 md:grid-cols-[1fr_minmax(20rem,0.8fr)]">
            <div><h2 className="font-display text-2xl font-bold text-ink">Never miss a briefing.</h2><p className="mt-2 text-slate">One email every morning with the essential stories.</p></div>
            <Subscribe />
          </div>
        </section>

        <TopicPreferences topics={preferenceTopics} />

        <SavedItems />

        <CreatorIdeas ideas={creatorIdeas} />
      </div>
    </>
  );
}
