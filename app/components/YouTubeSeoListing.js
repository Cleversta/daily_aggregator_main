import Link from 'next/link';
import { supabase } from '../../lib/supabase-client';
import { YOUTUBE_CATEGORIES, YOUTUBE_REGIONS } from '../../lib/youtube';
import YouTubeVideoGrid from './YouTubeVideoGrid';

export async function getYouTubeVideos({ category = 'popular', region, limit = 24, balanced = true }) {
  let query = supabase.from('youtube_videos')
    .select('video_id,category,title,channel_title,thumbnail_url,video_url,published_at,duration,region_code,view_count,fetched_at')
    .eq('category', category)
    .gte('fetched_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order('view_count', { ascending: false })
    .limit(region ? limit : 160);
  if (region) query = query.eq('region_code', region);
  const { data, error } = await query;
  if (error) return [];
  const unique = Array.from(new Map((data || []).map((video) => [video.video_id, video])).values());
  if (region || !balanced) return unique.slice(0, limit);

  // A round-robin global list prevents one high-population market from
  // occupying the entire page merely because its raw view totals are larger.
  const buckets = new Map(YOUTUBE_REGIONS.map(({ code }) => [code, []]));
  for (const video of unique) buckets.get(video.region_code)?.push(video);
  const balancedVideos = [];
  for (let index = 0; balancedVideos.length < limit; index++) {
    let added = false;
    for (const { code } of YOUTUBE_REGIONS) {
      const video = buckets.get(code)?.[index];
      if (video && !balancedVideos.some((item) => item.video_id === video.video_id)) {
        balancedVideos.push(video); added = true;
        if (balancedVideos.length === limit) break;
      }
    }
    if (!added) break;
  }
  return balancedVideos;
}

export default async function YouTubeSeoListing({ title, eyebrow, description, category = 'popular', region, balanced = true }) {
  const videos = await getYouTubeVideos({ category, region, balanced });
  const updatedAt = videos.map((video) => video.fetched_at).filter(Boolean).sort().at(-1);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: title,
    itemListElement: videos.map((video, index) => ({ '@type': 'ListItem', position: index + 1, url: video.video_url, name: video.title })),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="border-b border-line pb-8 mb-8">
      <p className="text-xs uppercase tracking-[0.18em] font-bold text-wire mb-3">{eyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05]">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">{description}</p>
      {updatedAt && <p className="mt-3 text-xs uppercase tracking-wide text-slate">Updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
    </section>

    <nav className="mb-8 border-b border-line pb-7" aria-label="Explore YouTube trends">
      <h2 className="font-display text-2xl font-bold">Explore more YouTube trends</h2>
      <div className="mt-4 flex flex-wrap gap-2">{YOUTUBE_CATEGORIES.map((item) => <Link key={item.slug} href={`/youtube/category/${item.slug}`} className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium hover:border-wire">{item.label}</Link>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{YOUTUBE_REGIONS.map((item) => <Link key={item.code} href={`/youtube/country/${item.code.toLowerCase()}`} className="text-sm text-slate underline decoration-wire/40 underline-offset-4 hover:text-ink">{item.name}</Link>)}</div>
    </nav>
    {videos.length ? <YouTubeVideoGrid videos={videos} /> : <p className="rounded-lg border border-line bg-white p-5 text-slate">Videos for this page will appear after the next daily YouTube update.</p>}
  </>;
}
