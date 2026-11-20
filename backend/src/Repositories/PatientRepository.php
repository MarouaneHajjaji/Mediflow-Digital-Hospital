<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use PDOException;

final class PatientRepository extends BaseRepository
{
    public function all(array $filters = []): array
    {
        $sql = 'SELECT * FROM patients';
        $conditions = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $conditions[] = '(name LIKE :search OR patient_code LIKE :search)';
            $bindings['search'] = '%' . $filters['search'] . '%';
        }

        if (array_key_exists('archived', $filters) && $filters['archived'] !== null) {
            $conditions[] = 'is_archived = :archived';
            $bindings['archived'] = (int) $filters['archived'];
        }

        if (!empty($filters['status'])) {
            $conditions[] = 'status = :status';
            $bindings['status'] = $filters['status'];
        }

        if (!empty($filters['department'])) {
            $conditions[] = 'department = :department';
            $bindings['department'] = $filters['department'];
        }

        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY created_at DESC';

        $statement = $this->db->prepare($sql);
        $statement->execute($bindings);

        return $statement->fetchAll();
    }

    public function allForArchive(array $filters = []): array
    {
        $sql = "SELECT
                    p.*,
                    (
                        SELECT d.name
                        FROM appointments a
                        INNER JOIN doctors d ON d.id = a.doctor_id
                        WHERE a.patient_id = p.id
                        ORDER BY a.appointment_date DESC, a.appointment_time DESC
                        LIMIT 1
                    ) AS treating_doctor
                FROM patients p";
        $conditions = [];
        $bindings = [];

        if (array_key_exists('archived', $filters) && $filters['archived'] !== null) {
            $conditions[] = 'p.is_archived = :archived';
            $bindings['archived'] = (int) $filters['archived'];
        }

        if (!empty($filters['department'])) {
            $conditions[] = 'p.department = :department';
            $bindings['department'] = $filters['department'];
        }

        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY p.name ASC';

        $statement = $this->db->prepare($sql);
        $statement->execute($bindings);

        return $statement->fetchAll();
    }

    public function find(int $id): array|false
    {
        $statement = $this->db->prepare('SELECT * FROM patients WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO patients (
                patient_code, name, age, gender, blood_type, last_visit, status, room,
                entry_date, exit_date, birth_date, phone, email, address, status_description,
                medical_history, department, medication, dosage, frequency, is_archived
            ) VALUES (
                :patient_code, :name, :age, :gender, :blood_type, :last_visit, :status, :room,
                :entry_date, :exit_date, :birth_date, :phone, :email, :address, :status_description,
                :medical_history, :department, :medication, :dosage, :frequency, :is_archived
            )'
        );

        $statement->execute($this->mapPayload($data));

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $payload = $this->mapPayload($data);
        $payload['id'] = $id;

        $statement = $this->db->prepare(
            'UPDATE patients SET
                patient_code = :patient_code,
                name = :name,
                age = :age,
                gender = :gender,
                blood_type = :blood_type,
                last_visit = :last_visit,
                status = :status,
                room = :room,
                entry_date = :entry_date,
                exit_date = :exit_date,
                birth_date = :birth_date,
                phone = :phone,
                email = :email,
                address = :address,
                status_description = :status_description,
                medical_history = :medical_history,
                department = :department,
                medication = :medication,
                dosage = :dosage,
                frequency = :frequency,
                is_archived = :is_archived,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute($payload);
    }

    public function delete(int $id): bool
    {
        $this->db->beginTransaction();

        try {
            // Best-effort cleanup for deployments where FK cascade is missing.
            foreach (['appointments', 'invoices'] as $table) {
                try {
                    $cleanup = $this->db->prepare(sprintf('DELETE FROM %s WHERE patient_id = :id', $table));
                    $cleanup->execute(['id' => $id]);
                } catch (PDOException) {
                    // Ignore missing table / schema differences.
                }
            }

            $statement = $this->db->prepare('DELETE FROM patients WHERE id = :id');
            $statement->execute(['id' => $id]);

            $deleted = $statement->rowCount() > 0;

            if ($deleted) {
                $this->db->commit();
                return true;
            }

            $this->db->rollBack();
            return false;
        } catch (\Throwable) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            return false;
        }
    }

    public function archive(int $id): bool
    {
        $statement = $this->db->prepare(
            'UPDATE patients
             SET is_archived = 1, exit_date = COALESCE(exit_date, CURRENT_DATE), updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute(['id' => $id]);
    }

    public function countAll(): int
    {
        return (int) $this->db->query('SELECT COUNT(*) FROM patients')->fetchColumn();
    }

    public function countCritical(): int
    {
        $statement = $this->db->prepare('SELECT COUNT(*) FROM patients WHERE status = :status AND is_archived = 0');
        $statement->execute(['status' => 'Critical']);

        return (int) $statement->fetchColumn();
    }

    private function mapPayload(array $data): array
    {
        return [
            'patient_code' => $data['patient_code'],
            'name' => $data['name'],
            'age' => (int) $data['age'],
            'gender' => $data['gender'],
            'blood_type' => $data['blood_type'],
            'last_visit' => $data['last_visit'],
            'status' => $data['status'],
            'room' => $data['room'] ?: null,
            'entry_date' => $data['entry_date'] ?: null,
            'exit_date' => $data['exit_date'] ?: null,
            'birth_date' => $data['birth_date'] ?: null,
            'phone' => $data['phone'] ?: null,
            'email' => $data['email'] ?: null,
            'address' => $data['address'] ?: null,
            'status_description' => $data['status_description'] ?: null,
            'medical_history' => $data['medical_history'] ?: null,
            'department' => $data['department'] ?: null,
            'medication' => $data['medication'] ?: null,
            'dosage' => $data['dosage'] ?: null,
            'frequency' => $data['frequency'] ?: null,
            'is_archived' => (int) ($data['is_archived'] ?? 0),
        ];
    }
}
