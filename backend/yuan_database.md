<!--
  姓名：周浩 | 学号：24001010105 |
  时间：2026-11-12 | 大模型：Space Bunny
  说明：本文件为实验指导书占位符命名的镜像，内容与 backend/zhou_database.md 保持一致。
-->

<!--
  姓名：周浩 | 学号：24001010105 |
  时间：2026-11-09 | 大模型：Space Bunny
-->

# 数据库文档 zhou_database.md

> 规则：每次建表、改表或插入数据后，**按执行顺序追加**对应 SQL 语句（含测试数据的 INSERT），
> 要求仅凭此文件即可在新机器上完整重建数据库。
> 数据库：**MySQL 8.4**（SQLite 方案已废弃并删除，连接驱动 mysql2）。
> 库名：`zhou_campus_market`（utf8mb4 / utf8mb4_unicode_ci / InnoDB）。
> 凭据：见 `backend/.env` 的 DB_USER / DB_PASSWORD / DB_HOST / DB_PORT / DB_NAME（不入库）。
> 重建方式：`cd backend && npm run initdb`（等价于执行下方 `db/zhou_init_mysql.sql` 全量脚本）。

## 表清单与测试数据条数

| 序号 | 表名 | 说明 | 测试数据条数 |
| --- | --- | --- | --- |
| 1 | zhou_user | 用户表 | 10 |
| 2 | zhou_category | 商品分类表 | 8 |
| 3 | zhou_goods | 商品表 | 15 |
| 4 | zhou_order | 订单表 | 9 |
| 5 | zhou_comment | 评价表 | 9 |
| 6 | zhou_message | 私信留言表 | 10 |
| 7 | zhou_favorite | 收藏表 | 9 |
| 8 | zhou_notice | 公告表 | 8 |

## MySQL 与 SQLite 的关键差异（切换记录）

| 项目 | SQLite（旧，已废弃） | MySQL（当前） |
| --- | --- | --- |
| 驱动 | node:sqlite（Node 内置） | mysql2 连接池 |
| 主键自增 | INTEGER PRIMARY KEY AUTOINCREMENT | INT UNSIGNED AUTO_INCREMENT |
| 字符串类型 | TEXT（可带默认值） | VARCHAR(n)（TEXT 不允许默认值） |
| 金额 | REAL | DECIMAL(10,2) |
| 时间 | TEXT（存字符串） | DATETIME |
| 布尔/状态位 | INTEGER | TINYINT(1) |
| 引擎 | 无 | InnoDB + 外键约束 |
| 库/表删除 | DROP TABLE 自动忽略外键 | SET FOREIGN_KEY_CHECKS = 0/1 控制 |

## 执行顺序

1. 建库并切换：`CREATE DATABASE IF NOT EXISTS zhou_campus_market ... ; USE zhou_campus_market;`
2. 关闭外键校验：`SET FOREIGN_KEY_CHECKS = 0;`
3. 按外键依赖倒序删除旧表：DROP TABLE zhou_comment / zhou_message / zhou_favorite / zhou_order / zhou_goods / zhou_category / zhou_user / zhou_notice
4. 顺序建表并写入测试数据：zhou_user → zhou_category → zhou_goods → zhou_order → zhou_comment → zhou_message → zhou_favorite → zhou_notice
5. 恢复外键校验：`SET FOREIGN_KEY_CHECKS = 1;`

## 全量 SQL（按执行顺序，可直接复制执行）

