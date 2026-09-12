#!/usr/bin/env node
// fetch-games.mjs — Turn a seed list into a running game on the site.
//
// Reads:  <repo>/site/seeds.json
// Writes: <repo>/vendors/<slug>/            (raw upstream tarball, gitignored)
//         <repo>/site/public/games/<slug>/  (game copy served to iframe)
//         <repo>/site/src/games/<slug>.json (per-game metadata consumed by loader)
//         <repo>/logs/fetch-<ts>.jsonl      (audit log, one line per seed)
//
// Usage:
//   node scripts/fetch-games.mjs                     # all priority>=1 unfetched seeds
//   node scripts/fetch-games.mjs --limit=10          # cap this run at 10 seeds
//   node scripts/fetch-games.mjs --only=hextris,2048 # specific slugs
//   node scripts/fetch-games.mjs --priority=1        # only priority=1
//   node scripts/fetch-games.mjs --dry-run           # plan only, don't write
//   node scripts/fetch-games.mjs --update            # re-fetch slugs already present
//   node scripts/fetch-games.mjs --allow-build       # run `npm i && npm run build` when no dist/
//   node scripts/fetch-games.mjs --strict-license    # reject when LICENSE file missing (default on)
//   GITHUB_TOKEN=ghp_xxx node scripts/fetch-games.mjs  # raise API rate 60→5000/hr

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const VENDORS = path.join(ROOT, 'vendors');
const GAMES_JSON = path.join(SITE, 'src', 'games');
const GAMES_PUBLIC = path.join(SITE, 'public', 'vendor');  // raw game assets (avoids collision with /games/ routes)
const SEEDS_FILE = path.join(SITE, 'seeds.json');
const LOG_DIR = path.join(ROOT, 'logs');

// SPDX ids we accept. Anything outside this set is rejected with a warning.
const LICENSE_ALLOW = new Set([
  'MIT', 'MIT-0', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
  'ISC', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0',
  'WTFPL', 'Unlicense', 'Zlib', 'MPL-2.0',
  // GPL is fine for pure iframe hosting (we don't distribute modified source).
  'GPL-3.0', 'GPL-2.0', 'LGPL-3.0', 'AGPL-3.0',
]);

const BRANCH_CANDIDATES = ['main', 'master', 'gh-pages', 'game', 'dist', 'pages'];

// Paths tried (in order) when the seed doesn't hint at an entry HTML.
const ENTRY_CANDIDATES = [
  'index.html',
  'dist/index.html',
  'build/index.html',
  'www/index.html',
  'game/index.html',
  'docs/index.html',
  'public/index.html',
  'html/index.html',
];

function parseArgs(argv) {
  const args = { update: false, dryRun: false, allowBuild: false, strictLicense: true };
  for (const raw of argv) {
    if (raw === '--update') args.update = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw === '--allow-build') args.allowBuild = true;
    else if (raw === '--no-strict-license') args.strictLicense = false;
    else if (raw.startsWith('--limit=')) args.limit = Number(raw.slice(8));
    else if (raw.startsWith('--only=')) args.only = raw.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (raw.startsWith('--priority=')) args.priority = Number(raw.slice(11));
    else if (raw.startsWith('--seeds=')) args.seeds = path.resolve(ROOT, raw.slice(8));
  }
  return args;
}

function log(logger, entry) {
  logger.push(entry);
  const tag = { ok: '✓', skip: '·', fail: '✗', warn: '!' }[entry.status] || '?';
  const extra = entry.reason ? ` — ${entry.reason}` : '';
  console.log(`${tag} ${entry.slug.padEnd(28)} ${entry.status}${extra}`);
}

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function tryDownload(repo, branch, dest) {
  const url = `https://codeload.github.com/${repo}/tar.gz/refs/heads/${branch}`;
  try {
    sh(`curl -sSfL --http1.1 --max-time 180 -o "${dest}" ${JSON.stringify(url)}`);
    const size = fs.statSync(dest).size;
    // A 404 body from codeload is a few bytes ("404: Not Found").
    return size > 1024;
  } catch {
    return false;
  }
}

function extract(tarball, into) {
  fs.mkdirSync(into, { recursive: true });
  sh(`tar -xzf ${JSON.stringify(tarball)} -C ${JSON.stringify(into)} --strip-components=1`);
}

