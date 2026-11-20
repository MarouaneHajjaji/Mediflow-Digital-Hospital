<?php

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

if ($basePath && $basePath !== '.' && str_starts_with($path, $basePath)) {
    $path = substr($path, strlen($basePath)) ?: '/';
}

if ($path === '/scan') {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/scan.html');
    exit;
}

require_once __DIR__ . '/../src/bootstrap.php';

use App\Core\App;

$app = new App();
$app->run();
