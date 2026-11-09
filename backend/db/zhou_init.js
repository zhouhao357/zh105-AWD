/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_init.js —— 数据库初始化脚本
 * 执行 backend/db/zhou_init.sql，建表并写入测试数据，可重复执行（脚本内含 DROP TABLE）
 * 用法：cd backend && npm run initdb
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { zhou_db, zhou_dbFile, zhou_all } = require('./zhou_db');

const zhou_sqlFile = path.join(__dirname, 'zhou_init.sql');

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

function zhou_main() {
    console.log('[zhou_init] 开始执行：' + zhou_sqlFile);
    const zhou_sql = fs.readFileSync(zhou_sqlFile, 'utf8');
    zhou_db.exec(zhou_sql);
    console.log('[zhou_init] SQL 执行完成');

    let zhou_ok = true;
    Object.keys(zhou_expect).forEach(function (zhou_table) {
        const zhou_rows = zhou_all('SELECT COUNT(*) AS zhou_cnt FROM ' + zhou_table);
        const zhou_cnt = zhou_rows[0].zhou_cnt;
        const zhou_flag = zhou_cnt >= 8 ? '√' : '×';
        if (zhou_cnt < 8) {
            zhou_ok = false;
        }
        console.log('  ' + zhou_flag + ' ' + zhou_table + ' 实际 ' + zhou_cnt + ' 条 / 期望 ≥ 8');
    });

    console.log('[zhou_init] 数据库文件：' + zhou_dbFile);
    console.log(zhou_ok ? '[zhou_init] 全部表均满足 ≥8 条测试数据' : '[zhou_init] 存在数据不足 8 条的表');
}

try {
    zhou_main();
} catch (e) {
    console.error('[zhou_init] 执行失败：' + e.message);
    process.exit(1);
}