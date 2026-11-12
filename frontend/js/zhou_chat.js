/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_chat.js —— AI 智能客服聊天逻辑（多轮会话 + SSE 流式 + 中断）
 * 规则：服务器返回的数据与错误信息全部输出到浏览器控制台。
 */

'use strict';

/* ---------- 全局状态 ---------- */
var zhou_state = {
    zhou_session_id: 0,
    zhou_model: '',
    zhou_user_id: 1,
    zhou_controller: null,
    zhou_streaming: false,
    zhou_token_total: 0
};

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('chat');
    zhou_load_models();
    zhou_load_sessions();
    zhou_load_stat();

    document.getElementById('zhou_send').addEventListener('click', zhou_send);
    document.getElementById('zhou_stop').addEventListener('click', zhou_stop);
    document.getElementById('zhou_new_session').addEventListener('click', zhou_new_session);

    /* Enter 发送，Shift+Enter 换行 */
    document.getElementById('zhou_input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            zhou_send();
        }
    });

    /* 快捷提问 */
    Array.prototype.forEach.call(document.querySelectorAll('.zhou_quick_btn'), function (btn) {
        btn.addEventListener('click', function () {
            document.getElementById('zhou_input').value = this.textContent;
            zhou_send();
        });
    });
});

/* ---------- 模型与统计 ---------- */
function zhou_load_models() {
    zhou_request('/ai/model', 'GET').then(function (res) {
        console.log('[chat] 模型信息：', res.data);
        zhou_state.zhou_model = res.data.zhou_model;
        document.getElementById('zhou_model').textContent =
            res.data.zhou_model + (res.data.zhou_ready ? '（已就绪）' : '（未配置密钥）') +
            '｜保留最近 ' + res.data.zhou_keep_rounds + ' 轮，上下文预算 ' + res.data.zhou_ctx_budget + ' token';
        document.getElementById('zhou_model_info').textContent =
            '上下文：保留最近 ' + res.data.zhou_keep_rounds + ' 轮 / 预算 ' + res.data.zhou_ctx_budget + ' token';
        zhou_load_model_options();
    }).catch(function (e) {
        console.error('[chat] 获取模型信息失败：', e);
    });
}

/** 拉取平台可用模型列表并填充下拉框 */
function zhou_load_model_options() {
    zhou_request('/ai/models', 'GET').then(function (res) {
        console.log('[chat] 可用模型列表：', res.data.zhou_list.length, '个');
        var zhou_sel = document.getElementById('zhou_model_select');
        zhou_sel.innerHTML = '';
        var zhou_cur = res.data.zhou_current;
        var zhou_found = false;
        res.data.zhou_list.forEach(function (m) {
            var zhou_o = document.createElement('option');
            zhou_o.value = m.zhou_id;
            zhou_o.textContent = m.zhou_id;
            if (m.zhou_id === zhou_cur) {
                zhou_o.selected = true;
                zhou_found = true;
            }
            zhou_sel.appendChild(zhou_o);
        });
        if (!zhou_found && zhou_cur) {
            var zhou_o2 = document.createElement('option');
            zhou_o2.value = zhou_cur;
            zhou_o2.textContent = zhou_cur + '（当前）';
            zhou_o2.selected = true;
            zhou_sel.insertBefore(zhou_o2, zhou_sel.firstChild);
        }
        zhou_sel.onchange = function () {
            zhou_state.zhou_model = this.value;
            console.log('[chat] 切换模型：', this.value);
        };
    }).catch(function (e) {
        console.error('[chat] 获取模型列表失败：', e);
    });
}

