<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;

final class AccessControl
{
    public static function isAdmin(array $user): bool
    {
        return ($user['role'] ?? 'doctor') === 'admin';
    }

    public static function ensureAdmin(array $user): void
    {
        if (!self::isAdmin($user)) {
            throw new HttpException('Acces reserve aux administrateurs.', 403);
        }
    }

    public static function patientFilters(array $user, array $filters = []): array
    {
        if (self::isAdmin($user)) {
            return $filters;
        }

        $filters['department'] = $user['specialty'] ?? '';
        return $filters;
    }

    public static function appointmentFilters(array $user, array $filters = []): array
    {
        if (self::isAdmin($user)) {
            return $filters;
        }

        $filters['doctor_id'] = $user['doctorId'] ?? 0;
        return $filters;
    }

    public static function canAccessPatient(array $user, array $patient): bool
    {
        return self::isAdmin($user) || (($patient['department'] ?? '') === ($user['specialty'] ?? ''));
    }

    public static function canAccessDoctor(array $user, array $doctor): bool
    {
        return self::isAdmin($user) || (isset($doctor['id']) && (int) $doctor['id'] === (int) ($user['doctorId'] ?? 0));
    }

    public static function canAccessAppointment(array $user, array $appointment): bool
    {
        return self::isAdmin($user) || (isset($appointment['doctor_id']) && (int) $appointment['doctor_id'] === (int) ($user['doctorId'] ?? 0));
    }
}
