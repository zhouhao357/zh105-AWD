/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）
 *
 * zhou_llm.js —— 大模型调用封装（SiliconFlow 兼容 OpenAI 协议）
 * 凭据来自 backend/.env：LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
 * 该 key 属于私密凭据，只允许出现在 .env 中，禁止写入代码与文档。
 */

'use strict';

const LLM_BASE = process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1';
const LLM_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-V4-Flash';
const LLM_TIMEOUT = Number(process.env.LLM_TIMEOUT) || 45000;

/** 是否已配置密钥 */
function zhou_llm_ready() {
    return !!LLM_KEY;
}

/**
 * 调用大模型对话接口
 * @param {Array} zhou_messages 消息数组 [{ role, content }]
 * @param {Object} zhou_options 可选参数 temperature / max_tokens
 * @returns {Promise<Object>} { zhou_answer, zhou_model, zhou_usage }
 */
async function zhou_chat(zhou_messages, zhou_options) {
    if (!LLM_KEY) {
        throw new Error('未配置 LLM_API_KEY，请在 backend/.env 中填写大模型密钥');
    }
    const zhou_opt = zhou_options || {};
    const zhou_body = {
        model: zhou_opt.zhou_model || LLM_MODEL,
        messages: zhou_messages,
        temperature: zhou_opt.zhou_temperature === undefined ? 0.7 : zhou_opt.zhou_temperature,
        max_tokens: zhou_opt.zhou_max_tokens || 800,
        stream: false
    };

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

/** 当前模型名（用于前端展示，不泄露密钥） */
function zhou_llm_model() {
    return LLM_MODEL;
}

module.exports = {
    zhou_chat,
    zhou_llm_ready,
    zhou_llm_model
};