```sql-- 姓名：周浩 | 学号：24001010105 |
-- 时间：2026-11-09 | 大模型：Space Bunny
--
-- zhou_init_mysql.sql —— 校园二手交易平台 MySQL 建库脚本
-- 说明：先建库（utf8mb4），再按外键依赖倒序删表、顺序建表并写入测试数据，
--       仅凭本文件即可在新机器上完整重建数据库。
-- 执行方式：cd backend && npm run initdb

CREATE DATABASE IF NOT EXISTS zhou_campus_market
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE zhou_campus_market;

SET FOREIGN_KEY_CHECKS = 0;

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
    zhou_user_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '用户主键',
    zhou_username     VARCHAR(50)     NOT NULL                COMMENT '登录账号',
    zhou_password     VARCHAR(64)     NOT NULL                COMMENT '密码(MD5)',
    zhou_nickname     VARCHAR(50)     NOT NULL                COMMENT '昵称',
    zhou_gender       VARCHAR(10)     NOT NULL DEFAULT '保密'  COMMENT '性别',
    zhou_college      VARCHAR(50)     DEFAULT NULL            COMMENT '学院班级',
    zhou_phone        VARCHAR(20)     DEFAULT NULL            COMMENT '联系电话',
    zhou_avatar       VARCHAR(100)    DEFAULT NULL            COMMENT '头像图片路径',
    zhou_balance      DECIMAL(10, 2)  NOT NULL DEFAULT 0.00   COMMENT '账户余额',
    zhou_credit       INT             NOT NULL DEFAULT 100    COMMENT '信用分',
    zhou_status       VARCHAR(20)     NOT NULL DEFAULT '正常'  COMMENT '账号状态',
    zhou_created_at   DATETIME        NOT NULL                COMMENT '注册时间',
    PRIMARY KEY (zhou_user_id),
    UNIQUE KEY uk_zhou_user_username (zhou_username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表';

-- ============================================================
-- 2. 商品分类表 zhou_category
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_category (
    zhou_category_id  INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '分类主键',
    zhou_cate_name    VARCHAR(50)     NOT NULL                COMMENT '分类名称',
    zhou_cate_icon    VARCHAR(100)    DEFAULT NULL            COMMENT '分类图标',
    zhou_cate_desc    VARCHAR(200)    DEFAULT NULL            COMMENT '分类描述',
    zhou_sort_order   INT             NOT NULL DEFAULT 0     COMMENT '排序号',
    zhou_created_at   DATETIME        NOT NULL                COMMENT '创建时间',
    PRIMARY KEY (zhou_category_id),
    UNIQUE KEY uk_zhou_category_name (zhou_cate_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商品分类表';

-- ============================================================
-- 3. 商品表 zhou_goods
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_goods (
    zhou_goods_id       INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '商品主键',
    zhou_user_id        INT UNSIGNED   NOT NULL                COMMENT '发布者',
    zhou_category_id    INT UNSIGNED   NOT NULL                COMMENT '所属分类',
    zhou_title          VARCHAR(120)   NOT NULL                COMMENT '商品标题',
    zhou_description    TEXT                                   COMMENT '商品描述',
    zhou_price          DECIMAL(10, 2) NOT NULL                COMMENT '出售价格',
    zhou_original_price DECIMAL(10, 2) DEFAULT NULL            COMMENT '原价',
    zhou_stock          INT            NOT NULL DEFAULT 1     COMMENT '库存',
    zhou_cover          VARCHAR(100)   DEFAULT NULL            COMMENT '封面图路径',
    zhou_condition      VARCHAR(20)    NOT NULL DEFAULT '九成新' COMMENT '成色',
    zhou_trade_place    VARCHAR(100)   DEFAULT NULL            COMMENT '交易地点',
    zhou_status         VARCHAR(20)    NOT NULL DEFAULT '在售' COMMENT '状态',
    zhou_view_count     INT            NOT NULL DEFAULT 0     COMMENT '浏览量',
    zhou_created_at     DATETIME       NOT NULL                COMMENT '发布时间',
    PRIMARY KEY (zhou_goods_id),
    KEY idx_zhou_goods_user (zhou_user_id),
    KEY idx_zhou_goods_category (zhou_category_id),
    KEY idx_zhou_goods_title (zhou_title),
    CONSTRAINT fk_zhou_goods_user FOREIGN KEY (zhou_user_id) REFERENCES zhou_user (zhou_user_id),
    CONSTRAINT fk_zhou_goods_category FOREIGN KEY (zhou_category_id) REFERENCES zhou_category (zhou_category_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商品表';
-- ============================================================
-- 4. 订单表 zhou_order
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_order (
    zhou_order_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '订单主键',
    zhou_order_no      VARCHAR(32)    NOT NULL                COMMENT '订单编号',
    zhou_goods_id      INT UNSIGNED   NOT NULL                COMMENT '商品',
    zhou_buyer_id      INT UNSIGNED   NOT NULL                COMMENT '买家',
    zhou_seller_id     INT UNSIGNED   NOT NULL                COMMENT '卖家',
    zhou_price         DECIMAL(10, 2) NOT NULL                COMMENT '成交单价',
    zhou_quantity      INT            NOT NULL DEFAULT 1     COMMENT '数量',
    zhou_total_amount  DECIMAL(10, 2) NOT NULL                COMMENT '订单总额',
    zhou_status        VARCHAR(20)    NOT NULL DEFAULT '待付款' COMMENT '订单状态',
    zhou_remark        VARCHAR(255)   DEFAULT NULL            COMMENT '备注',
    zhou_created_at    DATETIME       NOT NULL                COMMENT '下单时间',
    zhou_updated_at    DATETIME       NOT NULL                COMMENT '更新时间',
    PRIMARY KEY (zhou_order_id),
    UNIQUE KEY uk_zhou_order_no (zhou_order_no),
    KEY idx_zhou_order_goods (zhou_goods_id),
    KEY idx_zhou_order_buyer (zhou_buyer_id),
    KEY idx_zhou_order_seller (zhou_seller_id),
    CONSTRAINT fk_zhou_order_goods FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id),
    CONSTRAINT fk_zhou_order_buyer FOREIGN KEY (zhou_buyer_id) REFERENCES zhou_user (zhou_user_id),
    CONSTRAINT fk_zhou_order_seller FOREIGN KEY (zhou_seller_id) REFERENCES zhou_user (zhou_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表';

-- ============================================================
-- 5. 评价表 zhou_comment
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_comment (
    zhou_comment_id    INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '评价主键',
    zhou_goods_id      INT UNSIGNED   NOT NULL                COMMENT '被评价商品',
    zhou_order_id      INT UNSIGNED   NOT NULL                COMMENT '对应订单',
    zhou_user_id       INT UNSIGNED   NOT NULL                COMMENT '评价人',
    zhou_rating        INT            NOT NULL DEFAULT 5     COMMENT '评分1-5',
    zhou_content       TEXT                                   COMMENT '评价内容',
    zhou_reply         TEXT                                   COMMENT '卖家回复',
    zhou_created_at    DATETIME       NOT NULL                COMMENT '评价时间',
    PRIMARY KEY (zhou_comment_id),
    KEY idx_zhou_comment_goods (zhou_goods_id),
    KEY idx_zhou_comment_order (zhou_order_id),
    KEY idx_zhou_comment_user (zhou_user_id),
    CONSTRAINT fk_zhou_comment_goods FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id),
    CONSTRAINT fk_zhou_comment_order FOREIGN KEY (zhou_order_id) REFERENCES zhou_order (zhou_order_id),
    CONSTRAINT fk_zhou_comment_user FOREIGN KEY (zhou_user_id) REFERENCES zhou_user (zhou_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '评价表';

-- ============================================================
-- 6. 私信留言表 zhou_message
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_message (
    zhou_message_id    INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '私信主键',
    zhou_goods_id      INT UNSIGNED   DEFAULT NULL            COMMENT '关联商品',
    zhou_sender_id     INT UNSIGNED   NOT NULL                COMMENT '发送者',
    zhou_receiver_id   INT UNSIGNED   NOT NULL                COMMENT '接收者',
    zhou_content       TEXT           NOT NULL                COMMENT '私信内容',
    zhou_is_read       TINYINT(1)     NOT NULL DEFAULT 0      COMMENT '是否已读',
    zhou_created_at    DATETIME       NOT NULL                COMMENT '发送时间',
    PRIMARY KEY (zhou_message_id),
    KEY idx_zhou_message_goods (zhou_goods_id),
    KEY idx_zhou_message_sender (zhou_sender_id),
    KEY idx_zhou_message_receiver (zhou_receiver_id),
    CONSTRAINT fk_zhou_message_goods FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id),
    CONSTRAINT fk_zhou_message_sender FOREIGN KEY (zhou_sender_id) REFERENCES zhou_user (zhou_user_id),
    CONSTRAINT fk_zhou_message_receiver FOREIGN KEY (zhou_receiver_id) REFERENCES zhou_user (zhou_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '私信留言表';

-- ============================================================
-- 7. 收藏表 zhou_favorite
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_favorite (
    zhou_favorite_id   INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '收藏主键',
    zhou_user_id       INT UNSIGNED   NOT NULL                COMMENT '用户',
    zhou_goods_id      INT UNSIGNED   NOT NULL                COMMENT '商品',
    zhou_created_at    DATETIME       NOT NULL                COMMENT '收藏时间',
    PRIMARY KEY (zhou_favorite_id),
    UNIQUE KEY uk_zhou_favorite (zhou_user_id, zhou_goods_id),
    KEY idx_zhou_favorite_goods (zhou_goods_id),
    CONSTRAINT fk_zhou_favorite_user FOREIGN KEY (zhou_user_id) REFERENCES zhou_user (zhou_user_id),
    CONSTRAINT fk_zhou_favorite_goods FOREIGN KEY (zhou_goods_id) REFERENCES zhou_goods (zhou_goods_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '收藏表';

-- ============================================================
-- 8. 公告表 zhou_notice
-- ============================================================
CREATE TABLE IF NOT EXISTS zhou_notice (
    zhou_notice_id     INT UNSIGNED   NOT NULL AUTO_INCREMENT COMMENT '公告主键',
    zhou_title         VARCHAR(120)   NOT NULL                COMMENT '标题',
    zhou_content       TEXT                                   COMMENT '正文',
    zhou_publisher     VARCHAR(50)    NOT NULL DEFAULT '平台管理员' COMMENT '发布人',
    zhou_notice_type   VARCHAR(20)    NOT NULL DEFAULT '通知'  COMMENT '类型',
    zhou_created_at    DATETIME       NOT NULL                COMMENT '发布时间',
    PRIMARY KEY (zhou_notice_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '公告表';

-- ============================================================
-- 测试数据（每张表不少于 8 条，均为真实业务场景数据）
-- ============================================================

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

INSERT INTO zhou_category (zhou_cate_name, zhou_cate_icon, zhou_cate_desc, zhou_sort_order, zhou_created_at) VALUES
('教材教辅', 'images/cate_book.png',  '课本、考研资料、习题册与真题', 1, '2026-03-01 08:00:00'),
('电子数码', 'images/cate_pc.png',    '笔记本、平板、耳机、相机等',   2, '2026-03-01 08:00:00'),
('生活用品', 'images/cate_life.png',  '宿舍桌椅上、收纳与日用百货',   3, '2026-03-01 08:00:00'),
('运动户外', 'images/cate_sport.png', '球类、健身器材、户外装备',     4, '2026-03-01 08:00:00'),
('图书影音', 'images/cate_read.png',  '课外读物、唱片、影视周边',     5, '2026-03-01 08:00:00'),
('代步工具', 'images/cate_bike.png',  '自行车、滑板车、电动车',       6, '2026-03-01 08:00:00'),
('乐器文娱', 'images/cate_music.png', '吉他、尤克里里、乐器配件',     7, '2026-03-01 08:00:00'),
('服饰鞋包', 'images/cate_cloth.png', '衣物、鞋子、背包与配饰',       8, '2026-03-01 08:00:00');

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

INSERT INTO zhou_notice (zhou_title, zhou_content, zhou_publisher, zhou_notice_type, zhou_created_at) VALUES
('平台交易守则', '所有交易请在校内公共区域当面验货，谨防转账诈骗，平台不担保任何线下交易。', '平台管理员', '公告', '2026-03-02 10:00:00'),
('禁止发布违禁物品', '禁止发布证件、账号、药品及任何违禁物品，一经发现永久封禁。',           '平台管理员', '公告', '2026-03-08 09:30:00'),
('新版商品审核上线', '所有新发布商品需通过内容审核，审核时长约 2 小时，请耐心等待。',         '周浩',       '通知', '2026-06-15 14:00:00'),
('价格异常提醒', '同一商品短期内频繁降价将被系统标记，请在发布前确认价格。',                 '风控小组',   '通知', '2026-07-20 11:20:00'),
('评价规则调整', '交易完成后 15 天内可对商品进行一次评价与追评，逾期订单自动关闭。',         '平台管理员', '通知', '2026-08-12 16:40:00'),
('毕业季专场活动', '六月至七月为毕业季专场，教辅类商品免收服务费，欢迎毕业生集中上架。',   '运营部',     '活动', '2026-09-01 10:00:00'),
('增加校园自提点', '图书馆西门、南苑 8 号楼、北苑快递驿站新增三个自提点，交易更方便。',     '运营部',     '通知', '2026-10-05 09:15:00'),
('系统维护通知', '11 月 10 日 00:00-02:00 进行数据库维护，期间下单功能将短暂不可用。',     '技术部',     '公告', '2026-11-08 18:00:00');

SET FOREIGN_KEY_CHECKS = 1;
```