// Read the LICENSE (any common spelling) and try to name the SPDX id.
function detectLicense(rootDir) {
  const names = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'COPYING', 'unlicense'];
  let text = '';
  for (const n of names) {
    const p = path.join(rootDir, n);
    if (fs.existsSync(p)) { text = fs.readFileSync(p, 'utf8').slice(0, 4000); break; }
  }
  if (!text) {
    // Fall back to scanning README for a license sentence.
    const rd = ['README.md', 'README', 'readme.md'].map((f) => path.join(rootDir, f)).find(fs.existsSync);
    if (rd) {
      const body = fs.readFileSync(rd, 'utf8');
      const m = body.match(/ licensed under (the )?(MIT|Apache[\s-]*2\.0|BSD|ISC|GPL[\s-]*\d|CC0|WTFPL|Unlicense|Zlib)/i);
      if (m) return { spdx: normalizeLicense(m[2]), source: 'README-fallback' };
    }
    return { spdx: null, source: 'missing' };
  }
  const t = text.toLowerCase();
  if (t.includes('mit license') || /^\s*permission is hereby granted, free of charge/m.test(t)) return { spdx: 'MIT', source: 'LICENSE' };
  if (t.includes('apache license') && t.includes('version 2')) return { spdx: 'Apache-2.0', source: 'LICENSE' };
  if (t.includes('gnu general public license') && t.includes('version 3')) return { spdx: 'GPL-3.0', source: 'LICENSE' };
  if (t.includes('gnu general public license') && t.includes('version 2')) return { spdx: 'GPL-2.0', source: 'LICENSE' };
  if (t.includes('gnu affero general public license')) return { spdx: 'AGPL-3.0', source: 'LICENSE' };
  if (t.includes('bsd 2-clause') || t.includes('simplified bsd')) return { spdx: 'BSD-2-Clause', source: 'LICENSE' };
  if (t.includes('bsd 3-clause') || t.includes('new bsd') || t.includes('modified bsd')) return { spdx: 'BSD-3-Clause', source: 'LICENSE' };
  if (t.includes('isc license')) return { spdx: 'ISC', source: 'LICENSE' };
  if (t.includes('cc0 1.0') || t.includes('creative commons zero')) return { spdx: 'CC0-1.0', source: 'LICENSE' };
  if (t.includes('attribution 4.0 international')) return { spdx: 'CC-BY-4.0', source: 'LICENSE' };
  if (t.includes('attribution 3.0 unported') || t.includes('attribution 3.0 united')) return { spdx: 'CC-BY-3.0', source: 'LICENSE' };
  if (t.includes('do what the f*ck you want to public license')) return { spdx: 'WTFPL', source: 'LICENSE' };
  if (t.includes("this is free and unencumbered software")) return { spdx: 'Unlicense', source: 'LICENSE' };
  if (t.includes('zlib') && t.includes('software')) return { spdx: 'Zlib', source: 'LICENSE' };
  return { spdx: 'UNKNOWN', source: 'LICENSE' };
}

function normalizeLicense(s) {
  const v = s.toLowerCase();
  if (v === 'mit') return 'MIT';
  if (v.startsWith('apache')) return 'Apache-2.0';
  if (v.startsWith('bsd')) return 'BSD-3-Clause';
  if (v === 'isc') return 'ISC';
  if (v.startsWith('gpl')) return v.includes('3') ? 'GPL-3.0' : 'GPL-2.0';
  if (v === 'cc0') return 'CC0-1.0';
  if (v === 'wtfpl') return 'WTFPL';
  if (v === 'unlicense') return 'Unlicense';
  if (v === 'zlib') return 'Zlib';
  return s;
}

