from pydantic import BaseModel


class LLMRequest(BaseModel):
    prompt: str
    max_tokens: int = 128


class LLMResponse(BaseModel):
    output: str
