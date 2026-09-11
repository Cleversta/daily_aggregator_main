import Link from 'next/link';
import UnitConverter from '../../components/UnitConverter';
export const metadata = {
  title: 'Unit converter — measurements, time and data storage',
  description: 'Convert length, weight, temperature, volume, area, speed, time and digital storage instantly in your browser.',
  alternates: { canonical: '/tools/unit-converter' },
};
export default function UnitConverterPage() {
  return <div className="mx-auto max-w-5xl"><Link href="/guide" className="text-sm text-slate underline">← All guides</Link><h1 className="mb-6 mt-5 font-display text-4xl font-bold">Everyday unit converter.</h1><UnitConverter /><section className="mt-8 max-w-3xl space-y-4 text-slate"><h2 className="font-display text-2xl font-bold text-ink">Choose units with confidence</h2><p>Length, weight, and volume conversions use fixed ratios. For example, 100 centimetres is 1 metre. Temperature conversion also accounts for the different zero points: 0°C equals 32°F.</p><p>Choose volume units carefully: US customary and metric cups differ, and Imperial gallons are listed separately. Weight uses ordinary ounces and pounds, not troy weight. Digital storage distinguishes decimal MB/GB from binary MiB/GiB. Time conversions use fixed durations, not calendar months or years. Currency conversion is not included because it needs current exchange rates.</p><p>Your values are processed in browser memory, without uploads or saved history. Reloading clears your entries; Copy result writes the answer to your clipboard.</p><Link href="/tools/calculator" className="inline-block font-bold text-ink underline">Need arithmetic or percentages? Open the calculator →</Link></section></div>;
}
