/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_order_controller.js —— 订单与评价控制器
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_now, zhou_int, zhou_need } = require('../utils/zhou_util');
const zhou_order_model = require('../models/zhou_order_model');
const zhou_goods_model = require('../models/zhou_goods_model');

/** GET /api/order 订单列表 */
async function zhou_order_list(req, res) {
    const zhou_user_id = zhou_int(req.query.zhou_user_id, 0);
    const zhou_role = req.query.zhou_role === 'seller' ? 'seller' : 'buyer';
    const zhou_list = await zhou_order_model.zhou_list_orders(zhou_user_id, zhou_role);
    return zhou_success(res, { zhou_list: zhou_list }, '获取订单列表成功');
}

/** POST /api/order 下单 */
async function zhou_order_create(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_goods_id', 'zhou_buyer_id']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_goods = await zhou_goods_model.zhou_get_goods(zhou_int(zhou_body.zhou_goods_id, 0));
    if (!zhou_goods) {
        return zhou_fail(res, 404, '商品不存在');
    }
    if (zhou_goods.zhou_status !== '在售') {
        return zhou_fail(res, 409, '该商品当前状态为「' + zhou_goods.zhou_status + '」，无法下单');
    }
    if (Number(zhou_goods.zhou_user_id) === zhou_int(zhou_body.zhou_buyer_id, 0)) {
        return zhou_fail(res, 400, '不能购买自己发布的商品');
    }
    zhou_body.zhou_price = Number(zhou_goods.zhou_price);
    zhou_body.zhou_quantity = zhou_int(zhou_body.zhou_quantity, 1);
    zhou_body.zhou_total_amount = Number((zhou_body.zhou_price * zhou_body.zhou_quantity).toFixed(2));
    zhou_body.zhou_seller_id = zhou_goods.zhou_user_id;
    zhou_body.zhou_order_no = await zhou_order_model.zhou_build_order_no();
    zhou_body.zhou_created_at = zhou_now();
    const zhou_info = await zhou_order_model.zhou_create_order(zhou_body);
    return zhou_success(res, {
        zhou_order_id: zhou_info.lastInsertRowid,
        zhou_order_no: zhou_body.zhou_order_no
    }, '下单成功，请尽快完成付款');
}
/** PUT /api/order/:id/status 更新订单状态 */
async function zhou_order_status(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_status = (req.body || {}).zhou_status;
    const zhou_allow = ['待付款', '待发货', '待收货', '已完成', '已取消', '退款中', '已退款'];
    if (zhou_allow.indexOf(zhou_status) < 0) {
        return zhou_fail(res, 400, '订单状态只能是：' + zhou_allow.join(' / '));
    }
    const zhou_order = await zhou_order_model.zhou_get_order(zhou_id);
    if (!zhou_order) {
        return zhou_fail(res, 404, '订单不存在');
    }
    const zhou_info = await zhou_order_model.zhou_update_order_status(zhou_id, zhou_status);
    return zhou_success(res, { zhou_changes: zhou_info.changes, zhou_status: zhou_status }, '订单状态已更新');
}

/** GET /api/comment 商品评价列表 */
async function zhou_comment_list(req, res) {
    const zhou_goods_id = zhou_int(req.query.zhou_goods_id, 0);
    const zhou_list = await zhou_order_model.zhou_list_comments(zhou_goods_id);
    return zhou_success(res, { zhou_list: zhou_list }, '获取评价列表成功');
}

/** POST /api/comment 发表评价 */
async function zhou_comment_add(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_goods_id', 'zhou_order_id', 'zhou_user_id']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    zhou_body.zhou_rating = zhou_int(zhou_body.zhou_rating, 5);
    if (zhou_body.zhou_rating < 1 || zhou_body.zhou_rating > 5) {
        return zhou_fail(res, 400, '评分必须是 1 到 5 之间的整数');
    }
    zhou_body.zhou_created_at = zhou_now();
    const zhou_info = await zhou_order_model.zhou_add_comment(zhou_body);
    return zhou_success(res, { zhou_comment_id: zhou_info.lastInsertRowid }, '评价发表成功');
}

module.exports = {
    zhou_order_list,
    zhou_order_create,
    zhou_order_status,
    zhou_comment_list,
    zhou_comment_add
};