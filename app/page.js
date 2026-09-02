import { supabase } from '../lib/supabase-client';
import Link from 'next/link';
import { HUBS } from '../lib/categories';
import HotNow from './components/HotNow';
import CreatorIdeas from './components/CreatorIdeas';
import TopicPreferences from './components/TopicPreferences';

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

      <CreatorIdeas ideas={creatorIdeas} />

      {!hasAnyLiveArticle && (
        <p className="text-slate">
          No briefs yet — run <code>npm run fetch-news</code> and rebuild.
        </p>
      )}

      {HUBS.map((hub) => {
        const activeInHub = hub.categories.filter((c) => c.active);
        const comingSoonInHub = hub.categories.filter((c) => !c.active);
        const storyGridClass =
          activeInHub.length === 1 ? 'grid gap-5' : 'grid gap-5 md:grid-cols-2 lg:grid-cols-3';

        if (activeInHub.length === 0) return null;

        return (
          <section key={hub.slug}>
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
                <span className="font-body text-xl font-normal text-wire" aria-hidden="true">{hub.icon}</span>
                {hub.title}
              </h2>
              <span className="text-xs uppercase tracking-wide text-slate">Latest</span>
            </div>

            <div className={storyGridClass}>
              {activeInHub.map((cat) => {
                const article = articlesByCategory[cat.slug];
                if (!article) return null;
                const isOnlyStory = activeInHub.length === 1;

                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className={`block bg-white border border-line rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                      isOnlyStory ? 'md:grid md:grid-cols-[minmax(18rem,0.9fr)_1.1fr]' : ''
                    }`}
                  >
                    {(article.video_thumbnail_url || article.image_url) && (
                      <div className={`relative bg-slate-100 ${isOnlyStory ? 'aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.video_thumbnail_url || article.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {article.video_url && (
                          <span className="absolute inset-0 flex items-center justify-center" aria-label="Video available">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/70 pl-0.5 text-lg text-white" aria-hidden="true">
                              ▶
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`p-5 ${isOnlyStory ? 'md:p-8 md:self-center' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full"
                          style={{ background: hub.accent.pillBg, color: hub.accent.pillText }}
                        >
                          <span aria-hidden="true">{cat.icon}</span> {cat.title}
                        </span>
                        {article.is_stale && (
                          <span className="text-xs text-slate">
                            (last updated {new Date(article.fetched_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl font-bold text-ink leading-snug mb-2">
                        {article.headline}
                      </h3>
                      <p className="text-sm text-slate leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                      <span className="inline-block mt-4 text-xs font-bold uppercase tracking-wide text-ink">
                        Read brief <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {comingSoonInHub.length > 0 && (
              <p className="text-sm text-slate/60 mt-4">
                Also in this hub soon: {comingSoonInHub.map((c) => c.title).join(', ')}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
