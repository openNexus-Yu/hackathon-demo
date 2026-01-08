"""Search router for web search with AI answer."""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import httpx

from ..models.schemas import SearchRequest, SearchResponse, SearchResult
from ..services.web_search import web_search_service
from ..services.llm_service import llm_service
from ..database import async_session, Organization
from ..config import get_settings
from sqlalchemy import select, or_

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search the web and get AI-generated answer."""
    if not request.query or not isinstance(request.query, str):
        return SearchResponse(answer="Query is required", results=[])

    # Get web search results
    web_results = await web_search_service.search(request.query)

    # TODO: Add platform search results
    platform_results: list[SearchResult] = []

    all_results = platform_results + web_results

    # Prepare context for AI
    context = "\n".join(
        [f"[{r.source.upper()}] {r.title}: {r.snippet}" for r in all_results]
    )

    # Get AI answer
    ai_answer = await llm_service.generate_answer(request.query, context)

    return SearchResponse(answer=ai_answer, results=all_results)


class MatrixServer(BaseModel):
    """Matrix server/community information."""
    id: str
    name: str
    description: str
    homeserver: str
    members_count: int
    rooms_count: int
    category: str
    is_public: bool
    avatar_url: Optional[str] = None
    source: str = "mock"  # mock, database, matrix, web
    org_id: Optional[int] = None  # Link to organization if exists
    room_id: Optional[str] = None  # Matrix room ID
    space_id: Optional[str] = None  # Matrix space ID


class MatrixSearchRequest(BaseModel):
    """Request for Matrix community search."""
    query: str


class MatrixSearchResponse(BaseModel):
    """Response with AI answer and matching Matrix servers."""
    answer: str
    servers: list[MatrixServer]
    query: str


@router.post("/matrix-communities", response_model=MatrixSearchResponse)
async def search_matrix_communities(request: MatrixSearchRequest):
    """Search Matrix communities using AI - integrates orgs, Matrix spaces, and web."""
    # Allow empty query to return all communities
    query_lower = request.query.lower() if request.query else ""
    
    # Extract keywords by removing common terms
    search_terms = request.query if request.query else ""
    # Remove common Chinese/English words that don't add search value
    for stop_word in ['组织', 'organization', 'community', '社区', 'space', '空间', 'the', 'a', 'an']:
        search_terms = search_terms.replace(stop_word, '')
    search_terms = search_terms.strip()
    
    # If search_terms is empty after removing stop words, use original query
    if not search_terms and request.query:
        search_terms = request.query
    
    print(f"Original query: '{request.query}', Search terms: '{search_terms}'")
    
    all_servers: List[MatrixServer] = []
    
    # 1. Search real organizations from database
    async with async_session() as session:
        # Search by name or description (handle NULL descriptions)
        if search_terms and len(search_terms.strip()) > 0:
            # Search with filter using extracted keywords
            stmt = select(Organization).where(
                or_(
                    Organization.org_name.ilike(f"%{search_terms}%"),
                    Organization.description.ilike(f"%{search_terms}%")
                )
            )
        else:
            # Return all organizations if no query
            stmt = select(Organization)
        
        result = await session.execute(stmt)
        orgs = result.scalars().all()
        
        print(f"Found {len(orgs)} organizations in database for search terms: '{search_terms}'")
        
        for org in orgs:
            all_servers.append(MatrixServer(
                id=f"org-{org.id}",
                name=org.org_name,
                description=org.description or "Open source organization",
                homeserver="localhost",  # Use local homeserver
                members_count=org.member_count or 1,
                rooms_count=1,  # Will be updated if Matrix space data is available
                category="Organization",
                is_public=True,
                avatar_url=org.avatar_url,
                source="database",
                org_id=org.id
            ))
    
    # 2. Search Matrix public spaces (using Matrix API if available)
    settings = get_settings()
    try:
        # Search Matrix room directory for public spaces using GET (no auth needed)
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Use GET method which works without authentication
            params = {"limit": 50}
            if request.query:
                params["filter"] = f'{{"generic_search_term": "{request.query}"}}'
            
            response = await client.get(
                f"{settings.matrix_homeserver_url}/_matrix/client/v3/publicRooms",
                params=params
            )
            
            print(f"Matrix API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                rooms = data.get("chunk", [])
                print(f"Found {len(rooms)} Matrix rooms")
                
                for room in rooms:
                    # Filter by query if provided
                    room_name = room.get("name", "")
                    room_topic = room.get("topic", "")
                    room_alias = room.get("canonical_alias", "")
                    
                    # Check if search terms match (case insensitive)
                    if search_terms:
                        query_match = (
                            search_terms.lower() in room_name.lower() or
                            search_terms.lower() in room_topic.lower() or
                            search_terms.lower() in room_alias.lower()
                        )
                    else:
                        query_match = True
                    
                    if query_match:
                        all_servers.append(MatrixServer(
                            id=room["room_id"],
                            name=room.get("name", "Unnamed Room"),
                            description=room.get("topic", "Matrix community space") or f"Matrix space: {room.get('canonical_alias', 'No description')}",
                            homeserver=settings.matrix_server_name,
                            members_count=room.get("num_joined_members", 0),
                            rooms_count=1,
                            category="Matrix Space" if room.get("room_type") == "m.space" else "Matrix Room",
                            is_public=room.get("world_readable", False) or room.get("join_rule") == "public",
                            avatar_url=room.get("avatar_url"),
                            source="matrix",
                            room_id=room["room_id"],
                            space_id=room["room_id"] if room.get("room_type") == "m.space" else None
                        ))
    except Exception as e:
        print(f"Matrix public rooms search failed: {e}")
        import traceback
        traceback.print_exc()
    
    # 3. Add curated mock servers for common queries
    mock_servers = [
        MatrixServer(
            id="1",
            name="Matrix HQ",
            description="Official Matrix.org community space for discussing the protocol, clients, and ecosystem",
            homeserver="matrix.org",
            members_count=15420,
            rooms_count=48,
            category="Official",
            is_public=True,
            source="mock"
        ),
        MatrixServer(
            id="2",
            name="Element Community",
            description="Community space for Element app users, featuring support channels and general discussion",
            homeserver="matrix.org",
            members_count=8932,
            rooms_count=23,
            category="Community",
            is_public=True,
            source="mock"
        ),
        MatrixServer(
            id="3",
            name="Fedora Project",
            description="Fedora Linux community discussions, support, and development coordination",
            homeserver="fedora.im",
            members_count=4521,
            rooms_count=67,
            category="Technology",
            is_public=True,
            source="mock"
        ),
        MatrixServer(
            id="4",
            name="KDE Community",
            description="KDE desktop environment community - developers, designers, and users",
            homeserver="kde.org",
            members_count=3245,
            rooms_count=52,
            category="Open Source",
            is_public=True,
            source="mock"
        ),
        MatrixServer(
            id="5",
            name="Rust Language",
            description="Rust programming language community for learning, discussion, and collaboration",
            homeserver="mozilla.org",
            members_count=6789,
            rooms_count=34,
            category="Programming",
            is_public=True,
            source="mock"
        ),
    ]
    
    # Filter mock servers by relevance using search terms
    search_lower = search_terms.lower() if search_terms else ""
    for server in mock_servers:
        if not search_terms or (
            search_lower in server.name.lower() or
            search_lower in server.description.lower() or
            search_lower in server.category.lower()
        ):
            all_servers.append(server)
    
    # If no matches from any source, return all mock servers
    if not all_servers:
        all_servers = mock_servers
    
    # 4. Search web for additional context (using existing web search)
    web_context = ""
    try:
        web_results = await web_search_service.search(f"Matrix {request.query} community")
        if web_results:
            web_context = "\n".join([
                f"[WEB] {r.title}: {r.snippet}"
                for r in web_results[:3]
            ])
    except Exception as e:
        print(f"Web search failed: {e}")
    
    # Generate AI response
    context_parts = []
    
    # Add organization context
    org_servers = [s for s in all_servers if s.source == "database"]
    if org_servers:
        context_parts.append("Real Organizations:")
        for s in org_servers:
            context_parts.append(f"- {s.name}: {s.description} ({s.members_count} members)")
    
    # Add Matrix spaces context
    matrix_servers = [s for s in all_servers if s.source == "matrix"]
    if matrix_servers:
        context_parts.append("\nMatrix Public Spaces:")
        for s in matrix_servers:
            context_parts.append(f"- {s.name}: {s.description} ({s.members_count} members)")
    
    # Add curated communities
    mock_in_results = [s for s in all_servers if s.source == "mock"]
    if mock_in_results:
        context_parts.append("\nCurated Communities:")
        for s in mock_in_results:
            context_parts.append(f"- {s.name}: {s.description} ({s.members_count} members)")
    
    if web_context:
        context_parts.append(f"\nWeb Information:\n{web_context}")
    
    full_context = "\n".join(context_parts)
    
    # Generate AI answer
    ai_prompt = f"""User is searching for: "{request.query}"

Available resources:
{full_context}

Provide a helpful, conversational response about these communities in 2-3 sentences. 
Mention which are real organizations, Matrix spaces, or curated communities."""
    
    try:
        ai_answer = await llm_service.generate_answer(request.query, full_context)
    except Exception as e:
        print(f"AI generation failed: {e}")
        # Fallback answer
        if org_servers:
            ai_answer = f"I found {len(org_servers)} real organization(s) matching your search: {', '.join([s.name for s in org_servers])}. "
        else:
            ai_answer = "I found several communities that might interest you. "
        
        if matrix_servers:
            ai_answer += f"Plus {len(matrix_servers)} active Matrix space(s). "
        
        ai_answer += f"Total {len(all_servers)} communities available to explore!"
    
    return MatrixSearchResponse(
        answer=ai_answer,
        servers=all_servers[:20],  # Limit to 20 results
        query=request.query
    )
