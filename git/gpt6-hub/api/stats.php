<?php
// api/stats.php — 站点统计
$dataFile = __DIR__ . '/../data/stats.json';
if (!file_exists($dataFile)) {
    http_response_code(503);
    echo json_encode(['error' => 'stats not ready']);
    exit;
}
echo file_get_contents($dataFile);
