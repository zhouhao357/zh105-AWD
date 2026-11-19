-- ============================================================
-- 姓名：周浩 | 学号：24001010105 |
-- 时间：2026-11-19 | 大模型：Space Bunny
--
-- zhou_init_admin.sql —— 后台管理模块建表脚本
--   1. zhou_user 增加 zhou_role 字段（区分普通用户与管理员）
--   2. 新建 zhou_admin_log 管理员操作日志表
--   3. 设置管理员账号 + 预置操作日志测试数据
-- 用法：node db/zhou_init_admin.js
-- ============================================================

USE zhou_campus_market;

-- ---------- 1. 用户表增加角色字段 ----------
ALTER TABLE zhou_user
    ADD COLUMN zhou_role VARCHAR(20) NOT NULL DEFAULT '用户'
        COMMENT '角色：用户 / 管理员' AFTER zhou_status;

-- ---------- 2. 管理员操作日志表 ----------
DROP TABLE IF EXISTS zhou_admin_log;
CREATE TABLE zhou_admin_log (
    zhou_log_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '日志主键',
    zhou_admin_id    INT UNSIGNED   NOT NULL                COMMENT '操作管理员',
    zhou_admin_name  VARCHAR(50)    NOT NULL                COMMENT '管理员昵称',
    zhou_action      VARCHAR(40)    NOT NULL                COMMENT '操作类型',
    zhou_target      VARCHAR(60)    NOT NULL DEFAULT ''     COMMENT '操作对象',
    zhou_detail      VARCHAR(255)   DEFAULT NULL            COMMENT '操作详情',
    zhou_created_at  DATETIME       NOT NULL                COMMENT '操作时间',
    PRIMARY KEY (zhou_log_id),
    KEY idx_zhou_log_admin (zhou_admin_id),
    KEY idx_zhou_log_time (zhou_created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员操作日志表';

-- ---------- 3. 设置管理员账号 ----------
-- zhou01（周浩，课程负责人）与新建的 zhouadmin 账号设为管理员
UPDATE zhou_user SET zhou_role = '管理员' WHERE zhou_username IN ('zhou01', 'zhouadmin');

INSERT INTO zhou_user (zhou_username, zhou_password, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_role, zhou_created_at) VALUES
('zhouadmin', 'e10adc3949ba59abbe56e057f20f883e', '平台管理员', '保密', '信息中心', '13800138000', 'images/avatar01.png', 0.00, 100, '正常', '管理员', '2026-02-20 09:00:00')
ON DUPLICATE KEY UPDATE zhou_role = '管理员', zhou_nickname = '平台管理员';

-- ---------- 4. 操作日志测试数据（不少于 8 条） ----------
INSERT INTO zhou_admin_log (zhou_admin_id, zhou_admin_name, zhou_action, zhou_target, zhou_detail, zhou_created_at) VALUES
(1, '周浩', '商品下架', '数据结构教材（全新）', '因卖家长时间未回复，管理员将商品下架', '2026-11-15 09:12:00'),
(1, '周浩', '用户封禁', 'zhou08', '多次发布虚假商品信息，账号状态改为「封禁」', '2026-11-15 10:36:00'),
(1, '周浩', '公告发布', '关于规范校园交易秩序的公告', '发布交易规范类公告，类型「通知」', '2026-11-15 14:05:00'),
(1, '周浩', '订单状态变更', '订单 ZO2026111500001', '买家已确认收货，状态改为「已完成」', '2026-11-16 09:40:00'),
(11, '平台管理员', '知识库文档删除', '过期的耳机选购指南.pdf', '文档内容已过期，删除并级联清理切片', '2026-11-16 15:22:00'),
(11, '平台管理员', '用户角色调整', 'zhou01', '授予平台管理员角色', '2026-11-17 08:30:00'),
(11, '平台管理员', '分类新增', '票券卡类', '新增「票券卡」分类，排序值 9', '2026-11-18 11:18:00'),
(11, '平台管理员', '商品价格调整', '索尼 WH-1000XM4 降噪耳机', '由 800.00 元调整为 780.00 元', '2026-11-18 16:47:00'),
(11, '平台管理员', '评论删除', '评价 #12', '包含违规联系方式，管理员删除', '2026-11-19 09:05:00'),
(1, '周浩', 'AI 会话清理', '会话 #7', '清理测试期间产生的多余会话记录', '2026-11-19 10:15:00');