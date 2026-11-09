/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_publish.js —— 发布商品页逻辑
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('publish');
    zhou_load_category_select();

    document.getElementById('zhou_submit').addEventListener('click', zhou_submit);
});

/** 填充分类下拉框 */
function zhou_load_category_select() {
    zhou_request('/category', 'GET').then(function (res) {
        console.log('[发布页] 分类数据：', res.data);
        document.getElementById('zhou_category_id').innerHTML = res.data.zhou_list.map(function (zhou_c) {
            return '<option value="' + zhou_c.zhou_category_id + '">' + zhou_c.zhou_cate_name + '</option>';
        }).join('');
    }).catch(function (e) {
        console.error('[发布页] 分类加载失败：', e);
    });
}

/** 提交发布 */
function zhou_submit() {
    zhou_hide_tip('zhou_msg');
    var zhou_user = zhou_get_login_user();
    if (!zhou_user) {
        zhou_tip('zhou_msg', '请先登录后再发布商品，正在跳转到登录页……', 'err');
        console.warn('[发布页] 未登录用户尝试发布');
        setTimeout(function () {
            window.location.href = 'login.html';
        }, 1200);
        return;
    }

    var zhou_body = {
        zhou_title: document.getElementById('zhou_title').value.trim(),
        zhou_description: document.getElementById('zhou_description').value.trim(),
        zhou_price: document.getElementById('zhou_price').value.trim(),
        zhou_original_price: document.getElementById('zhou_original_price').value.trim(),
        zhou_stock: document.getElementById('zhou_stock').value.trim(),
        zhou_condition: document.getElementById('zhou_condition').value,
        zhou_trade_place: document.getElementById('zhou_trade_place').value.trim(),
        zhou_category_id: document.getElementById('zhou_category_id').value,
        zhou_user_id: zhou_user.zhou_user_id
    };

    zhou_request('/goods', 'POST', zhou_body).then(function (res) {
        console.log('[发布页] 发布成功：', res);
        zhou_tip('zhou_msg', res.msg + '，商品编号：' + res.data.zhou_goods_id, 'ok');
        document.getElementById('zhou_form').reset();
        zhou_load_category_select();
    }).catch(function (e) {
        console.error('[发布页] 发布失败：', e);
        zhou_tip('zhou_msg', e.msg || '发布失败，请稍后重试', 'err');
    });
}