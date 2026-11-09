/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_notice_model.js —— 公告与首页统计数据访问层（MySQL）
 */

'use strict';

const { zhou_all, zhou_get } = require('../db/zhou_db');

/** 公告列表 */
async function zhou_list_notices(zhou_type) {
    if (zhou_type) {
        return zhou_all('SELECT * FROM zhou_notice WHERE zhou_notice_type = ? ORDER BY zhou_created_at DESC', [zhou_type]);
    }
    return zhou_all('SELECT * FROM zhou_notice ORDER BY zhou_created_at DESC');
}

/** 首页统计（各业务条数 + 热门 + 最新） */
async function zhou_home_stat() {
    const zhou_count = async function (zhou_table) {
        const zhou_row = await zhou_get('SELECT COUNT(*) AS zhou_cnt FROM ' + zhou_table);
        return zhou_row.zhou_cnt;
    };
    const zhou_price = await zhou_get('SELECT IFNULL(AVG(zhou_price), 0) AS zhou_avg FROM zhou_goods');
    const zhou_hot = await zhou_all(
        'SELECT g.zhou_goods_id, g.zhou_title, g.zhou_price, g.zhou_cover, g.zhou_view_count, c.zhou_cate_name FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id ORDER BY g.zhou_view_count DESC LIMIT 5'
    );
    const zhou_new = await zhou_all(
        'SELECT g.zhou_goods_id, g.zhou_title, g.zhou_price, g.zhou_cover, g.zhou_created_at, c.zhou_cate_name FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id ORDER BY g.zhou_created_at DESC LIMIT 5'
    );
    return {
        zhou_user_count: await zhou_count('zhou_user'),
        zhou_goods_count: await zhou_count('zhou_goods'),
        zhou_order_count: await zhou_count('zhou_order'),
        zhou_message_count: await zhou_count('zhou_message'),
        zhou_comment_count: await zhou_count('zhou_comment'),
        zhou_category_count: await zhou_count('zhou_category'),
        zhou_avg_price: Number(Number(zhou_price.zhou_avg).toFixed(2)),
        zhou_hot_goods: zhou_hot,
        zhou_new_goods: zhou_new
    };
}

module.exports = {
    zhou_list_notices,
    zhou_home_stat
};