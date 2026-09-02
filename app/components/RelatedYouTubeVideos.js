'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import YouTubePlayer from './YouTubePlayer';

const YOUTUBE_CATEGORY_BY_NEWS_CATEGORY = {
  ai: 'technology',
  technology: 'technology',
  football: 'sports',
  'combat-sports': 'sports',
  gaming: 'gaming',
  movies: 'entertainment',
  entertainment: 'entertainment',
};

function formatPublishedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently uploaded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatViewCount(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export default function RelatedYouTubeVideos({ category }) {
  const youtubeCategory = YOUTUBE_CATEGORY_BY_NEWS_CATEGORY[category];
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!youtubeCategory) return;
    supabase
      .from('youtube_videos')
      .select('video_id, title, channel_title, thumbnail_url, video_url, published_at, duration, region_code, view_count')
      .eq('category', youtubeCategory)
      .order('view_count', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const uniqueVideos = Array.from(new Map((data || []).map((video) => [video.video_id, video])).values());
        setVideos(uniqueVideos.slice(0, 3));
      });
  }, [youtubeCategory]);

  if (!youtubeCategory || videos.length === 0) return null;

  return (
    <section className="border-t border-line pt-7 mt-8">
      <p className="text-xs uppercase tracking-[0.16em] font-bold text-wire mb-4">Related on YouTube</p>
      <div className="grid gap-5 sm:grid-cols-3">
        {videos.map((video) => (
          <YouTubePlayer key={video.video_id} videoId={video.video_id} title={video.title} className="group block text-left">
            {video.thumbnail_url && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                {video.duration && <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{video.duration}</span>}
              </div>
            )}
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Video</p>
            <h2 className="mt-1 font-display text-base font-bold leading-snug text-ink group-hover:text-wire">{video.title}</h2>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate">
              {video.channel_title} <span aria-hidden="true">·</span> {formatViewCount(video.view_count)} views <span aria-hidden="true">·</span> {formatPublishedAt(video.published_at)}
            </p>
          </YouTubePlayer>
        ))}
      </div>
    </section>
  );
}
