import SavedItems from '../components/SavedItems';

export const metadata = {
  title: 'Saved items',
  description: 'Revisit your saved briefs and creator prompts on this device.',
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <div className="space-y-8"><header><p className="text-xs font-bold uppercase tracking-widest text-wire">Your library</p><h1 className="mt-3 font-display text-4xl font-bold">Good finds, kept close.</h1><p className="mt-3 text-slate">Your saved briefs and prompts, stored in this browser. Brief links open the latest coverage for that topic.</p></header><SavedItems full /></div>;
}
