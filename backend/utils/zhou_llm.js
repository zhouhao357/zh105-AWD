/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_llm.js —— 大模型调用封装（SiliconFlow 兼容 OpenAI 协议）
 * 凭据来自 backend/.env：LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
 * 该 key 属于私密凭据，只允许出现在 .env 中，禁止写入代码与文档。
 *
 * 能力：
 *   1. zhou_chat        —— 非流式对话（一次性返回完整文本）
 *   2. zhou_chat_stream —— 流式对话（SSE 增量推送，支持前端中断）
 *   3. zhou_models      —— 拉取平台可用模型列表（用于模型切换）
 *   4. zhou_cost        —— 按 token 用量估算费用（选做任务）
 *   5. zhou_estimate    —— 粗略估算文本 token 数（上下文预算控制）
 */

'use strict';

const LLM_BASE = process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1';
const LLM_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-V4-Flash';
const LLM_TIMEOUT = Number(process.env.LLM_TIMEOUT) || 45000;

/* 费用估算单价（元 / 百万 token），可用 .env 覆盖 */
const LLM_PRICE_IN = Number(process.env.LLM_PRICE_INPUT || 2);
const LLM_PRICE_OUT = Number(process.env.LLM_PRICE_OUTPUT || 8);

/** 是否已配置密钥 */
function zhou_llm_ready() {
    return !!LLM_KEY;
}

/** 当前默认模型 */
function zhou_llm_model() {
    return LLM_MODEL;
}

/**
 * 粗略估算 token 数：中文按字计，英文按 4 字符计
 * 用于在没有 usage 反馈时做上下文预算控制
 */
function zhou_estimate(zhou_text) {
    const zhou_s = String(zhou_text || '');
    let zhou_cn = 0;
    let zhou_en = 0;
    for (const zhou_ch of zhou_s) {
        if (/[\u4e00-\u9fa5]/.test(zhou_ch)) zhou_cn++;
        else zhou_en++;
    }
    return zhou_cn + Math.ceil(zhou_en / 4);
}

/** 组装请求体 */
function zhou_build_body(zhou_messages, zhou_opt) {
    return {
        model: zhou_opt.zhou_model || LLM_MODEL,
        messages: zhou_messages,
        temperature: zhou_opt.zhou_temperature === undefined ? 0.7 : zhou_opt.zhou_temperature,
        max_tokens: zhou_opt.zhou_max_tokens || 800,
        stream: !!zhou_opt.zhou_stream
    };
}
/**
 * 调用大模型对话接口（非流式）
 * @returns {Promise<Object>} { zhou_answer, zhou_model, zhou_usage }
 */
async function zhou_chat(zhou_messages, zhou_options) {
    if (!LLM_KEY) {
        throw new Error('未配置 LLM_API_KEY，请在 backend/.env 中填写大模型密钥');
    }
    const zhou_opt = zhou_options || {};
    const zhou_body = zhou_build_body(zhou_messages, zhou_opt);

    const zhou_res = await fetch(LLM_BASE + '/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + LLM_KEY
        },
        body: JSON.stringify(zhou_body),
        signal: AbortSignal.timeout(LLM_TIMEOUT)
    });

    const zhou_json = await zhou_res.json().catch(function () {
        return {};
    });
    if (!zhou_res.ok) {
        const zhou_msg = (zhou_json.error && zhou_json.error.message) || ('大模型接口返回 HTTP ' + zhou_res.status);
        throw new Error(zhou_msg);
    }
    if (!zhou_json.choices || !zhou_json.choices.length) {
        throw new Error('大模型未返回有效结果');
    }
    return {
        zhou_answer: zhou_json.choices[0].message.content,
        zhou_model: zhou_json.model || zhou_body.model,
        zhou_usage: zhou_json.usage || {}
    };
}

/**
 * 调用大模型对话接口（流式）
 * @param {Function} zhou_on_delta 每次收到增量文本时回调
 * @returns {Promise<Object>} { zhou_answer, zhou_model, zhou_usage }
 */
