# MediFlow Digital Hospital

MediFlow Digital Hospital is a hospital management web application with a React/Vite frontend and a custom PHP/MySQL JSON API. The implemented backend persists users, doctors, patients, appointments, invoices for dashboard revenue, and uploaded archive documents. Several clinical workspace modules are implemented as frontend-only demo state.

## Main Features

- Backend-authenticated login with bearer tokens, seeded admin and doctor accounts, and role-based data filtering.
- Dashboard with patient totals, critical case count, today's appointment count, revenue summary, recent activity, CSV export, and emergency alerts.
- Patient management with create, update, delete, archive, search, sorting, and CSV export.
- Appointment management with day/week/month views, doctor filtering, create/update/delete, status cycling, and local reminder feedback.
- Doctor management for admins through the Settings view.
- Archive area for archived patients, uploaded mobile scan documents, local desktop scan/OCR results, QR/link generation for phone scanning, document image download, and document deletion.
- Local demo modules for EMR, laboratory, imaging, hospitalization, billing, and user settings.
- Docker Compose stack for MySQL, PHP/Apache backend, and Vite frontend.
- GitHub Actions workflow for TypeScript checking, frontend build, and PHP syntax linting.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4 via `@tailwindcss/vite`
- Lucide React icons
- Recharts
- date-fns
- Tesseract.js for browser-side image OCR

### Backend

- PHP 8.2-compatible custom API framework
- MySQL or MariaDB
- PDO with prepared statements
- HMAC-signed bearer tokens
- Apache rewrite support for Docker/XAMPP-style routing
- Optional cURL integration for Gemini or Anthropic document analysis

## Architecture Overview

The frontend is a single-page React application in `src/`. It calls the backend through `src/lib/api.ts`; in Vite development mode, `/api`, `/uploads`, and `/scan` are proxied by `vite.config.ts`.

The backend is a small layered PHP application under `backend/src/`:

- `public/index.php` routes API requests and serves `/scan`.
- `src/Core/` contains request, response, routing, config, env, database, and validation utilities.
- `src/Controllers/` contains API actions.
- `src/Repositories/` contains SQL access for persisted entities.
- `src/Services/` contains authentication, dashboard aggregation, and access control.
- `storage/archive/documents.json` stores archive document metadata.
- `public/uploads/archive/` stores uploaded archive images.

Persisted database tables are `doctors`, `auth_users`, `patients`, `appointments`, and `invoices`. EMR, lab, imaging, hospitalization, billing UI records, settings preferences, and desktop archive saves are held in React state and are not persisted to MySQL.

## Installation

### Prerequisites

- Node.js 20 recommended
- npm
- PHP 8.2 recommended
- PHP extensions: `pdo_mysql`; `curl` is required only for backend AI document analysis
- MySQL 8 or MariaDB
- Docker and Docker Compose, if using containers

### Install Node Dependencies

```bash
npm install
```

### Configure Frontend Environment

Copy `.env.example` to `.env` and adjust values as needed:

```env
VITE_API_URL=/api
VITE_BACKEND_PROXY_TARGET=http://localhost:8000
GEMINI_API_KEY=
```

In Vite development mode, `VITE_API_URL` is ignored by the frontend and `/api` is used so the Vite proxy can forward requests.

### Configure Backend Environment

Copy `backend/.env.example` to `backend/.env` and adjust values:

```env
APP_ENV=development
APP_DEBUG=true
APP_KEY=change-this-secret-key
APP_URL=http://localhost:8000
APP_PUBLIC_HOST=
APP_PUBLIC_PORT=
APP_TIMEZONE=Africa/Casablanca

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mediflow_hospital
DB_USER=root
DB_PASS=

CORS_ALLOWED_ORIGINS=*
```

Set a unique `APP_KEY` before using the application outside local development.

## Environment Variables

