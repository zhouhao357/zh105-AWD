/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_md.js —— 轻量 Markdown 渲染器（原生实现，不依赖第三方库）
 * 支持：围栏代码块、标题、有序/无序列表、粗体、斜体、行内代码、引用、分隔线
 * 安全：先做 HTML 转义再替换标签，模型输出无法注入 HTML
 */

'use strict';

/** HTML 转义 */
function zhou_md_escape(zhou_text) {
    return String(zhou_text === undefined || zhou_text === null ? '' : zhou_text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * 渲染 Markdown 为 HTML
 * @param {string} zhou_text 原始文本
 * @returns {string} HTML 字符串
 */
function zhou_md(zhou_text) {
    var zhou_src = String(zhou_text === undefined || zhou_text === null ? '' : zhou_text).replace(/\r\n/g, '\n');
    var zhou_blocks = [];

    /* 1. 抽取围栏代码块，先存起来避免内部被行内规则破坏 */
    zhou_src = zhou_src.replace(/```([a-zA-Z0-9+#-]*)\n([\s\S]*?)```/g, function (all, zhou_lang, zhou_code) {
        zhou_blocks.push('<pre class="zhou_code"><code class="zhou_code_lang_' + (zhou_lang || 'text') + '">' + zhou_md_escape(zhou_code.replace(/\n$/, '')) + '</code></pre>');
        return '\u0000BLOCK' + (zhou_blocks.length - 1) + '\u0000';
    });

    /* 2. 行内规则（此时文本尚未转义，先转义再替换） */
    var zhou_inline = zhou_md_escape(zhou_src);
    zhou_inline = zhou_inline.replace(/`([^`\n]+)`/g, '<code class="zhou_code_inline">$1</code>');
    zhou_inline = zhou_inline.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    zhou_inline = zhou_inline.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    /* 3. 块级规则 */
    var zhou_lines = zhou_inline.split('\n');
    var zhou_html = '';
    var zhou_list_type = '';   /* ul / ol / '' */
    var zhou_quote = false;

    var zhou_close_list = function () {
        if (zhou_list_type) {
            zhou_html += '</' + zhou_list_type + '>';
            zhou_list_type = '';
        }
    };
    var zhou_close_quote = function () {
        if (zhou_quote) {
            zhou_html += '</blockquote>';
            zhou_quote = false;
        }
    };

    for (var zhou_i = 0; zhou_i < zhou_lines.length; zhou_i++) {
        var zhou_line = zhou_lines[zhou_i];
        var zhou_trim = zhou_line.trim();

        if (!zhou_trim) {
            zhou_close_list();
            zhou_close_quote();
            continue;
        }

        /* 占位代码块 */
        if (/^\u0000BLOCK\d+\u0000$/.test(zhou_trim)) {
            zhou_close_list();
            zhou_close_quote();
            var zhou_idx = Number(zhou_trim.replace(/\u0000BLOCK|\u0000/g, ''));
            zhou_html += zhou_blocks[zhou_idx];
            continue;
        }

        /* 分隔线 */
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(zhou_trim)) {
            zhou_close_list();
            zhou_close_quote();
            zhou_html += '<hr class="zhou_md_hr" />';
            continue;
        }

        /* 标题 */
        var zhou_head = zhou_trim.match(/^(#{1,6})\s+(.*)$/);
        if (zhou_head) {
            zhou_close_list();
            zhou_close_quote();
            var zhou_lv = zhou_head[1].length;
            zhou_html += '<h' + (zhou_lv + 3) + ' class="zhou_md_h">' + zhou_head[2] + '</h' + (zhou_lv + 3) + '>';
            continue;
        }

        /* 引用 */
        if (/^&gt;\s?/.test(zhou_trim)) {
            zhou_close_list();
            if (!zhou_quote) {
                zhou_html += '<blockquote class="zhou_md_quote">';
                zhou_quote = true;
            }
            zhou_html += zhou_trim.replace(/^&gt;\s?/, '') + '<br />';
            continue;
        }
        zhou_close_quote();

        /* 有序列表 */
        var zhou_ol = zhou_trim.match(/^(\d+)[.)]\s+(.*)$/);
        if (zhou_ol) {
            if (zhou_list_type !== 'ol') {
                zhou_close_list();
                zhou_html += '<ol class="zhou_md_ol">';
                zhou_list_type = 'ol';
            }
            zhou_html += '<li>' + zhou_ol[2] + '</li>';
            continue;
        }

        /* 无序列表 */
        var zhou_ul = zhou_trim.match(/^[-*+]\s+(.*)$/);
        if (zhou_ul) {
            if (zhou_list_type !== 'ul') {
                zhou_close_list();
                zhou_html += '<ul class="zhou_md_ul">';
                zhou_list_type = 'ul';
            }
            zhou_html += '<li>' + zhou_ul[1] + '</li>';
            continue;
        }

        /* 普通段落 */
        zhou_close_list();
        zhou_html += '<p class="zhou_md_p">' + zhou_line + '</p>';
    }
    zhou_close_list();
    zhou_close_quote();

    /* 4. 回填代码块 */
    zhou_html = zhou_html.replace(/\u0000BLOCK(\d+)\u0000/g, function (all, n) {
        return zhou_blocks[Number(n)];
    });

    return zhou_html;
}