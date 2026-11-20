<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Validator;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(
        private readonly AuthService $auth = new AuthService()
    ) {
    }

    public function login(Request $request): array
    {
        $payload = $request->all();
        Validator::validate($payload, [
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        return $this->auth->login((string) $payload['email'], (string) $payload['password']);
    }

    public function me(Request $request): array
    {
        return [
            'user' => $request->user(),
        ];
    }
}
