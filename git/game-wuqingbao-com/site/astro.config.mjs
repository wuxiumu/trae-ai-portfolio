// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';
import fs from 'node:fs';

// Astro's built-in dotenv loader resolves env files from process.cwd(), NOT
// from this config file's directory. If someone runs `npm run build` from the
// repo root (which `cd site` into the subdir — fine) or invokes the Astro CLI
// with an arbitrary cwd, we still want env files located alongside this
// config to win. So we load them ourselves from __dirname and only set
// process.env.* when the key isn't already present (CI env takes precedence).
const ENV_DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
for (const candidate of ['.env.production', '.env']) {
  const p = path.join(ENV_DIR, candidate);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, k, raw] = m;
    if (k in process.env) continue;
    const v = raw.startsWith('"') ? raw.slice(1, -1).replace(/\\n/g, '\n') : raw.trim();
    process.env[k] = v;
  }
}

// Single source of truth for the public URL.
// Build/deploy:   PUBLIC_SITE=https://game.wuqingbao.com  npm run build
// Local dev:      defaults to localhost so <a href> / sitemap / canonical stay sensible
const site = process.env.PUBLIC_SITE || (process.env.HOST ? `http://${process.env.HOST}:${process.env.PORT || 4321}` : 'http://localhost:4321');

export default defineConfig({
  site,
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
  server: { host: true, port: 4321 },
});