### Frontend

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `src/lib/apiBase.ts` | Production API base URL. Defaults to `/api`. |
| `VITE_BACKEND_PROXY_TARGET` | `vite.config.ts` | Backend target for Vite dev proxy. Defaults to `http://localhost:8000`. |
| `GEMINI_API_KEY` | `vite.config.ts` | Exposed as `process.env.GEMINI_API_KEY`; no current source code imports it directly. |
| `DISABLE_HMR` | `vite.config.ts` | Set to `true` to disable Vite HMR. |

### Backend

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | Application environment label. |
| `APP_DEBUG` | Includes debug file/line details in non-HTTP exceptions when true. |
| `APP_KEY` | Required signing key for bearer and scan tokens. |
| `APP_URL` | Backend base URL setting. |
| `APP_PUBLIC_HOST` | Optional host used when generating phone scan URLs. |
| `APP_PUBLIC_PORT` | Optional port used with `APP_PUBLIC_HOST`. |
| `APP_TIMEZONE` | PHP default timezone. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL connection settings. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins, or `*`. |
| `GEMINI_API_KEY`, `GEMINI_API_KEY_IMAGE`, `GEMINI_API_KEY_PDF` | Gemini keys for archive analysis. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEY_IMAGE`, `ANTHROPIC_API_KEY_PDF` | Anthropic keys for archive analysis. |
| `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_IMAGE`, `ANTHROPIC_MODEL_PDF` | Optional Anthropic model overrides. |

## Database Setup

Initialize MySQL with:

```bash
mysql -u root -p < backend/database/schema.sql
```

The schema creates the `mediflow_hospital` database, tables, indexes, demo doctors, demo auth users, demo patients, demo appointments, and demo invoices.

Windows users with XAMPP can use `init-db.bat`, but it is hard-coded to this workspace path and to `C:\xampp\mysql\bin\mysql.exe`.

## Running Locally

Start the backend:

```bash
php -S 0.0.0.0:8000 -t backend/public
```

Start the frontend in another terminal:

```bash
npm run frontend
```

Open:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8000/api/health`
- Mobile scan page: `http://localhost:8000/scan?token=<scan-token>`

The Windows helper scripts `start-servers.ps1` and `start-servers.bat` start both services and auto-detect `C:\xampp\php\php.exe`, but they contain hard-coded local paths.

## Demo Login Accounts

These seeded credentials are defined by `backend/database/schema.sql` and verified against the stored password hashes:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mediflow.com` | `Admin2026!` |
| Doctor | `hassan.elidrissi@mediflow.com` | `Hassan2026!` |
| Doctor | `sara.bennani@mediflow.com` | `Sara2026!` |
| Doctor | `yasmine.alaoui@mediflow.com` | `Yasmine2026!` |
| Doctor | `mehdi.chafik@mediflow.com` | `Mehdi2026!` |
| Doctor | `karim.tazi@mediflow.com` | `Karim2026!` |
| Doctor | `amal.lahlou@mediflow.com` | `Amal2026!` |

Additional seeded doctors and auth users are present in the SQL schema.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Vite on `0.0.0.0:3000`. |
| `npm run start` | Same as `npm run dev`. |
| `npm run frontend` | Starts only the Vite frontend on `0.0.0.0:3000`. |
| `npm run backend` | Starts PHP's built-in server on `0.0.0.0:8000` with `backend/public` as document root. |
| `npm run server` | Intended to start backend and frontend together, but requires `concurrently`, which is not listed in `package.json`. |
| `npm run build` | Builds the frontend into `dist/`. |
| `npm run preview` | Serves the built frontend with Vite preview. |
| `npm run clean` | Removes `dist/`. |
| `npm run lint` | Runs `tsc --noEmit`. |

## API Endpoints

All endpoints except `GET /api/health` and `POST /api/auth/login` require a bearer token.

### Health and Auth

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard/summary`

### Patients

- `GET /api/patients`
- `GET /api/patients/{id}`
- `POST /api/patients`
- `PUT /api/patients/{id}`
- `DELETE /api/patients/{id}`
- `POST /api/patients/{id}/delete`
- `POST /api/patients/{id}/archive`

