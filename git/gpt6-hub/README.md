# GPT-6 Hub

GitHub GPT-6 / Astra 项目聚合站，Python 爬虫驱动，PHP 后端，前端原生三件套。每小时自动抓取相关仓库与 OpenAI 官方博客消息，提供中文项目解读与黑名单过滤。

## 功能特性

- **自动抓取**：Python 并发爬虫从 GitHub Search API 抓取 GPT-6 / Astra / Codex 生态项目
- **分类聚合**：精选清单、游戏、提示词、编码工具、基准测试、AI Agent、集成应用
- **黑名单过滤**：通过 `hml.txt` 管理过滤关键词，命中即排除（如 `51chigua`、`ollama`）
- **项目中文解读**：点击仓库卡片弹窗展示自动生成的中文解读（技术特征、适用场景、热度评价），只生成一次后持久化缓存
- **消息流**：抓取 OpenAI 官方博客 RSS，筛选 GPT-6 / Astra / Codex 相关内容
- **吸顶导航**：固定头部 + 吸顶分类 tab，每个 tab 带数量徽章
- **排序与搜索**：Star / 更新时间 / 名称 tab 切换 + 正序倒序切换 + 关键词搜索

## 项目结构

```
gpt6-hub/
├── scripts/
│   └── fetch.py          # Python 爬虫（抓取 + 分类 + 黑名单过滤）
├── api/
│   ├── index.php         # 统一路由入口
│   ├── repos.php         # 仓库列表 API
│   ├── news.php          # 消息流 API
│   ├── stats.php         # 站点统计 API
│   └── insight.php       # 项目中文解读 API（按需生成，持久化缓存）
├── assets/
│   ├── app.js            # 前端交互（视图切换、弹窗、排序、搜索）
│   └── style.css         # 样式（固定头部、吸顶导航、弹窗、卡片）
├── data/
│   ├── repos.json        # 仓库数据
│   ├── news.json         # 消息数据
│   ├── stats.json        # 统计数据
│   ├── last_run.json     # 运行日志
│   └── insights/         # 中文解读缓存（自动生成，.gitignore 排除）
├── hml.txt               # 黑名单配置
├── index.html            # 首页
└── .gitignore
```

## 快速开始

### 1. 环境要求

- Python 3.10+（爬虫）
- PHP 7.4+（后端 API）
- Web 服务器（Nginx / Apache / PHP 内置服务器）

### 2. 安装依赖

```bash
cd gpt6-hub
python3 -m venv .venv
source .venv/bin/activate
pip install requests
```

### 3. 配置 GitHub Token

爬虫使用环境变量 `GITHUB_TOKEN`（匿名访问限 60 req/h，有 Token 限 5000 req/h）：

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### 4. 抓取数据

```bash
python3 scripts/fetch.py
# 或指定 token 和并发数
python3 scripts/fetch.py --token ghp_xxx --workers 8
```

### 5. 黑名单管理

编辑 `hml.txt`，每行一个关键词，不区分大小写，`#` 开头为注释：

```
51chigua
ollama
# 下面是其他需要过滤的
some-spam-keyword
```

### 6. 启动服务

```bash
# 使用 PHP 内置服务器（开发用）
cd gpt6-hub
php -S 0.0.0.0:8000
```

访问 `http://localhost:8000` 即可。

### 7. 定时抓取（可选）

添加 crontab 每小时自动执行：

```bash
0 * * * * cd /path/to/gpt6-hub && .venv/bin/python3 scripts/fetch.py --token ghp_xxx >> /tmp/gpt6-hub.log 2>&1
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 爬虫 | Python + requests + concurrent.futures |
| 后端 | PHP（无框架，单文件路由） |
| 前端 | 原生 HTML / CSS / JavaScript（无框架） |
| 数据 | JSON 文件存储 |
| 数据源 | GitHub Search API v3 + OpenAI Blog RSS |

## API 接口

| 接口 | 说明 |
|------|------|
| `api/?action=stats` | 站点统计（总数、分类分布、语言 Top10） |
| `api/?action=repos&category=all` | 仓库列表（支持分类筛选） |
| `api/?action=news` | OpenAI 博客消息流 |
| `api/?action=insight&id=123` | 仓库中文解读（首次请求自动生成并缓存） |

## License

MIT
