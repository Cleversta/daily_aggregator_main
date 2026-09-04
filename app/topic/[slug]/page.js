import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase-client';
import { getAllTopics, getTopicBySlug } from '../../../lib/topics';

// Static export needs every param pre-declared at build time — every topic
// gets a page (unlike categories, there's no active/inactive split here
// since a topic's row simply won't exist until fetch-topics.js has run it
// at least once).
export async function generateStaticParams() {
  return getAllTopics().map((t) => ({ slug: t.slug }));
}

async function getTopicRow(slug) {
  const { data, error } = await supabase.from('topics').select('*').eq('slug', slug).single();

  if (error) {
    console.error(`Failed to load topic row for [${slug}] at build time:`, error.message);
    return null;
  }
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  const row = await getTopicRow(slug);
  if (!topic) return {};

  return {
    title: row?.snapshot_summary ? `${topic.topicName} — Latest Updates` : topic.topicName,
    description: row?.snapshot_summary || `Background, recent developments, and outlook on ${topic.topicName}.`,
  };
}

export default async function TopicPage({ params }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const row = await getTopicRow(slug);

  if (!row) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-wire mb-2">{topic.topicName}</p>
        <p className="text-slate">
          No content for this topic yet — run <code>npm run fetch-topics</code> and rebuild.
        </p>
      </div>
    );
  }

  const checkedDate = row.last_checked_at ? new Date(row.last_checked_at) : null;
  const updatedDate = row.last_updated_at ? new Date(row.last_updated_at) : null;
  const fmt = (d) =>
    Number.isNaN(d?.getTime())
      ? null
      : new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);

  return (
    <article className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 sm:p-8 lg:p-10 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {topic.topicCategory.replace(/-/g, ' ')}
          </span>
          {row.freshness_note && (
            <span className="text-xs text-slate">
              {row.freshness_note}
              {checkedDate && fmt(checkedDate) ? ` · checked ${fmt(checkedDate)}` : ''}
            </span>
          )}
          {row.is_stale && <span className="text-xs text-amber-600">(last confirmed update stale)</span>}
        </div>

        <h1 className="font-display text-3xl font-bold text-ink mb-5 leading-tight">{topic.topicName}</h1>

        {row.snapshot_summary && (
          <p className="text-slate leading-relaxed text-lg mb-8">{row.snapshot_summary}</p>
        )}

        {row.background && (
          <section className="border-y border-line py-7 mb-8">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">Background</p>
            <p className="text-slate leading-relaxed whitespace-pre-line">{row.background}</p>
          </section>
        )}

        {row.whats_new && (
          <section className="mb-8">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">What&apos;s new</p>
            <p className="text-slate leading-relaxed whitespace-pre-line">{row.whats_new}</p>
          </section>
        )}

        {row.why_popular && (
          <section className="mb-8">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">Why it&apos;s relevant now</p>
            <p className="text-slate leading-relaxed">{row.why_popular}</p>
          </section>
        )}

        {Array.isArray(row.key_facts) && row.key_facts.length > 0 && (
          <section className="mb-8 rounded-lg border border-line bg-[#FCF8ED] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire mb-3">Key facts</p>
            <dl className="space-y-2">
              {row.key_facts.map((fact, i) => (
                <div key={i} className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate">{fact.label}</dt>
                  <dd className="text-ink font-medium text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {row.outlook && (
          <section className="mb-8">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">Outlook</p>
            <p className="text-slate leading-relaxed">{row.outlook}</p>
          </section>
        )}

        {Array.isArray(row.faq) && row.faq.length > 0 && (
          <section className="mb-8">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-3">FAQ</p>
            <div className="space-y-4">
              {row.faq.map((item, i) => (
                <div key={i}>
                  <p className="text-ink font-medium">{item.question}</p>
                  <p className="text-slate leading-relaxed mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {row.change_summary && (
          <p className="text-xs text-slate mb-8">
            Since last update: {row.change_summary}
            {updatedDate && fmt(updatedDate) ? ` (${fmt(updatedDate)})` : ''}
          </p>
        )}

        {Array.isArray(row.sources) && row.sources.length > 0 && (
          <div className="border-t border-line pt-6">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-slate mb-4">Sources</p>
            <ul className="space-y-3 text-sm">
              {row.sources.map((source, i) => (
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
        )}

        <Link href="/topics" className="inline-block mt-8 text-sm text-slate hover:text-ink">
          ← Back to all topics
        </Link>
      </div>
    </article>
  );
}