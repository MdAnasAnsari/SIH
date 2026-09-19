# MVCU-01 Backend

Minimal FastAPI backend foundation for the MVCU-01 dashboard.

## Current endpoint

```text
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "MVCU-01 Backend"
}
```

## Run locally

From the `backend/` directory:

```powershell
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

The configuration and package layout leave room for future frontend integration and ML services. No camera, ESP32, telemetry, database, authentication, or ML functionality is implemented yet.
