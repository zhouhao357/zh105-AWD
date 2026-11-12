/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_structured_controller.js —— Harness Engineering：结构化输出控制器
 * 任务：将自然语言评论转换为固定结构的 JSON
 * 流程：定义 JSON 结构 → 提示词 + 少样本示例 → 模型生成 → JSON 解析
 *       → 字段与类型校验 → 失败重试 → 兜底结果
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_chat, zhou_llm_ready } = require('../utils/zhou_llm');

/** 约定的输出 JSON 结构（同时作为提示词与校验基准） */
const ZHOU_SENTIMENT_SCHEMA = {
    zhou_sentiment: 'positive | neutral | negative',
    zhou_confidence: '0~1 之间的小数',
    zhou_aspects: '涉及的评论维度数组，如 ["物流","包装"]',
    zhou_entities: '实体数组，元素为 { zhou_name, zhou_type }',
    zhou_summary: '一句话摘要',
    zhou_need_review: '低置信度时置 true 标记人工复核'
};

/** 系统提示词：角色 + 任务 + 输出格式 + 少样本示例 */
const ZHOU_SENTIMENT_PROMPT = [
    '你是"校园二手集市"的评论分析引擎，负责把用户评价转换成固定结构的 JSON。',
    '',
    '【输出格式】只输出一个 JSON 对象，不要输出任何解释文字、不要使用 Markdown 代码块包裹：',
    '{',
    '  "zhou_sentiment": "positive | neutral | negative",',
    '  "zhou_confidence": 0.93,',
    '  "zhou_aspects": ["物流", "包装"],',
    '  "zhou_entities": [{ "zhou_name": "索尼", "zhou_type": "brand" }],',
    '  "zhou_summary": "整体满意，物流较慢。",',
    '  "zhou_need_review": false',
    '}',
    '',
    '【字段约束】',
    '1. zhou_sentiment 只能是 positive、neutral、negative 三者之一；',
    '2. zhou_confidence 为 0 到 1 之间的小数；',
    '3. zhou_aspects 是评价涉及的维度数组，没有则给空数组；',
    '4. zhou_entities 中 zhou_type 只能是 brand、model、price、place、person、other；',
    '5. zhou_summary 为不超过 40 字的一句话；',
    '6. zhou_confidence 小于 0.6 时 zhou_need_review 必须为 true。',
    '',
    '【示例一】',
    '评论：卖家很靠谱，耳机降噪效果超出预期，续航也很给力，第二天就收到货了。',
    '{ "zhou_sentiment": "positive", "zhou_confidence": 0.95, "zhou_aspects": ["商品质量", "物流"], "zhou_entities": [{ "zhou_name": "耳机", "zhou_type": "other" }], "zhou_summary": "卖家靠谱，耳机降噪与续航超出预期。", "zhou_need_review": false }',
    '',
    '【示例二】',
    '评论：自行车刹车有点松，骑起来不太敢骑快，价格倒是挺便宜的。',
    '{ "zhou_sentiment": "neutral", "zhou_confidence": 0.72, "zhou_aspects": ["商品质量", "价格"], "zhou_entities": [{ "zhou_name": "自行车", "zhou_type": "other" }], "zhou_summary": "刹车偏松但价格便宜，整体评价中立。", "zhou_need_review": false }'
].join('\n');

