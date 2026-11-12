/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）
 *
 * zhou_kb_model.js —— 智能客服知识库检索层（MySQL）
 * 知识来源：商品库 zhou_goods + 分类 zhou_category + 公告 zhou_notice
 * 检索思路（对应 18-6 流程图的混合检索 + Reranker）：
 *   1) 用库内词表反查用户问题中的有效词，避免切出噪声词；
 *   2) 关键词 LIKE 召回候选集；
 *   3) 按标题/分类命中权重打分重排，取 Top-N。
 */

'use strict';

const { zhou_all, zhou_get } = require('../db/zhou_db');

/** 停用词 */
const ZHOU_STOP = ['请问', '一下', '什么', '怎么', '如何', '哪些', '有没有', '可以', '我要', '想', '的', '了', '吗', '呢', '啊', '是', '在', '和', '有', '你好', '老师', '或者', '还是', '推荐', '介绍'];

/**
 * 把一段中文文本切成 2 字词（连续滑窗）
 * @param {string} zhou_text 文本
 * @returns {Array<string>} 2 字词数组
 */
function zhou_cut_words(zhou_text) {
    const zhou_clean = String(zhou_text || '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, ' ');
    const zhou_words = [];
    zhou_clean.split(/\s+/).forEach(function (w) {
        if (!w) { return; }
        if (/^[a-zA-Z0-9]+$/.test(w)) {
            zhou_words.push(w.toLowerCase());
            return;
        }
        for (let zhou_i = 0; zhou_i + 2 <= w.length; zhou_i++) {
            zhou_words.push(w.slice(zhou_i, zhou_i + 2));
        }
    });
    return zhou_words;
}

/**
 * 提取用户问题中的候选关键词（按长度倒序，最多 12 个）
 * @param {string} zhou_question 用户提问
 * @returns {Array<string>} 关键词数组
 */
function zhou_split_keywords(zhou_question) {
    const zhou_text = String(zhou_question || '').replace(/[\s，。？！、,.?!:：；;""''（）()【】\[\]]/g, ' ');
    const zhou_raw = zhou_text.split(/\s+/).filter(function (w) {
        return w.length >= 2 && ZHOU_STOP.indexOf(w) < 0;
    });
    const zhou_words = [];
    zhou_raw.forEach(function (w) {
        if (/^[a-zA-Z0-9]+$/.test(w)) {
            zhou_words.push(w);
            return;
        }
        for (let zhou_i = 0; zhou_i + 2 <= w.length; zhou_i++) {
            zhou_words.push(w.slice(zhou_i, zhou_i + 2));
        }
    });
    const zhou_uniq = [];
    zhou_words.forEach(function (w) {
        if (zhou_uniq.indexOf(w) < 0) {
            zhou_uniq.push(w);
        }
    });
    return zhou_uniq.sort(function (a, b) {
        return b.length - a.length;
    }).slice(0, 12);
}

/** 建立库内词表（商品标题 + 描述 + 分类名中的 2 字词） */
async function zhou_build_vocab() {
    const zhou_rows = await zhou_all(
        'SELECT g.zhou_title, g.zhou_description, c.zhou_cate_name FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id WHERE g.zhou_status = \'在售\''
    );
    const zhou_vocab = {};
    zhou_rows.forEach(function (r) {
        zhou_cut_words((r.zhou_title || '') + ' ' + (r.zhou_description || '') + ' ' + (r.zhou_cate_name || '')).forEach(function (w) {
            zhou_vocab[w] = true;
        });
    });
    return zhou_vocab;
}

/**
 * 商品知识库检索（词表反查 + LIKE 召回 + 打分重排）
 * @param {string} zhou_question 用户提问
 * @param {number} zhou_limit 返回条数
 * @returns {Promise<Array>} 命中的商品列表（含 zhou_score 相关性得分）
 */
async function zhou_search_goods(zhou_question, zhou_limit) {
    const zhou_vocab = await zhou_build_vocab();

    /* 只保留出现在库内词表中的词，保证关键词有效 */
    let zhou_keywords = zhou_split_keywords(zhou_question).filter(function (w) {
        return zhou_vocab[w];
    });
    if (!zhou_keywords.length) {
        /* 退化：允许英文/型号类词直接参与检索 */
        zhou_keywords = zhou_split_keywords(zhou_question).filter(function (w) {
            return /^[a-z0-9]+$/i.test(w);
        });
    }
    if (!zhou_keywords.length) {
        return { zhou_list: [], zhou_keywords: [], zhou_candidates: 0, zhou_vocab_size: Object.keys(zhou_vocab).length };
    }

    const zhou_where = zhou_keywords.map(function () {
        return '(g.zhou_title LIKE ? OR g.zhou_description LIKE ?)';
    }).join(' OR ');
    const zhou_params = [];
    zhou_keywords.forEach(function (w) {
        zhou_params.push('%' + w + '%', '%' + w + '%');
    });

    /* 注意：状态条件必须整体加括号，否则 AND/OR 优先级会串条件 */
    const zhou_rows = await zhou_all(
        'SELECT g.zhou_goods_id, g.zhou_title, g.zhou_description, g.zhou_price, g.zhou_original_price, g.zhou_condition, g.zhou_trade_place, g.zhou_status, g.zhou_view_count, g.zhou_created_at, c.zhou_cate_name, u.zhou_nickname, u.zhou_college FROM zhou_goods g LEFT JOIN zhou_category c ON g.zhou_category_id = c.zhou_category_id LEFT JOIN zhou_user u ON g.zhou_user_id = u.zhou_user_id WHERE (g.zhou_status = \'在售\') AND (' + zhou_where + ') LIMIT 30',
        zhou_params
    );

    /* 相关性打分：标题命中权重 3，描述命中 1，分类命中 2 */
    const zhou_scored = zhou_rows.map(function (row) {
        let zhou_score = 0;
        zhou_keywords.forEach(function (w) {
            if (row.zhou_title && row.zhou_title.indexOf(w) >= 0) {
                zhou_score += 3;
            }
            if (row.zhou_description && row.zhou_description.indexOf(w) >= 0) {
                zhou_score += 1;
            }
            if (row.zhou_cate_name && row.zhou_cate_name.indexOf(w) >= 0) {
                zhou_score += 2;
            }
        });
        zhou_score += Math.min(row.zhou_view_count || 0, 300) / 300;
        return Object.assign({}, row, { zhou_score: Math.round(zhou_score * 100) / 100 });
    });

    zhou_scored.sort(function (a, b) {
        return b.zhou_score - a.zhou_score;
    });
    return {
        zhou_list: zhou_scored.slice(0, zhou_limit || 5),
        zhou_keywords: zhou_keywords,
        zhou_candidates: zhou_rows.length,
        zhou_vocab_size: Object.keys(zhou_vocab).length
    };
}

/** 平台公告（作为补充知识） */
async function zhou_search_notices(zhou_question, zhou_limit) {
    const zhou_keywords = zhou_split_keywords(zhou_question);
    if (!zhou_keywords.length) {
        return { zhou_list: [], zhou_keywords: [], zhou_candidates: 0, zhou_vocab_size: Object.keys(zhou_vocab).length };
    }
    const zhou_where = zhou_keywords.map(function () {
        return '(zhou_title LIKE ? OR zhou_content LIKE ?)';
    }).join(' OR ');
    const zhou_params = [];
    zhou_keywords.forEach(function (w) {
        zhou_params.push('%' + w + '%', '%' + w + '%');
    });
    return zhou_all(
        'SELECT zhou_notice_id, zhou_title, zhou_content, zhou_notice_type, zhou_publisher, zhou_created_at FROM zhou_notice WHERE (' + zhou_where + ') ORDER BY zhou_created_at DESC LIMIT ?',
        zhou_params.concat([zhou_limit || 3])
    );
}

/** 分类清单（供模型了解平台有哪些商品类型） */
async function zhou_list_category_brief() {
    return zhou_all('SELECT zhou_cate_name, zhou_cate_desc FROM zhou_category ORDER BY zhou_sort_order ASC');
}

module.exports = {
    zhou_split_keywords,
    zhou_cut_words,
    zhou_build_vocab,
    zhou_search_goods,
    zhou_search_notices,
    zhou_list_category_brief
};