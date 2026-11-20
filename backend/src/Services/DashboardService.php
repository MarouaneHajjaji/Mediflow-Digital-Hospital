<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Repositories\AppointmentRepository;
use App\Repositories\PatientRepository;

final class DashboardService
{
    public function __construct(
        private readonly PatientRepository $patients = new PatientRepository(),
        private readonly AppointmentRepository $appointments = new AppointmentRepository()
    ) {
    }

    public function summary(array $user): array
    {
        if (AccessControl::isAdmin($user)) {
            $revenue = Database::connection()->query(
                "SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('Paid', 'Pending')"
            )->fetchColumn();

            return [
                'patients_total' => $this->patients->countAll(),
                'critical_patients' => $this->patients->countCritical(),
                'appointments_today' => $this->appointments->countToday(),
                'revenue_total' => (float) $revenue,
            ];
        }

        $specialty = (string) ($user['specialty'] ?? '');
        $doctorId = (int) ($user['doctorId'] ?? 0);

        $patientsCountStatement = Database::connection()->prepare(
            'SELECT COUNT(*) FROM patients WHERE department = :department AND is_archived = 0'
        );
        $patientsCountStatement->execute(['department' => $specialty]);

        $criticalStatement = Database::connection()->prepare(
            'SELECT COUNT(*) FROM patients WHERE department = :department AND status = :status AND is_archived = 0'
        );
        $criticalStatement->execute([
            'department' => $specialty,
            'status' => 'Critical',
        ]);

        $appointmentsStatement = Database::connection()->prepare(
            'SELECT COUNT(*) FROM appointments WHERE doctor_id = :doctor_id AND appointment_date = CURRENT_DATE'
        );
        $appointmentsStatement->execute(['doctor_id' => $doctorId]);

        $revenueStatement = Database::connection()->prepare(
            "SELECT COALESCE(SUM(i.amount), 0)
             FROM invoices i
             INNER JOIN patients p ON p.id = i.patient_id
             WHERE p.department = :department AND i.status IN ('Paid', 'Pending')"
        );
        $revenueStatement->execute(['department' => $specialty]);

        return [
            'patients_total' => (int) $patientsCountStatement->fetchColumn(),
            'critical_patients' => (int) $criticalStatement->fetchColumn(),
            'appointments_today' => (int) $appointmentsStatement->fetchColumn(),
            'revenue_total' => (float) $revenueStatement->fetchColumn(),
        ];
    }
}
