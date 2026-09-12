// ========== 配置 ==========
const API = 'api/';

// GitHub 语言主色（用于卡片上的小圆点）
const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', Go: '#00ADD8',
  Rust: '#dea584', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4F5D95', Shell: '#89e051', Vue: '#41b883',
  Svelte: '#ff3e00', Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB',
  Jupyter: '#DA5B0B', Markdown: '#083fa1', Unknown: '#cccccc',
};

let allRepos = [];
let allNewsCount = 0;
let currentCat = 'all';
let currentSort = 'stars';
let sortOrder = 'desc'; // desc=倒序, asc=正序
let searchQuery = '';

// ========== 工具函数 ==========
function fmtStars(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function langColor(lang) {
  return LANG_COLORS[lang] || '#cccccc';
}

function getSortedRepos() {
  let list = allRepos;
  if (currentCat !== 'all') list = list.filter(r => r.category === currentCat);
  if (searchQuery) {
    const q = searchQuery;
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) || (r.desc || '').toLowerCase().includes(q)
    );
  }
  const sorters = {
    stars: (a, b) => b.stars - a.stars,
    updated: (a, b) => new Date(b.updated) - new Date(a.updated),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  const sorted = list.slice().sort(sorters[currentSort] || sorters.stars);
  // 正序则反转
  if (sortOrder === 'asc') sorted.reverse();
  return sorted;
}

// ========== 渲染 ==========
function renderStats(s) {
  const el = document.getElementById('stats');
  if (!s || s.error) {
    el.textContent = '统计不可用';
    return;
  }
  const updated = s.last_updated ? new Date(s.last_updated).toLocaleString('zh-CN') : '-';
  el.innerHTML = `共 <b>${s.total}</b> 个仓库 · ${escapeHtml(updated)}`;
}

function renderRepos() {
  const list = getSortedRepos();
  const el = document.getElementById('repos');
  if (list.length === 0) {
    el.innerHTML = '<div class="no-match">无匹配仓库</div>';
    return;
  }
  // 限制渲染数量，避免 DOM 过大
  const shown = list.slice(0, 200);
  el.innerHTML = shown.map(r => `
    <article class="repo-card" data-id="${r.id}" data-url="${r.url}" data-name="${escapeHtml(r.name)}">
      <h3><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a></h3>
      <p class="desc">${r.desc ? escapeHtml(r.desc) : '<i>无描述</i>'}</p>
      <div class="meta">
        <span class="stars">⭐ ${fmtStars(r.stars)}</span>
        <span class="cat">${escapeHtml(r.category)}</span>
        ${r.language ? `<span class="lang" style="--lang-color: ${langColor(r.language)}">${escapeHtml(r.language)}</span>` : ''}
        <time>更新 ${new Date(r.updated).toLocaleDateString('zh-CN')}</time>
      </div>
    </article>
  `).join('');
}

function renderNews(d) {
  const el = document.getElementById('news-list');
  if (!d || d.error || !d.items || d.items.length === 0) {
    el.innerHTML = '<div class="no-match">暂无消息</div>';
    return;
  }
  allNewsCount = d.items.length;
  el.innerHTML = d.items.map(n => `
    <div class="news-item">
      <a href="${n.link}" target="_blank" rel="noopener">${escapeHtml(n.title)}</a>
      <time>${n.date ? new Date(n.date).toLocaleDateString('zh-CN') : ''}</time>
      <span class="source">${escapeHtml(n.source)}</span>
    </div>
  `).join('');
  updateNewsCount(allNewsCount);
}

// ========== Tab 计数 ==========
function updateRepoCounts() {
  const counts = { all: allRepos.length };
  allRepos.forEach(r => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });
  document.querySelectorAll('#filter-bar button[data-cat]').forEach(btn => {
    const cat = btn.dataset.cat;
    const badge = btn.querySelector('.count');
    if (badge) badge.textContent = counts[cat] || 0;
  });
}

function updateNewsCount(n) {
  const badge = document.querySelector('#filter-bar button[data-view="news"] .count');
  if (badge) badge.textContent = n;
}

// ========== 视图切换 ==========
function switchView(view) {
  const reposView = document.getElementById('repos-view');
  const newsView = document.getElementById('news-view');
  if (view === 'news') {
    reposView.hidden = true;
    newsView.hidden = false;
  } else {
    reposView.hidden = false;
    newsView.hidden = true;
  }
}

// ========== 数据加载 ==========
async function loadStats() {
  try {
    const r = await fetch(API + '?action=stats');
    renderStats(await r.json());
  } catch (e) {
    document.getElementById('stats').textContent = '统计加载失败';
  }
}

