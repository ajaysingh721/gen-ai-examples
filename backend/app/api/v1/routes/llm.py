from fastapi import APIRouter

from app.schemas.llm import LLMRequest, LLMResponse
from app.services.llm_service import generate_text

router = APIRouter(prefix="/api/v1/llm", tags=["llm"])


@router.post("/generate", response_model=LLMResponse)
async def generate(request: LLMRequest) -> LLMResponse:
    output = generate_text(request.prompt, max_tokens=request.max_tokens)
    return LLMResponse(output=output)
