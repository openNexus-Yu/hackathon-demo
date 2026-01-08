"""Repository settings router."""

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from ..database import async_session, RepositorySettings
from ..models.schemas import RepoSettingsUpdate, BatchRepoSettingsRequest

router = APIRouter(prefix="/repos", tags=["repositories"])


@router.get("/{repo_id}/settings")
async def get_repo_settings(repo_id: int):
    """Get repository settings."""
    async with async_session() as session:
        result = await session.execute(
            select(RepositorySettings).where(
                RepositorySettings.github_repo_id == repo_id
            )
        )
        settings = result.scalar_one_or_none()

        if not settings:
            return {"platforms": ["GitHub"]}

        return {
            "github_repo_id": settings.github_repo_id,
            "repo_full_name": settings.repo_full_name,
            "platforms": settings.platforms or ["GitHub"],
        }


@router.post("/batch-settings")
async def get_batch_repo_settings(request: BatchRepoSettingsRequest):
    """Get settings for multiple repositories."""
    if not isinstance(request.repoIds, list):
        raise HTTPException(status_code=400, detail="repoIds must be an array")

    if not request.repoIds:
        return {}

    async with async_session() as session:
        result = await session.execute(
            select(RepositorySettings).where(
                RepositorySettings.github_repo_id.in_(request.repoIds)
            )
        )
        settings_list = result.scalars().all()

        settings_map = {}
        for s in settings_list:
            settings_map[s.github_repo_id] = {
                "github_repo_id": s.github_repo_id,
                "repo_full_name": s.repo_full_name,
                "platforms": s.platforms or ["GitHub"],
            }

        return settings_map


@router.put("/{repo_id}/platforms")
async def update_repo_platforms(repo_id: int, request: RepoSettingsUpdate):
    """Update repository platforms."""
    if not isinstance(request.platforms, list):
        raise HTTPException(status_code=400, detail="platforms must be an array")

    async with async_session() as session:
        stmt = insert(RepositorySettings).values(
            github_repo_id=repo_id,
            repo_full_name=request.repoFullName or f"repo-{repo_id}",
            platforms=request.platforms,
        ).on_conflict_do_update(
            index_elements=[RepositorySettings.github_repo_id],
            set_={"platforms": request.platforms},
        )
        await session.execute(stmt)
        await session.commit()

        result = await session.execute(
            select(RepositorySettings).where(
                RepositorySettings.github_repo_id == repo_id
            )
        )
        settings = result.scalar_one()

        return {
            "github_repo_id": settings.github_repo_id,
            "repo_full_name": settings.repo_full_name,
            "platforms": settings.platforms,
        }
