/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_admin_login.js —— 后台管理员登录逻辑
 * 接口：POST /api/admin/login → { code, msg, data: { zhou_token, zhou_expires, zhou_user } }
 */

'use strict';

var ZHOU_ADMIN_TOKEN_KEY = 'zhou_admin_token';
var ZHOU_ADMIN_USER_KEY = 'zhou_admin_user';

/** 显示提示条 */
function zhou_admin_tip(zhou_msg, zhou_type) {
    var zhou_el = document.getElementById('zhou_msg');
    zhou_el.className = 'zhou_tip zhou_tip_show ' + (zhou_type === 'ok' ? 'zhou_tip_ok' : zhou_type === 'info' ? 'zhou_tip_info' : 'zhou_tip_err');
    zhou_el.textContent = zhou_msg;
}

document.addEventListener('DOMContentLoaded', function () {
    /* 已登录且令牌未过期时直接进入后台 */
    var zhou_token = localStorage.getItem(ZHOU_ADMIN_TOKEN_KEY);
    if (zhou_token) {
        fetch('/api/admin/profile', { headers: { Authorization: 'Bearer ' + zhou_token } })
            .then(function (r) { return r.json(); })
            .then(function (j) {
                if (j && j.code === 0) {
                    window.location.replace('index.html');
                } else {
                    localStorage.removeItem(ZHOU_ADMIN_TOKEN_KEY);
                    localStorage.removeItem(ZHOU_ADMIN_USER_KEY);
                }
            })
            .catch(function () { /* 网络异常时留在登录页 */ });
    }

    document.getElementById('zhou_login_btn').addEventListener('click', zhou_admin_login);
    document.getElementById('zhou_password').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            zhou_admin_login();
        }
    });
});

/** 登录 */
function zhou_admin_login() {
    var zhou_username = document.getElementById('zhou_username').value.trim();
    var zhou_password = document.getElementById('zhou_password').value;
    if (!zhou_username || !zhou_password) {
        zhou_admin_tip('请输入管理员账号与密码');
        return;
    }
    console.log('[后台登录] 发起登录请求：', zhou_username);
    fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zhou_username: zhou_username, zhou_password: zhou_password })
    })
        .then(function (r) { return r.json(); })
        .then(function (j) {
            console.log('[后台登录] 响应：', j);
            if (!j || j.code !== 0) {
                zhou_admin_tip((j && j.msg) || '登录失败');
                return;
            }
            localStorage.setItem(ZHOU_ADMIN_TOKEN_KEY, j.data.zhou_token);
            localStorage.setItem(ZHOU_ADMIN_USER_KEY, JSON.stringify(j.data.zhou_user));
            zhou_admin_tip('登录成功，正在进入后台……', 'ok');
            setTimeout(function () {
                window.location.href = 'index.html';
            }, 700);
        })
        .catch(function (e) {
            console.error('[后台登录] 登录异常：', e);
            zhou_admin_tip('网络异常，请确认后端服务已启动');
        });
}