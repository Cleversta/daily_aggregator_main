import { supabase } from './supabase-client';
import { getActiveCategories } from './categories';
import { getPublishedIntents } from './guide';

export async function getSearchItems() {
  const [{ data, error }, guides] = await Promise.all([
    supabase.from('articles').select('category, headline, summary, creator_ideas'),
    getPublishedIntents(),
  ]);
  if (error) console.error('Search index could not load news:', error.message);
  const categories = getActiveCategories();
  return [
    { title: 'Everyday calculator', description: 'Add subtract multiply divide percentages percentage change', type: 'Guides', href: '/tools/calculator' },
    ...(data || []).flatMap(article => {
      const category = categories.find(item => item.slug === article.category);
      if (!category) return [];
      return [
        { title: article.headline, description: `${category.title} ${article.summary || ''}`, type: 'News', href: `/category/${article.category}` },
        ...(article.creator_ideas || []).map((idea, index) => ({ title: idea.title, description: `${category.title} ${idea.platform} ${idea.hook}`, type: 'Creator ideas', href: `/creator-ideas#idea-${article.category}-${index}` })),
      ];
    }),
    ...guides.map(guide => ({ title: guide.name, description: guide.description || '', type: 'Guides', href: `/guide/${guide.slug}` })),
  ];
}
