/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_ai_controller.js —— 智能客服控制器（多轮上下文 + 知识库 RAG + 大模型生成）
 * 链路：意图识别 → 混合检索（商品/公告/知识库切片）→ 重排 → 上下文组装
 *       → Token 预算压缩 → 大模型生成 → 引用溯源 → 会话落库
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const { zhou_need } = require('../utils/zhou_util');
const { zhou_chat, zhou_chat_stream, zhou_models, zhou_cost, zhou_estimate, zhou_llm_ready, zhou_llm_model } = require('../utils/zhou_llm');
const zhou_kb_model = require('../models/zhou_kb_model');
const zhou_session_model = require('../models/zhou_session_model');

/* 上下文控制参数 */
const ZHOU_KEEP_ROUNDS = Number(process.env.LLM_KEEP_ROUNDS || 6);   // 保留最近 N 轮原文
const ZHOU_CTX_BUDGET = Number(process.env.LLM_CTX_BUDGET || 4000);  // 上下文 Token 预算

/** 智能客服系统提示词 */
const ZHOU_SYSTEM_PROMPT = [
    '你是"校园二手集市"平台的智能客服，服务对象是本校大学生。你需要基于给定的平台商品、公告与知识库资料回答用户问题。',
    '回答要求：',
    '1. 只使用知识库中出现的商品、公告与资料信息，不要编造不存在的商品、价格或联系方式；',
    '2. 若知识库没有相关信息，就明确说明"平台上暂时没有相关商品"，并给出相近的商品建议或引导用户换个关键词；',
    '3. 语气亲切、简洁，适合大学生阅读，回答控制在 200 字以内；',
    '4. 涉及价格时必须写明具体金额，涉及交易地点时必须写明具体地点；',
    '5. 若提供了历史对话摘要，请结合摘要理解"它""上一个"等指代；',
    '6. 若需要给出操作步骤，使用有序列表，便于阅读。'
].join('\n');

/** 摘要压缩用的系统提示词 */
const ZHOU_SUMMARY_PROMPT = '请把下面的多轮对话压缩成不超过 120 字的摘要，保留用户关注的商品、价格、地点与结论，丢弃寒暄与重复内容，只输出摘要正文。';

/**
 * 生成对话摘要（LLM 失败时退化为截断拼接）
 */
async function zhou_summarize(zhou_text) {
    if (!zhou_text) return '';
    try {
        const zhou_r = await zhou_chat([
            { role: 'system', content: ZHOU_SUMMARY_PROMPT },
            { role: 'user', content: zhou_text }
        ], { zhou_temperature: 0.3, zhou_max_tokens: 220 });
        if (zhou_r.zhou_answer && zhou_r.zhou_answer.trim()) {
            return zhou_r.zhou_answer.trim();
        }
    } catch (e) {
        console.error('[zhou_ai] 摘要生成失败，改用截断方式：' + e.message);
    }
    return zhou_text.slice(0, 300);
}

/**
 * 组装多轮上下文：保留最近 N 轮原文，更早的内容压缩为摘要
 */
async function zhou_prepare_context(zhou_session_id) {
    const zhou_session = await zhou_session_model.zhou_session_detail(zhou_session_id);
    if (!zhou_session) {
        return { zhou_summary: '', zhou_recent: [], zhou_compressed: 0, zhou_total_history: 0 };
    }
    const zhou_history = await zhou_session_model.zhou_session_messages(zhou_session_id);
    const zhou_keep = ZHOU_KEEP_ROUNDS * 2;
    const zhou_done = Number(zhou_session.zhou_summarized_count || 0);
    const zhou_tail_start = Math.max(zhou_done, zhou_history.length - zhou_keep);
    const zhou_early = zhou_history.slice(zhou_done, zhou_tail_start);
    const zhou_recent = zhou_history.slice(zhou_tail_start);

    let zhou_summary = zhou_session.zhou_summary || '';
    let zhou_compressed = 0;

    if (zhou_early.length) {
        const zhou_early_text = zhou_early.map(function (m) {
            return (m.zhou_role === 'user' ? '用户：' : '助手：') + m.zhou_content;
        }).join('\n');
        const zhou_new = await zhou_summarize(zhou_early_text);
        zhou_summary = zhou_summary ? zhou_summary + '\n' + zhou_new : zhou_new;
        zhou_compressed = zhou_early.length;
        await zhou_session_model.zhou_session_touch(zhou_session_id, {
            zhou_summary: zhou_summary,
            zhou_summarized_count: zhou_tail_start
        });
    }

    /* Token 预算控制：近期原文超预算时从最旧的一条开始丢弃 */
    const zhou_use = zhou_recent.slice();
    while (zhou_use.length > 2 && zhou_use.reduce(function (sum, m) {
        return sum + zhou_estimate(m.zhou_content);
    }, 0) > ZHOU_CTX_BUDGET) {
        zhou_use.shift();
    }

    return {
        zhou_summary: zhou_summary,
        zhou_recent: zhou_use,
        zhou_compressed: zhou_compressed,
        zhou_total_history: zhou_history.length
    };
}
/**
 * 检索知识：商品库 + 公告库 + 知识库切片
 */
