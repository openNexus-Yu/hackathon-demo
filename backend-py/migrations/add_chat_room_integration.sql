-- 激励系统聊天室集成 - 数据库迁移脚本
-- 执行时间: 2026-01-08
-- 说明: 为激励系统添加聊天室关联功能

-- ===================================================
-- 1. 为 campaigns 表添加聊天室字段
-- ===================================================
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS chat_room_id VARCHAR(200);

COMMENT ON COLUMN campaigns.chat_room_id IS '关联的默认聊天室 ID (Matrix room ID, 如 #yu-community:localhost)';


-- ===================================================
-- 2. 为 tasks 表添加聊天室字段
-- ===================================================
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS chat_room_id VARCHAR(200);

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS chat_required BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tasks.chat_room_id IS '任务关联的聊天室 ID (Matrix room ID)';
COMMENT ON COLUMN tasks.chat_required IS '是否必须加入聊天室才能完成任务';


-- ===================================================
-- 3. 更新现有数据 (可选)
-- ===================================================
-- 如果需要为现有活动添加默认聊天室,可以执行:
-- UPDATE campaigns SET chat_room_id = '#yu-community:localhost' WHERE org_id = 1 AND type = 'permanent';
-- UPDATE campaigns SET chat_room_id = '#yu-newyear:localhost' WHERE org_id = 1 AND type = 'limited';


-- ===================================================
-- 4. 验证迁移
-- ===================================================
-- 查看表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('campaigns', 'tasks')
AND column_name IN ('chat_room_id', 'chat_required')
ORDER BY table_name, ordinal_position;


-- ===================================================
-- 完成!
-- ===================================================
-- 下一步:
-- 1. 运行种子数据脚本: python seed_incentive.py
-- 2. 重启后端服务
-- 3. 测试前端激励页面
