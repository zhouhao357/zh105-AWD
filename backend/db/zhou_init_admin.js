/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_init_admin.js —— 执行后台管理建表脚本并校验数据条数
 * 用法：node db/zhou_init_admin.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async function () {
    const zhou_cn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    /* 字段可能已存在，先判断再执行，避免重复运行报错 */
    const [zhou_cols] = await zhou_cn.query(
        'SHOW COLUMNS FROM zhou_user LIKE \'zhou_role\''
    );
    if (!zhou_cols.length) {
        const zhou_sql = fs.readFileSync(path.join(__dirname, 'zhou_init_admin.sql'), 'utf8');
        await zhou_cn.query(zhou_sql);
        console.log('[zhou_init_admin] 建表与数据导入完成');
    } else {
        console.log('[zhou_init_admin] zhou_role 字段已存在，跳过建表，仅同步管理员账号');
        await zhou_cn.query(
            'UPDATE zhou_user SET zhou_role = \'管理员\' WHERE zhou_username IN (\'zhou01\', \'zhouadmin\')'
        );
        await zhou_cn.query(
            'INSERT INTO zhou_user (zhou_username, zhou_password, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_role, zhou_created_at)' +
            ' VALUES (\'zhouadmin\', \'e10adc3949ba59abbe56e057f20f883e\', \'平台管理员\', \'保密\', \'信息中心\', \'13800138000\', \'images/avatar01.png\', 0.00, 100, \'正常\', \'管理员\', \'2026-02-20 09:00:00\')' +
            ' ON DUPLICATE KEY UPDATE zhou_role = \'管理员\', zhou_nickname = \'平台管理员\''
        );
    }

    const [zhou_admins] = await zhou_cn.query(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_role, zhou_status FROM zhou_user WHERE zhou_role = \'管理员\''
    );
    console.log('[zhou_init_admin] 管理员账号：' + zhou_admins.length + ' 个');
    zhou_admins.forEach(function (a) {
        console.log('   ID ' + a.zhou_user_id + ' ' + a.zhou_username + ' / ' + a.zhou_nickname +
            ' / ' + a.zhou_status);
    });

    const [zhou_logs] = await zhou_cn.query('SELECT COUNT(*) AS n FROM zhou_admin_log');
    console.log('[zhou_init_admin] zhou_admin_log 共 ' + zhou_logs[0].n + ' 条' +
        (zhou_logs[0].n >= 8 ? '（满足 ≥8）' : '（不足 8 条）'));

    await zhou_cn.end();
})().catch(function (e) {
    console.error('[zhou_init_admin] 执行失败：' + e.message);
    process.exit(1);
});