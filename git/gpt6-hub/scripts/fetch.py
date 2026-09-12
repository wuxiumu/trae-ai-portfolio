#!/usr/bin/env python3
"""
gpt6-hub 爬虫 - 并发抓取 GitHub GPT-6/Astra 相关项目
用法:
  python3 scripts/fetch.py                 # 用环境变量 GITHUB_TOKEN
  python3 scripts/fetch.py --token ghp_xxx # 命令行传 token
  python3 scripts/fetch.py --workers 8     # 并发数（默认 6）
"""
import argparse
import json
import os
import sys
import time
import concurrent.futures
from pathlib import Path
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    print("ERROR: requests 未安装，请运行: pip3 install requests", file=sys.stderr)
    sys.exit(1)

# -------- 配置 --------
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 黑名单文件 — 每行一个关键词（# 开头为注释，空行忽略）
BLACKLIST_FILE = ROOT / "hml.txt"

# GitHub Search queries — 覆盖 GPT-6 / Astra / Codex 全生态
QUERIES = [
    "topic:gpt6",
    "topic:gpt-6",
    "topic:gpt-6-astra",
    "topic:astra",
    "topic:codex-free",
    "topic:gpt-6-astra-game",
    "topic:gpt-6-prompts",
    "topic:gpt-6-benchmark",
    "gpt-6-astra in:name,description",
    "gpt-6 in:name,description",
]

# 分类规则 — (类目, [topic 关键词], [description 关键词])
# topic 命中即归类；description 需配合上下文（含 gpt-6/astra 才算）
CATEGORY_RULES = [
    ("awesome-lists", ["awesome-list", "gpt6", "gpt-6-astra", "awesome-gpt6"], ["awesome gpt-6", "awesome gpt6", "gpt-6 astra"]),
    ("games",         ["game-development", "gpt-6-astra", "astra"], ["astra game", "gpt-6 game", "gpt6 game"]),
    ("prompts",       ["prompts", "prompt-engineering", "gpt-6-prompts"], ["gpt-6 prompt", "gpt6 prompt", "astra prompt"]),
    ("coding-tools",  ["codex", "codex-cli", "codex-free", "ai-coding", "coding-agent"], ["codex", "gpt-6 codex", "astra codex"]),
    ("benchmarks",    ["benchmark", "model-evaluation", "gpt-6-benchmark"], ["gpt-6 benchmark", "astra benchmark", "astra vs"]),
    ("agents",        ["ai-agents", "coding-agents", "responses-api", "agent"], ["gpt-6 agent", "astra agent"]),
    ("integrations",  ["home-assistant", "wordpress", "mcp", "integration"], ["astra home", "astra integration", "gpt-6 mcp"]),
]

UA = "gpt6-hub-fetcher/1.0"


def classify_repo(repo: dict) -> str:
    """按 topics + description 关键词分类
    topic 命中即归类；description 需配合上下文（含 gpt-6/astra 才算）
    """
    topics = [t.lower() for t in repo.get("topics", [])]
    desc = (repo.get("description") or "").lower()
    for cat, topic_kw, desc_kw in CATEGORY_RULES:
        # topic 命中直接归类
        for kw in topic_kw:
            if kw in topics:
                return cat
        # description 命中需配合上下文（避免误判）
        for kw in desc_kw:
            if kw in desc:
                return cat
    return "other"


def load_blacklist(path: Path = BLACKLIST_FILE):
    """从 hml.txt 读取黑名单关键词
    规则：每行一个关键词，不区分大小写；# 开头为注释，空行忽略；
    行内 # 之后的内容也算注释。返回去重后的小写关键词列表。
    """
    keywords = []
    if not path.exists():
        print(f"WARN: 黑名单文件不存在: {path}（本次不过滤）", file=sys.stderr)
        return keywords
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if line:
            keywords.append(line.lower())
    # 去重并保序
    seen = set()
    unique = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            unique.append(kw)
    return unique


