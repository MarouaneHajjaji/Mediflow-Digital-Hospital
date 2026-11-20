<?php

declare(strict_types=1);

namespace App\Core;

final class Config
{
    public static function get(string $key, mixed $default = null): mixed
    {
        $config = [
            'app' => [
                'env' => Env::get('APP_ENV', 'production'),
                'debug' => filter_var(Env::get('APP_DEBUG', false), FILTER_VALIDATE_BOOL),
                'key' => Env::get('APP_KEY', ''),
                'url' => Env::get('APP_URL', 'http://localhost:8000'),
                'public_host' => Env::get('APP_PUBLIC_HOST', ''),
                'public_port' => Env::get('APP_PUBLIC_PORT', ''),
                'timezone' => Env::get('APP_TIMEZONE', 'UTC'),
                'cors_allowed_origins' => array_filter(array_map('trim', explode(',', (string) Env::get('CORS_ALLOWED_ORIGINS', '*')))),
            ],
            'database' => [
                'host' => Env::get('DB_HOST', '127.0.0.1'),
                'port' => (int) Env::get('DB_PORT', 3306),
                'name' => Env::get('DB_NAME', 'mediflow_hospital'),
                'user' => Env::get('DB_USER', 'root'),
                'pass' => Env::get('DB_PASS', ''),
                'charset' => 'utf8mb4',
            ],
        ];

        $segments = explode('.', $key);
        $value = $config;

        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }

            $value = $value[$segment];
        }

        return $value;
    }
}
