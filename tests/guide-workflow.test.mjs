import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuide, validateAIDraft, starters } from '../lib/guide-workflow.mjs';
import { researchGuide, reserve, QuotaWait, processOne } from '../lib/guide-ai.mjs';
import { onRequestPost } from '../functions/admin-add-guide.js';

const source = { title: 'Official documentation', url: 'https://example.com/docs', content: 'A tool with a free trial.' };
const base = { slug: 'compress-photo', name: 'Compress a photo', category: 'images', description: 'Reduce file size.',
  steps: ['Choose a photo.', 'Download the result.'], phrases: ['make photo smaller'], sources: [source], verification: 'documentation', verified_on: '2026-01-01',
  recommendations: [{ name: 'Example', url: 'https://example.com', description: 'Compress images.', reason: 'Simple controls.', limitations: 'Free trial only.', signup: 'Unknown', privacy: 'Unknown', source_urls: [source.url] }],
};
const env = { TAVILY_API_KEY: 'fake', GEMINI_API_KEY: 'fake', GUIDE_GEMINI_MODEL: 'fixture-model' };
const job = { id: 'job', slug: base.slug, input: base, attempts: 1, draft_version: 1 };
function mockDB({ quota = true, jobs = [], version = 1 } = {}) {
  const calls = [];
  return { calls,
    async rpc(name, args) { calls.push({ name, args }); return { data: name === 'guide_claim' ? jobs : quota }; },
    from(table) { const query = { table }; calls.push(query); const builder = {
      update(values) { query.values = values; return builder; }, select() { return builder; }, eq() { return builder; },
      async single() { return { data: { version } }; }, then(resolve) { return Promise.resolve({ data: [] }).then(resolve); },
    }; return builder; },
  };
}

test('15 unique, valid starter drafts cannot be published without evidence', () => {
  assert.equal(starters.length, 15); assert.equal(new Set(starters.map(s=>s.slug)).size,15);
  for (const starter of starters) { assert.ok(normalizeGuide(starter)); assert.throws(()=>normalizeGuide(starter,true)); }
});
test('publishing requires verification and evidence, accepts a complete reviewed guide', () => {
  assert.equal(normalizeGuide(base,true).name,base.name);
  assert.throws(()=>normalizeGuide({...base,verification:'unverified'},true));
  assert.throws(()=>normalizeGuide({...base,verified_on:'2026-02-31'},true));
  assert.throws(()=>normalizeGuide({...base,recommendations:[{...base.recommendations[0],source_urls:[]}]},true));
  assert.throws(()=>normalizeGuide({...base,recommendations:[{...base.recommendations[0],url:'javascript:alert(1)'}]}));
});
test('AI never sets verification and cannot invent evidence URLs', () => {
  const result=validateAIDraft(base,base,[source]); assert.equal(result.verification,'unverified'); assert.equal(result.verified_on,'');
  assert.throws(()=>validateAIDraft({...base,recommendations:[{...base.recommendations[0],source_urls:['https://invented.com']}]},base,[source]));
});
test('missing configuration and wrong password are rejected before database work', async () => {
  const call=(body,environment)=>onRequestPost({ request:new Request('https://example.com/admin-add-guide',{method:'POST',body:JSON.stringify(body)}),env:environment });
  assert.equal((await call({},{})).status,503);
  assert.equal((await call({secret:'wrong'},{ADMIN_SECRET:'test'})).status,401);
  assert.equal((await call(null,{ADMIN_SECRET:'test'})).status,400);
  assert.equal((await call({secret:'test'},{ADMIN_SECRET:'test'})).status,503);
});
test('budget reservation is persistent and refuses zero or exhausted budgets', async () => {
  const db=mockDB(); await reserve(db,'tavily',env,new Date('2026-09-09'));
  assert.deepEqual(db.calls[0].args,{p_provider:'tavily',p_period:'2026-09',p_limit:100});
  await assert.rejects(()=>reserve(mockDB({quota:false}),'gemini',env),QuotaWait);
  await assert.rejects(()=>reserve(db,'gemini',{GUIDE_GEMINI_DAILY_LIMIT:'invalid'}));
});
test('research reuses saved sources and returns a draft without publishing', async () => {
  const db=mockDB(); const urls=[];
  const result=await researchGuide(db,{...job,sources:[source]},env,async(url)=>{
    urls.push(url);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(base)}]}}]});
  });
  assert.equal(urls.length,1); assert.match(urls[0],/generativelanguage/);
  assert.equal(result.verification,'unverified'); assert.equal(db.calls[0].args.p_provider,'gemini');
});
test('exhausted budget makes no provider request', async () => {
  await assert.rejects(()=>researchGuide(mockDB({quota:false}),job,env,()=>{throw new Error('Must not fetch');}),QuotaWait);
});
test('rate limits keep job waiting and preserve retry allowance', async () => {
  const db=mockDB({jobs:[{...job,sources:[source]}]});
  await processOne(db,env,async()=>new Response('',{status:429}));
  const update=db.calls.find(c=>c.values?.status==='waiting'); assert.ok(update); assert.equal(update.values.attempts,0);
  assert.ok(!db.calls.some(c=>c.name==='guide_complete'));
});
test('AI completion uses draft-version guarded RPC, never publication', async () => {
  const db=mockDB({jobs:[{...job,sources:[source]}]});
  await processOne(db,env,async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(base)}]}}]}));
  assert.ok(db.calls.some(c=>c.name==='guide_complete')); assert.ok(!db.calls.some(c=>c.name==='guide_publish'));
});
test('edits supersede queued research before it spends quota', async () => {
  const db=mockDB({jobs:[job],version:2}); await processOne(db,env,()=>{throw new Error('Must not fetch');});
  assert.ok(db.calls.some(c=>c.values?.status==='superseded')); assert.ok(!db.calls.some(c=>c.name==='guide_reserve'));
});
test('permanent provider errors stop; third transient failure stops', async () => {
  for(const [status,attempts] of [[401,1],[500,3]]){
    const db=mockDB({jobs:[{...job,sources:[source],attempts}]});
    await processOne(db,env,async()=>new Response('',{status})); assert.ok(db.calls.some(c=>c.values?.status==='failed'));
  }
});
