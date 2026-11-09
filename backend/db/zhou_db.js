/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_db.js —— 数据库连接封装（MySQL）
 * 使用 mysql2 连接池，凭据来自 backend/.env：
 *   DB_HOST / DB_USER / DB_PASSWORD / DB_NAME
 * 对外暴露统一的 zhou_all / zhou_get / zhou_run / zhou_tx 接口，
 * 与具体驱动解耦，models 层无需关心数据库类型。
 */

'use strict';

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const zhou_config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zhou_campus_market',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: true
};

const zhou_pool = mysql.createPool(zhou_config);

console.log('[zhou_db] MySQL 连接池已创建：' + zhou_config.user + '@' + zhou_config.host + ':' + zhou_config.port + '/' + zhou_config.database);

/** 连接可用性自检 */
async function zhou_check() {
    const zhou_conn = await zhou_pool.getConnection();
    try {
        const [zhou_rows] = await zhou_conn.query('SELECT VERSION() AS zhou_version, DATABASE() AS zhou_db');
        console.log('[zhou_db] 连接成功：MySQL ' + zhou_rows[0].zhou_version + '，当前库 ' + zhou_rows[0].zhou_db);
    } finally {
        zhou_conn.release();
    }
}

/** 查询多行 */
async function zhou_all(zhou_sql, zhou_params = []) {
    const [zhou_rows] = await zhou_pool.execute(zhou_sql, zhou_params);
    return zhou_rows;
}

/** 查询单行 */
async function zhou_get(zhou_sql, zhou_params = []) {
    const zhou_rows = await zhou_all(zhou_sql, zhou_params);
    return zhou_rows.length ? zhou_rows[0] : null;
}

/** 执行写入语句（INSERT / UPDATE / DELETE） */
async function zhou_run(zhou_sql, zhou_params = []) {
    const [zhou_info] = await zhou_pool.execute(zhou_sql, zhou_params);
    return {
        changes: zhou_info.affectedRows,
        lastInsertRowid: zhou_info.insertId
    };
}

/** 事务：回调内抛错则整体回滚 */
async function zhou_tx(zhou_fn) {
    const zhou_conn = await zhou_pool.getConnection();
    try {
        await zhou_conn.beginTransaction();
        const zhou_result = await zhou_fn(zhou_conn);
        await zhou_conn.commit();
        return zhou_result;
    } catch (e) {
        await zhou_conn.rollback();
        throw e;
    } finally {
        zhou_conn.release();
    }
}

module.exports = {
    zhou_pool,
    zhou_config,
    zhou_check,
    zhou_all,
    zhou_get,
    zhou_run,
    zhou_tx
};