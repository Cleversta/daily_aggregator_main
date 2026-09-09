import { notFound } from 'next/navigation';
import YouTubeSeoListing from '../../../components/YouTubeSeoListing';
import { YOUTUBE_REGIONS, youtubeRegion } from '../../../../lib/youtube';

export function generateStaticParams() { return YOUTUBE_REGIONS.map(({ code }) => ({ code: code.toLowerCase() })); }
export async function generateMetadata({ params }) {
  const { code } = await params; const region = youtubeRegion(code); if (!region) return {};
  const title = `Trending YouTube Videos in ${region.name} Today`;
  const description = `See popular YouTube videos trending in ${region.name}, refreshed daily with views, channels, and upload dates.`;
  return { title, description, alternates: { canonical: `/youtube/country/${code.toLowerCase()}` }, openGraph: { title, description } };
}
export default async function Page({ params }) {
  const { code } = await params; const region = youtubeRegion(code); if (!region) notFound();
  return <YouTubeSeoListing eyebrow={`${region.name} · YouTube`} title={`Trending YouTube videos in ${region.name} today`} description={`Discover popular videos viewers are watching in ${region.name}. This chart is refreshed daily from YouTube's public popularity data.`} region={region.code} />;
}

