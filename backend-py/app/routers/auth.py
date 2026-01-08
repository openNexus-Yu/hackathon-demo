"""Auth router for GitHub OAuth."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from ..config import get_settings
from ..database import async_session, UserPreferences
from ..models.schemas import GitHubCallbackRequest, AuthResponse, GitHubUser, MatrixCredentials
from ..services.matrix_service import create_matrix_account

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.get("/github")
async def github_auth(reauth: bool = False):
    """Redirect to GitHub for authentication."""
    scopes = "user:email read:org repo"
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        f"&scope={scopes}"
    )

    if reauth:
        github_auth_url += "&prompt=consent"

    return RedirectResponse(url=github_auth_url)


@router.post("/github/callback", response_model=AuthResponse)
async def github_callback(request: GitHubCallbackRequest):
    """Handle GitHub OAuth callback."""
    if not request.code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    async with httpx.AsyncClient() as client:
        # Exchange code for GitHub access token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": request.code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )

        if token_response.status_code != 200:
            error_detail = token_response.text
            print(f"[Auth] GitHub token exchange failed: {token_response.status_code} - {error_detail}")
            raise HTTPException(status_code=500, detail=f"Failed to exchange code for token: {error_detail}")

        token_data = token_response.json()
        github_token = token_data.get("access_token")

        if not github_token:
            print(f"[Auth] No access_token in response: {token_data}")
            # Check if there's an error in the response
            if "error" in token_data:
                raise HTTPException(status_code=500, detail=f"GitHub OAuth error: {token_data.get('error_description', token_data['error'])}")
            raise HTTPException(status_code=500, detail="Failed to get GitHub access token")

        # Get GitHub user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}"},
        )

        if user_response.status_code != 200:
            error_detail = user_response.text
            print(f"[Auth] GitHub user API failed: {user_response.status_code} - {error_detail}")
            raise HTTPException(status_code=500, detail=f"Failed to get GitHub user info: {error_detail}")

        github_user_data = user_response.json()
        github_user = GitHubUser(
            login=github_user_data["login"],
            id=github_user_data["id"],
            avatar_url=github_user_data["avatar_url"],
            name=github_user_data.get("name"),
            email=github_user_data.get("email"),
        )

    # Create or login Matrix account
    matrix_credentials = await create_matrix_account(
        github_user.login, github_user.id, github_user.name
    )

    # Save user preferences with Matrix credentials
    async with async_session() as session:
        stmt = insert(UserPreferences).values(
            github_user_id=github_user.id,
            github_username=github_user.login,
            matrix_user_id=matrix_credentials.user_id,
            matrix_access_token=matrix_credentials.access_token,
            matrix_device_id=matrix_credentials.device_id,
        ).on_conflict_do_update(
            index_elements=[UserPreferences.github_user_id],
            set_={
                "github_username": github_user.login,
                "matrix_user_id": matrix_credentials.user_id,
                "matrix_access_token": matrix_credentials.access_token,
                "matrix_device_id": matrix_credentials.device_id,
            },
        )
        await session.execute(stmt)
        await session.commit()

    return AuthResponse(
        github_token=github_token,
        user=github_user,
        matrix_credentials=matrix_credentials,
    )
