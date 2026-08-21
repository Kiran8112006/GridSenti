# GridSenti Backend

FastAPI-based backend for the GridSenti grid safety monitoring system.

## Setup

```bash
# 1. Create virtual environment
python -m venv .venv

# 2. Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
copy .env.example .env

# 5. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints (Skeleton)

| Method | Path          | Description   |
|--------|---------------|---------------|
| GET    | /             | Root welcome  |
| GET    | /api/health   | Health check  |
| GET    | /docs         | Swagger UI    |
| GET    | /redoc        | ReDoc UI      |

## Planned Endpoints

- `POST /api/telemetry` — Receive telemetry from ESP nodes
- `GET  /api/nodes` — List all monitoring nodes
- `GET  /api/faults` — List fault events
- `GET  /api/alerts` — List active alerts
- `GET  /api/hif/status` — HIF detection status

## ⚠ Safety Note

No real electrical measurements are performed.
All telemetry is simulated by the ESP8266 prototype node.
