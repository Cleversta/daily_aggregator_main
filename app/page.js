import { supabase } from '../lib/supabase-client';
import { HUBS } from '../lib/categories';
import Icon from './components/Icon';
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
      return (article?.creator_ideas || []).slice(0, 1).map((idea, index) => ({
        ...idea,
        id: `${category.slug}-${index}`,
        category: `${category.icon} ${category.title}`,
      }));
    })
  ).slice(0, 3);
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
        <section className="home-hero motion-enter">
          <div className="relative max-w-3xl">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate"><span className="h-2 w-2 rounded-full bg-wire" />{briefingDate || 'Your daily catch-up'}</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Stay curious.<br />Get to the good stuff.</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate sm:text-lg">Your daily shortcut to the stories that matter, fresh content ideas, and practical guides.</p>
            <a href="#today" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-ink/90">Catch up on the news <Icon name="arrow" /></a>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { href: '#today', icon: 'news', title: 'Get informed', text: 'Big stories. Short reads.' },
              { href: '/creator-ideas', icon: 'sparkles', title: 'Find your next idea', text: 'Hooks, scripts & ready-to-use prompts.' },
              { href: '/guide', icon: 'book', title: 'Make something happen', text: 'Useful tools. Clear next steps.' },
            ].map(item => <a key={item.href} href={item.href} className="surface-card flex items-center gap-3 p-4"><span className="rounded-xl bg-[#F6F0E1] p-2.5 text-wire"><Icon name={item.icon} /></span><span className="min-w-0"><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-slate">{item.text}</span></span></a>)}
          </div>
        </section>

        {!hasAnyLiveArticle && (
          <p id="today" className="text-slate">
            Your next briefing is on its way. Explore creator ideas and guides in the meantime.
          </p>
        )}

        {hasAnyLiveArticle && <section id="today" className="scroll-mt-5 space-y-10 sm:space-y-12" aria-labelledby="today-heading">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Today</p><h2 id="today-heading" className="mt-1 font-display text-3xl font-bold">Your daily catch-up</h2></div>
            {briefingDate && <span className="hidden text-sm text-slate sm:block">{briefingDate}</span>}
          </div>
          <PersonalizedFeed hubs={HUBS} articlesByCategory={articlesByCategory} />
        </section>}

        <HotNow />

        <CreatorIdeas ideas={creatorIdeas} />

        <details id="preferences" className="disclosure rounded-2xl border border-line bg-white p-5 sm:p-7">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3"><span><span className="block font-display text-2xl font-bold">Make this your daily space</span><span className="mt-1 block text-sm text-slate">Choose your topics and revisit saved reads.</span></span><Icon name="chevron" /></summary>
          <div className="disclosure-content mt-6 space-y-8"><TopicPreferences topics={preferenceTopics} /><SavedItems /></div>
        </details>

        <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-2">Get it in your inbox</p>
          <div className="grid items-end gap-5 md:grid-cols-[1fr_minmax(20rem,0.8fr)]">
            <div><h2 className="font-display text-2xl font-bold text-ink">Never miss a briefing.</h2><p className="mt-2 text-slate">One email every morning with the essential stories.</p></div>
            <Subscribe />
          </div>
        </section>


      </div>
    </>
  );
}
