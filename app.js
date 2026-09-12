let currentCategory = 'all';

// 自定义域名配置（来自 config.local.js，已 gitignore）
// SITE_CONFIG = { "git/项目名": "https://自定义域名" }
const CONFIG = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};

function projectUrl(p) {
  // 有自定义域名就用自定义域名，否则用本地路径
  return CONFIG[p.dir] || (p.dir + '/index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderTabs();
  renderGrid();
});

function renderStats() {
  const cats = [...new Set(PROJECTS.map(p => p.category))];
  document.getElementById('stats').innerHTML = `
    <span>项目 <b>${PROJECTS.length}</b></span>
    <span>分类 <b>${cats.length}</b></span>
  `;
}

function renderTabs() {
  const cats = [...new Set(PROJECTS.map(p => p.category))];
  let html = `<div class="tabs-inner"><button class="tab active" onclick="filterCat('all',this)">全部 ${PROJECTS.length}</button>`;
  cats.forEach(c => {
    const n = PROJECTS.filter(p => p.category === c).length;
    html += `<button class="tab" onclick="filterCat('${c}',this)">${c} ${n}</button>`;
  });
  html += '</div>';
  document.getElementById('tabs').innerHTML = html;
}

function filterCat(cat, el) {
  currentCategory = cat;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderGrid();
}

function renderGrid() {
  const list = currentCategory === 'all' ? PROJECTS : PROJECTS.filter(p => p.category === currentCategory);
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map(p => `
    <div class="card" onclick="location.href='${projectUrl(p)}'">
      <div class="card-body">
        <span class="card-cat">${p.category}</span>
        <div class="card-title">${p.name}</div>
        <div class="card-tagline">${p.tagline}</div>
        <div class="card-desc">${p.description}</div>
        <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="card-highlights">${p.highlights.map(h => `<span class="highlight">✦ ${h}</span>`).join('')}</div>
      </div>
      <div class="card-footer">
        <span class="status">${p.status}</span>
        <span>${p.github ? `<a class="gh-link" href="${p.github}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub →</a>` : ''}</span>
      </div>
    </div>
  `).join('');
}
