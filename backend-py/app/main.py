"""FastAPI main application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_database
from .routers import auth, matrix, user, orgs, repos, search, ai_chat, github, incentive
from .models import incentive as incentive_models  # Ensure tables are created

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting Yu Developer Platform Backend (Python)")
    print(f"📝 Environment: development")
    print(f"🔗 Matrix server: {settings.matrix_homeserver_url}")

    await init_database()

    yield

    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Yu Developer Platform API",
    description="Backend API for the Yu Developer Platform with AI chat capabilities",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware - 允许前端和Cinny访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.cors_origin,  # OP-web frontend
        "http://localhost:3001",  # Cinny frontend
        "http://127.0.0.1:3001",  # Cinny frontend (alternative)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(matrix.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(orgs.router, prefix="/api")
app.include_router(repos.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")
app.include_router(github.router, prefix="/api")
app.include_router(incentive.router, prefix="/api/incentive")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Backend service is running"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Yu Developer Platform API",
        "version": "2.0.0",
        "docs": "/docs",
    }
