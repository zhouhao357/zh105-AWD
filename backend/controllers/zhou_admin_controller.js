/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_admin_controller.js —— 后台管理控制器
 * 覆盖：管理员登录、仪表盘统计、图表数据，以及 8 类数据库实体的管理
 *       （商品 / 用户 / 订单 / 评论 / 分类 / 公告 / 知识库 / AI 会话）+ 操作日志
 * 鉴权：除登录外，所有接口均需在路由层挂载 zhou_require_admin 中间件。
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_write_log, zhou_issue } = require('../middleware/zhou_auth');
const { zhou_md5, zhou_int, zhou_need, zhou_now } = require('../utils/zhou_util');
const zhou_db = require('../db/zhou_db');

/* ============================================================
 * 一、管理员登录
 * ============================================================ */

/** POST /api/admin/login 管理员登录 */
async function zhou_admin_login(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_username', 'zhou_password']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_user = await zhou_db.zhou_get(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_role, zhou_status' +
        ' FROM zhou_user WHERE zhou_username = ? AND zhou_password = ?',
        [String(zhou_body.zhou_username).trim(), zhou_md5(zhou_body.zhou_password)]
    );
    if (!zhou_user) {
        return zhou_fail(res, 401, '账号或密码错误');
    }
    if (zhou_user.zhou_status !== '正常') {
        return zhou_fail(res, 403, '该账号已被' + zhou_user.zhou_status + '，无法登录');
    }
    if (zhou_user.zhou_role !== '管理员') {
        return zhou_fail(res, 403, '该账号没有后台管理权限');
    }
    const zhou_issued = zhou_issue(zhou_user);
    console.log('[zhou_admin] 管理员登录成功：' + zhou_user.zhou_username + '（ID ' + zhou_user.zhou_user_id + '）');
    await zhou_write_log(
        { zhou_user_id: zhou_user.zhou_user_id, zhou_nick: zhou_user.zhou_nickname },
        '管理员登录',
        zhou_user.zhou_username,
        '登录后台管理系统'
    );
    return zhou_success(res, {
        zhou_token: zhou_issued.zhou_token,
        zhou_expires: zhou_issued.zhou_expires,
        zhou_user: {
            zhou_user_id: zhou_user.zhou_user_id,
            zhou_username: zhou_user.zhou_username,
            zhou_nickname: zhou_user.zhou_nickname,
            zhou_role: zhou_user.zhou_role
        }
    }, '管理员登录成功');
}

/** GET /api/admin/profile 当前管理员信息 */
async function zhou_admin_profile(req, res) {
    return zhou_success(res, { zhou_admin: req.zhou_admin }, '获取管理员信息成功');
}
/* ============================================================
 * 二、仪表盘统计
 * ============================================================ */

/** 统计辅助：返回单值 COUNT */
async function zhou_count(zhou_sql, zhou_params) {
    const zhou_row = await zhou_db.zhou_get(zhou_sql, zhou_params || []);
    return Number(zhou_row.zhou_n || 0);
}

/** GET /api/admin/stats 仪表盘汇总数据 */
async function zhou_admin_stats(req, res) {
    const zhou_data = {
        zhou_user_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_user'),
        zhou_admin_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_user WHERE zhou_role = \'管理员\''),
        zhou_goods_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_goods'),
        zhou_goods_on: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_goods WHERE zhou_status = \'在售\''),
        zhou_order_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_order'),
        zhou_order_done: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_order WHERE zhou_status = \'已完成\''),
        zhou_comment_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_comment'),
        zhou_category_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_category'),
        zhou_notice_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_notice'),
        zhou_session_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_session'),
        zhou_message_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_chat_message'),
        zhou_kb_doc_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_kb_doc'),
        zhou_kb_chunk_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_kb_chunk'),
        zhou_kb_vector_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_kb_vector'),
        zhou_admin_log_count: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_admin_log'),
        zhou_token_total: await zhou_count('SELECT COALESCE(SUM(zhou_token_total), 0) AS zhou_n FROM zhou_session'),
        zhou_avg_rating: await zhou_count('SELECT COALESCE(ROUND(AVG(zhou_rating), 2), 0) AS zhou_n FROM zhou_comment')
    };
    const zhou_amount = await zhou_db.zhou_get(
        'SELECT COALESCE(SUM(zhou_total_amount), 0) AS zhou_n FROM zhou_order'
    );
    zhou_data.zhou_total_amount = Number(zhou_amount.zhou_n || 0);

    zhou_data.zhou_todo = {
        zhou_pending_order: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_order WHERE zhou_status = \'待付款\''),
        zhou_shipped_order: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_order WHERE zhou_status = \'待收货\''),
        zhou_off_shelf: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_goods WHERE zhou_status <> \'在售\''),
        zhou_banned_user: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_user WHERE zhou_status <> \'正常\''),
        zhou_low_comment: await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_comment WHERE zhou_rating <= 2')
    };

    console.log('[zhou_admin] 仪表盘统计：', zhou_data);
    return zhou_success(res, zhou_data, '获取仪表盘统计成功');
}

