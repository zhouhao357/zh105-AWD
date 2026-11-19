/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_admin_view.js —— 后台管理系统视图脚本
 *   1. 仪表盘（统计卡片 + 待办 + 原生 Canvas 图表）
 *   2. 实体管理（列表 / 搜索 / 分页 / 编辑弹窗 / 删除）
 * 依赖：js/zhou_admin.js（状态、配置表、请求封装）
 */

'use strict';

/* ============================================================
 * 一、仪表盘
 * ============================================================ */

/** 数字滚动 */
function zhou_admin_count_up(zhou_el, zhou_target) {
    var zhou_num = Number(zhou_target) || 0;
    var zhou_start = 0;
    var zhou_time = performance.now();
    function zhou_step(zhou_now) {
        var zhou_p = Math.min(1, (zhou_now - zhou_time) / 700);
        zhou_el.textContent = (zhou_num * (1 - Math.pow(1 - zhou_p, 3))).toFixed(zhou_num % 1 ? 2 : 0);
        if (zhou_p < 1) {
            requestAnimationFrame(zhou_step);
        } else {
            zhou_el.textContent = zhou_num.toFixed(zhou_num % 1 ? 2 : 0);
        }
    }
    requestAnimationFrame(zhou_step);
    return zhou_start;
}

/** 渲染仪表盘 */
function zhou_admin_render_dashboard() {
    var zhou_c = document.getElementById('zhou_admin_content');
    zhou_c.innerHTML =
        '<div class="zhou_admin_cards" id="zhou_cards"></div>' +
        '<div class="zhou_admin_grid2">' +
        '<div class="zhou_admin_panel"><h3>近 7 天订单趋势 <em>订单量</em></h3>' +
        '<canvas class="zhou_admin_canvas" id="zhou_chart_order"></canvas>' +
        '<div class="zhou_admin_legend" id="zhou_legend_order"></div></div>' +
        '<div class="zhou_admin_panel"><h3>商品分类分布 <em>按商品数量</em></h3>' +
        '<canvas class="zhou_admin_canvas" id="zhou_chart_cate"></canvas>' +
        '<div class="zhou_admin_legend" id="zhou_legend_cate"></div></div>' +
        '</div>' +
        '<div class="zhou_admin_grid2">' +
        '<div class="zhou_admin_panel"><h3>评价评分分布 <em>1 ~ 5 星</em></h3>' +
        '<canvas class="zhou_admin_canvas" id="zhou_chart_rating"></canvas></div>' +
        '<div class="zhou_admin_panel"><h3>待办事项 <em>需要管理员处理</em></h3>' +
        '<div class="zhou_admin_todo" id="zhou_todo"></div></div>' +
        '</div>';

    /* 统计卡片 + 待办 */
    zhou_admin_api('GET', '/api/admin/stats').then(function (d) {
        var zhou_cards = [
            { zhou_label: '注册用户', zhou_value: d.zhou_user_count, zhou_note: '管理员 ' + d.zhou_admin_count + ' 人' },
            { zhou_label: '商品总数', zhou_value: d.zhou_goods_count, zhou_note: '在售 ' + d.zhou_goods_on + ' 件' },
            { zhou_label: '订单总数', zhou_value: d.zhou_order_count, zhou_note: '已完成 ' + d.zhou_order_done + ' 单' },
            { zhou_label: '成交总额', zhou_value: d.zhou_total_amount, zhou_note: '元' },
            { zhou_label: '评价数量', zhou_value: d.zhou_comment_count, zhou_note: '平均 ' + d.zhou_avg_rating + ' 分' },
            { zhou_label: '公告数量', zhou_value: d.zhou_notice_count, zhou_note: '条' },
            { zhou_label: 'AI 会话', zhou_value: d.zhou_session_count, zhou_note: '累计 ' + d.zhou_token_total + ' Token' },
            { zhou_label: '知识库切片', zhou_value: d.zhou_kb_chunk_count, zhou_note: '向量 ' + d.zhou_kb_vector_count + ' 条' }
        ];
        var zhou_html = '';
        zhou_cards.forEach(function (c) {
            zhou_html += '<div class="zhou_admin_card"><b data-zhou-target="' + c.zhou_value + '">0</b>' +
                '<span>' + c.zhou_label + '</span><small>' + c.zhou_note + '</small></div>';
        });
        var zhou_box = document.getElementById('zhou_cards');
        zhou_box.innerHTML = zhou_html;
        zhou_box.querySelectorAll('b[data-zhou-target]').forEach(function (b) {
            zhou_admin_count_up(b, b.getAttribute('data-zhou-target'));
        });

        var zhou_todo = d.zhou_todo || {};
        var zhou_items = [
            { zhou_name: '待付款订单', zhou_num: zhou_todo.zhou_pending_order },
            { zhou_name: '待收货订单', zhou_num: zhou_todo.zhou_shipped_order },
            { zhou_name: '已下架商品', zhou_num: zhou_todo.zhou_off_shelf },
            { zhou_name: '被封禁用户', zhou_num: zhou_todo.zhou_banned_user },
            { zhou_name: '低分评价(≤2 星)', zhou_num: zhou_todo.zhou_low_comment }
        ];
        var zhou_th = '';
        zhou_items.forEach(function (i) {
            zhou_th += '<div class="zhou_admin_todo_item"><span>' + i.zhou_name + '</span><b>' + (Number(i.zhou_num) || 0) + '</b></div>';
        });
        document.getElementById('zhou_todo').innerHTML = zhou_th;
    }).catch(function () { });

    /* 图表数据 */
    zhou_admin_api('GET', '/api/admin/chart/orders?zhou_days=7').then(function (d) {
        zhou_admin_chart_line(document.getElementById('zhou_chart_order'), d.zhou_list || []);
        var zhou_lg = '';
        (d.zhou_list || []).forEach(function (r) {
            zhou_lg += '<span><i style="background:#4f46e5"></i>' + r.zhou_day + '：' + r.zhou_count + ' 单</span>';
        });
        document.getElementById('zhou_legend_order').innerHTML = zhou_lg;
    }).catch(function () { });

    zhou_admin_api('GET', '/api/admin/chart/category').then(function (d) {
        zhou_admin_chart_donut(document.getElementById('zhou_chart_cate'), d.zhou_list || []);
        var zhou_colors = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];
        var zhou_lg = '';
        (d.zhou_list || []).forEach(function (r, i) {
            zhou_lg += '<span><i style="background:' + zhou_colors[i % zhou_colors.length] + '"></i>' +
                r.zhou_name + '：' + r.zhou_count + ' 件</span>';
        });
        document.getElementById('zhou_legend_cate').innerHTML = zhou_lg;
    }).catch(function () { });

    zhou_admin_api('GET', '/api/admin/chart/rating').then(function (d) {
        zhou_admin_chart_bar(document.getElementById('zhou_chart_rating'), d.zhou_list || []);
    }).catch(function () { });
}

