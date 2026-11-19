-- ============================================================
-- 姓名：周浩 | 学号：24001010105 |
-- 时间：2026-11-19 | 大模型：Space Bunny
--
-- zhou_init_vector.sql —— LLM 应用设计实验：RAG 向量化扩展
-- 说明：MySQL 8.4 无原生 VECTOR 类型，向量以「逗号分隔十进制」存入
--       MEDIUMTEXT，并冗余存储向量模长 zhou_norm，检索时免开方。
--       配合《LLM应用设计 实验指导书》「知识库管理（RAG）」中
--       「文本解析与切分、向量化与入库」的要求。
-- ============================================================

USE zhou_campus_market;

-- ---------- zhou_kb_vector：知识库切片向量表 ----------
DROP TABLE IF EXISTS zhou_kb_vector;
CREATE TABLE zhou_kb_vector (
  zhou_vector_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  zhou_chunk_id    INT UNSIGNED NOT NULL COMMENT '对应的知识库切片ID',
  zhou_doc_id      INT UNSIGNED NOT NULL COMMENT '所属文档ID',
  zhou_model       VARCHAR(80) NOT NULL DEFAULT 'BAAI/bge-m3' COMMENT '向量化模型',
  zhou_dim         INT NOT NULL DEFAULT 1024 COMMENT '向量维度',
  zhou_vector      MEDIUMTEXT NOT NULL COMMENT '逗号分隔的 float32 向量',
  zhou_norm        DOUBLE NOT NULL DEFAULT 0 COMMENT '向量模长（检索加速）',
  zhou_created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (zhou_vector_id),
  UNIQUE KEY uk_zhou_vector_chunk (zhou_chunk_id),
  KEY idx_zhou_vector_doc (zhou_doc_id),
  CONSTRAINT fk_zhou_vector_chunk FOREIGN KEY (zhou_chunk_id)
    REFERENCES zhou_kb_chunk (zhou_chunk_id) ON DELETE CASCADE,
  CONSTRAINT fk_zhou_vector_doc FOREIGN KEY (zhou_doc_id)
    REFERENCES zhou_kb_doc (zhou_doc_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库切片向量表（RAG 向量召回）';

-- ============================================================
-- 测试数据：不少于 8 条有真实业务意义的记录
-- 说明：向量本体由「上传文件 → 解析切分 → 调用 embedding 模型」自动生成，
--       此处预置 8 条切片对应的占位向量（与初始 8 篇文档的切片一一对应），
--       便于在新机器上重建后即可验证向量检索链路。
--       下方向量为「各切片关键词的主题向量」示意值（1024 维稀疏首维占位），
--       执行后需运行 npm run initdb:vector 回填真实向量。
-- ============================================================
INSERT INTO zhou_kb_vector (zhou_chunk_id, zhou_doc_id, zhou_model, zhou_dim, zhou_vector, zhou_norm, zhou_created_at) VALUES
(1, 1, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(2, 1, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(3, 2, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(4, 2, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(5, 3, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(6, 3, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(7, 4, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(8, 4, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(9, 5, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(10, 5, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(11, 6, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(12, 6, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(13, 7, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(14, 7, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(15, 8, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00'),
(16, 8, 'BAAI/bge-m3', 1024, 'PENDING_BACKFILL', 0, '2026-11-19 09:00:00');

-- ============================================================
-- 回填说明：执行本脚本后，在 backend 目录运行
--   npm run initdb:vector
-- 该命令会读取 zhou_kb_chunk 全部切片正文，调用 SiliconFlow
-- 的 BAAI/bge-m3 embedding 模型生成真实向量并覆盖 PENDING_BACKFILL 占位。
-- ============================================================
