/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_db.js —— 数据库连接封装（SQLite）
 * 使用 Node.js 内置的 node:sqlite 模块，零原生依赖；旧版本 Node 回退 sqlite3 包。
 * 数据库文件路径来自 backend/.env 的 DB_NAME。
 */

'use strict';

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

/* Node 22.5+ 内置 node:sqlite */
let DatabaseSync = null;
try {
    ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
    console.warn('[zhou_db] 未检测到 node:sqlite，回退 sqlite3 第三方包');
    ({ DatabaseSync } = require('sqlite3'));
}

/* .env 的 DB_NAME 即 SQLite 数据库文件路径 */
const zhou_dbName = process.env.DB_NAME || 'data/zhou_campus_market.db';
const zhou_dbFile = path.isAbsolute(zhou_dbName)
    ? zhou_dbName
    : path.join(__dirname, '..', zhou_dbName);

const zhou_dbDir = path.dirname(zhou_dbFile);
if (!fs.existsSync(zhou_dbDir)) {
    fs.mkdirSync(zhou_dbDir, { recursive: true });
}

const zhou_db = new DatabaseSync(zhou_dbFile);
zhou_db.exec('PRAGMA foreign_keys = ON;');

console.log('[zhou_db] 数据库已连接：' + zhou_dbFile);

/** 查询多行 */
function zhou_all(zhou_sql, zhou_params = []) {
    return zhou_db.prepare(zhou_sql).all(...zhou_params);
}

/** 查询单行 */
function zhou_get(zhou_sql, zhou_params = []) {
    return zhou_db.prepare(zhou_sql).get(...zhou_params);
}

/** 执行写入语句（INSERT / UPDATE / DELETE） */
function zhou_run(zhou_sql, zhou_params = []) {
    const zhou_info = zhou_db.prepare(zhou_sql).run(...zhou_params);
    return {
        changes: Number(zhou_info.changes),
        lastInsertRowid: Number(zhou_info.lastInsertRowid)
    };
}

/** 事务：回调内抛错则整体回滚 */
function zhou_tx(zhou_fn) {
    zhou_db.exec('BEGIN');
    try {
        const zhou_result = zhou_fn();
        zhou_db.exec('COMMIT');
        return zhou_result;
    } catch (e) {
        zhou_db.exec('ROLLBACK');
        throw e;
    }
}

module.exports = {
    zhou_db,
    zhou_dbFile,
    zhou_all,
    zhou_get,
    zhou_run,
    zhou_tx
};