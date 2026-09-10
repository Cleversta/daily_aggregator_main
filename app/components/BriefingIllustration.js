import Icon from './Icon';
import TopicArtwork from './TopicArtwork';

export default function BriefingIllustration() {
  return (
    <div className="briefing-illustration" aria-hidden="true">
      <div className="illustration-orbit illustration-orbit-outer" />
      <div className="illustration-orbit illustration-orbit-inner" />
      <span className="illustration-star illustration-star-one">✦</span>
      <span className="illustration-star illustration-star-two">✦</span>
      <div className="illustration-sheet illustration-sheet-back" />
      <div className="illustration-sheet illustration-sheet-front">
        <div className="mb-4 flex items-center justify-between border-b border-ink/15 pb-3"><span className="text-[10px] font-bold uppercase tracking-[0.2em]">The daily edit</span><Icon name="news" className="h-4 w-4" /></div>
        <TopicArtwork className="w-full rounded-lg" />
        <p className="mt-4 font-display text-2xl font-bold leading-tight">A little context.<br />A bigger picture.</p>
        <div className="mt-4 h-1.5 w-full rounded bg-ink/10" /><div className="mt-2 h-1.5 w-2/3 rounded bg-ink/10" />
        <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><span className="h-2 w-2 rounded-full bg-[#277565]" />News · Ideas · Guides</div>
      </div>
      <div className="illustration-chip illustration-chip-play"><span className="rounded-full bg-[#E6EEE6] p-3 text-[#174D43]"><Icon name="play" /></span><span>Worth a watch<small>A fresh perspective</small></span></div>
      <div className="illustration-chip illustration-chip-idea"><span className="rounded-full bg-[#F5E6C1] p-3 text-[#80621F]"><Icon name="sparkles" /></span><span>Your next idea<small>Starts with curiosity</small></span></div>
    </div>
  );
}
