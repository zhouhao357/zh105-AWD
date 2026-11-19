/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_admin.js —— 后台管理系统核心脚本
 *   1. 全局状态
 *   2. 模块配置表（菜单 / 表格列 / 编辑表单）
 *   3. 请求封装（自动携带 Token，登录失效自动跳回登录页）
 *   4. 侧边菜单渲染与模块调度
 * 依赖：js/zhou_admin_view.js（仪表盘与实体表格渲染）
 */

'use strict';

/* ============================================================
 * 一、全局状态
 * ============================================================ */

var ZHOU_ADMIN_TOKEN_KEY = 'zhou_admin_token';
var ZHOU_ADMIN_USER_KEY = 'zhou_admin_user';

var zhou_admin_state = {
    zhou_user: null,
    zhou_module: 'dashboard',
    zhou_page: 1,
    zhou_size: 10,
    zhou_keyword: '',
    zhou_filter: '',
    zhou_list: [],
    zhou_total: 0
};

/* 状态徽章配色 */
var ZHOU_ADMIN_BADGE = {
    '在售': 'ok',
    '正常': 'ok',
    '已完成': 'ok',
    '已售出': 'ok',
    '待付款': 'warn',
    '待发货': 'warn',
    '待收货': 'warn',
    '已锁定': 'warn',
    '已下架': 'warn',
    '用户': 'user',
    '管理员': 'admin',
    '已取消': 'err',
    '封禁': 'err'
};

/* ============================================================
 * 二、模块配置表
 *    每个模块 = 菜单项 + 列表接口 + 表格列 + 编辑表单
 * ============================================================ */

