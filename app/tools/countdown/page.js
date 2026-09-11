import Link from 'next/link';
import EventCountdown from '../../components/EventCountdown';
export const metadata = { title: 'How long until — holidays and custom countdowns', description: 'Count down to international occasions or your own special date. Runs locally in your browser.', alternates: { canonical: '/tools/countdown' } };
export default function CountdownPage() {
  return <div className="mx-auto max-w-5xl"><Link href="/guide" className="text-sm text-slate underline">← All guides</Link><h1 className="mb-3 mt-5 font-display text-4xl font-bold">How long until…</h1><p className="mb-6 text-slate">A holiday, a birthday, your next adventure. Pick a date and watch it get closer.</p><EventCountdown /><Link href="/tools/date-calculator" className="mt-6 inline-block font-bold underline">Find days between dates or calculate your age →</Link></div>;
}
