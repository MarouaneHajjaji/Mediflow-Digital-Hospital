<?php

declare(strict_types=1);

namespace App\Repositories;

final class AppointmentRepository extends BaseRepository
{
    public function all(array $filters = []): array
    {
        $sql = 'SELECT
                    a.*,
                    p.name AS patient_name,
                    p.patient_code AS patient_code,
                    d.name AS doctor_name
                FROM appointments a
                INNER JOIN patients p ON p.id = a.patient_id
                INNER JOIN doctors d ON d.id = a.doctor_id';
        $conditions = [];
        $bindings = [];

        if (!empty($filters['status'])) {
            $conditions[] = 'a.status = :status';
            $bindings['status'] = $filters['status'];
        }

        if (!empty($filters['date'])) {
            $conditions[] = 'a.appointment_date = :appointment_date';
            $bindings['appointment_date'] = $filters['date'];
        }

        if (!empty($filters['doctor_id'])) {
            $conditions[] = 'a.doctor_id = :doctor_id';
            $bindings['doctor_id'] = (int) $filters['doctor_id'];
        }

        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

        $statement = $this->db->prepare($sql);
        $statement->execute($bindings);

        return $statement->fetchAll();
    }

    public function find(int $id): array|false
    {
        $statement = $this->db->prepare('SELECT * FROM appointments WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }

    public function findDetailed(int $id): array|false
    {
        $statement = $this->db->prepare(
            'SELECT
                a.*,
                p.name AS patient_name,
                p.patient_code AS patient_code,
                d.name AS doctor_name
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             INNER JOIN doctors d ON d.id = a.doctor_id
             WHERE a.id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO appointments (
                patient_id, doctor_id, appointment_date, appointment_time, type, status, reminder_sent, notes
            ) VALUES (
                :patient_id, :doctor_id, :appointment_date, :appointment_time, :type, :status, :reminder_sent, :notes
            )'
        );

        $statement->execute([
            'patient_id' => (int) $data['patient_id'],
            'doctor_id' => (int) $data['doctor_id'],
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
            'type' => $data['type'],
            'status' => $data['status'],
            'reminder_sent' => (int) ($data['reminder_sent'] ?? 0),
            'notes' => $data['notes'] ?: null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE appointments SET
                patient_id = :patient_id,
                doctor_id = :doctor_id,
                appointment_date = :appointment_date,
                appointment_time = :appointment_time,
                type = :type,
                status = :status,
                reminder_sent = :reminder_sent,
                notes = :notes,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'patient_id' => (int) $data['patient_id'],
            'doctor_id' => (int) $data['doctor_id'],
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
            'type' => $data['type'],
            'status' => $data['status'],
            'reminder_sent' => (int) ($data['reminder_sent'] ?? 0),
            'notes' => $data['notes'] ?: null,
        ]);
    }

    public function delete(int $id): bool
    {
        $statement = $this->db->prepare('DELETE FROM appointments WHERE id = :id');

        return $statement->execute(['id' => $id]);
    }

    public function countToday(): int
    {
        $statement = $this->db->prepare('SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE');
        $statement->execute();

        return (int) $statement->fetchColumn();
    }
}
