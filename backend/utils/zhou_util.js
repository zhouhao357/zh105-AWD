/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_util.js —— 公共工具函数
 */

'use strict';

const crypto = require('crypto');

/** 当前时间字符串 YYYY-MM-DD HH:MM:SS */
function zhou_now() {
    const zhou_d = new Date();
    const zhou_p = function (n) {
        return String(n).padStart(2, '0');
    };
    return zhou_d.getFullYear() + '-' + zhou_p(zhou_d.getMonth() + 1) + '-' + zhou_p(zhou_d.getDate()) + ' ' +
        zhou_p(zhou_d.getHours()) + ':' + zhou_p(zhou_d.getMinutes()) + ':' + zhou_p(zhou_d.getSeconds());
}

/** MD5 加密（密码存储用） */
function zhou_md5(zhou_text) {
    return crypto.createHash('md5').update(String(zhou_text)).digest('hex');
}

/** 取整数，非法值回退默认值 */
function zhou_int(zhou_value, zhou_default) {
    const zhou_n = parseInt(zhou_value, 10);
    return Number.isNaN(zhou_n) ? zhou_default : zhou_n;
}

/** 必填校验：缺失字段列表 */
function zhou_need(zhou_obj, zhou_fields) {
    return zhou_fields.filter(function (zhou_key) {
        const zhou_v = zhou_obj[zhou_key];
        return zhou_v === undefined || zhou_v === null || zhou_v === '';
    });
}

module.exports = {
    zhou_now,
    zhou_md5,
    zhou_int,
    zhou_need
};