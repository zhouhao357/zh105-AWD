/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_response.js —— 统一 JSON 响应中间件
 * 统一格式：{ "code": 0, "msg": "提示信息", "data": { ... } }
 * code = 0 表示成功，非 0 表示失败。
 */

'use strict';

/** 业务成功响应 */
function zhou_success(res, zhou_data, zhou_msg) {
    return res.json({
        code: 0,
        msg: zhou_msg || '操作成功',
        data: zhou_data === undefined ? {} : zhou_data
    });
}

/** 业务失败响应 */
function zhou_fail(res, zhou_code, zhou_msg) {
    return res.json({
        code: zhou_code,
        msg: zhou_msg || '操作失败',
        data: null
    });
}

/** 包装异步控制器，自动捕获异常并返回统一失败格式 */
function zhou_async(zhou_handler) {
    return function (req, res, next) {
        Promise.resolve(zhou_handler(req, res, next)).catch(function (e) {
            console.error('[zhou_api] 接口异常：' + e.message);
            if (!res.headersSent) {
                zhou_fail(res, 500, '服务器内部错误：' + e.message);
            }
        });
    };
}
/** 404 处理 */
function zhou_not_found(req, res) {
    return zhou_fail(res, 404, '接口不存在：' + req.method + ' ' + req.originalUrl);
}

/** 全局异常处理 */
function zhou_error_handler(err, req, res, next) {
    console.error('[zhou_api] 未捕获异常：' + err.message);
    if (!res.headersSent) {
        zhou_fail(res, 500, '服务器内部错误：' + err.message);
    }
}

module.exports = {
    zhou_success,
    zhou_fail,
    zhou_async,
    zhou_not_found,
    zhou_error_handler
};