var ZHOU_ADMIN_MODULES = [
    {
        zhou_key: 'dashboard',
        zhou_name: '仪表盘',
        zhou_icon: '◎',
        zhou_group: '总览'
    },
    {
        zhou_key: 'goods',
        zhou_name: '商品管理',
        zhou_icon: '▣',
        zhou_group: '业务数据',
        zhou_api: '/api/admin/goods',
        zhou_filter: { zhou_param: 'zhou_status', zhou_label: '状态', zhou_options: ['在售', '已下架', '已售出', '已锁定'] },
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_title', zhou_name: '商品标题', zhou_ell: true },
            { zhou_key: 'zhou_cate', zhou_name: '分类' },
            { zhou_key: 'zhou_price', zhou_name: '价格', zhou_num: true },
            { zhou_key: 'zhou_stock', zhou_name: '库存', zhou_num: true },
            { zhou_key: 'zhou_status', zhou_name: '状态', zhou_badge: true },
            { zhou_key: 'zhou_view_count', zhou_name: '浏览', zhou_num: true },
            { zhou_key: 'zhou_created_at', zhou_name: '发布时间', zhou_time: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_title', zhou_name: '商品标题', zhou_type: 'text', zhou_required: true },
            { zhou_key: 'zhou_price', zhou_name: '价格(元)', zhou_type: 'number', zhou_required: true },
            { zhou_key: 'zhou_stock', zhou_name: '库存', zhou_type: 'number' },
            { zhou_key: 'zhou_status', zhou_name: '状态', zhou_type: 'select', zhou_options: ['在售', '已下架', '已售出', '已锁定'] }
        ]
    },
    {
        zhou_key: 'users',
        zhou_name: '用户管理',
        zhou_icon: '☺',
        zhou_group: '业务数据',
        zhou_api: '/api/admin/users',
        zhou_filter: { zhou_param: 'zhou_role', zhou_label: '角色', zhou_options: ['用户', '管理员'] },
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_username', zhou_name: '账号' },
            { zhou_key: 'zhou_nickname', zhou_name: '昵称' },
            { zhou_key: 'zhou_college', zhou_name: '学院' },
            { zhou_key: 'zhou_goods_count', zhou_name: '发布', zhou_num: true },
            { zhou_key: 'zhou_order_count', zhou_name: '购买', zhou_num: true },
            { zhou_key: 'zhou_credit', zhou_name: '信用分', zhou_num: true },
            { zhou_key: 'zhou_status', zhou_name: '状态', zhou_badge: true },
            { zhou_key: 'zhou_role', zhou_name: '角色', zhou_badge: true },
            { zhou_key: 'zhou_created_at', zhou_name: '注册时间', zhou_time: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_role', zhou_name: '角色', zhou_type: 'select', zhou_options: ['用户', '管理员'] },
            { zhou_key: 'zhou_status', zhou_name: '账号状态', zhou_type: 'select', zhou_options: ['正常', '封禁'] },
            { zhou_key: 'zhou_credit', zhou_name: '信用分(0~100)', zhou_type: 'number' }
        ]
    },
    {
        zhou_key: 'orders',
        zhou_name: '订单管理',
        zhou_icon: '≣',
        zhou_group: '业务数据',
        zhou_api: '/api/admin/orders',
        zhou_filter: { zhou_param: 'zhou_status', zhou_label: '状态', zhou_options: ['待付款', '待发货', '待收货', '已完成', '已取消'] },
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_order_no', zhou_name: '订单号', zhou_ell: true },
            { zhou_key: 'zhou_goods_title', zhou_name: '商品', zhou_ell: true },
            { zhou_key: 'zhou_buyer', zhou_name: '买家' },
            { zhou_key: 'zhou_seller', zhou_name: '卖家' },
            { zhou_key: 'zhou_total_amount', zhou_name: '金额', zhou_num: true },
            { zhou_key: 'zhou_status', zhou_name: '状态', zhou_badge: true },
            { zhou_key: 'zhou_created_at', zhou_name: '下单时间', zhou_time: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_status', zhou_name: '订单状态', zhou_type: 'select', zhou_options: ['待付款', '待发货', '待收货', '已完成', '已取消'] }
        ]
    },
    {
        zhou_key: 'comments',
        zhou_name: '评论管理',
        zhou_icon: '✎',
        zhou_group: '业务数据',
        zhou_api: '/api/admin/comments',
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_goods_title', zhou_name: '商品', zhou_ell: true },
            { zhou_key: 'zhou_user', zhou_name: '评论人' },
            { zhou_key: 'zhou_rating', zhou_name: '评分', zhou_num: true },
            { zhou_key: 'zhou_content', zhou_name: '评论内容', zhou_ell: true },
            { zhou_key: 'zhou_reply', zhou_name: '管理员回复', zhou_ell: true },
            { zhou_key: 'zhou_created_at', zhou_name: '时间', zhou_time: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_reply', zhou_name: '回复内容', zhou_type: 'textarea' }
        ]
    },
    {
        zhou_key: 'categories',
        zhou_name: '分类管理',
        zhou_icon: '≡',
        zhou_group: '平台配置',
        zhou_api: '/api/admin/categories',
        zhou_create: true,
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_cate_name', zhou_name: '分类名称' },
            { zhou_key: 'zhou_cate_desc', zhou_name: '描述', zhou_ell: true },
            { zhou_key: 'zhou_goods_count', zhou_name: '商品数', zhou_num: true },
            { zhou_key: 'zhou_sort_order', zhou_name: '排序', zhou_num: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_cate_name', zhou_name: '分类名称', zhou_type: 'text', zhou_required: true },
            { zhou_key: 'zhou_cate_desc', zhou_name: '分类描述', zhou_type: 'textarea' },
            { zhou_key: 'zhou_sort_order', zhou_name: '排序值(越小越靠前)', zhou_type: 'number' }
        ]
    },
    {
        zhou_key: 'notices',
        zhou_name: '公告管理',
        zhou_icon: '✦',
        zhou_group: '平台配置',
        zhou_api: '/api/admin/notices',
        zhou_create: true,
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_title', zhou_name: '标题', zhou_ell: true },
            { zhou_key: 'zhou_notice_type', zhou_name: '类型', zhou_badge: true },
            { zhou_key: 'zhou_publisher', zhou_name: '发布人' },
            { zhou_key: 'zhou_created_at', zhou_name: '发布时间', zhou_time: true }
        ],
        zhou_form: [
            { zhou_key: 'zhou_title', zhou_name: '公告标题', zhou_type: 'text', zhou_required: true },
            { zhou_key: 'zhou_notice_type', zhou_name: '公告类型', zhou_type: 'select', zhou_options: ['通知', '公告', '活动'] },
            { zhou_key: 'zhou_content', zhou_name: '公告内容', zhou_type: 'textarea' }
        ]
    },
    {
        zhou_key: 'kb',
        zhou_name: '知识库文档',
        zhou_icon: '▤',
        zhou_group: 'AI 中心',
        zhou_api: '/api/admin/kb',
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_file_name', zhou_name: '文件名', zhou_ell: true },
            { zhou_key: 'zhou_file_type', zhou_name: '类型' },
            { zhou_key: 'zhou_file_size', zhou_name: '大小(KB)', zhou_num: true },
            { zhou_key: 'zhou_chunk_count', zhou_name: '切片数', zhou_num: true },
            { zhou_key: 'zhou_vector_count', zhou_name: '向量数', zhou_num: true },
            { zhou_key: 'zhou_user', zhou_name: '上传者' },
            { zhou_key: 'zhou_created_at', zhou_name: '上传时间', zhou_time: true }
        ]
    },
    {
        zhou_key: 'sessions',
        zhou_name: 'AI 会话',
        zhou_icon: '◈',
        zhou_group: 'AI 中心',
        zhou_api: '/api/admin/sessions',
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_title', zhou_name: '会话标题', zhou_ell: true },
            { zhou_key: 'zhou_model', zhou_name: '模型' },
            { zhou_key: 'zhou_user', zhou_name: '用户' },
            { zhou_key: 'zhou_message_count', zhou_name: '消息数', zhou_num: true },
            { zhou_key: 'zhou_token_total', zhou_name: 'Token', zhou_num: true },
            { zhou_key: 'zhou_updated_at', zhou_name: '更新时间', zhou_time: true }
        ]
    },
    {
        zhou_key: 'logs',
        zhou_name: '操作日志',
        zhou_icon: '☰',
        zhou_group: 'AI 中心',
        zhou_api: '/api/admin/logs',
        zhou_columns: [
            { zhou_key: 'zhou_id', zhou_name: 'ID' },
            { zhou_key: 'zhou_admin_name', zhou_name: '操作人' },
            { zhou_key: 'zhou_action', zhou_name: '操作' },
            { zhou_key: 'zhou_target', zhou_name: '对象', zhou_ell: true },
            { zhou_key: 'zhou_detail', zhou_name: '详情', zhou_ell: true },
            { zhou_key: 'zhou_created_at', zhou_name: '时间', zhou_time: true }
        ]
    }
];

