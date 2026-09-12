// Helpers for building localized URLs.
// Default locale `en` has no path prefix. `zh` gets `/zh/...`.

export const LOCALES = ['en', 'zh'];

export function parseLang(params) {
  return params.lang === 'zh' ? 'zh' : 'en';
}

// Build an internal link, honoring the current locale.
// path examples: '/', '/games', '/games/2048', '/categories/puzzle'
export function langHref(lang, path = '/') {
  const clean = path.startsWith('/') ? path : '/' + path;
  if (lang === 'zh') {
    return clean === '/' ? '/zh/' : '/zh' + clean;
  }
  return clean;
}

// Given the current pathname, compute the same page in the other locale.
export function alternateHref(currentPathname) {
  if (currentPathname.startsWith('/zh')) {
    const rest = currentPathname.slice(3);
    return rest === '' || rest === '/' ? '/' : rest;
  }
  return '/zh' + (currentPathname === '/' ? '/' : currentPathname);
}
