'use client';

import { useEffect, useState } from 'react';
import { readSavedItems, saveItem } from './SavedItems';

export default function SaveBrief({ slug, title, summary }) {
  const id = `brief-${slug}`;
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(readSavedItems().some((item) => item.id === id));
  }, [id]);

  function saveBrief() {
    saveItem({ id, type: 'brief', title, description: summary, href: `/category/${slug}`, savedAt: Date.now() });
    setIsSaved(true);
  }

  return (
    <button type="button" onClick={saveBrief} disabled={isSaved} className="text-xs font-bold uppercase tracking-wide text-ink hover:text-wire disabled:cursor-default disabled:text-slate">
      {isSaved ? 'Saved' : 'Save brief'} <span aria-hidden="true">{isSaved ? '✓' : '＋'}</span>
    </button>
  );
}
