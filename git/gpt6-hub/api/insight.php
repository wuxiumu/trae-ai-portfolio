<?php
// api/insight.php — 仓库中文解读（按需生成，只生成一次）
// 用法: api/?action=insight&id=123

$reposFile = __DIR__ . '/../data/repos.json';
$insightsDir = __DIR__ . '/../data/insights';

// 确保目录存在
if (!is_dir($insightsDir)) {
    mkdir($insightsDir, 0755, true);
}

$repoId = $_GET['id'] ?? '';
if (!$repoId || !ctype_digit($repoId)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid repo id'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 检查是否已有解读
$insightFile = $insightsDir . "/{$repoId}.json";
if (file_exists($insightFile)) {
    echo file_get_contents($insightFile);
    exit;
}

// 从 repos.json 查找仓库
if (!file_exists($reposFile)) {
    http_response_code(503);
    echo json_encode(['error' => 'repos data not ready'], JSON_UNESCAPED_UNICODE);
    exit;
}
$allRepos = json_decode(file_get_contents($reposFile), true);
$repo = null;
foreach ($allRepos as $r) {
    if ((string)$r['id'] === $repoId) {
        $repo = $r;
        break;
    }
}
if (!$repo) {
    http_response_code(404);
    echo json_encode(['error' => 'repo not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== 生成中文解读 =====
$insight = generateInsight($repo);

// 保存解读（只生成一次）
$output = json_encode($insight, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
file_put_contents($insightFile, $output);
echo $output;


// ===== 解读生成逻辑 =====
function generateInsight(array $repo): array {
    $name = $repo['name'] ?? '';
    $desc = $repo['desc'] ?? '';
    $lang = $repo['language'] ?: '未标注';
    $stars = $repo['stars'] ?? 0;
    $topics = $repo['topics'] ?? [];
    $category = $repo['category'] ?? 'other';
    $url = $repo['url'] ?? '';

    // 分类中文名
    $catNames = [
        'awesome-lists' => '精选清单',
        'games' => '游戏开发',
        'prompts' => '提示词工程',
        'coding-tools' => '编码工具',
        'benchmarks' => '基准测试',
        'agents' => 'AI 智能体',
        'integrations' => '集成应用',
        'other' => '其他',
    ];
    $catName = $catNames[$category] ?? '其他';

    // 概述
    $summary = buildSummary($name, $desc, $catName, $stars);

    // 技术特征
    $techFeatures = buildTechFeatures($lang, $topics);

    // 适用场景
    $useCases = buildUseCases($category, $topics, $desc);

    // 热度评价
    $popularity = buildPopularity($stars);

    return [
        'repo_id' => $repo['id'],
        'name' => $name,
        'url' => $url,
        'generated_at' => date('c'),
        'summary' => $summary,
        'tech_features' => $techFeatures,
        'use_cases' => $useCases,
        'popularity' => $popularity,
        'category' => $catName,
    ];
}

function buildSummary(string $name, string $desc, string $catName, int $stars): string {
    $parts = [];

    // 项目名解读
    $shortName = $name;
    $ownerEnd = strpos($name, '/');
    if ($ownerEnd !== false) {
        $shortName = substr($name, $ownerEnd + 1);
    }
    $parts[] = "{$name} 是一个属于「{$catName}」分类的 GitHub 开源项目。";

    // 描述翻译/解读
    if ($desc) {
        $parts[] = "项目描述为：{$desc}。";
    } else {
        $parts[] = "该项目暂未提供描述信息。";
    }

    return implode('', $parts);
}

function buildTechFeatures(string $lang, array $topics): array {
    $features = [];

    // 语言
    $langMap = [
        'Python' => 'Python，适合数据处理、AI/ML 和快速原型开发',
        'JavaScript' => 'JavaScript，适合 Web 前端和全栈开发',
        'TypeScript' => 'TypeScript，提供类型安全的 Web 开发体验',
        'Rust' => 'Rust，注重性能与内存安全的系统级开发',
        'Go' => 'Go，适合高并发后端服务',
        'C++' => 'C++，高性能计算与系统级开发',
        'HTML' => 'HTML，以网页展示为主',
        'PHP' => 'PHP，服务端 Web 开发',
        'Shell' => 'Shell 脚本，运维与自动化工具',
        'Java' => 'Java，企业级应用开发',
        'C#' => 'C#，.NET 生态开发',
        'Ruby' => 'Ruby，简洁优雅的 Web 开发',
        'Vue' => 'Vue，渐进式前端框架',
        'Svelte' => 'Svelte，编译型前端框架',
        'Kotlin' => 'Kotlin，JVM 生态现代语言',
        'Swift' => 'Swift，Apple 平台原生开发',
        'Dart' => 'Dart，Flutter 跨平台开发',
        'Jupyter' => 'Jupyter Notebook，交互式数据分析',
        'Markdown' => 'Markdown，文档类项目',
    ];
    $features['编程语言'] = $langMap[$lang] ?? "{$lang}，技术栈较为多样";

    // Topics 分析
    if ($topics) {
        $keyTopics = array_slice($topics, 0, 8);
        $features['核心标签'] = implode('、', $keyTopics);
    }

    return $features;
}

function buildUseCases(string $category, array $topics, string $desc): array {
    $cases = [];
    $topicStr = strtolower(implode(' ', $topics) . ' ' . $desc);

    $rules = [
        'API 接口调用' => ['api', 'endpoint', 'rest', 'graphql', 'sdk'],
        '命令行工具' => ['cli', 'command-line', 'terminal', 'shell'],
        '聊天/对话' => ['chat', 'chatbot', 'conversation', 'dialog'],
        '逆向工程' => ['reverse', 'reverse-engineering', 'proxy', 'mirror'],
        '本地部署' => ['local', 'self-hosted', 'on-premise', 'deploy'],
        '模型微调' => ['fine-tune', 'fine-tuning', 'training', 'lora'],
        '提示词管理' => ['prompt', 'prompt-engineering'],
        '游戏开发' => ['game', 'unity', 'unreal', 'astra game'],
        '视觉/图像处理' => ['vision', 'image', 'ocr', 'dalle', 'midjourney'],
        'RAG/知识库' => ['rag', 'knowledge', 'embedding', 'vector'],
        'MCP 协议' => ['mcp', 'model-context-protocol'],
        'VSCode 插件' => ['vscode', 'extension', 'plugin'],
        '自动化/Agent' => ['agent', 'automation', 'workflow', 'agentic'],
    ];

    foreach ($rules as $label => $keywords) {
        foreach ($keywords as $kw) {
            if (strpos($topicStr, $kw) !== false) {
                $cases[] = $label;
                break;
            }
        }
    }

    if (empty($cases)) {
        $cases[] = '通用 GPT-6/Astra 生态相关开发';
    }

    return $cases;
}

function buildPopularity(int $stars): string {
    if ($stars >= 10000) {
        return "🔥 超高热度（{$stars} Star），社区广泛关注和使用的明星项目";
    } elseif ($stars >= 3000) {
        return "⭐ 高热度（{$stars} Star），有活跃社区和较多贡献者";
    } elseif ($stars >= 500) {
        return "👍 中等热度（{$stars} Star），项目有一定影响力和使用群体";
    } elseif ($stars >= 100) {
        return "📈 崛起中（{$stars} Star），值得关注的新兴项目";
    } else {
        return "🌱 早期阶段（{$stars} Star），仍在发展初期，潜力待发掘";
    }
}
