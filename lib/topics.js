// lib/topics.js
//
// The 100-topic list for the "Topics" feature (Option B): evergreen
// reference pages for named subjects, separate from the daily category
// news briefings in lib/categories.js.
//
// Each topic is checked on a rotation, not every day — `rotationGroup`
// (1-5) tells scripts/fetch-topics.js which day-of-cycle a topic belongs
// to, so ~20 topics get checked per run and the full 100 cycle every 5
// days. This keeps you comfortably inside Tavily's free-tier credits.
//
// `hubSlug` reuses the hubs already defined in lib/categories.js so Topics
// can share the same nav/accent-color system as the daily categories.
// `topicCategory` is a finer-grained grouping used for the /topics index
// page and for labeling.
//
// The three `isRotatingSlot: true` entries are placeholders for "whoever is
// currently trending" in that lane (actor, musician, athlete). In v1 these
// are manually curated — swap the `topicName`/`slug` by hand when the
// current pick goes stale. Auto-detecting a trending person from Tavily
// results is a reasonable v2 addition but adds real complexity (dedup,
// content-safety review for real named individuals), so it's deliberately
// out of scope for the first version.

const RAW_TOPICS = [
  // AI & Software -> tech-hub
  { slug: 'claude-ai', topicName: 'Claude AI', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'chatgpt', topicName: 'ChatGPT', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'gemini-ai', topicName: 'Gemini AI', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'microsoft-copilot', topicName: 'Microsoft Copilot', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-image-generation', topicName: 'AI image generation', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'open-source-ai-models', topicName: 'Open-source AI models', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-coding-assistants', topicName: 'AI coding assistants', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-agents-automation', topicName: 'AI agents & automation', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-video-generation', topicName: 'AI video generation', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-chips-hardware', topicName: 'AI chips & hardware', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'ai-regulation-policy', topicName: 'AI regulation & policy', hubSlug: 'tech-hub', topicCategory: 'ai-software' },
  { slug: 'humanoid-robots', topicName: 'Robotics & humanoid robots', hubSlug: 'tech-hub', topicCategory: 'ai-software' },

  // Consumer Tech / Devices -> tech-hub
  { slug: 'iphone', topicName: 'iPhone', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'samsung-galaxy', topicName: 'Samsung Galaxy', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'android-os', topicName: 'Android OS', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'macbook-apple-silicon', topicName: 'MacBook & Apple Silicon', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'smartwatches', topicName: 'Smartwatches', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'vr-ar-headsets', topicName: 'VR/AR headsets', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'foldable-phones', topicName: 'Foldable phones', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'laptops-pc-hardware', topicName: 'Laptops & PC hardware', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'gaming-consoles', topicName: 'Gaming consoles', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },
  { slug: 'smart-home-devices', topicName: 'Smart home devices', hubSlug: 'tech-hub', topicCategory: 'consumer-tech' },

  // Big Tech Companies -> tech-hub
  { slug: 'apple', topicName: 'Apple', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'google', topicName: 'Google', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'microsoft', topicName: 'Microsoft', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'meta', topicName: 'Meta', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'amazon', topicName: 'Amazon', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'nvidia', topicName: 'Nvidia', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'openai', topicName: 'OpenAI', hubSlug: 'tech-hub', topicCategory: 'big-tech' },
  { slug: 'xai', topicName: 'xAI', hubSlug: 'tech-hub', topicCategory: 'big-tech' },

  // Social Media -> tech-hub
  { slug: 'tiktok', topicName: 'TikTok', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'instagram', topicName: 'Instagram', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'x-twitter', topicName: 'X (Twitter)', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'youtube-platform', topicName: 'YouTube', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'facebook', topicName: 'Facebook', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'reddit', topicName: 'Reddit', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'linkedin', topicName: 'LinkedIn', hubSlug: 'tech-hub', topicCategory: 'social-media' },
  { slug: 'snapchat', topicName: 'Snapchat', hubSlug: 'tech-hub', topicCategory: 'social-media' },

  // Tools / Productivity -> tech-hub
  { slug: 'notion', topicName: 'Notion', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'slack', topicName: 'Slack', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'zoom', topicName: 'Zoom', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'canva', topicName: 'Canva', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'figma', topicName: 'Figma', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'google-workspace', topicName: 'Google Workspace', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'microsoft-365', topicName: 'Microsoft 365', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },
  { slug: 'asana', topicName: 'Asana', hubSlug: 'tech-hub', topicCategory: 'tools-productivity' },

  // Finance & Crypto -> finance-hub
  { slug: 'bitcoin', topicName: 'Bitcoin', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'ethereum', topicName: 'Ethereum', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'stock-market', topicName: 'Stock market', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'gold-price', topicName: 'Gold price', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'interest-rates', topicName: 'Interest rates', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'major-altcoins', topicName: 'Major altcoins', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'stablecoins', topicName: 'Stablecoins', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'oil-prices', topicName: 'Oil prices', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },
  { slug: 'inflation-cost-of-living', topicName: 'Inflation & cost of living', hubSlug: 'finance-hub', topicCategory: 'finance-crypto' },

  // Automotive -> lifestyle-hub / Energy -> world-hub
  { slug: 'tesla', topicName: 'Tesla', hubSlug: 'lifestyle-hub', topicCategory: 'automotive' },
  { slug: 'electric-vehicles', topicName: 'Electric vehicles', hubSlug: 'lifestyle-hub', topicCategory: 'automotive' },
  { slug: 'renewable-energy', topicName: 'Renewable energy', hubSlug: 'world-hub', topicCategory: 'energy' },
  { slug: 'self-driving-cars', topicName: 'Self-driving cars', hubSlug: 'lifestyle-hub', topicCategory: 'automotive' },
  { slug: 'battery-technology', topicName: 'Battery technology', hubSlug: 'lifestyle-hub', topicCategory: 'automotive' },
  { slug: 'oil-gas-industry', topicName: 'Oil & gas industry', hubSlug: 'world-hub', topicCategory: 'energy' },
  { slug: 'hydrogen-energy', topicName: 'Hydrogen energy', hubSlug: 'world-hub', topicCategory: 'energy' },

  // Science & Space -> world-hub
  { slug: 'spacex', topicName: 'SpaceX', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'nasa', topicName: 'NASA', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'climate-change', topicName: 'Climate change', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'health-medical-breakthroughs', topicName: 'Health & medical breakthroughs', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'ai-in-science', topicName: 'AI in science & research', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'quantum-computing', topicName: 'Quantum computing', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'space-tourism', topicName: 'Space tourism', hubSlug: 'world-hub', topicCategory: 'science-space' },
  { slug: 'genetic-engineering-crispr', topicName: 'Genetic engineering & CRISPR', hubSlug: 'world-hub', topicCategory: 'science-space' },

  // Entertainment -> entertainment-hub
  { slug: 'netflix', topicName: 'Netflix', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'gaming-industry', topicName: 'Gaming industry', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'streaming-wars', topicName: 'Streaming wars', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'music-industry-trends', topicName: 'Music industry trends', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'box-office-movie-releases', topicName: 'Box office & movie releases', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'esports', topicName: 'Esports', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'celebrity-news', topicName: 'Celebrity news', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'anime-manga', topicName: 'Anime & manga', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'award-shows', topicName: 'Award shows (Oscars/Grammys)', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },
  { slug: 'k-pop', topicName: 'K-pop', hubSlug: 'entertainment-hub', topicCategory: 'entertainment' },

  // World / Global Affairs -> world-hub
  { slug: 'global-economy', topicName: 'Global economy', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'major-elections-politics', topicName: 'Major elections & politics', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'war-conflict-updates', topicName: 'War & conflict updates', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'immigration-policy', topicName: 'Immigration policy', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'trade-tariffs', topicName: 'Trade & tariffs', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'natural-disasters', topicName: 'Natural disasters', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'global-health', topicName: 'Global health', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'cybersecurity-data-breaches', topicName: 'Cybersecurity & data breaches', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'human-rights', topicName: 'Human rights', hubSlug: 'world-hub', topicCategory: 'world-affairs' },
  { slug: 'diplomacy-international-relations', topicName: 'Diplomacy & international relations', hubSlug: 'world-hub', topicCategory: 'world-affairs' },

  // Celebrities / Public Figures -> entertainment-hub
  { slug: 'taylor-swift', topicName: 'Taylor Swift', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'elon-musk', topicName: 'Elon Musk', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'mrbeast', topicName: 'MrBeast', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'beyonce', topicName: 'Beyoncé', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'cristiano-ronaldo', topicName: 'Cristiano Ronaldo', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'lebron-james', topicName: 'LeBron James', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'kim-kardashian', topicName: 'Kim Kardashian', hubSlug: 'entertainment-hub', topicCategory: 'celebrities' },
  { slug: 'trending-actor', topicName: 'Trending Actor/Actress', hubSlug: 'entertainment-hub', topicCategory: 'celebrities', isRotatingSlot: true },
  { slug: 'trending-musician', topicName: 'Trending Musician', hubSlug: 'entertainment-hub', topicCategory: 'celebrities', isRotatingSlot: true },
  { slug: 'trending-athlete', topicName: 'Trending Athlete', hubSlug: 'entertainment-hub', topicCategory: 'celebrities', isRotatingSlot: true },
];

const ROTATION_GROUPS = 5; // full cycle = 5 days; adjust if you want faster/slower refresh

const TOPICS = RAW_TOPICS.map((t, i) => ({
  ...t,
  rotationGroup: (i % ROTATION_GROUPS) + 1,
}));

function getAllTopics() {
  return TOPICS;
}

function getTopicsForRotationGroup(group) {
  return TOPICS.filter((t) => t.rotationGroup === group);
}

// Day-of-cycle derived from the date so the schedule is deterministic and
// needs no external state — call this once per daily run.
function getTodaysRotationGroup(date = new Date()) {
  const dayNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return (dayNumber % ROTATION_GROUPS) + 1;
}

function getTopicBySlug(slug) {
  return TOPICS.find((t) => t.slug === slug) || null;
}

function getTopicsByCategory(topicCategory) {
  return TOPICS.filter((t) => t.topicCategory === topicCategory);
}

module.exports = {
  TOPICS,
  ROTATION_GROUPS,
  getAllTopics,
  getTopicsForRotationGroup,
  getTodaysRotationGroup,
  getTopicBySlug,
  getTopicsByCategory,
};