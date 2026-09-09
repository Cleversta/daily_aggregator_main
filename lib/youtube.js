export const YOUTUBE_CATEGORIES = [
  { slug: 'popular', label: 'Trending', description: 'Popular YouTube videos trending across selected markets today.' },
  { slug: 'football', label: 'Football', description: 'Popular football highlights, analysis, interviews, and news on YouTube.' },
  { slug: 'anime', label: 'Anime', description: 'Popular anime trailers, openings, clips, reviews, and news on YouTube.' },
  { slug: 'film-animation', label: 'Animation', description: 'Trending animation, animated films, and creative videos on YouTube.' },
  { slug: 'music', label: 'Music', description: 'Popular music videos and performances trending on YouTube.' },
  { slug: 'gaming', label: 'Gaming', description: 'Popular gaming videos, releases, streams, and highlights on YouTube.' },
  { slug: 'entertainment', label: 'Entertainment', description: 'Popular entertainment videos trending on YouTube.' },
  { slug: 'comedy', label: 'Comedy', description: 'Popular comedy videos and creators trending on YouTube.' },
  { slug: 'education', label: 'Education', description: 'Popular educational videos, explainers, and lessons on YouTube.' },
  { slug: 'technology', label: 'Technology', description: 'Popular technology videos, reviews, and product news on YouTube.' },
  { slug: 'news', label: 'News', description: 'Popular news and current-affairs videos on YouTube.' },
  { slug: 'sports', label: 'All sports', description: 'Popular sports videos and highlights trending on YouTube.' },
];

export const YOUTUBE_REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'MX', name: 'Mexico' },
];

export function youtubeCategory(slug) {
  return YOUTUBE_CATEGORIES.find((category) => category.slug === slug);
}

export function youtubeRegion(code) {
  return YOUTUBE_REGIONS.find((region) => region.code.toLowerCase() === String(code).toLowerCase());
}

