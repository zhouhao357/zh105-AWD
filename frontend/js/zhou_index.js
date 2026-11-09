/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_index.js —— 首页逻辑：统计、热门商品、最新上架、公告
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('index');
    zhou_load_stat();
    zhou_load_notice();
    zhou_load_hot();
});

/** 首页统计 */
function zhou_load_stat() {
    zhou_request('/home', 'GET').then(function (res) {
        console.log('[首页] 统计数据：', res.data);
        var zhou_d = res.data;
        document.getElementById('zhou_stat').innerHTML = [
            { zhou_num: zhou_d.zhou_user_count, zhou_name: '注册用户' },
            { zhou_num: zhou_d.zhou_goods_count, zhou_name: '在售商品' },
            { zhou_num: zhou_d.zhou_order_count, zhou_name: '累计订单' },
            { zhou_num: zhou_d.zhou_comment_count, zhou_name: '用户评价' },
            { zhou_num: zhou_d.zhou_avg_price, zhou_name: '平均价格' }
        ].map(function (zhou_s) {
            return '<div class="zhou_stat"><b>' + zhou_s.zhou_num + '</b><span>' + zhou_s.zhou_name + '</span></div>';
        }).join('');
    }).catch(function (e) {
        console.error('[首页] 统计加载失败：', e);
    });
}

/** 公告列表 */
function zhou_load_notice() {
    zhou_request('/notice', 'GET').then(function (res) {
        console.log('[首页] 公告数据：', res.data);
        var zhou_html = res.data.zhou_list.map(function (zhou_n) {
            return '<tr><td><span class="zhou_tag zhou_tag_orange">' + zhou_n.zhou_notice_type + '</span>' + zhou_n.zhou_title + '</td>' +
                '<td style="color:#94a3b8">' + zhou_n.zhou_publisher + '</td>' +
                '<td style="color:#94a3b8">' + zhou_time(zhou_n.zhou_created_at) + '</td></tr>';
        }).join('');
        document.getElementById('zhou_notice').innerHTML = zhou_html;
    }).catch(function (e) {
        console.error('[首页] 公告加载失败：', e);
    });
}
/** 热门商品（按浏览量） */
function zhou_load_hot() {
    zhou_request('/goods?zhou_sort=hot&zhou_size=5', 'GET').then(function (res) {
        console.log('[首页] 热门商品：', res.data);
        zhou_render_goods(res.data.zhou_list, 'zhou_hot');
    }).catch(function (e) {
        console.error('[首页] 热门商品加载失败：', e);
    });
}

/** 渲染商品卡片 */
function zhou_render_goods(zhou_list, zhou_target) {
    var zhou_box = document.getElementById(zhou_target);
    if (!zhou_box) { return; }
    if (!zhou_list.length) {
        zhou_box.innerHTML = '<div class="zhou_empty">暂无数据</div>';
        return;
    }
    zhou_box.innerHTML = zhou_list.map(function (zhou_g, zhou_i) {
        var zhou_title = zhou_g.zhou_title || '';
        var zhou_cate = zhou_g.zhou_cate_name || '其他';
        return '<a class="zhou_goods_card" href="goods-detail.html?zhou_id=' + zhou_g.zhou_goods_id + '">' +
            '<div class="zhou_cover" style="background:' + zhou_cover_bg(zhou_cate.slice(0, 2), zhou_i) + '">' + zhou_cate.slice(0, 2) + '</div>' +
            '<div class="zhou_goods_body">' +
            '<div class="zhou_goods_title">' + zhou_title + '</div>' +
            '<div class="zhou_goods_desc">' + (zhou_g.zhou_description || '').slice(0, 40) + '</div>' +
            '<div><span class="zhou_tag">' + zhou_cate + '</span><span class="zhou_tag zhou_tag_gray">' + (zhou_g.zhou_condition || '') + '</span></div>' +
            '<div class="zhou_price">￥' + zhou_money(zhou_g.zhou_price) +
            (zhou_g.zhou_original_price && zhou_g.zhou_original_price > zhou_g.zhou_price ? '<small>￥' + zhou_money(zhou_g.zhou_original_price) + '</small>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:#94a3b8;margin-top:4px">' + (zhou_g.zhou_nickname || '') + ' · ' + zhou_time(zhou_g.zhou_created_at) + '</div>' +
            '</div></a>';
    }).join('');
}