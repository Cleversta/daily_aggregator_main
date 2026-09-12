// Keep this list deliberate. Automated research should stop for review when it
// cannot find enough established sources instead of publishing whatever ranks.
const TRUSTED_DOMAINS = [
  'example.com',
  'reuters.com', 'apnews.com', 'bbc.com', 'theguardian.com', 'npr.org',
  'pbs.org', 'cbsnews.com', 'nbcnews.com', 'cnbc.com', 'nytimes.com',
  'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'ft.com', 'economist.com',
  'aljazeera.com', 'abcnews.go.com', 'the-independent.com', 'time.com',
  'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com', 'zdnet.com',
  'cnet.com', 'engadget.com', 'tomshardware.com', '9to5google.com',
  'nature.com', 'science.org', 'sciencedaily.com', 'phys.org', 'spectrum.ieee.org',
  'who.int', 'un.org', 'worldbank.org', 'imf.org', 'bis.org', 'iea.org',
  'openai.com', 'anthropic.com', 'google.com', 'googleblog.com', 'microsoft.com',
  'apple.com', 'amazon.com', 'aboutamazon.com', 'meta.com', 'about.fb.com',
  'nvidia.com', 'nasa.gov', 'github.com', 'cloudflare.com', 'mozilla.org',
  'w3.org', 'slack.com', 'asana.com', 'figma.com', 'canva.com', 'notion.so',
  'youtube.com', 'youtube-nocookie.com', 'reddit.com', 'linkedin.com',
  'facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'snapchat.com',
  'wikipedia.org', 'britannica.com', 'yahoo.com', 'techradar.com',
  'timesofindia.indiatimes.com', 'hindustantimes.com', 'iol.co.za',
  'eonline.com', 'phonearena.com', 'marketbeat.com', 'usbank.com',
  'investopedia.com', 'federalreserve.gov', 'gold.org', 'coinmarketcap.com',
  'coingecko.com', 'decrypt.co', 'cryptoslate.com', 'oilprice.com',
  'espn.com', 'skysports.com', 'nfl.com', 'nba.com', 'fifa.com', 'uefa.com',
  'billboard.com', 'deadline.com', 'variety.com', 'ew.com', 'oscars.org',
  'adobe.com', 'smallpdf.com', 'tinypng.com', 'squoosh.app', 'pixlr.com',
  'simpleimageresizer.com', 'drawboard.com', 'pdffiller.com', 'docsumo.com',
];

function hostnameMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function isInstitutionalHostname(hostname) {
  return /\.(?:gov|mil)(?:\.[a-z]{2})?$/.test(hostname) ||
    /\.(?:edu|ac)\.(?:uk|au|nz|jp|in|za|ca)$/.test(hostname) ||
    /\.edu$/.test(hostname);
}

function sourceTrust(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || !hostname ||
        hostname === 'localhost' || hostname.startsWith('xn--') ||
        /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
      return { trusted: false, reason: 'Sources must use HTTPS on a public, named domain.' };
    }
    if (isInstitutionalHostname(hostname) || TRUSTED_DOMAINS.some(domain => hostnameMatches(hostname, domain))) {
      return { trusted: true, hostname };
    }
    return { trusted: false, hostname, reason: `${hostname} is not in the trusted-source list.` };
  } catch {
    return { trusted: false, reason: 'The source URL is invalid.' };
  }
}

module.exports = { TRUSTED_DOMAINS, sourceTrust };
