<?php
// api/index.php — 统一路由入口
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=300');

$action = $_GET['action'] ?? 'stats';
$allowed = ['repos', 'news', 'stats', 'insight'];
if (!in_array($action, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid action']);
    exit;
}
require __DIR__ . "/$action.php";
