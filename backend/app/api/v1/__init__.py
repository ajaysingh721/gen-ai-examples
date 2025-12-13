from fastapi import APIRouter

from . import routes_documents, routes_llm, routes_root

api_router = APIRouter()

api_router.include_router(routes_root.router)
api_router.include_router(routes_llm.router)
api_router.include_router(routes_documents.router)
