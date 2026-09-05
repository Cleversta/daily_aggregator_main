'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HUBS } from '../../lib/categories';
import { useLastVisit, isNewSince } from './Freshness';

export default function Navbar({ categoryFreshness = {}, topicFreshness = [] }) {
  const [openHub, setOpenHub] = useState(null);
  const pathname = usePathname();
  const selectedHub = HUBS.find((hub) => hub.slug === openHub);
  const lastVisit = useLastVisit();

  const isCategoryNew = (category) => isNewSince(categoryFreshness[category.slug], lastVisit);
  const isHubNew = (hub) => hub.categories.some((category) => category.active && isCategoryNew(category));
  const hasNewTopics = topicFreshness.some((updatedAt) => isNewSince(updatedAt, lastVisit));

  const trackRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = () => {
    const el = trackRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateFades();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateFades, { passive: true });
    window.addEventListener('resize', updateFades);
    return () => {
      el.removeEventListener('scroll', updateFades);
      window.removeEventListener('resize', updateFades);
    };
  }, []);

  const scrollByAmount = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  };

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
      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        {showLeftFade && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-paper to-transparent" />
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              aria-label="Scroll navigation left"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full border border-line bg-paper flex items-center justify-center text-sm text-slate hover:text-ink"
            >
              ‹
            </button>
          </>
        )}
        {showRightFade && (
          <>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-paper to-transparent" />
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              aria-label="Scroll navigation right"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full border border-line bg-paper flex items-center justify-center text-sm text-slate hover:text-ink"
            >
              ›
            </button>
          </>
        )}
        <div
          ref={trackRef}
          className="flex min-h-14 items-stretch gap-1 overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#E4E0D6_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-line [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate"
        >
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
          <Link
            href="/topics"
            className={`relative flex shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              pathname === '/topics' || pathname.startsWith('/topic/') ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Topics
            {hasNewTopics && (
              <span
                className="absolute right-0 top-1.5 h-1.5 w-1.5 rounded-full bg-alert"
                aria-label="New topic changes"
              />
            )}
          </Link>
          <Link
            href="/#creator-ideas"
            className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 text-sm font-medium text-slate transition-colors hover:text-ink"
          >
            <span aria-hidden="true">✦</span> Creator Ideas
          </Link>

          <span className="my-3 w-px shrink-0 bg-line" aria-hidden="true" />

          {HUBS.map((hub) => {
            const isOpen = openHub === hub.slug;
            const active = isHubActive(hub);
            const hasNew = isHubNew(hub);

            return (
              <button
                key={hub.slug}
                type="button"
                onClick={() => setOpenHub(isOpen ? null : hub.slug)}
                aria-expanded={isOpen}
                aria-controls={`hub-menu-${hub.slug}`}
                className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors ${
                  isOpen || active ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">{hub.icon}</span>
                {hub.title}
                {hasNew && (
                  <span
                    className="absolute right-0.5 top-1.5 h-1.5 w-1.5 rounded-full bg-alert"
                    aria-label="New stories in this section"
                  />
                )}
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
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === `/category/${category.slug}`
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-paper text-ink hover:border-wire hover:bg-[#FCF8ED]'
                    }`}
                >
                  <span aria-hidden="true">{category.icon}</span> {category.title}
                  {isCategoryNew(category) && (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide text-alert">
                      New
                    </span>
                  )}
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