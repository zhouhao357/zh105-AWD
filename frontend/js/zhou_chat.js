/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）
 *
 * zhou_chat.js —— AI 智能客服聊天逻辑
 * 规则：服务器返回的数据与错误信息全部输出到浏览器控制台。
 */

'use strict';

var zhou_chat_history = [];

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('chat');
    zhou_load_model();

    document.getElementById('zhou_send').addEventListener('click', zhou_send);

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

/** 读取当前模型信息 */
function zhou_load_model() {
    zhou_request('/ai/model', 'GET').then(function (res) {
        console.log('[chat] 模型信息：', res.data);
        document.getElementById('zhou_model').textContent = res.data.zhou_model + (res.data.zhou_ready ? '（已就绪）' : '（未配置密钥）');
    }).catch(function (e) {
        console.error('[chat] 获取模型信息失败：', e);
    });
}

/** 发送消息 */
function zhou_send() {
    var zhou_input = document.getElementById('zhou_input');
    var zhou_question = zhou_input.value.trim();
    if (!zhou_question) {
        console.warn('[chat] 输入为空，已忽略本次发送');
        return;
    }

    /* ---------- 发送的提示词输出到控制台 ---------- */
    console.log('[chat] 发送提示词：' + zhou_question);
    console.log('[chat] 完整请求参数：', { zhou_question: zhou_question, zhou_history_length: zhou_chat_history.length });

    zhou_append_msg(zhou_question, 'me');
    zhou_input.value = '';

    var zhou_typing = zhou_append_typing();

    zhou_request('/ai/chat', 'POST', { zhou_question: zhou_question }).then(function (res) {
        zhou_remove(zhou_typing);

        /* ---------- 接收的数据输出到控制台 ---------- */
        console.log('[chat] 接收数据：', res);
        console.log('[chat] 模型回答：' + res.data.zhou_answer);
        console.log('[chat] 耗时 ' + res.data.zhou_elapsed + ' ms | tokens：', res.data.zhou_usage);
        console.log('[chat] 命中知识库商品：', res.data.zhou_refs);

        zhou_append_msg(res.data.zhou_answer, 'bot', res.data.zhou_refs);
        zhou_chat_history.push({ role: 'user', content: zhou_question });
        zhou_chat_history.push({ role: 'assistant', content: res.data.zhou_answer });
    }).catch(function (e) {
        zhou_remove(zhou_typing);
        console.error('[chat] 请求失败：', e);
        zhou_append_msg('（请求失败）' + (e.msg || '网络异常，请稍后重试'), 'bot');
    });
}

/** 追加一条消息 */
function zhou_append_msg(zhou_text, zhou_side, zhou_refs) {
    var zhou_box = document.getElementById('zhou_chat_box');
    var zhou_html = '<div class="zhou_msg zhou_msg_' + zhou_side + '">' +
        '<div class="zhou_avatar ' + (zhou_side === 'me' ? 'zhou_avatar_me' : 'zhou_avatar_bot') + '">' + (zhou_side === 'me' ? '我' : 'AI') + '</div>' +
        '<div class="zhou_bubble">' + zhou_md(zhou_text);

    if (zhou_refs && zhou_refs.length) {
        zhou_html += '<div class="zhou_refs"><div style="font-size:12px;color:#94a3b8;margin-bottom:2px">引用商品：</div>';
        zhou_refs.forEach(function (r) {
            zhou_html += '<a class="zhou_ref" href="goods-detail.html?zhou_id=' + r.zhou_goods_id + '" target="_blank">' +
                '· ' + zhou_escape(r.zhou_title) +
                ' <span class="zhou_ref_meta">￥' + Number(r.zhou_price).toFixed(2) +
                '｜' + (r.zhou_cate_name || '') + '｜' + (r.zhou_trade_place || '待协商') + '</span></a>';
        });
        zhou_html += '</div>';
    }
    zhou_html += '</div></div>';

    zhou_box.insertAdjacentHTML('beforeend', zhou_html);
    zhou_box.scrollTop = zhou_box.scrollHeight;
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
    zhou_box.scrollTop = zhou_box.scrollHeight;
    return zhou_el;
}

/** 移除元素 */
function zhou_remove(zhou_el) {
    if (zhou_el && zhou_el.parentNode) {
        zhou_el.parentNode.removeChild(zhou_el);
    }
}

/** HTML 转义，防止模型输出破坏结构 */
function zhou_escape(zhou_text) {
    return String(zhou_text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * 轻量 Markdown 渲染：仅支持 **加粗** 与行首 "- " 列表项
 * 先转义再替换，避免模型输出注入 HTML
 */
function zhou_md(zhou_text) {
    var zhou_lines = zhou_escape(zhou_text).split('\n');
    var zhou_out = '';
    for (var i = 0; i < zhou_lines.length; i++) {
        var zhou_line = zhou_lines[i];
        /* 行首 "- " 转成列表项 */
        if (/^\s*[-*]\s+/.test(zhou_line)) {
            zhou_out += '<div class="zhou_md_li">' + zhou_line.replace(/^\s*[-*]\s+/, '') + '</div>';
            continue;
        }
        /* **加粗** */
        zhou_line = zhou_line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        zhou_out += '<div>' + (zhou_line || '&nbsp;') + '</div>';
    }
    return zhou_out;
}