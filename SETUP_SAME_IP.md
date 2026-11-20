# Local Setup

This project now supports a more flexible local setup for frontend and backend.

## Default Dev Mode

Use this when you want the simplest local setup.

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Frontend API calls use the Vite proxy, so the app talks to `/api`, `/uploads`, and `/scan` automatically.

### Start it

Backend:

```powershell
php -S 0.0.0.0:8000 -t backend/public
```

Frontend:

```powershell
npm run frontend
```

If XAMPP PHP exists at `C:\xampp\php\php.exe`, both starter scripts will use it automatically:

- `start-servers.bat`
- `start-servers.ps1`

## XAMPP Mode

Use this when you want Apache and MySQL managed by XAMPP.

### Backend target

Point Apache to the backend public folder, or expose it under a local URL such as:

`http://localhost/mediflow-digital-hospital/backend/public`

Then set this in `.env`:

```env
VITE_BACKEND_PROXY_TARGET=http://localhost/mediflow-digital-hospital/backend/public
```

You can keep:

```env
VITE_API_URL=/api
```

The frontend will still call `/api`; Vite forwards those requests to the XAMPP-served backend.

## Production-Like Mode

If you build and deploy frontend separately, set:

```env
VITE_API_URL=http://localhost:8000/api
```

or your final server URL.

## Database

For XAMPP MySQL, initialize the schema with:

```bat
init-db.bat
```

That script uses:

`C:\xampp\mysql\bin\mysql.exe`

## Env Summary

- `VITE_API_URL=/api`
  Recommended for local development with Vite proxy.

- `VITE_BACKEND_PROXY_TARGET=http://localhost:8000`
  Recommended for the built-in PHP server.

- `VITE_BACKEND_PROXY_TARGET=http://localhost/mediflow-digital-hospital/backend/public`
  Recommended if Apache/XAMPP serves the backend.
