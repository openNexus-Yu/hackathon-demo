"""User router for preferences and organizations."""

import hashlib
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert

from ..config import get_settings
from ..database import async_session, UserPreferences, Organization
from ..models.schemas import (
    UserPreferencesUpdate,
    UserPreferencesResponse,
    OrganizationCreate,
    OrganizationResponse,
)

router = APIRouter(prefix="/user", tags=["user"])
settings = get_settings()


@router.get("/preferences/{github_user_id}")
async def get_preferences(github_user_id: int):
    """Get user preferences."""
    async with async_session() as session:
        result = await session.execute(
            select(UserPreferences).where(
                UserPreferences.github_user_id == github_user_id
            )
        )
        prefs = result.scalar_one_or_none()

        if not prefs:
            return {"pinnedRepos": [], "platformOrgs": []}

        return {
            "github_user_id": prefs.github_user_id,
            "github_username": prefs.github_username,
            "pinned_repos": prefs.pinned_repos or [],
            "platform_orgs": prefs.platform_orgs or [],
        }


@router.post("/preferences")
async def update_preferences(request: UserPreferencesUpdate):
    """Update user preferences."""
    if not request.githubUserId or not request.githubUsername:
        raise HTTPException(
            status_code=400, detail="githubUserId and githubUsername are required"
        )

    async with async_session() as session:
        stmt = insert(UserPreferences).values(
            github_user_id=request.githubUserId,
            github_username=request.githubUsername,
            pinned_repos=request.pinnedRepos or [],
            platform_orgs=request.platformOrgs or [],
        ).on_conflict_do_update(
            index_elements=[UserPreferences.github_user_id],
            set_={
                "github_username": request.githubUsername,
                "pinned_repos": request.pinnedRepos or [],
                "platform_orgs": request.platformOrgs or [],
            },
        )
        await session.execute(stmt)
        await session.commit()

        # Fetch updated record
        result = await session.execute(
            select(UserPreferences).where(
                UserPreferences.github_user_id == request.githubUserId
            )
        )
        prefs = result.scalar_one()

        return {
            "github_user_id": prefs.github_user_id,
            "github_username": prefs.github_username,
            "pinned_repos": prefs.pinned_repos or [],
            "platform_orgs": prefs.platform_orgs or [],
        }


@router.get("/organizations")
async def get_organizations():
    """Get all platform organizations."""
    async with async_session() as session:
        result = await session.execute(
            select(Organization).order_by(Organization.joined_at.desc())
        )
        orgs = result.scalars().all()

        return [
            {
                "id": org.id,
                "github_org_id": org.github_org_id,
                "org_name": org.org_name,
                "avatar_url": org.avatar_url,
                "description": org.description,
                "member_count": org.member_count,
                "platforms": org.platforms or ["GitHub"],
            }
            for org in orgs
        ]


@router.post("/organizations")
async def add_organization(request: OrganizationCreate):
    """Add organization to platform."""
    if not request.orgName:
        raise HTTPException(status_code=400, detail="orgName is required")

    github_org_id = request.githubOrgId
    if not github_org_id:
        raise HTTPException(status_code=400, detail="githubOrgId is required")

    async with async_session() as session:
        stmt = insert(Organization).values(
            github_org_id=github_org_id,
            org_name=request.orgName,
            avatar_url=request.avatarUrl,
            description=request.description,
            member_count=request.memberCount or 0,
            added_by_user_id=request.addedByUserId,
        ).on_conflict_do_nothing(index_elements=[Organization.github_org_id])

        await session.execute(stmt)
        await session.commit()

        result = await session.execute(
            select(Organization).where(Organization.github_org_id == github_org_id)
        )
        org = result.scalar_one_or_none()

        if org:
            return {
                "id": org.id,
                "github_org_id": org.github_org_id,
                "org_name": org.org_name,
            }

        return {"message": "Organization already exists or was not created"}


@router.delete("/organizations/{github_org_id}")
async def remove_organization(github_org_id: int):
    """Remove organization from platform."""
    async with async_session() as session:
        await session.execute(
            delete(Organization).where(Organization.github_org_id == github_org_id)
        )
        await session.commit()

    return {"success": True}


@router.get("/matrix-credentials")
async def get_matrix_credentials(github_user_id: int):
    """Get user's Matrix credentials for auto-login."""
    if not github_user_id:
        raise HTTPException(status_code=400, detail="GitHub user ID is required")

    async with async_session() as session:
        result = await session.execute(
            select(UserPreferences).where(
                UserPreferences.github_user_id == github_user_id
            )
        )
        prefs = result.scalar_one_or_none()

        if not prefs or not prefs.matrix_access_token:
            raise HTTPException(status_code=404, detail="Matrix credentials not found")

        return {
            "user_id": prefs.matrix_user_id,
            "access_token": prefs.matrix_access_token,
            "device_id": prefs.matrix_device_id,
            "home_server": settings.matrix_server_name,
        }


@router.get("/matrix-login-info")
async def get_matrix_login_info(github_user_id: str, github_username: str):
    """Get user's Matrix login info including password."""
    if not github_user_id or not github_username:
        raise HTTPException(
            status_code=400, detail="GitHub user ID and username are required"
        )

    password = hashlib.sha256(
        f"{github_user_id}-{settings.github_client_secret}".encode()
    ).hexdigest()

    import re
    username = re.sub(r"[^a-z0-9._=-]", "", github_username.lower())

    return {
        "server": "localhost:8080",
        "username": username,
        "password": password,
        "user_id": f"@{username}:localhost",
    }
