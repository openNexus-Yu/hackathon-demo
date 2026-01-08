-- 创建密钥库表
CREATE TABLE IF NOT EXISTS prize_keys (
    id SERIAL PRIMARY KEY,
    prize_id INTEGER NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    key_value VARCHAR(500) NOT NULL,
    key_type VARCHAR(50) DEFAULT 'voucher',
    is_used BOOLEAN DEFAULT FALSE,
    used_by_user_id INTEGER,
    used_at TIMESTAMP,
    redemption_id INTEGER REFERENCES prize_redemptions(id),
    key_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    CONSTRAINT unique_prize_key UNIQUE (prize_id, key_value)
);

CREATE INDEX idx_prize_keys_prize_id ON prize_keys(prize_id);
CREATE INDEX idx_prize_keys_is_used ON prize_keys(is_used);
CREATE INDEX idx_prize_keys_used_by_user ON prize_keys(used_by_user_id);

-- 修改prizes表
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS use_key_pool BOOLEAN DEFAULT FALSE;
ALTER TABLE prizes ALTER COLUMN delivery_type TYPE VARCHAR(20);

-- 修改prize_redemptions表
ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS assigned_key_id INTEGER REFERENCES prize_keys(id);
ALTER TABLE prize_redemptions ADD COLUMN IF NOT EXISTS key_revealed BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE prize_keys IS '奖品密钥库 - 存储可兑换的密钥/代金券';
COMMENT ON COLUMN prize_keys.key_value IS '密钥内容（优惠码、兑换码、激活码等）';
COMMENT ON COLUMN prize_keys.key_type IS '密钥类型：voucher(代金券)/license(许可证)/token(令牌)';