/** 加载 token 用量与费用统计 */
function zhou_load_stat() {
    zhou_request('/ai/stats?zhou_user_id=' + zhou_state.zhou_user_id, 'GET').then(function (res) {
        console.log('[chat] 用量统计：', res.data);
        document.getElementById('zhou_side_stat').innerHTML =
            '<div>会话数：' + res.data.zhou_session_count + '</div>' +
            '<div>消息数：' + res.data.zhou_message_total + '</div>' +
            '<div>累计 token：' + res.data.zhou_token_total + '</div>' +
            '<div>预估费用：' + res.data.zhou_cost.zhou_cost_yuan + ' 元</div>';
        zhou_state.zhou_token_total = res.data.zhou_token_total;
    }).catch(function (e) {
        console.error('[chat] 获取用量统计失败：', e);
    });
}
/* ---------- 会话管理 ---------- */
function zhou_load_sessions() {
    zhou_request('/session?zhou_user_id=' + zhou_state.zhou_user_id, 'GET').then(function (res) {
        console.log('[chat] 会话列表：', res.data.zhou_list);
        var zhou_box = document.getElementById('zhou_session_list');
        if (!res.data.zhou_list.length) {
            zhou_box.innerHTML = '<div class="zhou_session_empty">还没有会话记录</div>';
            return;
        }
        zhou_box.innerHTML = '';
        res.data.zhou_list.forEach(function (s) {
            var zhou_item = document.createElement('div');
            zhou_item.className = 'zhou_session_item' + (Number(s.zhou_session_id) === zhou_state.zhou_session_id ? ' zhou_session_active' : '');
            zhou_item.innerHTML =
                '<div class="zhou_session_title" title="' + zhou_md_escape(s.zhou_title) + '">' + zhou_md_escape(s.zhou_title) + '</div>' +
                '<div class="zhou_session_meta">' + s.zhou_message_count + ' 条消息 · ' + s.zhou_token_total + ' token</div>' +
                '<div class="zhou_session_ops">' +
                '<button class="zhou_session_op" data-act="open">打开</button>' +
                '<button class="zhou_session_op" data-act="rename">重命名</button>' +
                '<button class="zhou_session_op" data-act="export">导出</button>' +
                '<button class="zhou_session_op zhou_session_del" data-act="del">删除</button>' +
                '</div>';
            zhou_item.setAttribute('data-id', s.zhou_session_id);
            zhou_box.appendChild(zhou_item);
        });
        zhou_box.onclick = function (e) {
            var zhou_btn = e.target.closest('.zhou_session_op');
            if (!zhou_btn) return;
            var zhou_id = Number(zhou_btn.parentNode.parentNode.getAttribute('data-id'));
            var zhou_act = zhou_btn.getAttribute('data-act');
            if (zhou_act === 'open') { zhou_open_session(zhou_id); }
            if (zhou_act === 'rename') { zhou_rename_session(zhou_id); }
            if (zhou_act === 'del') { zhou_delete_session(zhou_id); }
            if (zhou_act === 'export') { zhou_export_session(zhou_id); }
        };
    }).catch(function (e) {
        console.error('[chat] 获取会话列表失败：', e);
    });
}

/** 打开会话并回放历史消息 */
function zhou_open_session(zhou_id) {
    zhou_request('/session/' + zhou_id, 'GET').then(function (res) {
        console.log('[chat] 会话详情：', res.data);
        zhou_state.zhou_session_id = zhou_id;
        var zhou_box = document.getElementById('zhou_chat_box');
        zhou_box.innerHTML = '';
        res.data.zhou_messages.forEach(function (m) {
            if (m.zhou_role === 'user') {
                zhou_append_msg(m.zhou_content, 'me');
            } else if (m.zhou_role === 'assistant') {
                zhou_append_msg(m.zhou_content, 'bot');
            }
        });
        if (!res.data.zhou_messages.length) {
            zhou_append_msg('（该会话暂无消息）', 'bot');
        }
        zhou_load_sessions();
    }).catch(function (e) {
        console.error('[chat] 打开会话失败：', e);
    });
}

/** 新建会话 */
function zhou_new_session() {
    zhou_state.zhou_session_id = 0;
    var zhou_box = document.getElementById('zhou_chat_box');
    zhou_box.innerHTML =
        '<div class="zhou_msg zhou_msg_bot"><div class="zhou_avatar zhou_avatar_bot">AI</div>' +
        '<div class="zhou_bubble">已开始新会话，我会记住这一轮的上下文。可以问我「有什么耳机」试试。</div></div>';
    console.log('[chat] 已新建会话（下次提问时后端自动创建）');
    zhou_load_sessions();
}

