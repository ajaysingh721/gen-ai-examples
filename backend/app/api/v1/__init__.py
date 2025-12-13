from fastapi import APIRouter

from .routes import documents, llm

api_router = APIRouter()

api_router.include_router(llm.router)
api_router.include_router(documents.router)
