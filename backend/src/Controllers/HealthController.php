<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Database;
use App\Core\Request;

final class HealthController
{
    public function index(Request $request): array
    {
        $dbStatus = 'disconnected';
        
        try {
            Database::connection()->query('SELECT 1');
            $dbStatus = 'connected';
        } catch (\Exception $e) {
            // Database not available, but health check still passes
            error_log('Database check failed: ' . $e->getMessage());
        }

        return [
            'status' => 'ok',
            'service' => 'mediflow-backend',
            'database' => $dbStatus,
            'timestamp' => date(DATE_ATOM),
        ];
    }
}
