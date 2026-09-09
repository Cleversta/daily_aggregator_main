import YouTubePlayer from './YouTubePlayer';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently uploaded' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatViews(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export default function YouTubeVideoGrid({ videos, headingLevel = 'h2' }) {
  const Heading = headingLevel;
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <YouTubePlayer key={`${video.video_id}-${video.region_code || 'global'}`} videoId={video.video_id} title={video.title} className="group block text-left">
          {video.thumbnail_url && <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
            {video.duration && <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{video.duration}</span>}
          </div>}
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-wire">{video.region_code || 'Video'}</p>
          <Heading className="mt-1 font-display text-xl font-bold leading-snug text-ink group-hover:text-wire">{video.title}</Heading>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate">{video.channel_title} · {formatViews(video.view_count)} views · {formatDate(video.published_at)}</p>
        </YouTubePlayer>
      ))}
    </div>
  );
}

