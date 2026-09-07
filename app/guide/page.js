import Link from 'next/link';
import { getPublishedIntents, GUIDE_CATEGORIES } from '../../lib/guide';
import GuideSearch from '../components/GuideSearch';

export const metadata = {
  title: 'Guide — Find the right tool',
  description: 'What are you trying to do? Search or browse to find the right free tool for the job.',
};

export default async function GuideIndexPage() {
  const intents = await getPublishedIntents();

  const byCategory = {};
  for (const intent of intents) {
    (byCategory[intent.category] ||= []).push(intent);
  }

  return (
    <div className="space-y-10">
      <section className="border-b border-line pb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-4">Guide</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-3xl leading-[1.05]">
          What are you trying to do?
        </h1>
        <p className="text-slate text-lg leading-relaxed mt-5 max-w-2xl">
          Describe the task and we&apos;ll point you to the right free tool — no account, no signup.
        </p>
        <div className="mt-6 max-w-xl">
          <GuideSearch />
        </div>
      </section>

      {intents.length === 0 ? (
        <p className="text-slate">
          No guides published yet — add rows to <code>guide_intents</code> in Supabase and rebuild.
        </p>
      ) : (
        <div className="space-y-10">
          {GUIDE_CATEGORIES.filter((cat) => byCategory[cat.slug]?.length).map((cat) => (
            <section key={cat.slug}>
              <h2 className="font-display text-xl font-bold text-ink mb-4 flex items-center gap-2">
                <span aria-hidden="true">{cat.icon}</span> {cat.title}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {byCategory[cat.slug].map((intent) => (
                  <Link
                    key={intent.slug}
                    href={`/guide/${intent.slug}`}
                    className="block rounded-lg border border-line bg-white p-4 transition-colors hover:border-wire hover:bg-[#FCF8ED]"
                  >
                    <p className="font-display font-bold text-ink leading-snug">{intent.name}</p>
                    {intent.description && (
                      <p className="text-sm text-slate mt-1 leading-relaxed">{intent.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}