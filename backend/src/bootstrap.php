<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/src/Support/helpers.php';
require_once BASE_PATH . '/src/Core/Env.php';
require_once BASE_PATH . '/src/Core/Config.php';
require_once BASE_PATH . '/src/Core/Database.php';
require_once BASE_PATH . '/src/Core/Request.php';
require_once BASE_PATH . '/src/Core/Response.php';
require_once BASE_PATH . '/src/Core/Router.php';
require_once BASE_PATH . '/src/Core/App.php';
require_once BASE_PATH . '/src/Core/HttpException.php';
require_once BASE_PATH . '/src/Core/Validator.php';
require_once BASE_PATH . '/src/Exceptions/Handler.php';
require_once BASE_PATH . '/src/Support/ApiResponse.php';
require_once BASE_PATH . '/src/Repositories/BaseRepository.php';
require_once BASE_PATH . '/src/Repositories/PatientRepository.php';
require_once BASE_PATH . '/src/Repositories/DoctorRepository.php';
require_once BASE_PATH . '/src/Repositories/AppointmentRepository.php';
require_once BASE_PATH . '/src/Repositories/ImagingStudyRepository.php';
require_once BASE_PATH . '/src/Services/DashboardService.php';
require_once BASE_PATH . '/src/Controllers/HealthController.php';
require_once BASE_PATH . '/src/Controllers/PatientController.php';
require_once BASE_PATH . '/src/Controllers/DoctorController.php';
require_once BASE_PATH . '/src/Controllers/AppointmentController.php';
require_once BASE_PATH . '/src/Controllers/ImagingStudyController.php';
require_once BASE_PATH . '/src/Controllers/ArchiveController.php';
require_once BASE_PATH . '/src/Controllers/DashboardController.php';

App\Core\Env::load(BASE_PATH . '/.env');
date_default_timezone_set(App\Core\Config::get('app.timezone', 'UTC'));
App\Exceptions\Handler::register();
