// lib/guide.js
//
// The Guide's 6 categories. Unlike lib/categories.js (news hubs), an intent
// can belong to more than one category via `categorySlugs` — this is how we
// avoid duplicate pages for things like "remove background" that fit both
// Images and Design. The category itself is just a label for grouping in
// the nav and index page; the actual content lives in Supabase.

export const GUIDE_CATEGORIES = [
  { slug: 'images', title: 'Images', icon: '🖼️' },
  { slug: 'documents', title: 'Documents', icon: '📄' },
  { slug: 'coding', title: 'Coding', icon: '💻' },
  { slug: 'money', title: 'Money', icon: '💰' },
  { slug: 'writing', title: 'Writing', icon: '✍️' },
  { slug: 'design', title: 'Design', icon: '🎨' },
];

export function getCategoryBySlug(slug) {
  return GUIDE_CATEGORIES.find((c) => c.slug === slug) || null;
}

import { supabase } from './supabase-client';

// All three fetch functions below run at BUILD TIME only (called from
// Server Components in app/guide/page.js and app/guide/[slug]/page.js).
// No Guide page ever calls Supabase from the browser.

export async function getPublishedIntents() {
  const { data, error } = await supabase
    .from('guide_intents')
    .select('slug, name, category, description, updated_at')
    .eq('status', 'published')
    .order('name');

  if (error) {
    console.error('Failed to load guide intents at build time:', error.message);
    return [];
  }
  return data || [];
}

export async function getIntentBySlug(slug) {
  const { data: intent, error: intentError } = await supabase
    .from('guide_intents')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (intentError || !intent) return null;

  const { data: recommendations } = await supabase
    .from('guide_recommendations')
    .select('*')
    .eq('intent_id', intent.id)
    .eq('status', 'published')
    .order('rank');

  return { ...intent, recommendations: recommendations || [] };
}