# trae-ai-portfolio

> AI 项目作品集门户：小红书内容流水线 / AI 生图 / GPT 聚合站 / 游戏开发。纯静态 HTML+CSS+JS，零依赖。

## 快速开始

```bash
cd trae-ai-portfolio
php -S 127.0.0.1:8800
# 或任意静态服务器，浏览器打开 http://127.0.0.1:8800
```

## 添加新项目（两步）

1. 把项目源码放入 `git/你的项目名/`
2. 在 [projects.js](projects.js) 数组里加一条：

```js
{
  name: "项目名称",
  tagline: "一句话描述",
  description: "详细描述（2-3句）",
  tags: ["Python", "LLM"],
  category: "内容生产",
  status: "生产中",
  github: "https://github.com/...",
  highlights: ["亮点1", "亮点2"],
  created: "2026-09",
  dir: "git/你的项目名"
}
```

刷新首页，新项目自动出现在卡片网格和分类筛选中。

## 自定义域名跳转（本地配置，不上传）

复制 `config.local.js` 模板（见文件内注释），配置映射后点击卡片跳转到线上域名而非本地路径：

```js
const SITE_CONFIG = {
  "git/Xiaohongshu-multi-agent-workflow": "https://xiaohongshu-multi-agent-workflow.chiguashentan.com"
};
```

`config.local.js` 已在 [.gitignore](.gitignore) 中，不会提交到仓库。

## 目录结构

```
trae-ai-portfolio/
├── index.html       # 首页
├── style.css        # 样式
├── app.js           # 渲染逻辑（分类筛选、卡片、跳转）
├── projects.js      # 项目数据（新项目加一条）
├── config.local.js  # 本地域名配置（gitignore，不上传）
├── robots.txt / sitemap.xml / llms.txt  # SEO/GEO 收录
└── git/             # 各项目源码
```

## SEO/GEO

- meta 三件套 + Open Graph + Twitter Card + canonical
- JSON-LD 结构化数据（WebSite + ContactPoint）
- noscript 静态全文（爬虫不执行 JS 也能抓到完整内容）
- robots.txt 放行 GPTBot/ClaudeBot/Google-Extended（GEO）
- llms.txt 供 AI 抓取器快速理解项目

## 联系方式

- Email: contact@chiguashentan.com
- GitHub: https://github.com/wuxiumu
