from fastapi import APIRouter

from . import routes_root, routes_llm

api_router = APIRouter()

api_router.include_router(routes_root.router)
api_router.include_router(routes_llm.router)
