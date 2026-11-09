/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_common.js —— 公共渲染工具（导航、提示条、封面占位图）
 */

/** 渲染顶部导航，zhou_current 为当前高亮的页面名 */
function zhou_render_nav(zhou_current) {
    var zhou_user = zhou_get_login_user();
    var zhou_items = [
        { zhou_key: 'index', zhou_name: '首页', zhou_href: 'index.html' },
        { zhou_key: 'goods', zhou_name: '逛集市', zhou_href: 'goods.html' },
        { zhou_key: 'publish', zhou_name: '发布闲置', zhou_href: 'publish.html' }
    ];
    var zhou_html = '';
    zhou_items.forEach(function (zhou_item) {
        var zhou_cls = zhou_item.zhou_key === zhou_current ? ' class="zhou_nav_link zhou_active"' : ' class="zhou_nav_link"';
        zhou_html += '<a' + zhou_cls + ' href="' + zhou_item.zhou_href + '">' + zhou_item.zhou_name + '</a>';
    });
    var zhou_right = zhou_user
        ? '<span>你好，' + zhou_user.zhou_nickname + '</span><a href="login.html">退出</a>'
        : '<a href="login.html">登录 / 注册</a>';
    document.getElementById('zhou_nav').innerHTML =
        '<div class="zhou_nav_inner">' +
        '<a class="zhou_logo" href="index.html"><span>二</span>校园二手集市</a>' +
        zhou_html +
        '<span class="zhou_nav_right">' + zhou_right + '</span>' +
        '</div>';
}

/** 显示提示条 */
function zhou_tip(zhou_id, zhou_msg, zhou_type) {
    var zhou_el = document.getElementById(zhou_id);
    if (!zhou_el) { return; }
    zhou_el.className = 'zhou_tip zhou_tip_show ' + (zhou_type === 'ok' ? 'zhou_tip_ok' : zhou_type === 'info' ? 'zhou_tip_info' : 'zhou_tip_err');
    zhou_el.textContent = zhou_msg;
}

/** 隐藏提示条 */
function zhou_hide_tip(zhou_id) {
    var zhou_el = document.getElementById(zhou_id);
    if (zhou_el) { zhou_el.className = 'zhou_tip'; }
}
/**
 * 生成渐变占位封面（无真实图片时的兜底方案）
 * 注意：URL 必须用单引号包裹，避免与 HTML 属性的双引号冲突导致标签提前截断
 */
function zhou_cover_bg(zhou_text, zhou_index) {
    var zhou_colors = [
        ['#4f46e5', '#a855f7'], ['#0ea5e9', '#22d3ee'], ['#f59e0b', '#f97316'],
        ['#10b981', '#34d399'], ['#ec4899', '#f472b6'], ['#6366f1', '#8b5cf6']
    ];
    var zhou_pair = zhou_colors[Math.abs(zhou_index || 0) % zhou_colors.length];
    var zhou_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' + zhou_pair[0] + '"/>' +
        '<stop offset="100%" stop-color="' + zhou_pair[1] + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="400" height="240" fill="url(#g)"/>' +
        '</svg>';
    return "url('data:image/svg+xml;charset=utf-8," + encodeURIComponent(zhou_svg) + "')";
}

/** 金额格式化 */
function zhou_money(zhou_num) {
    return Number(zhou_num || 0).toFixed(2);
}

/** 把时间格式化为 YYYY-MM-DD HH:MM */
function zhou_time(zhou_str) {
    return zhou_str ? String(zhou_str).slice(0, 16) : '';
}