function findEntry(rootDir, hintPath) {
  if (hintPath) {
    const p = path.join(rootDir, hintPath);
    if (fs.existsSync(p)) return path.relative(rootDir, p);
  }
  for (const cand of ENTRY_CANDIDATES) {
    if (fs.existsSync(path.join(rootDir, cand))) return cand;
  }
  // One-level fallback: search any immediate subdirectory that has an index.html.
  for (const d of fs.readdirSync(rootDir)) {
    const p = path.join(rootDir, d);
    if (!fs.statSync(p).isDirectory()) continue;
    if (d.startsWith('.') || d === 'node_modules') continue;
    if (fs.existsSync(path.join(p, 'index.html'))) return path.join(d, 'index.html');
  }
  return null;
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name.startsWith('.git')) continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function ghApi(repo) {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'h5games-fetch',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return { stars: j.stargazers_count, license: j.license?.spdx_id, pushed_at: j.pushed_at };
  } catch {
    return null;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function processSeed(seed, args, ghApiCache) {
  const out = { slug: seed.slug, status: 'skip' };
  const gamesJsonPath = path.join(GAMES_JSON, `${seed.slug}.json`);
  if (!args.update && fs.existsSync(gamesJsonPath)) {
    out.status = 'skip'; out.reason = 'already fetched (use --update to refresh)';
    return out;
  }

  // 1. Download: try each candidate branch.
  const tarball = path.join(VENDORS, `${seed.slug}.tar.gz`);
  fs.mkdirSync(VENDORS, { recursive: true });
  let branch = seed.branch || null;
  let downloaded = false;
  const tryBranches = branch ? [branch, ...BRANCH_CANDIDATES.filter((b) => b !== branch)] : BRANCH_CANDIDATES;
  for (const b of tryBranches) {
    if (tryDownload(seed.repo, b, tarball)) { downloaded = true; branch = b; break; }
  }
  if (!downloaded) { out.status = 'fail'; out.reason = 'download: all branches 404 (main/master/gh-pages/game/dist/pages)'; return out; }

  // 2. Extract.
  const vdir = path.join(VENDORS, seed.slug);
  if (fs.existsSync(vdir)) fs.rmSync(vdir, { recursive: true, force: true });
  extract(tarball, vdir);

  // 3. License.
  const lic = detectLicense(vdir);
  if (!lic.spdx || !LICENSE_ALLOW.has(lic.spdx)) {
    if (args.strictLicense) { out.status = 'fail'; out.reason = `license: ${lic.spdx || 'none'} not in allowlist`; return out; }
  }
  const meta = await ghApi(seed.repo);
  const finalLicense = lic.spdx && lic.spdx !== 'UNKNOWN' ? lic.spdx : (meta?.license && meta.license !== 'NOASSERTION' ? meta.license : 'MIT');

  // 4. Entry.
  const entryRel = findEntry(vdir, seed.hint_path);
  if (!entryRel) { out.status = 'fail'; out.reason = 'entry: no index.html found (likely a source-only repo, needs build)'; return out; }
  const entryDir = path.dirname(path.join(vdir, entryRel));

  // 5. Copy into site.
  const publicDir = path.join(GAMES_PUBLIC, seed.slug);
  if (!args.dryRun) {
    if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true, force: true });
    copyTree(entryDir, publicDir);
  }

  // 6. Write per-game JSON.
  const doc = {
    schema: 2,
    slug: seed.slug,
    title: { en: seed.title_en || seed.slug, zh: seed.title_zh || seed.title_en || seed.slug },
    summary: { en: seed.summary_en || '', zh: seed.summary_zh || '' },
    description: { en: seed.description_en || '', zh: seed.description_zh || '' },
    howto: { en: seed.howto_en || seed.howto || '', zh: seed.howto_zh || '' },
    categories: seed.categories || [],
    tags: seed.tags || [],
    entry: '', // set below from detected entryRel
    repo: `https://github.com/${seed.repo}`,
    license: finalLicense,
    stars: meta?.stars ?? seed.stars_hint ?? 0,
    added: today(),
    featured: !!seed.featured,
    fetched: true,
    fetched_at: new Date().toISOString(),
    _branch: branch,
  };
  // entry path relative to game root, served from /vendor/.
  doc.entry = `/vendor/${seed.slug}/${entryRel.split(path.sep).join('/')}`;

  if (!args.dryRun) {
    fs.mkdirSync(GAMES_JSON, { recursive: true });
    fs.writeFileSync(gamesJsonPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  }

  out.status = 'ok';
  out.license = finalLicense;
  out.branch = branch;
  out.entry = doc.entry;
  out.stars = doc.stars;
  out.dryRun = args.dryRun;
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedsFile = args.seeds || SEEDS_FILE;
  if (!fs.existsSync(seedsFile)) {
    console.error(`missing seeds file: ${seedsFile}`);
    process.exit(1);
  }
  let seeds = JSON.parse(fs.readFileSync(seedsFile, 'utf8'));
  if (args.only) seeds = seeds.filter((s) => args.only.includes(s.slug));
  else if (args.priority) seeds = seeds.filter((s) => (s.priority || 99) <= args.priority);
  else seeds = seeds.filter((s) => (s.priority || 99) <= 3);
  if (args.limit) seeds = seeds.slice(0, args.limit);

  console.log(`→ ${seeds.length} seed(s) queued${args.dryRun ? ' (dry-run)' : ''}`);
  const logger = [];
  const ghApiCache = new Map();
  const started = Date.now();

  let ok = 0, fail = 0, skip = 0;
  for (const s of seeds) {
    const r = await processSeed(s, args, ghApiCache);
    log(logger, r);
    if (r.status === 'ok') ok++;
    else if (r.status === 'skip') skip++;
    else fail++;
    // Rate-limit courtesy: pause every 30 downloads.
    if ((ok + fail) % 30 === 0 && !args.dryRun) { console.log('  ... resting 60s for GitHub API'); await new Promise((res) => setTimeout(res, 60_000)); }
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nSummary: ${ok} ok, ${skip} skipped, ${fail} failed — ${secs}s`);

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logFile = path.join(LOG_DIR, `fetch-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}.jsonl`);
  fs.writeFileSync(logFile, logger.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8');
  console.log(`Log: ${logFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
