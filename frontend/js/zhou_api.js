/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_api.js —— 前端统一请求封装
 * 后端统一返回 { code, msg, data }，code = 0 成功。
 * 服务器返回的数据与错误信息全部输出到浏览器控制台。
 */

'use strict';

/** 后端接口基础地址：同源部署，直接用相对路径 */
var ZHOU_API_BASE = '/api';

/** 当前登录用户（存 localStorage，键名 zhou_user） */
var zhou_get_login_user = function () {
    try {
        return JSON.parse(localStorage.getItem('zhou_user') || 'null');
    } catch (e) {
        return null;
    }
};

/** 保存登录用户 */
var zhou_set_login_user = function (zhou_user) {
    localStorage.setItem('zhou_user', JSON.stringify(zhou_user));
};

/** 退出登录 */
var zhou_clear_login_user = function () {
    localStorage.removeItem('zhou_user');
};

/**
 * 统一请求方法
 * @param {string} zhou_path 接口路径，如 /goods
 * @param {string} zhou_method 请求方法 GET / POST / PUT / DELETE
 * @param {Object} zhou_data 参数对象
 * @returns {Promise<Object>} 统一响应结构 { code, msg, data }
 */
function zhou_request(zhou_path, zhou_method, zhou_data) {
    var zhou_url = ZHOU_API_BASE + zhou_path;
    var zhou_options = {
        method: zhou_method || 'GET',
        headers: { 'Content-Type': 'application/json' }
    };
    if (zhou_options.method !== 'GET' && zhou_data) {
        zhou_options.body = JSON.stringify(zhou_data);
    }

    console.log('[zhou_api] 请求：' + zhou_options.method + ' ' + zhou_url, zhou_data || '');

    return fetch(zhou_url, zhou_options)
        .then(function (res) {
            return res.json().then(function (zhou_json) {
                console.log('[zhou_api] 响应状态：' + res.status, zhou_json);
                if (zhou_json && zhou_json.code === 0) {
                    return zhou_json;
                }
                console.error('[zhou_api] 接口业务失败：' + (zhou_json ? zhou_json.msg : '无响应体'));
                return Promise.reject(zhou_json || { code: -1, msg: '网络异常', data: null });
            });
        })
        .catch(function (e) {
            /* 业务失败（如 code=400）在上一环节 reject，这里保留原始 msg */
            if (e && typeof e.code === 'number' && e.msg) {
                console.error('[zhou_api] 接口业务失败：' + e.msg);
                return Promise.reject(e);
            }
            console.error('[zhou_api] 请求异常：', e);
            return Promise.reject({ code: -1, msg: '网络异常，请检查后端服务是否启动', data: null });
        });
}