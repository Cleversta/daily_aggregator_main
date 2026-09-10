'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NewBadge } from './Freshness';
import SaveBrief from './SaveBrief';
import Icon from './Icon';
import TopicArtwork from './TopicArtwork';

export default function PersonalizedFeed({ hubs, articlesByCategory }) {
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    function update() {
      try { const value = JSON.parse(localStorage.getItem('daily-aggregator-topics') || '[]'); setSelected(Array.isArray(value) ? value : []); } catch { setSelected([]); }
    }
    update();
    window.addEventListener('daily-aggregator-topics-changed', update);
    return () => window.removeEventListener('daily-aggregator-topics-changed', update);
  }, []);
  const stories = hubs.flatMap(hub => hub.categories.filter(category => category.active && articlesByCategory[category.slug]).map(category => ({ category, article: articlesByCategory[category.slug], hub })));
  const visible = stories.filter(({ category }) => filter === 'all' || selected.includes(category.slug));
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-line bg-white p-1" aria-label="Filter stories">{[['all', 'Latest stories'], ['following', 'Following']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-lg px-4 text-sm font-bold transition-colors ${filter === value ? 'bg-ink text-white' : 'text-slate hover:bg-paper'}`}>{label}</button>)}</div>
        <a href="#preferences" className="action-link">Choose your topics <Icon name="arrow" className="h-4 w-4" /></a>
      </div>
      {visible.length === 0 && <p className="rounded-xl border border-line bg-white p-6 text-slate">Follow a topic below to build your own briefing. <a href="#preferences" className="font-bold underline">Choose topics</a></p>}
      <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(({ category, article, hub }, index) => (
        <article key={category.slug} className="surface-card overflow-hidden motion-enter" style={{ animationDelay: `${index * 50}ms` }}>
          <Link href={`/category/${category.slug}`} tabIndex={-1} aria-hidden="true" className="story-art block overflow-hidden">
            {(article.video_thumbnail_url || article.image_url) ? <img src={article.video_thumbnail_url || article.image_url} alt="" loading="lazy" className="aspect-video w-full object-cover" /> : <TopicArtwork topic={category.slug} className="aspect-video w-full" />}
          </Link>
          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: hub.accent.pillBg, color: hub.accent.pillText }}>{category.title}</span><NewBadge fetchedAt={article.fetched_at} /></div>
            <h3 className="font-display text-xl font-bold leading-snug"><Link href={`/category/${category.slug}`} className="hover:text-wire">{article.headline}</Link></h3>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate">{article.summary}</p>
            <details className="disclosure mt-2"><summary className="action-link cursor-pointer py-2 text-xs">Quick summary <Icon name="chevron" className="h-4 w-4" /></summary><p className="disclosure-content pb-3 text-sm leading-relaxed text-slate">{article.summary}</p></details>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3"><span className="flex items-center gap-1.5 text-xs text-slate"><Icon name="clock" className="h-3.5 w-3.5" />{Math.max(1, Math.ceil((article.summary || '').split(/\s+/).length / 200))} min brief</span><SaveBrief slug={category.slug} title={article.headline} summary={article.summary} /></div>
            <Link href={`/category/${category.slug}`} className="action-link mt-2">Read full brief <Icon name="arrow" className="h-4 w-4" /></Link>
            {article.is_stale && <p className="mt-2 text-xs text-slate">Last updated {new Date(article.fetched_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>}
          </div>
        </article>
      ))}</div>
    </div>
  );
}
