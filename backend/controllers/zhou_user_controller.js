/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_user_controller.js —— 用户控制器
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_now, zhou_md5, zhou_int, zhou_need } = require('../utils/zhou_util');
const zhou_user_model = require('../models/zhou_user_model');

/** POST /api/user/login 登录 */
function zhou_user_login(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_username', 'zhou_password']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_user = zhou_user_model.zhou_login(zhou_body.zhou_username, zhou_md5(zhou_body.zhou_password));
    if (!zhou_user) {
        return zhou_fail(res, 401, '账号或密码错误');
    }
    if (zhou_user.zhou_status !== '正常') {
        return zhou_fail(res, 403, '该账号已被' + zhou_user.zhou_status + '，无法登录');
    }
    return zhou_success(res, { zhou_user: zhou_user }, '登录成功');
}

/** POST /api/user/register 注册 */
function zhou_user_register(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_username', 'zhou_password', 'zhou_nickname']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    if (zhou_user_model.zhou_login(zhou_body.zhou_username, zhou_md5(zhou_body.zhou_password))) {
        return zhou_fail(res, 409, '该账号已被注册');
    }
    zhou_body.zhou_password = zhou_md5(zhou_body.zhou_password);
    zhou_body.zhou_created_at = zhou_now();
    const zhou_info = zhou_user_model.zhou_create_user(zhou_body);
    return zhou_success(res, { zhou_user_id: zhou_info.lastInsertRowid }, '注册成功');
}

/** GET /api/user/:id 用户详情 */
function zhou_user_detail(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_user = zhou_user_model.zhou_get_user(zhou_id);
    if (!zhou_user) {
        return zhou_fail(res, 404, '用户不存在');
    }
    return zhou_success(res, { zhou_user: zhou_user }, '获取用户信息成功');
}

/** GET /api/user 用户列表 */
function zhou_user_list(req, res) {
    const zhou_page = zhou_int(req.query.zhou_page, 1);
    const zhou_size = zhou_int(req.query.zhou_size, 10);
    const zhou_data = zhou_user_model.zhou_list_users(zhou_page, zhou_size, req.query.zhou_keyword || '');
    return zhou_success(res, {
        zhou_list: zhou_data.zhou_list,
        zhou_total: zhou_data.zhou_total,
        zhou_page: zhou_page,
        zhou_size: zhou_size
    }, '获取用户列表成功');
}

/** PUT /api/user/:id 更新用户资料 */
function zhou_user_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    if (!zhou_user_model.zhou_get_user(zhou_id)) {
        return zhou_fail(res, 404, '用户不存在');
    }
    const zhou_info = zhou_user_model.zhou_update_user(zhou_id, req.body || {});
    return zhou_success(res, { zhou_changes: zhou_info.changes }, '资料已更新');
}

module.exports = {
    zhou_user_login,
    zhou_user_register,
    zhou_user_detail,
    zhou_user_list,
    zhou_user_update
};