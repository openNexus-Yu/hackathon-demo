"""RAG service for semantic search using pgvector."""

from typing import List, Optional
from datetime import datetime
from openai import AsyncOpenAI
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert

from ..config import get_settings
from ..database import async_session, ChatMessageEmbedding
from ..models.schemas import ChatMessageSource

settings = get_settings()


class RAGService:
    """
    RAG (Retrieval Augmented Generation) service using pgvector for embeddings.
    """

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_api_base,
        )
        self.embedding_model = "text-embedding-3-small"  # OpenAI embedding model
        self.embedding_dimension = 1536

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text."""
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"[RAG] Error getting embedding: {e}")
            # Return zero vector on error
            return [0.0] * self.embedding_dimension

    async def store_message_embedding(
        self,
        room_id: str,
        event_id: str,
        sender: str,
        content: str,
        timestamp: datetime,
    ) -> bool:
        """Store a message with its embedding in the database."""
        try:
            embedding = await self.get_embedding(content)

            async with async_session() as session:
                stmt = insert(ChatMessageEmbedding).values(
                    room_id=room_id,
                    event_id=event_id,
                    sender=sender,
                    content=content,
                    timestamp=timestamp,
                    embedding=embedding,
                ).on_conflict_do_nothing(index_elements=[ChatMessageEmbedding.event_id])

                await session.execute(stmt)
                await session.commit()
                return True

        except Exception as e:
            print(f"[RAG] Error storing embedding: {e}")
            return False

    async def store_messages_batch(
        self, messages: List[ChatMessageSource], event_ids: List[str]
    ) -> int:
        """Store multiple messages with embeddings."""
        stored_count = 0
        for msg, event_id in zip(messages, event_ids):
            if await self.store_message_embedding(
                room_id=msg.room_id,
                event_id=event_id,
                sender=msg.sender,
                content=msg.content,
                timestamp=msg.timestamp,
            ):
                stored_count += 1
        return stored_count

    async def semantic_search(
        self,
        query: str,
        room_ids: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[ChatMessageSource]:
        """
        Search for semantically similar messages using pgvector.
        """
        try:
            query_embedding = await self.get_embedding(query)

            async with async_session() as session:
                # Build query with cosine distance
                if room_ids:
                    # Filter by room IDs
                    sql = text("""
                        SELECT room_id, sender, content, timestamp,
                               1 - (embedding <=> :embedding) as similarity
                        FROM chat_message_embeddings
                        WHERE room_id = ANY(:room_ids)
                        ORDER BY embedding <=> :embedding
                        LIMIT :limit
                    """)
                    result = await session.execute(
                        sql,
                        {
                            "embedding": str(query_embedding),
                            "room_ids": room_ids,
                            "limit": limit,
                        },
                    )
                else:
                    # Search all rooms
                    sql = text("""
                        SELECT room_id, sender, content, timestamp,
                               1 - (embedding <=> :embedding) as similarity
                        FROM chat_message_embeddings
                        ORDER BY embedding <=> :embedding
                        LIMIT :limit
                    """)
                    result = await session.execute(
                        sql,
                        {"embedding": str(query_embedding), "limit": limit},
                    )

                rows = result.fetchall()

                return [
                    ChatMessageSource(
                        room_id=row.room_id,
                        sender=row.sender,
                        content=row.content,
                        timestamp=row.timestamp,
                    )
                    for row in rows
                ]

        except Exception as e:
            print(f"[RAG] Error in semantic search: {e}")
            return []

    async def get_relevant_context(
        self,
        query: str,
        room_ids: Optional[List[str]] = None,
        max_tokens: int = 2000,
    ) -> tuple[str, List[ChatMessageSource]]:
        """
        Get relevant context for a query, formatted for LLM consumption.
        
        Returns (context_string, source_messages)
        """
        messages = await self.semantic_search(query, room_ids, limit=20)

        if not messages:
            return "", []

        # Build context string, respecting token limit (roughly 4 chars per token)
        context_parts = []
        total_chars = 0
        max_chars = max_tokens * 4
        included_messages = []

        for msg in messages:
            msg_text = f"[{msg.sender}] ({msg.timestamp.strftime('%Y-%m-%d %H:%M')}): {msg.content}"
            if total_chars + len(msg_text) > max_chars:
                break
            context_parts.append(msg_text)
            total_chars += len(msg_text)
            included_messages.append(msg)

        context = "\n".join(context_parts)
        return context, included_messages


# Singleton instance
rag_service = RAGService()
