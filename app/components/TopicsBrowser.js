'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { NewBadge, IfNew } from './Freshness';

// topics: flattened array — { slug, topicName, topicCategory, hubSlug, hubTitle,
// hubIcon, snapshot_summary, freshness_note, is_stale, last_updated_at, change_summary }
export default function TopicsBrowser({ topics, hubs }) {
  const [query, setQuery] = useState('');
  const [activeHub, setActiveHub] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'grid'

  const hubCounts = useMemo(() => {
    const counts = {};
    for (const t of topics) counts[t.hubSlug] = (counts[t.hubSlug] || 0) + 1;
    return counts;
  }, [topics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (activeHub !== 'all' && t.hubSlug !== activeHub) return false;
      if (!q) return true;
      return (
        t.topicName.toLowerCase().includes(q) ||
        t.topicCategory.replace(/-/g, ' ').toLowerCase().includes(q)
      );
    });
  }, [topics, query, activeHub]);

  if (topics.length === 0) return null;

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-0 z-10 -mx-5 mb-8 border-b border-line bg-[#FCF8ED]/95 px-5 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 100 topics…"
            aria-label="Search topics"
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-wire focus:outline-none sm:max-w-sm sm:text-sm"
          />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate">{filtered.length} topic{filtered.length === 1 ? '' : 's'}</span>
            <div className="flex rounded-lg border border-line p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  view === 'list' ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  view === 'grid' ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Hub filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveHub('all')}
            aria-pressed={activeHub === 'all'}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeHub === 'all' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate hover:border-wire hover:text-ink'
            }`}
          >
            All ({topics.length})
          </button>
          {hubs.map((hub) => {
            const count = hubCounts[hub.slug] || 0;
            if (count === 0) return null;
            const isActive = activeHub === hub.slug;
            return (
              <button
                key={hub.slug}
                type="button"
                onClick={() => setActiveHub(hub.slug)}
                aria-pressed={isActive}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate hover:border-wire hover:text-ink'
                }`}
              >
                <span aria-hidden="true">{hub.icon}</span> {hub.title} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-slate">No topics match &quot;{query}&quot;.</p>
      )}

      {/* Compact list view — easy to scan all 100 without heavy scrolling */}
      {view === 'list' && filtered.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {filtered.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={`/topic/${topic.slug}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#FCF8ED] transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="text-base shrink-0" aria-hidden="true">{topic.hubIcon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-ink truncate">{topic.topicName}</span>
                      <NewBadge fetchedAt={topic.last_updated_at} />
                {topic.last_checked_at && <span className="text-xs text-slate">Checked {new Date(topic.last_checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} UTC</span>}
                      {topic.is_stale && <span className="text-xs text-amber-600 shrink-0">stale</span>}
                    </div>
                    <p className="text-xs text-slate truncate">
                      {topic.topicCategory.replace(/-/g, ' ')} · {topic.hubTitle}
                    </p>
                    {topic.change_summary && (
                      <IfNew fetchedAt={topic.last_updated_at}>
                        <p className="text-xs text-alert truncate">Changed: {topic.change_summary}</p>
                      </IfNew>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-ink shrink-0">
                  Read <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Grid view — original card layout, now filterable too */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topic/${topic.slug}`}
              className="block bg-white border border-line rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {topic.topicCategory.replace(/-/g, ' ')}
                </span>
                <NewBadge fetchedAt={topic.last_updated_at} />
                {topic.last_checked_at && <span className="text-xs text-slate">Checked {new Date(topic.last_checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} UTC</span>}
                {topic.is_stale && <span className="text-xs text-amber-600">stale</span>}
              </div>
              <h3 className="font-display text-lg font-bold text-ink leading-snug mb-2">{topic.topicName}</h3>
              {topic.snapshot_summary && (
                <p className="text-sm text-slate leading-relaxed line-clamp-3">{topic.snapshot_summary}</p>
              )}
              {topic.change_summary && (
                <IfNew fetchedAt={topic.last_updated_at}>
                  <p className="text-xs text-alert mt-2 line-clamp-2">Changed: {topic.change_summary}</p>
                </IfNew>
              )}
              <div className="flex items-center justify-between mt-4">
                {topic.freshness_note && <span className="text-xs text-slate">{topic.freshness_note}</span>}
                <span className="text-xs font-bold uppercase tracking-wide text-ink">
                  Read <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}