async function zhou_retrieve(zhou_question) {
    const zhou_goods_kb = await zhou_kb_model.zhou_search_goods(zhou_question, 5);
    const zhou_notices = await zhou_kb_model.zhou_search_notices(zhou_question, 2);
    const zhou_chunks = await zhou_kb_model.zhou_search_chunks(zhou_question, 3);
    const zhou_categories = await zhou_kb_model.zhou_list_category_brief();
    return {
        zhou_goods: zhou_goods_kb.zhou_list,
        zhou_keywords: zhou_goods_kb.zhou_keywords,
        zhou_candidates: zhou_goods_kb.zhou_candidates,
        zhou_vocab_size: zhou_goods_kb.zhou_vocab_size,
        zhou_notices: zhou_notices,
        zhou_chunks: zhou_chunks,
        zhou_categories: zhou_categories
    };
}

/** 把检索结果拼成知识上下文文本 */
function zhou_build_knowledge(zhou_kb) {
    const zhou_lines = [];
    if (zhou_kb.zhou_goods.length) {
        zhou_lines.push('【在售商品】');
        zhou_kb.zhou_goods.forEach(function (g, i) {
            zhou_lines.push(
                (i + 1) + '. ' + g.zhou_title + '｜价格 ' + Number(g.zhou_price).toFixed(2) + ' 元｜成色 ' + g.zhou_condition +
                '｜分类 ' + (g.zhou_cate_name || '其他') + '｜交易地点 ' + (g.zhou_trade_place || '待协商') +
                '｜卖家 ' + (g.zhou_nickname || '') + '（' + (g.zhou_college || '') + '）｜描述：' + (g.zhou_description || '')
            );
        });
    }
    if (zhou_kb.zhou_notices.length) {
        zhou_lines.push('【相关公告】');
        zhou_kb.zhou_notices.forEach(function (n) {
            zhou_lines.push('- ' + n.zhou_title + '：' + n.zhou_content);
        });
    }
    if (zhou_kb.zhou_chunks.length) {
        zhou_lines.push('【知识库资料】');
        zhou_kb.zhou_chunks.forEach(function (c, i) {
            zhou_lines.push(
                '资料' + (i + 1) + '（来源：' + (c.zhou_file_name || '知识库') + '）：' + String(c.zhou_content || '').replace(/\s+/g, ' ')
            );
        });
    }
    if (!zhou_kb.zhou_goods.length && !zhou_kb.zhou_notices.length && !zhou_kb.zhou_chunks.length) {
        zhou_lines.push('【知识库】本次检索没有命中任何商品、公告或资料。');
    }
    zhou_lines.push('【平台商品分类】' + zhou_kb.zhou_categories.map(function (c) {
        return c.zhou_cate_name;
    }).join('、'));
    return zhou_lines.join('\n');
}

/** 构造引用溯源数组（商品） */
function zhou_build_refs(zhou_kb) {
    return zhou_kb.zhou_goods.map(function (g) {
        return {
            zhou_goods_id: g.zhou_goods_id,
            zhou_title: g.zhou_title,
            zhou_price: Number(g.zhou_price),
            zhou_cate_name: g.zhou_cate_name,
            zhou_trade_place: g.zhou_trade_place,
            zhou_score: g.zhou_score
        };
    });
}

