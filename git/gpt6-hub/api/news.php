<?php
// api/news.php — GPT-6 消息流
$dataFile = __DIR__ . '/../data/news.json';
if (!file_exists($dataFile)) {
    http_response_code(503);
    echo json_encode(['error' => 'news not ready']);
    exit;
}
echo file_get_contents($dataFile);