async function loadRepos() {
  try {
    const r = await fetch(API + '?action=repos&category=all');
    const d = await r.json();
    allRepos = d.repos || [];
    updateRepoCounts();
    renderRepos();
  } catch (e) {
    document.getElementById('repos').innerHTML =
      '<div class="no-match">仓库数据加载失败</div>';
  }
}

async function loadNews() {
  try {
    const r = await fetch(API + '?action=news');
    renderNews(await r.json());
  } catch (e) {
    document.getElementById('news-list').innerHTML =
      '<div class="no-match">消息加载失败</div>';
    updateNewsCount(0);
  }
}

// ========== 事件绑定 ==========
// 导航 tab 切换（分类 + 消息流）
document.getElementById('filter-bar').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#filter-bar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (btn.dataset.view === 'news') {
    switchView('news');
  } else {
    switchView('repos');
    currentCat = btn.dataset.cat;
    renderRepos();
  }
});

// 搜索（防抖）
let searchTimer = null;
document.getElementById('search').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderRepos();
  }, 200);
});

// 排序 tab 切换
document.getElementById('sort-bar').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;

  // 正序/倒序切换按钮
  if (btn.id === 'order-toggle') {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    btn.dataset.order = sortOrder;
    btn.textContent = sortOrder === 'desc' ? '↓ 倒序' : '↑ 正序';
    renderRepos();
    return;
  }

  // 排序字段 tab
  if (!btn.dataset.sort) return;
  document.querySelectorAll('#sort-bar button[data-sort]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSort = btn.dataset.sort;
  renderRepos();
});

// 仓库卡片点击 — 点任意位置弹窗，拦截标题链接跳转
document.getElementById('repos').addEventListener('click', e => {
  const card = e.target.closest('.repo-card');
  if (!card) return;
  e.preventDefault();
  openInsight(
    card.dataset.id,
    card.dataset.name,
    card.dataset.url
  );
});

// ========== 项目解读弹窗 ==========
const insightCache = new Map(); // 内存缓存，避免重复请求

async function openInsight(repoId, repoName, repoUrl) {
  const modal = document.getElementById('insight-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const visitLink = document.getElementById('modal-visit');

  title.textContent = repoName || '项目解读';
  visitLink.href = repoUrl || '#';
  body.innerHTML = '<div class="loading">加载解读中...</div>';
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // 命中缓存直接渲染
  if (insightCache.has(repoId)) {
    renderInsightBody(insightCache.get(repoId));
    return;
  }

  try {
    const r = await fetch(`${API}?action=insight&id=${repoId}`);
    const d = await r.json();
    if (d.error) {
      body.innerHTML = `<div class="no-match">解读生成失败：${escapeHtml(d.error)}</div>`;
      return;
    }
    insightCache.set(repoId, d);
    renderInsightBody(d);
  } catch (e) {
    body.innerHTML = '<div class="no-match">解读加载失败，请稍后重试</div>';
  }
}

function renderInsightBody(d) {
  const body = document.getElementById('modal-body');

  let html = '';

  // 概述
  if (d.summary) {
    html += `<div class="insight-summary">${escapeHtml(d.summary)}</div>`;
  }

  // 技术特征
  if (d.tech_features && Object.keys(d.tech_features).length) {
    html += '<div class="insight-section"><h4>技术特征</h4><ul class="feature-list">';
    for (const [k, v] of Object.entries(d.tech_features)) {
      html += `<li><b>${escapeHtml(k)}</b>：${escapeHtml(v)}</li>`;
    }
    html += '</ul></div>';
  }

  // 适用场景
  if (d.use_cases && d.use_cases.length) {
    html += '<div class="insight-section"><h4>适用场景</h4><div class="insight-tags">';
    d.use_cases.forEach(uc => {
      html += `<span class="tag">${escapeHtml(uc)}</span>`;
    });
    html += '</div></div>';
  }

  // 热度评价
  if (d.popularity) {
    html += `<div class="insight-section"><h4>热度评价</h4><div class="insight-popularity">${escapeHtml(d.popularity)}</div></div>`;
  }

  // 分类
  if (d.category) {
    html += `<div class="insight-section"><h4>分类</h4><span class="tag">${escapeHtml(d.category)}</span></div>`;
  }

  body.innerHTML = html || '<div class="no-match">暂无解读内容</div>';
}

function closeInsight() {
  const modal = document.getElementById('insight-modal');
  modal.hidden = true;
  document.body.style.overflow = '';
}

// 点击遮罩关闭
document.getElementById('insight-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeInsight();
});

// ESC 关闭
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeInsight();
});

// ========== 启动 ==========
Promise.all([loadStats(), loadRepos(), loadNews()]);
