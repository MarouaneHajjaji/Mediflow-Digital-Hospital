<?php

declare(strict_types=1);

namespace App\Repositories;

final class ImagingStudyRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->ensureTable();
    }

    public function all(array $filters = []): array
    {
        $sql = "SELECT i.*, p.name AS patient_name
                FROM imaging_studies i
                INNER JOIN patients p ON p.id = i.patient_id";
        $conditions = [];
        $bindings = [];

        if (array_key_exists('archived', $filters) && $filters['archived'] !== null) {
            $conditions[] = 'i.is_archived = :archived';
            $bindings['archived'] = (int) $filters['archived'];
        }

        if (!empty($filters['department'])) {
            $conditions[] = 'p.department = :department';
            $bindings['department'] = $filters['department'];
        }

        if ($conditions !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY i.created_at DESC';

        $statement = $this->db->prepare($sql);
        $statement->execute($bindings);

        return $statement->fetchAll();
    }

    public function find(int $id): array|false
    {
        $statement = $this->db->prepare(
            "SELECT i.*, p.name AS patient_name, p.department AS patient_department
             FROM imaging_studies i
             INNER JOIN patients p ON p.id = i.patient_id
             WHERE i.id = :id
             LIMIT 1"
        );
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO imaging_studies (
                patient_id, exam_type, exam_date, doctor, status, progress, image_data_url, report, is_archived
            ) VALUES (
                :patient_id, :exam_type, :exam_date, :doctor, :status, :progress, :image_data_url, :report, :is_archived
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
            'UPDATE imaging_studies SET
                patient_id = :patient_id,
                exam_type = :exam_type,
                exam_date = :exam_date,
                doctor = :doctor,
                status = :status,
                progress = :progress,
                image_data_url = :image_data_url,
                report = :report,
                is_archived = :is_archived,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute($payload);
    }

    public function delete(int $id): bool
    {
        $statement = $this->db->prepare('DELETE FROM imaging_studies WHERE id = :id');
        $statement->execute(['id' => $id]);

        return $statement->rowCount() > 0;
    }

    public function toggleArchive(int $id): bool
    {
        $statement = $this->db->prepare(
            'UPDATE imaging_studies
             SET is_archived = CASE WHEN is_archived = 1 THEN 0 ELSE 1 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute(['id' => $id]);
    }

    private function mapPayload(array $data): array
    {
        return [
            'patient_id' => (int) $data['patient_id'],
            'exam_type' => $data['exam_type'],
            'exam_date' => $data['exam_date'] ?: date('Y-m-d'),
            'doctor' => $data['doctor'],
            'status' => $data['status'] ?? 'Available',
            'progress' => (int) ($data['progress'] ?? 100),
            'image_data_url' => $data['image_data_url'] ?: null,
            'report' => $data['report'] ?: null,
            'is_archived' => (int) ($data['is_archived'] ?? 0),
        ];
    }

    private function ensureTable(): void
    {
        $this->db->exec(
            "CREATE TABLE IF NOT EXISTS imaging_studies (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                patient_id INT UNSIGNED NOT NULL,
                exam_type VARCHAR(150) NOT NULL,
                exam_date DATE NOT NULL,
                doctor VARCHAR(150) NOT NULL,
                status ENUM('Available', 'Processing') NOT NULL DEFAULT 'Available',
                progress TINYINT UNSIGNED NOT NULL DEFAULT 100,
                image_data_url LONGTEXT NULL,
                report TEXT NULL,
                is_archived TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_imaging_patient_date (patient_id, exam_date),
                INDEX idx_imaging_archived_status (is_archived, status),
                CONSTRAINT fk_imaging_studies_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            )"
        );
    }
}
