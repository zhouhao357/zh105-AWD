/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_goods_controller.js —— 商品与分类控制器
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_now, zhou_int, zhou_need } = require('../utils/zhou_util');
const zhou_goods_model = require('../models/zhou_goods_model');
const zhou_order_model = require('../models/zhou_order_model');

/** GET /api/goods 商品列表（分页 / 搜索 / 分类筛选 / 排序） */
async function zhou_goods_list(req, res) {
    const zhou_query = req.query;
    const zhou_page = zhou_int(zhou_query.zhou_page, 1);
    const zhou_size = zhou_int(zhou_query.zhou_size, 9);
    const zhou_data = await zhou_goods_model.zhou_list_goods({
        zhou_keyword: zhou_query.zhou_keyword || '',
        zhou_category_id: zhou_query.zhou_category_id || '',
        zhou_status: zhou_query.zhou_status || '',
        zhou_user_id: zhou_query.zhou_user_id || '',
        zhou_sort: zhou_query.zhou_sort || 'new',
        zhou_page: zhou_page,
        zhou_size: zhou_size
    });
    return zhou_success(res, {
        zhou_list: zhou_data.zhou_list,
        zhou_total: zhou_data.zhou_total,
        zhou_page: zhou_page,
        zhou_size: zhou_size
    }, '获取商品列表成功');
}

/** GET /api/goods/:id 商品详情 */
async function zhou_goods_detail(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_goods = await zhou_goods_model.zhou_get_goods(zhou_id);
    if (!zhou_goods) {
        return zhou_fail(res, 404, '商品不存在或已被删除');
    }
    await zhou_goods_model.zhou_add_view(zhou_id);
    zhou_goods.zhou_view_count = Number(zhou_goods.zhou_view_count) + 1;
    const zhou_comments = await zhou_order_model.zhou_list_comments(zhou_id);
    return zhou_success(res, { zhou_goods: zhou_goods, zhou_comments: zhou_comments }, '获取商品详情成功');
}
/** POST /api/goods 发布商品 */
async function zhou_goods_create(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_title', 'zhou_price', 'zhou_category_id', 'zhou_user_id']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_num = Number(zhou_body.zhou_price);
    if (Number.isNaN(zhou_num) || zhou_num <= 0) {
        return zhou_fail(res, 400, '商品价格必须是大于 0 的数字');
    }
    zhou_body.zhou_price = zhou_num;
    zhou_body.zhou_original_price = zhou_body.zhou_original_price ? Number(zhou_body.zhou_original_price) : zhou_num;
    zhou_body.zhou_stock = zhou_int(zhou_body.zhou_stock, 1);
    zhou_body.zhou_created_at = zhou_now();
    const zhou_info = await zhou_goods_model.zhou_create_goods(zhou_body);
    return zhou_success(res, { zhou_goods_id: zhou_info.lastInsertRowid }, '商品发布成功，等待审核');
}

/** PUT /api/goods/:id/status 修改商品状态 */
async function zhou_goods_status(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_status = (req.body || {}).zhou_status;
    const zhou_allow = ['在售', '已售出', '已下架'];
    if (zhou_allow.indexOf(zhou_status) < 0) {
        return zhou_fail(res, 400, '商品状态只能是：' + zhou_allow.join(' / '));
    }
    const zhou_goods = await zhou_goods_model.zhou_get_goods(zhou_id);
    if (!zhou_goods) {
        return zhou_fail(res, 404, '商品不存在');
    }
    const zhou_info = await zhou_goods_model.zhou_update_goods_status(zhou_id, zhou_status);
    return zhou_success(res, { zhou_changes: zhou_info.changes, zhou_status: zhou_status }, '商品状态已更新');
}

/** DELETE /api/goods/:id 删除商品 */
async function zhou_goods_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_goods = await zhou_goods_model.zhou_get_goods(zhou_id);
    if (!zhou_goods) {
        return zhou_fail(res, 404, '商品不存在');
    }
    const zhou_info = await zhou_goods_model.zhou_delete_goods(zhou_id);
    return zhou_success(res, { zhou_changes: zhou_info.changes }, '商品已删除');
}

/** GET /api/category 分类列表 */
async function zhou_category_list(req, res) {
    const zhou_list = await zhou_goods_model.zhou_list_categories();
    return zhou_success(res, { zhou_list: zhou_list }, '获取分类列表成功');
}

module.exports = {
    zhou_goods_list,
    zhou_goods_detail,
    zhou_goods_create,
    zhou_goods_status,
    zhou_goods_remove,
    zhou_category_list
};