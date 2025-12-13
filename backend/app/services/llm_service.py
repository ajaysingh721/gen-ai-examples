from functools import lru_cache
import os

from ollama import Client


@lru_cache(maxsize=1)
def get_ollama_client() -> Client:
    """Return a cached Ollama client instance.

    Assumes the Ollama server is running locally (default http://localhost:11434)
    and that the desired model (for example, "mistral") is already pulled.
    """

    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    return Client(host=base_url)


def generate_text(prompt: str, max_tokens: int = 128) -> str:
    """Generate text using a local Ollama model (e.g. mistral)."""

    client = get_ollama_client()

    model_name = os.environ.get("OLLAMA_MODEL", "mistral")

    response = client.chat(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        options={"num_predict": max_tokens},
    )

    # Ollama chat returns a dict with a "message" field
    return response["message"]["content"]
