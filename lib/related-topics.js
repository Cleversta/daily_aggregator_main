// lib/related-topics.js
//
// Curated mapping between the daily-category slugs (lib/categories.js) and
// the finer-grained topicCategory values used in lib/topics.js. Not every
// category has a clean 1:1 topicCategory match (e.g. "football" has no
// sports topicCategory yet) — in that case we fall back to same-hub topics
// instead of leaving the cross-link section empty.
const CATEGORY_TO_TOPIC_CATEGORIES = {
  crypto: ['finance-crypto'],
  ai: ['ai-software'],
};

// Reverse of the above, built automatically so the two directions can never
// drift out of sync with each other.
const TOPIC_CATEGORY_TO_CATEGORY = Object.entries(CATEGORY_TO_TOPIC_CATEGORIES).reduce(
  (acc, [categorySlug, topicCategories]) => {
    for (const tc of topicCategories) acc[tc] = categorySlug;
    return acc;
  },
  {}
);

// category: the full category object from getCategoryBySlug (has slug, hubSlug).
// allTopics: getAllTopics() output. Returns up to `limit` topic slugs, best
// match first (curated topicCategory match, then same-hub topics as filler).
function getRelatedTopicSlugs(category, allTopics, limit = 3) {
  const preferred = CATEGORY_TO_TOPIC_CATEGORIES[category.slug] || [];
  const preferredMatches = allTopics.filter((t) => preferred.includes(t.topicCategory));
  const preferredSlugs = new Set(preferredMatches.map((t) => t.slug));

  const fillerMatches =
    preferredMatches.length < limit
      ? allTopics.filter((t) => t.hubSlug === category.hubSlug && !preferredSlugs.has(t.slug))
      : [];

  return [...preferredMatches, ...fillerMatches].slice(0, limit).map((t) => t.slug);
}

// topic: an entry from lib/topics.js (has topicCategory). Returns the
// matching active category slug, or null if there's no curated match for
// this topicCategory.
function getRelatedCategorySlug(topic) {
  return TOPIC_CATEGORY_TO_CATEGORY[topic.topicCategory] || null;
}

module.exports = { CATEGORY_TO_TOPIC_CATEGORIES, getRelatedTopicSlugs, getRelatedCategorySlug };