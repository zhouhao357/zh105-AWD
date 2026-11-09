/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_init.js —— 数据库初始化脚本（MySQL）
 * 执行 backend/db/zhou_init_mysql.sql：建库 + 建表 + 写入测试数据，可重复执行
 * 用法：cd backend && npm run initdb
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const zhou_sqlFile = path.join(__dirname, 'zhou_init_mysql.sql');

/* 每张表的期望数据条数（规则：每张表至少 8 条测试数据） */
const zhou_expect = {
    zhou_user: 10,
    zhou_category: 8,
    zhou_goods: 15,
    zhou_order: 9,
    zhou_comment: 9,
    zhou_message: 10,
    zhou_favorite: 9,
    zhou_notice: 8
};

async function zhou_main() {
    const zhou_config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
        charset: 'utf8mb4',
        dateStrings: true
    };
    const zhou_conn = await mysql.createConnection(zhou_config);
    try {
        console.log('[zhou_init] 开始执行：' + zhou_sqlFile);
        const zhou_sql = fs.readFileSync(zhou_sqlFile, 'utf8');
        await zhou_conn.query(zhou_sql);
        console.log('[zhou_init] SQL 执行完成');

        await zhou_conn.query('USE ' + (process.env.DB_NAME || 'zhou_campus_market'));
        let zhou_ok = true;
        for (const zhou_table of Object.keys(zhou_expect)) {
            const [zhou_rows] = await zhou_conn.query('SELECT COUNT(*) AS zhou_cnt FROM ' + zhou_table);
            const zhou_cnt = zhou_rows[0].zhou_cnt;
            if (zhou_cnt < 8) {
                zhou_ok = false;
            }
            console.log('  ' + (zhou_cnt >= 8 ? '√' : '×') + ' ' + zhou_table + ' 实际 ' + zhou_cnt + ' 条 / 期望 ≥ 8');
        }
        console.log(zhou_ok ? '[zhou_init] 全部表均满足 ≥8 条测试数据' : '[zhou_init] 存在数据不足 8 条的表');
    } finally {
        await zhou_conn.end();
    }
}

zhou_main().catch(function (e) {
    console.error('[zhou_init] 执行失败：' + e.message);
    process.exit(1);
});