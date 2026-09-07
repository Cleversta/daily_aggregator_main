const KEY = process.env.INDEXNOW_KEY;
const HOST = 'dailyaggregator.online';

async function submitIndexNow(urls) {
  if (!KEY) {
    console.error('INDEXNOW_KEY not set, skipping IndexNow submission.');
    return;
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`IndexNow submission: ${res.status} ${res.statusText}`);
}

// Ping the pages that actually change daily — no point re-submitting
// static pages like /about every day.
const urls = [
  `https://${HOST}/`,
  `https://${HOST}/category/ai`,
  `https://${HOST}/category/crypto`,
  `https://${HOST}/category/football`,
  `https://${HOST}/hub/finance-hub`,
  `https://${HOST}/hub/tech-hub`,

  `https://${HOST}/hub/entertainment-hub`,
];

submitIndexNow(urls);