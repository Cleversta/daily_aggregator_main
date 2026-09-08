// Full static build against synthetic Supabase responses, never production data.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, rm, cp, mkdtemp } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { starters } from '../lib/guide-workflow.mjs';
const publication = '11111111-1111-4111-8111-111111111111';
const intents = starters.map((s, i) => ({ ...s, id: `fixture-${i}`, status: 'published',
  description: 'Synthetic guide used only for build validation.', updated_at: '2026-01-01T00:00:00Z',
  steps: ['Choose a sample file.', 'Review the result.'], sources: [{ title: 'Fixture evidence', url: 'https://example.com/docs' }],
  verification: 'documentation', verified_on: '2026-01-01', publication_id: publication,
}));
const recs = intents.map(i => ({ id: i.id, intent_id: i.id, name: 'Fixture tool', url: 'https://example.com',
  description: 'A synthetic recommendation.', reason: 'Build test only.', limitations: 'Unknown', signup: 'Unknown', privacy: 'Unknown',
  source_urls: ['https://example.com/docs'], status: 'published', rank: 1, is_stale: false,
}));
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const table = url.pathname.split('/').at(-1);
  let rows = table === 'guide_intents' ? intents : table === 'guide_recommendations' ? recs : table === 'guide_search_phrases' ? intents.map(i => ({ intent_id: i.id, phrase: 'sample phrase' })) : [];
  for (const [key, value] of url.searchParams) if (value.startsWith('eq.')) rows = rows.filter(r => String(r[key]) === value.slice(3));
  const single = req.headers.accept?.includes('vnd.pgrst.object+json');
  res.setHeader('Content-Type', 'application/json');
  if (single && rows.length !== 1) { res.statusCode = 406; res.end(JSON.stringify({ message: 'Fixture has no row', code: 'PGRST116' })); }
  else res.end(JSON.stringify(single ? rows[0] : rows));
});
const indexPath = new URL('../public/guide-index.json', import.meta.url);
let original;
try { original = await readFile(indexPath); } catch {}
const backup = await mkdtemp(path.join(tmpdir(), 'guide-build-backup-'));
const savedDirs = [];
for (const dir of ['.next', 'out']) {
    try { await cp(dir, path.join(backup, dir), { recursive: true }); savedDirs.push(dir); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const status = await new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env,
      SUPABASE_URL: endpoint, SUPABASE_SERVICE_ROLE_KEY: 'fixture-key',
      NEXT_PUBLIC_SUPABASE_URL: endpoint, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-key',
      NEXT_PUBLIC_SITE_URL: 'https://dailyaggregator.online',
    } }); child.on('error', reject); child.on('exit', resolve);
  });
  assert.equal(status, 0, 'Static build failed');
  const sitemap = await readFile(new URL('../out/sitemap.xml', import.meta.url), 'utf8');
  for (const guide of starters) {
    const html = await readFile(new URL(`../out/guide/${guide.slug}.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(`data-guide-publication="${publication}"`));
    assert.ok(html.includes('Fixture evidence'));
    assert.ok(html.includes('How to do it'));
    assert.ok(sitemap.includes(`/guide/${guide.slug}`));
  }
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  assert.equal(index.length, 15);
  console.log('PASS: all 15 synthetic guides exported with evidence, publication markers, sitemap and search index.');
} finally {
  server.close();
  if (original) await writeFile(indexPath, original); else await rm(indexPath, { force: true });
  for (const dir of ['.next', 'out']) {
    await rm(dir, { recursive: true, force: true });
    if (savedDirs.includes(dir)) await cp(path.join(backup, dir), dir, { recursive: true });
  }
  await rm(backup, { recursive: true, force: true });
}
