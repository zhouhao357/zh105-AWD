/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_index.js —— 路由汇总（所有接口以 /api/ 为前缀）
 */

'use strict';

const express = require('express');
const multer = require('multer');
const { zhou_async } = require('../middleware/zhou_response');
const { zhou_require_admin } = require('../middleware/zhou_auth');

const zhou_goods_controller = require('../controllers/zhou_goods_controller');
const zhou_user_controller = require('../controllers/zhou_user_controller');
const zhou_order_controller = require('../controllers/zhou_order_controller');
const zhou_message_controller = require('../controllers/zhou_message_controller');
const zhou_notice_controller = require('../controllers/zhou_notice_controller');
const zhou_ai_controller = require('../controllers/zhou_ai_controller');
const zhou_session_controller = require('../controllers/zhou_session_controller');
const zhou_kb_controller = require('../controllers/zhou_kb_controller');
const zhou_structured_controller = require('../controllers/zhou_structured_controller');
const zhou_admin_controller = require('../controllers/zhou_admin_controller');

const zhou_router = express.Router();

/* 文件上传中间件：内存存储，单文件上限 10 MB */
const zhou_upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

/* ---------- 首页与公告 ---------- */
zhou_router.get('/home', zhou_async(zhou_notice_controller.zhou_home_stat));
zhou_router.get('/notice', zhou_async(zhou_notice_controller.zhou_notice_list));

/* ---------- 商品与分类 ---------- */
zhou_router.get('/goods', zhou_async(zhou_goods_controller.zhou_goods_list));
zhou_router.post('/goods', zhou_async(zhou_goods_controller.zhou_goods_create));
zhou_router.get('/goods/:zhou_id', zhou_async(zhou_goods_controller.zhou_goods_detail));
zhou_router.put('/goods/:zhou_id/status', zhou_async(zhou_goods_controller.zhou_goods_status));
zhou_router.delete('/goods/:zhou_id', zhou_async(zhou_goods_controller.zhou_goods_remove));
zhou_router.get('/category', zhou_async(zhou_goods_controller.zhou_category_list));

/* ---------- 用户 ---------- */
zhou_router.post('/user/login', zhou_async(zhou_user_controller.zhou_user_login));
zhou_router.post('/user/register', zhou_async(zhou_user_controller.zhou_user_register));
zhou_router.get('/user', zhou_async(zhou_user_controller.zhou_user_list));
zhou_router.get('/user/:zhou_id', zhou_async(zhou_user_controller.zhou_user_detail));
zhou_router.put('/user/:zhou_id', zhou_async(zhou_user_controller.zhou_user_update));

/* ---------- 订单与评价 ---------- */
zhou_router.get('/order', zhou_async(zhou_order_controller.zhou_order_list));
zhou_router.post('/order', zhou_async(zhou_order_controller.zhou_order_create));
zhou_router.put('/order/:zhou_id/status', zhou_async(zhou_order_controller.zhou_order_status));
zhou_router.get('/comment', zhou_async(zhou_order_controller.zhou_comment_list));
zhou_router.post('/comment', zhou_async(zhou_order_controller.zhou_comment_add));

/* ---------- 智能客服（知识库 + 大模型） ---------- */
zhou_router.post('/ai/chat', zhou_async(zhou_ai_controller.zhou_ai_chat));
zhou_router.get('/ai/model', zhou_async(zhou_ai_controller.zhou_ai_model));
zhou_router.get('/ai/models', zhou_async(zhou_ai_controller.zhou_ai_models));
zhou_router.get('/ai/stats', zhou_async(zhou_ai_controller.zhou_ai_stats));
zhou_router.post('/ai/structured', zhou_async(zhou_structured_controller.zhou_ai_structured));

/* ---------- 会话管理（多轮对话） ---------- */
zhou_router.get('/session', zhou_async(zhou_session_controller.zhou_session_list));
zhou_router.post('/session', zhou_async(zhou_session_controller.zhou_session_create));
zhou_router.get('/session/stats', zhou_async(zhou_session_controller.zhou_session_stats));
zhou_router.get('/session/:zhou_id', zhou_async(zhou_session_controller.zhou_session_detail));
zhou_router.put('/session/:zhou_id', zhou_async(zhou_session_controller.zhou_session_rename));
zhou_router.delete('/session/:zhou_id', zhou_async(zhou_session_controller.zhou_session_remove));
zhou_router.get('/session/:zhou_id/export', zhou_async(zhou_session_controller.zhou_session_export));

/* ---------- 知识库管理（RAG 文件上传） ---------- */
zhou_router.post('/kb/upload', zhou_upload.single('zhou_file'), zhou_async(zhou_kb_controller.zhou_kb_upload));
zhou_router.get('/kb/doc', zhou_async(zhou_kb_controller.zhou_kb_doc_list));
zhou_router.get('/kb/doc/:zhou_id', zhou_async(zhou_kb_controller.zhou_kb_doc_detail));
zhou_router.delete('/kb/doc/:zhou_id', zhou_async(zhou_kb_controller.zhou_kb_doc_remove));

/* ---------- 私信与收藏 ---------- */
zhou_router.get('/message', zhou_async(zhou_message_controller.zhou_message_list));
zhou_router.post('/message', zhou_async(zhou_message_controller.zhou_message_add));
zhou_router.put('/message/:zhou_id/read', zhou_async(zhou_message_controller.zhou_message_read));
zhou_router.get('/favorite', zhou_async(zhou_message_controller.zhou_favorite_list));
zhou_router.post('/favorite', zhou_async(zhou_message_controller.zhou_favorite_toggle));

/* ---------- 后台管理（除登录外全部需要管理员 Token） ---------- */
zhou_router.post('/admin/login', zhou_async(zhou_admin_controller.zhou_admin_login));
zhou_router.get('/admin/profile', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_profile));
zhou_router.get('/admin/stats', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_stats));
zhou_router.get('/admin/chart/orders', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_chart_orders));
zhou_router.get('/admin/chart/category', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_chart_category));
zhou_router.get('/admin/chart/rating', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_chart_rating));

zhou_router.get('/admin/goods', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_goods_list));
zhou_router.put('/admin/goods/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_goods_update));
zhou_router.delete('/admin/goods/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_goods_remove));

zhou_router.get('/admin/users', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_users_list));
zhou_router.put('/admin/users/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_users_update));
zhou_router.delete('/admin/users/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_users_remove));

zhou_router.get('/admin/orders', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_orders_list));
zhou_router.put('/admin/orders/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_orders_update));
zhou_router.delete('/admin/orders/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_orders_remove));

zhou_router.get('/admin/comments', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_comments_list));
zhou_router.put('/admin/comments/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_comments_update));
zhou_router.delete('/admin/comments/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_comments_remove));

zhou_router.get('/admin/categories', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_categories_list));
zhou_router.post('/admin/categories', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_categories_create));
zhou_router.put('/admin/categories/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_categories_update));
zhou_router.delete('/admin/categories/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_categories_remove));

zhou_router.get('/admin/notices', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_notices_list));
zhou_router.post('/admin/notices', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_notices_create));
zhou_router.put('/admin/notices/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_notices_update));
zhou_router.delete('/admin/notices/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_notices_remove));

zhou_router.get('/admin/kb', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_kb_list));
zhou_router.delete('/admin/kb/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_kb_remove));

zhou_router.get('/admin/sessions', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_sessions_list));
zhou_router.delete('/admin/sessions/:zhou_id', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_sessions_remove));

zhou_router.get('/admin/logs', zhou_require_admin, zhou_async(zhou_admin_controller.zhou_admin_logs_list));

module.exports = zhou_router;