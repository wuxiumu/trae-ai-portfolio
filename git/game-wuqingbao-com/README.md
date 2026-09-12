# game-wuqingbao.com

中英双语开源 H5 小游戏站。

- 技术：Astro 5 静态站
- 内容：GitHub 开源游戏 → iframe 嵌入 / 在线试玩外链
- 双语：`/` 英文 · `/zh/` 中文
- 统计：Umami

## 快速开始

```bash
# 1. 安装依赖
npm run install:all

# 2. 拉取游戏源码（≤1MB 自动，>1MB 跳过）
npm run clone

# 3. 集成到站点（探测入口→拷贝→生成元数据）
npm run fetch

# 4. 启动开发服务器
npm run dev
# → http://localhost:4321
```

## 全部命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（热更新），localhost:4321 |
| `npm run build` | 构建静态产物到 `site/dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm run install:all` | 安装 site/ 的 npm 依赖 |
| `npm run clone` | 读 games-list.md，批量 git clone ≤1MB 的游戏 |
| `npm run clone:all` | 全部 clone（含 >1MB 的大仓库） |
| `npm run clone:dry` | 预览会 clone 哪些，不执行 |
| `npm run clone:update` | 对已存在的执行 git pull 更新 |
| `npm run fetch` | 跑抓取集成管线（下载+校验+拷站） |
| `npm run fetch:dry` | fetch 预览模式 |
| `npm run batch` | 分批推进（用法：`npm run batch -- 1`） |
| `npm run status` | 查看各分类游戏数 + 最近日志 |
| `npm run clean` | 清理 dist / .astro / logs |
| `npm run list` | 打印游戏清单 |

## 部署

```bash
npm run build
# site/dist/ 扔到 Cloudflare Pages / GitHub Pages / Vercel
```

## 目录

```
├── doc/               # 项目文档（编号）
├── games-list.md      # 游戏主清单
├── scripts/           # clone / fetch / batch 工具
├── site/              # Astro 项目
├── package.json       # 快捷命令入口（本文件）
└── vendors/           # 游戏源码（gitignore，clone 生成）
```

详细文档见 `doc/`。
