/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_index.js —— 路由汇总（所有接口以 /api/ 为前缀）
 */

'use strict';

const express = require('express');
const { zhou_async } = require('../middleware/zhou_response');

const zhou_goods_controller = require('../controllers/zhou_goods_controller');
const zhou_user_controller = require('../controllers/zhou_user_controller');
const zhou_order_controller = require('../controllers/zhou_order_controller');
const zhou_message_controller = require('../controllers/zhou_message_controller');
const zhou_notice_controller = require('../controllers/zhou_notice_controller');
const zhou_ai_controller = require('../controllers/zhou_ai_controller');

const zhou_router = express.Router();

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

/* ---------- 私信与收藏 ---------- */
zhou_router.get('/message', zhou_async(zhou_message_controller.zhou_message_list));
zhou_router.post('/message', zhou_async(zhou_message_controller.zhou_message_add));
zhou_router.put('/message/:zhou_id/read', zhou_async(zhou_message_controller.zhou_message_read));
zhou_router.get('/favorite', zhou_async(zhou_message_controller.zhou_favorite_list));
zhou_router.post('/favorite', zhou_async(zhou_message_controller.zhou_favorite_toggle));

module.exports = zhou_router;