from fastapi import APIRouter

router = APIRouter(prefix="", tags=["root"])


@router.get("/")
async def read_root():
    return {"message": "Hello from FastAPI backend"}
