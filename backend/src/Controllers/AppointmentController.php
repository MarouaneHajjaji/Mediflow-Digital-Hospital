<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Validator;
use App\Repositories\AppointmentRepository;
use App\Services\AccessControl;

final class AppointmentController
{
    public function __construct(
        private readonly AppointmentRepository $appointments = new AppointmentRepository()
    ) {
    }

    public function index(Request $request): array
    {
        return [
            'items' => array_map([$this, 'transform'], $this->appointments->all(AccessControl::appointmentFilters($request->user(), [
                'status' => $request->query('status'),
                'date' => $request->query('date'),
            ]))),
        ];
    }

    public function store(Request $request): array
    {
        $payload = $this->validatedPayload($request->all());
        if (!AccessControl::isAdmin($request->user())) {
            $payload['doctor_id'] = (int) ($request->user()['doctorId'] ?? 0);
        }
        $id = $this->appointments->create($payload);

        return [
            'item' => $this->transform($this->appointments->findDetailed($id) ?: []),
        ];
    }

    public function update(Request $request, string $id): array
    {
        $appointment = $this->appointments->find((int) $id);
        if (!$appointment) {
            throw new HttpException('Appointment not found.', 404);
        }
        if (!AccessControl::canAccessAppointment($request->user(), $appointment)) {
            throw new HttpException('Acces interdit a ce rendez-vous.', 403);
        }

        $payload = $this->validatedPayload(array_merge($appointment, $request->all()));
        if (!AccessControl::isAdmin($request->user())) {
            $payload['doctor_id'] = (int) ($request->user()['doctorId'] ?? 0);
        }
        $this->appointments->update((int) $id, $payload);

        return [
            'item' => $this->transform($this->appointments->findDetailed((int) $id) ?: []),
        ];
    }

    public function destroy(Request $request, string $id): array
    {
        if (!$this->appointments->find((int) $id)) {
            throw new HttpException('Appointment not found.', 404);
        }
        $appointment = $this->appointments->find((int) $id);
        if (!$appointment || !AccessControl::canAccessAppointment($request->user(), $appointment)) {
            throw new HttpException('Acces interdit a ce rendez-vous.', 403);
        }

        $this->appointments->delete((int) $id);

        return ['deleted' => true];
    }

    private function validatedPayload(array $data): array
    {
        Validator::validate($data, [
            'patient_id' => 'required|integer',
            'doctor_id' => 'required|integer',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'type' => 'required|string',
            'status' => 'required|in:Scheduled,Completed,Cancelled',
        ]);

        return array_merge([
            'reminder_sent' => 0,
            'notes' => null,
        ], $data);
    }

    private function transform(array $appointment): array
    {
        return [
            'id' => (int) $appointment['id'],
            'patientId' => (int) $appointment['patient_id'],
            'patientName' => $appointment['patient_name'],
            'patientCode' => $appointment['patient_code'],
            'doctorId' => (int) $appointment['doctor_id'],
            'doctorName' => $appointment['doctor_name'],
            'date' => $appointment['appointment_date'],
            'time' => substr((string) $appointment['appointment_time'], 0, 5),
            'type' => $appointment['type'] ?? $appointment['TYPE'] ?? null,
            'status' => $appointment['status'] ?? $appointment['STATUS'] ?? null,
            'reminderSent' => (bool) $appointment['reminder_sent'],
            'notes' => $appointment['notes'],
        ];
    }
}
