<?php

declare(strict_types=1);

use App\Controllers\AppointmentController;
use App\Controllers\ArchiveController;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\DoctorController;
use App\Controllers\HealthController;
use App\Controllers\ImagingStudyController;
use App\Controllers\PatientController;
use App\Core\Router;

$router = new Router();

$router->get('/api/health', [HealthController::class, 'index']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me']);
$router->get('/api/dashboard/summary', [DashboardController::class, 'summary']);

$router->get('/api/patients', [PatientController::class, 'index']);
$router->get('/api/patients/{id}', [PatientController::class, 'show']);
$router->post('/api/patients', [PatientController::class, 'store']);
$router->put('/api/patients/{id}', [PatientController::class, 'update']);
$router->delete('/api/patients/{id}', [PatientController::class, 'destroy']);
$router->post('/api/patients/{id}/delete', [PatientController::class, 'destroy']);
$router->post('/api/patients/{id}/archive', [PatientController::class, 'archive']);

$router->get('/api/doctors', [DoctorController::class, 'index']);
$router->post('/api/doctors', [DoctorController::class, 'store']);
$router->put('/api/doctors/{id}', [DoctorController::class, 'update']);
$router->delete('/api/doctors/{id}', [DoctorController::class, 'destroy']);
$router->get('/api/appointments', [AppointmentController::class, 'index']);
$router->post('/api/appointments', [AppointmentController::class, 'store']);
$router->put('/api/appointments/{id}', [AppointmentController::class, 'update']);
$router->delete('/api/appointments/{id}', [AppointmentController::class, 'destroy']);

$router->get('/api/imaging-studies', [ImagingStudyController::class, 'index']);
$router->post('/api/imaging-studies', [ImagingStudyController::class, 'store']);
$router->put('/api/imaging-studies/{id}', [ImagingStudyController::class, 'update']);
$router->delete('/api/imaging-studies/{id}', [ImagingStudyController::class, 'destroy']);
$router->post('/api/imaging-studies/{id}/delete', [ImagingStudyController::class, 'destroy']);
$router->post('/api/imaging-studies/{id}/archive', [ImagingStudyController::class, 'archive']);

$router->get('/api/archive/server-info', [ArchiveController::class, 'serverInfo']);
$router->get('/api/archive/documents', [ArchiveController::class, 'index']);
$router->post('/api/archive/analyze', [ArchiveController::class, 'analyze']);
$router->get('/api/archive/documents/{id}/image', [ArchiveController::class, 'exportDocumentImage']);
$router->delete('/api/archive/documents/{id}', [ArchiveController::class, 'destroyDocument']);
$router->post('/api/archive/documents/{id}/delete', [ArchiveController::class, 'destroyDocument']);
$router->get('/api/archive/patients', [ArchiveController::class, 'patients']);
$router->post('/api/archive/upload', [ArchiveController::class, 'upload']);

return $router;
