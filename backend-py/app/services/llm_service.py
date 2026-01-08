"""LLM service for OpenAI-compatible API calls."""

from typing import Optional
from openai import AsyncOpenAI

from ..config import get_settings

settings = get_settings()


class LLMService:
    """Service for interacting with OpenAI-compatible LLM APIs."""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_api_base,
        )
        self.model = settings.openai_model

    async def generate_answer(self, query: str, context: str) -> str:
        """Generate an answer based on query and context."""
        prompt = f"""You are a helpful assistant for the Yu Developer Platform.
User Query: {query}

Context from Search Results:
{context}

Please provide a concise answer or summary based on the context above. If the context doesn't answer the query, try to answer from your general knowledge but mention that search results were insufficient."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=500,
            )
            return response.choices[0].message.content or "No response generated."
        except Exception as e:
            print(f"[LLM] Error generating answer: {e}")
            return "Error connecting to AI service. Please check your configuration."

    async def chat_with_context(
        self, message: str, chat_context: str, conversation_history: Optional[list] = None
    ) -> str:
        """Generate a chat response with Matrix chat room context."""
        system_prompt = """You are an AI assistant that helps users understand and search through chat room conversations.
You have access to relevant chat messages from Matrix rooms. Use these messages to answer the user's questions.
When citing information, mention the sender if relevant. Be concise and helpful."""

        context_prompt = f"""Relevant chat messages from rooms:
{chat_context}

Based on the above context, please answer the user's question."""

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": f"{context_prompt}\n\nUser question: {message}"})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
            )
            return response.choices[0].message.content or "No response generated."
        except Exception as e:
            print(f"[LLM] Error in chat: {e}")
            return f"Error connecting to AI service: {str(e)}"


# Singleton instance
llm_service = LLMService()
