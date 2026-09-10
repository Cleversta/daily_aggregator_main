'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import YouTubePlayer from './YouTubePlayer';
import { YOUTUBE_CATEGORIES, YOUTUBE_REGIONS } from '../../lib/youtube';

const filters = YOUTUBE_CATEGORIES.map(({ slug, label }) => ({ id: slug, label }));

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
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [rows, setRows] = useState([]);

  function loadVideos(category, region = selectedRegion) {
    let query = supabase.from('youtube_videos')
      .select('video_id, category, title, channel_title, thumbnail_url, video_url, published_at, duration, region_code, view_count, fetched_at')
      .eq('category', category)
    .gte('fetched_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()).order('view_count', { ascending: false }).limit(200);
    if (region !== 'global') query = query.eq('region_code', region);
    query.then(({ data }) => setRows(data || []));
  }

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    if (filters.some((filter) => filter.id === requestedCategory)) setSelectedFilter(requestedCategory);
    loadVideos(requestedCategory || 'popular', 'global');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const videos = useMemo(() => {
    const uniqueVideos = Array.from(new Map(rows.map((video) => [video.video_id, video])).values());
    if (selectedRegion !== 'global') return uniqueVideos.slice(0, 24);
    const buckets = new Map(YOUTUBE_REGIONS.map(({ code }) => [code, []]));
    uniqueVideos.forEach((video) => buckets.get(video.region_code)?.push(video));
    const balanced = [];
    for (let index = 0; balanced.length < 24; index++) {
      let added = false;
      for (const { code } of YOUTUBE_REGIONS) {
        const video = buckets.get(code)?.[index];
        if (video && !balanced.some((item) => item.video_id === video.video_id)) { balanced.push(video); added = true; }
        if (balanced.length === 24) break;
      }
      if (!added) break;
    }
    return balanced;
  }, [rows, selectedRegion]);

  function chooseFilter(category) {
    setSelectedFilter(category);
    loadVideos(category);
  }

  function chooseRegion(region) { setSelectedRegion(region); loadVideos(selectedFilter, region); }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-7">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={selectedFilter === filter.id}
            onClick={() => chooseFilter(filter.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selectedFilter === filter.id ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate hover:text-ink'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="mb-8 flex items-center gap-3 border-y border-line py-4">
        <label htmlFor="youtube-region" className="text-sm font-bold text-ink">Market</label>
        <select id="youtube-region" value={selectedRegion} onChange={(event) => chooseRegion(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink">
          <option value="global">Balanced global</option>
          {YOUTUBE_REGIONS.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
        </select>
        <span className="hidden text-sm text-slate sm:inline">Global rotates through every market instead of ranking only by raw views.</span>
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
              {video.channel_title} <span aria-hidden="true">·</span> {formatViewCount(video.view_count)} views <span aria-hidden="true">·</span> Uploaded {formatPublishedAt(video.published_at)}
            </p>
            </YouTubePlayer>
          ))}
      </div>
    </>
  );
}
