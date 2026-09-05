'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NewBadge } from './Freshness';

const TOPICS_STORAGE_KEY = 'daily-aggregator-topics';

export default function PersonalizedFeed({ hubs, articlesByCategory }) {
  // undefined = haven't read localStorage yet, so we render the default
  // (unpersonalized) order on first paint and avoid a layout jump.
  const [selected, setSelected] = useState(undefined);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(TOPICS_STORAGE_KEY) || '[]');
      setSelected(Array.isArray(stored) ? stored : []);
    } catch {
      setSelected([]);
    }
  }, []);

  const orderedHubs = (() => {
    if (!selected || selected.length === 0) return hubs;

    const hubHasSelectedTopic = (hub) => hub.categories.some((c) => selected.includes(c.slug));
    const followed = hubs.filter(hubHasSelectedTopic);
    const rest = hubs.filter((hub) => !hubHasSelectedTopic(hub));
    return [...followed, ...rest];
  })();

  return (
    <>
      {orderedHubs.map((hub) => {
        const activeInHub = hub.categories.filter((c) => c.active);
        const comingSoonInHub = hub.categories.filter((c) => !c.active);
        const storyGridClass =
          activeInHub.length === 1 ? 'grid gap-5' : 'grid gap-5 md:grid-cols-2 lg:grid-cols-3';
        const isFollowedHub = selected && selected.length > 0 && activeInHub.some((c) => selected.includes(c.slug));

        if (activeInHub.length === 0) return null;

        return (
          <section key={hub.slug}>
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
                <span className="font-body text-xl font-normal text-wire" aria-hidden="true">{hub.icon}</span>
                {hub.title}
              </h2>
              <span className="text-xs uppercase tracking-wide text-slate">
                {isFollowedHub ? 'Following' : 'Latest'}
              </span>
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
                        <NewBadge fetchedAt={article.fetched_at} />
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
    </>
  );
}