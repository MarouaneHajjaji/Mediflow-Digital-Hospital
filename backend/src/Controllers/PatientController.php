<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Validator;
use App\Repositories\PatientRepository;
use App\Services\AccessControl;

final class PatientController
{
    public function __construct(
        private readonly PatientRepository $patients = new PatientRepository()
    ) {
    }

    public function index(Request $request): array
    {
        $items = $this->patients->all(AccessControl::patientFilters($request->user(), [
            'search' => $request->query('search'),
            'status' => $request->query('status'),
            'archived' => $request->query('archived', 0),
        ]));

        return ['items' => array_map([$this, 'transform'], $items)];
    }

    public function show(Request $request, string $id): array
    {
        $patient = $this->patients->find((int) $id);

        if (!$patient) {
            throw new HttpException('Patient not found.', 404);
        }
        if (!AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        return ['item' => $this->transform($patient)];
    }

    public function store(Request $request): array
    {
        $payload = $this->validatedPayload($request->all(), false);
        if (!AccessControl::isAdmin($request->user())) {
            $payload['department'] = $request->user()['specialty'] ?? $payload['department'] ?? null;
        }
        $id = $this->patients->create($payload);

        return [
            'item' => $this->transform($this->patients->find($id) ?: []),
        ];
    }

    public function update(Request $request, string $id): array
    {
        $patient = $this->patients->find((int) $id);
        if (!$patient) {
            throw new HttpException('Patient not found.', 404);
        }
        if (!AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        $payload = $this->validatedPayload(array_merge($patient, $request->all()), true);
        if (!AccessControl::isAdmin($request->user())) {
            $payload['department'] = $request->user()['specialty'] ?? $payload['department'] ?? null;
            $payload['is_archived'] = $patient['is_archived'] ?? 0;
        }
        $this->patients->update((int) $id, $payload);

        return [
            'item' => $this->transform($this->patients->find((int) $id) ?: []),
        ];
    }

    public function destroy(Request $request, string $id): array
    {
        AccessControl::ensureAdmin($request->user());

        if (!$this->patients->find((int) $id)) {
            throw new HttpException('Patient not found.', 404);
        }

        $deleted = $this->patients->delete((int) $id);
        if (!$deleted) {
            throw new HttpException('Patient could not be deleted. Remove related records first.', 409);
        }

        return ['deleted' => true];
    }

    public function archive(Request $request, string $id): array
    {
        if (!$this->patients->find((int) $id)) {
            throw new HttpException('Patient not found.', 404);
        }
        $patient = $this->patients->find((int) $id);
        if (!$patient || !AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        $this->patients->archive((int) $id);

        return [
            'item' => $this->transform($this->patients->find((int) $id) ?: []),
        ];
    }

    private function validatedPayload(array $data, bool $isUpdate): array
    {
        Validator::validate($data, [
            'patient_code' => ($isUpdate ? '' : 'required|') . 'string',
            'name' => 'required|string',
            'age' => 'required|integer',
            'gender' => 'required|in:M,F',
            'blood_type' => 'required|string',
            'last_visit' => 'required|date',
            'status' => 'required|in:Stable,Critical,Recovering',
        ]);

        return array_merge([
            'room' => null,
            'entry_date' => null,
            'exit_date' => null,
            'birth_date' => null,
            'phone' => null,
            'email' => null,
            'address' => null,
            'status_description' => null,
            'medical_history' => null,
            'department' => null,
            'medication' => null,
            'dosage' => null,
            'frequency' => null,
            'is_archived' => 0,
        ], $data);
    }

    private function transform(array $patient): array
    {
        return [
            'id' => (int) ($patient['id'] ?? 0),
            'patientCode' => $patient['patient_code'] ?? null,
            'name' => $patient['name'] ?? $patient['NAME'] ?? null,
            'age' => isset($patient['age']) ? (int) $patient['age'] : null,
            'gender' => $patient['gender'] ?? null,
            'bloodType' => $patient['blood_type'] ?? null,
            'lastVisit' => $patient['last_visit'] ?? null,
            'status' => $patient['status'] ?? $patient['STATUS'] ?? null,
            'room' => $patient['room'] ?? null,
            'entryDate' => $patient['entry_date'] ?? null,
            'exitDate' => $patient['exit_date'] ?? null,
            'birthDate' => $patient['birth_date'] ?? null,
            'phone' => $patient['phone'] ?? null,
            'email' => $patient['email'] ?? null,
            'address' => $patient['address'] ?? null,
            'statusDescription' => $patient['status_description'] ?? null,
            'medicalHistory' => $patient['medical_history'] ?? null,
            'department' => $patient['department'] ?? null,
            'medication' => $patient['medication'] ?? null,
            'dosage' => $patient['dosage'] ?? null,
            'frequency' => $patient['frequency'] ?? null,
            'isArchived' => isset($patient['is_archived']) ? (bool) $patient['is_archived'] : false,
            'createdAt' => $patient['created_at'] ?? null,
            'updatedAt' => $patient['updated_at'] ?? null,
        ];
    }
}
