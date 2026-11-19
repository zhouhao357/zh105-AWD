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
 * 当前登录用户 ID
 * 未登录时回退到默认值，保证演示数据与公开接口仍可访问
 * @param {number} zhou_default 未登录时的回退用户 ID
 */
var zhou_current_user_id = function (zhou_default) {
    var zhou_user = zhou_get_login_user();
    if (zhou_user && zhou_user.zhou_user_id) {
        return Number(zhou_user.zhou_user_id);
    }
    return Number(zhou_default) || 1;
};

/** 当前登录用户昵称（未登录返回空串） */
var zhou_current_user_name = function () {
    var zhou_user = zhou_get_login_user();
    return zhou_user ? (zhou_user.zhou_nickname || zhou_user.zhou_username || '') : '';
};

/**
 * 记录来源页：登录/注册成功后跳回该页（用于「从 AI 客服点登录 → 登录后回到 AI 客服」）
 * 只记录站内页面，避免外部地址注入
 */
var zhou_set_redirect = function (zhou_href) {
    var zhou_url = String(zhou_href || '');
    if (zhou_url.indexOf('http') === 0 || zhou_url.indexOf('//') === 0) {
        zhou_url = '';
    }
    try {
        sessionStorage.setItem('zhou_redirect', zhou_url);
    } catch (e) { /* 隐私模式下 sessionStorage 不可用时忽略 */ }
};

/** 读取来源页 */
var zhou_get_redirect = function () {
    try {
        return sessionStorage.getItem('zhou_redirect') || '';
    } catch (e) {
        return '';
    }
};

/** 清除来源页 */
var zhou_clear_redirect = function () {
    try {
        sessionStorage.removeItem('zhou_redirect');
    } catch (e) { /* 同上 */ }
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