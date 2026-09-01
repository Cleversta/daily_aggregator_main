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

  const wordCount = article.summary.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const fetchedDate = new Date(article.fetched_at);
  const updatedDate = Number.isNaN(fetchedDate.getTime())
    ? 'today'
    : new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(fetchedDate);

  return (
    <article className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
      {(article.video_thumbnail_url || article.image_url) && (
        <div className="relative aspect-[16/9] bg-slate-100">
          {article.video_url ? (
            <a href={article.video_url} target="_blank" rel="noopener noreferrer" className="block h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.video_thumbnail_url || article.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center" aria-label="Play video">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 pl-1 text-xl text-white" aria-hidden="true">
                  ▶
                </span>
              </span>
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.image_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      )}
      <div className="p-6 sm:p-8 lg:p-10 max-w-3xl">
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
        <p className="text-sm text-slate mb-8">
          Updated {updatedDate} <span aria-hidden="true">·</span> {readingMinutes}-minute read
        </p>
        <section className="border-y border-line py-7 mb-8">
          <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">The brief</p>
          <p className="text-slate leading-relaxed text-lg whitespace-pre-line">{article.summary}</p>
        </section>
        <div className="border-t border-line pt-6">
          <p className="text-xs uppercase tracking-[0.16em] font-bold text-slate mb-4">Sources</p>
          <ul className="space-y-3 text-sm">
            {(article.sources || []).map((source, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wire" aria-hidden="true" />
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed text-ink underline decoration-wire/50 underline-offset-4 hover:decoration-wire"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/" className="inline-block mt-8 text-sm text-slate hover:text-ink">
          ← Back to today's briefing
        </Link>
      </div>
    </article>
  );
}
//ok
