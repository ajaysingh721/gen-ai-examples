from fastapi import FastAPI

from app.api.v1 import routes_root

app = FastAPI(title="Backend API", version="0.1.0")

app.include_router(routes_root.router)