---

## LLM 应用设计实验新增表（2026-11-12）

> 本节为《LLM应用设计》实验新增的 4 张表，用于多轮会话与 RAG 知识库。
> 重建方式：`cd backend; node db/zhou_init_llm.js`。

| 序号 | 表名 | 说明 | 测试数据条数 |
| --- | --- | --- | --- |
| 9 | zhou_session | AI 会话表（多轮对话容器、摘要与用量统计） | 8 |
| 10 | zhou_chat_message | AI 聊天消息表（上下文与历史回放） | 18 |
| 11 | zhou_kb_doc | 知识库文档表（RAG 上传文件） | 8 |
| 12 | zhou_kb_chunk | 知识库切片表（ngram 全文索引） | 16 |

### 完整 SQL（含建表与测试数据）

```sql
-- ============================================================
-- 姓名：周浩 | 学号：24001010105 |
-- 时间：2026-11-12 | 大模型：Space Bunny
-- LLM 应用设计实验：会话、聊天消息、知识库文档与切片表
-- 数据库：MySQL 8.4（zhou_campus_market）
-- ============================================================

USE zhou_campus_market;

DROP TABLE IF EXISTS zhou_chat_message;
DROP TABLE IF EXISTS zhou_session;
DROP TABLE IF EXISTS zhou_kb_chunk;
DROP TABLE IF EXISTS zhou_kb_doc;

CREATE TABLE zhou_session (
  zhou_session_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  zhou_user_id      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '会话归属用户',
  zhou_title        VARCHAR(120) NOT NULL DEFAULT '新的对话' COMMENT '会话标题（首问自动生成，可重命名）',
  zhou_model        VARCHAR(80) NOT NULL DEFAULT 'deepseek-ai/DeepSeek-V4-Flash' COMMENT '本会话使用的大模型',
  zhou_summary      TEXT NULL COMMENT '早期对话压缩后的摘要',
  zhou_summarized_count INT NOT NULL DEFAULT 0 COMMENT '已被压缩进摘要的消息条数',
  zhou_message_count INT NOT NULL DEFAULT 0 COMMENT '消息条数',
  zhou_token_total  INT NOT NULL DEFAULT 0 COMMENT '累计消耗 token',
  zhou_status       TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 正常 0 已删除',
  zhou_created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  zhou_updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (zhou_session_id),
  KEY idx_zhou_session_user (zhou_user_id, zhou_updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 会话表';

CREATE TABLE zhou_chat_message (
  zhou_message_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  zhou_session_id   INT UNSIGNED NOT NULL,
  zhou_role         VARCHAR(16) NOT NULL COMMENT 'user / assistant / system',
  zhou_content      TEXT NOT NULL COMMENT '消息正文',
  zhou_tokens       INT NOT NULL DEFAULT 0 COMMENT '本条消耗 token',
  zhou_elapsed      INT NOT NULL DEFAULT 0 COMMENT '本条耗时（毫秒）',
  zhou_created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (zhou_message_id),
  KEY idx_zhou_msg_session (zhou_session_id, zhou_message_id),
  CONSTRAINT fk_zhou_msg_session FOREIGN KEY (zhou_session_id)
    REFERENCES zhou_session (zhou_session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 聊天消息表';

CREATE TABLE zhou_kb_doc (
  zhou_doc_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  zhou_user_id      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '上传者',
  zhou_file_name    VARCHAR(200) NOT NULL COMMENT '原始文件名',
  zhou_file_type    VARCHAR(20) NOT NULL COMMENT 'pdf / txt',
  zhou_file_size    INT NOT NULL DEFAULT 0 COMMENT '字节数',
  zhou_chunk_count  INT NOT NULL DEFAULT 0 COMMENT '切分出的切片数',
  zhou_char_count   INT NOT NULL DEFAULT 0 COMMENT '解析出的字符数',
  zhou_status       VARCHAR(16) NOT NULL DEFAULT '已解析' COMMENT '解析中 / 已解析 / 失败',
  zhou_remark       VARCHAR(200) NULL COMMENT '备注',
  zhou_created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (zhou_doc_id),
  KEY idx_zhou_doc_user (zhou_user_id, zhou_created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档表';

CREATE TABLE zhou_kb_chunk (
  zhou_chunk_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  zhou_doc_id       INT UNSIGNED NOT NULL,
  zhou_chunk_index  INT NOT NULL DEFAULT 0 COMMENT '切片序号',
  zhou_content      TEXT NOT NULL COMMENT '切片正文',
  zhou_keywords     VARCHAR(300) NULL COMMENT '提取的关键词',
  zhou_created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (zhou_chunk_id),
  KEY idx_zhou_chunk_doc (zhou_doc_id, zhou_chunk_index),
  FULLTEXT KEY ft_zhou_chunk_content (zhou_content) WITH PARSER ngram,
  CONSTRAINT fk_zhou_chunk_doc FOREIGN KEY (zhou_doc_id)
    REFERENCES zhou_kb_doc (zhou_doc_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库切片表';
-- ============================================================
-- 测试数据：每张表不少于 8 条有真实业务意义的记录
-- ============================================================

-- ---------- zhou_session：8 条会话 ----------
INSERT INTO zhou_session (zhou_session_id, zhou_user_id, zhou_title, zhou_model, zhou_summary, zhou_message_count, zhou_token_total, zhou_status, zhou_created_at, zhou_updated_at) VALUES
(1, 1, '询问降噪耳机价格', 'deepseek-ai/DeepSeek-V4-Flash', '用户关注索尼 WH-1000XM4 降噪耳机，成交价 780 元，交易地点一号宿舍楼。', 4, 812, 1, '2026-11-09 09:12:00', '2026-11-09 09:18:00'),
(2, 2, '教材与习题册求购', 'deepseek-ai/DeepSeek-V4-Flash', NULL, 2, 356, 1, '2026-11-09 10:05:00', '2026-11-09 10:07:00'),
(3, 3, '自行车代步工具咨询', 'deepseek-ai/DeepSeek-V4-Flash', '用户询问宿舍区可用的自行车，平台在售两辆山地车与一辆折叠车。', 4, 704, 1, '2026-11-09 11:20:00', '2026-11-09 11:26:00'),
(4, 4, '数码产品比价', 'deepseek-ai/DeepSeek-V4-Flash', NULL, 2, 298, 1, '2026-11-09 13:02:00', '2026-11-09 13:04:00'),
(5, 5, '交易守则与安全提醒', 'deepseek-ai/DeepSeek-V4-Flash', '用户询问交易注意事项，已说明当面验货、避免提前转账等守则。', 6, 1024, 1, '2026-11-10 08:30:00', '2026-11-10 08:41:00'),
(6, 6, '考研资料求购', 'deepseek-ai/DeepSeek-V4-Flash', NULL, 2, 342, 1, '2026-11-10 09:45:00', '2026-11-10 09:47:00'),
(7, 7, '摄影器材转让', 'deepseek-ai/DeepSeek-V4-Flash', '用户咨询相机与镜头搭配，已推荐 Canon 入门套机与 50mm 定焦。', 4, 688, 1, '2026-11-10 15:10:00', '2026-11-10 15:16:00'),
(8, 8, '长对话压缩测试', 'deepseek-ai/DeepSeek-V4-Flash', '该会话累计 20 条消息，早期内容已被压缩为摘要，用于验证 Token 预算控制。', 20, 3860, 1, '2026-11-11 19:20:00', '2026-11-11 19:38:00');

-- ---------- zhou_chat_message：16 条消息（每个会话 user + assistant 各一条） ----------
INSERT INTO zhou_chat_message (zhou_session_id, zhou_role, zhou_content, zhou_tokens, zhou_elapsed, zhou_created_at) VALUES
(1, 'user', '平台上有什么耳机在卖？', 26, 0, '2026-11-09 09:12:00'),
(1, 'assistant', '平台上目前在售的耳机是索尼 WH-1000XM4 降噪耳机，价格 780.00 元，九成新，附收纳盒与音频线，交易地点在一号宿舍楼。', 118, 5125, '2026-11-09 09:12:06'),
(1, 'user', '卖家是谁？可以当面交易吗？', 24, 0, '2026-11-09 09:15:00'),
(1, 'assistant', '卖家是赵梦琪（网安24001），交易地点在一号宿舍楼，建议约在宿舍楼下公共区域当面验货。', 96, 3860, '2026-11-09 09:15:04'),
(2, 'user', '帮我找价格低于 100 元的教材', 26, 0, '2026-11-09 10:05:00'),
(2, 'assistant', '平台上低于 100 元的教材有《数据结构与算法分析》教材，价格 20.00 元，八成新，影印版无笔记，交易地点在实验楼 A 座。', 104, 3019, '2026-11-09 10:05:03'),
(3, 'user', '宿舍能用的自行车有哪些？', 24, 0, '2026-11-09 11:20:00'),
(3, 'assistant', '宿舍区可用自行车有两辆山地车与一辆折叠车，折叠车折叠后便于放进宿舍和车厢，价格在 180 到 320 元之间。', 112, 4207, '2026-11-09 11:20:05'),
(4, 'user', '笔记本和键盘哪个更划算？', 22, 0, '2026-11-09 13:02:00'),
(4, 'assistant', '若主要需求是编程与文档整理，二手笔记本更划算，平台有一台联想小新 Pro 14，售价 3280 元。', 86, 2876, '2026-11-09 13:02:03'),
(5, 'user', '交易要注意什么？', 20, 0, '2026-11-10 08:30:00'),
(5, 'assistant', '请在校内公共区域当面验货后再付款，避免提前转账；确认商品成色与描述一致，保留聊天记录作为凭证。', 98, 2640, '2026-11-10 08:30:04'),
(6, 'user', '有考研英语的资料吗？', 22, 0, '2026-11-10 09:45:00'),
(6, 'assistant', '平台有一本《考研英语真题解析》教材，价格 45.00 元，七成新，分类为教材教辅，交易地点在三号宿舍楼。', 104, 3305, '2026-11-10 09:45:04'),
(7, 'user', '想入门摄影，有什么推荐？', 22, 0, '2026-11-10 15:10:00'),
(7, 'assistant', '推荐 Canon 入门套机，配 50mm 定焦最适合校园街拍，套机价格 2450 元，成色九成新，含原装电池。', 108, 3521, '2026-11-10 15:10:04'),
(8, 'user', '这个会话很长了吗？会不会超出上下文？', 24, 0, '2026-11-11 19:20:00'),
(8, 'assistant', '当前会话已达 20 条消息，系统会保留最近 6 轮原文，早期内容压缩为摘要写入会话表，以控制 Token 预算。', 102, 2988, '2026-11-11 19:20:04');
-- ---------- zhou_kb_doc：8 条知识库文档 ----------
INSERT INTO zhou_kb_doc (zhou_doc_id, zhou_user_id, zhou_file_name, zhou_file_type, zhou_file_size, zhou_chunk_count, zhou_char_count, zhou_status, zhou_remark, zhou_created_at) VALUES
(1, 1, '校园二手集市交易守则.txt', 'txt', 2048, 2, 386, '已解析', '平台官方规则，解释当面交易与防诈骗要求', '2026-11-08 10:00:00'),
(2, 1, '教材教辅参考书目.pdf', 'pdf', 184320, 2, 512, '已解析', '常见教材价格区间参考', '2026-11-08 10:20:00'),
(3, 2, '数码耳机选购指南.txt', 'txt', 3072, 2, 428, '已解析', '耳机参数与价格对照', '2026-11-08 11:05:00'),
(4, 2, '宿舍代步工具清单.txt', 'txt', 2560, 2, 372, '已解析', '自行车与滑板车等代步工具说明', '2026-11-08 14:30:00'),
(5, 3, '摄影器材入门手册.pdf', 'pdf', 245760, 2, 486, '已解析', '相机与镜头搭配建议', '2026-11-09 09:15:00'),
(6, 3, '考研资料汇总.txt', 'txt', 1536, 2, 298, '已解析', '考研英语与数学资料清单', '2026-11-09 09:40:00'),
(7, 4, '平台商品分类说明.txt', 'txt', 1280, 2, 264, '已解析', '八类商品的划分标准', '2026-11-09 15:25:00'),
(8, 4, '闲置物品估价参考.txt', 'txt', 1792, 2, 342, '已解析', '常见二手物品估价区间', '2026-11-10 10:10:00');

-- ---------- zhou_kb_chunk：16 条知识库切片 ----------
INSERT INTO zhou_kb_chunk (zhou_doc_id, zhou_chunk_index, zhou_content, zhou_keywords, zhou_created_at) VALUES
(1, 0, '校园二手集市交易守则：所有交易应当在校内公共区域当面完成，付款前必须现场检查商品成色、功能与配件是否与描述一致。', '交易守则,当面交易,验货,成色', '2026-11-08 10:00:00'),
(1, 1, '安全提醒：禁止提前转账或使用他人账户代付，谨防兼职刷单与提前交定金等诈骗套路，遇到可疑情况请及时联系平台管理员。', '安全提醒,防诈骗,转账,管理员', '2026-11-08 10:00:00'),
(2, 0, '教材教辅参考书目：数据结构与算法分析教材约 20 元，考研英语真题解析约 45 元，高等数学教材约 35 元，均为影印版或七成新。', '教材,教辅,数据结构,考研英语,高等数学,价格', '2026-11-08 10:20:00'),
(2, 1, '教材选购建议：优先选择无笔记无划线的版本，重点章节有标注的教材同样有价值；教材交易地点多在实验楼 A 座或三号宿舍楼。', '教材选购,笔记,划线,实验楼,三号宿舍楼', '2026-11-08 10:20:00'),
(3, 0, '耳机选购指南：索尼 WH-1000XM4 降噪耳机二手价约 780 元；蓝牙耳机入门款 120 至 260 元；有线头戴式耳机 60 至 150 元。', '耳机,索尼,降噪,蓝牙耳机,价格', '2026-11-08 11:05:00'),
(3, 1, '耳机验货要点：检查耳罩是否掉皮、电池续航是否正常、是否附赠收纳盒与音频线；降噪耳机建议现场试听降噪效果。', '耳机验货,耳罩,电池,收纳盒,降噪', '2026-11-08 11:05:00'),
(4, 0, '宿舍代步工具清单：山地车约 260 至 320 元，折叠车约 180 元，滑板车约 150 元；代步工具交易多在北区车棚与体育馆东门。', '自行车,山地车,折叠车,滑板车,车棚', '2026-11-08 14:30:00'),
(4, 1, '代步工具建议：折叠车折叠后便于放进宿舍与车厢，适合通勤；山地车适合长距离骑行，骑行前请检查刹车与轮胎气压。', '折叠车,通勤,山地车,刹车,轮胎', '2026-11-08 14:30:00'),
(5, 0, '摄影器材入门手册：Canon 入门套机约 2450 元，适合校园街拍与日常记录；尼康单反机身约 1800 元，配 50mm 定焦镜头约 900 元。', '相机,Canon,尼康,套机,定焦镜头,价格', '2026-11-09 09:15:00'),
(5, 1, '摄影器材建议：套机含原装电池与充电器，验货时检查快门次数、传感器有无坏点；镜头建议选择 50mm 定焦，拍摄人像与风景都够用。', '快门次数,坏点,镜头,50mm,人像', '2026-11-09 09:15:00'),
(6, 0, '考研资料汇总：考研英语真题解析约 45 元，考研数学复习全书约 55 元，考研政治背诵手册约 30 元，均为正版教材。', '考研,英语真题,数学,政治,价格', '2026-11-09 09:40:00'),
(6, 1, '考研资料建议：优先选择最新版次教材，真题类书籍做过笔记的更有价值；建议与同院系同学交换资料，提高使用率。', '考研资料,最新版,真题,交换', '2026-11-09 09:40:00'),
(7, 0, '平台商品分类说明：教材教辅、电子数码、生活用品、图书、运动器材、乐器、化妆品与其他，共八类，发布时需选择最贴近的分类。', '分类,教材教辅,电子数码,生活用品,图书', '2026-11-09 15:25:00'),
(7, 1, '分类建议：运动器材包含自行车与滑板车，乐器包含吉他与电子琴；分错类会影响搜索命中率，商品标题建议写清品牌与型号。', '运动器材,乐器,分类建议,搜索命中,标题', '2026-11-09 15:25:00'),
(8, 0, '闲置物品估价参考：教材类 10 至 60 元，耳机类 60 至 800 元，自行车类 150 至 350 元，笔记本类 2000 至 4500 元，相机类 1800 至 2600 元。', '估价,教材,耳机,自行车,笔记本,相机', '2026-11-10 10:10:00'),
(8, 1, '估价说明：估价区间综合了成色与配件情况，九成新带原装配件的物品接近区间上限，三成新或缺配件的接近下限；最终以实际看货为准。', '估价说明,成色,配件,看货', '2026-11-10 10:10:00');
```

