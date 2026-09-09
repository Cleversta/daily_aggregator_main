import YouTubeSeoListing from '../../components/YouTubeSeoListing';
export const metadata = { title: 'Most Viewed YouTube Videos Today', description: 'See the most-viewed videos in today’s YouTube popularity charts.', alternates: { canonical: '/youtube/most-viewed' } };
export default function Page() { return <YouTubeSeoListing eyebrow="Popular now" title="Most-viewed YouTube videos today" description="Videos with the highest view totals in today’s selected YouTube popularity charts. This is a current daily chart, not an official all-time ranking." balanced={false} />; }
