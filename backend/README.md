## Backend FastAPI Service

### Folder structure

- app/
  - main.py (FastAPI app and router wiring)
  - api/
    - v1/
      - routes_root.py (example root route)
  - core/ (configuration, settings)
  - models/ (database models)
  - schemas/ (Pydantic schemas)

### Running the server

From the `backend` directory:

```bash
uvicorn app:main --reload
```

Then open http://127.0.0.1:8000 in your browser. The automatic docs are at:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
