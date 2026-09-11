'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HUBS } from '../../lib/categories';
import { useLastVisit, isNewSince } from './Freshness';
import Icon from './Icon';

const destinations = [
  { href: 'browse', label: 'Browse topics', icon: 'grid', isBrowse: true },
  { href: '/', label: 'News', icon: 'news' },
  { href: '/creator-ideas', label: 'Creator Ideas', icon: 'sparkles' },
  { href: '/guide', label: 'Guides', icon: 'book' },
  { href: '/topics', label: 'Topics', icon: 'grid' },
  { href: '/youtube', label: 'YouTube', icon: 'play' },
];

export default function Navbar({ categoryFreshness = {}, topicFreshness = [] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const root = useRef(null);
  const trigger = useRef(null);
  const lastVisit = useLastVisit();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    function dismiss(event) {
      if (event.type === 'keydown' && event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
      if (event.type === 'pointerdown' && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss); };
  }, []);
  const topicsActive = /^\/(topic|topics|category|hub)(\/|$)/.test(pathname);
  const hasNew = topicFreshness.some(date => isNewSince(date, lastVisit));
  return (
    <nav ref={root} className="relative z-30 border-b border-line bg-paper" aria-label="Primary navigation" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
        <div className="grid w-full grid-cols-6 gap-1 sm:flex sm:w-auto">
          {destinations.map(item => {
            if (item.isBrowse) {
              return (
                <button key="browse" ref={trigger} type="button" aria-expanded={open} aria-controls="browse-topics" onClick={() => setOpen(!open)} aria-current={open || topicsActive ? 'page' : undefined} className={`nav-destination ${open || topicsActive ? 'bg-ink text-white shadow-sm' : 'text-slate hover:bg-white hover:text-ink'}`}>
                  <Icon name={item.icon} className="h-4 w-4" />
                  <span className="flex items-center gap-2">{item.label}{hasNew && <span className="h-2 w-2 rounded-full bg-alert" aria-label="New topic updates" />}</span>
                  <Icon name="chevron" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              );
            }
            const active = item.href === '/' ? pathname === '/' : item.href === '/topics' ? pathname === '/topics' || pathname.startsWith('/topic/') : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`nav-destination ${active ? 'bg-ink text-white shadow-sm' : 'text-slate hover:bg-white hover:text-ink'}`}><Icon name={item.icon} /><span>{item.label}</span></Link>;
          })}
        </div>
        <Link href="/saved" aria-current={pathname === "/saved" ? "page" : undefined} className="action-link ml-auto px-2"><Icon name="bookmark" className="h-4 w-4" />Saved</Link>
      </div>
      {open && <div id="browse-topics" className="absolute left-0 right-0 max-h-[70vh] overflow-y-auto border-y border-line bg-paper p-5 shadow-xl motion-enter">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between"><p className="font-display text-xl font-bold">Explore your interests</p><Link href="/topics" onClick={() => setOpen(false)} className="action-link">All topics <Icon name="arrow" className="h-4 w-4" /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{HUBS.map(hub => <section key={hub.slug} className="rounded-xl border border-line bg-white p-4"><Link href={`/hub/${hub.slug}`} onClick={() => setOpen(false)} className="font-display text-lg font-bold hover:text-wire">{hub.title}</Link><div className="mt-3 flex flex-wrap gap-2">{hub.categories.filter(category => category.active).map(category => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg bg-paper px-3 text-sm hover:bg-line">{category.title}{isNewSince(categoryFreshness[category.slug], lastVisit) && <span className="h-1.5 w-1.5 rounded-full bg-alert" aria-label="New stories" />}</Link>)}</div><Link href={`/hub/${hub.slug}`} onClick={() => setOpen(false)} className="mt-2 inline-block py-2 text-xs text-slate hover:text-ink">Explore section →</Link></section>)}</div>
        </div>
      </div>}
    </nav>
  );
}
