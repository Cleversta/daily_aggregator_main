'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import YouTubePlayer from './YouTubePlayer';

const filters = [
  { id: 'popular', label: 'Popular' },
  { id: 'sports', label: 'Sports' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'music', label: 'Music' },
  { id: 'technology', label: 'Technology' },
];

function formatPublishedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently uploaded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatViewCount(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export default function YouTubeBrowser() {
  const [selectedFilter, setSelectedFilter] = useState('popular');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    if (filters.some((filter) => filter.id === requestedCategory)) setSelectedFilter(requestedCategory);
    supabase
      .from('youtube_videos')
      .select('video_id, category, title, channel_title, thumbnail_url, video_url, published_at, duration, region_code, view_count')
      .eq('category', requestedCategory || 'popular')
      .order('view_count', { ascending: false })
      .limit(160)
      .then(({ data }) => setRows(data || []));
  }, []);

  const videos = useMemo(() => {
    const uniqueVideos = Array.from(new Map(rows.map((video) => [video.video_id, video])).values());
    return uniqueVideos.slice(0, 24);
  }, [rows]);

  function chooseFilter(category) {
    setSelectedFilter(category);
    supabase
      .from('youtube_videos')
      .select('video_id, category, title, channel_title, thumbnail_url, video_url, published_at, duration, region_code, view_count')
      .eq('category', category)
      .order('view_count', { ascending: false })
      .limit(160)
      .then(({ data }) => setRows(data || []));
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-7">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => chooseFilter(filter.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedFilter === filter.id ? 'bg-ink text-white' : 'border border-line bg-white text-slate hover:text-ink'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <YouTubePlayer key={video.video_id} videoId={video.video_id} title={video.title} className="group block text-left">
            {video.thumbnail_url && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                  {video.duration && <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{video.duration}</span>}
              </div>
            )}
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-wire">Video</p>
            <h2 className="mt-1 font-display text-xl font-bold leading-snug text-ink group-hover:text-wire">{video.title}</h2>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate">
              {video.channel_title} <span aria-hidden="true">·</span> {formatViewCount(video.view_count)} views <span aria-hidden="true">·</span> {formatPublishedAt(video.published_at)}
            </p>
            </YouTubePlayer>
          ))}
      </div>
    </>
  );
}
