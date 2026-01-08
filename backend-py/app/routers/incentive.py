"""Incentive system API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from typing import Optional

from ..database import get_db
from ..models.incentive import (
    Campaign, Activity, Task, TaskClaim, UserPoints, Prize, PrizeRedemption, PrizeKey
)
from ..models.schemas import (
    CampaignResponse, CampaignListResponse, ActivityResponse, TaskResponse,
    TaskClaimRequest, TaskClaimResponse, UserPointsResponse,
    PrizeResponse, PrizeRedeemRequest, PrizeRedeemResponse,
    CampaignCreate, ActivityCreate, TaskCreate, PrizeCreate,
    PrizeKeyCreate, PrizeKeyResponse, PrizeKeyListResponse
)

router = APIRouter(tags=["incentive"])


@router.get("/{org_id}/campaigns", response_model=CampaignListResponse)
async def get_campaigns(
    org_id: int,
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取组织的所有活动计划，按类型分组返回"""
    
    # 获取所有活动的 campaigns
    result = await db.execute(
        select(Campaign)
        .where(Campaign.org_id == org_id, Campaign.is_active == True)
        .order_by(Campaign.display_order, Campaign.id)
    )
    campaigns = result.scalars().all()
    
    permanent = []
    limited = []
    
    for campaign in campaigns:
        # 获取 activities
        activities_result = await db.execute(
            select(Activity)
            .where(Activity.campaign_id == campaign.id, Activity.is_active == True)
            .order_by(Activity.order_index)
        )
        activities = activities_result.scalars().all()
        
        activity_list = []
        for activity in activities:
            # 获取 tasks
            tasks_result = await db.execute(
                select(Task)
                .where(Task.activity_id == activity.id, Task.is_active == True)
                .order_by(Task.order_index)
            )
            tasks = tasks_result.scalars().all()
            
            task_list = []
            for task in tasks:
                # 检查用户是否已完成
                user_claimed = False
                if user_id:
                    claim_result = await db.execute(
                        select(TaskClaim)
                        .where(
                            TaskClaim.task_id == task.id,
                            TaskClaim.user_id == user_id,
                            TaskClaim.status == 'approved'
                        )
                    )
                    user_claimed = claim_result.scalar_one_or_none() is not None
                
                task_list.append(TaskResponse(
                    id=task.id,
                    title=task.title,
                    description=task.description,
                    points=task.points,
                    task_type=task.task_type,
                    recurrence=task.recurrence,
                    stock_limit=task.stock_limit,
                    claimed_count=task.claimed_count or 0,
                    is_active=task.is_active,
                    user_claimed=user_claimed,
                    chat_room_id=task.chat_room_id,
                    chat_required=task.chat_required or False
                ))
            
            activity_list.append(ActivityResponse(
                id=activity.id,
                name=activity.name,
                description=activity.description,
                icon=activity.icon,
                order_index=activity.order_index or 0,
                tasks=task_list
            ))
        
        campaign_response = CampaignResponse(
            id=campaign.id,
            org_id=campaign.org_id,
            name=campaign.name,
            description=campaign.description,
            banner_url=campaign.banner_url,
            type=campaign.type,
            start_time=campaign.start_time,
            end_time=campaign.end_time,
            is_active=campaign.is_active,
            activities=activity_list,
            chat_room_id=campaign.chat_room_id
        )
        
        if campaign.type == 'permanent':
            permanent.append(campaign_response)
        else:
            limited.append(campaign_response)
    
    return CampaignListResponse(permanent=permanent, limited=limited)


