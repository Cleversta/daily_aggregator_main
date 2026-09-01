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
    accent: { from: '#B08D3E', to: '#14213B', pillBg: '#B08D3E18', pillText: '#8A6B1F' },
    categories: [
      { slug: 'global-markets', title: 'Global Markets' },
      { slug: 'crypto', title: 'Crypto & Bitcoin', active: true },
      { slug: 'personal-finance', title: 'Personal Finance' },
      { slug: 'real-estate', title: 'Real Estate' },
      { slug: 'business', title: 'Business & Corporate' },
      { slug: 'startups', title: 'Tech Startups' },
    ],
  },
  {
    slug: 'tech-hub',
    title: 'Technology & Innovation',
    accent: { from: '#4B6EFF', to: '#14213B', pillBg: '#4B6EFF18', pillText: '#2A4BCC' },
    categories: [
      { slug: 'technology', title: 'Consumer Tech' },
      { slug: 'ai', title: 'Artificial Intelligence', active: true },
      { slug: 'programming', title: 'Software Development' },
      { slug: 'cybersecurity', title: 'Cyber Security' },
      { slug: 'vr', title: 'Virtual Reality & Spatial' },
      { slug: 'smarthome', title: 'Smart Homes' },
    ],
  },
  {
    slug: 'entertainment-hub',
    title: 'Sports & Entertainment',
    accent: { from: '#FF4B3E', to: '#FFB020', pillBg: '#FF4B3E18', pillText: '#C4321F' },
    categories: [
      { slug: 'football', title: 'Football (Soccer)', active: true },
      { slug: 'combat-sports', title: 'UFC & Boxing' },
      { slug: 'gaming', title: 'Gaming & Esports' },
      { slug: 'movies', title: 'Movies & Streaming' },
      { slug: 'entertainment', title: 'Celebrity & Buzz' },
      { slug: 'sneakers', title: 'Sneaker Culture' },
    ],
  },
  {
    slug: 'lifestyle-hub',
    title: 'Lifestyle & Health',
    accent: { from: '#2FA88A', to: '#14213B', pillBg: '#2FA88A18', pillText: '#1F7A63' },
    categories: [
      { slug: 'health', title: 'Daily Wellness' },
      { slug: 'mental-health', title: 'Mind & Productivity' },
      { slug: 'fashion', title: 'Fashion & Style' },
      { slug: 'travel', title: 'Travel Deals & Gems' },
      { slug: 'automotive', title: 'Automotive & EVs' },
    ],
  },
  {
    slug: 'culture-hub',
    title: 'Home, Culture & Creative',
    accent: { from: '#7B5EFF', to: '#14213B', pillBg: '#7B5EFF18', pillText: '#5638CC' },
    categories: [
      { slug: 'homedecor', title: 'Home Decor & DIY' },
      { slug: 'cooking', title: 'Culinary & Recipes' },
      { slug: 'parenting', title: 'Modern Parenting' },
      { slug: 'architecture', title: 'Architecture & Design' },
      { slug: 'literature', title: 'Books & Literature' },
      { slug: 'art', title: 'Art & Creative Content' },
    ],
  },
  {
    slug: 'world-hub',
    title: 'Global Shifts, Science & Learning',
    accent: { from: '#3E9B4F', to: '#14213B', pillBg: '#3E9B4F18', pillText: '#296B33' },
    categories: [
      { slug: 'science', title: 'Science Discoveries' },
      { slug: 'space', title: 'Space Exploration' },
      { slug: 'greenenergy', title: 'Renewable Energy' },
      { slug: 'education', title: 'Lifelong Learning' },
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
