/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_auth.js —— 后台管理鉴权中间件
 *   1. zhou_sign / zhou_verify   基于 HMAC-SHA256 的无状态 Token 签发与校验
 *   2. zhou_require_admin         管理员身份校验中间件（校验 Authorization 头）
 *   3. zhou_write_log             写入管理员操作日志
 *
 * 说明：Token 采用「payload.base64url(HMAC 签名)」格式，
 *      payload 含 zhou_user_id / zhou_role / zhou_nick / exp，
 *      服务端不落库即可校验，避免额外会话表。
 */

'use strict';

const crypto = require('crypto');
const zhou_db = require('../db/zhou_db');
const { zhou_fail } = require('./zhou_response');
const { zhou_now } = require('../utils/zhou_util');

/* 签名密钥：优先读 .env 的 ADMIN_SECRET，未配置时使用默认值 */
const ZHOU_ADMIN_SECRET = process.env.ADMIN_SECRET || 'zhou_campus_market_admin_2026';
/* Token 有效期（秒），默认 2 小时 */
const ZHOU_ADMIN_TTL = Number(process.env.ADMIN_TOKEN_TTL) || 7200;

/** 生成签名 */
function zhou_sign(zhou_payload) {
    const zhou_body = Buffer.from(JSON.stringify(zhou_payload)).toString('base64url');
    const zhou_mac = crypto.createHmac('sha256', ZHOU_ADMIN_SECRET).update(zhou_body).digest('base64url');
    return zhou_body + '.' + zhou_mac;
}

/**
 * 校验 Token
 * @returns {Object|null} 校验通过返回 payload，否则返回 null
 */
function zhou_verify(zhou_token) {
    if (!zhou_token || typeof zhou_token !== 'string') {
        return null;
    }
    const zhou_dot = zhou_token.indexOf('.');
    if (zhou_dot < 1) {
        return null;
    }
    const zhou_body = zhou_token.slice(0, zhou_dot);
    const zhou_mac = zhou_token.slice(zhou_dot + 1);
    const zhou_expect = crypto.createHmac('sha256', ZHOU_ADMIN_SECRET).update(zhou_body).digest('base64url');
    /* 定长比较，避免时序侧信道；长度不同直接判否 */
    if (zhou_mac.length !== zhou_expect.length) {
        return null;
    }
    if (!crypto.timingSafeEqual(Buffer.from(zhou_mac), Buffer.from(zhou_expect))) {
        return null;
    }
    let zhou_payload;
    try {
        zhou_payload = JSON.parse(Buffer.from(zhou_body, 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
    /* 过期时间字段兼容 zhou_exp 与 exp 两种写法 */
    const zhou_exp = zhou_payload && (zhou_payload.zhou_exp || zhou_payload.exp);
    if (!zhou_payload || !zhou_exp || zhou_exp < Date.now()) {
        return null;
    }
    return zhou_payload;
}

/**
 * 签发管理员 Token
 */
function zhou_issue(zhou_user) {
    const zhou_payload = {
        zhou_user_id: Number(zhou_user.zhou_user_id),
        zhou_username: zhou_user.zhou_username,
        zhou_nick: zhou_user.zhou_nickname,
        zhou_role: zhou_user.zhou_role || '管理员',
        zhou_iat: Date.now(),
        zhou_exp: Date.now() + ZHOU_ADMIN_TTL * 1000
    };
    return {
        zhou_token: zhou_sign(zhou_payload),
        zhou_expires: ZHOU_ADMIN_TTL
    };
}

/**
 * 管理员校验中间件
 * 用法： zhou_router.get('/admin/stats', zhou_require_admin, zhou_async(controller.xxx))
 */
function zhou_require_admin(req, res, next) {
    const zhou_header = req.headers.authorization || req.headers.Authorization || '';
    const zhou_token = zhou_header.replace(/^Bearer\s+/i, '').trim();
    if (!zhou_token) {
        return zhou_fail(res, 401, '未登录或登录已失效，请重新登录后台');
    }
    const zhou_payload = zhou_verify(zhou_token);
    if (!zhou_payload) {
        return zhou_fail(res, 401, '登录凭证无效或已过期，请重新登录后台');
    }
    if (zhou_payload.zhou_role !== '管理员') {
        return zhou_fail(res, 403, '该账号没有后台管理权限');
    }
    /* 把管理员身份挂到 req 上，控制器可直接使用 */
    req.zhou_admin = zhou_payload;
    return next();
}

/**
 * 写入管理员操作日志（失败不影响主流程）
 */
async function zhou_write_log(zhou_admin, zhou_action, zhou_target, zhou_detail) {
    try {
        await zhou_db.zhou_run(
            'INSERT INTO zhou_admin_log (zhou_admin_id, zhou_admin_name, zhou_action, zhou_target, zhou_detail, zhou_created_at)' +
            ' VALUES (?, ?, ?, ?, ?, ?)',
            [
                Number(zhou_admin.zhou_user_id) || 0,
                zhou_admin.zhou_nick || '管理员',
                String(zhou_action || '').slice(0, 40),
                String(zhou_target || '').slice(0, 60),
                String(zhou_detail || '').slice(0, 255),
                zhou_now()
            ]
        );
    } catch (e) {
        console.error('[zhou_auth] 操作日志写入失败：' + e.message);
    }
}

module.exports = {
    zhou_sign,
    zhou_verify,
    zhou_issue,
    zhou_require_admin,
    zhou_write_log
};