/* ============================================================
 * 二、原生 Canvas 图表
 * ============================================================ */

/** 准备画布（适配高清屏） */
function zhou_admin_chart_canvas(zhou_cv) {
    if (!zhou_cv) {
        return null;
    }
    var zhou_dpr = window.devicePixelRatio || 1;
    var zhou_w = zhou_cv.clientWidth || 520;
    var zhou_h = zhou_cv.clientHeight || 250;
    zhou_cv.width = zhou_w * zhou_dpr;
    zhou_cv.height = zhou_h * zhou_dpr;
    var zhou_ctx = zhou_cv.getContext('2d');
    zhou_ctx.setTransform(zhou_dpr, 0, 0, zhou_dpr, 0, 0);
    zhou_ctx.clearRect(0, 0, zhou_w, zhou_h);
    zhou_ctx.font = '11px sans-serif';
    return { ctx: zhou_ctx, w: zhou_w, h: zhou_h };
}

/** 折线（面积）图 */
function zhou_admin_chart_line(zhou_cv, zhou_list) {
    var zhou_c = zhou_admin_chart_canvas(zhou_cv);
    if (!zhou_c) {
        return;
    }
    var ctx = zhou_c.ctx, w = zhou_c.w, h = zhou_c.h;
    var padL = 38, padR = 14, padT = 16, padB = 28;
    var iw = w - padL - padR, ih = h - padT - padB;
    var max = 1;
    zhou_list.forEach(function (d) {
        if (Number(d.zhou_count) > max) {
            max = Number(d.zhou_count);
        }
    });
    max = Math.ceil(max * 1.2);
    var n = zhou_list.length;
    if (!n) {
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', w / 2, h / 2);
        return;
    }
    function px(i) { return padL + (n === 1 ? iw / 2 : iw * i / (n - 1)); }
    function py(v) { return padT + ih - ih * (v / max); }

    /* 网格与刻度 */
    ctx.strokeStyle = '#eef2f7';
    ctx.fillStyle = '#94a3b8';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
        var y = padT + ih - ih * g / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(max * g / 4)), padL - 6, y);
    }
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + ih);
    ctx.stroke();

    /* 面积 */
    ctx.beginPath();
    zhou_list.forEach(function (d, i) {
        var x = px(i), y = py(Number(d.zhou_count));
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.lineTo(px(n - 1), padT + ih);
    ctx.lineTo(px(0), padT + ih);
    ctx.closePath();
    var zhou_gd = ctx.createLinearGradient(0, padT, 0, padT + ih);
    zhou_gd.addColorStop(0, 'rgba(79,70,229,.30)');
    zhou_gd.addColorStop(1, 'rgba(79,70,229,0)');
    ctx.fillStyle = zhou_gd;
    ctx.fill();

    /* 折线与数据点 */
    ctx.beginPath();
    zhou_list.forEach(function (d, i) {
        var x = px(i), y = py(Number(d.zhou_count));
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    zhou_list.forEach(function (d, i) {
        var x = px(i), y = py(Number(d.zhou_count));
        ctx.beginPath();
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(d.zhou_day).slice(5), x, padT + ih + 8);
    });
}

/** 环形图 */
function zhou_admin_chart_donut(zhou_cv, zhou_list) {
    var zhou_c = zhou_admin_chart_canvas(zhou_cv);
    if (!zhou_c) {
        return;
    }
    var ctx = zhou_c.ctx, w = zhou_c.w, h = zhou_c.h;
    var colors = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];
    var total = 0;
    zhou_list.forEach(function (d) { total += Number(d.zhou_count) || 0; });
    var cx = w / 2, cy = h / 2;
    var r = Math.min(w, h) / 2 - 18;
    var ir = r * 0.62;
    if (!total) {
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', cx, cy);
        return;
    }
    var a0 = -Math.PI / 2;
    zhou_list.forEach(function (d, i) {
        var a1 = a0 + Math.PI * 2 * ((Number(d.zhou_count) || 0) / total);
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a1);
        ctx.arc(cx, cy, ir, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        a0 = a1;
    });
    ctx.fillStyle = '#334155';
    ctx.font = '600 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy - 7);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('商品总数', cx, cy + 13);
}

/** 柱状图（评分 1~5 星） */
function zhou_admin_chart_bar(zhou_cv, zhou_list) {
    var zhou_c = zhou_admin_chart_canvas(zhou_cv);
    if (!zhou_c) {
        return;
    }
    var ctx = zhou_c.ctx, w = zhou_c.w, h = zhou_c.h;
    var padL = 34, padR = 14, padT = 16, padB = 30;
    var iw = w - padL - padR, ih = h - padT - padB;
    var vals = [0, 0, 0, 0, 0];
    zhou_list.forEach(function (d) {
        var s = Number(d.zhou_score);
        if (s >= 1 && s <= 5) {
            vals[s - 1] = Number(d.zhou_count) || 0;
        }
    });
    var max = Math.max.apply(null, vals) || 1;
    max = Math.ceil(max * 1.2);
    ctx.strokeStyle = '#eef2f7';
    ctx.fillStyle = '#94a3b8';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
        var y = padT + ih - ih * g / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(max * g / 4)), padL - 6, y);
    }
    var step = iw / 5;
    for (var i = 0; i < 5; i++) {
        var bh = ih * (vals[i] / max);
        var bx = padL + step * i + step * 0.24;
        var bw = step * 0.52;
        var by = padT + ih - bh;
        var zhou_gd = ctx.createLinearGradient(0, by, 0, padT + ih);
        zhou_gd.addColorStop(0, '#818cf8');
        zhou_gd.addColorStop(1, '#4f46e5');
        ctx.fillStyle = zhou_gd;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(bx, by, bw, bh, 5);
        } else {
            ctx.rect(bx, by, bw, bh);
        }
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText((i + 1) + ' 星', bx + bw / 2, padT + ih + 8);
        ctx.fillStyle = '#4f46e5';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(vals[i]), bx + bw / 2, by - 3);
    }
}

