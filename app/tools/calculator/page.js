import Link from 'next/link';
import Calculator from '../../components/Calculator';
export const metadata = {
  title: 'Calculator — arithmetic and percentages',
  description: 'Add, subtract, multiply, divide, and calculate percentages directly in your browser.',
  alternates: { canonical: '/tools/calculator' },
};
export default function CalculatorPage() {
  return <div className="max-w-5xl mx-auto">
    <Link href="/guide" className="text-sm text-slate underline">← All guides</Link>
    <h1 className="mt-5 mb-6 font-display text-4xl font-bold">Everyday calculator.</h1>
    <Calculator />
    <section className="max-w-3xl space-y-4 text-slate"><h2 className="font-display text-2xl font-bold text-ink">Three ways to work with percentages</h2><p><strong>Percentage of a number:</strong> divide the percentage by 100, then multiply by the number. For example, 20% of 150 is 30.</p><p><strong>One number as a percentage:</strong> divide the part by the whole and multiply by 100. For example, 30 out of 150 is 20%.</p><p><strong>Percentage change:</strong> subtract the original from the new value, divide by the absolute original value, then multiply by 100. A positive result means an increase; a negative result means a decrease. Change from zero is undefined.</p><p>Use a dot for decimals and omit thousands separators. Negative numbers are accepted. Inputs and results stay in this page’s memory and are cleared when you reload; Copy result writes the displayed answer to your clipboard.</p></section>
  </div>;
}
