/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * app.js —— 后端服务入口
 * 技术栈：Node.js + Express（RESTful + MVC 风格）
 * 接口前缀：/api/        端口：8105
 * 静态托管：express.static 托管 ../frontend 目录
 * 跨域策略：允许所有来源访问
 */

'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const zhou_app = express();
const zhou_PORT = Number(process.env.PORT) || 8105;
const zhou_FRONTEND = path.join(__dirname, '..', 'frontend');

/* ---------- 全局中间件 ---------- */
/* 支持所有跨域访问 */
zhou_app.use(cors());
/* 解析 JSON 与表单请求体 */
zhou_app.use(express.json({ limit: '1mb' }));
zhou_app.use(express.urlencoded({ extended: true }));

/* ---------- 静态托管前端页面 ---------- */
zhou_app.use(express.static(zhou_FRONTEND));

/* ---------- 接口路由（全部以 /api/ 为前缀） ---------- */
zhou_app.use('/api', require('./routes/zhou_index'));

/* ---------- 兜底处理 ---------- */
const { zhou_not_found, zhou_error_handler } = require('./middleware/zhou_response');

zhou_app.use('/api', zhou_not_found);
zhou_app.get('/', function (req, res) {
    res.sendFile(path.join(zhou_FRONTEND, 'index.html'));
});
zhou_app.use(zhou_error_handler);

/* ---------- 启动服务 ---------- */
/* 数据库连接自检：连接失败时给出明确提示，但不阻断静态页面访问 */
const { zhou_check } = require('./db/zhou_db');
zhou_check().catch(function (e) {
    console.error('[zhou_db] 数据库连接失败：' + e.message);
    console.error('[zhou_db] 请检查 backend/.env 中的 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME 配置');
    console.error('[zhou_db] 若数据库尚未初始化，请先执行：npm run initdb');
});

zhou_app.listen(zhou_PORT, function () {
    console.log('==============================================');
    console.log(' 校园二手交易平台后端服务已启动');
    console.log(' 接口前缀：http://127.0.0.1:' + zhou_PORT + '/api/');
    console.log(' 前端页面：http://127.0.0.1:' + zhou_PORT + '/');
    console.log(' 静态目录：' + zhou_FRONTEND);
    console.log('==============================================');
});

module.exports = zhou_app;