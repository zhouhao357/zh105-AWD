/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_message_model.js —— 私信与收藏数据访问层（MySQL）
 */

'use strict';

const { zhou_all, zhou_get, zhou_run } = require('../db/zhou_db');

/** 某用户的私信（收件箱 + 发件箱） */
async function zhou_list_messages(zhou_user_id) {
    return zhou_all(
        'SELECT m.zhou_message_id, m.zhou_goods_id, m.zhou_sender_id, m.zhou_receiver_id, m.zhou_content, m.zhou_is_read, m.zhou_created_at, s.zhou_nickname AS zhou_sender_name, r.zhou_nickname AS zhou_receiver_name, g.zhou_title AS zhou_goods_title FROM zhou_message m LEFT JOIN zhou_user s ON m.zhou_sender_id = s.zhou_user_id LEFT JOIN zhou_user r ON m.zhou_receiver_id = r.zhou_user_id LEFT JOIN zhou_goods g ON m.zhou_goods_id = g.zhou_goods_id WHERE m.zhou_sender_id = ? OR m.zhou_receiver_id = ? ORDER BY m.zhou_created_at DESC',
        [zhou_user_id, zhou_user_id]
    );
}

/** 发送私信 */
async function zhou_add_message(zhou_data) {
    const zhou_info = await zhou_run(
        'INSERT INTO zhou_message (zhou_goods_id, zhou_sender_id, zhou_receiver_id, zhou_content, zhou_is_read, zhou_created_at) VALUES (?, ?, ?, ?, 0, ?)',
        [zhou_data.zhou_goods_id || null, zhou_data.zhou_sender_id, zhou_data.zhou_receiver_id, zhou_data.zhou_content, zhou_data.zhou_created_at]
    );
    return zhou_info;
}

/** 标记已读 */
async function zhou_read_message(zhou_message_id) {
    return zhou_run('UPDATE zhou_message SET zhou_is_read = 1 WHERE zhou_message_id = ?', [zhou_message_id]);
}

/** 未读私信数 */
async function zhou_unread_count(zhou_user_id) {
    const zhou_row = await zhou_get('SELECT COUNT(*) AS zhou_cnt FROM zhou_message WHERE zhou_receiver_id = ? AND zhou_is_read = 0', [zhou_user_id]);
    return zhou_row.zhou_cnt;
}
/** 收藏列表 */
async function zhou_list_favorites(zhou_user_id) {
    return zhou_all(
        'SELECT f.zhou_favorite_id, f.zhou_goods_id, f.zhou_created_at, g.zhou_title, g.zhou_price, g.zhou_cover, g.zhou_status, c.zhou_cate_name FROM zhou_favorite f LEFT JOIN zhou_goods g ON f.zhou_goods_id = g.zhou_goods_id LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id WHERE f.zhou_user_id = ? ORDER BY f.zhou_created_at DESC',
        [zhou_user_id]
    );
}

/** 是否已收藏 */
async function zhou_is_favorite(zhou_user_id, zhou_goods_id) {
    return zhou_get('SELECT zhou_favorite_id FROM zhou_favorite WHERE zhou_user_id = ? AND zhou_goods_id = ? LIMIT 1', [zhou_user_id, zhou_goods_id]);
}

/** 收藏 / 取消收藏（切换） */
async function zhou_toggle_favorite(zhou_user_id, zhou_goods_id, zhou_created_at) {
    const zhou_exist = await zhou_is_favorite(zhou_user_id, zhou_goods_id);
    if (zhou_exist) {
        await zhou_run('DELETE FROM zhou_favorite WHERE zhou_user_id = ? AND zhou_goods_id = ?', [zhou_user_id, zhou_goods_id]);
        return { zhou_canceled: true };
    }
    await zhou_run('INSERT INTO zhou_favorite (zhou_user_id, zhou_goods_id, zhou_created_at) VALUES (?, ?, ?)', [zhou_user_id, zhou_goods_id, zhou_created_at]);
    return { zhou_canceled: false };
}

module.exports = {
    zhou_list_messages,
    zhou_add_message,
    zhou_read_message,
    zhou_unread_count,
    zhou_list_favorites,
    zhou_is_favorite,
    zhou_toggle_favorite
};