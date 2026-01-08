"""Matrix messages service for reading chat room history."""

from typing import List, Optional
from datetime import datetime
import httpx

from ..config import get_settings
from ..models.schemas import ChatMessageSource

settings = get_settings()


class MatrixMessagesService:
    """Service for reading Matrix room messages."""

    def __init__(self):
        self.homeserver_url = settings.matrix_homeserver_url

    async def get_room_messages(
        self,
        room_id: str,
        access_token: str,
        limit: int = 100,
        from_token: Optional[str] = None,
    ) -> tuple[List[ChatMessageSource], Optional[str]]:
        """
        Get messages from a room.
        
        Returns tuple of (messages, next_batch_token)
        """
        messages = []

        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "dir": "b",  # backwards from the latest
                    "limit": limit,
                }
                if from_token:
                    params["from"] = from_token

                response = await client.get(
                    f"{self.homeserver_url}/_matrix/client/v3/rooms/{room_id}/messages",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=params,
                )

                if response.status_code != 200:
                    print(f"[Matrix] Failed to get messages: {response.status_code}")
                    return [], None

                data = response.json()
                next_token = data.get("end")

                for event in data.get("chunk", []):
                    if event.get("type") == "m.room.message":
                        content = event.get("content", {})
                        body = content.get("body", "")

                        if body:  # Only include non-empty messages
                            messages.append(
                                ChatMessageSource(
                                    room_id=room_id,
                                    sender=event.get("sender", ""),
                                    content=body,
                                    timestamp=datetime.fromtimestamp(
                                        event.get("origin_server_ts", 0) / 1000
                                    ),
                                )
                            )

                return messages, next_token

            except Exception as e:
                print(f"[Matrix] Error getting messages: {e}")
                return [], None

    async def get_room_name(self, room_id: str, access_token: str) -> Optional[str]:
        """Get room display name."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.homeserver_url}/_matrix/client/v3/rooms/{room_id}/state/m.room.name",
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                if response.status_code == 200:
                    return response.json().get("name")
                return None

            except Exception:
                return None

    async def get_user_joined_rooms(self, access_token: str) -> List[str]:
        """Get list of rooms the user has joined."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.homeserver_url}/_matrix/client/v3/joined_rooms",
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                if response.status_code == 200:
                    return response.json().get("joined_rooms", [])
                return []

            except Exception as e:
                print(f"[Matrix] Error getting joined rooms: {e}")
                return []

    async def search_messages(
        self,
        query: str,
        access_token: str,
        room_ids: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[ChatMessageSource]:
        """
        Search for messages using Matrix search API.
        
        Note: This requires the homeserver to have search enabled.
        Falls back to manual search if search API is not available.
        """
        async with httpx.AsyncClient() as client:
            try:
                search_body = {
                    "search_categories": {
                        "room_events": {
                            "search_term": query,
                            "keys": ["content.body"],
                            "order_by": "recent",
                        }
                    }
                }

                if room_ids:
                    search_body["search_categories"]["room_events"]["filter"] = {
                        "rooms": room_ids
                    }

                response = await client.post(
                    f"{self.homeserver_url}/_matrix/client/v3/search",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=search_body,
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("search_categories", {}).get("room_events", {}).get("results", [])

                    messages = []
                    for result in results[:limit]:
                        event = result.get("result", {})
                        if event.get("type") == "m.room.message":
                            content = event.get("content", {})
                            messages.append(
                                ChatMessageSource(
                                    room_id=event.get("room_id", ""),
                                    sender=event.get("sender", ""),
                                    content=content.get("body", ""),
                                    timestamp=datetime.fromtimestamp(
                                        event.get("origin_server_ts", 0) / 1000
                                    ),
                                )
                            )
                    return messages

                # If search API fails, fall back to getting recent messages
                print(f"[Matrix] Search API not available, using fallback")
                return await self._fallback_search(query, access_token, room_ids, limit)

            except Exception as e:
                print(f"[Matrix] Search error: {e}")
                return await self._fallback_search(query, access_token, room_ids, limit)

    async def _fallback_search(
        self,
        query: str,
        access_token: str,
        room_ids: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[ChatMessageSource]:
        """Fallback search by fetching recent messages and filtering."""
        if not room_ids:
            room_ids = await self.get_user_joined_rooms(access_token)

        matching_messages = []
        query_lower = query.lower()

        for room_id in room_ids[:5]:  # Limit to 5 rooms for performance
            messages, _ = await self.get_room_messages(room_id, access_token, limit=50)
            for msg in messages:
                if query_lower in msg.content.lower():
                    matching_messages.append(msg)
                    if len(matching_messages) >= limit:
                        return matching_messages

        return matching_messages


# Singleton instance
matrix_messages_service = MatrixMessagesService()
