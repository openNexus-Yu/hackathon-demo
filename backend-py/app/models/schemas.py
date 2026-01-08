"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Auth schemas
class GitHubCallbackRequest(BaseModel):
    code: str


class GitHubUser(BaseModel):
    login: str
    id: int
    avatar_url: str
    name: Optional[str] = None
    email: Optional[str] = None


class MatrixCredentials(BaseModel):
    access_token: str
    user_id: str
    home_server: str
    device_id: str


class AuthResponse(BaseModel):
    github_token: str
    user: GitHubUser
    matrix_credentials: MatrixCredentials


# User schemas
class UserPreferencesUpdate(BaseModel):
    githubUserId: int
    githubUsername: str
    pinnedRepos: Optional[List[int]] = None
    platformOrgs: Optional[List[str]] = None


class UserPreferencesResponse(BaseModel):
    github_user_id: int
    github_username: str
    pinned_repos: List[int] = []
    platform_orgs: List[str] = []
    matrix_user_id: Optional[str] = None


# Organization schemas
class OrganizationCreate(BaseModel):
    githubOrgId: Optional[int] = None
    orgName: str
    avatarUrl: Optional[str] = None
    description: Optional[str] = None
    memberCount: Optional[int] = None
    addedByUserId: Optional[int] = None


class OrganizationResponse(BaseModel):
    id: int
    github_org_id: int
    org_name: str
    avatar_url: Optional[str] = None
    description: Optional[str] = None
    member_count: int = 0
    platforms: List[str] = ["GitHub"]


class PlatformsUpdate(BaseModel):
    platforms: List[str]


# Repository schemas
class RepoSettingsUpdate(BaseModel):
    repoFullName: str
    platforms: List[str]


class BatchRepoSettingsRequest(BaseModel):
    repoIds: List[int]


# Matrix schemas
class CreateRoomRequest(BaseModel):
    project_name: str
    github_url: Optional[str] = None


class CreateRoomResponse(BaseModel):
    room_id: str
    room_alias: str
    action: str
    message: str


class EnsureBotInRoomsRequest(BaseModel):
    room_ids: List[str]


# Search schemas
class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    source: str
    title: str
    url: str
    snippet: str


class SearchResponse(BaseModel):
    answer: str
    results: List[SearchResult]


# AI Chat schemas
class AIChatRequest(BaseModel):
    message: str
    room_ids: Optional[List[str]] = None
    include_history: bool = True
    search_context: Optional[str] = None  # Pre-searched messages from Cinny


class ChatMessageSource(BaseModel):
    room_id: str
    room_name: Optional[str] = None
    sender: str
    content: str
    timestamp: datetime


class AIChatResponse(BaseModel):
    answer: str
    sources: List[ChatMessageSource] = []


# Incentive schemas
class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    points: int
    task_type: str = "manual"
    recurrence: str = "once"
    stock_limit: Optional[int] = None
    claimed_count: int = 0
    is_active: bool = True
    user_claimed: bool = False  # 当前用户是否已完成
    chat_room_id: Optional[str] = None  # 聊天室 ID
    chat_required: bool = False  # 是否需要加入聊天室
    activity_name: Optional[str] = None  # For admin list view
    campaign_name: Optional[str] = None  # For admin list view

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = 0
    tasks: List[TaskResponse] = []
    campaign_name: Optional[str] = None  # For admin list view

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    id: int
    org_id: int
    name: str
    description: Optional[str] = None
    banner_url: Optional[str] = None
    type: str = "permanent"  # permanent/limited
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_active: bool = True
    activities: List[ActivityResponse] = []
    chat_room_id: Optional[str] = None  # 聊天室 ID


class CampaignListResponse(BaseModel):
    permanent: List[CampaignResponse] = []
    limited: List[CampaignResponse] = []


class TaskClaimRequest(BaseModel):
    submission_data: Optional[dict] = None


class TaskClaimResponse(BaseModel):
    id: int
    task_id: int
    status: str
    points_earned: int
    submitted_at: datetime


class UserPointsResponse(BaseModel):
    user_id: int
    org_id: int
    total_points: int = 0
    spent_points: int = 0
    available_points: int = 0
    level: int = 1


class PrizeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    type: str = "digital"
    points_required: int
    stock: Optional[int] = None
    claimed_count: int = 0
    is_available: bool = True
    # 密钥库相关
    use_key_pool: bool = False
    available_keys: int = 0  # 可用密钥数量
    delivery_type: str = "manual"


class PrizeRedeemRequest(BaseModel):
    shipping_info: Optional[dict] = None


class PrizeRedeemResponse(BaseModel):
    id: int
    prize_id: int
    points_spent: int
    status: str
    redeemed_at: datetime
    # 密钥库相关
    key_value: Optional[str] = None  # 分配的密钥内容
    key_type: Optional[str] = None
    key_metadata: Optional[dict] = None


# CRUD Schemas
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    banner_url: Optional[str] = None
    type: str = "permanent"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    display_order: int = 0
    chat_room_id: Optional[str] = None  # 聊天室 ID


class ActivityCreate(BaseModel):
    campaign_id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int = 0


class TaskCreate(BaseModel):
    activity_id: int
    title: str
    description: Optional[str] = None
    points: int
    task_type: str = "manual"
    recurrence: str = "once"
    stock_limit: Optional[int] = None
    order_index: int = 0
    chat_room_id: Optional[str] = None  # 聊天室 ID
    chat_required: bool = False  # 是否需要加入聊天室


class PrizeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    type: str = "digital"
    points_required: int
    stock: Optional[int] = None
    delivery_type: str = "manual"
    prize_config: Optional[dict] = None
    use_key_pool: bool = False  # 是否使用密钥库


class PrizeKeyCreate(BaseModel):
    """批量添加密钥"""
    prize_id: int
    keys: List[str]  # 密钥列表
    key_type: str = "voucher"  # voucher/license/token
    key_metadata: Optional[dict] = None  # 额外信息


class PrizeKeyResponse(BaseModel):
    id: int
    prize_id: int
    key_value: str
    key_type: str
    is_used: bool
    used_by_user_id: Optional[int] = None
    used_at: Optional[datetime] = None
    key_metadata: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PrizeKeyListResponse(BaseModel):
    """密钥列表响应"""
    total: int
    used: int
    available: int
    keys: List[PrizeKeyResponse]

