import { supabase } from '../lib/supabase-client';
import Link from 'next/link';
import { HUBS } from '../lib/categories';

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

  return (
    <div className="space-y-14">
      {!hasAnyLiveArticle && (
        <p className="text-slate">
          No briefs yet — run <code>npm run fetch-news</code> and rebuild.
        </p>
      )}

      {HUBS.map((hub) => {
        const activeInHub = hub.categories.filter((c) => c.active);
        const comingSoonInHub = hub.categories.filter((c) => !c.active);

        if (activeInHub.length === 0) return null;

        return (
          <section key={hub.slug}>
            <h2 className="font-display text-xl font-bold mb-5 pb-2 border-b border-line">
              {hub.title}
            </h2>

            <div className="grid gap-4">
              {activeInHub.map((cat) => {
                const article = articlesByCategory[cat.slug];
                if (!article) return null;

                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="block bg-white border border-line rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="h-24"
                      style={{
                        background: `linear-gradient(135deg, ${hub.accent.from}, ${hub.accent.to})`,
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full"
                          style={{ background: hub.accent.pillBg, color: hub.accent.pillText }}
                        >
                          {cat.title}
                        </span>
                        {article.is_stale && (
                          <span className="text-xs text-slate">
                            (last updated {new Date(article.fetched_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-ink leading-snug mb-2">
                        {article.headline}
                      </h3>
                      <p className="text-sm text-slate leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
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
