export const metadata = {
  title: 'Add a guide',
  robots: { index: false, follow: false },
};

import AdminGuideForm from './AdminGuideForm';

export default function AdminGuidePage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Add a guide entry</h1>
      <AdminGuideForm />
    </div>
  );
}