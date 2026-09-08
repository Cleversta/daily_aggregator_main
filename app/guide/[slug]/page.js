
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPublishedIntents,
  getIntentBySlug,
  getCategoryBySlug,
} from '../../../lib/guide';

// Static export needs every param pre-declared at build time.
export async function generateStaticParams() {
  const intents = await getPublishedIntents();

  return intents.map((i) => ({
    slug: i.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const intent = await getIntentBySlug(slug);

  if (!intent) {
    return {};
  }

  const title = `${intent.name} — instructions and tools`;
  const description =
    intent.description || `Instructions and recommended tools for: ${intent.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/guide/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/guide/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function GuideDetailPage({ params }) {
  const { slug } = await params;
  const intent = await getIntentBySlug(slug);

  if (!intent) {
    notFound();
  }

  const category = getCategoryBySlug(intent.category);

  const liveRecs = intent.recommendations.filter(
    (r) => !r.is_stale
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: intent.name,
    description: intent.description,
    itemListElement: liveRecs.map((rec, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: rec.url,
      name: rec.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\u003c'),
        }}
      />

      <article data-guide-publication={intent.publication_id || undefined} className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 lg:p-10 max-w-3xl">

          {/* Category */}
          {category && (
            <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {category.icon} {category.title}
            </span>
          )}

          {/* Title */}
          <h1 className="font-display text-3xl font-bold text-ink mt-3 mb-5 leading-tight">
            {intent.name}
          </h1>

          {/* Description */}
          {intent.description && (
            <p className="text-slate leading-relaxed text-lg mb-8">
              {intent.description}
            </p>
          )}

          {intent.verified_on && intent.verification !== 'unverified' && <p className="text-sm text-slate mb-6">
            {intent.verification === 'tested' ? 'Personally tested' : 'Checked against documentation'} · {intent.verified_on}
          </p>}
          {intent.steps?.length > 0 && <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-3">How to do it</h2>
            <ol className="list-decimal pl-6 space-y-3">{intent.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
          </section>}
          {/* Recommendations */}
          {liveRecs.length === 0 ? (
            <p className="text-slate">
              No live recommendations for this yet — check back soon.
            </p>
          ) : (
            <section className="space-y-4 mb-8">
              <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-1">
                Recommended
              </p>

              {liveRecs.map((rec, i) => (
                <div
                  key={rec.id}
                  className="rounded-lg border border-line p-5"
                >
                  <div className="flex items-start justify-between gap-4">

                    {/* Recommendation name */}
                    <p className="font-display font-bold text-ink">
                      {i + 1}. {rec.name}
                    </p>

                    {/* External link */}
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[11px] font-bold uppercase tracking-wide text-ink shrink-0 underline decoration-wire/50 underline-offset-4 hover:decoration-wire"
                    >
                      Open →
                    </a>

                  </div>

                  {/* Recommendation description */}
                  {rec.description && (
                    <p className="text-sm text-slate mt-2 leading-relaxed">
                      {rec.description}
                    </p>
                  )}

                  {rec.needs_review && <p className="text-sm mt-2">This recommendation is due for another review.</p>}
                  {[['Limitations', rec.limitations], ['Signup', rec.signup], ['Privacy', rec.privacy]].filter(([, value]) => value).map(([label, value]) => <p key={label} className="text-sm mt-2"><strong>{label}:</strong> {value}</p>)}
                  {rec.source_urls?.length > 0 && <div className="flex flex-wrap gap-3 mt-3">{rec.source_urls.map((url, n) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Evidence {n + 1}</a>)}</div>}
                  {/* Recommendation reason */}
                  {rec.reason && (
                    <p className="text-sm text-ink mt-2 leading-relaxed italic">
                      {rec.reason}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {intent.sources?.length > 0 && <section className="mb-8"><h2 className="font-display text-xl font-bold mb-3">Sources</h2><ul className="space-y-2">{intent.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline text-sm">{source.title || source.url}</a></li>)}</ul></section>}
          {/* Back link */}
          <Link
            href="/guide"
            className="inline-block mt-4 text-sm text-slate hover:text-ink"
          >
            ← Back to all guides
          </Link>

        </div>
      </article>
    </>
  );
}
