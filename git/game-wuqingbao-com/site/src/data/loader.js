// Aggregates every game JSON under src/games/ and exposes query helpers.
// Adding a game = dropping a new JSON file; nothing else needs to change.

import { categories, tagGroups, categoryName, categoryById } from './taxonomy.js';

const modules = import.meta.glob('../games/*.json', { eager: true });

export const games = Object.values(modules)
  .map((m) => m.default)
  .filter(Boolean)
  .sort((a, b) => (a.added || '').localeCompare(b.added || '') || a.slug.localeCompare(b.slug));

export { categories, tagGroups, categoryName, categoryById };

export function findGame(slug) {
  return games.find((g) => g.slug === slug);
}

export function gamesByCategory(id) {
  return games.filter((g) => (g.categories || []).includes(id));
}

export function gamesByTag(tag) {
  return games.filter((g) => (g.tags || []).includes(tag));
}

export function featuredGames() {
  return games.filter((g) => g.featured);
}

export function recentGames(n = 8) {
  return [...games].sort((a, b) => (b.added || '').localeCompare(a.added || '')).slice(0, n);
}

export function categoryCounts() {
  const map = {};
  for (const c of categories) map[c.id] = gamesByCategory(c.id).length;
  return map;
}

export function allTags() {
  const set = new Set();
  for (const g of games) for (const t of g.tags || []) set.add(t);
  return [...set].sort();
}

export function tagFacet(tag) {
  for (const [facet, list] of Object.entries(tagGroups)) {
    if (list.includes(tag)) return facet;
  }
  return 'other';
}

// Jaccard-ish similarity: shared categories weighted higher than shared tags.
export function relatedGames(slug, n = 3) {
  const target = findGame(slug);
  if (!target) return [];
  const tCats = new Set(target.categories || []);
  const tTags = new Set(target.tags || []);
  return games
    .filter((g) => g.slug !== slug)
    .map((g) => {
      let score = 0;
      for (const c of g.categories || []) if (tCats.has(c)) score += 3;
      for (const tg of g.tags || []) if (tTags.has(tg)) score += 1;
      return { game: g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.game);
}