/** GET /api/admin/chart/orders 近 N 天订单量趋势 */
async function zhou_admin_chart_orders(req, res) {
    const zhou_days = Math.min(30, Math.max(3, zhou_int(req.query.zhou_days, 7)));
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT DATE(zhou_created_at) AS zhou_day, COUNT(*) AS zhou_n,' +
        ' COALESCE(SUM(zhou_total_amount), 0) AS zhou_amount FROM zhou_order' +
        ' WHERE zhou_created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)' +
        ' GROUP BY DATE(zhou_created_at) ORDER BY zhou_day',
        [zhou_days]
    );
    const zhou_map = {};
    zhou_rows.forEach(function (r) { zhou_map[r.zhou_day] = r; });
    const zhou_list = [];
    for (let zhou_i = zhou_days - 1; zhou_i >= 0; zhou_i--) {
        const zhou_d = new Date();
        zhou_d.setDate(zhou_d.getDate() - zhou_i);
        const zhou_key = zhou_d.toISOString().slice(0, 10);
        const zhou_hit = zhou_map[zhou_key];
        zhou_list.push({
            zhou_day: zhou_key,
            zhou_count: zhou_hit ? Number(zhou_hit.zhou_n) : 0,
            zhou_amount: zhou_hit ? Number(zhou_hit.zhou_amount) : 0
        });
    }
    return zhou_success(res, { zhou_list: zhou_list, zhou_days: zhou_days }, '获取订单趋势成功');
}

/** GET /api/admin/chart/category 商品分类分布 */
async function zhou_admin_chart_category(req, res) {
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT c.zhou_cate_name AS zhou_name, COUNT(g.zhou_goods_id) AS zhou_n,' +
        ' COALESCE(ROUND(AVG(g.zhou_price), 2), 0) AS zhou_avg_price' +
        ' FROM zhou_category c LEFT JOIN zhou_goods g ON g.zhou_category_id = c.zhou_category_id' +
        ' GROUP BY c.zhou_category_id, c.zhou_cate_name ORDER BY zhou_n DESC'
    );
    return zhou_success(res, {
        zhou_list: zhou_rows.map(function (r) {
            return {
                zhou_name: r.zhou_name,
                zhou_count: Number(r.zhou_n),
                zhou_avg_price: Number(r.zhou_avg_price)
            };
        })
    }, '获取分类分布成功');
}

/** GET /api/admin/chart/rating 评价评分分布 */
async function zhou_admin_chart_rating(req, res) {
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT zhou_rating AS zhou_score, COUNT(*) AS zhou_n FROM zhou_comment' +
        ' GROUP BY zhou_rating ORDER BY zhou_rating'
    );
    return zhou_success(res, {
        zhou_list: zhou_rows.map(function (r) {
            return { zhou_score: Number(r.zhou_score), zhou_count: Number(r.zhou_n) };
        })
    }, '获取评分分布成功');
}
/* ============================================================
 * 三、实体管理（配置驱动 + 通用分页）
 * ============================================================ */

/** 通用分页参数 */
function zhou_page_param(req) {
    return {
        zhou_page: Math.max(1, zhou_int(req.query.zhou_page, 1)),
        zhou_size: Math.min(100, Math.max(5, zhou_int(req.query.zhou_size, 10)))
    };
}

/** 关键词 LIKE 条件拼装（字段名来自硬编码配置，非用户输入） */
function zhou_like(zhou_fields, zhou_keyword) {
    if (!zhou_keyword || !zhou_fields.length) {
        return { zhou_sql: '', zhou_params: [] };
    }
    return {
        zhou_sql: zhou_fields.map(function (f) { return f + ' LIKE ?'; }).join(' OR '),
        zhou_params: zhou_fields.map(function () { return '%' + zhou_keyword + '%'; })
    };
}

/* ---------- 商品管理 ---------- */

