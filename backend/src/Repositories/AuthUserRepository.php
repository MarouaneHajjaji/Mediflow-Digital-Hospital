<?php

declare(strict_types=1);

namespace App\Repositories;

final class AuthUserRepository extends BaseRepository
{
    public function findByEmail(string $email): array|false
    {
        $statement = $this->db->prepare(
            'SELECT
                au.*,
                d.name AS doctor_name,
                d.specialty AS doctor_specialty
             FROM auth_users au
             LEFT JOIN doctors d ON d.id = au.doctor_id
             WHERE au.email = :email
             LIMIT 1'
        );
        $statement->execute(['email' => strtolower(trim($email))]);

        return $statement->fetch();
    }

    public function findById(int $id): array|false
    {
        $statement = $this->db->prepare(
            'SELECT
                au.*,
                d.name AS doctor_name,
                d.specialty AS doctor_specialty
             FROM auth_users au
             LEFT JOIN doctors d ON d.id = au.doctor_id
             WHERE au.id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);

        return $statement->fetch();
    }
}