@router.post("/task/{task_id}/claim", response_model=TaskClaimResponse)
async def claim_task(
    task_id: int,
    user_id: int,
    request: TaskClaimRequest = None,
    db: AsyncSession = Depends(get_db)
):
    """用户领取/完成任务"""
    
    # 获取任务信息
    task_result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = task_result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.is_active:
        raise HTTPException(status_code=400, detail="Task is not active")
    
    # 检查库存
    if task.stock_limit and task.claimed_count >= task.stock_limit:
        raise HTTPException(status_code=400, detail="Task limit reached")
    
    # 检查是否已完成 (对于 once 类型)
    if task.recurrence == 'once':
        existing = await db.execute(
            select(TaskClaim).where(
                TaskClaim.task_id == task_id,
                TaskClaim.user_id == user_id,
                TaskClaim.status == 'approved'
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Task already claimed")
    
    # 创建 claim 记录 (Demo 模式直接 approved)
    claim = TaskClaim(
        user_id=user_id,
        task_id=task_id,
        status='approved',  # Demo 模式直接通过
        points_earned=task.points,
        submission_data=request.submission_data if request else None
    )
    db.add(claim)
    
    # 更新任务完成计数
    task.claimed_count = (task.claimed_count or 0) + 1
    
    # 获取活动的组织 ID
    activity_result = await db.execute(
        select(Activity).where(Activity.id == task.activity_id)
    )
    activity = activity_result.scalar_one()
    
    campaign_result = await db.execute(
        select(Campaign).where(Campaign.id == activity.campaign_id)
    )
    campaign = campaign_result.scalar_one()
    
    # 更新用户积分
    points_result = await db.execute(
        select(UserPoints).where(
            UserPoints.user_id == user_id,
            UserPoints.org_id == campaign.org_id
        )
    )
    user_points = points_result.scalar_one_or_none()
    
    if user_points:
        user_points.total_points += task.points
    else:
        user_points = UserPoints(
            user_id=user_id,
            org_id=campaign.org_id,
            total_points=task.points
        )
        db.add(user_points)
    
    await db.commit()
    await db.refresh(claim)
    
    return TaskClaimResponse(
        id=claim.id,
        task_id=claim.task_id,
        status=claim.status,
        points_earned=claim.points_earned,
        submitted_at=claim.submitted_at
    )


@router.get("/{org_id}/points", response_model=UserPointsResponse)
async def get_user_points(
    org_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取用户在组织中的积分"""
    
    result = await db.execute(
        select(UserPoints).where(
            UserPoints.user_id == user_id,
            UserPoints.org_id == org_id
        )
    )
    user_points = result.scalar_one_or_none()
    
    if not user_points:
        return UserPointsResponse(
            user_id=user_id,
            org_id=org_id,
            total_points=0,
            spent_points=0,
            available_points=0,
            level=1
        )
    
    available = user_points.total_points - (user_points.spent_points or 0)
    
    return UserPointsResponse(
        user_id=user_id,
        org_id=org_id,
        total_points=user_points.total_points,
        spent_points=user_points.spent_points or 0,
        available_points=available,
        level=user_points.level or 1
    )


@router.get("/{org_id}/prizes", response_model=list[PrizeResponse])
async def get_prizes(
    org_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取组织的奖品列表"""
    
    result = await db.execute(
        select(Prize)
        .where(Prize.org_id == org_id, Prize.is_active == True)
        .order_by(Prize.points_required)
    )
    prizes = result.scalars().all()
    
    prize_responses = []
    for prize in prizes:
        # 计算可用密钥数
        available_keys = 0
        if prize.use_key_pool:
            keys_result = await db.execute(
                select(PrizeKey).where(
                    PrizeKey.prize_id == prize.id,
                    PrizeKey.is_used == False
                )
            )
            available_keys = len(keys_result.scalars().all())
        
        prize_responses.append(PrizeResponse(
            id=prize.id,
            name=prize.name,
            description=prize.description,
            image_url=prize.image_url,
            type=prize.type,
            points_required=prize.points_required,
            stock=prize.stock,
            claimed_count=prize.claimed_count or 0,
            is_available=(prize.stock is None or prize.stock > (prize.claimed_count or 0)),
            use_key_pool=prize.use_key_pool or False,
            available_keys=available_keys,
            delivery_type=prize.delivery_type or 'manual'
        ))
    
    return prize_responses


@router.post("/prize/{prize_id}/redeem", response_model=PrizeRedeemResponse)
async def redeem_prize(
    prize_id: int,
    user_id: int,
    request: PrizeRedeemRequest = None,
    db: AsyncSession = Depends(get_db)
):
    """兑换奖品（支持密钥库分配）"""
    
    # 获取奖品
    prize_result = await db.execute(
        select(Prize).where(Prize.id == prize_id)
    )
    prize = prize_result.scalar_one_or_none()
    
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    
    if not prize.is_active:
        raise HTTPException(status_code=400, detail="Prize is not available")
    
    # 密钥库类型奖品：检查可用密钥
    assigned_key = None
    if prize.use_key_pool:
        # 查找未使用的密钥
        keys_result = await db.execute(
            select(PrizeKey).where(
                PrizeKey.prize_id == prize_id,
                PrizeKey.is_used == False
            ).limit(1)
        )
        assigned_key = keys_result.scalar_one_or_none()
        
        if not assigned_key:
            raise HTTPException(status_code=400, detail="No available keys in pool")
    else:
        # 普通奖品：检查库存
        if prize.stock is not None and (prize.claimed_count or 0) >= prize.stock:
            raise HTTPException(status_code=400, detail="Prize out of stock")
    
    # 检查用户积分
    points_result = await db.execute(
        select(UserPoints).where(
            UserPoints.user_id == user_id,
            UserPoints.org_id == prize.org_id
        )
    )
    user_points = points_result.scalar_one_or_none()
    
    available = (user_points.total_points - (user_points.spent_points or 0)) if user_points else 0
    
    if available < prize.points_required:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # 创建兑换记录
    redemption = PrizeRedemption(
        user_id=user_id,
        prize_id=prize_id,
        points_spent=prize.points_required,
        status='completed' if prize.use_key_pool else 'pending',  # 密钥库直接完成
        shipping_info=request.shipping_info if request else None,
        assigned_key_id=assigned_key.id if assigned_key else None
    )
    db.add(redemption)
    
    # 如果是密钥库，标记密钥为已使用
    if assigned_key:
        assigned_key.is_used = True
        assigned_key.used_by_user_id = user_id
        assigned_key.used_at = func.now()
        assigned_key.redemption_id = redemption.id
    
    # 更新用户积分
    user_points.spent_points = (user_points.spent_points or 0) + prize.points_required
    
    # 更新奖品领取计数
    prize.claimed_count = (prize.claimed_count or 0) + 1
    
    await db.commit()
    await db.refresh(redemption)
    
    return PrizeRedeemResponse(
        id=redemption.id,
        prize_id=redemption.prize_id,
        points_spent=redemption.points_spent,
        status=redemption.status,
        redeemed_at=redemption.redeemed_at,
        key_value=assigned_key.key_value if assigned_key else None,
        key_type=assigned_key.key_type if assigned_key else None,
        key_metadata=assigned_key.key_metadata if assigned_key else None
    )


# === Admin Endpoints ===

@router.post("/{org_id}/campaigns", response_model=CampaignResponse)
async def create_campaign(
    org_id: int,
    campaign: CampaignCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新的活动计划"""
    db_campaign = Campaign(
        org_id=org_id,
        **campaign.model_dump()
    )
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    
    return CampaignResponse(
        id=db_campaign.id,
        org_id=db_campaign.org_id,
        name=db_campaign.name,
        description=db_campaign.description,
        banner_url=db_campaign.banner_url,
        type=db_campaign.type,
        start_time=db_campaign.start_time,
        end_time=db_campaign.end_time,
        is_active=db_campaign.is_active,
        activities=[]
    )


@router.post("/campaign/{campaign_id}/activities", response_model=ActivityResponse)
async def create_activity(
    campaign_id: int,
    activity: ActivityCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建活动主题"""
    db_activity = Activity(**activity.model_dump())
    db.add(db_activity)
    await db.commit()
    await db.refresh(db_activity)
    
    return ActivityResponse(
        id=db_activity.id,
        name=db_activity.name,
        description=db_activity.description,
        icon=db_activity.icon,
        order_index=db_activity.order_index or 0,
        tasks=[]
    )


@router.get("/{org_id}/activities", response_model=list[ActivityResponse])
async def get_activities(
    org_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取组织的所有活动主题"""
    # Get all campaigns for this org
    campaigns_result = await db.execute(
        select(Campaign).where(
            Campaign.org_id == org_id,
            Campaign.is_active == True
        )
    )
    campaigns = campaigns_result.scalars().all()
    campaign_ids = [c.id for c in campaigns]
    
    if not campaign_ids:
        return []
    
    # Get all activities for these campaigns
    result = await db.execute(
        select(Activity)
        .where(
            Activity.campaign_id.in_(campaign_ids),
            Activity.is_active == True
        )
        .order_by(Activity.order_index)
    )
    activities = result.scalars().all()
    
    # Build response with campaign names
    response = []
    for activity in activities:
        campaign = next((c for c in campaigns if c.id == activity.campaign_id), None)
        response.append(ActivityResponse(
            id=activity.id,
            name=activity.name,
            description=activity.description,
            icon=activity.icon,
            order_index=activity.order_index or 0,
            campaign_name=campaign.name if campaign else None,
            tasks=[]
        ))
    
    return response


@router.post("/activity/{activity_id}/tasks", response_model=TaskResponse)
async def create_task(
    activity_id: int,
    task: TaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建任务"""
    db_task = Task(**task.model_dump())
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    
    return TaskResponse(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        points=db_task.points,
        task_type=db_task.task_type,
        recurrence=db_task.recurrence,
        stock_limit=db_task.stock_limit,
        is_active=db_task.is_active,
        claimed_count=0,
        user_claimed=False,
        chat_room_id=db_task.chat_room_id,
        chat_required=db_task.chat_required or False
    )


@router.get("/{org_id}/tasks", response_model=list[TaskResponse])
async def get_tasks(
    org_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取组织的所有任务"""
    # Get all campaigns for this org
    campaigns_result = await db.execute(
        select(Campaign).where(
            Campaign.org_id == org_id,
            Campaign.is_active == True
        )
    )
    campaigns = campaigns_result.scalars().all()
    campaign_ids = [c.id for c in campaigns]
    
    if not campaign_ids:
        return []
    
    # Get all activities for these campaigns
    activities_result = await db.execute(
        select(Activity)
        .where(
            Activity.campaign_id.in_(campaign_ids),
            Activity.is_active == True
        )
    )
    activities = activities_result.scalars().all()
    activity_ids = [a.id for a in activities]
    
    if not activity_ids:
        return []
    
    # Get all tasks for these activities
    result = await db.execute(
        select(Task)
        .where(
            Task.activity_id.in_(activity_ids),
            Task.is_active == True
        )
        .order_by(Task.order_index)
    )
    tasks = result.scalars().all()
    
    # Build response with activity names
    response = []
    for task in tasks:
        activity = next((a for a in activities if a.id == task.activity_id), None)
        campaign = next((c for c in campaigns if activity and c.id == activity.campaign_id), None)
        
        task_resp = TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            points=task.points,
            task_type=task.task_type,
            recurrence=task.recurrence,
            stock_limit=task.stock_limit,
            claimed_count=task.claimed_count or 0,
            is_active=task.is_active,
            user_claimed=False,
            chat_room_id=task.chat_room_id,
            chat_required=task.chat_required or False
        )
        # Add extra fields for display
        task_resp.activity_name = activity.name if activity else None
        task_resp.campaign_name = campaign.name if campaign else None
        response.append(task_resp)
    
    return response


@router.post("/{org_id}/prizes", response_model=PrizeResponse)
async def create_prize(
    org_id: int,
    prize: PrizeCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建奖品"""
    db_prize = Prize(
        org_id=org_id,
        **prize.model_dump()
    )
    db.add(db_prize)
    await db.commit()
    await db.refresh(db_prize)
    
    return PrizeResponse(
        id=db_prize.id,
        name=db_prize.name,
        description=db_prize.description,
        image_url=db_prize.image_url,
        type=db_prize.type,
        points_required=db_prize.points_required,
        stock=db_prize.stock,
        claimed_count=0,
        is_available=True,
        use_key_pool=db_prize.use_key_pool or False,
        available_keys=0,
        delivery_type=db_prize.delivery_type or 'manual'
    )


@router.put("/activity/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: int,
    activity: ActivityCreate,
    db: AsyncSession = Depends(get_db)
):
    """更新活动主题"""
    result = await db.execute(
        select(Activity).where(Activity.id == activity_id)
    )
    db_activity = result.scalar_one_or_none()
    
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    for key, value in activity.model_dump(exclude_unset=True).items():
        setattr(db_activity, key, value)
    
    await db.commit()
    await db.refresh(db_activity)
    
    return ActivityResponse(
        id=db_activity.id,
        name=db_activity.name,
        description=db_activity.description,
        icon=db_activity.icon,
        order_index=db_activity.order_index or 0,
        tasks=[]
    )


@router.delete("/activity/{activity_id}")
async def delete_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除活动主题"""
    result = await db.execute(
        select(Activity).where(Activity.id == activity_id)
    )
    db_activity = result.scalar_one_or_none()
    
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Soft delete
    db_activity.is_active = False
    await db.commit()
    
    return {"message": "Activity deleted successfully"}


@router.put("/task/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task: TaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """更新任务"""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    db_task = result.scalar_one_or_none()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)
    
    await db.commit()
    await db.refresh(db_task)
    
    return TaskResponse(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        points=db_task.points,
        task_type=db_task.task_type,
        recurrence=db_task.recurrence,
        stock_limit=db_task.stock_limit,
        is_active=db_task.is_active,
        claimed_count=db_task.claimed_count or 0,
        user_claimed=False,
        chat_room_id=db_task.chat_room_id,
        chat_required=db_task.chat_required or False
    )


@router.delete("/task/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除任务"""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    db_task = result.scalar_one_or_none()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Soft delete
    db_task.is_active = False
    await db.commit()
    
    return {"message": "Task deleted successfully"}

# ==================== 密钥库管理 API ====================

@router.post("/prize/{prize_id}/keys", response_model=dict)
async def add_prize_keys(
    prize_id: int,
    request: PrizeKeyCreate,
    db: AsyncSession = Depends(get_db)
):
    """批量添加密钥到奖品密钥库"""
    
    # 验证奖品存在
    prize_result = await db.execute(
        select(Prize).where(Prize.id == prize_id)
    )
    prize = prize_result.scalar_one_or_none()
    
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    
    # 批量创建密钥
    added_count = 0
    for key_value in request.keys:
        # 检查密钥是否已存在
        existing = await db.execute(
            select(PrizeKey).where(
                PrizeKey.prize_id == prize_id,
                PrizeKey.key_value == key_value
            )
        )
        if existing.scalar_one_or_none():
            continue  # 跳过重复密钥
        
        prize_key = PrizeKey(
            prize_id=prize_id,
            key_value=key_value,
            key_type=request.key_type,
            key_metadata=request.key_metadata
        )
        db.add(prize_key)
        added_count += 1
    
    # 更新奖品配置
    prize.use_key_pool = True
    prize.delivery_type = "key_pool"
    
    await db.commit()
    
    return {
        "message": f"Successfully added {added_count} keys",
        "total_added": added_count,
        "skipped": len(request.keys) - added_count
    }


@router.get("/prize/{prize_id}/keys", response_model=PrizeKeyListResponse)
async def get_prize_keys(
    prize_id: int,
    show_used: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """获取奖品的密钥列表"""
    
    # 构建查询
    query = select(PrizeKey).where(PrizeKey.prize_id == prize_id)
    
    if not show_used:
        query = query.where(PrizeKey.is_used == False)
    
    query = query.order_by(PrizeKey.created_at.desc())
    
    result = await db.execute(query)
    keys = result.scalars().all()
    
    # 统计信息
    total = len(keys)
    used = sum(1 for k in keys if k.is_used)
    available = total - used
    
    return PrizeKeyListResponse(
        total=total,
        used=used,
        available=available,
        keys=[PrizeKeyResponse(
            id=k.id,
            prize_id=k.prize_id,
            key_value=k.key_value,
            key_type=k.key_type,
            is_used=k.is_used,
            used_by_user_id=k.used_by_user_id,
            used_at=k.used_at,
            key_metadata=k.key_metadata,
            created_at=k.created_at
        ) for k in keys]
    )


@router.delete("/prize-key/{key_id}")
async def delete_prize_key(
    key_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除单个密钥"""
    
    result = await db.execute(
        select(PrizeKey).where(PrizeKey.id == key_id)
    )
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    
    if key.is_used:
        raise HTTPException(status_code=400, detail="Cannot delete used key")
    
    await db.delete(key)
    await db.commit()
    
    return {"message": "Key deleted successfully"}


@router.get("/{org_id}/prizes", response_model=list[PrizeResponse])
async def get_prizes(
    org_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取组织的奖品列表（更新：包含密钥库信息）"""
    
    result = await db.execute(
        select(Prize).where(Prize.org_id == org_id, Prize.is_active == True)
    )
    prizes = result.scalars().all()
    
    prize_list = []
    for prize in prizes:
        # 计算可用库存
        is_available = True
        available_keys = 0
        
        if prize.use_key_pool:
            # 统计可用密钥数量
            keys_result = await db.execute(
                select(PrizeKey).where(
                    PrizeKey.prize_id == prize.id,
                    PrizeKey.is_used == False
                )
            )
            available_keys = len(keys_result.scalars().all())
            is_available = available_keys > 0
        elif prize.stock:
            is_available = prize.claimed_count < prize.stock
        
        prize_list.append(PrizeResponse(
            id=prize.id,
            name=prize.name,
            description=prize.description,
            image_url=prize.image_url,
            type=prize.type,
            points_required=prize.points_required,
            stock=prize.stock,
            claimed_count=prize.claimed_count,
            is_available=is_available,
            use_key_pool=prize.use_key_pool,
            available_keys=available_keys,
            delivery_type=prize.delivery_type
        ))
    
    return prize_list

@router.put("/prize/{prize_id}", response_model=PrizeResponse)
async def update_prize(
    prize_id: int,
    prize: PrizeCreate,
    db: AsyncSession = Depends(get_db)
):
    """更新奖品"""
    print(f"🔧 Updating prize {prize_id}, received data:", prize.model_dump())
    
    result = await db.execute(
        select(Prize).where(Prize.id == prize_id)
    )
    db_prize = result.scalar_one_or_none()
    
    if not db_prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    
    for key, value in prize.model_dump(exclude_unset=True).items():
        setattr(db_prize, key, value)
    
    await db.commit()
    await db.refresh(db_prize)
    
    # 计算可用密钥数
    available_keys = 0
    if db_prize.use_key_pool:
        keys_result = await db.execute(
            select(PrizeKey).where(
                PrizeKey.prize_id == prize_id,
                PrizeKey.is_used == False
            )
        )
        available_keys = len(keys_result.scalars().all())
    
    return PrizeResponse(
        id=db_prize.id,
        name=db_prize.name,
        description=db_prize.description,
        image_url=db_prize.image_url,
        type=db_prize.type,
        points_required=db_prize.points_required,
        stock=db_prize.stock,
        claimed_count=db_prize.claimed_count,
        is_available=True,
        use_key_pool=db_prize.use_key_pool or False,
        available_keys=available_keys,
        delivery_type=db_prize.delivery_type or 'manual'
    )


@router.delete("/prize/{prize_id}")
async def delete_prize(
    prize_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除奖品"""
    
    result = await db.execute(
        select(Prize).where(Prize.id == prize_id)
    )
    prize = result.scalar_one_or_none()
    
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    
    # Soft delete
    prize.is_active = False
    await db.commit()
    
    return {"message": "Prize deleted successfully"}