/** 构造引用溯源数组（知识库资料） */
function zhou_build_kb_refs(zhou_kb) {
    return zhou_kb.zhou_chunks.map(function (c) {
        return {
            zhou_doc_id: c.zhou_doc_id,
            zhou_file_name: c.zhou_file_name,
            zhou_chunk_index: c.zhou_chunk_index,
            zhou_excerpt: String(c.zhou_content || '').slice(0, 80)
        };
    });
}
/** POST /api/ai/chat 智能客服问答（支持多轮上下文与流式输出） */
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

    const zhou_user_id = Number(zhou_body.zhou_user_id) || 1;
    const zhou_model = zhou_body.zhou_model || zhou_llm_model();
    const zhou_stream = zhou_body.zhou_stream === true;
    const zhou_start = Date.now();

    /* 1. 会话：没有会话号则自动新建 */
    let zhou_session_id = Number(zhou_body.zhou_session_id) || 0;
    let zhou_session = null;
    if (zhou_session_id) {
        zhou_session = await zhou_session_model.zhou_session_detail(zhou_session_id);
        if (!zhou_session) {
            return zhou_fail(res, 404, '会话不存在：' + zhou_session_id);
        }
    } else {
        zhou_session_id = await zhou_session_model.zhou_session_create(zhou_user_id, '新的对话', zhou_model);
        zhou_session = await zhou_session_model.zhou_session_detail(zhou_session_id);
    }

    /* 2. 多轮上下文（早期消息压缩为摘要） */
    const zhou_ctx = await zhou_prepare_context(zhou_session_id);

    /* 3. 知识检索 */
    const zhou_kb = await zhou_retrieve(zhou_question);
    const zhou_knowledge = zhou_build_knowledge(zhou_kb);

    /* 4. 组装 messages：系统提示 + 摘要 + 知识 + 历史 + 当前问题 */
    const zhou_system = ZHOU_SYSTEM_PROMPT +
        (zhou_ctx.zhou_summary ? '\n\n【历史对话摘要】\n' + zhou_ctx.zhou_summary : '') +
        '\n\n【平台知识库】\n' + zhou_knowledge;
    const zhou_messages = [{ role: 'system', content: zhou_system }];
    zhou_ctx.zhou_recent.forEach(function (m) {
        zhou_messages.push({ role: m.zhou_role, content: m.zhou_content });
    });
    zhou_messages.push({ role: 'user', content: zhou_question });

    console.log('[zhou_ai] 发送给大模型的提示词：', zhou_messages.map(function (m) {
        return m.role.toUpperCase() + ': ' + m.content;
    }).join('\n---\n'));

    /* 5. 调用大模型（流式 / 非流式） */
    if (zhou_stream) {
        return zhou_ai_stream(res, zhou_messages, {
            zhou_model: zhou_model,
            zhou_session_id: zhou_session_id,
            zhou_question: zhou_question,
            zhou_start: zhou_start,
            zhou_kb: zhou_kb
        });
    }

    let zhou_result;
    try {
        zhou_result = await zhou_chat(zhou_messages, { zhou_temperature: 0.7, zhou_max_tokens: 800, zhou_model: zhou_model });
    } catch (e) {
        console.error('[zhou_ai] 大模型调用失败：' + e.message);
        return zhou_fail(res, 502, '大模型调用失败：' + e.message);
    }

    const zhou_elapsed = Date.now() - zhou_start;
    const zhou_cost_info = zhou_cost(zhou_result.zhou_usage, zhou_result.zhou_model);

    /* 6. 会话落库 */
    await zhou_session_model.zhou_message_add(zhou_session_id, 'user', zhou_question, zhou_estimate(zhou_question), 0);
    await zhou_session_model.zhou_message_add(zhou_session_id, 'assistant', zhou_result.zhou_answer, zhou_cost_info.zhou_total_tokens, zhou_elapsed);
    await zhou_session_model.zhou_session_touch(zhou_session_id, {
        zhou_token_total: zhou_cost_info.zhou_total_tokens,
        zhou_message_count: 2,
        zhou_model: zhou_result.zhou_model
    });
    if (zhou_session && zhou_session.zhou_title === '新的对话') {
        await zhou_session_model.zhou_session_rename(zhou_session_id, zhou_question.slice(0, 24));
    }

    console.log('[zhou_ai] 收到的大模型回答：', zhou_result.zhou_answer);

    return zhou_success(res, {
        zhou_session_id: zhou_session_id,
        zhou_question: zhou_question,
        zhou_answer: zhou_result.zhou_answer,
        zhou_model: zhou_result.zhou_model,
        zhou_elapsed: zhou_elapsed,
        zhou_usage: zhou_result.zhou_usage,
        zhou_cost: zhou_cost_info,
        zhou_prompt: zhou_messages,
        zhou_summary: zhou_ctx.zhou_summary,
        zhou_context_rounds: zhou_ctx.zhou_recent.length,
        zhou_compressed: zhou_ctx.zhou_compressed,
        zhou_refs: zhou_build_refs(zhou_kb),
        zhou_kb_refs: zhou_build_kb_refs(zhou_kb),
        zhou_debug: {
            zhou_keywords: zhou_kb.zhou_keywords,
            zhou_candidates: zhou_kb.zhou_candidates,
            zhou_vocab_size: zhou_kb.zhou_vocab_size,
            zhou_chunk_hits: zhou_kb.zhou_chunks.length,
            zhou_notice_hits: zhou_kb.zhou_notices.length
        }
    }, '智能客服回答成功');
}
/**
 * 流式输出（SSE）：逐条推送增量文本，事件体沿用统一响应格式
 */
