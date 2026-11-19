/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_init_vector.js —— 建立 RAG 向量表并回填全部切片向量
 * 用法：node db/zhou_init_vector.js
 * 流程：
 *   1. 执行 db/zhou_init_vector.sql 建表 + 预置测试数据
 *   2. 读取 zhou_kb_chunk 全部切片正文
 *   3. 调用 SiliconFlow BAAI/bge-m3 生成 1024 维向量
 *   4. 写入 zhou_kb_vector（覆盖 PENDING_BACKFILL 占位）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const zhou_llm = require('../utils/zhou_llm');
const zhou_kb_model = require('../models/zhou_kb_model');

(async function () {
    const zhou_cn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    /* 1. 建表 */
    const zhou_sql = fs.readFileSync(path.join(__dirname, 'zhou_init_vector.sql'), 'utf8');
    await zhou_cn.query(zhou_sql);
    console.log('[zhou_init_vector] 向量表建表与测试数据导入完成');

    /* 2. 读取全部切片 */
    const [zhou_chunks] = await zhou_cn.query(
        'SELECT zhou_chunk_id, zhou_doc_id, zhou_content FROM zhou_kb_chunk ORDER BY zhou_chunk_id'
    );
    console.log('[zhou_init_vector] 待向量化切片：' + zhou_chunks.length + ' 条');

    /* 3. 批量生成向量 */
    const zhou_emb = await zhou_llm.zhou_embed_batch(zhou_chunks.map(function (c) {
        return c.zhou_content;
    }));

    /* 4. 写入向量表 */
    let zhou_ok = 0;
    for (let zhou_i = 0; zhou_i < zhou_chunks.length; zhou_i++) {
        const zhou_vec = zhou_emb.zhou_vectors[zhou_i];
        if (!zhou_vec || !zhou_vec.length) {
            continue;
        }
        await zhou_kb_model.zhou_kb_vector_upsert(
            zhou_chunks[zhou_i].zhou_chunk_id,
            zhou_chunks[zhou_i].zhou_doc_id,
            zhou_emb.zhou_model,
            zhou_vec
        );
        zhou_ok += 1;
    }
    console.log('[zhou_init_vector] 向量写入完成：' + zhou_ok + ' 条，模型 ' + zhou_emb.zhou_model +
        '，维度 ' + ((zhou_emb.zhou_vectors[0] || []).length));

    /* 5. 校验 */
    const zhou_stats = await zhou_kb_model.zhou_kb_vector_stats();
    console.log('[zhou_init_vector] zhou_kb_vector 共 ' + zhou_stats.zhou_total + ' 条，覆盖 ' +
        zhou_stats.zhou_docs + ' 篇文档，维度 ' + zhou_stats.zhou_dim);

    await zhou_cn.end();
})().catch(function (e) {
    console.error('[zhou_init_vector] 执行失败：' + e.message);
    process.exit(1);
});