/** GET /api/admin/goods 商品列表 */
async function zhou_admin_goods_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_kw = String(req.query.zhou_keyword || '').trim();
    const zhou_status = String(req.query.zhou_status || '').trim();
    const zhou_like_res = zhou_like(['g.zhou_title', 'g.zhou_description'], zhou_kw);
    const zhou_where = [];
    const zhou_params = [];
    if (zhou_like_res.zhou_sql) {
        zhou_where.push('(' + zhou_like_res.zhou_sql + ')');
        zhou_params.push.apply(zhou_params, zhou_like_res.zhou_params);
    }
    if (zhou_status) {
        zhou_where.push('g.zhou_status = ?');
        zhou_params.push(zhou_status);
    }
    const zhou_where_sql = zhou_where.length ? ' WHERE ' + zhou_where.join(' AND ') : '';
    const zhou_from = ' FROM zhou_goods g' +
        ' LEFT JOIN zhou_user u ON u.zhou_user_id = g.zhou_user_id' +
        ' LEFT JOIN zhou_category c ON c.zhou_category_id = g.zhou_category_id' + zhou_where_sql;

    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n' + zhou_from, zhou_params);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT g.zhou_goods_id AS zhou_id, g.zhou_title, g.zhou_price, g.zhou_original_price,' +
        ' g.zhou_stock, g.zhou_condition, g.zhou_status, g.zhou_view_count, g.zhou_created_at,' +
        ' g.zhou_user_id, u.zhou_nickname AS zhou_seller, c.zhou_cate_name AS zhou_cate' +
        zhou_from + ' ORDER BY g.zhou_created_at DESC LIMIT ? OFFSET ?',
        zhou_params.concat([zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size])
    );
    return zhou_success(res, {
        zhou_list: zhou_rows.map(function (r) {
            r.zhou_price = Number(r.zhou_price);
            r.zhou_original_price = r.zhou_original_price === null ? null : Number(r.zhou_original_price);
            return r;
        }),
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取商品列表成功');
}

/** PUT /api/admin/goods/:id 修改商品（标题 / 价格 / 状态 / 库存） */
async function zhou_admin_goods_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_goods_id, zhou_title, zhou_price, zhou_status FROM zhou_goods WHERE zhou_goods_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '商品不存在：' + zhou_id);
    }
    const zhou_fields = [];
    const zhou_values = [];
    if (zhou_body.zhou_title !== undefined) {
        if (!String(zhou_body.zhou_title).trim()) {
            return zhou_fail(res, 400, '商品标题不能为空');
        }
        zhou_fields.push('zhou_title = ?');
        zhou_values.push(String(zhou_body.zhou_title).trim());
    }
    if (zhou_body.zhou_price !== undefined) {
        const zhou_price = Number(zhou_body.zhou_price);
        if (isNaN(zhou_price) || zhou_price <= 0) {
            return zhou_fail(res, 400, '商品价格必须是大于 0 的数字');
        }
        zhou_fields.push('zhou_price = ?');
        zhou_values.push(zhou_price.toFixed(2));
    }
    if (zhou_body.zhou_stock !== undefined) {
        const zhou_stock = zhou_int(zhou_body.zhou_stock, -1);
        if (zhou_stock < 0) {
            return zhou_fail(res, 400, '库存不能为负数');
        }
        zhou_fields.push('zhou_stock = ?');
        zhou_values.push(zhou_stock);
    }
    if (zhou_body.zhou_status !== undefined) {
        const zhou_allow = ['在售', '已下架', '已售出', '已锁定'];
        if (zhou_allow.indexOf(String(zhou_body.zhou_status)) < 0) {
            return zhou_fail(res, 400, '商品状态只能是：在售 / 已下架 / 已售出 / 已锁定');
        }
        zhou_fields.push('zhou_status = ?');
        zhou_values.push(String(zhou_body.zhou_status));
    }
    if (!zhou_fields.length) {
        return zhou_fail(res, 400, '没有需要修改的字段');
    }
    zhou_values.push(zhou_id);
    await zhou_db.zhou_run(
        'UPDATE zhou_goods SET ' + zhou_fields.join(', ') + ' WHERE zhou_goods_id = ?',
        zhou_values
    );
    await zhou_write_log(req.zhou_admin, '商品修改', '#' + zhou_id + ' ' + zhou_old.zhou_title,
        '修改字段：' + zhou_fields.map(function (f) { return f.split(' ')[0]; }).join(', '));
    return zhou_success(res, { zhou_id: zhou_id }, '商品修改成功');
}

/** DELETE /api/admin/goods/:id 删除商品 */
async function zhou_admin_goods_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_goods_id, zhou_title FROM zhou_goods WHERE zhou_goods_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '商品不存在：' + zhou_id);
    }
    try {
        await zhou_db.zhou_run('DELETE FROM zhou_goods WHERE zhou_goods_id = ?', [zhou_id]);
    } catch (e) {
        return zhou_fail(res, 409, '该商品已被订单或收藏引用，无法删除（可改为「已下架」）');
    }
    await zhou_write_log(req.zhou_admin, '商品删除', '#' + zhou_id + ' ' + zhou_old.zhou_title, '管理员删除商品');
    return zhou_success(res, { zhou_id: zhou_id }, '商品删除成功');
}
/* ---------- 用户管理 ---------- */

