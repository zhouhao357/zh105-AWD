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
    zhou_check_logged();
});

/**
 * 若本地已有登录态，直接给出「进入首页」入口，避免重复登录
 */
function zhou_check_logged() {
    var zhou_user = zhou_get_login_user();
    if (!zhou_user || !zhou_user.zhou_user_id) {
        return;
    }
    console.log('[登录页] 检测到已登录用户：', zhou_user);
    zhou_tip('zhou_msg', '当前已登录为「' + zhou_current_user_name() + '」（ID ' +
        zhou_user.zhou_user_id + '），可直接进入首页。', 'info');
    var zhou_box = document.getElementById('zhou_msg');
    var zhou_btn = document.createElement('a');
    zhou_btn.className = 'zhou_btn zhou_btn_primary';
    zhou_btn.href = 'index.html';
    zhou_btn.textContent = '进入首页';
    zhou_btn.style.marginTop = '8px';
    zhou_box.parentNode.insertBefore(zhou_btn, zhou_box.nextSibling);
}

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
        /* 跳回来源页（从 AI 客服 / 知识库点登录进来时回到原页面） */
        var zhou_back = zhou_get_redirect();
        zhou_clear_redirect();
        zhou_tip('zhou_msg', res.msg + '，正在跳转到' + (zhou_back || '首页') + '……', 'ok');
        setTimeout(function () {
            window.location.href = zhou_back || 'index.html';
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
    }).catch(function (e) {        console.error('[登录页] 注册失败：', e);
        zhou_tip('zhou_msg', e.msg || '注册失败', 'err');
    });
}