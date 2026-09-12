/**
 * 项目数据 —— 新项目只需在数组里加一条即可
 * git/ 目录下放对应的项目源码（含 index.html 的可点击跳转）
 */
const PROJECTS = [
  {
    name: "小红书多智能体工作流",
    tagline: "Python + LLM + Playwright 三智能体内容生产流水线",
    description: "收集→判断→执行三智能体架构的小红书选题与内容自动化框架。自动采集爆款笔记、智能判断选题价值、生成 Markdown 图文成品，本地产出物料不自动发帖。",
    tags: ["Python", "LLM", "Playwright", "PHP", "多智能体", "自动化"],
    category: "内容生产",
    status: "生产中",
    github: "https://github.com/wuxiumu/Xiaohongshu-multi-agent-workflow",
    highlights: ["三智能体架构", "16篇成品", "选题自动采集", "Markdown图文成品"],
    created: "2026-08",
    dir: "git/Xiaohongshu-multi-agent-workflow"
  },
  {
    name: "AI蜡笔英语启蒙单词卡",
    tagline: "AI生图 + Pillow拼卡 + LLM文案的幼儿英语内容工厂",
    description: "小红书2-6岁英语启蒙账号内容流水线：AI原创蜡笔风生图、Pillow本地拼九页卡、LLM生成发帖文案。20词×9页=180张成品卡，系统不自动发帖只产出本地物料。",
    tags: ["AI生图", "Pillow", "百炼", "PHP", "英语启蒙", "小红书"],
    category: "AI内容",
    status: "生产中",
    github: "https://github.com/wuxiumu/RED-content-pipeline-mass-produces",
    highlights: ["20篇成品", "180张九页卡", "80张AI原图", "蜡笔风统一画风"],
    created: "2026-08",
    dir: "git/RED-content-pipeline-mass-produces"
  },
  {
    name: "GPT-6 Hub 项目聚合站",
    tagline: "Python爬虫 + PHP后端 + 原生前端三件套",
    description: "GitHub GPT-6/Astra/Codex生态项目聚合站。Python并发爬虫每小时抓取相关仓库，PHP后端提供分类API，前端原生三件套展示，含中文解读与黑名单过滤。",
    tags: ["Python爬虫", "PHP", "GitHub API", "GPT-6", "聚合站"],
    category: "工具",
    status: "运行中",
    github: "",
    highlights: ["自动抓取", "分类聚合", "中文解读", "消息流"],
    created: "2026-09",
    dir: "git/gpt6-hub"
  },
  {
    name: "无情报游戏",
    tagline: "游戏开发项目",
    description: "无情报游戏站，包含游戏列表与相关文档。",
    tags: ["游戏", "Web"],
    category: "游戏",
    status: "开发中",
    github: "",
    highlights: ["游戏列表", "文档"],
    created: "2026-09",
    dir: "git/game-wuqingbao-com"
  }
];