/* ============================================================
 * 三、实体管理
 * ============================================================ */

/** 时间格式化 */
function zhou_admin_time(zhou_val) {
    if (!zhou_val) {
        return '';
    }
    return String(zhou_val).replace('T', ' ').slice(0, 16);
}

/** 渲染实体模块页面骨架 */
function zhou_admin_render_entity(zhou_mod) {
    var zhou_c = document.getElementById('zhou_admin_content');
    var zhou_html = '<div class="zhou_admin_toolbar">';
    zhou_html += '<input class="zhou_input" id="zhou_kw" placeholder="关键词搜索" value="' +
        zhou_admin_esc(zhou_admin_state.zhou_keyword) + '">';
    if (zhou_mod.zhou_filter) {
        zhou_html += '<select class="zhou_select" id="zhou_filter"><option value="">全部' +
            zhou_admin_esc(zhou_mod.zhou_filter.zhou_label) + '</option>';
        zhou_mod.zhou_filter.zhou_options.forEach(function (o) {
            zhou_html += '<option value="' + zhou_admin_esc(o) + '"' +
                (zhou_admin_state.zhou_filter === o ? ' selected' : '') + '>' + zhou_admin_esc(o) + '</option>';
        });
        zhou_html += '</select>';
    }
    zhou_html += '<button class="zhou_btn zhou_btn_primary" id="zhou_search">查询</button>';
    if (zhou_mod.zhou_create) {
        zhou_html += '<button class="zhou_btn" id="zhou_add">+ 新增' + zhou_admin_esc(zhou_mod.zhou_name) + '</button>';
    }
    zhou_html += '<span id="zhou_total" style="margin-left:auto;font-size:12.5px;color:#94a3b8"></span></div>';

    zhou_html += '<div class="zhou_admin_panel"><div class="zhou_table_wrap"><table class="zhou_admin_table"><thead><tr>';
    zhou_mod.zhou_columns.forEach(function (col) {
        zhou_html += '<th>' + zhou_admin_esc(col.zhou_name) + '</th>';
    });
    zhou_html += '<th style="width:130px">操作</th></tr></thead><tbody id="zhou_tbody"></tbody></table></div>';
    zhou_html += '<div class="zhou_admin_pager" id="zhou_pager"></div></div>';
    zhou_c.innerHTML = zhou_html;

    /* 事件绑定 */
    document.getElementById('zhou_search').addEventListener('click', function () {
        zhou_admin_state.zhou_keyword = document.getElementById('zhou_kw').value.trim();
        if (zhou_mod.zhou_filter) {
            zhou_admin_state.zhou_filter = document.getElementById('zhou_filter').value;
        }
        zhou_admin_state.zhou_page = 1;
        zhou_admin_load_list(zhou_mod);
    });
    document.getElementById('zhou_kw').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('zhou_search').click();
        }
    });
    var zhou_add = document.getElementById('zhou_add');
    if (zhou_add) {
        zhou_add.addEventListener('click', function () {
            zhou_admin_open_modal(zhou_mod, null, true);
        });
    }
    zhou_admin_load_list(zhou_mod);
}

