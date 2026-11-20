<?php

declare(strict_types=1);

namespace App\Repositories;

final class DoctorRepository extends BaseRepository
{
    public function all(): array
    {
        $statement = $this->db->query('SELECT * FROM doctors ORDER BY name ASC');

        return $statement->fetchAll();
    }

    public function findByName(string $name): array|false
    {
        $statement = $this->db->prepare('SELECT * FROM doctors WHERE name = :name LIMIT 1');
        $statement->execute(['name' => $name]);

        return $statement->fetch();
    }

    public function find(int $id): array|false
    {
        $statement = $this->db->prepare('SELECT * FROM doctors WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }

    public function create(array $data): int
    {
        $statement = $this->db->prepare(
            'INSERT INTO doctors (name, specialty, age, profile_picture, email, department, availability)
             VALUES (:name, :specialty, :age, :profile_picture, :email, :department, :availability)'
        );
        $statement->execute([
            'name' => $data['name'],
            'specialty' => $data['specialty'],
            'age' => (int) $data['age'],
            'profile_picture' => $data['profile_picture'] ?: null,
            'email' => $data['email'] ?: null,
            'department' => $data['department'] ?: null,
            'availability' => $data['availability'] ?: null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $statement = $this->db->prepare(
            'UPDATE doctors SET
                name = :name,
                specialty = :specialty,
                age = :age,
                profile_picture = :profile_picture,
                email = :email,
                department = :department,
                availability = :availability,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        return $statement->execute([
            'id' => $id,
            'name' => $data['name'],
            'specialty' => $data['specialty'],
            'age' => (int) $data['age'],
            'profile_picture' => $data['profile_picture'] ?: null,
            'email' => $data['email'] ?: null,
            'department' => $data['department'] ?: null,
            'availability' => $data['availability'] ?: null,
        ]);
    }

    public function delete(int $id): bool
    {
        $statement = $this->db->prepare('DELETE FROM doctors WHERE id = :id');

        return $statement->execute(['id' => $id]);
    }
}
