"""AI Chat router for chat with Matrix room context."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header

from ..config import get_settings
from ..models.schemas import AIChatRequest, AIChatResponse, ChatMessageSource
from ..services.matrix_messages import matrix_messages_service
from ..services.rag_service import rag_service
from ..services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    request: AIChatRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Chat with AI using Matrix room messages as context.
    
    The AI will search through chat history to find relevant information
    and generate a helpful response.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    # Get Matrix token if provided
    matrix_token = None
    if authorization and authorization.startswith("Bearer "):
        matrix_token = authorization.replace("Bearer ", "")

    sources: List[ChatMessageSource] = []
    context = ""

    # Use provided search context from Cinny if available
    if request.search_context:
        context = request.search_context
    else:
        # Try semantic search first (if embeddings exist)
        context, sources = await rag_service.get_relevant_context(
            request.message,
            room_ids=request.room_ids,
        )

    # If no results from RAG and we have a Matrix token, try direct search
    if not sources and matrix_token:
        sources = await matrix_messages_service.search_messages(
            query=request.message,
            access_token=matrix_token,
            room_ids=request.room_ids,
            limit=10,
        )

        if sources:
            context = "\n".join(
                [
                    f"[{msg.sender}] ({msg.timestamp.strftime('%Y-%m-%d %H:%M')}): {msg.content}"
                    for msg in sources
                ]
            )

    # Generate AI response
    if context:
        answer = await llm_service.chat_with_context(
            message=request.message,
            chat_context=context,
        )
    else:
        # No context available, generate response without chat history
        answer = await llm_service.chat_with_context(
            message=request.message,
            chat_context="No relevant chat messages found in the rooms.",
        )

    # Add room names to sources if we have a token
    if matrix_token and sources:
        for source in sources:
            room_name = await matrix_messages_service.get_room_name(
                source.room_id, matrix_token
            )
            source.room_name = room_name

    return AIChatResponse(answer=answer, sources=sources)


@router.post("/index-room")
async def index_room(
    room_id: str,
    authorization: str = Header(...),
    limit: int = 500,
):
    """
    Index messages from a room for semantic search.
    
    This fetches recent messages and stores their embeddings for RAG.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Matrix token required")

    matrix_token = authorization.replace("Bearer ", "")

    # Get messages from room
    messages, _ = await matrix_messages_service.get_room_messages(
        room_id=room_id,
        access_token=matrix_token,
        limit=limit,
    )

    if not messages:
        return {"indexed": 0, "message": "No messages found in room"}

    # Generate fake event IDs (in real implementation, get actual event IDs)
    event_ids = [f"{room_id}:{i}" for i in range(len(messages))]

    # Store embeddings
    indexed_count = await rag_service.store_messages_batch(messages, event_ids)

    return {
        "indexed": indexed_count,
        "total_messages": len(messages),
        "message": f"Successfully indexed {indexed_count} messages",
    }


@router.get("/search")
async def search_messages(
    query: str,
    room_ids: Optional[str] = None,
    limit: int = 10,
    authorization: Optional[str] = Header(None),
):
    """
    Search for messages semantically.
    
    Uses vector similarity search on indexed messages.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    room_id_list = room_ids.split(",") if room_ids else None

    # Search using RAG
    messages = await rag_service.semantic_search(
        query=query,
        room_ids=room_id_list,
        limit=limit,
    )

    # If no results from RAG and we have a token, fall back to Matrix search
    if not messages and authorization and authorization.startswith("Bearer "):
        matrix_token = authorization.replace("Bearer ", "")
        messages = await matrix_messages_service.search_messages(
            query=query,
            access_token=matrix_token,
            room_ids=room_id_list,
            limit=limit,
        )

    return {"results": messages, "count": len(messages)}
