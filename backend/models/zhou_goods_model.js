/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_goods_model.js —— 商品与分类数据访问层（MySQL）
 */

'use strict';

const { zhou_all, zhou_get, zhou_run } = require('../db/zhou_db');

/** 商品列表：关键字 + 分类 + 状态 + 排序 + 分页 */
async function zhou_list_goods(zhou_opt) {
    const zhou_page = zhou_opt.zhou_page || 1;
    const zhou_size = zhou_opt.zhou_size || 9;
    const zhou_offset = (zhou_page - 1) * zhou_size;
    let zhou_where = 'WHERE 1 = 1';
    const zhou_params = [];

    if (zhou_opt.zhou_keyword) {
        zhou_where += ' AND (g.zhou_title LIKE ? OR g.zhou_description LIKE ?)';
        zhou_params.push('%' + zhou_opt.zhou_keyword + '%', '%' + zhou_opt.zhou_keyword + '%');
    }
    if (zhou_opt.zhou_category_id) {
        zhou_where += ' AND g.zhou_category_id = ?';
        zhou_params.push(zhou_opt.zhou_category_id);
    }
    if (zhou_opt.zhou_status) {
        zhou_where += ' AND g.zhou_status = ?';
        zhou_params.push(zhou_opt.zhou_status);
    }
    if (zhou_opt.zhou_user_id) {
        zhou_where += ' AND g.zhou_user_id = ?';
        zhou_params.push(zhou_opt.zhou_user_id);
    }

    const zhou_order = {
        new: 'g.zhou_created_at DESC',
        price_asc: 'g.zhou_price ASC',
        price_desc: 'g.zhou_price DESC',
        hot: 'g.zhou_view_count DESC'
    }[zhou_opt.zhou_sort] || 'g.zhou_created_at DESC';

    const zhou_sql = 'SELECT g.zhou_goods_id, g.zhou_user_id, g.zhou_category_id, g.zhou_title, g.zhou_description, g.zhou_price, g.zhou_original_price, g.zhou_stock, g.zhou_cover, g.zhou_condition, g.zhou_trade_place, g.zhou_status, g.zhou_view_count, g.zhou_created_at, c.zhou_cate_name, u.zhou_nickname, u.zhou_college FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id LEFT JOIN zhou_user u ON g.zhou_user_id = u.zhou_user_id ' + zhou_where + ' ORDER BY ' + zhou_order + ' LIMIT ? OFFSET ?';

    const zhou_rows = await zhou_all(zhou_sql, zhou_params.concat([zhou_size, zhou_offset]));
    const zhou_total = await zhou_get('SELECT COUNT(*) AS zhou_cnt FROM zhou_goods g ' + zhou_where, zhou_params);
    return { zhou_list: zhou_rows, zhou_total: zhou_total.zhou_cnt };
}
/** 商品详情 */
async function zhou_get_goods(zhou_goods_id) {
    return zhou_get(
        'SELECT g.zhou_goods_id, g.zhou_user_id, g.zhou_category_id, g.zhou_title, g.zhou_description, g.zhou_price, g.zhou_original_price, g.zhou_stock, g.zhou_cover, g.zhou_condition, g.zhou_trade_place, g.zhou_status, g.zhou_view_count, g.zhou_created_at, c.zhou_cate_name, u.zhou_nickname, u.zhou_college, u.zhou_phone FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id LEFT JOIN zhou_user u ON g.zhou_user_id = u.zhou_user_id WHERE g.zhou_goods_id = ? LIMIT 1',
        [zhou_goods_id]
    );
}

/** 新增商品 */
async function zhou_create_goods(zhou_data) {
    const zhou_info = await zhou_run(
        'INSERT INTO zhou_goods (zhou_user_id, zhou_category_id, zhou_title, zhou_description, zhou_price, zhou_original_price, zhou_stock, zhou_cover, zhou_condition, zhou_trade_place, zhou_status, zhou_view_count, zhou_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [zhou_data.zhou_user_id, zhou_data.zhou_category_id, zhou_data.zhou_title, zhou_data.zhou_description || '',
         zhou_data.zhou_price, zhou_data.zhou_original_price || zhou_data.zhou_price, zhou_data.zhou_stock || 1,
         zhou_data.zhou_cover || 'images/goods01.png', zhou_data.zhou_condition || '九成新',
         zhou_data.zhou_trade_place || '待协商', '在售', zhou_data.zhou_created_at]
    );
    return zhou_info;
}

/** 修改商品状态（上架 / 下架 / 已售出） */
async function zhou_update_goods_status(zhou_goods_id, zhou_status) {
    return zhou_run('UPDATE zhou_goods SET zhou_status = ? WHERE zhou_goods_id = ?', [zhou_status, zhou_goods_id]);
}

/** 删除商品 */
async function zhou_delete_goods(zhou_goods_id) {
    return zhou_run('DELETE FROM zhou_goods WHERE zhou_goods_id = ?', [zhou_goods_id]);
}

/** 浏览量 +1 */
async function zhou_add_view(zhou_goods_id) {
    return zhou_run('UPDATE zhou_goods SET zhou_view_count = zhou_view_count + 1 WHERE zhou_goods_id = ?', [zhou_goods_id]);
}

/** 分类列表 */
async function zhou_list_categories() {
    return zhou_all('SELECT zhou_category_id, zhou_cate_name, zhou_cate_icon, zhou_cate_desc, zhou_sort_order FROM zhou_category ORDER BY zhou_sort_order ASC');
}

module.exports = {
    zhou_list_goods,
    zhou_get_goods,
    zhou_create_goods,
    zhou_update_goods_status,
    zhou_delete_goods,
    zhou_add_view,
    zhou_list_categories
};