- 修改时间：2026-11-12


## 数据修正记录（2026-11-12 关键词算法升级与历史数据修正）

> 背景：联调阶段发现两类问题——① 历史上传时因编码问题产生乱码文件名；
> ② 切片关键词采用「2 字滑窗」统计，出现「园二」「手集」「材约」等跨字噪声。
> 本次将 `zhou_kb_model.js` 的 `zhou_extract_keywords` 升级为
> 「正向最大匹配分词 + 词频统计 + 虚词过滤 + 长词覆盖短词」，并同步修正历史数据。
> 以下 SQL 按实际执行顺序排列，执行后即可还原当前数据库状态。

### 修正 1：乱码文件名改为与正文一致的名称

```sql
-- 原值：'æææ¨èæ¸å.txt'（上传时字符集解码错误导致 mojibake）
UPDATE zhou_kb_doc
   SET zhou_file_name = '历史记录-教材推荐清单.txt'
 WHERE zhou_doc_id = 9;
```

### 修正 2：删除冗余上传记录（文件名重复且正文为子集）

```sql
-- doc10「教材推荐清单.txt」（35 字）与 doc12（72 字）同名，
-- 且正文为 doc12 的子集，删除以避免检索召回重复内容；
-- 外键 fk_zhou_chunk_doc 为 ON DELETE CASCADE，其切片一并删除。
DELETE FROM zhou_kb_doc WHERE zhou_doc_id = 10;
```

