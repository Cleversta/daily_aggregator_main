export const dynamic = 'force-static';
import { supabase } from '../lib/supabase-client';
import { HUBS, getActiveCategories } from '../lib/categories';
import { getPublishedIntents } from '../lib/guide';
import { getAllTopics } from '../lib/topics';
import { YOUTUBE_CATEGORIES, YOUTUBE_REGIONS } from '../lib/youtube';

const BASE_URL = 'https://dailyaggregator.online';

export default async function sitemap() {
  const staticRoutes = ['', '/about', '/editorial-policy', '/privacy', '/contact', '/topics', '/youtube', '/guide', '/creator-ideas'].map(
    (path) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency: path === '' || path === '/creator-ideas' ? 'daily' : 'monthly',
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

  const guides = await getPublishedIntents();
  const guideRoutes = guides.map(g => ({ url: `${BASE_URL}/guide/${g.slug}`, lastModified: g.updated_at, changeFrequency: 'monthly', priority: 0.7 }));
  const youtubeRoutes = [
    '/youtube/trending-today', '/youtube/most-viewed',
    ...YOUTUBE_CATEGORIES.map(({ slug }) => `/youtube/category/${slug}`),
    ...YOUTUBE_REGIONS.map(({ code }) => `/youtube/country/${code.toLowerCase()}`),
  ].map((path) => ({ url: `${BASE_URL}${path}`, changeFrequency: 'daily', priority: 0.7 }));
  return [...staticRoutes, ...hubRoutes, ...categoryRoutes, ...topicRoutes, ...guideRoutes, ...youtubeRoutes];
}
