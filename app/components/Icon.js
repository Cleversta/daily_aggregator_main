const paths = {
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  news: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4',
  sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  book: 'M12 5v15 M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Z',
  play: 'm9 5 11 7-11 7Z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  clock: 'M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  bookmarkFilled: 'M6 3h12v18l-6-4-6 4Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  copy: 'M9 9h12v12H9z M15 9V3H3v12h6',
  check: 'm5 12 4 4L19 6',
};

export default function Icon({ name, className = 'h-5 w-5' }) {
  return <svg viewBox="0 0 24 24" fill={name === "bookmarkFilled" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}><path d={paths[name] || paths.news} /></svg>;
}
