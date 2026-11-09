-- 姓名：周浩 | 学号：24001010105 |
-- 时间：2026-11-09 | 大模型：Space Bunny
--
-- zhou_init.sql —— 校园二手交易平台 SQLite 建库脚本
-- 说明：先按外键依赖倒序删除旧表，再顺序建表并写入测试数据，
--       仅凭本文件即可在新机器上完整重建数据库。
-- 执行方式：cd backend && npm run initdb

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS zhou_comment;
DROP TABLE IF EXISTS zhou_message;
DROP TABLE IF EXISTS zhou_favorite;
DROP TABLE IF EXISTS zhou_order;
DROP TABLE IF EXISTS zhou_goods;
DROP TABLE IF EXISTS zhou_category;
DROP TABLE IF EXISTS zhou_user;
DROP TABLE IF EXISTS zhou_notice;

-- ============================================================
-- 1. 用户表 zhou_user
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_user (
    zhou_user_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_username     TEXT    NOT NULL UNIQUE,
    zhou_password     TEXT    NOT NULL,
    zhou_nickname     TEXT    NOT NULL,
    zhou_gender       TEXT    NOT NULL DEFAULT '保密',
    zhou_college      TEXT,
    zhou_phone        TEXT,
    zhou_avatar       TEXT,
    zhou_balance      REAL    NOT NULL DEFAULT 0,
    zhou_credit       INTEGER NOT NULL DEFAULT 100,
    zhou_status       TEXT    NOT NULL DEFAULT '正常',
    zhou_created_at   TEXT    NOT NULL
);

-- 初始密码均为 123456 的 md5 值
INSERT INTO zhou_user (zhou_username, zhou_password, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_created_at) VALUES
('zhou01', 'e10adc3949ba59abbe56e057f20f883e', '周浩',   '男', '计科24001', '13800138001', 'images/avatar01.png', 128.50, 100, '正常', '2026-03-02 09:15:00'),
('zhou02', 'e10adc3949ba59abbe56e057f20f883e', '李思远', '男', '计科24001', '13800138002', 'images/avatar02.png',  56.00,  98, '正常', '2026-03-05 14:20:00'),
('zhou03', 'e10adc3949ba59abbe56e057f20f883e', '王雨桐', '女', '计科24002', '13800138003', 'images/avatar03.png', 342.80,  95, '正常', '2026-03-11 10:02:00'),
('zhou04', 'e10adc3949ba59abbe56e057f20f883e', '张子轩', '男', '软件24001', '13800138004', 'images/avatar04.png',   0.00, 100, '正常', '2026-03-18 19:45:00'),
('zhou05', 'e10adc3949ba59abbe56e057f20f883e', '赵梦琪', '女', '网安24001', '13800138005', 'images/avatar05.png', 215.00,  92, '正常', '2026-04-01 08:30:00'),
('zhou06', 'e10adc3949ba59abbe56e057f20f883e', '陈皓',   '男', '机械24002', '13800138006', 'images/avatar06.png',  76.40,  88, '正常', '2026-04-09 21:10:00'),
('zhou07', 'e10adc3949ba59abbe56e057f20f883e', '刘雨欣', '女', '外语24001', '13800138007', 'images/avatar07.png', 460.00, 100, '正常', '2026-04-22 11:55:00'),
('zhou08', 'e10adc3949ba59abbe56e057f20f883e', '孙浩然', '男', '土木24001', '13800138008', 'images/avatar08.png',  18.00,  75, '正常', '2026-05-06 16:40:00'),
('zhou09', 'e10adc3949ba59abbe56e057f20f883e', '吴佳怡', '女', '会计24002', '13800138009', 'images/avatar09.png', 132.60,  96, '正常', '2026-05-19 13:25:00'),
('zhou10', 'e10adc3949ba59abbe56e057f20f883e', '郑凯文', '男', '电气24001', '13800138010', 'images/avatar10.png',   0.00, 100, '正常', '2026-06-02 09:05:00');
-- ============================================================
-- 2. 商品分类表 zhou_category
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_category (
    zhou_category_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_cate_name    TEXT    NOT NULL UNIQUE,
    zhou_cate_icon    TEXT,
    zhou_cate_desc    TEXT,
    zhou_sort_order   INTEGER NOT NULL DEFAULT 0,
    zhou_created_at   TEXT    NOT NULL
);

