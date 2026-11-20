<?php

declare(strict_types=1);

namespace App\Core;

use App\Support\ApiResponse;
use App\Services\AuthService;

final class App
{
    public function run(): void
    {
        $request = new Request();
        $router = require BASE_PATH . '/src/routes/api.php';

        $this->handleCors($request);

        if ($request->method() === 'OPTIONS') {
            Response::noContent();
        }

        $this->authenticate($request);

        $result = $router->dispatch($request);

        if (is_array($result)) {
            ApiResponse::success($result);
        }

        Response::noContent();
    }

    private function authenticate(Request $request): void
    {
        if ($this->isPublicPath($request->path())) {
            return;
        }

        $auth = new AuthService();
        $user = $auth->authenticateRequest($request);
        $auth->ensureScope($user, $request->path());
        $request->setUser($user);
    }

    private function isPublicPath(string $path): bool
    {
        return in_array($path, [
            '/api/health',
            '/api/auth/login',
        ], true);
    }

    private function handleCors(Request $request): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = Config::get('app.cors_allowed_origins', ['*']);
        $allowOrigin = in_array('*', $allowedOrigins, true) || in_array($origin, $allowedOrigins, true) ? $origin : $allowedOrigins[0];

        header('Access-Control-Allow-Origin: ' . $allowOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    }
}
