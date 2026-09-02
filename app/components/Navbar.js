'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HUBS } from '../../lib/categories';

export default function Navbar() {
  const [openHub, setOpenHub] = useState(null);
  const pathname = usePathname();
  const selectedHub = HUBS.find((hub) => hub.slug === openHub);

  useEffect(() => {
    setOpenHub(null);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenHub(null);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const isHubActive = (hub) =>
    pathname === `/hub/${hub.slug}` || hub.categories.some((category) => pathname === `/category/${category.slug}`);

  return (
    <nav className="relative border-b border-line bg-paper" aria-label="Primary navigation">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="flex min-h-14 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className={`flex shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              pathname === '/' ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Home
          </Link>
          <Link
            href="/youtube"
            className={`flex shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              pathname === '/youtube' ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            YouTube
          </Link>

          <span className="my-3 w-px shrink-0 bg-line" aria-hidden="true" />

          {HUBS.map((hub) => {
            const isOpen = openHub === hub.slug;
            const active = isHubActive(hub);

            return (
              <button
                key={hub.slug}
                type="button"
                onClick={() => setOpenHub(isOpen ? null : hub.slug)}
                aria-expanded={isOpen}
                aria-controls={`hub-menu-${hub.slug}`}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors ${
                  isOpen || active ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">{hub.icon}</span>
                {hub.title}
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {selectedHub && (
        <div id={`hub-menu-${selectedHub.slug}`} className="border-t border-line bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-wire">
                  <span aria-hidden="true">{selectedHub.icon}</span> {selectedHub.title}
                </p>
                <p className="mt-1 text-sm text-slate">
                  {selectedHub.categories.some((category) => category.active) ? 'Choose a briefing' : 'Briefings are on the way'}
                </p>
              </div>
              <Link
                href={`/hub/${selectedHub.slug}`}
                className="text-sm font-medium text-ink underline decoration-wire/50 underline-offset-4 transition-colors hover:decoration-wire"
              >
                View all coverage <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedHub.categories.map((category) =>
                category.active ? (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === `/category/${category.slug}`
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-paper text-ink hover:border-wire hover:bg-[#FCF8ED]'
                    }`}
                >
                  <span aria-hidden="true">{category.icon}</span> {category.title}
                  </Link>
                ) : (
                  <span
                    key={category.slug}
                    className="cursor-default rounded-md border border-dashed border-line bg-white px-3 py-2 text-sm text-slate/70"
                    title="Coming soon"
                  >
                    <span aria-hidden="true">{category.icon}</span> {category.title} <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-wire">Soon</span>
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
