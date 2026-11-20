<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Services\DashboardService;

final class DashboardController
{
    public function __construct(
        private readonly DashboardService $dashboard = new DashboardService()
    ) {
    }

    public function summary(Request $request): array
    {
        return ['summary' => $this->dashboard->summary($request->user())];
    }
}