INSERT INTO zhou_category (zhou_cate_name, zhou_cate_icon, zhou_cate_desc, zhou_sort_order, zhou_created_at) VALUES
('教材教辅', 'images/cate_book.png',  '课本、考研资料、习题册与真题', 1, '2026-03-01 08:00:00'),
('电子数码', 'images/cate_pc.png',    '笔记本、平板、耳机、相机等',   2, '2026-03-01 08:00:00'),
('生活用品', 'images/cate_life.png',  '宿舍桌椅上、收纳与日用百货',   3, '2026-03-01 08:00:00'),
('运动户外', 'images/cate_sport.png', '球类、健身器材、户外装备',     4, '2026-03-01 08:00:00'),
('图书影音', 'images/cate_read.png',  '课外读物、唱片、影视周边',     5, '2026-03-01 08:00:00'),
('代步工具', 'images/cate_bike.png',  '自行车、滑板车、电动车',       6, '2026-03-01 08:00:00'),
('乐器文娱', 'images/cate_music.png', '吉他、尤克里里、乐器配件',     7, '2026-03-01 08:00:00'),
('服饰鞋包', 'images/cate_cloth.png', '衣物、鞋子、背包与配饰',       8, '2026-03-01 08:00:00');

-- ============================================================
-- 3. 商品表 zhou_goods
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_goods (
    zhou_goods_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_user_id       INTEGER NOT NULL,
    zhou_category_id   INTEGER NOT NULL,
    zhou_title         TEXT    NOT NULL,
    zhou_description   TEXT,
    zhou_price         REAL    NOT NULL,
    zhou_original_price REAL,
    zhou_stock         INTEGER NOT NULL DEFAULT 1,
    zhou_cover         TEXT,
    zhou_condition     TEXT    NOT NULL DEFAULT '九成新',
    zhou_trade_place   TEXT,
    zhou_status        TEXT    NOT NULL DEFAULT '在售',
    zhou_view_count    INTEGER NOT NULL DEFAULT 0,
    zhou_created_at    TEXT    NOT NULL,
    FOREIGN KEY (zhou_user_id)     REFERENCES zhou_user (zhou_user_id),
    FOREIGN KEY (zhou_category_id) REFERENCES zhou_category (zhou_category_id)
);
INSERT INTO zhou_goods (zhou_user_id, zhou_category_id, zhou_title, zhou_description, zhou_price, zhou_original_price, zhou_stock, zhou_cover, zhou_condition, zhou_trade_place, zhou_status, zhou_view_count, zhou_created_at) VALUES
(1, 1, '高等数学同济第七版上册', '重点章节有少量笔记，无缺页无划线，适合大二学弟学妹。', 25.00, 45.00, 1, 'images/goods01.png', '八成新', '东区宿舍楼下', '在售', 156, '2026-10-28 10:20:00'),
(3, 1, '大学英语四级真题 2023 春季版', '含听力音频二维码，答案解析完整，做完可擦。', 15.00, 32.00, 1, 'images/goods02.png', '九成新', '图书馆西门', '在售', 98, '2026-10-25 15:40:00'),
(7, 2, '二手 iPad 第九代 64G 深空灰', '2023 年购入，屏幕无划痕，已贴钢化膜，配件原装。', 1450.00, 2399.00, 1, 'images/goods03.png', '95新', '北苑快递驿站', '在售', 402, '2026-10-21 19:05:00'),
(4, 2, '联想小新 Air14 i5/16G/512G', '大二买的轻薄本，性能足够写代码，已重装系统，无维修记录。', 3200.00, 4299.00, 1, 'images/goods04.png', '9成新', '实验楼 B 座', '已售出', 615, '2026-10-18 14:30:00'),
(2, 2, '罗技 MX Master 3 无线鼠标', '功能正常，滚轮无空转，附原装 Type-C 接收器。', 260.00, 499.00, 1, 'images/goods05.png', '八成新', '三食堂门口', '在售', 143, '2026-10-15 09:50:00'),
(9, 1, '考研数学一全套资料 张宇与李永乐', '强化讲义、660 题、真题解析三套齐全，含少量铅笔笔记。', 88.00, 168.00, 1, 'images/goods06.png', '九成新', '南苑 8 号楼', '在售', 210, '2026-10-12 20:15:00'),
(8, 6, '捷安特通勤自行车 26 寸', '毕业换车闲置，车胎刚换，刹车灵敏，需自提。', 450.00, 899.00, 1, 'images/goods07.png', '七成新', '体育馆停车棚', '在售', 76, '2026-10-08 17:25:00'),
(6, 4, '李宁韦德伍篮球 7 号', '室内木地板专用，磨损轻微，已排过气。', 120.00, 299.00, 1, 'images/goods08.png', '八成新', '体育馆篮球场', '在售', 65, '2026-10-05 11:10:00');INSERT INTO zhou_goods (zhou_user_id, zhou_category_id, zhou_title, zhou_description, zhou_price, zhou_original_price, zhou_stock, zhou_cover, zhou_condition, zhou_trade_place, zhou_status, zhou_view_count, zhou_created_at) VALUES
(5, 2, '索尼 WH-1000XM4 降噪耳机', '降噪效果优秀，耳罩无掉皮，附收纳盒与音频线。', 780.00, 1299.00, 1, 'images/goods09.png', '九成新', '一号宿舍楼', '在售', 287, '2026-09-30 21:40:00'),
(10, 2, '佳能 EOS M50 微单相机 含 15-45 镜头', '快门数约 8000，附带电池两块、充电座与 32G 卡。', 2600.00, 3699.00, 1, 'images/goods10.png', '95新', '经管学院楼下', '在售', 331, '2026-09-26 18:05:00'),
(3, 2, '静电容键盘 87 键 白色', '静音轴手感细腻，蓝牙有线双模，附键帽拔取器。', 320.00, 549.00, 1, 'images/goods11.png', '九成新', '五食堂', '在售', 122, '2026-09-22 13:35:00'),
(9, 3, '宿舍书桌 1.2 米 实木贴皮', '桌面无磕碰，附带抽屉一个，搬迁低价出。', 90.00, 210.00, 1, 'images/goods12.png', '七成新', '六号楼 302', '在售', 54, '2026-09-18 10:20:00'),
(1, 7, '马利牌 40 寸吉他 附入门教材', '大一社团活动买的，音准正常，琴包一起送。', 260.00, 580.00, 1, 'images/goods13.png', '八成新', '大学生活动中心', '在售', 93, '2026-09-14 16:45:00'),
(7, 8, 'Nike Air Force 1 白色 42 码', '穿了两三次，鞋底干净，盒子配件齐全。', 330.00, 799.00, 1, 'images/goods14.png', '九成新', '北苑快递驿站', '在售', 168, '2026-09-10 12:00:00'),
(4, 1, '数据结构与算法分析 教材', '影印版，无笔记无划线，重点章节有重点标注。', 20.00, 39.00, 1, 'images/goods15.png', '八成新', '实验楼 A 座', '在售', 47, '2026-09-06 15:15:00');
-- ============================================================
-- 4. 订单表 zhou_order
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_order (
    zhou_order_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_order_no      TEXT    NOT NULL UNIQUE,
    zhou_goods_id      INTEGER NOT NULL,
    zhou_buyer_id      INTEGER NOT NULL,
    zhou_seller_id     INTEGER NOT NULL,
    zhou_price         REAL    NOT NULL,
    zhou_quantity      INTEGER NOT NULL DEFAULT 1,
    zhou_total_amount  REAL    NOT NULL,
    zhou_status        TEXT    NOT NULL DEFAULT '待付款',
    zhou_remark        TEXT,
    zhou_created_at    TEXT    NOT NULL,
    zhou_updated_at    TEXT    NOT NULL,
    FOREIGN KEY (zhou_goods_id)  REFERENCES zhou_goods (zhou_goods_id),
    FOREIGN KEY (zhou_buyer_id)  REFERENCES zhou_user (zhou_user_id),
    FOREIGN KEY (zhou_seller_id) REFERENCES zhou_user (zhou_user_id)
);

