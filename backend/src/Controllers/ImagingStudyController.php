<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Validator;
use App\Repositories\ImagingStudyRepository;
use App\Repositories\PatientRepository;
use App\Services\AccessControl;

final class ImagingStudyController
{
    public function __construct(
        private readonly ImagingStudyRepository $studies = new ImagingStudyRepository(),
        private readonly PatientRepository $patients = new PatientRepository()
    ) {
    }

    public function index(Request $request): array
    {
        $filters = AccessControl::patientFilters($request->user(), [
            'archived' => $request->query('archived'),
        ]);

        return [
            'items' => array_map([$this, 'transform'], $this->studies->all($filters)),
        ];
    }

    public function store(Request $request): array
    {
        $payload = $this->validatedPayload($request->all());
        $patient = $this->patients->find((int) $payload['patient_id']);
        if (!$patient) {
            throw new HttpException('Patient not found.', 404);
        }
        if (!AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        $id = $this->studies->create($payload);

        return [
            'item' => $this->transform($this->studies->find($id) ?: []),
        ];
    }

    public function update(Request $request, string $id): array
    {
        $study = $this->studies->find((int) $id);
        if (!$study) {
            throw new HttpException('Imaging study not found.', 404);
        }
        if (!$this->canAccessStudy($request, $study)) {
            throw new HttpException('Acces interdit a cet examen.', 403);
        }

        $payload = $this->validatedPayload(array_merge($study, $request->all()));
        $patient = $this->patients->find((int) $payload['patient_id']);
        if (!$patient || !AccessControl::canAccessPatient($request->user(), $patient)) {
            throw new HttpException('Acces interdit a ce patient.', 403);
        }

        $this->studies->update((int) $id, $payload);

        return [
            'item' => $this->transform($this->studies->find((int) $id) ?: []),
        ];
    }

    public function destroy(Request $request, string $id): array
    {
        $study = $this->studies->find((int) $id);
        if (!$study) {
            throw new HttpException('Imaging study not found.', 404);
        }
        if (!$this->canAccessStudy($request, $study)) {
            throw new HttpException('Acces interdit a cet examen.', 403);
        }

        $this->studies->delete((int) $id);

        return ['deleted' => true];
    }

    public function archive(Request $request, string $id): array
    {
        $study = $this->studies->find((int) $id);
        if (!$study) {
            throw new HttpException('Imaging study not found.', 404);
        }
        if (!$this->canAccessStudy($request, $study)) {
            throw new HttpException('Acces interdit a cet examen.', 403);
        }

        $this->studies->toggleArchive((int) $id);

        return [
            'item' => $this->transform($this->studies->find((int) $id) ?: []),
        ];
    }

    private function validatedPayload(array $data): array
    {
        Validator::validate($data, [
            'patient_id' => 'required|integer',
            'exam_type' => 'required|string',
            'exam_date' => 'required|date',
            'doctor' => 'required|string',
            'status' => 'required|in:Available,Processing',
        ]);

        return array_merge([
            'progress' => 100,
            'image_data_url' => null,
            'report' => null,
            'is_archived' => 0,
        ], $data);
    }

    private function canAccessStudy(Request $request, array $study): bool
    {
        return AccessControl::isAdmin($request->user())
            || (($study['patient_department'] ?? '') === ($request->user()['specialty'] ?? ''));
    }

    private function transform(array $study): array
    {
        return [
            'id' => (int) $study['id'],
            'patientId' => (int) $study['patient_id'],
            'patient' => $study['patient_name'],
            'type' => $study['exam_type'],
            'date' => $study['exam_date'],
            'doctor' => $study['doctor'],
            'status' => $study['status'],
            'progress' => (int) $study['progress'],
            'imageUrl' => $study['image_data_url'] ?? null,
            'report' => $study['report'] ?? null,
            'isArchived' => (bool) $study['is_archived'],
        ];
    }
}
