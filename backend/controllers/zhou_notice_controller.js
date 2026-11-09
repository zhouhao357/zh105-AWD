/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_notice_controller.js —— 公告与首页统计控制器
 */

'use strict';

const { zhou_success } = require('../middleware/zhou_response');
const zhou_notice_model = require('../models/zhou_notice_model');

/** GET /api/notice 公告列表 */
async function zhou_notice_list(req, res) {
    const zhou_list = await zhou_notice_model.zhou_list_notices(req.query.zhou_type || '');
    return zhou_success(res, { zhou_list: zhou_list }, '获取公告列表成功');
}

/** GET /api/home 首页聚合数据 */
async function zhou_home_stat(req, res) {
    const zhou_data = await zhou_notice_model.zhou_home_stat();
    return zhou_success(res, zhou_data, '获取首页数据成功');
}

module.exports = {
    zhou_notice_list,
    zhou_home_stat
};