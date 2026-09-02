export const metadata = {
  title: 'Contact | Daily Aggregator',
  description: 'Contact Daily Aggregator for questions, corrections, or rights requests.',
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Contact</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">Questions, corrections, or rights requests.</h1>
      <p className="mt-7 text-lg leading-relaxed text-slate">
        {email ? (
          <>
            Email us at <a className="text-ink underline decoration-wire/50 underline-offset-4 hover:decoration-wire" href={`mailto:${email}`}>{email}</a>.
          </>
        ) : (
          'A public contact email will be added before this site is published.'
        )}
      </p>
    </article>
  );
}
