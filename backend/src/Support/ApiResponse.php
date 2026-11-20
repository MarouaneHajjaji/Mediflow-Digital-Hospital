<?php

declare(strict_types=1);

namespace App\Support;

use App\Core\Response;

final class ApiResponse
{
    public static function success(array $data = [], string $message = 'Request processed successfully.', int $status = 200): never
    {
        Response::json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }
}