### 修正 3：按新算法重算全部切片关键词

```sql
UPDATE zhou_kb_chunk SET zhou_keywords = '校园,交易,守则,成色,配件,二手,集市,公共区域,当面' WHERE zhou_chunk_id = 1;
UPDATE zhou_kb_chunk SET zhou_keywords = '管理员,诈骗,转账,平台,定金' WHERE zhou_chunk_id = 2;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,教辅,考研,英语,数学,真题,书目,参考,参考书,数据结构,算法,七成' WHERE zhou_chunk_id = 3;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,宿舍,交易,选购,笔记' WHERE zhou_chunk_id = 4;
UPDATE zhou_kb_chunk SET zhou_keywords = '耳机,降噪,蓝牙,头戴,二手,选购' WHERE zhou_chunk_id = 5;
UPDATE zhou_kb_chunk SET zhou_keywords = '耳机,降噪,验货,电池,收纳' WHERE zhou_chunk_id = 6;
UPDATE zhou_kb_chunk SET zhou_keywords = '山地车,折叠车,滑板车,代步,宿舍,交易,清单' WHERE zhou_chunk_id = 7;
UPDATE zhou_kb_chunk SET zhou_keywords = '山地车,折叠车,代步,宿舍' WHERE zhou_chunk_id = 8;
UPDATE zhou_kb_chunk SET zhou_keywords = '镜头,摄影,单反,校园,手册,器材' WHERE zhou_chunk_id = 9;
UPDATE zhou_kb_chunk SET zhou_keywords = '镜头,摄影,验货,器材,原装,电池,充电器' WHERE zhou_chunk_id = 10;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,考研,英语,数学,政治,真题,手册,资料' WHERE zhou_chunk_id = 11;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,考研,真题,资料,笔记' WHERE zhou_chunk_id = 12;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,教辅,平台,说明,器材' WHERE zhou_chunk_id = 13;
UPDATE zhou_kb_chunk SET zhou_keywords = '自行车,滑板车,器材,搜索' WHERE zhou_chunk_id = 14;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,耳机,笔记本,自行车,相机,估价,参考' WHERE zhou_chunk_id = 15;
UPDATE zhou_kb_chunk SET zhou_keywords = '成色,配件,估价,说明,接近,九成,原装' WHERE zhou_chunk_id = 16;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,考研,英语,真题,校园,交易,二手,清单,集市,推荐,数据结构,笔记' WHERE zhou_chunk_id = 17;
UPDATE zhou_kb_chunk SET zhou_keywords = '自行车,折叠车,宿舍,校园,交易,守则,管理员,转账,平台,二手,说明,楼道' WHERE zhou_chunk_id = 19;
UPDATE zhou_kb_chunk SET zhou_keywords = '教材,考研,英语,真题,校园,交易,二手,清单,集市,推荐,数据结构,笔记' WHERE zhou_chunk_id = 20;
```

