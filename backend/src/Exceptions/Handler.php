<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Core\Config;
use App\Core\HttpException;
use App\Core\Response;
use Throwable;

final class Handler
{
    public static function register(): void
    {
        set_exception_handler([self::class, 'handle']);
    }

    public static function handle(Throwable $throwable): never
    {
        $status = $throwable instanceof HttpException ? $throwable->getStatusCode() : 500;
        $errors = $throwable instanceof HttpException ? $throwable->getErrors() : [];

        $payload = [
            'success' => false,
            'message' => $throwable->getMessage(),
            'errors' => $errors,
        ];

        if (Config::get('app.debug', false) && !($throwable instanceof HttpException)) {
            $payload['debug'] = [
                'type' => $throwable::class,
                'file' => $throwable->getFile(),
                'line' => $throwable->getLine(),
            ];
        }

        Response::json($payload, $status);
    }
}
