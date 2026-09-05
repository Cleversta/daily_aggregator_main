import { supabase } from '../../lib/supabase-client';
import { getActiveCategories } from '../../lib/categories';

// Generated once at build time (same as the homepage), not per-request —
// required for `output: 'export'` static builds.
export const dynamic = 'force-static';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gator.online';

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { data: articles, error } = await supabase.from('articles').select('*');

  if (error) {
    console.error('feed.xml: failed to load articles at build time:', error.message);
  }

  const activeCategories = getActiveCategories();

  const items = (articles || [])
    .filter((article) => activeCategories.some((c) => c.slug === article.category))
    .sort((a, b) => new Date(b.fetched_at) - new Date(a.fetched_at))
    .map((article) => {
      const category = activeCategories.find((c) => c.slug === article.category);
      const title = category ? `${category.title}: ${article.headline}` : article.headline;
      const link = `${SITE_URL}/category/${article.category}`;

      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${escapeXml(article.category)}-${escapeXml(article.fetched_at)}</guid>
      <pubDate>${new Date(article.fetched_at).toUTCString()}</pubDate>
      <description>${escapeXml(article.summary)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Daily Aggregator</title>
    <link>${SITE_URL}</link>
    <description>The essential stories, in a few minutes.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}