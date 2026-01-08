"""Matrix service for account creation and management."""

import hashlib
import hmac
import httpx
from typing import Optional

from ..config import get_settings
from ..models.schemas import MatrixCredentials

settings = get_settings()


def generate_admin_mac(
    shared_secret: str, nonce: str, user: str, password: str, admin: bool = False
) -> str:
    """Generate HMAC for shared secret registration."""
    message = f"{nonce}\x00{user}\x00{password}\x00{'admin' if admin else 'notadmin'}"
    return hmac.new(
        shared_secret.encode(), message.encode(), hashlib.sha1
    ).hexdigest()


async def register_with_shared_secret(
    username: str,
    password: str,
    display_name: Optional[str] = None,
    is_admin: bool = False,
) -> dict:
    """Register user via Synapse Admin API with shared secret."""
    shared_secret = settings.matrix_registration_shared_secret
    homeserver_url = settings.matrix_homeserver_url

    if not shared_secret:
        print("[Matrix] No shared secret configured, skipping admin registration")
        return {"success": False}

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Get nonce
            nonce_response = await client.get(
                f"{homeserver_url}/_synapse/admin/v1/register"
            )
            nonce = nonce_response.json()["nonce"]

            # Step 2: Generate MAC and register
            mac = generate_admin_mac(shared_secret, nonce, username, password, is_admin)

            register_response = await client.post(
                f"{homeserver_url}/_synapse/admin/v1/register",
                json={
                    "nonce": nonce,
                    "username": username,
                    "password": password,
                    "displayname": display_name or username,
                    "admin": is_admin,
                    "mac": mac,
                },
            )

            if register_response.status_code == 200:
                print(f"[Matrix] Shared secret registration successful for {username}")
                return {
                    "success": True,
                    "user_id": register_response.json().get("user_id"),
                }

            error_data = register_response.json()
            if error_data.get("errcode") == "M_USER_IN_USE":
                print(f"[Matrix] User {username} already exists")
                return {
                    "success": True,
                    "user_id": f"@{username}:{settings.matrix_server_name}",
                }

            print(f"[Matrix] Registration failed: {error_data}")
            return {"success": False}

        except Exception as e:
            print(f"[Matrix] Shared secret registration failed: {e}")
            return {"success": False}


async def login_matrix_user(username: str, password: str) -> Optional[dict]:
    """Login to Matrix and return credentials."""
    homeserver_url = settings.matrix_homeserver_url

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{homeserver_url}/_matrix/client/v3/login",
                json={
                    "type": "m.login.password",
                    "user": username,
                    "password": password,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "access_token": data["access_token"],
                    "user_id": data["user_id"],
                    "device_id": data["device_id"],
                }

            # Print detailed error for non-200 responses
            error_data = response.json()
            print(f"[Matrix] Login failed with status {response.status_code}: {error_data}")
            return None

        except Exception as e:
            print(f"[Matrix] Login exception: {e}")
            return None


async def create_matrix_account(
    github_login: str, github_id: int, github_name: Optional[str] = None
) -> MatrixCredentials:
    """Create or login to Matrix account based on GitHub user."""
    import re

    homeserver_url = settings.matrix_homeserver_url
    server_name = settings.matrix_server_name

    # Sanitize username for Matrix
    username = re.sub(r"[^a-z0-9._=-]", "", github_login.lower())

    # Create deterministic password from GitHub ID
    password = hashlib.sha256(
        f"{github_id}-{settings.github_client_secret}".encode()
    ).hexdigest()

    # Try to login first
    print(f"[Matrix] Attempting login for {username}")
    login_result = await login_matrix_user(username, password)

    if login_result:
        print(f"[Matrix] Login successful for {username}")
        return MatrixCredentials(
            access_token=login_result["access_token"],
            user_id=login_result["user_id"],
            home_server=server_name,
            device_id=login_result["device_id"],
        )

    # If login failed, try to register
    print(f"[Matrix] User {username} not found, attempting registration...")
    register_result = await register_with_shared_secret(
        username, password, github_name or github_login
    )

    if register_result["success"]:
        # Try login again after registration
        login_result = await login_matrix_user(username, password)
        if login_result:
            print(f"[Matrix] Login after registration successful for {username}")
            return MatrixCredentials(
                access_token=login_result["access_token"],
                user_id=login_result["user_id"],
                home_server=server_name,
                device_id=login_result["device_id"],
            )

    # Fallback to mock credentials for testing
    print("⚠️ Matrix registration failed. Returning MOCK credentials for local testing.")
    return MatrixCredentials(
        access_token="mock_access_token",
        user_id=f"@{username}:{server_name}",
        home_server=server_name,
        device_id="mock_device_id",
    )
