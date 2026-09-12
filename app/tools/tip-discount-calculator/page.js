import Link from 'next/link';
import MoneyCalculator from '../../components/MoneyCalculator';

export const metadata = {
  title: 'Tip, bill split and discount calculator',
  description: 'Calculate tips, split a bill, combine discounts, add tax, and see the final price in your browser.',
  alternates: { canonical: '/tools/tip-discount-calculator' },
};

export default function TipDiscountCalculatorPage() {
  return <div className="mx-auto max-w-5xl"><Link href="/guide" className="text-sm text-slate underline">← All guides</Link><h1 className="mt-5 font-display text-4xl font-bold leading-tight">Tip and discount calculator</h1><p className="mb-6 mt-3 max-w-3xl leading-relaxed text-slate">Split dinner fairly or check the real price of a sale. Results update instantly.</p><MoneyCalculator /><section className="mt-8 max-w-3xl space-y-4 text-slate"><h2 className="font-display text-2xl font-bold text-ink">How the calculations work</h2><p>A tip is calculated from the bill amount, then the complete total is divided equally. Any existing service charge should be included in the bill or considered before choosing another tip.</p><p>Two discounts are applied one after another. For example, 20% off followed by 10% off produces a 28% effective discount—not 30%. Optional tax is calculated from the discounted subtotal.</p><Link href="/tools/calculator" className="inline-block font-bold text-ink underline">Need other percentage calculations? Open the everyday calculator →</Link></section></div>;
}