/** GET /api/admin/users 用户列表 */
async function zhou_admin_users_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_kw = String(req.query.zhou_keyword || '').trim();
    const zhou_role = String(req.query.zhou_role || '').trim();
    const zhou_like_res = zhou_like(['u.zhou_username', 'u.zhou_nickname', 'u.zhou_college'], zhou_kw);
    const zhou_where = [];
    const zhou_params = [];
    if (zhou_like_res.zhou_sql) {
        zhou_where.push('(' + zhou_like_res.zhou_sql + ')');
        zhou_params.push.apply(zhou_params, zhou_like_res.zhou_params);
    }
    if (zhou_role) {
        zhou_where.push('u.zhou_role = ?');
        zhou_params.push(zhou_role);
    }
    const zhou_where_sql = zhou_where.length ? ' WHERE ' + zhou_where.join(' AND ') : '';
    const zhou_from = ' FROM zhou_user u' + zhou_where_sql;

    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n' + zhou_from, zhou_params);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT u.zhou_user_id AS zhou_id, u.zhou_username, u.zhou_nickname, u.zhou_college,' +
        ' u.zhou_phone, u.zhou_balance, u.zhou_credit, u.zhou_status, u.zhou_role, u.zhou_created_at,' +
        ' (SELECT COUNT(*) FROM zhou_goods g WHERE g.zhou_user_id = u.zhou_user_id) AS zhou_goods_count,' +
        ' (SELECT COUNT(*) FROM zhou_order o WHERE o.zhou_buyer_id = u.zhou_user_id) AS zhou_order_count' +
        zhou_from + ' ORDER BY u.zhou_user_id ASC LIMIT ? OFFSET ?',
        zhou_params.concat([zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size])
    );
    return zhou_success(res, {
        zhou_list: zhou_rows.map(function (r) {
            r.zhou_balance = Number(r.zhou_balance);
            return r;
        }),
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取用户列表成功');
}

/** PUT /api/admin/users/:id 修改用户（角色 / 状态 / 信用分） */
async function zhou_admin_users_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_role, zhou_status FROM zhou_user WHERE zhou_user_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '用户不存在：' + zhou_id);
    }
    /* 不允许把自己降权或封禁，避免管理员把自己锁在门外 */
    if (zhou_id === Number(req.zhou_admin.zhou_user_id) &&
        (zhou_body.zhou_role !== undefined || zhou_body.zhou_status !== undefined)) {
        return zhou_fail(res, 400, '不能修改当前登录管理员自己的角色或状态');
    }
    const zhou_fields = [];
    const zhou_values = [];
    if (zhou_body.zhou_role !== undefined) {
        const zhou_allow = ['用户', '管理员'];
        if (zhou_allow.indexOf(String(zhou_body.zhou_role)) < 0) {
            return zhou_fail(res, 400, '角色只能是：用户 / 管理员');
        }
        zhou_fields.push('zhou_role = ?');
        zhou_values.push(String(zhou_body.zhou_role));
    }
    if (zhou_body.zhou_status !== undefined) {
        const zhou_allow = ['正常', '封禁'];
        if (zhou_allow.indexOf(String(zhou_body.zhou_status)) < 0) {
            return zhou_fail(res, 400, '账号状态只能是：正常 / 封禁');
        }
        zhou_fields.push('zhou_status = ?');
        zhou_values.push(String(zhou_body.zhou_status));
    }
    if (zhou_body.zhou_credit !== undefined) {
        const zhou_credit = zhou_int(zhou_body.zhou_credit, -1);
        if (zhou_credit < 0 || zhou_credit > 100) {
            return zhou_fail(res, 400, '信用分必须是 0 ~ 100 的整数');
        }
        zhou_fields.push('zhou_credit = ?');
        zhou_values.push(zhou_credit);
    }
    if (!zhou_fields.length) {
        return zhou_fail(res, 400, '没有需要修改的字段');
    }
    zhou_values.push(zhou_id);
    await zhou_db.zhou_run(
        'UPDATE zhou_user SET ' + zhou_fields.join(', ') + ' WHERE zhou_user_id = ?',
        zhou_values
    );
    await zhou_write_log(req.zhou_admin, '用户修改', '#' + zhou_id + ' ' + zhou_old.zhou_username,
        '修改字段：' + zhou_fields.map(function (f) { return f.split(' ')[0]; }).join(', '));
    return zhou_success(res, { zhou_id: zhou_id }, '用户修改成功');
}

/** DELETE /api/admin/users/:id 删除用户 */
async function zhou_admin_users_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    if (zhou_id === Number(req.zhou_admin.zhou_user_id)) {
        return zhou_fail(res, 400, '不能删除当前登录的管理员账号');
    }
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_user_id, zhou_username FROM zhou_user WHERE zhou_user_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '用户不存在：' + zhou_id);
    }
    try {
        await zhou_db.zhou_run('DELETE FROM zhou_user WHERE zhou_user_id = ?', [zhou_id]);
    } catch (e) {
        return zhou_fail(res, 409, '该用户存在关联的商品或订单，无法删除（可改为「封禁」）');
    }
    await zhou_write_log(req.zhou_admin, '用户删除', '#' + zhou_id + ' ' + zhou_old.zhou_username, '管理员删除用户');
    return zhou_success(res, { zhou_id: zhou_id }, '用户删除成功');
}
/* ---------- 订单管理 ---------- */