INSERT INTO zhou_order (zhou_order_no, zhou_goods_id, zhou_buyer_id, zhou_seller_id, zhou_price, zhou_quantity, zhou_total_amount, zhou_status, zhou_remark, zhou_created_at, zhou_updated_at) VALUES
('ZO20260915001', 4,  8,  4,  3200.00, 1, 3200.00, '已完成',  '毕业换车，顺丰到付',       '2026-09-15 10:02:00', '2026-09-20 17:30:00'),
('ZO20260928002', 9,  2,  5,  780.00,  1, 780.00,  '已完成',  '降噪效果很好，包装完好',   '2026-09-28 19:44:00', '2026-10-02 11:10:00'),
('ZO20261006003', 3,  1,  7,  1450.00, 1, 1450.00, '已完成',  '当面验机，已确认无拆修',   '2026-10-06 15:18:00', '2026-10-08 20:05:00'),
('ZO20261012004', 13, 5,  1,  260.00,  1, 260.00,  '已完成',  '琴和琴包都在，可以试音',   '2026-10-12 21:30:00', '2026-10-15 18:20:00'),
('ZO20261021005', 7,  6,  8,  450.00,  1, 450.00,  '待收货',  '已发货，预计明天到',       '2026-10-21 10:26:00', '2026-10-22 09:10:00'),
('ZO20261025006', 1,  9,  1,  25.00,   1, 25.00,   '待发货',  '教材书，麻烦尽快发货',     '2026-10-25 16:12:00', '2026-10-25 16:12:00'),
('ZO20261102007', 11, 3,  3,  320.00,  1, 320.00,  '待付款',  '还在犹豫，可以小刀吗',     '2026-11-02 20:08:00', '2026-11-02 20:08:00'),
('ZO20261105008', 14, 10, 7,  330.00,  1, 330.00,  '已取消',  '尺码不合适，暂不购买了',   '2026-11-05 11:33:00', '2026-11-05 14:02:00'),
('ZO20261106009', 10, 2,  10, 2600.00, 1, 2600.00, '退款中',  '相机有暗角，申请部分退款', '2026-11-06 09:15:00', '2026-11-07 10:20:00');
-- ============================================================
-- 5. 评价表 zhou_comment
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_comment (
    zhou_comment_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_goods_id      INTEGER NOT NULL,
    zhou_order_id      INTEGER NOT NULL,
    zhou_user_id       INTEGER NOT NULL,
    zhou_rating        INTEGER NOT NULL DEFAULT 5,
    zhou_content       TEXT,
    zhou_reply         TEXT,
    zhou_created_at    TEXT    NOT NULL,
    FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id),
    FOREIGN KEY (zhou_order_id) REFERENCES zhou_order (zhou_order_id),
    FOREIGN KEY (zhou_user_id)  REFERENCES zhou_user (zhou_user_id)
);

