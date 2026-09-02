// lib/categories.js
//
// The full 6-hub, 33-category structure from the approved nav map.
// `active: true` categories are the ones actually being fetched right now
// (see CATEGORIES in scripts/fetch-news.js). Everything else renders as
// "coming soon" in the UI so the nav is ready to go the moment you expand
// the fetch script — no UI changes needed later.
//
// `accent` drives each hub's category-pill color in the UI.

const HUBS = [
  {
    slug: 'finance-hub',
    title: 'Finance & Economy',
    icon: '↗',
    accent: { from: '#B08D3E', to: '#14213B', pillBg: '#B08D3E18', pillText: '#8A6B1F' },
    categories: [
      { slug: 'global-markets', title: 'Global Markets', icon: '📈' },
      { slug: 'crypto', title: 'Crypto & Bitcoin', icon: '₿', active: true },
      { slug: 'personal-finance', title: 'Personal Finance', icon: '💳' },
      { slug: 'real-estate', title: 'Real Estate', icon: '🏠' },
      { slug: 'business', title: 'Business & Corporate', icon: '💼' },
      { slug: 'startups', title: 'Tech Startups', icon: '🚀' },
    ],
  },
  {
    slug: 'tech-hub',
    title: 'Technology & Innovation',
    icon: '✦',
    accent: { from: '#4B6EFF', to: '#14213B', pillBg: '#4B6EFF18', pillText: '#2A4BCC' },
    categories: [
      { slug: 'technology', title: 'Consumer Tech', icon: '📱' },
      { slug: 'ai', title: 'Artificial Intelligence', icon: '✦', active: true },
      { slug: 'programming', title: 'Software Development', icon: '⌘' },
      { slug: 'cybersecurity', title: 'Cyber Security', icon: '🔒' },
      { slug: 'vr', title: 'Virtual Reality & Spatial', icon: '◉' },
      { slug: 'smarthome', title: 'Smart Homes', icon: '⌂' },
    ],
  },
  {
    slug: 'entertainment-hub',
    title: 'Sports & Entertainment',
    icon: '◉',
    accent: { from: '#FF4B3E', to: '#FFB020', pillBg: '#FF4B3E18', pillText: '#C4321F' },
    categories: [
      { slug: 'football', title: 'Football (Soccer)', icon: '⚽', active: true },
      { slug: 'combat-sports', title: 'UFC & Boxing', icon: '🥊' },
      { slug: 'gaming', title: 'Gaming & Esports', icon: '🎮' },
      { slug: 'movies', title: 'Movies & Streaming', icon: '🎬' },
      { slug: 'entertainment', title: 'Celebrity & Buzz', icon: '✦' },
      { slug: 'sneakers', title: 'Sneaker Culture', icon: '👟' },
    ],
  },
  {
    slug: 'lifestyle-hub',
    title: 'Lifestyle & Health',
    icon: '♡',
    accent: { from: '#2FA88A', to: '#14213B', pillBg: '#2FA88A18', pillText: '#1F7A63' },
    categories: [
      { slug: 'health', title: 'Daily Wellness', icon: '♡' },
      { slug: 'mental-health', title: 'Mind & Productivity', icon: '☀' },
      { slug: 'fashion', title: 'Fashion & Style', icon: '◇' },
      { slug: 'travel', title: 'Travel Deals & Gems', icon: '✈' },
      { slug: 'automotive', title: 'Automotive & EVs', icon: '⚡' },
    ],
  },
  {
    slug: 'culture-hub',
    title: 'Home, Culture & Creative',
    icon: '⌂',
    accent: { from: '#7B5EFF', to: '#14213B', pillBg: '#7B5EFF18', pillText: '#5638CC' },
    categories: [
      { slug: 'homedecor', title: 'Home Decor & DIY', icon: '⌂' },
      { slug: 'cooking', title: 'Culinary & Recipes', icon: '♨' },
      { slug: 'parenting', title: 'Modern Parenting', icon: '♡' },
      { slug: 'architecture', title: 'Architecture & Design', icon: '◫' },
      { slug: 'literature', title: 'Books & Literature', icon: '▤' },
      { slug: 'art', title: 'Art & Creative Content', icon: '✎' },
    ],
  },
  {
    slug: 'world-hub',
    title: 'Global Shifts, Science & Learning',
    icon: '◎',
    accent: { from: '#3E9B4F', to: '#14213B', pillBg: '#3E9B4F18', pillText: '#296B33' },
    categories: [
      { slug: 'science', title: 'Science Discoveries', icon: '⚗' },
      { slug: 'space', title: 'Space Exploration', icon: '◌' },
      { slug: 'greenenergy', title: 'Renewable Energy', icon: '♧' },
      { slug: 'education', title: 'Lifelong Learning', icon: '▤' },
    ],
  },
];

function getAllCategories() {
  return HUBS.flatMap((hub) =>
    hub.categories.map((c) => ({
      ...c,
      hubSlug: hub.slug,
      hubTitle: hub.title,
      accent: hub.accent,
    }))
  );
}

function getActiveCategories() {
  return getAllCategories().filter((c) => c.active);
}

function getCategoryBySlug(slug) {
  return getAllCategories().find((c) => c.slug === slug) || null;
}

module.exports = { HUBS, getAllCategories, getActiveCategories, getCategoryBySlug };
