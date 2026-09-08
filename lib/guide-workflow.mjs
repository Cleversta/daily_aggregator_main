export const categories = ['images', 'documents', 'coding', 'money', 'writing', 'design', 'cooking', 'home'];
export const starters = [
  ['make-photo-smaller', 'Make a photo smaller in KB or MB', 'images'],
  ['resize-photo', 'Resize a photo’s dimensions', 'images'],
  ['remove-photo-background', 'Remove a photo background', 'images'],
  ['heic-to-jpg', 'Convert HEIC to JPG', 'images'],
  ['jpg-to-png', 'Convert JPG to PNG', 'images'],
  ['jpg-to-pdf', 'Convert JPG to PDF', 'documents'],
  ['pdf-to-word', 'Convert PDF to Word', 'documents'],
  ['compress-pdf', 'Compress a PDF', 'documents'],
  ['merge-pdf', 'Merge PDF files', 'documents'],
  ['split-pdf', 'Split a PDF', 'documents'],
  ['sign-pdf', 'Add a signature to a PDF', 'documents'],
  ['image-to-text', 'Extract text from an image', 'documents'],
  ['calculate-percentage', 'Calculate a percentage', 'money'],
  ['dinner-from-ingredients', 'Find dinner recipes using ingredients you have', 'cooking'],
  ['plan-small-room', 'Plan the layout of a small room', 'home'],
].map(([slug, name, category]) => ({ slug, name, category }));

export function httpUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}
const str = (value, max = 5000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export function normalizeGuide(input, publish = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid guide.');
  const slug = str(input.slug, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a lowercase URL slug with letters, numbers and hyphens.');
  const name = str(input.name, 160);
  if (!name || !categories.includes(input.category)) throw new Error('Task name and a valid category are required.');
  const list = (value, max, length) => (Array.isArray(value) ? value : []).slice(0, max).map(v => str(v, length)).filter(Boolean);
  const sources = (Array.isArray(input.sources) ? input.sources : []).slice(0, 12).map(s => ({ title: str(s?.title, 200), url: str(s?.url, 2000) }));
  if (sources.some(s => !httpUrl(s.url))) throw new Error('Source links must be valid HTTP or HTTPS URLs.');
  const recommendations = (Array.isArray(input.recommendations) ? input.recommendations : []).slice(0, 5)
    .filter(r => r && (r.name || r.url)).map(r => ({
      name: str(r.name, 160), url: str(r.url, 2000), description: str(r.description), reason: str(r.reason),
      limitations: str(r.limitations), signup: str(r.signup, 300), privacy: str(r.privacy),
      source_urls: list(r.source_urls, 6, 2000),
    }));
  if (recommendations.some(r => !r.name || !httpUrl(r.url) || r.source_urls.some(u => !httpUrl(u)))) throw new Error('Each recommendation needs a name and valid links.');
  const guide = { slug, name, category: input.category, description: str(input.description, 1000),
    phrases: list(input.phrases, 30, 150), steps: list(input.steps, 15, 1500), sources, recommendations,
    verification: ['documentation', 'tested'].includes(input.verification) ? input.verification : 'unverified',
    verified_on: /^\d{4}-\d{2}-\d{2}$/.test(input.verified_on || '') ? input.verified_on : '',
  };
  if (guide.verified_on && (Number.isNaN(Date.parse(guide.verified_on)) || new Date(guide.verified_on).toISOString().slice(0, 10) !== guide.verified_on || guide.verified_on > new Date().toISOString().slice(0, 10))) throw new Error('Verification date must be a real date, no later than today.');
  if (publish && (!guide.description || !guide.steps.length || !recommendations.length || !sources.length || guide.verification === 'unverified' || !guide.verified_on)) throw new Error('Before publishing, add a description, steps, recommendations, sources and your verification method/date.');
  if (publish && recommendations.some(r => !r.description || !r.reason || !r.limitations || !r.signup || !r.privacy || !r.source_urls.length || r.source_urls.some(url => !sources.some(s => s.url === url)))) throw new Error('Every recommendation needs its description, reason, limits, signup/privacy details, and evidence links from the guide sources. Use “Unknown” where sources do not establish a claim.');
  return guide;
}

export function validateAIDraft(result, input, sources) {
  // The model cannot choose the task, claim personal testing or invent evidence URLs.
  const guide = normalizeGuide({ ...result, slug: input.slug, name: input.name, category: input.category,
    sources: sources.map(({ title, url }) => ({ title, url })), verification: 'unverified', verified_on: '' });
  const urls = new Set(sources.map(s => s.url));
  if (!guide.description || !guide.steps.length || !guide.recommendations.length ||
      guide.recommendations.some(r => !r.source_urls.length || r.source_urls.some(url => !urls.has(url)) || !sources.some(s => new URL(s.url).origin === new URL(r.url).origin))) {
    throw new Error('AI draft lacks instructions or valid source evidence. Review the sources and try again.');
  }
  return guide;
}
