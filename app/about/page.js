import Link from 'next/link';

export const metadata = {
  "title": "About | Daily Aggregator",
  "description": "Learn about Daily Aggregator, its daily briefings, topic guides, and creator tools."
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">About</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">A clearer way to follow the day.</h1>
      <p className="mt-7 text-lg leading-relaxed text-slate">Daily Aggregator brings news briefings, background explainers, and popular videos into one place so you can catch up and choose what to explore next.</p>
      <div className="mt-9 space-y-8 text-base leading-relaxed text-slate">
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">What you will find here</h2>
          <p>Read concise briefings across active news categories, explore topic reference pages and practical guides, or browse YouTube popularity snapshots by country and category. Creator ideas offer starting points for scripts and posts based on the stories covered here.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">A starting point for further reading</h2>
          <p>Briefings bring together information from linked reporting and add concise context. Follow those links for the original reporting, full detail, and later developments. Coverage is selective, and a short summary cannot capture every perspective.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">How content is prepared</h2>
          <p>Automated research and AI-assisted drafting help prepare the site’s content. These tools can make mistakes or miss context. Our editorial policy explains the role of sources, the limits of summaries, and how to flag an issue.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Make it useful to you</h2>
          <p>You can browse without an account, choose topics, and save briefs or creator prompts in your browser. Browser-saved items stay on that device and browser; they do not sync through an account.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Check the date</h2>
          <p>News briefings and video charts are snapshots, not live feeds. Check the displayed update time, especially when a story is developing. Older material may remain available between successful updates.</p>
        </section>
      </div>
      <nav aria-label="Related information" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink/10 pt-6 text-sm font-semibold text-ink">
        <Link href="/editorial-policy" className="underline underline-offset-4 hover:text-wire">Editorial policy</Link>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-wire">Privacy</Link>
        <Link href="/contact" className="underline underline-offset-4 hover:text-wire">Contact</Link>
      </nav>
    </article>
  );
}
