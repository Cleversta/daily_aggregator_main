export const metadata = {
  title: 'Guide workspace',
  robots: { index: false, follow: false },
};

import AdminGuideForm from './AdminGuideForm';

export default function AdminGuidePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Guide workspace</h1>
      <AdminGuideForm />
    </div>
  );
}
