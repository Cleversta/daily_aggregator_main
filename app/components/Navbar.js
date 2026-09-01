'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HUBS } from '../../lib/categories';

export default function Navbar() {
  const [openHub, setOpenHub] = useState(null);

  return (
    <nav className="border-b border-line bg-paper">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex gap-6 overflow-x-auto py-3 text-sm">
          {HUBS.map((hub) => (
            <button
              key={hub.slug}
              onClick={() => setOpenHub(openHub === hub.slug ? null : hub.slug)}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors font-medium ${
                openHub === hub.slug
                  ? 'border-wire text-ink'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              {hub.title}
            </button>
          ))}
        </div>

        {openHub && (
          <div className="pb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {HUBS.find((h) => h.slug === openHub).categories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.active ? `/category/${cat.slug}` : '#'}
                onClick={(event) => {
                  if (!cat.active) event.preventDefault();
                }}
                className={
                  cat.active
                    ? 'text-ink underline decoration-wire/50 underline-offset-4 hover:decoration-wire'
                    : 'text-slate/60 cursor-default'
                }
                title={cat.active ? undefined : 'Coming soon'}
              >
                {cat.title}
                {!cat.active && <span className="text-xs align-super"> soon</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
