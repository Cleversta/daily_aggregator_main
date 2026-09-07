'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// Below this count, the plain grid is easier to scan than adding a search
// box on top of it — matches the "don't add UI you don't need yet" lesson
// from /topics, just tuned for this page's larger per-card size.
const SEARCH_THRESHOLD = 6;

export default function HubArticlesBrowser({ articles }) {
  const [query, setQuery] = useState('');
  const showSearch = articles.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.headline.toLowerCase().includes(q)
    );
  }, [articles, query]);

  return (
    <div>
      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${articles.length} briefs in this hub…`}
            aria-label="Search briefs in this hub"
            className="w-full max-w-sm rounded-lg border border-line bg-white px-4 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-wire focus:outline-none sm:text-sm"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-slate">No briefs match &quot;{query}&quot;.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((article) => (
            <Link
              key={article.slug}
              href={`/category/${article.slug}`}
              className="block rounded-xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: article.accent?.pillBg, color: article.accent?.pillText }}
              >
                <span aria-hidden="true">{article.icon}</span> {article.title}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-ink">{article.headline}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate line-clamp-3">{article.summary}</p>
              <span className="mt-5 inline-block text-xs font-bold uppercase tracking-wide text-ink">Read brief →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}