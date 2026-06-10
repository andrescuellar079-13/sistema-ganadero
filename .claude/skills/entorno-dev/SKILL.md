---
name: entorno-dev
description: Cómo levantar el backend Django y el frontend React, y correr migraciones/seeds del Sistema Ganadero en Windows/PowerShell. Úsalo cuando el usuario pida arrancar la app, correr el servidor, aplicar migraciones o sembrar datos.
---

# Entorno de desarrollo (Windows / PowerShell)

## Backend (Django + GraphQL)

```powershell
cd backend
.\venv\Scripts\Activate.ps1        # activa el entorno virtual existente
python manage.py migrate           # aplica migraciones pendientes
python manage.py runserver         # http://127.0.0.1:8000/graphql/
```

- El endpoint único es `POST /graphql/`. GraphiQL queda en `http://127.0.0.1:8000/graphql/`.
- Para crear migraciones tras tocar modelos: `python manage.py makemigrations <app>`.

## Frontend (React + Vite)

```powershell
cd frontend
npm install      # solo la primera vez o si cambió package.json
npm run dev      # http://localhost:5173
```

CORS está configurado solo para `localhost:5173` / `127.0.0.1:5173` en desarrollo.

## Seeds (datos de prueba)

- `seed_pedro.py` — seeder **idempotente** de desarrollo: crea la Hacienda Pedros y el usuario
  `pedro`. Es el recomendado para poblar datos de prueba sin duplicar.
- Otros: `seed_data.py`, `seed_categorias.py`, `seed_modulos.py`.

## ⚠️ Gotcha importante de `manage.py`

`backend/manage.py` tiene el contenido de `seed_data.py` **pegado al final**. Eso provoca que
comandos one-off (`shell -c`, a veces `makemigrations`) ejecuten el seed y emitan ruido o crasheen.

- Si solo quieres el resultado del comando, **redirige stderr**: en PowerShell `... 2>$null`.
- `runserver` y `migrate` normales funcionan bien; el problema es sobre todo en comandos sueltos.

## Notas de plataforma

- PowerShell: usa `$env:VAR` (no `$VAR`), `$null` (no `/dev/null`), backtick para continuar línea.
- El entorno virtual ya existe en `backend/venv/`; no lo recrees salvo que esté roto.
