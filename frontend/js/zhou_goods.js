/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_goods.js —— 商品列表页逻辑：分类筛选、搜索、排序、分页
 */

'use strict';

var zhou_state = {
    zhou_page: 1,
    zhou_size: 9,
    zhou_total: 0,
    zhou_category_id: '',
    zhou_keyword: '',
    zhou_sort: 'new'
};

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('goods');
    zhou_load_category();
    zhou_load_goods();

    document.getElementById('zhou_search_btn').addEventListener('click', function () {
        zhou_state.zhou_keyword = document.getElementById('zhou_keyword').value.trim();
        zhou_state.zhou_page = 1;
        zhou_load_goods();
    });

    document.getElementById('zhou_sort').addEventListener('change', function () {
        zhou_state.zhou_sort = this.value;
        zhou_state.zhou_page = 1;
        zhou_load_goods();
    });

    document.getElementById('zhou_reset').addEventListener('click', function () {
        zhou_state.zhou_category_id = '';
        zhou_state.zhou_keyword = '';
        zhou_state.zhou_sort = 'new';
        zhou_state.zhou_page = 1;
        document.getElementById('zhou_keyword').value = '';
        document.getElementById('zhou_sort').value = 'new';
        zhou_load_category();
        zhou_load_goods();
    });
});

/** 加载分类栏 */
function zhou_load_category() {
    zhou_request('/category', 'GET').then(function (res) {
        console.log('[列表页] 分类数据：', res.data);
        var zhou_html = '<div class="zhou_cate_item' + (zhou_state.zhou_category_id ? '' : ' zhou_on') + '" data-zhou_id="">全部分类</div>';
        zhou_html += res.data.zhou_list.map(function (zhou_c) {
            var zhou_on = String(zhou_c.zhou_category_id) === String(zhou_state.zhou_category_id) ? ' zhou_on' : '';
            return '<div class="zhou_cate_item' + zhou_on + '" data-zhou_id="' + zhou_c.zhou_category_id + '">' + zhou_c.zhou_cate_name + '</div>';
        }).join('');
        var zhou_bar = document.getElementById('zhou_cate_bar');
        zhou_bar.innerHTML = zhou_html;
        Array.prototype.forEach.call(zhou_bar.querySelectorAll('.zhou_cate_item'), function (zhou_el) {
            zhou_el.addEventListener('click', function () {
                zhou_state.zhou_category_id = this.getAttribute('data-zhou_id');
                zhou_state.zhou_page = 1;
                zhou_load_category();
                zhou_load_goods();
            });
        });
    }).catch(function (e) {
        console.error('[列表页] 分类加载失败：', e);
    });
}
/** 加载商品列表 */
function zhou_load_goods() {
    var zhou_q = '?zhou_page=' + zhou_state.zhou_page + '&zhou_size=' + zhou_state.zhou_size +
        '&zhou_sort=' + zhou_state.zhou_sort;
    if (zhou_state.zhou_category_id) { zhou_q += '&zhou_category_id=' + zhou_state.zhou_category_id; }
    if (zhou_state.zhou_keyword) { zhou_q += '&zhou_keyword=' + encodeURIComponent(zhou_state.zhou_keyword); }

    zhou_request('/goods' + zhou_q, 'GET').then(function (res) {
        console.log('[列表页] 商品数据：', res.data);
        zhou_state.zhou_total = res.data.zhou_total;
        zhou_render_list(res.data.zhou_list);
        zhou_render_pager();
    }).catch(function (e) {
        console.error('[列表页] 商品加载失败：', e);
        document.getElementById('zhou_goods_list').innerHTML = '<div class="zhou_empty">加载失败：' + (e.msg || '网络异常') + '</div>';
    });
}

/** 渲染商品网格 */
function zhou_render_list(zhou_list) {
    var zhou_box = document.getElementById('zhou_goods_list');
    if (!zhou_list.length) {
        zhou_box.innerHTML = '<div class="zhou_empty">没有找到符合条件的商品，换个关键词试试</div>';
        return;
    }
    zhou_box.innerHTML = zhou_list.map(function (zhou_g, zhou_i) {
        var zhou_cate = zhou_g.zhou_cate_name || '其他';
        var zhou_cls = zhou_g.zhou_status === '在售' ? 'zhou_tag_green' : 'zhou_tag_gray';
        return '<a class="zhou_goods_card" href="goods-detail.html?zhou_id=' + zhou_g.zhou_goods_id + '">' +
            '<div class="zhou_cover" style="background:' + zhou_cover_bg(zhou_cate.slice(0, 2), zhou_i) + '">' + zhou_cate.slice(0, 2) + '</div>' +
            '<div class="zhou_goods_body">' +
            '<div class="zhou_goods_title">' + zhou_g.zhou_title + '</div>' +
            '<div class="zhou_goods_desc">' + (zhou_g.zhou_description || '').slice(0, 42) + '</div>' +
            '<div><span class="zhou_tag">' + zhou_cate + '</span>' +
            '<span class="zhou_tag ' + zhou_cls + '">' + zhou_g.zhou_status + '</span>' +
            '<span class="zhou_tag zhou_tag_gray">' + (zhou_g.zhou_condition || '') + '</span></div>' +
            '<div class="zhou_price">￥' + zhou_money(zhou_g.zhou_price) +
            (zhou_g.zhou_original_price && zhou_g.zhou_original_price > zhou_g.zhou_price ? '<small>￥' + zhou_money(zhou_g.zhou_original_price) + '</small>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:#94a3b8;margin-top:4px">' + (zhou_g.zhou_nickname || '') + ' · ' + zhou_g.zhou_college + '</div>' +
            '<div style="font-size:12px;color:#cbd5e1;margin-top:2px">' + zhou_time(zhou_g.zhou_created_at) + ' · ' + zhou_g.zhou_view_count + ' 次浏览</div>' +
            '</div></a>';
    }).join('');
}

/** 渲染分页 */
function zhou_render_pager() {
    var zhou_pages = Math.ceil(zhou_state.zhou_total / zhou_state.zhou_size) || 1;
    if (zhou_pages <= 1) {
        document.getElementById('zhou_pager').innerHTML = '';
        return;
    }
    var zhou_html = '';
    for (var zhou_i = 1; zhou_i <= zhou_pages; zhou_i++) {
        zhou_html += '<button data-zhou_page="' + zhou_i + '"' + (zhou_i === zhou_state.zhou_page ? ' class="zhou_on"' : '') + '>' + zhou_i + '</button>';
    }
    var zhou_box = document.getElementById('zhou_pager');
    zhou_box.innerHTML = zhou_html;
    Array.prototype.forEach.call(zhou_box.querySelectorAll('button'), function (zhou_el) {
        zhou_el.addEventListener('click', function () {
            zhou_state.zhou_page = Number(this.getAttribute('data-zhou_page'));
            zhou_load_goods();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}