/** GET /api/admin/orders 订单列表 */
async function zhou_admin_orders_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_kw = String(req.query.zhou_keyword || '').trim();
    const zhou_status = String(req.query.zhou_status || '').trim();
    const zhou_like_res = zhou_like(['o.zhou_order_no'], zhou_kw);
    const zhou_where = [];
    const zhou_params = [];
    if (zhou_like_res.zhou_sql) {
        zhou_where.push('(' + zhou_like_res.zhou_sql + ')');
        zhou_params.push.apply(zhou_params, zhou_like_res.zhou_params);
    }
    if (zhou_status) {
        zhou_where.push('o.zhou_status = ?');
        zhou_params.push(zhou_status);
    }
    const zhou_where_sql = zhou_where.length ? ' WHERE ' + zhou_where.join(' AND ') : '';
    const zhou_from = ' FROM zhou_order o' +
        ' LEFT JOIN zhou_goods g ON g.zhou_goods_id = o.zhou_goods_id' +
        ' LEFT JOIN zhou_user b ON b.zhou_user_id = o.zhou_buyer_id' +
        ' LEFT JOIN zhou_user s ON s.zhou_user_id = o.zhou_seller_id' + zhou_where_sql;

    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n' + zhou_from, zhou_params);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT o.zhou_order_id AS zhou_id, o.zhou_order_no, o.zhou_goods_id, o.zhou_price,' +
        ' o.zhou_quantity, o.zhou_total_amount, o.zhou_status, o.zhou_remark, o.zhou_created_at,' +
        ' g.zhou_title AS zhou_goods_title, b.zhou_nickname AS zhou_buyer, s.zhou_nickname AS zhou_seller' +
        zhou_from + ' ORDER BY o.zhou_created_at DESC LIMIT ? OFFSET ?',
        zhou_params.concat([zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size])
    );
    return zhou_success(res, {
        zhou_list: zhou_rows.map(function (r) {
            r.zhou_price = Number(r.zhou_price);
            r.zhou_total_amount = Number(r.zhou_total_amount);
            return r;
        }),
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取订单列表成功');
}

/** PUT /api/admin/orders/:id 修改订单状态 */
async function zhou_admin_orders_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_allow = ['待付款', '待发货', '待收货', '已完成', '已取消'];
    if (!zhou_allow.indexOf(String(zhou_body.zhou_status))) {
        return zhou_fail(res, 400, '订单状态只能是：' + zhou_allow.join(' / '));
    }
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_order_id, zhou_order_no, zhou_status FROM zhou_order WHERE zhou_order_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '订单不存在：' + zhou_id);
    }
    await zhou_db.zhou_run(
        'UPDATE zhou_order SET zhou_status = ?, zhou_updated_at = ? WHERE zhou_order_id = ?',
        [String(zhou_body.zhou_status), zhou_now(), zhou_id]
    );
    await zhou_write_log(req.zhou_admin, '订单状态变更', zhou_old.zhou_order_no,
        zhou_old.zhou_status + ' → ' + zhou_body.zhou_status);
    return zhou_success(res, { zhou_id: zhou_id }, '订单状态修改成功');
}

/** DELETE /api/admin/orders/:id 删除订单 */
async function zhou_admin_orders_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_order_id, zhou_order_no FROM zhou_order WHERE zhou_order_id = ?',
        [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '订单不存在：' + zhou_id);
    }
    await zhou_db.zhou_run('DELETE FROM zhou_order WHERE zhou_order_id = ?', [zhou_id]);
    await zhou_write_log(req.zhou_admin, '订单删除', zhou_old.zhou_order_no, '管理员删除订单');
    return zhou_success(res, { zhou_id: zhou_id }, '订单删除成功');
}

/* ---------- 评论管理 ---------- */

/** GET /api/admin/comments 评论列表 */
async function zhou_admin_comments_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_kw = String(req.query.zhou_keyword || '').trim();
    const zhou_like_res = zhou_like(['cm.zhou_content'], zhou_kw);
    const zhou_where = zhou_like_res.zhou_sql ? ' WHERE (' + zhou_like_res.zhou_sql + ')' : '';
    const zhou_from = ' FROM zhou_comment cm' +
        ' LEFT JOIN zhou_goods g ON g.zhou_goods_id = cm.zhou_goods_id' +
        ' LEFT JOIN zhou_user u ON u.zhou_user_id = cm.zhou_user_id' + zhou_where;

    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n' + zhou_from, zhou_like_res.zhou_params);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT cm.zhou_comment_id AS zhou_id, cm.zhou_rating, cm.zhou_content, cm.zhou_reply,' +
        ' cm.zhou_created_at, g.zhou_title AS zhou_goods_title, u.zhou_nickname AS zhou_user' +
        zhou_from + ' ORDER BY cm.zhou_created_at DESC LIMIT ? OFFSET ?',
        zhou_like_res.zhou_params.concat([zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size])
    );
    return zhou_success(res, {
        zhou_list: zhou_rows,
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取评论列表成功');
}

/** PUT /api/admin/comments/:id 回复评论 */
async function zhou_admin_comments_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_comment_id FROM zhou_comment WHERE zhou_comment_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '评论不存在：' + zhou_id);
    }
    await zhou_db.zhou_run(
        'UPDATE zhou_comment SET zhou_reply = ? WHERE zhou_comment_id = ?',
        [String(zhou_body.zhou_reply || ''), zhou_id]
    );
    await zhou_write_log(req.zhou_admin, '评论回复', '#' + zhou_id, '管理员回复评论');
    return zhou_success(res, { zhou_id: zhou_id }, '评论回复成功');
}