/** 重命名会话 */
function zhou_rename_session(zhou_id) {
    var zhou_title = window.prompt('请输入新的会话名称：', '我的新会话');
    if (zhou_title === null) return;
    zhou_request('/session/' + zhou_id, 'PUT', { zhou_title: zhou_title }).then(function (res) {
        console.log('[chat] 重命名成功：', res.data);
        zhou_load_sessions();
    }).catch(function (e) {
        console.error('[chat] 重命名失败：', e);
    });
}

/** 删除会话 */
function zhou_delete_session(zhou_id) {
    if (!window.confirm('确定删除该会话及其全部消息吗？')) return;
    zhou_request('/session/' + zhou_id, 'DELETE').then(function (res) {
        console.log('[chat] 删除成功：', res.data);
        if (zhou_state.zhou_session_id === zhou_id) {
            zhou_new_session();
        }
        zhou_load_sessions();
        zhou_load_stat();
    }).catch(function (e) {
        console.error('[chat] 删除失败：', e);
    });
}

/** 导出会话为文本文件 */
function zhou_export_session(zhou_id) {
    zhou_request('/session/' + zhou_id + '/export', 'GET').then(function (res) {
        console.log('[chat] 导出会话：', res.data);
        var zhou_blob = new Blob([res.data.zhou_text], { type: 'text/plain;charset=utf-8' });
        var zhou_a = document.createElement('a');
        zhou_a.href = URL.createObjectURL(zhou_blob);
        zhou_a.download = res.data.zhou_title + '.txt';
        zhou_a.click();
        URL.revokeObjectURL(zhou_a.href);
    }).catch(function (e) {
        console.error('[chat] 导出会话失败：', e);
    });
}
/* ---------- 发送与流式接收 ---------- */
function zhou_send() {
    var zhou_input = document.getElementById('zhou_input');
    var zhou_question = zhou_input.value.trim();
    if (!zhou_question) {
        console.warn('[chat] 输入为空，已忽略本次发送');
        return;
    }
    if (zhou_state.zhou_streaming) {
        console.warn('[chat] 上一条消息仍在生成中，请先等待或点击中断');
        return;
    }

    var zhou_payload = {
        zhou_question: zhou_question,
        zhou_user_id: zhou_state.zhou_user_id,
        zhou_model: zhou_state.zhou_model,
        zhou_stream: true
    };
    if (zhou_state.zhou_session_id) {
        zhou_payload.zhou_session_id = zhou_state.zhou_session_id;
    }

    /* ---------- 发送的提示词输出到控制台 ---------- */
    console.log('[chat] 发送提示词：' + zhou_question);
    console.log('[chat] 完整请求参数：', zhou_payload);

    zhou_append_msg(zhou_question, 'me');
    zhou_input.value = '';

    var zhou_typing = zhou_append_typing();
    var zhou_controller = new AbortController();
    zhou_state.zhou_controller = zhou_controller;
    zhou_state.zhou_streaming = true;
    zhou_state.zhou_stopped = false;
    zhou_toggle_stop(true);

    fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zhou_payload),
        signal: zhou_controller.signal
    }).then(function (res) {
        if (!res.ok && res.headers.get('content-type').indexOf('application/json') >= 0) {
            return res.json().then(function (j) {
                throw new Error(j.msg || ('HTTP ' + res.status));
            });
        }
        var zhou_reader = res.body.getReader();
        var zhou_decoder = new TextDecoder('utf-8');
        var zhou_buf = '';
        var zhou_answer = '';
        var zhou_bubble = null;

        function zhou_handle(zhou_j) {
            if (zhou_j.code !== 0) {
                throw new Error(zhou_j.msg || '接口返回失败');
            }
            if (zhou_j.msg === '增量文本') {
                zhou_answer += zhou_j.data.zhou_delta;
                if (!zhou_bubble) {
                    zhou_remove(zhou_typing);
                    zhou_bubble = zhou_append_stream_bubble();
                }
                zhou_update_bubble(zhou_bubble, zhou_answer);
            } else if (zhou_j.msg === '完成') {
                console.log('[chat] 接收数据：', zhou_j.data);
                console.log('[chat] 模型回答：' + zhou_j.data.zhou_answer);
                console.log('[chat] 耗时 ' + zhou_j.data.zhou_elapsed + ' ms | tokens：', zhou_j.data.zhou_usage);
                console.log('[chat] 费用估算：', zhou_j.data.zhou_cost);
                console.log('[chat] 命中知识库商品：', zhou_j.data.zhou_refs);
                console.log('[chat] 命中知识库资料：', zhou_j.data.zhou_kb_refs);
                if (zhou_j.data.zhou_session_id) {
                    zhou_state.zhou_session_id = zhou_j.data.zhou_session_id;
                    zhou_load_sessions();
                    zhou_load_stat();
                }
                zhou_update_token_info(zhou_j.data);
                zhou_finalize_bubble(zhou_bubble, zhou_j.data);
            }
        }

        return (function zhou_read() {
            return zhou_reader.read().then(function (chunk) {
                if (chunk.done) return null;
                zhou_buf += zhou_decoder.decode(chunk.value, { stream: true });
                var zhou_lines = zhou_buf.split('\n');
                zhou_buf = zhou_lines.pop();
                zhou_lines.forEach(function (line) {
                    if (line.indexOf('data:') !== 0) return;
                    var zhou_j;
                    try {
                        zhou_j = JSON.parse(line.slice(5).trim());
                    } catch (e) {
                        return;
                    }
                    zhou_handle(zhou_j);
                });
                return zhou_read();
            });
        })();
    }).catch(function (e) {
        zhou_remove(zhou_typing);
        if (e.name === 'AbortError') {
            console.warn('[chat] 用户中断了本次生成');
            zhou_append_msg('（已中断本次生成）', 'bot');
        } else {
            console.error('[chat] 请求失败：', e);
            zhou_append_msg('（请求失败）' + (e.message || '网络异常，请稍后重试'), 'bot');
        }
    }).then(function () {
        zhou_state.zhou_streaming = false;
        zhou_state.zhou_controller = null;
        zhou_toggle_stop(false);
    });
}

