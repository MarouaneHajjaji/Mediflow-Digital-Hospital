<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Validator;
use App\Repositories\DoctorRepository;
use App\Services\AccessControl;

final class DoctorController
{
    public function __construct(
        private readonly DoctorRepository $doctors = new DoctorRepository()
    ) {
    }

    public function index(Request $request): array
    {
        $items = $this->doctors->all();
        if (!AccessControl::isAdmin($request->user())) {
            $items = array_values(array_filter(
                $items,
                fn (array $doctor): bool => AccessControl::canAccessDoctor($request->user(), $doctor)
            ));
        }

        return [
            'items' => array_map([$this, 'transform'], $items),
        ];
    }

    public function store(Request $request): array
    {
        AccessControl::ensureAdmin($request->user());

        $payload = $this->validatedPayload($request->all());
        $id = $this->doctors->create($payload);

        return [
            'item' => $this->transform($this->doctors->find($id) ?: []),
        ];
    }

    public function update(Request $request, string $id): array
    {
        AccessControl::ensureAdmin($request->user());

        $doctor = $this->doctors->find((int) $id);
        if (!$doctor) {
            throw new HttpException('Doctor not found.', 404);
        }

        $payload = $this->validatedPayload(array_merge($doctor, $request->all()));
        $this->doctors->update((int) $id, $payload);

        return [
            'item' => $this->transform($this->doctors->find((int) $id) ?: []),
        ];
    }

    public function destroy(Request $request, string $id): array
    {
        AccessControl::ensureAdmin($request->user());

        if (!$this->doctors->find((int) $id)) {
            throw new HttpException('Doctor not found.', 404);
        }

        $this->doctors->delete((int) $id);

        return ['deleted' => true];
    }

    private function validatedPayload(array $data): array
    {
        Validator::validate($data, [
            'name' => 'required|string',
            'specialty' => 'required|string',
            'age' => 'required|integer',
        ]);

        return array_merge([
            'profile_picture' => $data['profilePic'] ?? $data['profile_picture'] ?? null,
            'email' => $data['email'] ?? null,
            'department' => $data['department'] ?? null,
            'availability' => $data['availability'] ?? null,
        ], $data);
    }

    private function transform(array $doctor): array
    {
        return [
            'id' => isset($doctor['id']) ? (int) $doctor['id'] : 0,
            'name' => $doctor['name'] ?? $doctor['NAME'] ?? null,
            'specialty' => $doctor['specialty'] ?? null,
            'age' => isset($doctor['age']) ? (int) $doctor['age'] : null,
            'profilePic' => $doctor['profile_picture'] ?? null,
            'email' => $doctor['email'] ?? null,
            'department' => $doctor['department'] ?? null,
            'availability' => $doctor['availability'] ?? null,
        ];
    }
}
