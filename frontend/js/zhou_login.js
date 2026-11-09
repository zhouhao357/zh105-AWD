/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_login.js —— 登录 / 注册页逻辑
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('login');
    document.getElementById('zhou_login_btn').addEventListener('click', zhou_do_login);
    document.getElementById('zhou_reg_btn').addEventListener('click', zhou_do_register);
});

/** 登录 */
function zhou_do_login() {
    zhou_hide_tip('zhou_msg');
    var zhou_body = {
        zhou_username: document.getElementById('zhou_username').value.trim(),
        zhou_password: document.getElementById('zhou_password').value
    };
    zhou_request('/user/login', 'POST', zhou_body).then(function (res) {
        console.log('[登录页] 登录成功：', res);
        zhou_set_login_user(res.data.zhou_user);
        zhou_tip('zhou_msg', res.msg + '，正在跳转到首页……', 'ok');
        setTimeout(function () {
            window.location.href = 'index.html';
        }, 900);
    }).catch(function (e) {
        console.error('[登录页] 登录失败：', e);
        zhou_tip('zhou_msg', e.msg || '登录失败', 'err');
    });
}

/** 注册 */
function zhou_do_register() {
    zhou_hide_tip('zhou_msg');
    var zhou_body = {
        zhou_username: document.getElementById('zhou_username').value.trim(),
        zhou_password: document.getElementById('zhou_password').value,
        zhou_nickname: document.getElementById('zhou_nickname').value.trim(),
        zhou_college: document.getElementById('zhou_college').value.trim(),
        zhou_phone: document.getElementById('zhou_phone').value.trim()
    };
    zhou_request('/user/register', 'POST', zhou_body).then(function (res) {
        console.log('[登录页] 注册成功：', res);
        zhou_tip('zhou_msg', res.msg + '，请用新账号登录', 'ok');
    }).catch(function (e) {
        console.error('[登录页] 注册失败：', e);
        zhou_tip('zhou_msg', e.msg || '注册失败', 'err');
    });
}