/** DELETE /api/admin/comments/:id 删除评论 */
async function zhou_admin_comments_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_comment_id FROM zhou_comment WHERE zhou_comment_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '评论不存在：' + zhou_id);
    }
    await zhou_db.zhou_run('DELETE FROM zhou_comment WHERE zhou_comment_id = ?', [zhou_id]);
    await zhou_write_log(req.zhou_admin, '评论删除', '#' + zhou_id, '管理员删除评论');
    return zhou_success(res, { zhou_id: zhou_id }, '评论删除成功');
}
/* ---------- 分类管理 ---------- */

/** GET /api/admin/categories 分类列表 */
async function zhou_admin_categories_list(req, res) {
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT c.zhou_category_id AS zhou_id, c.zhou_cate_name, c.zhou_cate_desc, c.zhou_sort_order,' +
        ' c.zhou_created_at, (SELECT COUNT(*) FROM zhou_goods g WHERE g.zhou_category_id = c.zhou_category_id) AS zhou_goods_count' +
        ' FROM zhou_category c ORDER BY c.zhou_sort_order ASC, c.zhou_category_id ASC'
    );
    return zhou_success(res, { zhou_list: zhou_rows, zhou_total: zhou_rows.length }, '获取分类列表成功');
}

/** POST /api/admin/categories 新增分类 */
async function zhou_admin_categories_create(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_cate_name']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_exist = await zhou_db.zhou_get(
        'SELECT zhou_category_id FROM zhou_category WHERE zhou_cate_name = ?',
        [String(zhou_body.zhou_cate_name).trim()]
    );
    if (zhou_exist) {
        return zhou_fail(res, 409, '该分类名称已存在');
    }
    const zhou_r = await zhou_db.zhou_run(
        'INSERT INTO zhou_category (zhou_cate_name, zhou_cate_desc, zhou_sort_order, zhou_created_at)' +
        ' VALUES (?, ?, ?, ?)',
        [
            String(zhou_body.zhou_cate_name).trim(),
            String(zhou_body.zhou_cate_desc || '').slice(0, 200),
            zhou_int(zhou_body.zhou_sort_order, 99),
            zhou_now()
        ]
    );
    await zhou_write_log(req.zhou_admin, '分类新增', zhou_body.zhou_cate_name, '新增商品分类');
    return zhou_success(res, { zhou_id: zhou_r.lastInsertRowid }, '分类新增成功');
}

/** PUT /api/admin/categories/:id 修改分类 */
async function zhou_admin_categories_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_category_id, zhou_cate_name FROM zhou_category WHERE zhou_category_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '分类不存在：' + zhou_id);
    }
    const zhou_fields = [];
    const zhou_values = [];
    if (zhou_body.zhou_cate_name !== undefined) {
        if (!String(zhou_body.zhou_cate_name).trim()) {
            return zhou_fail(res, 400, '分类名称不能为空');
        }
        zhou_fields.push('zhou_cate_name = ?');
        zhou_values.push(String(zhou_body.zhou_cate_name).trim());
    }
    if (zhou_body.zhou_cate_desc !== undefined) {
        zhou_fields.push('zhou_cate_desc = ?');
        zhou_values.push(String(zhou_body.zhou_cate_desc).slice(0, 200));
    }
    if (zhou_body.zhou_sort_order !== undefined) {
        zhou_fields.push('zhou_sort_order = ?');
        zhou_values.push(zhou_int(zhou_body.zhou_sort_order, 0));
    }
    if (!zhou_fields.length) {
        return zhou_fail(res, 400, '没有需要修改的字段');
    }
    zhou_values.push(zhou_id);
    await zhou_db.zhou_run(
        'UPDATE zhou_category SET ' + zhou_fields.join(', ') + ' WHERE zhou_category_id = ?',
        zhou_values
    );
    await zhou_write_log(req.zhou_admin, '分类修改', '#' + zhou_id + ' ' + zhou_old.zhou_cate_name, '修改分类信息');
    return zhou_success(res, { zhou_id: zhou_id }, '分类修改成功');
}

/** DELETE /api/admin/categories/:id 删除分类 */
async function zhou_admin_categories_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_category_id, zhou_cate_name FROM zhou_category WHERE zhou_category_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '分类不存在：' + zhou_id);
    }
    try {
        await zhou_db.zhou_run('DELETE FROM zhou_category WHERE zhou_category_id = ?', [zhou_id]);
    } catch (e) {
        return zhou_fail(res, 409, '该分类下仍有商品，无法删除');
    }
    await zhou_write_log(req.zhou_admin, '分类删除', '#' + zhou_id + ' ' + zhou_old.zhou_cate_name, '管理员删除分类');
    return zhou_success(res, { zhou_id: zhou_id }, '分类删除成功');
}
/* ---------- 公告管理 ---------- */

