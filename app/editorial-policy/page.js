export const metadata = {
  title: 'Editorial Policy | Daily Aggregator',
  description: 'How Daily Aggregator researches, writes, attributes, and corrects its daily briefings.',
};

export default function EditorialPolicyPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Editorial policy</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">How our briefings are made.</h1>
      <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate">
        <p>We research current reporting from multiple sources, then create an original concise briefing focused on what happened and why it matters.</p>
        <p>Every briefing includes links to the reporting it relies on. We aim to avoid unsupported claims, copied passages, speculation, and clickbait.</p>
        <p>Artificial intelligence may assist with research and drafting. It is not treated as a source, and the linked reporting remains the basis for factual claims.</p>
        <p>We welcome correction and rights requests. Contact us with the relevant page URL and supporting details.</p>
      </div>
    </article>
  );
}