INSERT INTO zhou_comment (zhou_goods_id, zhou_order_id, zhou_user_id, zhou_rating, zhou_content, zhou_reply, zhou_created_at) VALUES
(4,  1, 8,  5, '卖家描述很准，笔记本续航不错，验机当场就测了，非常满意。', '谢谢支持，欢迎下次再来！', '2026-09-21 09:12:00'),
(9,  2, 2,  5, '降噪效果超出预期，卖家还多送了一个收纳布袋。',              '祝学习顺利！',             '2026-10-03 12:40:00'),
(3,  3, 1,  4, '整体不错，就是充电器不是原装的，介意的朋友注意一下。',        NULL,                        '2026-10-09 10:25:00'),
(13, 4, 5,  5, '吉他手感很好，附带的教材也很实用，卖家很耐心教我调弦。',      '随时来弹琴呀～',           '2026-10-16 19:05:00'),
(2,  1, 3,  5, '真题全新，答案解析清晰，纸质也挺好。',                        '祝四级高分！',             '2026-10-02 08:50:00'),
(11, 7, 3,  4, '键盘静音效果确实好，蓝牙连接很稳定，就是发货稍慢了一天。',      NULL,                        '2026-11-03 15:22:00'),
(1,  6, 9,  5, '书保存得很好，比图书馆借的还新，强烈推荐。',                  NULL,                        '2026-10-26 21:18:00'),
(10, 9, 2,  3, '相机有暗角，卖家也说明了，配件齐全，希望下次能擦亮镜头。',      '已协调部分退款，请查收。', '2026-11-07 16:40:00'),
(14, 8, 10, 5, '鞋子很新，尺码正好，可惜自己买重复了。',                      NULL,                        '2026-11-05 14:10:00');
-- ============================================================
-- 6. 私信留言表 zhou_message
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_message (
    zhou_message_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_goods_id      INTEGER,
    zhou_sender_id     INTEGER NOT NULL,
    zhou_receiver_id   INTEGER NOT NULL,
    zhou_content       TEXT    NOT NULL,
    zhou_is_read       INTEGER NOT NULL DEFAULT 0,
    zhou_created_at    TEXT    NOT NULL,
    FOREIGN KEY (zhou_goods_id)    REFERENCES zhou_goods (zhou_goods_id),
    FOREIGN KEY (zhou_sender_id)   REFERENCES zhou_user (zhou_user_id),
    FOREIGN KEY (zhou_receiver_id) REFERENCES zhou_user (zhou_user_id)
);

