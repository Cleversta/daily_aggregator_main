export const metadata = {
  title: 'Privacy | Daily Aggregator',
  description: 'Privacy information for Daily Aggregator visitors.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-wire">Privacy</p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">Privacy at a glance.</h1>
      <div className="mt-7 space-y-5 text-lg leading-relaxed text-slate">
        <p>Daily Aggregator does not require an account and does not collect personal information directly through this website.</p>
        <p>When you follow a source link or play an embedded YouTube video, that third-party service may collect information under its own privacy policy.</p>
        <p>If advertising or analytics are added in the future, this policy will be updated before those services are enabled.</p>
      </div>
    </article>
  );
}
