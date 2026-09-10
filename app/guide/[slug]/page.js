
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GuideArtwork from '../../components/GuideArtwork';
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
    keywords: intent.phrases?.slice(0, 8),
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
  const relatedGuides = (await getPublishedIntents())
    .filter(guide => guide.slug !== slug && guide.category === intent.category)
    .slice(0, 4);

  const liveRecs = intent.recommendations.filter(
    (r) => !r.is_stale
  );

  const pageUrl = `https://dailyaggregator.online/guide/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: intent.name,
        description: intent.description,
        datePublished: intent.created_at,
        dateModified: intent.updated_at,
        author: { '@type': 'Organization', name: 'Daily Aggregator' },
        publisher: { '@type': 'Organization', name: 'Daily Aggregator' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dailyaggregator.online/' },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://dailyaggregator.online/guide' },
          { '@type': 'ListItem', position: 3, name: intent.name, item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Recommended tools for ${intent.name}`,
        itemListElement: liveRecs.map((rec, i) => ({
          '@type': 'ListItem', position: i + 1, url: rec.url, name: rec.name,
        })),
      },
    ],
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
        <div className="p-5 sm:p-8 lg:p-10">

          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate">
            <Link href="/">Home</Link> <span aria-hidden="true">›</span>{' '}
            <Link href="/guide">Guides</Link> <span aria-hidden="true">›</span>{' '}
            <span aria-current="page">{intent.name}</span>
          </nav>

          <div className="grid items-center gap-6 md:grid-cols-[1.5fr_1fr]"><div>
          {category && (
            <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {category.icon} {category.title}
            </span>
          )}

          <h1 className="max-w-3xl font-display text-3xl font-bold text-ink mt-3 mb-5 leading-tight sm:text-4xl">
            {intent.name}
          </h1>

          {intent.description && (
            <p className="max-w-3xl rounded-lg border-l-4 border-wire bg-[#FCF8ED] px-5 py-4 text-lg leading-relaxed text-ink mb-5">
              {intent.description}
            </p>
          )}

          </div><GuideArtwork category={intent.category} className="mb-6 w-full rounded-2xl" /></div>
          <p className="mb-6 text-sm text-slate">
            {intent.verified_on && intent.verification !== 'unverified' && <>{intent.verification === 'tested' ? 'Personally tested' : 'Checked against documentation'} · {intent.verified_on}</>}
            {intent.updated_at && <> · Updated {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(intent.updated_at))}</>}
          </p>

          <nav aria-label="In this guide" className="mb-8 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line px-4 py-3 text-sm">
            <strong>In this guide</strong>
            {intent.steps?.length > 0 && <a href="#instructions" className="underline">Instructions</a>}
            {liveRecs.length > 0 && <a href="#recommended-tools" className="underline">Recommended tools</a>}
            {intent.sources?.length > 0 && <a href="#sources" className="underline">Sources</a>}
          </nav>

          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              {intent.steps?.length > 0 && <section id="instructions" className="scroll-mt-6 mb-10">
                <h2 className="font-display text-2xl font-bold mb-4">How to do it</h2>
                <ol className="guide-steps space-y-4">{intent.steps.map((step, i) => <li key={i} className="flex gap-4 rounded-xl border border-line bg-[#FAFAF6] p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span><span className="pt-0.5 leading-relaxed">{step}</span></li>)}</ol>
              </section>}

              {intent.sources?.length > 0 && <section id="sources" className="scroll-mt-6 mb-10"><h2 className="font-display text-2xl font-bold mb-3">Sources</h2><p className="mb-3 text-sm text-slate">Documentation and pages checked when preparing this guide.</p><ul className="space-y-2">{intent.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline text-sm">{source.title || source.url}</a></li>)}</ul></section>}
              {intent.phrases?.length > 0 && <section className="mb-10"><h2 className="font-display text-2xl font-bold mb-3">Related questions</h2><ul className="flex flex-wrap gap-2">{intent.phrases.slice(0, 8).map(phrase => <li key={phrase} className="rounded-full border border-line px-3 py-1 text-sm text-slate">{phrase}</li>)}</ul></section>}
            </div>

            <aside id="recommended-tools" className="scroll-mt-6 space-y-4 lg:sticky lg:top-5">
              <div><p className="text-xs uppercase tracking-[0.16em] font-bold text-wire">Recommended tools</p><h2 className="mt-1 font-display text-2xl font-bold">Choose a tool</h2></div>
              {liveRecs.length === 0 ? <p className="text-slate">No live recommendations yet.</p> : liveRecs.map((rec, i) => <div key={rec.id} className={`rounded-lg border p-5 ${i === 0 ? 'border-wire bg-[#FCF8ED]' : 'border-line'}`}>
                {i === 0 && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-wire">Top choice</p>}
                <div className="flex items-start justify-between gap-3"><h3 className="font-display font-bold text-ink">{rec.name}</h3><a href={rec.url} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-xs font-bold uppercase underline">Open →</a></div>
                {rec.description && <p className="text-sm text-slate mt-2 leading-relaxed">{rec.description}</p>}
                {rec.reason && <p className="mt-3 text-sm leading-relaxed">{rec.reason}</p>}
                <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">{[['Limitations', rec.limitations], ['Signup', rec.signup], ['Privacy', rec.privacy]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-bold">{label}</dt><dd className="text-slate">{value}</dd></div>)}</dl>
                {rec.source_urls?.length > 0 && <div className="flex flex-wrap gap-3 mt-3">{rec.source_urls.map((url, n) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Evidence {n + 1}</a>)}</div>}
              </div>)}
            </aside>
          </div>

          {relatedGuides.length > 0 && <section className="mt-12 border-t border-line pt-8"><h2 className="font-display text-2xl font-bold mb-4">Related guides</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{relatedGuides.map(guide => <Link key={guide.slug} href={`/guide/${guide.slug}`} className="rounded-lg border border-line p-4 hover:border-wire"><strong>{guide.name}</strong>{guide.description && <span className="mt-1 block text-sm text-slate">{guide.description}</span>}</Link>)}</div></section>}
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