### Doctors

- `GET /api/doctors`
- `POST /api/doctors`
- `PUT /api/doctors/{id}`
- `DELETE /api/doctors/{id}`

### Appointments

- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/{id}`
- `DELETE /api/appointments/{id}`

### Archive

- `GET /api/archive/server-info`
- `GET /api/archive/documents`
- `POST /api/archive/analyze`
- `GET /api/archive/documents/{id}/image`
- `DELETE /api/archive/documents/{id}`
- `POST /api/archive/documents/{id}/delete`
- `GET /api/archive/patients`
- `POST /api/archive/upload`

## Build and Deployment

### Frontend Build

```bash
npm run build
```

The output is written to `dist/`.

### Docker Compose

```bash
docker compose up --build
```

Services:

- `db`: MySQL 8.4, imports `backend/database/schema.sql` on first initialization.
- `backend`: PHP 8.2 Apache with `pdo_mysql` and URL rewriting.
- `frontend`: Vite dev server on port `3000`.

Ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- MySQL: `localhost:3306`

### CI

`.github/workflows/ci.yml` runs:

- `npm ci`
- `npm run lint`
- `npm run build`
- PHP syntax checks for backend PHP files, excluding uploaded archive files

## Configuration Notes

- Vite proxies `/api`, `/uploads`, and `/scan` to `VITE_BACKEND_PROXY_TARGET` in development.
- In production builds, set `VITE_API_URL` to the deployed API base, for example `https://example.com/api`.
- `CORS_ALLOWED_ORIGINS` should be restricted outside local development.
- Archive document metadata is stored in `backend/storage/archive/documents.json`.
- Archive images are stored in `backend/public/uploads/archive/`.
- Desktop archive scans saved from the React modal are local frontend state only; mobile uploads use the backend archive upload endpoint.

## Folder Structure

```text
.
|-- .github/workflows/ci.yml
|-- backend/
|   |-- database/
|   |   |-- schema.sql
|   |   |-- migrate_add_arabic_fields.sql
|   |   `-- seeds_arabic.sql
|   |-- public/
|   |   |-- index.php
|   |   |-- scan.html
|   |   `-- uploads/archive/
|   |-- src/
|   |   |-- Controllers/
|   |   |-- Core/
|   |   |-- Exceptions/
|   |   |-- Repositories/
|   |   |-- Services/
|   |   |-- Support/
|   |   `-- routes/api.php
|   `-- storage/archive/documents.json
|-- src/
|   |-- components/
|   |-- lib/
|   |-- App.tsx
|   |-- DocumentScannerRunner.tsx
|   |-- main.tsx
|   `-- types.ts
|-- docker-compose.yml
|-- Dockerfile.frontend
|-- package.json
|-- scanner-runner.html
|-- tsconfig.json
`-- vite.config.ts
```

## Troubleshooting

- `npm run server` fails with `concurrently` not found: install `concurrently` or run `npm run backend` and `npm run frontend` in separate terminals.
- Login fails after setup: ensure MySQL has been initialized with `backend/database/schema.sql`, `backend/.env` points to the correct database, and `APP_KEY` is not empty.
- Frontend cannot reach backend: confirm the PHP server is running and `VITE_BACKEND_PROXY_TARGET` points to the backend origin, not necessarily `/api`.
- `/api/health` returns `database: disconnected`: verify MySQL is running and the `DB_*` values in `backend/.env` are correct.
- Mobile scan link is not reachable from a phone: start PHP with `0.0.0.0`, use the same network, and set `APP_PUBLIC_HOST`/`APP_PUBLIC_PORT` if automatic IP detection is wrong.
- AI document analysis fails: install/enable PHP cURL and configure the relevant Gemini or Anthropic backend API key.
- Some UI labels look corrupted: several source files currently contain mojibake text and need encoding cleanup.

## License

No license file is present in this repository. Add an explicit license before distributing or publishing the project.
