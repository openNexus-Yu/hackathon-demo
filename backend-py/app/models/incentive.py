"""Incentive system database models."""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from ..database import Base


class Campaign(Base):
    """活动计划 - 最高层级的活动容器"""
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, index=True)  # 关联组织
    name = Column(String(200), nullable=False)
    description = Column(Text)
    banner_url = Column(String(500))
    type = Column(String(20), nullable=False, default='permanent')  # 'permanent' 或 'limited'
    start_time = Column(TIMESTAMP)  # 限时活动开始时间
    end_time = Column(TIMESTAMP)    # 限时活动结束时间
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    # 聊天室集成
    chat_room_id = Column(String(200))   # 默认聊天室 ID
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Activity(Base):
    """活动主题 - Campaign 下的具体活动版块"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey('campaigns.id'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # emoji 或图标名
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Task(Base):
    """任务 - 用户可完成的具体任务"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    activity_id = Column(Integer, ForeignKey('activities.id'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    points = Column(Integer, nullable=False, default=0)
    task_type = Column(String(50), default='manual')  # manual/dev/content/social/chat
    recurrence = Column(String(20), default='once')   # once/daily/weekly
    verification_config = Column(JSONB)  # 验证配置
    stock_limit = Column(Integer)        # 最大完成人数限制
    claimed_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    # 聊天室集成
    chat_room_id = Column(String(200))   # Matrix 聊天室 ID (如 #polkadot:localhost)
    chat_required = Column(Boolean, default=False)  # 是否需要加入聊天室才能完成
    created_at = Column(TIMESTAMP, server_default=func.now())


class TaskClaim(Base):
    """任务领取记录"""
    __tablename__ = "task_claims"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id'), nullable=False, index=True)
    status = Column(String(20), default='pending')  # pending/approved/rejected
    points_earned = Column(Integer, default=0)
    submission_data = Column(JSONB)  # 用户提交的数据
    submitted_at = Column(TIMESTAMP, server_default=func.now())
    reviewed_at = Column(TIMESTAMP)
    reviewer_id = Column(Integer)
    review_note = Column(Text)


class UserPoints(Base):
    """用户积分账户 - 每个组织独立"""
    __tablename__ = "user_points"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    total_points = Column(Integer, default=0)
    spent_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Prize(Base):
    """奖品"""
    __tablename__ = "prizes"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    type = Column(String(50), default='digital')  # physical/digital/badge/voucher
    points_required = Column(Integer, nullable=False)
    stock = Column(Integer)  # NULL 表示无限
    claimed_count = Column(Integer, default=0)
    delivery_type = Column(String(20), default='manual')  # shipping/code/manual/key_pool
    prize_config = Column(JSONB)  # 额外配置
    # 密钥库配置（当 delivery_type='key_pool' 时使用）
    use_key_pool = Column(Boolean, default=False)  # 是否使用密钥库
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class PrizeKey(Base):
    """密钥库 - 存储奖品的兑换密钥"""
    __tablename__ = "prize_keys"

    id = Column(Integer, primary_key=True)
    prize_id = Column(Integer, ForeignKey('prizes.id'), nullable=False, index=True)
    key_value = Column(String(500), nullable=False)  # 密钥内容（如优惠码、兑换码）
    key_type = Column(String(50), default='voucher')  # voucher/license/token
    is_used = Column(Boolean, default=False, index=True)  # 是否已使用
    used_by_user_id = Column(Integer, index=True)  # 被哪个用户使用
    used_at = Column(TIMESTAMP)  # 使用时间
    redemption_id = Column(Integer, ForeignKey('prize_redemptions.id'))  # 关联的兑换记录
    key_metadata = Column(JSONB)  # 额外信息（如有效期、使用说明等）
    created_at = Column(TIMESTAMP, server_default=func.now())


class PrizeRedemption(Base):
    """奖品兑换记录"""
    __tablename__ = "prize_redemptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    prize_id = Column(Integer, ForeignKey('prizes.id'), nullable=False, index=True)
    points_spent = Column(Integer, nullable=False)
    status = Column(String(20), default='pending')  # pending/shipped/completed/cancelled
    shipping_info = Column(JSONB)  # 收货信息
    # 密钥库相关
    assigned_key_id = Column(Integer, ForeignKey('prize_keys.id'))  # 分配的密钥ID
    key_revealed = Column(Boolean, default=False)  # 用户是否已查看密钥
    redeemed_at = Column(TIMESTAMP, server_default=func.now())
    delivered_at = Column(TIMESTAMP)
