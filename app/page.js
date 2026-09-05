import { supabase } from '../lib/supabase-client';
import { HUBS } from '../lib/categories';
import HotNow from './components/HotNow';
import CreatorIdeas from './components/CreatorIdeas';
import TopicPreferences from './components/TopicPreferences';
import SavedItems from './components/SavedItems';
import PersonalizedFeed from './components/PersonalizedFeed';

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

  return (
    <div className="space-y-14">
      <section className="border-b border-line pb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">
          {briefingDate || 'Today’s briefing'}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl leading-[1.05]">
          The essential stories, in a few minutes.
        </h1>
        <p className="text-slate text-lg leading-relaxed mt-5 max-w-2xl">
          A focused daily read across the topics that matter to you. Every brief links back to the reporting behind it.
        </p>
      </section>

      <HotNow />

      <TopicPreferences topics={preferenceTopics} />

      <SavedItems />

      <CreatorIdeas ideas={creatorIdeas} />

      {!hasAnyLiveArticle && (
        <p className="text-slate">
          No briefs yet — run <code>npm run fetch-news</code> and rebuild.
        </p>
      )}

      <PersonalizedFeed hubs={HUBS} articlesByCategory={articlesByCategory} />
    </div>
  );
}