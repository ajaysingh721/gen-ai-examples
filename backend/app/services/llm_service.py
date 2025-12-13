from functools import lru_cache

from transformers import pipeline


@lru_cache(maxsize=1)
def get_llm_pipeline():
    """Return a cached local text-generation pipeline.

    Uses a small model by default so it can run on CPU.
    The first call will download the model; later calls reuse it.
    """

    # You can replace "distilgpt2" with another local or downloaded model.
    return pipeline("text-generation", model="distilgpt2")


def generate_text(prompt: str, max_tokens: int = 128) -> str:
    pipe = get_llm_pipeline()

    outputs = pipe(prompt, max_new_tokens=max_tokens, do_sample=True, temperature=0.7)
    return outputs[0]["generated_text"]
