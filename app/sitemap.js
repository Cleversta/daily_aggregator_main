import { supabase } from '../lib/supabase-client';
import { HUBS, getActiveCategories } from '../lib/categories';
import { getAllTopics } from '../lib/topics';

const BASE_URL = 'https://dailyaggregator.online';

export default async function sitemap() {
  const staticRoutes = ['', '/about', '/editorial-policy', '/privacy', '/contact', '/topics', '/youtube'].map(
    (path) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency: path === '' ? 'daily' : 'monthly',
      priority: path === '' ? 1 : 0.5,
    })
  );

  const hubRoutes = HUBS.map((hub) => ({
    url: `${BASE_URL}/hub/${hub.slug}`,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // Only active categories get a real page (inactive ones 404), so only
  // include those — matches generateStaticParams in category/[slug]/page.js.
  const { data: articles } = await supabase.from('articles').select('category, fetched_at');
  const fetchedAtByCategory = Object.fromEntries((articles || []).map((a) => [a.category, a.fetched_at]));

  const categoryRoutes = getActiveCategories().map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: fetchedAtByCategory[category.slug] || undefined,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // Every topic gets a static page regardless of whether it has content yet
  // (matches generateStaticParams in topic/[slug]/page.js).
  const topicRoutes = getAllTopics().map((topic) => ({
    url: `${BASE_URL}/topic/${topic.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...hubRoutes, ...categoryRoutes, ...topicRoutes];
}