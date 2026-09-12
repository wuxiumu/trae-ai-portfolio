// Game catalog. Each entry is the single source of truth used by home, list,
// detail, category pages and the JSON export consumed by the admin tool later.
//
// Fields:
//   slug            URL id (kebab)
//   title           { en, zh }
//   summary         { en, zh } one-liner shown on card
//   description     { en, zh } longer, on detail page
//   howto           { en, zh } controls / rules
//   categories      array of category ids
//   tags            free-form strings
//   entry           iframe src under /games/
//   cover           optional image path (falls back to placeholder)
//   repo            upstream GitHub URL
//   license         SPDX id
//   stars           GitHub stars at time of clone (informational)
//   added           ISO date

export const games = [
  {
    slug: '2048',
    title: { en: '2048', zh: '2048' },
    summary: {
      en: 'The classic number-merge puzzle. Slide tiles, combine equal numbers, reach 2048.',
      zh: '经典数字合成益智。滑动方块，相同数字合并，冲上 2048。',
    },
    description: {
      en: 'Gabriele Cirulli\'s original 2048 — the game that kicked off a hundred clones. Written in vanilla JavaScript with zero build step, MIT-licensed, and still the reference implementation for puzzle-game clarity.',
      zh: 'Gabriele Cirulli 的 2048 原版——掀起合成品类狂潮的起点。纯原生 JavaScript 实现，无构建步骤，MIT 协议，至今仍是益智类游戏的参考实现。',
    },
    howto: {
      en: 'Arrow keys or WASD on desktop; swipe on mobile. Merge equal numbers to grow tiles.',
      zh: '电脑端方向键或 WASD；手机端滑动手势。相同数字碰撞合并升级。',
    },
    categories: ['puzzle'],
    tags: ['numbers', 'merge', 'keyboard', 'touch'],
    entry: '/games/2048/index.html',
    repo: 'https://github.com/gabrielecirulli/2048',
    license: 'MIT',
    stars: 13367,
    added: '2026-08-30',
    featured: true,
  },
  {
    slug: 'snake-io',
    title: { en: 'Snake.io', zh: '贪吃蛇大作战（离线版）' },
    summary: {
      en: 'Slither-style snake arena — grow by eating pellets, avoid hitting other snakes, AI bots included.',
      zh: 'Slither 风格贪吃蛇竞技场——吃豆子变长、别撞其他蛇，内置 AI 机器人对手。',
    },
    description: {
      en: 'A pure-frontend take on the slither.io formula by Bibhuti Poudyal. No server required, all bots run locally on canvas. A great starting point for reskinning your own multiplayer snake.',
      zh: 'Bibhuti Poudyal 出品的纯前端 slither.io 复刻。零后端，所有 AI 蛇在本地 canvas 上跑。做多人贪吃蛇二次开发的最佳起手板。',
    },
    howto: {
      en: 'Move the mouse to steer. Click to boost (spends length). Eat food, avoid bigger snakes.',
      zh: '鼠标控制方向，点击加速（消耗身长）。吃食物、避开比你更大的蛇。',
    },
    categories: ['archade', 'casual'],
    tags: ['snake', 'arena', 'mouse', 'ai-bots', 'canvas'],
    entry: '/games/snake-io/index.html',
    repo: 'https://github.com/bibhuticoder/snake.io',
    license: 'MIT',
    stars: 48,
    added: '2026-08-30',
    featured: true,
  },
];

export const categories = [
  { id: 'archade',  icon: '🕹️', order: 10 },
  { id: 'puzzle',   icon: '🧩', order: 20 },
  { id: 'board',    icon: '🎲', order: 30 },
  { id: 'casual',   icon: '⚡', order: 40 },
  { id: 'platformer', icon: '🏃', order: 50 },
];

export function gamesByCategory(id) {
  return games.filter((g) => g.categories.includes(id));
}

export function findGame(slug) {
  return games.find((g) => g.slug === slug);
}
