// Generated sitemap with hreflang alternates for the bilingual routes.
import { games } from '../data/loader.js';
import { categories } from '../data/taxonomy.js';

const SITE = import.meta.env.SITE || 'https://game.wuqingbao.com';
const base = SITE.replace(/\/$/, '');

// Static info pages (trust / legal / contact) — always include them so search
// and ad-network review crawlers find the full site shape.
const INFO_PAGES = ['/about', '/contact', '/privacy'];

const pathSets = {
  en: ['/', '/games', ...INFO_PAGES, ...categories.map((c) => `/categories/${c.id}`), ...games.map((g) => `/games/${g.slug}`)],
  zh: ['/zh/', '/zh/games', ...INFO_PAGES.map((p) => `/zh${p}`), ...categories.map((c) => `/zh/categories/${c.id}`), ...games.map((g) => `/zh/games/${g.slug}`)],
};

const pairOf = (enPath) => ({ en: base + enPath, zh: base + (enPath === '/' ? '/zh/' : '/zh' + enPath) });

// lastmod only where we have a real date (game pages use their listing date).
const lastmodOf = (enPath) => {
  const m = enPath.match(/^\/games\/([^/]+)$/);
  const g = m && games.find((x) => x.slug === m[1]);
  return g && g.added ? `\n    <lastmod>${g.added}</lastmod>` : '';
};

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const entries = pathSets.en.map((enPath) => {
  const { en, zh } = pairOf(enPath);
  return `  <url>
    <loc>${xmlEscape(en)}</loc>${lastmodOf(enPath)}
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}" />
    <xhtml:link rel="alternate" hreflang="zh" href="${xmlEscape(zh)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(en)}" />
  </url>`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

export const GET = () =>
  new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
