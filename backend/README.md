# MediFlow Backend

Backend PHP/MySQL structure pour l'application `mediflow-digital-hospital`.

## Architecture

```text
backend/
├── database/
│   └── schema.sql
├── public/
│   ├── .htaccess
│   └── index.php
└── src/
    ├── Controllers/
    ├── Core/
    ├── Exceptions/
    ├── Repositories/
    ├── Services/
    ├── Support/
    └── routes/
```

## Fonctionnalités incluses

- API REST JSON en PHP natif, organisée par couches
- Connexion MySQL via PDO avec requêtes préparées
- Gestion des patients
- Gestion des médecins
- Gestion des rendez-vous
- Endpoint de synthèse dashboard
- Gestion des erreurs et réponses JSON uniformes
- Support CORS pour le frontend Vite

## Installation

1. Copier `backend/.env.example` vers `backend/.env`
2. Créer la base et les tables avec `backend/database/schema.sql`
3. Pointer Apache/Nginx sur `backend/public`
4. Vérifier que PHP dispose de l’extension `pdo_mysql`

## Démarrage local rapide

Depuis le dossier `backend/` :

```bash
php -S localhost:8000 -t public
```

Le backend sera accessible sur `http://localhost:8000`.

## Endpoints principaux

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/patients`
- `GET /api/patients/{id}`
- `POST /api/patients`
- `PUT /api/patients/{id}`
- `DELETE /api/patients/{id}`
- `POST /api/patients/{id}/archive`
- `GET /api/doctors`
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/{id}`
- `DELETE /api/appointments/{id}`

## Exemple de payload patient

```json
{
  "patient_code": "PAT-2001",
  "name": "Nadia El Alaoui",
  "age": 34,
  "gender": "F",
  "blood_type": "O+",
  "last_visit": "2026-04-13",
  "status": "Stable",
  "room": "102B",
  "entry_date": "2026-04-13",
  "birth_date": "1992-08-20",
  "phone": "0600000000",
  "address": "Casablanca",
  "department": "Cardiologie",
  "medication": "Aspirine",
  "dosage": "100mg",
  "frequency": "1x / jour"
}
```