/** 中断当前生成 */
function zhou_stop() {
    if (!zhou_state.zhou_controller) {
        console.warn('[chat] 当前没有正在进行的生成任务');
        return;
    }
    console.warn('[chat] 发出中断信号，停止本次生成');
    zhou_state.zhou_controller.abort();
}

/** 切换中断按钮可用状态 */
function zhou_toggle_stop(zhou_on) {
    var zhou_btn = document.getElementById('zhou_stop');
    var zhou_send_btn = document.getElementById('zhou_send');
    zhou_btn.disabled = !zhou_on;
    zhou_send_btn.disabled = zhou_on;
    zhou_btn.textContent = zhou_on ? '中断' : '中断';
}

/** 更新顶部 token 信息 */
function zhou_update_token_info(zhou_data) {
    var zhou_cost = zhou_data.zhou_cost || {};
    document.getElementById('zhou_token_info').textContent =
        '本次 ' + (zhou_data.zhou_elapsed || 0) + ' ms ｜ token ' + (zhou_cost.zhou_total_tokens || 0) +
        ' ｜ 约 ' + (zhou_cost.zhou_cost_yuan || 0) + ' 元';
}
/* ---------- 消息渲染 ---------- */
/** 追加一条消息 */
function zhou_append_msg(zhou_text, zhou_side) {
    var zhou_box = document.getElementById('zhou_chat_box');
    var zhou_html = '<div class="zhou_msg zhou_msg_' + zhou_side + '">' +
        '<div class="zhou_avatar ' + (zhou_side === 'me' ? 'zhou_avatar_me' : 'zhou_avatar_bot') + '">' + (zhou_side === 'me' ? '我' : 'AI') + '</div>' +
        '<div class="zhou_bubble">' + (zhou_side === 'me' ? zhou_md_escape(zhou_text) : zhou_md(zhou_text)) + '</div></div>';
    zhou_box.insertAdjacentHTML('beforeend', zhou_html);
    zhou_scroll_bottom();
}

