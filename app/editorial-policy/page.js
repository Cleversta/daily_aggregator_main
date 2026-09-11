import Link from 'next/link';

export const metadata = {
  "title": "Editorial Policy | Daily Aggregator",
  "description": "Our approach to sources, AI-assisted drafting, freshness, attribution, and corrections."
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Editorial Policy</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">How we prepare content and recommendations.</h1>
      <p className="mt-7 text-lg leading-relaxed text-slate">Our aim is to make reporting easier to navigate with concise summaries, useful context, and links that let readers check the underlying information.</p>
      <div className="mt-9 space-y-8 text-base leading-relaxed text-slate">
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Sources and attribution</h2>
          <p>The research workflow gathers current reporting to prepare briefings. Source links accompany coverage so readers can examine the original work. A link credits the source; it does not imply that the publisher endorses Daily Aggregator.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">AI and automation</h2>
          <p>Artificial intelligence assists with research, synthesis, and drafting. AI output is not an independent source of evidence. Automated content can contain errors, and publication should not be taken as a guarantee that every statement has been individually checked by a human editor.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Writing standards</h2>
          <p>We aim to summarize in our own words, distinguish reported facts from interpretation, and avoid unsupported claims, copied passages, and misleading headlines. Briefings necessarily leave out detail, so readers should consult the original sources before relying on a claim.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Updates and video rankings</h2>
          <p>Coverage reflects the information available when it was prepared. Updates depend on successful data refreshes, and older coverage may remain visible if a refresh fails. YouTube charts reflect collected popularity data for the displayed markets and dates; inclusion is not an endorsement of a video or its claims.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Creator ideas and guides</h2>
          <p>Creator prompts and scripts are drafts for readers to adapt and check before publishing. Topic explainers and practical guides provide general context and may become outdated as products, services, or events change.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Corrections and rights requests</h2>
          <p>If you spot a factual error, missing attribution, or a concern about material used here, use the contact page. Include the page URL, the passage or material in question, and supporting evidence or the original source so the issue can be assessed.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Guide review and verification</h2>
          <p>Guide drafts may be written manually or prepared with AI assistance. The Guide publishing workflow requires an editor to review the revision and its sources before publication. A documentation check is different from personal testing: we use the personally tested label only when the editor has performed the relevant test. This Guide review process does not imply that all automated news content receives the same review.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Useful recommendations</h2>
          <p>We aim to explain why a recommended service fits the task and include relevant limitations, signup requirements, costs, and privacy details where verified. Unknown details should be identified rather than guessed. Prices, availability, and features can change; a working link alone does not verify those claims. If a recommendation is paid or uses an affiliate link, that relationship should be disclosed alongside it.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Dates and changing information</h2>
          <p>AI is a drafting aid, not a live data feed. Time-sensitive claims need a current source and a clear date. Country, year, time zone, units, and currency should be stated where they affect the answer. Scheduled updates should not be described as real-time information.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Image tools and illustrations</h2>
          <p>Our built-in image editor uses browser processing rather than AI to crop, rotate, resize, and encode files. The displayed output size is measured from the generated file. Quality percentages describe an encoding setting, not a guaranteed reduction in file size; PNG or other conversions can produce larger files. Review the preview before using the result. Decorative illustrations identify topics and guide categories; they are not documentary images or evidence of an official affiliation.</p>
        </section>
      </div>
      <nav aria-label="Related information" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink/10 pt-6 text-sm font-semibold text-ink">
        <Link href="/about" className="underline underline-offset-4 hover:text-wire">About</Link>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-wire">Privacy</Link>
        <Link href="/contact" className="underline underline-offset-4 hover:text-wire">Contact</Link>
      </nav>
    </article>
  );
}