/** 加载列表数据 */
function zhou_admin_load_list(zhou_mod) {
    var zhou_url = zhou_mod.zhou_api + '?zhou_page=' + zhou_admin_state.zhou_page +
        '&zhou_size=' + zhou_admin_state.zhou_size;
    if (zhou_admin_state.zhou_keyword) {
        zhou_url += '&zhou_keyword=' + encodeURIComponent(zhou_admin_state.zhou_keyword);
    }
    if (zhou_mod.zhou_filter && zhou_admin_state.zhou_filter) {
        zhou_url += '&' + zhou_mod.zhou_filter.zhou_param + '=' +
            encodeURIComponent(zhou_admin_state.zhou_filter);
    }
    zhou_admin_api('GET', zhou_url).then(function (d) {
        zhou_admin_state.zhou_list = d.zhou_list || [];
        zhou_admin_state.zhou_total = Number(d.zhou_total) || 0;
        zhou_admin_render_rows(zhou_mod);
    }).catch(function () { });
}

/** 渲染表格行与分页 */
function zhou_admin_render_rows(zhou_mod) {
    var zhou_tb = document.getElementById('zhou_tbody');
    if (!zhou_tb) {
        return;
    }
    var zhou_list = zhou_admin_state.zhou_list;
    if (!zhou_list.length) {
        zhou_tb.innerHTML = '<tr><td colspan="' + (zhou_mod.zhou_columns.length + 1) +
            '" style="text-align:center;color:#94a3b8;padding:26px">暂无数据</td></tr>';
    } else {
        var zhou_html = '';
        zhou_list.forEach(function (row) {
            zhou_html += '<tr>';
            zhou_mod.zhou_columns.forEach(function (col) {
                var zhou_v = row[col.zhou_key];
                if (zhou_v === null || zhou_v === undefined) {
                    zhou_v = '';
                }
                if (col.zhou_time) {
                    zhou_v = zhou_admin_time(zhou_v);
                }
                if (col.zhou_badge) {
                    var zhou_cls = ZHOU_ADMIN_BADGE[String(zhou_v)] || 'user';
                    zhou_html += '<td><span class="zhou_badge zhou_badge_' + zhou_cls + '">' +
                        zhou_admin_esc(zhou_v) + '</span></td>';
                } else if (col.zhou_num) {
                    zhou_html += '<td class="zhou_num">' + zhou_admin_esc(zhou_v) + '</td>';
                } else if (col.zhou_ell) {
                    zhou_html += '<td class="zhou_admin_ell" title="' + zhou_admin_esc(zhou_v) + '">' +
                        zhou_admin_esc(zhou_v) + '</td>';
                } else {
                    zhou_html += '<td>' + zhou_admin_esc(zhou_v) + '</td>';
                }
            });
            zhou_html += '<td><div class="zhou_admin_rowbtns">';
            if (zhou_mod.zhou_form) {
                zhou_html += '<button class="zhou_admin_btn" data-zhou-act="edit" data-zhou-id="' + row.zhou_id + '">编辑</button>';
            }
            if (zhou_mod.zhou_key !== 'logs') {
                zhou_html += '<button class="zhou_admin_btn zhou_admin_btn_del" data-zhou-act="del" data-zhou-id="' +
                    row.zhou_id + '">删除</button>';
            }
            zhou_html += '</div></td></tr>';
        });
        zhou_tb.innerHTML = zhou_html;
        zhou_tb.querySelectorAll('button[data-zhou-act]').forEach(function (b) {
            b.addEventListener('click', function () {
                var zhou_id = Number(b.getAttribute('data-zhou-id'));
                var zhou_row = null;
                zhou_list.forEach(function (r) {
                    if (Number(r.zhou_id) === zhou_id) {
                        zhou_row = r;
                    }
                });
                if (!zhou_row) {
                    return;
                }
                if (b.getAttribute('data-zhou-act') === 'edit') {
                    zhou_admin_open_modal(zhou_mod, zhou_row, false);
                } else {
                    zhou_admin_remove(zhou_mod, zhou_row);
                }
            });
        });
    }

    /* 分页 */
    var zhou_pager = document.getElementById('zhou_pager');
    var zhou_total = zhou_admin_state.zhou_total;
    var zhou_page = zhou_admin_state.zhou_page;
    var zhou_pages = Math.max(1, Math.ceil(zhou_total / zhou_admin_state.zhou_size));
    document.getElementById('zhou_total').textContent = '共 ' + zhou_total + ' 条记录';
    zhou_pager.innerHTML =
        '<button id="zhou_prev"' + (zhou_page <= 1 ? ' disabled' : '') + '>上一页</button>' +
        '<span>第 ' + zhou_page + ' / ' + zhou_pages + ' 页</span>' +
        '<button id="zhou_next"' + (zhou_page >= zhou_pages ? ' disabled' : '') + '>下一页</button>';
    var zhou_prev = document.getElementById('zhou_prev');
    var zhou_next = document.getElementById('zhou_next');
    if (zhou_prev) {
        zhou_prev.addEventListener('click', function () {
            if (zhou_admin_state.zhou_page > 1) {
                zhou_admin_state.zhou_page--;
                zhou_admin_load_list(zhou_mod);
            }
        });
    }
    if (zhou_next) {
        zhou_next.addEventListener('click', function () {
            if (zhou_admin_state.zhou_page < zhou_pages) {
                zhou_admin_state.zhou_page++;
                zhou_admin_load_list(zhou_mod);
            }
        });
    }
}

