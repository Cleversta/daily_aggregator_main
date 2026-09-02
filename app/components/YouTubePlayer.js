'use client';

import { useEffect, useState } from 'react';

export default function YouTubePlayer({ videoId, title, className, children }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className} aria-label={`Play ${title}`}>
        {children}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Playing ${title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl">
            <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 text-white">
              <p className="truncate text-sm font-medium">{title}</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded px-2 py-1 text-sm font-bold text-white hover:bg-white/15"
                aria-label="Close video"
              >
                Close <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
