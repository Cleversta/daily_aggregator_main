import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Daily Aggregator',
  description: 'A once-a-day briefing across the topics you actually care about.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body" suppressHydrationWarning>
        <header className="border-b border-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-5">
            <div>
              <a href="/" className="font-display text-2xl font-bold tracking-tight text-ink whitespace-nowrap">
                Daily Aggregator
              </a>
              <p className="mt-1 text-sm text-[#FF0000]">A concise daily briefing across the stories and topics you follow.</p>
            </div>
            <span className="bg-ink text-[#F0C674] text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
              Daily brief
            </span>
          </div>
        </header>
        <Navbar />
        <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8 text-sm text-slate">
            <p>Daily summaries are original syntheses based on linked reporting. Check the original sources for the full story.</p>
            <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
              <a href="/about" className="hover:text-ink">About</a>
              <a href="/editorial-policy" className="hover:text-ink">Editorial policy</a>
              <a href="/privacy" className="hover:text-ink">Privacy</a>
              <a href="/contact" className="hover:text-ink">Contact</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