/** GET /api/admin/notices 公告列表 */
async function zhou_admin_notices_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT zhou_notice_id AS zhou_id, zhou_title, zhou_content, zhou_publisher, zhou_notice_type,' +
        ' zhou_created_at FROM zhou_notice ORDER BY zhou_created_at DESC LIMIT ? OFFSET ?',
        [zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size]
    );
    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_notice');
    return zhou_success(res, {
        zhou_list: zhou_rows,
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取公告列表成功');
}

/** POST /api/admin/notices 新增公告 */
async function zhou_admin_notices_create(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_title']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    const zhou_r = await zhou_db.zhou_run(
        'INSERT INTO zhou_notice (zhou_title, zhou_content, zhou_publisher, zhou_notice_type, zhou_created_at)' +
        ' VALUES (?, ?, ?, ?, ?)',
        [
            String(zhou_body.zhou_title).trim(),
            String(zhou_body.zhou_content || ''),
            String(zhou_body.zhou_publisher || req.zhou_admin.zhou_nick || '平台管理员').slice(0, 50),
            String(zhou_body.zhou_notice_type || '通知').slice(0, 20),
            zhou_now()
        ]
    );
    await zhou_write_log(req.zhou_admin, '公告发布', zhou_body.zhou_title, '发布平台公告');
    return zhou_success(res, { zhou_id: zhou_r.lastInsertRowid }, '公告发布成功');
}

/** PUT /api/admin/notices/:id 修改公告 */
async function zhou_admin_notices_update(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_body = req.body || {};
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_notice_id, zhou_title FROM zhou_notice WHERE zhou_notice_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '公告不存在：' + zhou_id);
    }
    const zhou_fields = [];
    const zhou_values = [];
    if (zhou_body.zhou_title !== undefined) {
        if (!String(zhou_body.zhou_title).trim()) {
            return zhou_fail(res, 400, '公告标题不能为空');
        }
        zhou_fields.push('zhou_title = ?');
        zhou_values.push(String(zhou_body.zhou_title).trim());
    }
    if (zhou_body.zhou_content !== undefined) {
        zhou_fields.push('zhou_content = ?');
        zhou_values.push(String(zhou_body.zhou_content));
    }
    if (zhou_body.zhou_notice_type !== undefined) {
        zhou_fields.push('zhou_notice_type = ?');
        zhou_values.push(String(zhou_body.zhou_notice_type).slice(0, 20));
    }
    if (!zhou_fields.length) {
        return zhou_fail(res, 400, '没有需要修改的字段');
    }
    zhou_values.push(zhou_id);
    await zhou_db.zhou_run(
        'UPDATE zhou_notice SET ' + zhou_fields.join(', ') + ' WHERE zhou_notice_id = ?',
        zhou_values
    );
    await zhou_write_log(req.zhou_admin, '公告修改', '#' + zhou_id + ' ' + zhou_old.zhou_title, '修改公告内容');
    return zhou_success(res, { zhou_id: zhou_id }, '公告修改成功');
}

/** DELETE /api/admin/notices/:id 删除公告 */
async function zhou_admin_notices_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_notice_id, zhou_title FROM zhou_notice WHERE zhou_notice_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '公告不存在：' + zhou_id);
    }
    await zhou_db.zhou_run('DELETE FROM zhou_notice WHERE zhou_notice_id = ?', [zhou_id]);
    await zhou_write_log(req.zhou_admin, '公告删除', '#' + zhou_id + ' ' + zhou_old.zhou_title, '管理员删除公告');
    return zhou_success(res, { zhou_id: zhou_id }, '公告删除成功');
}
/* ---------- 知识库文档管理 ---------- */

