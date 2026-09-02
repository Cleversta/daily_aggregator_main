'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase-client';
import YouTubePlayer from './YouTubePlayer';

function formatPublishedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently uploaded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatViewCount(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export default function HotNow() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    supabase
      .from('youtube_videos')
      .select('video_id, title, channel_title, thumbnail_url, video_url, published_at, duration, region_code, view_count')
      .eq('category', 'popular')
      .order('view_count', { ascending: false })
      .limit(160)
      .then(({ data }) => {
        const grouped = new Map();
        for (const video of data || []) {
          const existing = grouped.get(video.video_id);
          if (existing) {
            existing.regions.add(video.region_code);
            existing.viewCount = Math.max(existing.viewCount, Number(video.view_count || 0));
          } else {
            grouped.set(video.video_id, { ...video, regions: new Set([video.region_code]), viewCount: Number(video.view_count || 0) });
          }
        }

        setVideos(
          Array.from(grouped.values())
            .filter((video) => video.regions.size >= 2)
            .sort((a, b) => b.regions.size - a.regions.size || b.viewCount - a.viewCount)
            .slice(0, 3)
        );
      });
  }, []);

  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="hot-now" className="border-b border-line pb-12">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-2">Across YouTube</p>
          <h2 id="hot-now" className="font-display text-2xl font-bold text-ink">Hot right now</h2>
        </div>
        <Link href="/youtube" className="text-xs font-bold uppercase tracking-wide text-ink hover:text-wire">
          Browse YouTube <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <YouTubePlayer key={video.video_id} videoId={video.video_id} title={video.title} className="group block text-left">
            {video.thumbnail_url && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                {video.duration && <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{video.duration}</span>}
                <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F0C674]">
                  {video.regions.size} markets
                </span>
              </div>
            )}
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Video</p>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink group-hover:text-wire">{video.title}</h3>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate">
              {video.channel_title} <span aria-hidden="true">·</span> {formatViewCount(video.view_count)} views <span aria-hidden="true">·</span> {formatPublishedAt(video.published_at)}
            </p>
          </YouTubePlayer>
        ))}
      </div>
    </section>
  );
}
