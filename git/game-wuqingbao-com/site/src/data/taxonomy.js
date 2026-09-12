// Taxonomy of top-level categories and controlled tag vocabulary.
// Category ids are stable (used in URLs); renaming display text is safe.

export const categories = [
  {
    id: 'arcade',
    icon: '🕹️',
    order: 10,
    name: { en: 'Arcade & Action', zh: '街机 / 动作' },
    blurb: {
      en: 'Fast-paced, high-score chasing. Breakout, invaders, runners, classic remakes.',
      zh: '反应与手感为主，节奏快、局短、追高分。弹球、太空射击、跑酷、经典复刻都在这一类。',
    },
  },
  {
    id: 'puzzle',
    icon: '🧩',
    order: 20,
    name: { en: 'Puzzle', zh: '益智' },
    blurb: {
      en: 'Numbers, logic, spatial reasoning. Merge, match, slide, solve.',
      zh: '数字合成、逻辑推理、空间拼合。2048、消消乐、推箱、数独都属此类。',
    },
  },
  {
    id: 'board',
    icon: '🎲',
    order: 30,
    name: { en: 'Board & Card', zh: '棋牌' },
    blurb: {
      en: 'Traditional games with rules. Chess, mahjong, solitaire, backgammon.',
      zh: '经典桌游牌戏。围棋象棋、麻将纸牌、跳棋双陆。',
    },
  },
  {
    id: 'casual',
    icon: '⚡',
    order: 40,
    name: { en: 'Casual', zh: '休闲' },
    blurb: {
      en: 'One-tap, idle, physics sandboxes. Playable with one hand.',
      zh: '一键操作、挂机放置、物理沙盒。单手能玩，随时中止。',
    },
  },
  {
    id: 'arena',
    icon: '🎯',
    order: 50,
    name: { en: '.io & Arena', zh: '大作战' },
    blurb: {
      en: 'Slither / Agar / Worms style arenas. AI bots when offline.',
      zh: 'slither/agar/worms 类竞技场，本站优先接入含本地 AI 机器人的离线版。',
    },
  },
  {
    id: 'sports',
    icon: '⚽',
    order: 60,
    name: { en: 'Sports', zh: '体育' },
    blurb: {
      en: 'Soccer, racing, billiards, bowling.',
      zh: '足球、竞速、台球、保龄——包含物理模拟的运动玩法。',
    },
  },
  {
    id: 'music',
    icon: '🎵',
    order: 70,
    name: { en: 'Music & Rhythm', zh: '音乐节奏' },
    blurb: {
      en: 'Falling-note, percussion, piano-tiles.',
      zh: '下落式音符、打击、钢琴块，节奏敏感型玩法。',
    },
  },
  {
    id: 'adventure',
    icon: '🗺️',
    order: 80,
    name: { en: 'Adventure & RPG', zh: '冒险 / RPG' },
    blurb: {
      en: 'Platformers, roguelikes, story-driven.',
      zh: '平台跳跃、Roguelike、剧情向。相对耗时的中长线玩法。',
    },
  },
  {
    id: 'retro',
    icon: '👾',
    order: 90,
    name: { en: 'Retro & Experimental', zh: '复古 / 实验' },
    blurb: {
      en: 'JS13k entries, pixel art, jam selections.',
      zh: 'JS13K 极限压缩作品、像素风、Game Jam 精选。玩味大于完成度。',
    },
  },
];

// Tag vocabulary grouped by facet. Fetch script and admin UI use these
// to render filter chips. Games may carry any string in `tags`; anything
// outside these groups is allowed but won't surface in filters.
export const tagGroups = {
  genre: [
    'tetris-like', 'snake', 'flappy-like', 'breakout', 'invaders',
    'match-3', 'merge', 'sliding-puzzle', 'sudoku', 'nonogram',
    'chess', 'checkers', 'reversi', 'mahjong', 'solitaire',
    'platformer', 'runner', 'top-down-shooter', 'danmaku',
    'billiards', 'bowling', 'racing', 'soccer',
    'piano-tiles', 'roguelike', 'metroidvania',
    'idle-clicker', 'one-tap', 'physics', 'tower-defense', 'card-battler',
  ],
  input: ['keyboard', 'mouse', 'touch', 'gamepad'],
  style: ['pixel-art', 'minimalist', 'neon', 'hand-drawn', 'retro-terminal'],
  difficulty: ['pick-up-5s', 'brainy', 'hardcore'],
};

export function categoryName(lang, id) {
  const c = categories.find((x) => x.id === id);
  return c ? c.name[lang] || c.name.en : id;
}

export function categoryById(id) {
  return categories.find((c) => c.id === id);
}
