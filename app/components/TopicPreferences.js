'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'daily-aggregator-topics';

export default function TopicPreferences({ topics }) {
  const [selected, setSelected] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      setSelected(Array.isArray(stored) ? stored.filter((slug) => topics.some((topic) => topic.slug === slug)) : []);
    } catch {
      setSelected([]);
    }
    setIsReady(true);
  }, [topics]);

  function toggleTopic(slug) {
    setSelected((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!isReady || topics.length === 0) return null;

  const selectedTopics = topics.filter((topic) => selected.includes(topic.slug));

  return (
    <section className="border-b border-line pb-10" aria-labelledby="topic-preferences">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Make it yours</p>
          <h2 id="topic-preferences" className="mt-2 font-display text-2xl font-bold text-ink">Choose the topics you want to follow.</h2>
        </div>
        <span className="text-xs text-slate">Saved only on this device</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {topics.map((topic) => {
          const isSelected = selected.includes(topic.slug);
          return (
            <button
              key={topic.slug}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleTopic(topic.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isSelected ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate hover:border-wire hover:text-ink'
              }`}
            >
              <span aria-hidden="true">{topic.icon}</span> {topic.title}
            </button>
          );
        })}
      </div>

      {selectedTopics.length > 0 && (
        <div className="mt-8 rounded-xl border border-line bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">Your briefing</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {selectedTopics.map((topic) => (
              <Link key={topic.slug} href={`/category/${topic.slug}`} className="group rounded-lg border border-line p-4 transition-colors hover:border-wire hover:bg-[#FCF8ED]">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-wire"><span aria-hidden="true">{topic.icon}</span> {topic.title}</p>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink group-hover:text-wire">{topic.headline}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate">{topic.summary}</p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-ink">Read brief →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
