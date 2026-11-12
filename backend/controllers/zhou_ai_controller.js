/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）
 *
 * zhou_ai_controller.js —— 智能客服（知识库 + 大模型）控制器
 * 对应 18-6 流程图：意图识别 → 混合检索 → 重排 → 大模型生成 → 引用溯源
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_need } = require('../utils/zhou_util');
const { zhou_chat, zhou_llm_ready, zhou_llm_model } = require('../utils/zhou_llm');
const zhou_kb_model = require('../models/zhou_kb_model');

/** 智能客服系统提示词 */
const ZHOU_SYSTEM_PROMPT = [
    '你是"校园二手集市"平台的智能客服，服务对象是本校大学生。你需要基于给定的平台商品与公告知识回答用户问题。',
    '回答要求：',
    '1. 只使用知识库中出现的商品与公告信息，不要编造不存在的商品、价格或联系方式；',
    '2. 若知识库没有相关信息，就明确说明"平台上暂时没有相关商品"，并给出相近的商品建议或引导用户换个关键词；',
    '3. 语气亲切、简洁，适合大学生阅读，回答控制在 200 字以内；',
    '4. 涉及价格时必须写明具体金额，涉及交易地点时必须写明具体地点。'
].join('\n');

/** POST /api/ai/chat 智能客服问答 */
async function zhou_ai_chat(req, res) {
    const zhou_body = req.body || {};
    const zhou_missing = zhou_need(zhou_body, ['zhou_question']);
    if (zhou_missing.length) {
        return zhou_fail(res, 400, '缺少必填参数：' + zhou_missing.join(', '));
    }
    if (typeof zhou_body.zhou_question !== 'string') {
        return zhou_fail(res, 400, '参数 zhou_question 必须是字符串');
    }
    const zhou_question = zhou_body.zhou_question.trim();
    if (!zhou_question) {
        return zhou_fail(res, 400, '问题不能为空');
    }
    if (zhou_question.length > 500) {
        return zhou_fail(res, 400, '问题长度不能超过 500 字');
    }
    if (!zhou_llm_ready()) {
        return zhou_fail(res, 500, '大模型未配置：请在 backend/.env 中填写 LLM_API_KEY');
    }

    const zhou_start = Date.now();

    /* 1. 混合检索：商品库（词表反查 + LIKE 召回 + 重排）+ 公告库 */
    const zhou_kb = await zhou_kb_model.zhou_search_goods(zhou_question, 5);
    const zhou_goods = zhou_kb.zhou_list;
    const zhou_notices = await zhou_kb_model.zhou_search_notices(zhou_question, 2);
    const zhou_categories = await zhou_kb_model.zhou_list_category_brief();

    /* 2. 构建知识上下文 */
    const zhou_context = [];
    if (zhou_goods.length) {
        zhou_context.push('【在售商品】');
        zhou_goods.forEach(function (g, i) {
            zhou_context.push(
                (i + 1) + '. ' + g.zhou_title + '｜价格 ' + Number(g.zhou_price).toFixed(2) + ' 元｜成色 ' + g.zhou_condition +
                '｜分类 ' + (g.zhou_cate_name || '其他') + '｜交易地点 ' + (g.zhou_trade_place || '待协商') +
                '｜卖家 ' + (g.zhou_nickname || '') + '（' + (g.zhou_college || '') + '）｜描述：' + (g.zhou_description || '')
            );
        });
    }
    if (zhou_notices.length) {
        zhou_context.push('【相关公告】');
        zhou_notices.forEach(function (n) {
            zhou_context.push('- ' + n.zhou_title + '：' + n.zhou_content);
        });
    }
    if (!zhou_goods.length && !zhou_notices.length) {
        zhou_context.push('【知识库】本次检索没有命中任何商品或公告。');
    }
    zhou_context.push('【平台商品分类】' + zhou_categories.map(function (c) {
        return c.zhou_cate_name;
    }).join('、'));

    /* 3. 大模型生成（带知识库上下文） */
    const zhou_messages = [
        { role: 'system', content: ZHOU_SYSTEM_PROMPT },
        { role: 'user', content: '平台知识库：\n' + zhou_context.join('\n') + '\n\n用户问题：' + zhou_question }
    ];

    let zhou_result;
    try {
        zhou_result = await zhou_chat(zhou_messages, { zhou_temperature: 0.7, zhou_max_tokens: 800 });
    } catch (e) {
        console.error('[zhou_ai] 大模型调用失败：' + e.message);
        return zhou_fail(res, 502, '大模型调用失败：' + e.message);
    }

    const zhou_elapsed = Date.now() - zhou_start;
    return zhou_success(res, {
        zhou_question: zhou_question,
        zhou_answer: zhou_result.zhou_answer,
        zhou_model: zhou_result.zhou_model,
        zhou_elapsed: zhou_elapsed,
        zhou_usage: zhou_result.zhou_usage,
        zhou_prompt: zhou_messages,
        zhou_refs: zhou_goods.map(function (g) {
            return {
                zhou_goods_id: g.zhou_goods_id,
                zhou_title: g.zhou_title,
                zhou_price: Number(g.zhou_price),
                zhou_cate_name: g.zhou_cate_name,
                zhou_trade_place: g.zhou_trade_place,
                zhou_score: g.zhou_score
            };
        }),
        zhou_debug: {
            zhou_keywords: zhou_kb.zhou_keywords,
            zhou_candidates: zhou_kb.zhou_candidates,
            zhou_vocab_size: zhou_kb.zhou_vocab_size
        },
        zhou_notices: zhou_notices.map(function (n) {
            return { zhou_title: n.zhou_title, zhou_notice_type: n.zhou_notice_type };
        })
    }, '智能客服回答成功');
}

/** GET /api/ai/model 获取当前大模型信息 */
async function zhou_ai_model(req, res) {
    return zhou_success(res, {
        zhou_ready: zhou_llm_ready(),
        zhou_model: zhou_llm_model()
    }, '获取大模型信息成功');
}

module.exports = {
    zhou_ai_chat,
    zhou_ai_model
};