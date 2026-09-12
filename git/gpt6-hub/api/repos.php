<?php
// api/repos.php — 仓库列表，支持类目筛选
$dataFile = __DIR__ . '/../data/repos.json';
if (!file_exists($dataFile)) {
    http_response_code(503);
    echo json_encode(['error' => 'data not ready']);
    exit;
}
$all = json_decode(file_get_contents($dataFile), true);
$category = $_GET['category'] ?? null;
if ($category && $category !== 'all') {
    $all = array_filter($all, fn($r) => ($r['category'] ?? '') === $category);
}
usort($all, fn($a, $b) => ($b['stars'] ?? 0) <=> ($a['stars'] ?? 0));
echo json_encode(['count' => count($all), 'repos' => array_values($all)],
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