/* ============================================================
 * 四、编辑弹窗
 * ============================================================ */

/** 打开弹窗 */
function zhou_admin_open_modal(zhou_mod, zhou_row, zhou_is_new) {
    var zhou_mask = document.getElementById('zhou_admin_mask');
    var zhou_form = document.getElementById('zhou_admin_form');
    document.getElementById('zhou_admin_modal_title').textContent =
        (zhou_is_new ? '新增' : '编辑') + zhou_mod.zhou_name;
    var zhou_html = '';
    zhou_mod.zhou_form.forEach(function (f) {
        var zhou_v = '';
        if (!zhou_is_new && zhou_row) {
            zhou_v = zhou_row[f.zhou_key];
            if (zhou_v === null || zhou_v === undefined) {
                zhou_v = '';
            }
        }
        zhou_html += '<div class="zhou_field"><label>' + zhou_admin_esc(f.zhou_name) +
            (f.zhou_required ? ' *' : '') + '</label>';
        if (f.zhou_type === 'select') {
            zhou_html += '<select class="zhou_select" name="' + f.zhou_key + '">';
            f.zhou_options.forEach(function (o) {
                zhou_html += '<option value="' + zhou_admin_esc(o) + '"' +
                    (String(zhou_v) === o ? ' selected' : '') + '>' + zhou_admin_esc(o) + '</option>';
            });
            zhou_html += '</select>';
        } else if (f.zhou_type === 'textarea') {
            zhou_html += '<textarea class="zhou_textarea" name="' + f.zhou_key + '">' +
                zhou_admin_esc(zhou_v) + '</textarea>';
        } else {
            zhou_html += '<input class="zhou_input" type="' + (f.zhou_type || 'text') +
                '" name="' + f.zhou_key + '" value="' + zhou_admin_esc(zhou_v) + '">';
        }
        zhou_html += '</div>';
    });
    zhou_form.innerHTML = zhou_html;
    zhou_mask.setAttribute('data-zhou-module', zhou_mod.zhou_key);
    zhou_mask.setAttribute('data-zhou-mode', zhou_is_new ? 'new' : 'edit');
    zhou_mask.setAttribute('data-zhou-id', zhou_is_new ? '' : zhou_row.zhou_id);
    zhou_mask.classList.add('zhou_show');
}

