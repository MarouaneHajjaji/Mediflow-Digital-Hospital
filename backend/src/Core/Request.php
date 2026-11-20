<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    private ?array $user = null;

    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $basePath = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

        if ($basePath && $basePath !== '.' && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath)) ?: '/';
        }

        return rtrim($path, '/') ?: '/';
    }

    public function query(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $_GET;
        }

        return $_GET[$key] ?? $default;
    }

    public function input(string $key = null, mixed $default = null): mixed
    {
        $payload = $this->all();

        if ($key === null) {
            return $payload;
        }

        return $payload[$key] ?? $default;
    }

    public function header(string $name, mixed $default = null): mixed
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$serverKey])) {
            return $_SERVER[$serverKey];
        }

        $redirectKey = 'REDIRECT_' . $serverKey;
        if (isset($_SERVER[$redirectKey])) {
            return $_SERVER[$redirectKey];
        }

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $headerName => $value) {
                if (strcasecmp($headerName, $name) === 0) {
                    return $value;
                }
            }
        }

        return $default;
    }

    public function bearerToken(): ?string
    {
        $header = (string) $this->header('Authorization', '');
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return trim($matches[1]);
        }

        $queryToken = $this->query('token');
        if (is_string($queryToken) && trim($queryToken) !== '') {
            return trim($queryToken);
        }

        return null;
    }

    public function setUser(array $user): void
    {
        $this->user = $user;
    }

    public function user(): array
    {
        return $this->user ?? [];
    }

    public function all(): array
    {
        static $data;

        if ($data !== null) {
            return $data;
        }

        $rawBody = file_get_contents('php://input') ?: '';
        $decoded = json_decode($rawBody, true);

        $data = is_array($decoded) ? $decoded : $_POST;

        return $data;
    }
}
