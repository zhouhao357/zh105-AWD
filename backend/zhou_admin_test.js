/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_admin_test.js —— 后台管理接口临时自测脚本（测试后可删除）
 */

'use strict';

const BASE = 'http://127.0.0.1:8105';

async function zhou_req(zhou_method, zhou_path, zhou_body, zhou_token) {
    const zhou_opt = { method: zhou_method, headers: {} };
    if (zhou_token) {
        zhou_opt.headers.Authorization = 'Bearer ' + zhou_token;
    }
    if (zhou_body !== undefined && zhou_body !== null) {
        zhou_opt.headers['Content-Type'] = 'application/json';
        zhou_opt.body = JSON.stringify(zhou_body);
    }
    try {
        const zhou_r = await fetch(BASE + zhou_path, zhou_opt);
        return await zhou_r.json();
    } catch (e) {
        return { code: -1, msg: '请求失败：' + e.message, data: null };
    }
}

(async function () {
    let j = await zhou_req('POST', '/api/user/login', { zhou_username: 'zhou01', zhou_password: '123456' });
    console.log('[0] 前台登录 ->', j.code, 'role=' + (j.data && j.data.zhou_user && j.data.zhou_user.zhou_role));

    j = await zhou_req('GET', '/api/admin/stats');
    console.log('[1] 无 Token 访问 stats ->', j.code, j.msg);

    j = await zhou_req('POST', '/api/admin/login', { zhou_username: 'zhouadmin', zhou_password: 'wrongpwd' });
    console.log('[2] 错误密码登录 ->', j.code, j.msg);

    j = await zhou_req('POST', '/api/admin/login', { zhou_username: 'zhou03', zhou_password: '123456' });
    console.log('[3] 普通用户登录 ->', j.code, j.msg);

    j = await zhou_req('POST', '/api/admin/login', { zhou_username: 'zhouadmin', zhou_password: '123456' });
    console.log('[4] 管理员登录 ->', j.code, j.msg);
    if (j.code !== 0) {
        console.log('管理员登录失败，终止测试');
        return;
    }
    const zhou_token = j.data.zhou_token;

    j = await zhou_req('GET', '/api/admin/profile', null, zhou_token);
    console.log('[5] profile ->', j.code, JSON.stringify(j.data));
    const zhou_me = j.data.zhou_admin;

    j = await zhou_req('GET', '/api/admin/stats', null, zhou_token);
    const zhou_d = j.data || {};
    console.log('[6] stats ->', j.code, '用户', zhou_d.zhou_user_count, '商品', zhou_d.zhou_goods_count,
        '订单', zhou_d.zhou_order_count, '金额', zhou_d.zhou_total_amount, '会话', zhou_d.zhou_session_count,
        '向量', zhou_d.zhou_kb_vector_count);

    const zhou_charts = ['/api/admin/chart/orders?zhou_days=7', '/api/admin/chart/category', '/api/admin/chart/rating'];
    for (const zhou_p of zhou_charts) {
        j = await zhou_req('GET', zhou_p, null, zhou_token);
        console.log('[7]', zhou_p, '->', j.code, JSON.stringify(j.data).slice(0, 150));
    }

    const zhou_mods = ['goods', 'users', 'orders', 'comments', 'categories', 'notices', 'kb', 'sessions', 'logs'];
    for (const zhou_m of zhou_mods) {
        j = await zhou_req('GET', '/api/admin/' + zhou_m + '?zhou_page=1&zhou_size=5', null, zhou_token);
        const zhou_rows = (j.data && j.data.zhou_list) ? j.data.zhou_list.length : 0;
        console.log('[8]', zhou_m, '->', j.code, 'total=' + (j.data && j.data.zhou_total), 'rows=' + zhou_rows);
    }

    j = await zhou_req('GET', '/api/admin/stats', null, 'ZmFrZXRva2Vu.ZmFrZXNpZw');
    console.log('[9] 伪造 Token ->', j.code, j.msg);

    j = await zhou_req('GET', '/api/admin/goods?zhou_page=1&zhou_size=1', null, zhou_token);
    if (j.code === 0 && j.data.zhou_list.length) {
        const zhou_g = j.data.zhou_list[0];
        const zhou_old_stock = zhou_g.zhou_stock;
        j = await zhou_req('PUT', '/api/admin/goods/' + zhou_g.zhou_id, { zhou_stock: zhou_old_stock + 1 }, zhou_token);
        console.log('[10] 修改商品库存 ->', j.code, j.msg);
        j = await zhou_req('PUT', '/api/admin/goods/' + zhou_g.zhou_id, { zhou_stock: zhou_old_stock }, zhou_token);
        console.log('[11] 还原商品库存 ->', j.code, j.msg);
        j = await zhou_req('PUT', '/api/admin/goods/' + zhou_g.zhou_id, { zhou_price: -5 }, zhou_token);
        console.log('[12] 非法价格 ->', j.code, j.msg);
    }

    j = await zhou_req('PUT', '/api/admin/users/' + zhou_me.zhou_user_id, { zhou_role: '用户' }, zhou_token);
    console.log('[13] 修改自己角色 ->', j.code, j.msg);

    j = await zhou_req('DELETE', '/api/admin/users/' + zhou_me.zhou_user_id, null, zhou_token);
    console.log('[14] 删除自己 ->', j.code, j.msg);

    j = await zhou_req('GET', '/api/admin/goods?zhou_keyword=' + encodeURIComponent('书'), null, zhou_token);
    console.log('[15] 关键词搜索商品 ->', j.code, 'total=' + (j.data && j.data.zhou_total));

    j = await zhou_req('POST', '/api/admin/categories', { zhou_cate_name: '测试分类' + Date.now() }, zhou_token);
    console.log('[16] 新增分类 ->', j.code, j.msg, j.data && j.data.zhou_id);
    if (j.code === 0) {
        const zhou_cid = j.data.zhou_id;
        j = await zhou_req('PUT', '/api/admin/categories/' + zhou_cid, { zhou_cate_desc: '测试用' }, zhou_token);
        console.log('[17] 修改分类 ->', j.code, j.msg);
        j = await zhou_req('DELETE', '/api/admin/categories/' + zhou_cid, null, zhou_token);
        console.log('[18] 删除分类 ->', j.code, j.msg);
    }

    j = await zhou_req('POST', '/api/admin/notices', { zhou_title: '测试公告' + Date.now(), zhou_content: '自动化测试' }, zhou_token);
    console.log('[19] 发布公告 ->', j.code, j.msg, j.data && j.data.zhou_id);
    if (j.code === 0) {
        const zhou_nid = j.data.zhou_id;
        j = await zhou_req('DELETE', '/api/admin/notices/' + zhou_nid, null, zhou_token);
        console.log('[20] 删除公告 ->', j.code, j.msg);
    }

    j = await zhou_req('GET', '/api/admin/logs?zhou_page=1&zhou_size=5', null, zhou_token);
    console.log('[21] 操作日志 ->', j.code, 'total=' + (j.data && j.data.zhou_total),
        j.data && j.data.zhou_list && j.data.zhou_list[0] ? j.data.zhou_list[0].zhou_action : '');
})();
