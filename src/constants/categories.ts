import categoriesJson from '../../data/categories.json';

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  emoji: string;
  sortOrder: number;
}

export const CATEGORIES: CategoryMeta[] = (categoriesJson as CategoryMeta[])
  .map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    emoji: c.emoji,
    sortOrder: c.sortOrder,
  }))
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
