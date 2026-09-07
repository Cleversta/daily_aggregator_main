import { supabase } from '../../lib/supabase-client';
import { HUBS } from '../../lib/categories';
import { getAllTopics } from '../../lib/topics';
import TopicsBrowser from '../components/TopicsBrowser';

export const metadata = {
  title: 'Topics — Reference Guides',
  description: 'Background, recent developments, and outlook on 100 subjects, kept current on a rotation.',
};

async function getTopicRows() {
  const { data, error } = await supabase
    .from('topics')
    .select('slug, snapshot_summary, freshness_note, is_stale, last_updated_at, change_summary');

  if (error) {
    console.error('Failed to load topics at build time:', error.message);
    return {};
  }

  const bySlug = {};
  for (const row of data || []) bySlug[row.slug] = row;
  return bySlug;
}

export default async function TopicsIndexPage() {
  const rows = await getTopicRows();
  const allTopics = getAllTopics();
  const hasAnyLiveTopic = Object.keys(rows).length > 0;
  const hubBySlug = Object.fromEntries(HUBS.map((hub) => [hub.slug, hub]));

  // Flatten to live topics only, with hub info merged in, ready for search/filter.
  const liveTopics = allTopics
    .filter((topic) => rows[topic.slug])
    .map((topic) => {
      const hub = hubBySlug[topic.hubSlug];
      const row = rows[topic.slug];
      return {
        ...topic,
        hubTitle: hub?.title || topic.hubSlug,
        hubIcon: hub?.icon || '•',
        snapshot_summary: row.snapshot_summary,
        freshness_note: row.freshness_note,
        is_stale: row.is_stale,
        last_updated_at: row.last_updated_at,
        change_summary: row.change_summary,
      };
    });

  return (
    <div className="space-y-10">
      <section className="border-b border-line pb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">Reference guides</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl leading-[1.05]">
          100 topics, kept current.
        </h1>
        <p className="text-slate text-lg leading-relaxed mt-5 max-w-2xl">
          Background, what&apos;s changed recently, and what to watch — checked on a rotation rather
          than every day, since these aren&apos;t breaking news.
        </p>
      </section>

      {!hasAnyLiveTopic ? (
        <p className="text-slate">
          No topics published yet — run <code>npm run fetch-topics</code> and rebuild.
        </p>
      ) : (
        <TopicsBrowser topics={liveTopics} hubs={HUBS} />
      )}
    </div>
  );
}