/** 追加一个流式气泡，返回元素 */
function zhou_append_stream_bubble() {
    var zhou_box = document.getElementById('zhou_chat_box');
    var zhou_el = document.createElement('div');
    zhou_el.className = 'zhou_msg zhou_msg_bot';
    zhou_el.innerHTML = '<div class="zhou_avatar zhou_avatar_bot">AI</div>' +
        '<div class="zhou_bubble"><div class="zhou_bubble_text"></div></div>';
    zhou_box.appendChild(zhou_el);
    zhou_scroll_bottom();
    return zhou_el;
}

/** 更新流式气泡内容 */
function zhou_update_bubble(zhou_el, zhou_text) {
    if (!zhou_el) return;
    var zhou_target = zhou_el.querySelector('.zhou_bubble_text');
    if (zhou_target) {
        zhou_target.innerHTML = zhou_md(zhou_text);
    }
    zhou_scroll_bottom();
}

/** 流式结束：补上引用溯源 */
function zhou_finalize_bubble(zhou_el, zhou_data) {
    if (!zhou_el) return;
    var zhou_bubble = zhou_el.querySelector('.zhou_bubble');
    var zhou_html = '';
    if (zhou_data.zhou_refs && zhou_data.zhou_refs.length) {
        zhou_html += '<div class="zhou_refs"><div class="zhou_refs_title">引用商品：</div>';
        zhou_data.zhou_refs.forEach(function (r) {
            zhou_html += '<a class="zhou_ref" href="goods-detail.html?zhou_id=' + r.zhou_goods_id + '" target="_blank">' +
                '· ' + zhou_md_escape(r.zhou_title) +
                ' <span class="zhou_ref_meta">￥' + Number(r.zhou_price).toFixed(2) +
                '｜' + (r.zhou_cate_name || '') + '｜' + (r.zhou_trade_place || '待协商') + '</span></a>';
        });
        zhou_html += '</div>';
    }
    if (zhou_data.zhou_kb_refs && zhou_data.zhou_kb_refs.length) {
        zhou_html += '<div class="zhou_refs"><div class="zhou_refs_title">引用资料：</div>';
        zhou_data.zhou_kb_refs.forEach(function (c) {
            zhou_html += '<div class="zhou_ref zhou_ref_doc">' +
                '· ' + zhou_md_escape(c.zhou_file_name || '知识库') + '（片段 ' + c.zhou_chunk_index + '）' +
                '<span class="zhou_ref_meta">' + zhou_md_escape(c.zhou_excerpt || '') + '</span></div>';
        });
        zhou_html += '</div>';
    }
    if (zhou_html) {
        zhou_bubble.insertAdjacentHTML('beforeend', zhou_html);
    }
    zhou_scroll_bottom();
}

/** 追加"正在思考"提示 */
function zhou_append_typing() {
    var zhou_box = document.getElementById('zhou_chat_box');
    var zhou_el = document.createElement('div');
    zhou_el.id = 'zhou_typing';
    zhou_el.className = 'zhou_msg zhou_msg_bot';
    zhou_el.innerHTML = '<div class="zhou_avatar zhou_avatar_bot">AI</div>' +
        '<div class="zhou_bubble zhou_typing"><span></span><span></span><span></span></div>';
    zhou_box.appendChild(zhou_el);
    zhou_scroll_bottom();
    return zhou_el;
}

/** 移除元素 */
function zhou_remove(zhou_el) {
    if (zhou_el && zhou_el.parentNode) {
        zhou_el.parentNode.removeChild(zhou_el);
    }
}

/** 滚动到底部 */
function zhou_scroll_bottom() {
    var zhou_box = document.getElementById('zhou_chat_box');
    zhou_box.scrollTop = zhou_box.scrollHeight;
}