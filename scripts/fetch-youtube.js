// Saves a daily snapshot of public YouTube popular videos. This uses only the
// server-side YOUTUBE_API_KEY and never exposes it to site visitors.
require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';
const REQUEST_TIMEOUT_MS = 20_000;
// YouTube's popular chart is country-based; it has no single global chart.
// These markets create a broad global composite while keeping API usage modest.
const regionCodes = (process.env.YOUTUBE_REGION_CODES || 'US,GB,IN,ID,BR,JP,DE,MX')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);
const feeds = [
  { category: 'popular', videoCategoryId: null },
  { category: 'sports', videoCategoryId: '17' },
  { category: 'gaming', videoCategoryId: '20' },
  { category: 'entertainment', videoCategoryId: '24' },
  { category: 'music', videoCategoryId: '10' },
  { category: 'technology', videoCategoryId: '28' },
];

async function getPopularVideos(feed, regionCode) {
  const params = new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY || '',
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode,
    maxResults: '20',
  });
  if (feed.videoCategoryId) params.set('videoCategoryId', feed.videoCategoryId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${YOUTUBE_API_URL}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`YouTube API responded with status ${response.status}`);
    const data = await response.json();
    return data.items || [];
  } finally {
    clearTimeout(timeout);
  }
}

function formatDuration(value) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value || '');
  if (!match) return null;
  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes);
  return totalMinutes > 0 ? `${totalMinutes}:${seconds.padStart(2, '0')}` : `0:${seconds.padStart(2, '0')}`;
}

function toRows(items, category, regionCode) {
  const fetchedAt = new Date().toISOString();
  const capturedOn = fetchedAt.slice(0, 10);
  return items.map((video) => ({
    video_id: video.id,
    category,
    title: video.snippet.title,
    channel_title: video.snippet.channelTitle,
    thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || null,
    video_url: `https://www.youtube.com/watch?v=${video.id}`,
    published_at: video.snippet.publishedAt,
    duration: formatDuration(video.contentDetails?.duration),
    view_count: video.statistics?.viewCount || 0,
    like_count: video.statistics?.likeCount || 0,
    region_code: regionCode,
    fetched_at: fetchedAt,
    captured_on: capturedOn,
  }));
}

async function saveVideos(supabase, rows) {
  const currentRows = rows.map(({ captured_on, ...video }) => video);
  const snapshots = rows.map(({ title, channel_title, thumbnail_url, video_url, published_at, duration, fetched_at, ...snapshot }) => snapshot);

  const { error: videoError } = await supabase
    .from('youtube_videos')
    .upsert(currentRows, { onConflict: 'video_id,category,region_code' });
  if (videoError) throw new Error(`Could not save videos: ${videoError.message}`);

  const { error: snapshotError } = await supabase
    .from('youtube_trend_snapshots')
    .upsert(snapshots, { onConflict: 'video_id,category,region_code,captured_on' });
  if (snapshotError) throw new Error(`Could not save snapshots: ${snapshotError.message}`);
}

async function run() {
  if (!process.env.YOUTUBE_API_KEY) throw new Error('Missing YOUTUBE_API_KEY');
  const supabase = getSupabaseAdmin();

  for (const regionCode of regionCodes) {
    for (const feed of feeds) {
      try {
        const rows = toRows(await getPopularVideos(feed, regionCode), feed.category, regionCode);
        await saveVideos(supabase, rows);
        console.log(`✅ ${regionCode} ${feed.category}: saved ${rows.length} popular videos.`);
      } catch (error) {
        console.error(`❌ ${regionCode} ${feed.category}: ${error.message}`);
      }
    }
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
