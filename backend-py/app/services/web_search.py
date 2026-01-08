"""Web search service supporting Google Custom Search and Serper."""

from typing import List
import httpx

from ..config import get_settings
from ..models.schemas import SearchResult

settings = get_settings()


class WebSearchService:
    """Service for web search using Google or Serper APIs."""

    async def search(self, query: str) -> List[SearchResult]:
        """Search the web using available API."""
        api_key = settings.web_search_api_key

        if not api_key:
            print("[WebSearch] No API key configured, returning mock results")
            return self._get_mock_results(query)

        # Check for Google API Key (starts with AIza)
        if api_key.startswith("AIza"):
            return await self._search_google(query, api_key)

        # Otherwise try Serper
        return await self._search_serper(query, api_key)

    async def _search_google(self, query: str, api_key: str) -> List[SearchResult]:
        """Search using Google Custom Search API."""
        cx = settings.web_search_cx

        if not cx:
            print("[WebSearch] Google API Key detected but WEB_SEARCH_CX is missing")
            return self._get_mock_results(query, "[Config Error] Missing WEB_SEARCH_CX")

        async with httpx.AsyncClient() as client:
            try:
                print(f"[WebSearch] Searching via Google Custom Search for: {query}")
                response = await client.get(
                    "https://www.googleapis.com/customsearch/v1",
                    params={"key": api_key, "cx": cx, "q": query, "num": 10},
                )

                if response.status_code != 200:
                    error_msg = response.json().get("error", {}).get("message", "Unknown error")
                    return self._get_mock_results(query, f"[Google API Error] {error_msg}")

                items = response.json().get("items", [])
                return [
                    SearchResult(
                        source="web",
                        title=item["title"],
                        url=item["link"],
                        snippet=item.get("snippet", ""),
                    )
                    for item in items
                ]

            except Exception as e:
                print(f"[WebSearch] Google API Error: {e}")
                return self._get_mock_results(query, f"[Error] {str(e)}")

    async def _search_serper(self, query: str, api_key: str) -> List[SearchResult]:
        """Search using Serper API."""
        async with httpx.AsyncClient() as client:
            try:
                print(f"[WebSearch] Searching via Serper for: {query}")
                response = await client.post(
                    "https://google.serper.dev/search",
                    json={"q": query, "num": 5},
                    headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                )

                if response.status_code != 200:
                    return self._get_mock_results(query, "[Serper API Error]")

                organic = response.json().get("organic", [])
                return [
                    SearchResult(
                        source="web",
                        title=item["title"],
                        url=item["link"],
                        snippet=item.get("snippet", ""),
                    )
                    for item in organic
                ]

            except Exception as e:
                print(f"[WebSearch] Serper API Error: {e}")
                return self._get_mock_results(query)

    def _get_mock_results(self, query: str, error_msg: str = None) -> List[SearchResult]:
        """Return mock results when API is unavailable."""
        return [
            SearchResult(
                source="web",
                title=f"[Mock] Result for {query}",
                url="https://example.com",
                snippet=error_msg or "This is a mock search result. Configure WEB_SEARCH_API_KEY for real results.",
            ),
            SearchResult(
                source="web",
                title="[Mock] Another Web Result",
                url="https://example.org",
                snippet="More information found on the internet.",
            ),
        ]


# Singleton instance
web_search_service = WebSearchService()
