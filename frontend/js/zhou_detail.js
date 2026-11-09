/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_detail.js —— 商品详情页逻辑（文件名含 detail，按规则不加入首页入口）
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('goods');
    /* 购买 / 收藏 / 私信按钮由 zhou_bind_detail 在数据渲染后动态绑定 */
    zhou_load_detail();
});

/** 读取地址栏参数 */
function zhou_get_query() {
    var zhou_params = new URLSearchParams(window.location.search);
    return {
        zhou_id: Number(zhou_params.get('zhou_id') || 0)
    };
}

/** 加载商品详情 */
function zhou_load_detail() {
    var zhou_q = zhou_get_query();
    if (!zhou_q.zhou_id) {
        document.getElementById('zhou_detail').innerHTML = '<div class="zhou_empty">缺少商品编号参数</div>';
        return;
    }
    zhou_request('/goods/' + zhou_q.zhou_id, 'GET').then(function (res) {
        console.log('[详情页] 商品数据：', res);
        var zhou_g = res.data.zhou_goods;
        var zhou_cate = zhou_g.zhou_cate_name || '其他';
        document.getElementById('zhou_detail').innerHTML =
            '<div class="zhou_row" style="align-items:flex-start;gap:20px">' +
            '<div style="flex:0 0 300px">' +
            '<div class="zhou_cover" style="height:210px;border-radius:12px;background:' + zhou_cover_bg(zhou_cate.slice(0, 2), zhou_g.zhou_goods_id) + '">' + zhou_cate.slice(0, 2) + '</div>' +
            '</div>' +
            '<div style="flex:1;min-width:260px">' +
            '<h2 style="font-size:20px;margin-bottom:6px">' + zhou_g.zhou_title + '</h2>' +
            '<div style="margin-bottom:10px"><span class="zhou_tag">' + zhou_cate + '</span>' +
            '<span class="zhou_tag zhou_tag_gray">' + zhou_g.zhou_condition + '</span>' +
            '<span class="zhou_tag zhou_tag_green">' + zhou_g.zhou_status + '</span></div>' +
            '<div class="zhou_price" style="margin-bottom:12px">￥' + zhou_money(zhou_g.zhou_price) +
            (zhou_g.zhou_original_price > zhou_g.zhou_price ? '<small>原价 ￥' + zhou_money(zhou_g.zhou_original_price) + '</small>' : '') + '</div>' +
            '<p style="color:#475569;margin-bottom:12px">' + (zhou_g.zhou_description || '卖家很懒，没有写描述。') + '</p>' +
            '<table class="zhou_table" style="margin-bottom:14px">' +
            '<tr><td style="width:90px;color:#94a3b8">卖家</td><td>' + (zhou_g.zhou_nickname || '') + '（' + (zhou_g.zhou_college || '') + '）</td></tr>' +
            '<tr><td style="color:#94a3b8">联系电话</td><td>' + (zhou_g.zhou_phone || '未填写') + '</td></tr>' +
            '<tr><td style="color:#94a3b8">交易地点</td><td>' + (zhou_g.zhou_trade_place || '待协商') + '</td></tr>' +
            '<tr><td style="color:#94a3b8">发布时间</td><td>' + zhou_time(zhou_g.zhou_created_at) + '</td></tr>' +
            '<tr><td style="color:#94a3b8">浏览次数</td><td>' + zhou_g.zhou_view_count + ' 次</td></tr>' +
            '</table>' +
            '<div class="zhou_row">' +
            '<button class="zhou_btn zhou_btn_primary" id="zhou_buy_btn">我要购买</button>' +
            '<button class="zhou_btn" id="zhou_fav_btn">收藏商品</button>' +
            '<button class="zhou_btn zhou_btn_ghost" id="zhou_msg_btn">联系卖家</button>' +
            '</div></div></div>';

        zhou_bind_detail(res.data.zhou_comments, zhou_g);
    }).catch(function (e) {
        console.error('[详情页] 加载失败：', e);
        document.getElementById('zhou_detail').innerHTML = '<div class="zhou_empty">' + (e.msg || '商品不存在') + '</div>';
    });
}
/** 渲染评价列表并绑定按钮事件 */
function zhou_bind_detail(zhou_comments, zhou_g) {
    var zhou_html = zhou_comments.length
        ? zhou_comments.map(function (zhou_c) {
            var zhou_stars = '';
            for (var zhou_i = 0; zhou_i < zhou_c.zhou_rating; zhou_i++) { zhou_stars += '★'; }
            return '<div class="zhou_card" style="box-shadow:none;margin-bottom:10px">' +
                '<div style="font-size:13px"><b>' + (zhou_c.zhou_nickname || '') + '</b>' +
                '<span style="color:#f59e0b;margin-left:8px">' + zhou_stars + '</span>' +
                '<span style="color:#94a3b8;float:right">' + zhou_time(zhou_c.zhou_created_at) + '</span></div>' +
                '<div style="margin-top:4px;color:#475569">' + (zhou_c.zhou_content || '') + '</div>' +
                (zhou_c.zhou_reply ? '<div style="margin-top:6px;font-size:12.5px;color:#4f46e5">卖家回复：' + zhou_c.zhou_reply + '</div>' : '') +
                '</div>';
        }).join('')
        : '<div class="zhou_empty">还没有人评价这件商品</div>';
    document.getElementById('zhou_comment').innerHTML = zhou_html;

    document.getElementById('zhou_buy_btn').addEventListener('click', function () { zhou_buy(zhou_g); });
    document.getElementById('zhou_fav_btn').addEventListener('click', function () { zhou_favorite(zhou_g); });
    document.getElementById('zhou_msg_btn').addEventListener('click', function () { zhou_send_message(zhou_g); });
}

