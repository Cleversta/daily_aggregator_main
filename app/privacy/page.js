import Link from 'next/link';

export const metadata = {
  "title": "Privacy | Daily Aggregator",
  "description": "How Daily Aggregator uses subscription information, browser storage, and third-party services."
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Privacy</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">Your information, explained.</h1>
      <p className="mt-7 text-lg leading-relaxed text-slate">You can read Daily Aggregator without creating an account. Some optional features use information you provide or store preferences in your browser.</p>
      <div className="mt-9 space-y-8 text-base leading-relaxed text-slate">
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Email subscriptions</h2>
          <p>If you sign up for the email digest, the subscription service stores your email address, selected categories, signup time, confirmation and unsubscribe status, and a token used in subscription links. This information supports subscription management and email delivery. Supabase stores subscription records, and Resend handles email delivery.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Saved items and preferences</h2>
          <p>The site uses local storage in your browser for saved briefs and creator prompts, topic preferences, and a last-visit timestamp used to highlight new content. These features do not require an account. You can remove this information by clearing this site’s data in your browser settings; doing so also removes your saved items and preferences.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">External images, videos, and links</h2>
          <p>Images and video thumbnails loaded from other services make requests to those services, which can receive technical information such as your IP address and browser details. Opening a video loads a YouTube player using its privacy-enhanced embed domain. Playing a video or visiting a source link is subject to the relevant service’s privacy practices.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Hosting and technical information</h2>
          <p>The site is hosted on Cloudflare. Hosting and delivery providers may process connection details and request information to serve pages, maintain reliability, and protect their services.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Contact and subscription questions</h2>
          <p>If you contact us by email, your message includes the information you choose to share and your email address. For questions about your subscription or requests to remove subscription information, check the contact page for the available contact method. Clearing browser storage does not remove an email subscription record.</p>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Changes to this page</h2>
          <p>This page describes the site’s current features. It should be updated when those features or the services used to provide them change.</p>
        </section>
      </div>
      <nav aria-label="Related information" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ink/10 pt-6 text-sm font-semibold text-ink">
        <Link href="/about" className="underline underline-offset-4 hover:text-wire">About</Link>
        <Link href="/editorial-policy" className="underline underline-offset-4 hover:text-wire">Editorial policy</Link>
        <Link href="/contact" className="underline underline-offset-4 hover:text-wire">Contact</Link>
      </nav>
    </article>
  );
}
