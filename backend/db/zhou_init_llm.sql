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