/** GET /api/admin/kb 知识库文档列表（含向量覆盖情况） */
async function zhou_admin_kb_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_kw = String(req.query.zhou_keyword || '').trim();
    const zhou_like_res = zhou_like(['d.zhou_file_name'], zhou_kw);
    const zhou_where = zhou_like_res.zhou_sql ? ' WHERE (' + zhou_like_res.zhou_sql + ')' : '';
    const zhou_from = ' FROM zhou_kb_doc d' +
        ' LEFT JOIN zhou_user u ON u.zhou_user_id = d.zhou_user_id' + zhou_where;

    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n' + zhou_from, zhou_like_res.zhou_params);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT d.zhou_doc_id AS zhou_id, d.zhou_file_name, d.zhou_file_type, d.zhou_file_size,' +
        ' d.zhou_chunk_count, d.zhou_char_count, d.zhou_status, d.zhou_created_at,' +
        ' u.zhou_nickname AS zhou_user,' +
        ' (SELECT COUNT(*) FROM zhou_kb_chunk c WHERE c.zhou_doc_id = d.zhou_doc_id) AS zhou_chunk_real,' +
        ' (SELECT COUNT(*) FROM zhou_kb_vector v WHERE v.zhou_doc_id = d.zhou_doc_id) AS zhou_vector_count' +
        zhou_from + ' ORDER BY d.zhou_created_at DESC LIMIT ? OFFSET ?',
        zhou_like_res.zhou_params.concat([zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size])
    );
    return zhou_success(res, {
        zhou_list: zhou_rows,
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取知识库文档列表成功');
}

/** DELETE /api/admin/kb/:id 删除知识库文档（切片与向量随外键级联删除） */
async function zhou_admin_kb_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_doc_id, zhou_file_name FROM zhou_kb_doc WHERE zhou_doc_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '知识库文档不存在：' + zhou_id);
    }
    await zhou_db.zhou_run('DELETE FROM zhou_kb_doc WHERE zhou_doc_id = ?', [zhou_id]);
    await zhou_write_log(req.zhou_admin, '知识库文档删除', zhou_old.zhou_file_name, '文档及其切片、向量已级联删除');
    return zhou_success(res, { zhou_id: zhou_id }, '知识库文档删除成功');
}

/* ---------- AI 会话管理 ---------- */

/** GET /api/admin/sessions AI 会话列表 */
async function zhou_admin_sessions_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT s.zhou_session_id AS zhou_id, s.zhou_title, s.zhou_model, s.zhou_summary,' +
        ' s.zhou_message_count, s.zhou_token_total, s.zhou_status, s.zhou_created_at, s.zhou_updated_at,' +
        ' u.zhou_nickname AS zhou_user' +
        ' FROM zhou_session s LEFT JOIN zhou_user u ON u.zhou_user_id = s.zhou_user_id' +
        ' ORDER BY s.zhou_updated_at DESC LIMIT ? OFFSET ?',
        [zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size]
    );
    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_session');
    return zhou_success(res, {
        zhou_list: zhou_rows,
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取会话列表成功');
}

/** DELETE /api/admin/sessions/:id 删除会话（消息随外键级联删除） */
async function zhou_admin_sessions_remove(req, res) {
    const zhou_id = zhou_int(req.params.zhou_id, 0);
    const zhou_old = await zhou_db.zhou_get(
        'SELECT zhou_session_id, zhou_title FROM zhou_session WHERE zhou_session_id = ?', [zhou_id]
    );
    if (!zhou_old) {
        return zhou_fail(res, 404, '会话不存在：' + zhou_id);
    }
    await zhou_db.zhou_run('DELETE FROM zhou_session WHERE zhou_session_id = ?', [zhou_id]);
    await zhou_write_log(req.zhou_admin, 'AI 会话清理', '#' + zhou_id + ' ' + (zhou_old.zhou_title || ''), '删除会话及消息');
    return zhou_success(res, { zhou_id: zhou_id }, '会话删除成功');
}

/* ---------- 操作日志 ---------- */

/** GET /api/admin/logs 管理员操作日志 */
async function zhou_admin_logs_list(req, res) {
    const zhou_p = zhou_page_param(req);
    const zhou_rows = await zhou_db.zhou_all(
        'SELECT zhou_log_id AS zhou_id, zhou_admin_name, zhou_action, zhou_target, zhou_detail, zhou_created_at' +
        ' FROM zhou_admin_log ORDER BY zhou_created_at DESC LIMIT ? OFFSET ?',
        [zhou_p.zhou_size, (zhou_p.zhou_page - 1) * zhou_p.zhou_size]
    );
    const zhou_total = await zhou_count('SELECT COUNT(*) AS zhou_n FROM zhou_admin_log');
    return zhou_success(res, {
        zhou_list: zhou_rows,
        zhou_total: zhou_total,
        zhou_page: zhou_p.zhou_page,
        zhou_size: zhou_p.zhou_size
    }, '获取操作日志成功');
}

module.exports = {
    zhou_admin_login,
    zhou_admin_profile,
    zhou_admin_stats,
    zhou_admin_chart_orders,
    zhou_admin_chart_category,
    zhou_admin_chart_rating,
    zhou_admin_goods_list,
    zhou_admin_goods_update,
    zhou_admin_goods_remove,
    zhou_admin_users_list,
    zhou_admin_users_update,
    zhou_admin_users_remove,
    zhou_admin_orders_list,
    zhou_admin_orders_update,
    zhou_admin_orders_remove,
    zhou_admin_comments_list,
    zhou_admin_comments_update,
    zhou_admin_comments_remove,
    zhou_admin_categories_list,
    zhou_admin_categories_create,
    zhou_admin_categories_update,
    zhou_admin_categories_remove,
    zhou_admin_notices_list,
    zhou_admin_notices_create,
    zhou_admin_notices_update,
    zhou_admin_notices_remove,
    zhou_admin_kb_list,
    zhou_admin_kb_remove,
    zhou_admin_sessions_list,
    zhou_admin_sessions_remove,
    zhou_admin_logs_list
};