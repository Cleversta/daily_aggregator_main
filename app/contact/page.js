import Link from 'next/link';

export const metadata = {
  title: 'Contact | Daily Aggregator',
  description: 'Get in touch about questions, corrections, source attribution, privacy, or rights requests.',
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'cleverstar02@gmail.com';

  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Contact</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">Help us keep things clear and accurate.</h1>
      <p className="mt-7 text-lg leading-relaxed text-slate">
        Send questions, report an error, or raise a concern about sources, privacy, or material published on Daily Aggregator.
      </p>
      <div className="mt-9 space-y-8 text-base leading-relaxed text-slate">
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Get in touch</h2>
          <p>
            {email ? (
              <>Email <a className="text-ink underline decoration-wire/50 underline-offset-4 hover:decoration-wire" href={`mailto:${email}`}>{email}</a> with a subject that describes your request.</>
            ) : (
              'A public contact email is not available yet. Please check this page again for updated contact details.'
            )}
          </p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Corrections and source attribution</h2>
          <p>Include the page URL, the headline or passage involved, and an explanation of what needs correcting. A link to the original reporting or other supporting evidence helps us assess the issue.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Rights requests</h2>
          <p>Identify the material and where it appears on this site, provide a link to the original work where available, and explain your relationship to the rights holder. Include a reply address for any follow-up.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Privacy and email subscriptions</h2>
          <p>Describe your question or the change you are requesting. For subscription requests, identify the email address used to subscribe. Please do not send passwords, subscription-link tokens, or other sensitive information.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Site feedback</h2>
          <p>For a broken link or display problem, include the affected URL, what you expected to happen, and your browser or device. Suggestions for topics and improvements are welcome too.</p>
        </section>
      </div>
      <nav aria-label="Related information" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink/10 pt-6 text-sm font-semibold text-ink">
        <Link href="/about" className="underline underline-offset-4 hover:text-wire">About</Link>
        <Link href="/editorial-policy" className="underline underline-offset-4 hover:text-wire">Editorial policy</Link>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-wire">Privacy</Link>
      </nav>
    </article>
  );
}
