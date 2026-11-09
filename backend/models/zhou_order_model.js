/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_order_model.js —— 订单与评价数据访问层（MySQL）
 */

'use strict';

const { zhou_all, zhou_get, zhou_run, zhou_tx } = require('../db/zhou_db');

/** 订单列表：可按买家或卖家查询 */
async function zhou_list_orders(zhou_user_id, zhou_role) {
    let zhou_where = 'WHERE 1 = 1';
    const zhou_params = [];
    if (zhou_user_id) {
        if (zhou_role === 'seller') {
            zhou_where += ' AND o.zhou_seller_id = ?';
        } else {
            zhou_where += ' AND o.zhou_buyer_id = ?';
        }
        zhou_params.push(zhou_user_id);
    }
    return zhou_all(
        'SELECT o.zhou_order_id, o.zhou_order_no, o.zhou_goods_id, o.zhou_buyer_id, o.zhou_seller_id, o.zhou_price, o.zhou_quantity, o.zhou_total_amount, o.zhou_status, o.zhou_remark, o.zhou_created_at, g.zhou_title AS zhou_goods_title, g.zhou_cover AS zhou_goods_cover, b.zhou_nickname AS zhou_buyer_name, s.zhou_nickname AS zhou_seller_name FROM zhou_order o LEFT JOIN zhou_goods g ON o.zhou_goods_id = g.zhou_goods_id LEFT JOIN zhou_user b ON o.zhou_buyer_id = b.zhou_user_id LEFT JOIN zhou_user s ON o.zhou_seller_id = s.zhou_user_id ' + zhou_where + ' ORDER BY o.zhou_created_at DESC',
        zhou_params
    );
}

/** 生成订单号 ZO + 年月日 + 4 位序号 */
async function zhou_build_order_no() {
    const zhou_now = new Date();
    const zhou_day = zhou_now.getFullYear().toString() + String(zhou_now.getMonth() + 1).padStart(2, '0') + String(zhou_now.getDate()).padStart(2, '0');
    const zhou_cnt = await zhou_get('SELECT COUNT(*) AS zhou_cnt FROM zhou_order');
    const zhou_seq = String(zhou_cnt.zhou_cnt + 1).padStart(4, '0');
    return 'ZO' + zhou_day + zhou_seq;
}
/** 下单：写订单 + 商品状态改为已售出（事务） */
async function zhou_create_order(zhou_data) {
    return zhou_tx(async function (zhou_conn) {
        const [zhou_info] = await zhou_conn.execute(
            'INSERT INTO zhou_order (zhou_order_no, zhou_goods_id, zhou_buyer_id, zhou_seller_id, zhou_price, zhou_quantity, zhou_total_amount, zhou_status, zhou_remark, zhou_created_at, zhou_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [zhou_data.zhou_order_no, zhou_data.zhou_goods_id, zhou_data.zhou_buyer_id, zhou_data.zhou_seller_id,
             zhou_data.zhou_price, zhou_data.zhou_quantity || 1, zhou_data.zhou_total_amount, '待付款',
             zhou_data.zhou_remark || '', zhou_data.zhou_created_at, zhou_data.zhou_created_at]
        );
        await zhou_conn.execute('UPDATE zhou_goods SET zhou_status = ?, zhou_stock = ? WHERE zhou_goods_id = ?', ['已售出', 0, zhou_data.zhou_goods_id]);
        return { changes: zhou_info.affectedRows, lastInsertRowid: zhou_info.insertId };
    });
}

/** 更新订单状态 */
async function zhou_update_order_status(zhou_order_id, zhou_status) {
    const zhou_now = new Date();
    const zhou_time = zhou_now.getFullYear() + '-' + String(zhou_now.getMonth() + 1).padStart(2, '0') + '-' + String(zhou_now.getDate()).padStart(2, '0') + ' ' + String(zhou_now.getHours()).padStart(2, '0') + ':' + String(zhou_now.getMinutes()).padStart(2, '0') + ':' + String(zhou_now.getSeconds()).padStart(2, '0');
    return zhou_run('UPDATE zhou_order SET zhou_status = ?, zhou_updated_at = ? WHERE zhou_order_id = ?', [zhou_status, zhou_time, zhou_order_id]);
}

/** 某商品的评价列表 */
async function zhou_list_comments(zhou_goods_id) {
    return zhou_all(
        'SELECT c.zhou_comment_id, c.zhou_rating, c.zhou_content, c.zhou_reply, c.zhou_created_at, u.zhou_nickname, u.zhou_college FROM zhou_comment c LEFT JOIN zhou_user u ON c.zhou_user_id = u.zhou_user_id WHERE c.zhou_goods_id = ? ORDER BY c.zhou_created_at DESC',
        [zhou_goods_id]
    );
}

/** 新增评价 */
async function zhou_add_comment(zhou_data) {
    const zhou_info = await zhou_run(
        'INSERT INTO zhou_comment (zhou_goods_id, zhou_order_id, zhou_user_id, zhou_rating, zhou_content, zhou_created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [zhou_data.zhou_goods_id, zhou_data.zhou_order_id, zhou_data.zhou_user_id, zhou_data.zhou_rating || 5, zhou_data.zhou_content || '', zhou_data.zhou_created_at]
    );
    return zhou_info;
}

/** 订单详情 */
async function zhou_get_order(zhou_order_id) {
    return zhou_get('SELECT * FROM zhou_order WHERE zhou_order_id = ? LIMIT 1', [zhou_order_id]);
}

module.exports = {
    zhou_list_orders,
    zhou_build_order_no,
    zhou_create_order,
    zhou_update_order_status,
    zhou_list_comments,
    zhou_add_comment,
    zhou_get_order
};