/** 从模型输出中提取 JSON 文本 */
function zhou_extract_json(zhou_text) {
    const zhou_s = String(zhou_text || '').trim();
    if (!zhou_s) return '';
    const zhou_clean = zhou_s.replace(/```json/gi, '').replace(/```/g, '').trim();
    const zhou_start = zhou_clean.indexOf('{');
    const zhou_end = zhou_clean.lastIndexOf('}');
    if (zhou_start < 0 || zhou_end <= zhou_start) {
        return zhou_clean;
    }
    return zhou_clean.slice(zhou_start, zhou_end + 1);
}
/** 校验并归一化模型返回的结构 */
function zhou_validate(zhou_json) {
    const zhou_errors = [];
    if (!zhou_json || typeof zhou_json !== 'object' || Array.isArray(zhou_json)) {
        return { zhou_ok: false, zhou_errors: ['返回值不是 JSON 对象'], zhou_data: null };
    }
    const zhou_out = {};

    const zhou_sent = String(zhou_json.zhou_sentiment || '').toLowerCase();
    if (['positive', 'neutral', 'negative'].indexOf(zhou_sent) < 0) {
        zhou_errors.push('zhou_sentiment 取值非法：' + zhou_json.zhou_sentiment);
    }
    zhou_out.zhou_sentiment = zhou_sent;

    const zhou_conf = Number(zhou_json.zhou_confidence);
    if (isNaN(zhou_conf) || zhou_conf < 0 || zhou_conf > 1) {
        zhou_errors.push('zhou_confidence 必须是 0~1 的数值：' + zhou_json.zhou_confidence);
        zhou_out.zhou_confidence = 0;
    } else {
        zhou_out.zhou_confidence = Math.round(zhou_conf * 100) / 100;
    }

    zhou_out.zhou_aspects = Array.isArray(zhou_json.zhou_aspects)
        ? zhou_json.zhou_aspects.map(function (a) { return String(a); })
        : [];
    if (!Array.isArray(zhou_json.zhou_aspects)) {
        zhou_errors.push('zhou_aspects 必须是数组');
    }

    zhou_out.zhou_entities = [];
    if (Array.isArray(zhou_json.zhou_entities)) {
        zhou_json.zhou_entities.forEach(function (e) {
            if (e && typeof e === 'object' && e.zhou_name) {
                zhou_out.zhou_entities.push({
                    zhou_name: String(e.zhou_name),
                    zhou_type: String(e.zhou_type || 'other')
                });
            } else {
                zhou_errors.push('实体格式非法：' + JSON.stringify(e));
            }
        });
    } else {
        zhou_errors.push('zhou_entities 必须是数组');
    }

    zhou_out.zhou_summary = String(zhou_json.zhou_summary || '').slice(0, 80);
    if (!zhou_out.zhou_summary) {
        zhou_errors.push('zhou_summary 不能为空');
    }

    zhou_out.zhou_need_review = zhou_json.zhou_need_review === true || zhou_out.zhou_confidence < 0.6;

    return {
        zhou_ok: zhou_errors.length === 0,
        zhou_errors: zhou_errors,
        zhou_data: zhou_out
    };
}

/** POST /api/ai/structured 评论情感分类（结构化 JSON 输出） */
async function zhou_ai_structured(req, res) {
    const zhou_body = req.body || {};
    const zhou_text = zhou_body.zhou_text || zhou_body.zhou_comment;
    if (typeof zhou_text !== 'string' || !zhou_text.trim()) {
        return zhou_fail(res, 400, '缺少必填参数：zhou_text');
    }
    if (zhou_text.length > 1000) {
        return zhou_fail(res, 400, '评论长度不能超过 1000 字');
    }
    if (!zhou_llm_ready()) {
        return zhou_fail(res, 500, '大模型未配置：请在 backend/.env 中填写 LLM_API_KEY');
    }

    const zhou_messages = [
        { role: 'system', content: ZHOU_SENTIMENT_PROMPT },
        { role: 'user', content: '评论：' + zhou_text.trim() }
    ];

    let zhou_last_error = '';
    for (let zhou_try = 1; zhou_try <= 2; zhou_try++) {
        let zhou_raw = '';
        try {
            const zhou_r = await zhou_chat(zhou_messages, { zhou_temperature: 0.2, zhou_max_tokens: 500 });
            zhou_raw = zhou_r.zhou_answer || '';
            console.log('[zhou_structured] 第 ' + zhou_try + ' 次模型输出：', zhou_raw);
            let zhou_json = null;
            try {
                zhou_json = JSON.parse(zhou_extract_json(zhou_raw));
            } catch (e) {
                zhou_last_error = 'JSON 解析失败：' + e.message;
                continue;
            }
            const zhou_check = zhou_validate(zhou_json);
            if (zhou_check.zhou_ok) {
                return zhou_success(res, {
                    zhou_result: zhou_check.zhou_data,
                    zhou_raw: zhou_raw,
                    zhou_retry: zhou_try - 1,
                    zhou_schema: ZHOU_SENTIMENT_SCHEMA
                }, '结构化解析成功');
            }
            zhou_last_error = zhou_check.zhou_errors.join('；');
            zhou_messages.push({ role: 'assistant', content: zhou_raw });
            zhou_messages.push({ role: 'user', content: '上一次输出不合法（' + zhou_last_error + '），请只重新输出符合约定的 JSON 对象。' });
        } catch (e) {
            zhou_last_error = e.message;
        }
    }

    return zhou_success(res, {
        zhou_result: {
            zhou_sentiment: 'neutral',
            zhou_confidence: 0,
            zhou_aspects: [],
            zhou_entities: [],
            zhou_summary: '模型输出无法解析，已置为待人工复核。',
            zhou_need_review: true
        },
        zhou_raw: '',
        zhou_retry: 2,
        zhou_error: zhou_last_error,
        zhou_schema: ZHOU_SENTIMENT_SCHEMA
    }, '结构化解析失败，已返回兜底结果');
}

module.exports = {
    zhou_ai_structured,
    zhou_validate,
    zhou_extract_json,
    ZHOU_SENTIMENT_SCHEMA
};