### 当前 zhou_kb_doc 全量状态（11 条）

```sql
INSERT INTO zhou_kb_doc (zhou_doc_id, zhou_user_id, zhou_file_name, zhou_file_type, zhou_file_size, zhou_chunk_count, zhou_char_count, zhou_status, zhou_remark, zhou_created_at) VALUES
(1, 1, '校园二手集市交易守则.txt', 'txt', 2048, 2, 386, '已解析', '平台官方规则，解释当面交易与防诈骗要求', '2026-11-08 10:00:00'),
(2, 1, '教材教辅参考书目.pdf', 'pdf', 184320, 2, 512, '已解析', '常见教材价格区间参考', '2026-11-08 10:20:00'),
(3, 2, '数码耳机选购指南.txt', 'txt', 3072, 2, 428, '已解析', '耳机参数与价格对照', '2026-11-08 11:05:00'),
(4, 2, '宿舍代步工具清单.txt', 'txt', 2560, 2, 372, '已解析', '自行车与滑板车等代步工具说明', '2026-11-08 14:30:00'),
(5, 3, '摄影器材入门手册.pdf', 'pdf', 245760, 2, 486, '已解析', '相机与镜头搭配建议', '2026-11-09 09:15:00'),
(6, 3, '考研资料汇总.txt', 'txt', 1536, 2, 298, '已解析', '考研英语与数学资料清单', '2026-11-09 09:40:00'),
(7, 4, '平台商品分类说明.txt', 'txt', 1280, 2, 264, '已解析', '八类商品的划分标准', '2026-11-09 15:25:00'),
(8, 4, '闲置物品估价参考.txt', 'txt', 1792, 2, 342, '已解析', '常见二手物品估价区间', '2026-11-10 10:10:00'),
(9, 1, '历史记录-教材推荐清单.txt', 'txt', 186, 1, 72, '已解析', '自动切分 1 个片段', '2026-11-12 14:31:35'),
(11, 1, '测试上传-宿舍守则.txt', 'txt', 297, 1, 99, '已解析', '自动切分 1 个片段', '2026-11-12 14:37:14'),
(12, 1, '教材推荐清单.txt', 'txt', 186, 1, 72, '已解析', '自动切分 1 个片段', '2026-11-12 14:47:40');
```

