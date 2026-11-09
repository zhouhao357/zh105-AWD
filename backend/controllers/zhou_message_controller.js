/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_message_controller.js —— 私信与收藏控制器
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_now, zhou_int, zhou_need } = require('../utils/zhou_util');
const zhou_message_model = require('../models/zhou_message_model');

/** GET /api/message 私信列表 */
async function zhou_message_list(req, res) {
    const zhou_user_id = zhou_int(req.query.zhou_user_id, 0);
    if (!zhou_user_id) {
        return zhou_fail(res, 400, '缺少必填参数：zhou_user_id');
    }
    const zhou_list = await zhou_message_model.zhou_list_messages(zhou_user_id);
    const zhou_unread = await zhou_message_model.zhou_unread_count(zhou_user_id);
    return zhou_success(res, { zhou_list: zhou_list, zhou_unread: zhou_unread }, '获取私信列表成功');
}

/** POST /api/message 发送私信 */
async function zhou_message_add(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_sender_id', 'zhou_receiver_id', 'zhou_content']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    if (zhou_int(zhou_body.zhou_sender_id, 0) === zhou_int(zhou_body.zhou_receiver_id, 0)) {
        return zhou_fail(res, 400, '不能给自己发送私信');
    }
    zhou_body.zhou_created_at = zhou_now();
    const zhou_info = await zhou_message_model.zhou_add_message(zhou_body);
    return zhou_success(res, { zhou_message_id: zhou_info.lastInsertRowid }, '私信发送成功');
}

/** PUT /api/message/:id/read 标记已读 */
async function zhou_message_read(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_info = await zhou_message_model.zhou_read_message(zhou_id);
    return zhou_success(res, { zhou_changes: zhou_info.changes }, '已标记为已读');
}

/** GET /api/favorite 收藏列表 */
async function zhou_favorite_list(req, res) {
    const zhou_user_id = zhou_int(req.query.zhou_user_id, 0);
    if (!zhou_user_id) {
        return zhou_fail(res, 400, '缺少必填参数：zhou_user_id');
    }
    const zhou_list = await zhou_message_model.zhou_list_favorites(zhou_user_id);
    return zhou_success(res, { zhou_list: zhou_list }, '获取收藏列表成功');
}

/** POST /api/favorite 收藏 / 取消收藏 */
async function zhou_favorite_toggle(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_user_id', 'zhou_goods_id']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_result = await zhou_message_model.zhou_toggle_favorite(
        zhou_int(zhou_body.zhou_user_id, 0),
        zhou_int(zhou_body.zhou_goods_id, 0),
        zhou_now()
    );
    return zhou_success(res, zhou_result, zhou_result.zhou_canceled ? '已取消收藏' : '收藏成功');
}

module.exports = {
    zhou_message_list,
    zhou_message_add,
    zhou_message_read,
    zhou_favorite_list,
    zhou_favorite_toggle
};