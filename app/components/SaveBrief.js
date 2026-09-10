'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import { readSavedItems, saveItem, removeSavedItem, subscribeSavedItems } from './SavedItems';

export default function SaveBrief({ slug, title, summary }) {
  const id = `brief-${slug}`;
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const update = () => setIsSaved(readSavedItems().some((item) => item.id === id));
    update();
    return subscribeSavedItems(update);
  }, [id]);

  function saveBrief() {
    try {
    setError('');
    if (readSavedItems().some(item => item.id === id)) { removeSavedItem(id); return; }
    saveItem({ id, type: 'brief', title, description: summary, href: `/category/${slug}`, savedAt: Date.now() });
    setIsSaved(true);
    } catch { setError('Unable to save on this device.'); }
  }

  return (
    <span><button type="button" onClick={saveBrief} aria-pressed={isSaved} aria-label={isSaved ? `Unsave ${title}` : `Save ${title}`} className={`save-toggle ${isSaved ? "is-saved" : ""}`}>
      <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} className="h-4 w-4" />{isSaved ? 'Unsave' : 'Save brief'}
    </button><span role="status" className="block text-xs text-slate">{error}</span></span>
  );
}
