<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\HttpException;
use App\Core\Request;
use App\Repositories\AuthUserRepository;

final class AuthService
{
    private const TOKEN_TTL = 28800;
    private const SCAN_TOKEN_TTL = 900;
    private const HASH_ITERATIONS = 120000;
    private const HASH_LENGTH = 32;
    private const HASH_ALGO = 'sha256';

    public function __construct(
        private readonly AuthUserRepository $users = new AuthUserRepository()
    ) {
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);
        if (!$user || !$this->verifyPassword($password, $user)) {
            throw new HttpException('Email ou mot de passe incorrect.', 401);
        }

        return [
            'token' => $this->issueToken($user, 'api', self::TOKEN_TTL),
            'user' => $this->buildSessionUser($user),
        ];
    }

    public function authenticateRequest(Request $request): array
    {
        $token = $request->bearerToken();
        if ($token === null) {
            throw new HttpException('Authentification requise.', 401);
        }

        $payload = $this->decodeToken($token);
        $user = $this->users->findById((int) ($payload['sub'] ?? 0));
        if (!$user) {
            throw new HttpException('Session invalide.', 401);
        }

        $sessionUser = $this->buildSessionUser($user);
        $sessionUser['scope'] = $payload['scope'] ?? 'api';
        $sessionUser['exp'] = (int) ($payload['exp'] ?? 0);

        return $sessionUser;
    }

    public function ensureScope(array $user, string $path): void
    {
        $scope = $user['scope'] ?? 'api';
        if ($scope !== 'scan') {
            return;
        }

        $allowedPrefixes = [
            '/api/archive/patients',
            '/api/archive/upload',
            '/api/archive/server-info',
        ];

        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return;
            }
        }

        throw new HttpException('Ce token de scan ne permet pas d acceder a cette ressource.', 403);
    }

    public function issueScanToken(array $user): string
    {
        return $this->issueToken($user, 'scan', self::SCAN_TOKEN_TTL);
    }

    private function verifyPassword(string $password, array $user): bool
    {
        $salt = (string) ($user['password_salt'] ?? '');
        $storedHash = (string) ($user['password_hash'] ?? '');

        if ($salt === '' || $storedHash === '') {
            return false;
        }

        $computedHash = hash_pbkdf2(
            self::HASH_ALGO,
            $password,
            $salt,
            self::HASH_ITERATIONS,
            self::HASH_LENGTH * 2
        );

        return hash_equals($storedHash, $computedHash);
    }

    private function buildSessionUser(array $user): array
    {
        $role = (string) ($user['role'] ?? 'doctor');
        $doctorId = isset($user['doctor_id']) ? (int) $user['doctor_id'] : null;
        $doctorName = $user['doctor_name'] ?? null;

        return [
            'id' => (int) $user['id'],
            'email' => (string) $user['email'],
            'role' => $role,
            'doctorId' => $doctorId,
            'name' => $role === 'admin'
                ? ((string) ($user['display_name'] ?? 'Administrateur MediFlow'))
                : (string) ($doctorName ?? $user['display_name'] ?? 'Medecin'),
            'specialty' => $role === 'admin'
                ? 'Administration'
                : (string) ($user['doctor_specialty'] ?? ''),
        ];
    }

    private function issueToken(array $user, string $scope, int $ttl): string
    {
        $now = time();
        $payload = [
            'sub' => (int) $user['id'],
            'scope' => $scope,
            'iat' => $now,
            'exp' => $now + $ttl,
        ];

        return $this->encodeToken($payload);
    }

    private function encodeToken(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES) ?: '{}'),
            $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES) ?: '{}'),
        ];
        $signature = hash_hmac('sha256', implode('.', $segments), $this->signingKey(), true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    private function decodeToken(string $token): array
    {
        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            throw new HttpException('Token invalide.', 401);
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->signingKey(), true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            throw new HttpException('Signature de session invalide.', 401);
        }

        $payload = json_decode($this->base64UrlDecode($encodedPayload), true);
        if (!is_array($payload)) {
            throw new HttpException('Payload de session invalide.', 401);
        }

        $expiresAt = (int) ($payload['exp'] ?? 0);
        if ($expiresAt <= time()) {
            throw new HttpException('Session expiree.', 401);
        }

        return $payload;
    }

    private function signingKey(): string
    {
        $key = (string) Config::get('app.key', '');
        if ($key === '') {
            throw new HttpException('APP_KEY manquante sur le serveur.', 500);
        }

        return $key;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        if ($decoded === false) {
            throw new HttpException('Token invalide.', 401);
        }

        return $decoded;
    }
}
