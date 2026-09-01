import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase-client';
import { getActiveCategories, getCategoryBySlug } from '../../../lib/categories';

// Static export needs every param pre-declared at build time.
// Only active categories get a real page; inactive ones 404 (and the Navbar
// never links to them in the first place — they show as "soon" instead).
export async function generateStaticParams() {
  return getActiveCategories().map((c) => ({ slug: c.slug }));
}

async function getArticle(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', slug)
    .single();

  if (error) {
    console.error(`Failed to load article for [${slug}] at build time:`, error.message);
    return null;
  }

  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  return {
    title: article.seo_title,
    description: article.seo_description,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category || !category.active) {
    notFound();
  }

  const article = await getArticle(slug);

  if (!article) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-wire mb-2">{category.title}</p>
        <p className="text-slate">
          No brief for this category yet — run <code>npm run fetch-news</code> and rebuild.
        </p>
      </div>
    );
  }

  return (
    <article className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
      <div
        className="h-32"
        style={{
          background: `linear-gradient(135deg, ${category.accent.from}, ${category.accent.to})`,
        }}
      />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full"
            style={{ background: category.accent.pillBg, color: category.accent.pillText }}
          >
            {category.title}
          </span>
          <span className="text-xs text-slate">· {category.hubTitle}</span>
          {article.is_stale && (
            <span className="text-xs text-slate">
              (last updated {new Date(article.fetched_at).toLocaleDateString()})
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-5 leading-tight">
          {article.headline}
        </h1>
        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="w-full rounded-lg mb-6 border border-line"
          />
        )}
        <p className="text-slate leading-relaxed text-lg mb-8">{article.summary}</p>
        <div className="border-t border-line pt-6">
          <p className="text-xs uppercase tracking-wide text-slate mb-3">Sources</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {(article.sources || []).map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-wire/50 underline-offset-4 hover:decoration-wire"
              >
                {source.name}
              </a>
            ))}
          </div>
        </div>
        <Link href="/" className="inline-block mt-8 text-sm text-slate hover:text-ink">
          ← Back to today's briefing
        </Link>
      </div>
    </article>
  );
}
//ok