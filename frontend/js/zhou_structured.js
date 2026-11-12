/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_structured.js —— 结构化输出页面逻辑（评论情感分类）
 * 规则：服务器返回的数据与错误信息全部输出到浏览器控制台。
 */

'use strict';

var ZHOU_SAMPLES = [
    '卖家很靠谱，耳机降噪效果超出预期，续航也很给力，第二天就收到货了。',
    '自行车刹车有点松，骑起来不太敢骑快，价格倒是挺便宜的。',
    '教材是影印版，印刷有点糊，但内容完整没有缺页，卖家爽快，当面交易很方便。'
];

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('structured');
    document.getElementById('zhou_analyze').addEventListener('click', zhou_analyze);
    document.getElementById('zhou_sample').addEventListener('click', function () {
        var zhou_i = Math.floor(Math.random() * ZHOU_SAMPLES.length);
        document.getElementById('zhou_text').value = ZHOU_SAMPLES[zhou_i];
        console.log('[structured] 填入示例：', ZHOU_SAMPLES[zhou_i]);
    });
});

/** 调用结构化解析接口 */
function zhou_analyze() {
    var zhou_text = document.getElementById('zhou_text').value.trim();
    if (!zhou_text) {
        zhou_tip('zhou_tip', '请输入评论内容', 'err');
        console.warn('[structured] 输入为空');
        return;
    }
    console.log('[structured] 发送的提示词内容（评论）：', zhou_text);
    zhou_tip('zhou_tip', '模型分析中，请稍候…', 'info');

    zhou_request('/ai/structured', 'POST', { zhou_text: zhou_text }).then(function (res) {
        console.log('[structured] 接收数据：', res.data);
        zhou_tip('zhou_tip', '解析完成' + (res.data.zhou_retry ? '（重试 ' + res.data.zhou_retry + ' 次后成功）' : ''), 'ok');
        zhou_show_result(res.data);
    }).catch(function (e) {
        console.error('[structured] 请求失败：', e);
        zhou_tip('zhou_tip', e.msg || '请求失败', 'err');
    });
}

/** 渲染结构化结果 */
function zhou_show_result(zhou_data) {
    var zhou_r = zhou_data.zhou_result || {};
    var zhou_label = { positive: '正面', neutral: '中性', negative: '负面' };
    var zhou_cls = { positive: '#16a34a', neutral: '#f59e0b', negative: '#dc2626' };
    var zhou_html = '<div class="zhou_kb_chunk" style="border-left-color:' + (zhou_cls[zhou_r.zhou_sentiment] || '#c7d2fe') + '">' +
        '<div class="zhou_kb_chunk_head">情感极性：<b style="color:' + (zhou_cls[zhou_r.zhou_sentiment] || '#334155') + '">' +
        (zhou_label[zhou_r.zhou_sentiment] || zhou_r.zhou_sentiment) + '</b>　置信度：' + zhou_r.zhou_confidence +
        (zhou_r.zhou_need_review ? '　<span style="color:#dc2626">需人工复核</span>' : '') + '</div>' +
        '<div class="zhou_kb_chunk_body">摘要：' + zhou_md_escape(zhou_r.zhou_summary) + '</div></div>';

    zhou_html += '<div class="zhou_kb_row"><b>涉及维度</b>' +
        (zhou_r.zhou_aspects && zhou_r.zhou_aspects.length
            ? zhou_r.zhou_aspects.map(function (a) { return '<span class="zhou_kb_tag">' + zhou_md_escape(a) + '</span>'; }).join('')
            : '<span class="zhou_kb_tag">无</span>') + '</div>';

    zhou_html += '<div class="zhou_kb_row"><b>抽取实体</b>' +
        (zhou_r.zhou_entities && zhou_r.zhou_entities.length
            ? zhou_r.zhou_entities.map(function (e) {
                return '<span class="zhou_kb_tag">' + zhou_md_escape(e.zhou_name) + '（' + zhou_md_escape(e.zhou_type) + '）</span>';
            }).join('')
            : '<span class="zhou_kb_tag">无</span>') + '</div>';

    zhou_html += '<h3 style="font-size:14px;margin:16px 0 6px">标准 JSON</h3>' +
        '<pre class="zhou_code"><code>' + zhou_md_escape(JSON.stringify(zhou_r, null, 2)) + '</code></pre>';

    if (zhou_data.zhou_error) {
        zhou_html += '<div class="zhou_tip zhou_tip_show zhou_tip_err">兜底原因：' + zhou_md_escape(zhou_data.zhou_error) + '</div>';
    }

    document.getElementById('zhou_result').innerHTML = zhou_html;
    document.getElementById('zhou_raw').innerHTML = zhou_data.zhou_raw
        ? '<pre class="zhou_code"><code>' + zhou_md_escape(zhou_data.zhou_raw) + '</code></pre>'
        : '（本次未产出原始文本）';
}