/** 下单购买 */
function zhou_buy(zhou_g) {
    var zhou_user = zhou_get_login_user();
    if (!zhou_user) {
        zhou_tip('zhou_msg', '请先登录后再下单', 'err');
        setTimeout(function () { window.location.href = 'login.html'; }, 1000);
        return;
    }
    zhou_request('/order', 'POST', {
        zhou_goods_id: zhou_g.zhou_goods_id,
        zhou_buyer_id: zhou_user.zhou_user_id,
        zhou_quantity: 1,
        zhou_remark: '当面交易'
    }).then(function (res) {
        console.log('[详情页] 下单成功：', res);
        zhou_tip('zhou_msg', res.msg + '，订单号：' + res.data.zhou_order_no, 'ok');
    }).catch(function (e) {
        console.error('[详情页] 下单失败：', e);
        zhou_tip('zhou_msg', e.msg || '下单失败', 'err');
    });
}

/** 收藏 */
function zhou_favorite(zhou_g) {
    var zhou_user = zhou_get_login_user();
    if (!zhou_user) {
        zhou_tip('zhou_msg', '请先登录后再收藏', 'err');
        return;
    }
    zhou_request('/favorite', 'POST', {
        zhou_user_id: zhou_user.zhou_user_id,
        zhou_goods_id: zhou_g.zhou_goods_id
    }).then(function (res) {
        console.log('[详情页] 收藏结果：', res);
        zhou_tip('zhou_msg', res.msg, 'ok');
    }).catch(function (e) {
        console.error('[详情页] 收藏失败：', e);
        zhou_tip('zhou_msg', e.msg || '操作失败', 'err');
    });
}

/** 联系卖家（发私信） */
function zhou_send_message(zhou_g) {
    var zhou_user = zhou_get_login_user();
    if (!zhou_user) {
        zhou_tip('zhou_msg', '请先登录后再联系卖家', 'err');
        return;
    }
    var zhou_content = window.prompt('请输入要发送给卖家的话：');
    if (!zhou_content) { return; }
    zhou_request('/message', 'POST', {
        zhou_goods_id: zhou_g.zhou_goods_id,
        zhou_sender_id: zhou_user.zhou_user_id,
        zhou_receiver_id: zhou_g.zhou_user_id,
        zhou_content: zhou_content
    }).then(function (res) {
        console.log('[详情页] 私信发送成功：', res);
        zhou_tip('zhou_msg', res.msg, 'ok');
    }).catch(function (e) {
        console.error('[详情页] 私信发送失败：', e);
        zhou_tip('zhou_msg', e.msg || '发送失败', 'err');
    });
}