INSERT INTO zhou_message (zhou_goods_id, zhou_sender_id, zhou_receiver_id, zhou_content, zhou_is_read, zhou_created_at) VALUES
(1,  2, 1,  '同学你好，同济第七版上册还在吗？可以明天在东区楼下交易吗？', 1, '2026-10-29 09:12:00'),
(1,  1, 2,  '在的，明天中午 12 点东区宿舍楼下见，我带课本过去。',           1, '2026-10-29 09:30:00'),
(3,  6, 7,  'iPad 还在吗？想问一下有没有维修记录，电池健康度多少？',       1, '2026-10-22 20:05:00'),
(3,  7, 6,  '没有维修，电池健康度 92%，可以当面验机。',                       1, '2026-10-22 20:31:00'),
(9,  3, 5,  '耳机还在吗？降噪效果能现场试听吗？',                             1, '2026-10-02 11:20:00'),
(9,  5, 3,  '可以的，约个时间在一号宿舍楼下试听。',                           1, '2026-10-02 12:02:00'),
(7,  9, 8,  '自行车还在吗？车胎是新换的吗？骑了多久了？',                     0, '2026-10-20 18:40:00'),
(13, 6, 1,  '吉他带教材吗？我完全零基础，想学一段时间。',                     0, '2026-09-15 16:12:00'),
(10, 4, 10, '相机镜头有划痕吗？快门数大概多少？',                             0, '2026-11-06 10:05:00'),
(11, 1, 3,  '键盘是白色还是灰色？灯光是白色 RGB 吗？',                       0, '2026-11-02 19:35:00');
-- ============================================================
-- 7. 收藏表 zhou_favorite
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_favorite (
    zhou_favorite_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_user_id       INTEGER NOT NULL,
    zhou_goods_id      INTEGER NOT NULL,
    zhou_created_at    TEXT    NOT NULL,
    UNIQUE (zhou_user_id, zhou_goods_id),
    FOREIGN KEY (zhou_user_id)  REFERENCES zhou_user (zhou_user_id),
    FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id)
);

INSERT INTO zhou_favorite (zhou_user_id, zhou_goods_id, zhou_created_at) VALUES
(1,  9,  '2026-10-01 10:15:00'),
(1,  10, '2026-09-27 14:22:00'),
(2,  3,  '2026-10-07 09:30:00'),
(3,  4,  '2026-09-16 11:05:00'),
(4,  1,  '2026-10-29 08:48:00'),
(5,  13, '2026-09-14 17:33:00'),
(6,  11, '2026-09-23 10:20:00'),
(7,  1,  '2026-10-30 15:12:00'),
(8,  7,  '2026-10-09 09:05:00');

-- ============================================================
-- 8. 公告表 zhou_notice
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_notice (
    zhou_notice_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    zhou_title         TEXT    NOT NULL,
    zhou_content       TEXT,
    zhou_publisher     TEXT    NOT NULL DEFAULT '平台管理员',
    zhou_notice_type   TEXT    NOT NULL DEFAULT '通知',
    zhou_created_at    TEXT    NOT NULL
);

INSERT INTO zhou_notice (zhou_title, zhou_content, zhou_publisher, zhou_notice_type, zhou_created_at) VALUES
('平台交易守则', '所有交易请在校内公共区域当面验货，谨防转账诈骗，平台不担保任何线下交易。', '平台管理员', '公告', '2026-03-02 10:00:00'),
('禁止发布违禁物品', '禁止发布证件、账号、药品及任何违禁物品，一经发现永久封禁。',           '平台管理员', '公告', '2026-03-08 09:30:00'),
('新版商品审核上线', '所有新发布商品需通过内容审核，审核时长约 2 小时，请耐心等待。',         '周浩',       '通知', '2026-06-15 14:00:00'),
('价格异常提醒', '同一商品短期内频繁降价将被系统标记，请在发布前确认价格。',                 '风控小组',   '通知', '2026-07-20 11:20:00'),
('评价规则调整', '交易完成后 15 天内可对商品进行一次评价与追评，逾期订单自动关闭。',         '平台管理员', '通知', '2026-08-12 16:40:00'),
('毕业季专场活动', '六月至七月为毕业季专场，教辅类商品免收服务费，欢迎毕业生集中上架。',   '运营部',     '活动', '2026-09-01 10:00:00'),
('增加校园自提点', '图书馆西门、南苑 8 号楼、北苑快递驿站新增三个自提点，交易更方便。',     '运营部',     '通知', '2026-10-05 09:15:00'),
('系统维护通知', '11 月 10 日 00:00-02:00 进行数据库维护，期间下单功能将短暂不可用。',     '技术部',     '公告', '2026-11-08 18:00:00');

PRAGMA foreign_keys = ON;