### 当前 zhou_kb_chunk 全量状态（19 条）

```sql
INSERT INTO zhou_kb_chunk (zhou_doc_id, zhou_chunk_index, zhou_content, zhou_keywords, zhou_created_at) VALUES
(1, 0, '校园二手集市交易守则：所有交易应当在校内公共区域当面完成，付款前必须现场检查商品成色、功能与配件是否与描述一致。', '校园,交易,守则,成色,配件,二手,集市,公共区域,当面', '2026-11-08 10:00:00'),
(1, 1, '安全提醒：禁止提前转账或使用他人账户代付，谨防兼职刷单与提前交定金等诈骗套路，遇到可疑情况请及时联系平台管理员。', '管理员,诈骗,转账,平台,定金', '2026-11-08 10:00:00'),
(2, 0, '教材教辅参考书目：数据结构与算法分析教材约 20 元，考研英语真题解析约 45 元，高等数学教材约 35 元，均为影印版或七成新。', '教材,教辅,考研,英语,数学,真题,书目,参考,参考书,数据结构,算法,七成', '2026-11-08 10:20:00'),
(2, 1, '教材选购建议：优先选择无笔记无划线的版本，重点章节有标注的教材同样有价值；教材交易地点多在实验楼 A 座或三号宿舍楼。', '教材,宿舍,交易,选购,笔记', '2026-11-08 10:20:00'),
(3, 0, '耳机选购指南：索尼 WH-1000XM4 降噪耳机二手价约 780 元；蓝牙耳机入门款 120 至 260 元；有线头戴式耳机 60 至 150 元。', '耳机,降噪,蓝牙,头戴,二手,选购', '2026-11-08 11:05:00'),
(3, 1, '耳机验货要点：检查耳罩是否掉皮、电池续航是否正常、是否附赠收纳盒与音频线；降噪耳机建议现场试听降噪效果。', '耳机,降噪,验货,电池,收纳', '2026-11-08 11:05:00'),
(4, 0, '宿舍代步工具清单：山地车约 260 至 320 元，折叠车约 180 元，滑板车约 150 元；代步工具交易多在北区车棚与体育馆东门。', '山地车,折叠车,滑板车,代步,宿舍,交易,清单', '2026-11-08 14:30:00'),
(4, 1, '代步工具建议：折叠车折叠后便于放进宿舍与车厢，适合通勤；山地车适合长距离骑行，骑行前请检查刹车与轮胎气压。', '山地车,折叠车,代步,宿舍', '2026-11-08 14:30:00'),
(5, 0, '摄影器材入门手册：Canon 入门套机约 2450 元，适合校园街拍与日常记录；尼康单反机身约 1800 元，配 50mm 定焦镜头约 900 元。', '镜头,摄影,单反,校园,手册,器材', '2026-11-09 09:15:00'),
(5, 1, '摄影器材建议：套机含原装电池与充电器，验货时检查快门次数、传感器有无坏点；镜头建议选择 50mm 定焦，拍摄人像与风景都够用。', '镜头,摄影,验货,器材,原装,电池,充电器', '2026-11-09 09:15:00'),
(6, 0, '考研资料汇总：考研英语真题解析约 45 元，考研数学复习全书约 55 元，考研政治背诵手册约 30 元，均为正版教材。', '教材,考研,英语,数学,政治,真题,手册,资料', '2026-11-09 09:40:00'),
(6, 1, '考研资料建议：优先选择最新版次教材，真题类书籍做过笔记的更有价值；建议与同院系同学交换资料，提高使用率。', '教材,考研,真题,资料,笔记', '2026-11-09 09:40:00'),
(7, 0, '平台商品分类说明：教材教辅、电子数码、生活用品、图书、运动器材、乐器、化妆品与其他，共八类，发布时需选择最贴近的分类。', '教材,教辅,平台,说明,器材', '2026-11-09 15:25:00'),
(7, 1, '分类建议：运动器材包含自行车与滑板车，乐器包含吉他与电子琴；分错类会影响搜索命中率，商品标题建议写清品牌与型号。', '自行车,滑板车,器材,搜索', '2026-11-09 15:25:00'),
(8, 0, '闲置物品估价参考：教材类 10 至 60 元，耳机类 60 至 800 元，自行车类 150 至 350 元，笔记本类 2000 至 4500 元，相机类 1800 至 2600 元。', '教材,耳机,笔记本,自行车,相机,估价,参考', '2026-11-10 10:10:00'),
(8, 1, '估价说明：估价区间综合了成色与配件情况，九成新带原装配件的物品接近区间上限，三成新或缺配件的接近下限；最终以实际看货为准。', '成色,配件,估价,说明,接近,九成,原装', '2026-11-10 10:10:00'),
(9, 0, '校园二手集市教材推荐清单：数据结构教材 20 元，高数教材 35 元，考研英语真题 45 元。教材优先选无笔记的版本，交易地点在实验楼 A 座。', '教材,考研,英语,真题,校园,交易,二手,清单,集市,推荐,数据结构,笔记', '2026-11-12 14:31:35'),
(11, 0, '校园二手集市宿舍区交易守则补充说明：夜间交易请选择在宿舍楼下路灯充足的公共区域，不要在楼道内长时间逗留。自行车与折叠车请在楼道外指定位置停放，避免影响他人通行。遇到可疑转账要求请立即联系平台管理员。', '自行车,折叠车,宿舍,校园,交易,守则,管理员,转账,平台,二手,说明,楼道', '2026-11-12 14:37:14'),
(12, 0, '校园二手集市教材推荐清单：数据结构教材 20 元，高数教材 35 元，考研英语真题 45 元。教材优先选无笔记的版本，交易地点在实验楼 A 座。', '教材,考研,英语,真题,校园,交易,二手,清单,集市,推荐,数据结构,笔记', '2026-11-12 14:47:40');
```

- 修改时间：2026-11-12