def match_blacklist(repo: dict, keywords):
    """检查仓库 name/url/desc/topics 是否包含任一黑名单关键词
    命中返回该关键词，未命中返回 None。
    """
    if not keywords:
        return None
    haystack = " ".join([
        repo.get("name", ""),
        repo.get("url", ""),
        repo.get("desc", ""),
        " ".join(repo.get("topics", [])),
    ]).lower()
    for kw in keywords:
        if kw in haystack:
            return kw
    return None


# GitHub 仓库描述官方上限约 350 字符，超过即异常；HTML 标记视为垃圾数据
MAX_DESC_LEN = 500
HTML_MARKERS = ("<!doctype", "<html", "<head", "<body", "<script", "<style", "</body>", "</html>")


def is_junk_repo(repo: dict):
    """识别垃圾仓库（描述是网页源码/超长乱码，可能夹带 API key 等敏感串）
    命中返回原因字符串，未命中返回 None。
    """
    desc = repo.get("desc") or ""
    low = desc.lower()
    for marker in HTML_MARKERS:
        if marker in low:
            return f"描述含 HTML 标记({marker})"
    if len(desc) > MAX_DESC_LEN:
        return f"描述超长({len(desc)} 字符)"
    return None


def fetch_query(args_tuple):
    """抓单个 query — 在线程池中执行"""
    query, token, session = args_tuple
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 100,
    }
    url = "https://api.github.com/search/repositories?" + urlencode(params)
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": UA,
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # 重试机制
    for attempt in range(3):
        try:
            r = session.get(url, headers=headers, timeout=30)
            if r.status_code == 200:
                items = r.json().get("items", [])
                print(f"  [{query}] -> {len(items)} repos", file=sys.stderr)
                return items
            elif r.status_code == 429 or "rate limit" in r.text.lower():
                wait = int(r.headers.get("Retry-After", 60))
                print(f"  [{query}] rate limited, wait {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            else:
                print(f"  [{query}] HTTP {r.status_code}: {r.text[:120]}", file=sys.stderr)
                return []
        except Exception as e:
            print(f"  [{query}] error: {e}", file=sys.stderr)
            time.sleep(2)
    return []


def fetch_github(token: str, workers: int):
    """并发抓取所有 query"""
    session = requests.Session()
    # 复用连接池
    adapter = requests.adapters.HTTPAdapter(pool_connections=workers, pool_maxsize=workers * 2)
    session.mount("https://", adapter)

    blacklist = load_blacklist()
    if blacklist:
        print(f"==> 黑名单已加载 {len(blacklist)} 个关键词: {', '.join(blacklist)}", file=sys.stderr)

    print(f"==> 开始抓取 GitHub（{len(QUERIES)} 个 query，{workers} 并发）", file=sys.stderr)
    tasks = [(q, token, session) for q in QUERIES]

    seen_ids = set()
    repos = []
    blocked = 0
    junked = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        results = ex.map(fetch_query, tasks)
        for items in results:
            for r in items:
                rid = r["id"]
                if rid in seen_ids:
                    continue
                seen_ids.add(rid)
                raw_desc = r.get("description") or ""
                # 先用原始描述检测黑名单和垃圾数据
                probe = {
                    "name": r["full_name"],
                    "url": r["html_url"],
                    "desc": raw_desc,
                    "topics": r.get("topics") or [],
                }
                hit = match_blacklist(probe, blacklist)
                if hit:
                    blocked += 1
                    print(f"  [黑名单] 命中 '{hit}': {r['full_name']}", file=sys.stderr)
                    continue
                reason = is_junk_repo(probe)
                if reason:
                    junked += 1
                    print(f"  [垃圾数据] {reason}: {r['full_name']}", file=sys.stderr)
                    continue
                repo = {
                    "id": r["id"],
                    "name": r["full_name"],
                    "url": r["html_url"],
                    "desc": raw_desc[:MAX_DESC_LEN],
                    "stars": r["stargazers_count"],
                    "language": r.get("language") or "",
                    "topics": r.get("topics") or [],
                    "updated": r["updated_at"],
                    "category": classify_repo(r),
                }
                repos.append(repo)

    if blocked:
        print(f"==> 黑名单过滤: 排除 {blocked} 个仓库", file=sys.stderr)
    if junked:
        print(f"==> 垃圾数据过滤: 排除 {junked} 个仓库", file=sys.stderr)

    # 写 repos.json
    repos.sort(key=lambda x: x["stars"], reverse=True)
    (DATA_DIR / "repos.json").write_text(
        json.dumps(repos, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"==> repos.json: {len(repos)} 个仓库", file=sys.stderr)
    return repos


def compute_stats(repos):
    """统计"""
    by_cat = {c: 0 for c, _, _ in CATEGORY_RULES}
    by_cat["other"] = 0
    for r in repos:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1

    # 语言分布 Top 10
    lang_count = {}
    for r in repos:
        lang = r["language"] or "Unknown"
        lang_count[lang] = lang_count.get(lang, 0) + 1
    top_langs = sorted(lang_count.items(), key=lambda x: x[1], reverse=True)[:10]

    stats = {
        "total": len(repos),
        "by_category": by_cat,
        "top_languages": [{"lang": l, "count": c} for l, c in top_langs],
        "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "source": "GitHub API v3",
    }
    (DATA_DIR / "stats.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"==> stats.json: {stats['total']} 仓库, {len(by_cat)} 类目", file=sys.stderr)


def fetch_news(token: str):
    """抓取 OpenAI 官博 RSS"""
    print("==> 抓取 OpenAI Blog RSS", file=sys.stderr)
    try:
        import xml.etree.ElementTree as ET
        r = requests.get("https://openai.com/blog/rss.xml", timeout=20,
                         headers={"User-Agent": UA})
        root = ET.fromstring(r.content)
        news = []
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            date = (item.findtext("pubDate") or "").strip()
            # 只保留 GPT-6 / Astra / Codex 相关
            if not any(kw in title for kw in ["GPT-6", "GPT 6", "Astra", "Codex", "gpt-6", "astra"]):
                continue
            news.append({
                "title": title,
                "link": link,
                "date": date,
                "source": "OpenAI Blog",
            })
        (DATA_DIR / "news.json").write_text(
            json.dumps({"count": len(news), "items": news},
                       ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"==> news.json: {len(news)} 条消息", file=sys.stderr)
    except Exception as e:
        print(f"  RSS 抓取失败: {e}", file=sys.stderr)
        (DATA_DIR / "news.json").write_text(
            json.dumps({"count": 0, "items": []}, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


def write_last_run(repos_count, news_count, token_used):
    """运行日志"""
    log = {
        "time": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "repos": repos_count,
        "news": news_count,
        "token_used": token_used,
    }
    (DATA_DIR / "last_run.json").write_text(
        json.dumps(log, indent=2), encoding="utf-8"
    )


def main():
    parser = argparse.ArgumentParser(description="gpt6-hub 爬虫")
    parser.add_argument("--token", default="", help="GitHub Personal Access Token")
    parser.add_argument("--workers", type=int, default=6, help="并发线程数 (默认 6)")
    args = parser.parse_args()

    token = args.token or os.getenv("GITHUB_TOKEN", "")
    token_used = bool(token)
    if not token:
        print("WARN: 无 GITHUB_TOKEN，匿名访问限 60 req/h", file=sys.stderr)

    repos = fetch_github(token, args.workers)
    compute_stats(repos)
    fetch_news(token)
    write_last_run(len(repos), 0, token_used)

    print(f"\n✅ 完成: {len(repos)} 个仓库已写入 data/repos.json", file=sys.stderr)
    print(f"   站点统计: data/stats.json", file=sys.stderr)
    print(f"   运行日志: data/last_run.json", file=sys.stderr)


if __name__ == "__main__":
    main()
