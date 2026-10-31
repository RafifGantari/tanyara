import asyncio
import logging
from typing import List, Optional
from backend.app.services.llm.base import LLMProvider, LLMMessage, LLMResponse
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Standard embedding model and expected dimensions
EMBEDDING_MODEL_NAME = "models/gemini-embedding-001"
EMBEDDING_DIMENSION = 768


class GeminiProvider(LLMProvider):
    """
    Google Gemini AI provider implementation using google-generativeai SDK.
    Keeps model credentials isolated on the server.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        embedding_model_name: str = EMBEDDING_MODEL_NAME,
        timeout_seconds: float = 30.0,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self.embedding_model_name = embedding_model_name
        self.timeout_seconds = timeout_seconds
        self._is_configured = False

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._is_configured = True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {type(e).__name__}")

    @property
    def is_configured(self) -> bool:
        return self._is_configured

    async def generate_response(
        self,
        messages: List[LLMMessage],
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """
        Generates conversational completion using Gemini text model.
        Includes timeout protection and structured error handling.
        """
        if not self._is_configured:
            raise RuntimeError(
                "Gemini API belum dikonfigurasi. Harap isi GEMINI_API_KEY pada backend/.env"
            )

        import google.generativeai as genai
        from google.api_core.exceptions import GoogleAPIError, ResourceExhausted

        model_id = self.model_name
        if not model_id.startswith("models/"):
            model_id = f"models/{model_id}"

        try:
            model = genai.GenerativeModel(
                model_name=model_id,
                system_instruction=system_instruction,
            )

            # Build Gemini history
            gemini_history = []
            last_message_content = ""

            for idx, msg in enumerate(messages):
                if idx == len(messages) - 1 and msg.role == "user":
                    last_message_content = msg.content
                else:
                    gemini_role = "model" if msg.role == "assistant" else "user"
                    gemini_history.append({"role": gemini_role, "parts": [msg.content]})

            chat = model.start_chat(history=gemini_history)
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            # Enforce async timeout
            response = await asyncio.wait_for(
                chat.send_message_async(
                    last_message_content,
                    generation_config=generation_config
                ),
                timeout=self.timeout_seconds
            )

            prompt_tokens = 0
            completion_tokens = 0
            total_tokens = 0

            # Extract token usage if returned by SDK
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
                completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0
                total_tokens = getattr(response.usage_metadata, "total_token_count", 0) or 0

            return LLMResponse(
                content=response.text,
                model=self.model_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )

        except asyncio.TimeoutError:
            logger.error("Gemini API call timed out.")
            raise TimeoutError("Layanan AI membutuhkan waktu terlalu lama untuk merespons.")
        except ResourceExhausted:
            logger.error("Gemini API quota or rate limit exceeded.")
            raise RuntimeError("Batas kuota panggilan Gemini API telah tercapai. Silakan coba kembali beberapa saat lagi.")
        except GoogleAPIError as e:
            logger.error(f"Google Gemini API error: {type(e).__name__}")
            raise RuntimeError("Terjadi kesalahan saat berkomunikasi dengan penyedia model AI.")
        except Exception as e:
            logger.error(f"Unexpected error in GeminiProvider: {type(e).__name__}")
            raise RuntimeError("Gagal memproses jawaban dari model AI.")

    async def generate_embeddings(
        self,
        texts: List[str],
        task_type: str = "retrieval_document",
    ) -> List[List[float]]:
        """
        Generates 768-dimension vector embeddings using Gemini embedding models.
        """
        if not self._is_configured:
            raise RuntimeError(
                "Gemini API belum dikonfigurasi. Harap isi GEMINI_API_KEY pada backend/.env"
            )

        if not texts:
            return []

        import google.generativeai as genai
        from google.api_core.exceptions import GoogleAPIError

        results: List[List[float]] = []
        candidate_models = [
            self.embedding_model_name,
            "models/gemini-embedding-001",
            "models/gemini-embedding-2",
            "models/text-embedding-004",
        ]
        # Preserve order while deduplicating
        candidate_models = list(dict.fromkeys(candidate_models))

        for text in texts:
            clean_text = text.strip()
            if not clean_text:
                continue

            emb = None
            last_err = None
            for model in candidate_models:
                try:
                    kwargs = {
                        "model": model,
                        "content": clean_text,
                        "task_type": task_type,
                    }
                    if "gemini-embedding" in model:
                        kwargs["output_dimensionality"] = EMBEDDING_DIMENSION

                    response = genai.embed_content(**kwargs)
                    raw_emb = response.get("embedding", [])
                    if isinstance(raw_emb, dict) and "values" in raw_emb:
                        val = raw_emb["values"]
                    else:
                        val = raw_emb

                    if val and len(val) == EMBEDDING_DIMENSION:
                        emb = val
                        break
                    elif val and len(val) > EMBEDDING_DIMENSION:
                        emb = val[:EMBEDDING_DIMENSION]
                        break
                except Exception as e:
                    last_err = e
                    continue

            if emb:
                results.append(emb)
            else:
                err_detail = f"{type(last_err).__name__}: {last_err}" if last_err else "Semua model embedding gagal."
                logger.error(f"Gemini embedding error: {err_detail}")
                raise RuntimeError(f"Gagal menghasilkan representasi vektor: {err_detail}")

        return results
