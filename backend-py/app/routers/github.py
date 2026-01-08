"""GitHub data routes for fetching contributions and repos."""

from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/contributions/{username}")
async def get_contributions(username: str, token: str = Query(...)):
    """Fetch GitHub contribution data using GraphQL API."""
    query = """
    query($username: String!) {
        user(login: $username) {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                            weekday
                            color
                        }
                    }
                }
            }
        }
    }
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": {"username": username}},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch contributions")
        
        data = response.json()
        
        if "errors" in data:
            raise HTTPException(status_code=400, detail=data["errors"][0]["message"])
        
        calendar = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
        
        # Convert to activity-calendar format
        contributions = []
        for week in calendar["weeks"]:
            for day in week["contributionDays"]:
                count = day["contributionCount"]
                # Map to level 0-4
                if count == 0:
                    level = 0
                elif count <= 3:
                    level = 1
                elif count <= 6:
                    level = 2
                elif count <= 9:
                    level = 3
                else:
                    level = 4
                    
                contributions.append({
                    "date": day["date"],
                    "count": count,
                    "level": level,
                })
        
        return {
            "total": calendar["totalContributions"],
            "contributions": contributions,
        }


@router.get("/repos/{username}")
async def get_all_repos(username: str, token: str = Query(...), page: int = 1, per_page: int = 100):
    """Fetch all repositories for a user."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/users/{username}/repos",
            params={"sort": "updated", "page": page, "per_page": per_page},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repos")
        
        return response.json()


@router.get("/orgs")
async def get_user_orgs(token: str = Query(...)):
    """Fetch all organizations the authenticated user belongs to."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/orgs",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch orgs")
        
        orgs = response.json()
        
        # Return simplified org data
        return [
            {
                "id": org["id"],
                "login": org["login"],
                "avatar_url": org["avatar_url"],
                "description": org.get("description", ""),
            }
            for org in orgs
        ]


@router.get("/orgs/{org}/repos")
async def get_org_repos(org: str, token: str = Query(...), page: int = 1, per_page: int = 30):
    """Fetch repositories for a specific organization."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/orgs/{org}/repos",
            params={"sort": "updated", "page": page, "per_page": per_page},
            headers={"Authorization": f"Bearer {token}"},
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch org repos")
        
        return response.json()
