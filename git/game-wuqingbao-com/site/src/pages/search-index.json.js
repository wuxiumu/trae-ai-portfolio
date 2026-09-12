// Build-time search index: one doc per game with both languages, so client
// code can pick the fields for its page language. Kept lean (35 docs).
import { games } from '../data/loader.js';
import { categoryName } from '../data/taxonomy.js';

const docs = games.map((g) => ({
  slug: g.slug,
  titleEn: g.title.en || '',
  titleZh: g.title.zh || '',
  summaryEn: g.summary.en || '',
  summaryZh: g.summary.zh || '',
  tags: (g.tags || []).join(' '),
  catsEn: (g.categories || []).map((c) => categoryName('en', c) || c).join(' '),
  catsZh: (g.categories || []).map((c) => categoryName('zh', c) || c).join(' '),
  playable: Boolean(g.fetched && g.entry),
}));

export const GET = () =>
  new Response(JSON.stringify(docs), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
