/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_session_controller.js —— AI 会话管理控制器
 * 功能：会话列表、创建、重命名、删除、历史消息回放、导出
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_need } = require('../utils/zhou_util');
const zhou_session_model = require('../models/zhou_session_model');

/** GET /api/session 会话列表 */
async function zhou_session_list(req, res) {
    const zhou_user_id = Number(req.query.zhou_user_id) || 1;
    const zhou_list = await zhou_session_model.zhou_session_list(zhou_user_id);
    return zhou_success(res, { zhou_list: zhou_list }, '获取会话列表成功');
}

/** POST /api/session 新建会话 */
async function zhou_session_create(req, res) {
    const zhou_body = req.body || {};
    const zhou_user_id = Number(zhou_body.zhou_user_id) || 1;
    const zhou_title = (zhou_body.zhou_title || '新的对话').slice(0, 120);
    const zhou_model = (zhou_body.zhou_model || '').slice(0, 80);
    const zhou_id = await zhou_session_model.zhou_session_create(zhou_user_id, zhou_title, zhou_model);
    const zhou_detail = await zhou_session_model.zhou_session_detail(zhou_id);
    return zhou_success(res, zhou_detail, '创建会话成功');
}

/** GET /api/session/:id 会话详情与历史消息 */
async function zhou_session_detail(req, res) {
    const zhou_id = Number(req.params.zhou_id);
    const zhou_detail = await zhou_session_model.zhou_session_detail(zhou_id);
    if (!zhou_detail) {
        return zhou_fail(res, 404, '会话不存在：' + zhou_id);
    }
    const zhou_messages = await zhou_session_model.zhou_session_messages(zhou_id);
    return zhou_success(res, {
        zhou_session: zhou_detail,
        zhou_messages: zhou_messages
    }, '获取会话详情成功');
}

/** PUT /api/session/:id 重命名会话 */
async function zhou_session_rename(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_title']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_id = Number(req.params.zhou_id);
    const zhou_title = String(zhou_body.zhou_title).trim().slice(0, 120);
    if (!zhou_title) {
        return zhou_fail(res, 400, '会话标题不能为空');
    }
    const zhou_changes = await zhou_session_model.zhou_session_rename(zhou_id, zhou_title);
    if (!zhou_changes) {
        return zhou_fail(res, 404, '会话不存在：' + zhou_id);
    }
    return zhou_success(res, { zhou_session_id: zhou_id, zhou_title: zhou_title }, '重命名会话成功');
}

/** DELETE /api/session/:id 删除会话 */
async function zhou_session_remove(req, res) {
    const zhou_id = Number(req.params.zhou_id);
    const zhou_changes = await zhou_session_model.zhou_session_remove(zhou_id);
    if (!zhou_changes) {
        return zhou_fail(res, 404, '会话不存在：' + zhou_id);
    }
    return zhou_success(res, { zhou_session_id: zhou_id }, '删除会话成功');
}

/** GET /api/session/:id/export 导出会话为纯文本 */
async function zhou_session_export(req, res) {
    const zhou_id = Number(req.params.zhou_id);
    const zhou_detail = await zhou_session_model.zhou_session_detail(zhou_id);
    if (!zhou_detail) {
        return zhou_fail(res, 404, '会话不存在：' + zhou_id);
    }
    const zhou_messages = await zhou_session_model.zhou_session_messages(zhou_id);
    const zhou_lines = ['# ' + zhou_detail.zhou_title, '模型：' + zhou_detail.zhou_model, ''];
    zhou_messages.forEach(function (m) {
        zhou_lines.push((m.zhou_role === 'user' ? '我：' : 'AI：') + m.zhou_content);
        zhou_lines.push('');
    });
    return zhou_success(res, {
        zhou_session_id: zhou_id,
        zhou_title: zhou_detail.zhou_title,
        zhou_text: zhou_lines.join('\n')
    }, '导出会话成功');
}

/** GET /api/session/stats 用量统计 */
async function zhou_session_stats(req, res) {
    const zhou_user_id = Number(req.query.zhou_user_id) || 1;
    const zhou_stat = await zhou_session_model.zhou_session_stats(zhou_user_id);
    return zhou_success(res, zhou_stat, '获取用量统计成功');
}

module.exports = {
    zhou_session_list,
    zhou_session_create,
    zhou_session_detail,
    zhou_session_rename,
    zhou_session_remove,
    zhou_session_export,
    zhou_session_stats
};