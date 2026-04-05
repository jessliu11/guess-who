export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  emoji: string;
  sortOrder: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'athletes',    label: 'Athletes',             description: 'Sports stars from around the world',   emoji: '🏆', sortOrder: 1 },
  { id: 'actors',      label: 'Actors',               description: 'Hollywood & TV legends',               emoji: '🎬', sortOrder: 2 },
  { id: 'singers',     label: 'Singers',              description: 'Pop, hip-hop, and beyond',              emoji: '🎤', sortOrder: 3 },
  { id: 'politicians', label: 'Politicians',          description: 'World leaders & power players',        emoji: '🏛️', sortOrder: 4 },
  { id: 'fictional',   label: 'Fictional Characters', description: 'Iconic movie & TV characters',         emoji: '🎭', sortOrder: 5 },
  { id: 'cartoons',    label: 'Cartoon Characters',   description: 'Beloved animated icons',               emoji: '✏️', sortOrder: 6 },
  { id: 'celebrities', label: 'Celebrities',          description: 'Pop culture royalty',                  emoji: '⭐', sortOrder: 7 },
  { id: 'influencers', label: 'Influencers',          description: 'YouTube, TikTok & Instagram stars',   emoji: '📱', sortOrder: 8 },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
