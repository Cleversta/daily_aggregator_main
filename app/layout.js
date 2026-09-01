import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Daily Aggregator',
  description: 'A once-a-day briefing across the topics you actually care about.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body">
        <header className="border-b border-line">
          <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
              Daily Aggregator
            </a>
            <span className="bg-ink text-[#F0C674] text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full font-bold">
              Updated 5AM
            </span>
          </div>
        </header>
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-slate">
            Summaries are written by an automated editor and reviewed each morning.
            Every summary links back to its original sources.
          </div>
        </footer>
      </body>
    </html>
  );
}