import { supabase } from '../../lib/supabase-client';
import { HUBS } from '../../lib/categories';
import CreatorIdeas from '../components/CreatorIdeas';

export const dynamic = 'force-static';

const title = 'Creator Ideas: Content Prompts for YouTube, TikTok & Instagram';
const description = 'Find content creator ideas inspired by daily news, with AI prompts, video hooks, script outlines, captions, and thumbnail text. Browse by topic and platform.';

export const metadata = {
  title,
  description,
  alternates: { canonical: '/creator-ideas' },
  openGraph: { title, description, url: '/creator-ideas', type: 'website', images: ['/social-card.png'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/social-card.png'] },
};

const formats = [
  { title: 'YouTube video ideas', text: 'Turn a developing story into an explainer. Start with the question your audience is asking, show the context, and finish with what to watch next.' },
  { title: 'TikTok & Instagram Reels ideas', text: 'Focus on one useful takeaway. Open with a clear hook, demonstrate the idea with a concrete example, and end with a question for your audience.' },
  { title: 'Social media post ideas', text: 'Make a short carousel or caption from a topic in your niche. Explain what changed, why it matters, and one practical point readers can take away.' },
];

export default async function CreatorIdeasPage() {
  const { data, error } = await supabase.from('articles').select('category, creator_ideas');
  if (error) console.error('Failed to load creator ideas:', error.message);
  const articles = Object.fromEntries((data || []).map(article => [article.category, article]));
  const ideas = HUBS.flatMap(hub => hub.categories.flatMap(category =>
    (articles[category.slug]?.creator_ideas || []).map((idea, index) => ({
      ...idea,
      id: `${category.slug}-${index}`,
      category: `${category.icon} ${category.title}`,
    }))
  ));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: 'https://dailyaggregator.online/creator-ideas',
    isPartOf: { '@type': 'WebSite', name: 'Daily Aggregator', url: 'https://dailyaggregator.online' },
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="rounded-2xl border border-line bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-12">
        <a href="/" className="text-sm text-slate hover:text-ink">Home</a>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-wire">Creator studio</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Creator ideas for your next great post.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">Find content ideas for YouTube, TikTok, Instagram, and more, inspired by the stories in our daily briefing. Take a hook, shape your script, and make it your own.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#creator-ideas" className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Browse creator prompts</a>
          <a href="#how-to-use" className="rounded-lg border border-line px-4 py-2 text-sm font-bold">How to use these ideas</a>
        </div>
      </section>
      <CreatorIdeas ideas={ideas} browse />
      <section aria-labelledby="formats-heading">
        <h2 id="formats-heading" className="font-display text-2xl font-bold">Find a format for your content idea</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{formats.map(format => <article key={format.title} className="rounded-xl border border-line bg-white p-5"><h3 className="font-display text-xl font-bold">{format.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate">{format.text}</p></article>)}</div>
      </section>
      <section id="how-to-use" className="rounded-xl border border-line p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">How to turn a creator idea into a post</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate">
          <li>Choose a topic your audience cares about and a platform you create for.</li>
          <li>Copy the AI prompt into your writing tool. Add your audience, tone, and preferred length.</li>
          <li>Adapt the hook and outline with your own examples. Check facts against the linked reporting in <a href="/" className="font-bold text-ink underline">our daily briefing</a> before publishing.</li>
          <li>Use the caption and thumbnail text as starting points, then save useful prompts to revisit on this device.</li>
        </ol>
        <p className="mt-5 text-sm text-slate">These AI-assisted prompts are starting points for original content. Add your perspective and verify any claims in the generated script.</p>
      </section>
    </div>
  );
}