async function zhou_chat_stream(zhou_messages, zhou_options, zhou_on_delta) {
    if (!LLM_KEY) {
        throw new Error('未配置 LLM_API_KEY，请在 backend/.env 中填写大模型密钥');
    }
    const zhou_opt = zhou_options || {};
    const zhou_body = zhou_build_body(zhou_messages, zhou_opt);
    /* 流式必须显式置位，否则上游会拒绝 stream_options */
    zhou_body.stream = true;
    zhou_body.stream_options = { include_usage: true };

    const zhou_res = await fetch(LLM_BASE + '/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + LLM_KEY
        },
        body: JSON.stringify(zhou_body),
        signal: AbortSignal.timeout(LLM_TIMEOUT)
    });

    if (!zhou_res.ok || !zhou_res.body) {
        const zhou_txt = await zhou_res.text().catch(function () { return ''; });
        throw new Error('大模型接口返回 HTTP ' + zhou_res.status + '：' + zhou_txt.slice(0, 200));
    }

    const zhou_reader = zhou_res.body.getReader();
    const zhou_decoder = new TextDecoder('utf-8');
    let zhou_buf = '';
    let zhou_full = '';
    let zhou_usage = {};
    let zhou_model = zhou_body.model;

    while (true) {
        const zhou_chunk = await zhou_reader.read();
        if (zhou_chunk.done) break;
        zhou_buf += zhou_decoder.decode(zhou_chunk.value, { stream: true });
        const zhou_lines = zhou_buf.split('\n');
        zhou_buf = zhou_lines.pop();
        for (const zhou_line of zhou_lines) {
            const zhou_trim = zhou_line.trim();
            if (!zhou_trim || zhou_trim.indexOf('data:') !== 0) continue;
            const zhou_payload = zhou_trim.slice(5).trim();
            if (zhou_payload === '[DONE]') continue;
            let zhou_json;
            try {
                zhou_json = JSON.parse(zhou_payload);
            } catch (e) {
                continue;
            }
            if (zhou_json.model) zhou_model = zhou_json.model;
            if (zhou_json.usage) zhou_usage = zhou_json.usage;
            const zhou_delta = zhou_json.choices && zhou_json.choices[0] && zhou_json.choices[0].delta;
            const zhou_piece = zhou_delta && zhou_delta.content ? zhou_delta.content : '';
            if (zhou_piece) {
                zhou_full += zhou_piece;
                if (typeof zhou_on_delta === 'function') zhou_on_delta(zhou_piece);
            }
        }
    }

    return {
        zhou_answer: zhou_full,
        zhou_model: zhou_model,
        zhou_usage: zhou_usage
    };
}
/** 拉取平台可用模型列表（供前端切换模型） */
async function zhou_models() {
    if (!LLM_KEY) {
        throw new Error('未配置 LLM_API_KEY，无法获取模型列表');
    }
    const zhou_res = await fetch(LLM_BASE + '/models', {
        headers: { 'Authorization': 'Bearer ' + LLM_KEY },
        signal: AbortSignal.timeout(15000)
    });
    const zhou_json = await zhou_res.json().catch(function () { return {}; });
    if (!zhou_res.ok) {
        throw new Error('获取模型列表失败：HTTP ' + zhou_res.status);
    }
    const zhou_list = (zhou_json.data || []).map(function (m) {
        return { zhou_id: m.id, zhou_owned: m.owned_by || '' };
    });
    return zhou_list;
}

/** 按 token 用量估算费用（元） */
function zhou_cost(zhou_usage, zhou_model) {
    const zhou_u = zhou_usage || {};
    const zhou_in = Number(zhou_u.prompt_tokens || 0);
    const zhou_out = Number(zhou_u.completion_tokens || 0);
    const zhou_money = (zhou_in / 1000000) * LLM_PRICE_IN + (zhou_out / 1000000) * LLM_PRICE_OUT;
    return {
        zhou_model: zhou_model || LLM_MODEL,
        zhou_prompt_tokens: zhou_in,
        zhou_completion_tokens: zhou_out,
        zhou_total_tokens: Number(zhou_u.total_tokens || (zhou_in + zhou_out)),
        zhou_cost_yuan: Math.round(zhou_money * 10000) / 10000,
        zhou_price_in: LLM_PRICE_IN,
        zhou_price_out: LLM_PRICE_OUT
    };
}

module.exports = {
    zhou_chat,
    zhou_chat_stream,
    zhou_models,
    zhou_cost,
    zhou_estimate,
    zhou_llm_ready,
    zhou_llm_model
};