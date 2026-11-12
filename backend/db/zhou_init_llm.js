/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_init_llm.js —— 执行 LLM 实验相关建表脚本并校验测试数据条数
 * 用法：node db/zhou_init_llm.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TABLES = ['zhou_session', 'zhou_chat_message', 'zhou_kb_doc', 'zhou_kb_chunk'];

(async function () {
    const zhou_cn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    const zhou_sql = fs.readFileSync(path.join(__dirname, 'zhou_init_llm.sql'), 'utf8');
    await zhou_cn.query(zhou_sql);
    console.log('[zhou_init_llm] 建表与测试数据导入完成');

    for (const zhou_t of TABLES) {
        const [zhou_r] = await zhou_cn.query('SELECT COUNT(*) AS zhou_n FROM ' + zhou_t);
        const zhou_n = zhou_r[0].zhou_n;
        console.log('[zhou_init_llm] ' + zhou_t + ' 共 ' + zhou_n + ' 条' + (zhou_n >= 8 ? '（满足 ≥8）' : '（不足 8 条）'));
    }

    await zhou_cn.end();
})().catch(function (e) {
    console.error('[zhou_init_llm] 执行失败：' + e.message);
    process.exit(1);
});