async function zhou_ai_stream(res, zhou_messages, zhou_ctx) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    const zhou_send = function (zhou_msg, zhou_data) {
        res.write('data: ' + JSON.stringify({ code: 0, msg: zhou_msg, data: zhou_data || {} }) + '\n\n');
    };

    let zhou_answer = '';
    let zhou_result = null;
    let zhou_failed = null;

    try {
        zhou_result = await zhou_chat_stream(zhou_messages, {
            zhou_temperature: 0.7,
            zhou_max_tokens: 800,
            zhou_model: zhou_ctx.zhou_model
        }, function (zhou_piece) {
            zhou_answer += zhou_piece;
            zhou_send('增量文本', { zhou_delta: zhou_piece });
        });
    } catch (e) {
        zhou_failed = e.message;
    }

    if (zhou_failed) {
        res.write('data: ' + JSON.stringify({ code: 502, msg: '大模型调用失败：' + zhou_failed, data: null }) + '\n\n');
        res.end();
        return;
    }

    const zhou_elapsed = Date.now() - zhou_ctx.zhou_start;
    const zhou_cost_info = zhou_cost(zhou_result.zhou_usage, zhou_result.zhou_model);

    await zhou_session_model.zhou_message_add(zhou_ctx.zhou_session_id, 'user', zhou_ctx.zhou_question, 0, 0);
    await zhou_session_model.zhou_message_add(zhou_ctx.zhou_session_id, 'assistant', zhou_result.zhou_answer, zhou_cost_info.zhou_total_tokens, zhou_elapsed);
    await zhou_session_model.zhou_session_touch(zhou_ctx.zhou_session_id, {
        zhou_token_total: zhou_cost_info.zhou_total_tokens,
        zhou_message_count: 2,
        zhou_model: zhou_result.zhou_model
    });

    zhou_send('完成', {
        zhou_session_id: zhou_ctx.zhou_session_id,
        zhou_answer: zhou_result.zhou_answer,
        zhou_model: zhou_result.zhou_model,
        zhou_elapsed: zhou_elapsed,
        zhou_usage: zhou_result.zhou_usage,
        zhou_cost: zhou_cost_info,
        zhou_refs: zhou_build_refs(zhou_ctx.zhou_kb),
        zhou_kb_refs: zhou_build_kb_refs(zhou_ctx.zhou_kb)
    });
    res.end();
}

/** GET /api/ai/model 获取当前大模型信息 */
async function zhou_ai_model(req, res) {
    return zhou_success(res, {
        zhou_ready: zhou_llm_ready(),
        zhou_model: zhou_llm_model(),
        zhou_keep_rounds: ZHOU_KEEP_ROUNDS,
        zhou_ctx_budget: ZHOU_CTX_BUDGET
    }, '获取大模型信息成功');
}

/** GET /api/ai/models 获取平台可用模型列表（模型切换） */
async function zhou_ai_models(req, res) {
    try {
        const zhou_list = await zhou_models();
        return zhou_success(res, { zhou_list: zhou_list, zhou_current: zhou_llm_model() }, '获取模型列表成功');
    } catch (e) {
        console.error('[zhou_ai] 获取模型列表失败：' + e.message);
        return zhou_fail(res, 502, '获取模型列表失败：' + e.message);
    }
}

/** GET /api/ai/stats 获取 token 用量与费用统计 */
async function zhou_ai_stats(req, res) {
    const zhou_user_id = Number(req.query.zhou_user_id) || 1;
    const zhou_stat = await zhou_session_model.zhou_session_stats(zhou_user_id);
    const zhou_cost_info = zhou_cost({
        prompt_tokens: zhou_stat.zhou_token_total,
        completion_tokens: 0,
        total_tokens: zhou_stat.zhou_token_total
    }, zhou_llm_model());
    return zhou_success(res, {
        zhou_session_count: Number(zhou_stat.zhou_session_count || 0),
        zhou_message_total: Number(zhou_stat.zhou_message_total || 0),
        zhou_token_total: Number(zhou_stat.zhou_token_total || 0),
        zhou_cost: zhou_cost_info
    }, '获取用量统计成功');
}

module.exports = {
    zhou_ai_chat,
    zhou_ai_model,
    zhou_ai_models,
    zhou_ai_stats,
    zhou_prepare_context,
    zhou_build_knowledge
};