/* 按 key 查找模块配置 */
function zhou_admin_module(zhou_key) {
    for (var i = 0; i < ZHOU_ADMIN_MODULES.length; i++) {
        if (ZHOU_ADMIN_MODULES[i].zhou_key === zhou_key) {
            return ZHOU_ADMIN_MODULES[i];
        }
    }
    return null;
}

/* ============================================================
 * 三、请求封装与提示
 * ============================================================ */

/** HTML 转义 */
function zhou_admin_esc(zhou_text) {
    return String(zhou_text === null || zhou_text === undefined ? '' : zhou_text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 顶部轻提示 */
function zhou_admin_toast(zhou_msg, zhou_type) {
    var zhou_old = document.getElementById('zhou_admin_toast');
    if (zhou_old) {
        zhou_old.parentNode.removeChild(zhou_old);
    }
    var zhou_el = document.createElement('div');
    zhou_el.id = 'zhou_admin_toast';
    zhou_el.className = 'zhou_toast ' + (zhou_type === 'ok' ? 'zhou_toast_ok' : zhou_type === 'err' ? 'zhou_toast_err' : '');
    zhou_el.textContent = zhou_msg;
    document.body.appendChild(zhou_el);
    setTimeout(function () {
        if (zhou_el.parentNode) {
            zhou_el.parentNode.removeChild(zhou_el);
        }
    }, 2600);
}

/**
 * 请求封装
 * @param {string} zhou_method GET / POST / PUT / DELETE
 * @param {string} zhou_url    接口地址
 * @param {Object} zhou_body   请求体（可选）
 * @returns {Promise} 成功返回 data，失败抛错并弹出提示
 */
function zhou_admin_api(zhou_method, zhou_url, zhou_body) {
    var zhou_opt = { method: zhou_method, headers: {} };
    var zhou_token = localStorage.getItem(ZHOU_ADMIN_TOKEN_KEY);
    if (zhou_token) {
        zhou_opt.headers.Authorization = 'Bearer ' + zhou_token;
    }
    if (zhou_body !== undefined && zhou_body !== null) {
        zhou_opt.headers['Content-Type'] = 'application/json';
        zhou_opt.body = JSON.stringify(zhou_body);
    }
    console.log('[后台] 请求：' + zhou_method + ' ' + zhou_url, zhou_body || '');
    return fetch(zhou_url, zhou_opt)
        .then(function (r) {
            return r.json().catch(function () {
                return { code: 500, msg: '服务器返回了非 JSON 数据', data: null };
            });
        })
        .then(function (j) {
            console.log('[后台] 响应：', j);
            if (!j || j.code !== 0) {
                var zhou_msg = (j && j.msg) || '操作失败';
                if (j && j.code === 401) {
                    localStorage.removeItem(ZHOU_ADMIN_TOKEN_KEY);
                    localStorage.removeItem(ZHOU_ADMIN_USER_KEY);
                    zhou_admin_toast('登录已失效，正在跳回登录页', 'err');
                    setTimeout(function () {
                        window.location.replace('login.html');
                    }, 900);
                } else {
                    zhou_admin_toast(zhou_msg, 'err');
                }
                var zhou_err = new Error(zhou_msg);
                zhou_err.zhou_code = j ? j.code : 500;
                throw zhou_err;
            }
            return j.data || {};
        })
        .catch(function (e) {
            if (!e.zhou_code) {
                zhou_admin_toast('网络异常，请确认后端服务已启动', 'err');
            }
            throw e;
        });
}

/* ============================================================
 * 四、菜单与模块调度
 * ============================================================ */

/** 渲染侧边菜单 */
function zhou_admin_render_menu() {
    var zhou_box = document.getElementById('zhou_admin_menu');
    if (!zhou_box) {
        return;
    }
    var zhou_html = [];
    var zhou_last = '';
    ZHOU_ADMIN_MODULES.forEach(function (m) {
        if (m.zhou_group && m.zhou_group !== zhou_last) {
            zhou_html.push('<div class="zhou_admin_menu_title">' + zhou_admin_esc(m.zhou_group) + '</div>');
            zhou_last = m.zhou_group;
        }
        var zhou_on = zhou_admin_state.zhou_module === m.zhou_key ? ' zhou_on' : '';
        zhou_html.push('<a class="zhou_admin_link' + zhou_on + '" data-zhou-key="' + m.zhou_key + '">' +
            '<em>' + m.zhou_icon + '</em><span>' + zhou_admin_esc(m.zhou_name) + '</span></a>');
    });
    zhou_box.innerHTML = zhou_html.join('');
    zhou_box.querySelectorAll('.zhou_admin_link').forEach(function (a) {
        a.addEventListener('click', function () {
            zhou_admin_go(a.getAttribute('data-zhou-key'));
        });
    });
}

/** 切换模块 */
function zhou_admin_go(zhou_key) {
    var zhou_mod = zhou_admin_module(zhou_key) || ZHOU_ADMIN_MODULES[0];
    zhou_admin_state.zhou_module = zhou_mod.zhou_key;
    zhou_admin_state.zhou_page = 1;
    zhou_admin_state.zhou_keyword = '';
    zhou_admin_state.zhou_filter = '';
    zhou_admin_render_menu();
    var zhou_crumb = document.getElementById('zhou_admin_crumb');
    if (zhou_crumb) {
        zhou_crumb.textContent = zhou_mod.zhou_name;
    }
    if (zhou_mod.zhou_key === 'dashboard') {
        zhou_admin_render_dashboard();
    } else {
        zhou_admin_render_entity(zhou_mod);
    }
}

/* ============================================================
 * 五、启动
 * ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    /* 顶栏时间 */
    setInterval(function () {
        var zhou_el = document.getElementById('zhou_admin_time');
        if (zhou_el) {
            zhou_el.textContent = new Date().toLocaleString('zh-CN', { hour12: false });
        }
    }, 1000);

    /* 退出登录 */
    var zhou_logout = document.getElementById('zhou_admin_logout');
    if (zhou_logout) {
        zhou_logout.addEventListener('click', function () {
            localStorage.removeItem(ZHOU_ADMIN_TOKEN_KEY);
            localStorage.removeItem(ZHOU_ADMIN_USER_KEY);
            window.location.replace('login.html');
        });
    }

    /* 弹窗：取消 / 保存 / 点击遮罩关闭 */
    var zhou_cancel = document.getElementById('zhou_admin_cancel');
    if (zhou_cancel) {
        zhou_cancel.addEventListener('click', zhou_admin_close_modal);
    }
    var zhou_save = document.getElementById('zhou_admin_save');
    if (zhou_save) {
        zhou_save.addEventListener('click', zhou_admin_save_form);
    }
    var zhou_mask = document.getElementById('zhou_admin_mask');
    if (zhou_mask) {
        zhou_mask.addEventListener('click', function (e) {
            if (e.target === this) {
                zhou_admin_close_modal();
            }
        });
    }

    /* 令牌校验 */
    var zhou_token = localStorage.getItem(ZHOU_ADMIN_TOKEN_KEY);
    if (!zhou_token) {
        window.location.replace('login.html');
        return;
    }
    zhou_admin_api('GET', '/api/admin/profile')
        .then(function (d) {
            var zhou_u = d.zhou_admin || {};
            zhou_admin_state.zhou_user = zhou_u;
            var zhou_name = zhou_u.zhou_nick || zhou_u.zhou_username || '管理员';
            var zhou_name_el = document.getElementById('zhou_admin_name');
            if (zhou_name_el) {
                zhou_name_el.textContent = zhou_name;
            }
            var zhou_avatar = document.getElementById('zhou_admin_avatar');
            if (zhou_avatar) {
                zhou_avatar.textContent = zhou_name.charAt(0);
            }
            zhou_admin_render_menu();
            zhou_admin_go('dashboard');
        })
        .catch(function () {
            /* 401 已在请求封装中处理跳转 */
        });
});
