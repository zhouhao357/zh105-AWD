/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_session_model.js —— AI 会话与聊天消息数据层
 * 对应表：zhou_session（会话）、zhou_chat_message（聊天消息）
 */

'use strict';

const { zhou_all, zhou_get, zhou_run } = require('../db/zhou_db');

/** 新建会话 */
async function zhou_session_create(zhou_user_id, zhou_title, zhou_model) {
    const zhou_r = await zhou_run(
        'INSERT INTO zhou_session (zhou_user_id, zhou_title, zhou_model) VALUES (?, ?, ?)',
        [Number(zhou_user_id) || 0, zhou_title || '新的对话', zhou_model || '']
    );
    return zhou_r.lastInsertRowid;
}

/** 会话列表 */
async function zhou_session_list(zhou_user_id) {
    return zhou_all(
        'SELECT zhou_session_id, zhou_user_id, zhou_title, zhou_model, zhou_summary, zhou_message_count, zhou_token_total, zhou_created_at, zhou_updated_at ' +
        'FROM zhou_session WHERE zhou_status = 1 AND zhou_user_id = ? ORDER BY zhou_updated_at DESC',
        [Number(zhou_user_id) || 0]
    );
}

/** 会话详情 */
async function zhou_session_detail(zhou_session_id) {
    return zhou_get(
        'SELECT zhou_session_id, zhou_user_id, zhou_title, zhou_model, zhou_summary, zhou_message_count, zhou_token_total, zhou_created_at, zhou_updated_at ' +
        'FROM zhou_session WHERE zhou_session_id = ?',
        [Number(zhou_session_id)]
    );
}

/** 重命名会话 */
async function zhou_session_rename(zhou_session_id, zhou_title) {
    const zhou_r = await zhou_run(
        'UPDATE zhou_session SET zhou_title = ? WHERE zhou_session_id = ?',
        [zhou_title, Number(zhou_session_id)]
    );
    return zhou_r.changes;
}

/** 删除会话（软删除，消息随外键级联清理） */
async function zhou_session_remove(zhou_session_id) {
    const zhou_r = await zhou_run(
        'DELETE FROM zhou_session WHERE zhou_session_id = ?',
        [Number(zhou_session_id)]
    );
    return zhou_r.changes;
}

/** 更新会话统计信息 */
async function zhou_session_touch(zhou_session_id, zhou_data) {
    const zhou_d = zhou_data || {};
    const zhou_fields = [];
    const zhou_values = [];
    if (zhou_d.zhou_title) { zhou_fields.push('zhou_title = ?'); zhou_values.push(zhou_d.zhou_title); }
    if (zhou_d.zhou_model) { zhou_fields.push('zhou_model = ?'); zhou_values.push(zhou_d.zhou_model); }
    if (zhou_d.zhou_summary !== undefined) { zhou_fields.push('zhou_summary = ?'); zhou_values.push(zhou_d.zhou_summary); }
    if (zhou_d.zhou_summarized_count !== undefined) { zhou_fields.push('zhou_summarized_count = ?'); zhou_values.push(Number(zhou_d.zhou_summarized_count)); }
    if (zhou_d.zhou_token_total !== undefined) { zhou_fields.push('zhou_token_total = zhou_token_total + ?'); zhou_values.push(Number(zhou_d.zhou_token_total)); }
    if (zhou_d.zhou_message_count !== undefined) { zhou_fields.push('zhou_message_count = zhou_message_count + ?'); zhou_values.push(Number(zhou_d.zhou_message_count)); }
    if (!zhou_fields.length) return 0;
    zhou_values.push(Number(zhou_session_id));
    const zhou_r = await zhou_run('UPDATE zhou_session SET ' + zhou_fields.join(', ') + ' WHERE zhou_session_id = ?', zhou_values);
    return zhou_r.changes;
}

/** 写入一条聊天消息 */
async function zhou_message_add(zhou_session_id, zhou_role, zhou_content, zhou_tokens, zhou_elapsed) {
    const zhou_r = await zhou_run(
        'INSERT INTO zhou_chat_message (zhou_session_id, zhou_role, zhou_content, zhou_tokens, zhou_elapsed) VALUES (?, ?, ?, ?, ?)',
        [Number(zhou_session_id), zhou_role, zhou_content, Number(zhou_tokens) || 0, Number(zhou_elapsed) || 0]
    );
    return zhou_r.lastInsertRowid;
}

/** 会话历史消息（按时间正序） */
async function zhou_session_messages(zhou_session_id) {
    return zhou_all(
        'SELECT zhou_message_id, zhou_session_id, zhou_role, zhou_content, zhou_tokens, zhou_elapsed, zhou_created_at ' +
        'FROM zhou_chat_message WHERE zhou_session_id = ? ORDER BY zhou_message_id ASC',
        [Number(zhou_session_id)]
    );
}

/** 会话消息条数 */
async function zhou_message_count(zhou_session_id) {
    const zhou_r = await zhou_get(
        'SELECT COUNT(*) AS zhou_n FROM zhou_chat_message WHERE zhou_session_id = ?',
        [Number(zhou_session_id)]
    );
    return zhou_r ? Number(zhou_r.zhou_n) : 0;
}

/** 最早的若干条消息（用于压缩摘要） */
async function zhou_oldest_messages(zhou_session_id, zhou_limit) {
    return zhou_all(
        'SELECT zhou_message_id, zhou_role, zhou_content FROM zhou_chat_message ' +
        'WHERE zhou_session_id = ? ORDER BY zhou_message_id ASC LIMIT ?',
        [Number(zhou_session_id), Number(zhou_limit) || 0]
    );
}

/** 全站 token 用量与费用统计 */
async function zhou_session_stats(zhou_user_id) {
    return zhou_get(
        'SELECT COUNT(*) AS zhou_session_count, IFNULL(SUM(zhou_token_total), 0) AS zhou_token_total, IFNULL(SUM(zhou_message_count), 0) AS zhou_message_total ' +
        'FROM zhou_session WHERE zhou_status = 1 AND zhou_user_id = ?',
        [Number(zhou_user_id) || 0]
    );
}

module.exports = {
    zhou_session_create,
    zhou_session_list,
    zhou_session_detail,
    zhou_session_rename,
    zhou_session_remove,
    zhou_session_touch,
    zhou_message_add,
    zhou_session_messages,
    zhou_message_count,
    zhou_oldest_messages,
    zhou_session_stats
};