import Link from 'next/link';
import { supabase } from '../../lib/supabase-client';
import { HUBS } from '../../lib/categories';
import { getAllTopics } from '../../lib/topics';

export const metadata = {
  title: 'Topics — Reference Guides',
  description: 'Background, recent developments, and outlook on 100 subjects, kept current on a rotation.',
};

async function getTopicRows() {
  const { data, error } = await supabase.from('topics').select('slug, snapshot_summary, freshness_note, is_stale');

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

  return (
    <div className="space-y-14">
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

      {!hasAnyLiveTopic && (
        <p className="text-slate">
          No topics published yet — run <code>npm run fetch-topics</code> and rebuild.
        </p>
      )}

      {HUBS.map((hub) => {
        const topicsInHub = allTopics.filter((t) => t.hubSlug === hub.slug);
        const liveTopicsInHub = topicsInHub.filter((t) => rows[t.slug]);

        if (liveTopicsInHub.length === 0) return null;

        return (
          <section key={hub.slug}>
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
                <span className="font-body text-xl font-normal text-wire" aria-hidden="true">{hub.icon}</span>
                {hub.title}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveTopicsInHub.map((topic) => {
                const row = rows[topic.slug];
                return (
                  <Link
                    key={topic.slug}
                    href={`/topic/${topic.slug}`}
                    className="block bg-white border border-line rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {topic.topicCategory.replace(/-/g, ' ')}
                      </span>
                      {row.is_stale && <span className="text-xs text-amber-600">stale</span>}
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink leading-snug mb-2">
                      {topic.topicName}
                    </h3>
                    {row.snapshot_summary && (
                      <p className="text-sm text-slate leading-relaxed line-clamp-3">{row.snapshot_summary}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      {row.freshness_note && <span className="text-xs text-slate">{row.freshness_note}</span>}
                      <span className="text-xs font-bold uppercase tracking-wide text-ink">
                        Read <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}