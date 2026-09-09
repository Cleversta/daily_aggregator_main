import { notFound } from 'next/navigation';
import YouTubeSeoListing from '../../../components/YouTubeSeoListing';
import { YOUTUBE_CATEGORIES, youtubeCategory } from '../../../../lib/youtube';

export function generateStaticParams() { return YOUTUBE_CATEGORIES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params; const category = youtubeCategory(slug); if (!category) return {};
  const title = `${category.label} YouTube Videos Trending Today`;
  return { title, description: category.description, alternates: { canonical: `/youtube/category/${slug}` }, openGraph: { title, description: category.description } };
}
export default async function Page({ params }) {
  const { slug } = await params; const category = youtubeCategory(slug); if (!category) notFound();
  return <YouTubeSeoListing eyebrow="YouTube trends" title={`${category.label} YouTube videos trending today`} description={category.description} category={slug} />;
}

