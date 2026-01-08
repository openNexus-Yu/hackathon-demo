"""Database module with SQLAlchemy async support and optional pgvector."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ARRAY, BigInteger, text
from sqlalchemy.sql import func

from .config import get_settings

settings = get_settings()

# Flag to track if pgvector is available
PGVECTOR_AVAILABLE = False

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


# Models matching existing database schema
class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True)
    github_user_id = Column(Integer, unique=True, nullable=False)
    github_username = Column(String(255), nullable=False)
    pinned_repos = Column(ARRAY(Integer), default=[])
    platform_orgs = Column(ARRAY(String(255)), default=[])
    matrix_user_id = Column(String(255))
    matrix_access_token = Column(Text)
    matrix_device_id = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    github_org_id = Column(Integer, unique=True, nullable=False)
    org_name = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    description = Column(Text)
    member_count = Column(Integer, default=0)
    added_by_user_id = Column(Integer)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    platforms = Column(ARRAY(Text), default=["GitHub"])


class RepositorySettings(Base):
    __tablename__ = "repository_settings"

    id = Column(Integer, primary_key=True)
    github_repo_id = Column(BigInteger, unique=True, nullable=False)
    repo_full_name = Column(String(255), nullable=False)
    platforms = Column(ARRAY(Text), default=["GitHub"])
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


# Chat message embeddings table - stores embeddings as JSON when pgvector not available
class ChatMessageEmbedding(Base):
    __tablename__ = "chat_message_embeddings"

    id = Column(Integer, primary_key=True)
    room_id = Column(String(255), nullable=False, index=True)
    event_id = Column(String(255), unique=True, nullable=False)
    sender = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(TIMESTAMP, nullable=False)
    # Embedding stored as JSON text since pgvector may not be available
    embedding_json = Column(Text)


# Import incentive models to ensure they're registered with Base
# This import is at the end to avoid circular imports
def _import_incentive_models():
    from .models.incentive import (
        Campaign, Activity, Task, TaskClaim, UserPoints, Prize, PrizeRedemption
    )

_import_incentive_models()


async def get_db():
    """Dependency to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_database():
    """Initialize database tables. pgvector extension is optional."""
    global PGVECTOR_AVAILABLE

    # First try to enable pgvector in a separate connection
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            PGVECTOR_AVAILABLE = True
            print("✅ pgvector extension enabled")
    except Exception as e:
        PGVECTOR_AVAILABLE = False
        print(f"⚠️ pgvector not available: {e}")
        print("   AI embeddings will be stored as JSON (slower search)")

    # Create tables in a new connection (regardless of pgvector status)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise
