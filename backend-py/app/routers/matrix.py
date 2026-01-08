"""Matrix router for room management."""

from fastapi import APIRouter, HTTPException, Header
import httpx

from ..config import get_settings
from ..models.schemas import CreateRoomRequest, CreateRoomResponse, EnsureBotInRoomsRequest

router = APIRouter(prefix="/matrix", tags=["matrix"])
settings = get_settings()


async def get_matrix_client_headers(authorization: str) -> dict:
    """Extract Matrix token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Matrix token required")
    return {"Authorization": authorization}


@router.post("/create-room", response_model=CreateRoomResponse)
async def create_room(
    request: CreateRoomRequest,
    authorization: str = Header(...),
):
    """Create or join a Matrix room for a project."""
    matrix_token = authorization.replace("Bearer ", "")
    homeserver_url = settings.matrix_homeserver_url
    server_name = settings.matrix_server_name

    room_alias = f"#opensource-{request.project_name}:{server_name}"
    local_alias = f"opensource-{request.project_name}"

    async with httpx.AsyncClient() as client:
        # Try to find existing room by alias
        try:
            alias_response = await client.get(
                f"{homeserver_url}/_matrix/client/v3/directory/room/{room_alias}",
                headers={"Authorization": f"Bearer {matrix_token}"},
            )

            if alias_response.status_code == 200:
                room_id = alias_response.json()["room_id"]

                # Try to join the existing room
                join_response = await client.post(
                    f"{homeserver_url}/_matrix/client/v3/join/{room_alias}",
                    headers={"Authorization": f"Bearer {matrix_token}"},
                )

                if join_response.status_code == 200:
                    return CreateRoomResponse(
                        room_id=room_id,
                        room_alias=room_alias,
                        action="joined",
                        message="Room already exists. Joined successfully.",
                    )

                # Check if already in room (403 with specific message)
                if join_response.status_code == 403:
                    error_data = join_response.json()
                    if "already in the room" in error_data.get("error", ""):
                        return CreateRoomResponse(
                            room_id=room_id,
                            room_alias=room_alias,
                            action="already_joined",
                            message="Already in the room.",
                        )

        except Exception as e:
            print(f"[Matrix] Alias lookup error: {e}")

        # Create new public room
        create_response = await client.post(
            f"{homeserver_url}/_matrix/client/v3/createRoom",
            headers={"Authorization": f"Bearer {matrix_token}"},
            json={
                "name": f"opensource-{request.project_name}",
                "topic": f"Discussion room for {request.project_name}"
                + (f"\n{request.github_url}" if request.github_url else ""),
                "visibility": "public",
                "preset": "public_chat",
                "room_alias_name": local_alias,
            },
        )

        if create_response.status_code != 200:
            error_data = create_response.json()
            if error_data.get("errcode") == "M_ROOM_IN_USE":
                raise HTTPException(
                    status_code=409,
                    detail="Room already exists. A room for this project already exists.",
                )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create room: {error_data.get('error', 'Unknown error')}",
            )

        room_id = create_response.json()["room_id"]

        return CreateRoomResponse(
            room_id=room_id,
            room_alias=room_alias,
            action="created",
            message="Room created successfully.",
        )


@router.post("/ensure-bot-in-rooms")
async def ensure_bot_in_rooms(request: EnsureBotInRoomsRequest):
    """Ensure bot is in all specified rooms."""
    # TODO: Implement bot keeper logic
    results = []
    for room_id in request.room_ids:
        results.append({"room_id": room_id, "status": "pending"})

    return {"results": results}
