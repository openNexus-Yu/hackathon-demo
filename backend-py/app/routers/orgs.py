"""Organizations router."""

import random
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from ..database import async_session, Organization
from ..models.schemas import OrganizationCreate, PlatformsUpdate

router = APIRouter(prefix="/orgs", tags=["organizations"])


@router.get("")
async def list_organizations():
    """List all organizations added to the platform."""
    async with async_session() as session:
        result = await session.execute(
            select(Organization).order_by(Organization.id.desc())
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


@router.get("/{name}")
async def get_org_by_name(name: str):
    """Get organization details by name."""
    async with async_session() as session:
        result = await session.execute(
            select(Organization).where(Organization.org_name == name)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        return {
            "id": org.id,
            "github_org_id": org.github_org_id,
            "org_name": org.org_name,
            "avatar_url": org.avatar_url,
            "description": org.description,
            "member_count": org.member_count,
            "platforms": org.platforms or ["GitHub"],
        }


@router.delete("/{github_org_id}")
async def delete_organization(github_org_id: int):
    """Remove an organization from the platform."""
    async with async_session() as session:
        result = await session.execute(
            select(Organization).where(Organization.github_org_id == github_org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        await session.delete(org)
        await session.commit()

        return {"message": f"Organization {org.org_name} has been removed"}


@router.post("")
async def create_organization(request: OrganizationCreate):
    """Create or update an organization (upsert)."""
    if not request.orgName:
        raise HTTPException(status_code=400, detail="Organization name is required")

    # Generate a pseudo-random ID if not provided
    github_org_id = request.githubOrgId or (random.randint(1000, 1000000))

    async with async_session() as session:
        # Use upsert: insert or update if exists
        stmt = insert(Organization).values(
            github_org_id=github_org_id,
            org_name=request.orgName,
            avatar_url=request.avatarUrl,
            description=request.description,
            member_count=request.memberCount or 1,
        ).on_conflict_do_update(
            index_elements=[Organization.github_org_id],
            set_={
                "org_name": request.orgName,
                "avatar_url": request.avatarUrl,
                "description": request.description,
                "member_count": request.memberCount or 1,
            },
        ).returning(Organization.id, Organization.github_org_id, Organization.org_name)
        
        result = await session.execute(stmt)
        await session.commit()
        row = result.fetchone()

        return {
            "id": row.id,
            "github_org_id": row.github_org_id,
            "org_name": row.org_name,
        }


@router.get("/{org_id}/platforms")
async def get_org_platforms(org_id: int):
    """Get organization platforms by github_org_id."""
    async with async_session() as session:
        result = await session.execute(
            select(Organization).where(Organization.github_org_id == org_id)
        )
        org = result.scalar_one_or_none()

        return {"platforms": org.platforms if org else ["GitHub"]}


@router.put("/{org_id}/platforms")
async def update_org_platforms(org_id: int, request: PlatformsUpdate):
    """Update organization platforms."""
    if not isinstance(request.platforms, list):
        raise HTTPException(status_code=400, detail="platforms must be an array")

    async with async_session() as session:
        result = await session.execute(
            select(Organization).where(Organization.github_org_id == org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        org.platforms = request.platforms
        await session.commit()
        await session.refresh(org)

        return {
            "id": org.id,
            "github_org_id": org.github_org_id,
            "org_name": org.org_name,
            "platforms": org.platforms,
        }