/** 关闭弹窗 */
function zhou_admin_close_modal() {
    var zhou_mask = document.getElementById('zhou_admin_mask');
    zhou_mask.classList.remove('zhou_show');
    document.getElementById('zhou_admin_form').innerHTML = '';
}

/** 保存表单 */
function zhou_admin_save_form() {
    var zhou_mask = document.getElementById('zhou_admin_mask');
    var zhou_key = zhou_mask.getAttribute('data-zhou-module');
    var zhou_mod = zhou_admin_module(zhou_key);
    if (!zhou_mod) {
        return;
    }
    var zhou_is_new = zhou_mask.getAttribute('data-zhou-mode') === 'new';
    var zhou_id = zhou_mask.getAttribute('data-zhou-id');
    var zhou_body = {};
    var zhou_form = document.getElementById('zhou_admin_form');
    var zhou_ok = true;
    zhou_mod.zhou_form.forEach(function (f) {
        var zhou_el = zhou_form.querySelector('[name="' + f.zhou_key + '"]');
        if (!zhou_el) {
            return;
        }
        var zhou_v = zhou_el.value;
        if (f.zhou_required && !String(zhou_v).trim()) {
            zhou_ok = false;
            zhou_admin_toast('请填写「' + f.zhou_name + '」', 'err');
            return;
        }
        if (f.zhou_type === 'number') {
            zhou_v = Number(zhou_v);
            if (isNaN(zhou_v)) {
                zhou_ok = false;
                zhou_admin_toast('「' + f.zhou_name + '」必须是数字', 'err');
                return;
            }
        }
        zhou_body[f.zhou_key] = zhou_v;
    });
    if (!zhou_ok) {
        return;
    }

    var zhou_url = zhou_mod.zhou_api;
    var zhou_method = 'PUT';
    if (zhou_is_new) {
        zhou_method = 'POST';
    } else {
        zhou_url += '/' + zhou_id;
    }
    zhou_admin_api(zhou_method, zhou_url, zhou_body).then(function () {
        zhou_admin_toast((zhou_is_new ? '新增' : '修改') + '成功', 'ok');
        zhou_admin_close_modal();
        zhou_admin_load_list(zhou_mod);
        if (zhou_mod.zhou_key === 'dashboard') {
            zhou_admin_render_dashboard();
        }
    }).catch(function () { });
}

/** 删除记录 */
function zhou_admin_remove(zhou_mod, zhou_row) {
    var zhou_name = zhou_row.zhou_title || zhou_row.zhou_cate_name || zhou_row.zhou_order_no ||
        zhou_row.zhou_file_name || zhou_row.zhou_username || ('#' + zhou_row.zhou_id);
    if (!window.confirm('确定要删除「' + zhou_name + '」吗？该操作不可恢复。')) {
        return;
    }
    zhou_admin_api('DELETE', zhou_mod.zhou_api + '/' + zhou_row.zhou_id).then(function () {
        zhou_admin_toast('删除成功', 'ok');
        zhou_admin_load_list(zhou_mod);
    }).catch(function () { });
}
