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

const { zhou_all, zhou_get, zhou_run } = require('../db/zhou_db');

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

/* ============================================================
 * 以下为 RAG 知识库模块：本地文件上传 → 解析 → 切分 → 入库 → 检索
 * 对应表：zhou_kb_doc（文档）、zhou_kb_chunk（切片）
 * ============================================================ */

/**
 * 将长文本按句子边界切分为多个切片
 * @param {string} zhou_text 原始文本
 * @param {number} zhou_size 每个切片的目标字数
 * @returns {Array<string>} 切片数组
 */
function zhou_split_text(zhou_text, zhou_size) {
    const zhou_clean = String(zhou_text || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
    const zhou_target = Number(zhou_size) || 300;
    const zhou_parts = zhou_clean.split(/(?<=[。！？!?\n])/).filter(function (s) {
        return s.trim().length > 0;
    });
    const zhou_chunks = [];
    let zhou_buf = '';
    zhou_parts.forEach(function (s) {
        if ((zhou_buf + s).length > zhou_target && zhou_buf.length > 0) {
            zhou_chunks.push(zhou_buf.trim());
            zhou_buf = '';
        }
        zhou_buf += s;
    });
    if (zhou_buf.trim().length) {
        zhou_chunks.push(zhou_buf.trim());
    }
    /* 兜底：文本没有任何句子分隔符时按固定长度硬切 */
    if (!zhou_chunks.length && zhou_clean.trim().length) {
        for (let zhou_i = 0; zhou_i < zhou_clean.length; zhou_i += zhou_target) {
            zhou_chunks.push(zhou_clean.slice(zhou_i, zhou_i + zhou_target).trim());
        }
    }
    return zhou_chunks.filter(function (c) {
        return c.length > 0;
    });
}

/** 业务词典：优先命中的专业词 */
const ZHOU_KB_DICT = [
    '教材', '教辅', '习题', '考研', '英语', '数学', '政治', '真题', '书目',
    '耳机', '降噪', '蓝牙', '头戴', '笔记本', '键盘', '鼠标', '手机', '手表', '平板',
    '自行车', '山地车', '折叠车', '滑板车', '代步', '相机', '镜头', '摄影', '单反',
    '宿舍', '校园', '交易', '守则', '规则', '管理员', '验货', '诈骗', '转账', '自提点',
    '公告', '平台', '卖家', '买家', '价格', '成色', '配件', '二手', '估价', '清单',
    '说明', '手册', '参考', '资料', '毕业', '搬迁', '学位', '课程', '器材', '选购'
];

/** 虚词字符：包含这些字的切分组合视为噪声 */
const ZHOU_KB_STOP_CHAR = '在有和与的了是就都也很并而或但把被让从向给对及其之以于所再更还只又这那我你他她它们个些上下前后中里外时候可以能够应该需要';

/**
 * 从切片文本中提取关键词
 * 策略：业务词典命中 + 2 字高频词（过滤虚词噪声）+ 长词覆盖短词去重
 */
function zhou_extract_keywords(zhou_text, zhou_limit) {
    const zhou_max = Number(zhou_limit) || 12;
    const zhou_raw = String(zhou_text || '');
    const zhou_clean = zhou_raw.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, ' ');
    const zhou_freq = {};

    /* 2 字滑窗统计 */
    zhou_clean.split(/\s+/).forEach(function (seg) {
        for (let i = 0; i + 2 <= seg.length; i++) {
            const w = seg.slice(i, i + 2);
            zhou_freq[w] = (zhou_freq[w] || 0) + 1;
        }
    });

    const zhou_pick = [];

    /* 1. 业务词典命中（保持词典顺序，命中即优先） */
    ZHOU_KB_DICT.forEach(function (w) {
        if (zhou_raw.indexOf(w) >= 0 && zhou_pick.indexOf(w) < 0) {
            zhou_pick.push(w);
        }
    });

    /* 2. 2 字高频词补充（频次 >= 2，且不含虚词） */
    Object.keys(zhou_freq).filter(function (w) {
        if (zhou_freq[w] < 2) return false;
        if (/^[0-9]+$/.test(w)) return false;
        if (zhou_pick.indexOf(w) >= 0) return false;
        for (let i = 0; i < w.length; i++) {
            if (ZHOU_KB_STOP_CHAR.indexOf(w.charAt(i)) >= 0) return false;
        }
        return true;
    }).sort(function (a, b) {
        return zhou_freq[b] - zhou_freq[a];
    }).forEach(function (w) {
        zhou_pick.push(w);
    });

    /* 3. 长词覆盖短词（若短词被已选长词包含则丢弃） */
    const zhou_final = [];
    zhou_pick.forEach(function (w) {
        const zhou_covered = zhou_final.some(function (k) {
            return k.length > w.length && k.indexOf(w) >= 0;
        });
        if (!zhou_covered && zhou_final.indexOf(w) < 0) {
            zhou_final.push(w);
        }
    });

    return zhou_final.slice(0, zhou_max).join(',');
}

/** 新建知识库文档记录 */
async function zhou_kb_doc_create(zhou_user_id, zhou_file_name, zhou_file_type, zhou_file_size, zhou_status) {
    const zhou_r = await zhou_run(
        'INSERT INTO zhou_kb_doc (zhou_user_id, zhou_file_name, zhou_file_type, zhou_file_size, zhou_status) VALUES (?, ?, ?, ?, ?)',
        [Number(zhou_user_id) || 0, zhou_file_name, zhou_file_type, Number(zhou_file_size) || 0, zhou_status || '解析中']
    );
    return zhou_r.lastInsertRowid;
}

/** 更新文档统计信息 */
async function zhou_kb_doc_update(zhou_doc_id, zhou_chunk_count, zhou_char_count, zhou_status, zhou_remark) {
    const zhou_fields = ['zhou_chunk_count = ?', 'zhou_char_count = ?', 'zhou_status = ?'];
    const zhou_values = [Number(zhou_chunk_count) || 0, Number(zhou_char_count) || 0, zhou_status || '已解析'];
    if (zhou_remark !== undefined) {
        zhou_fields.push('zhou_remark = ?');
        zhou_values.push(zhou_remark);
    }
    zhou_values.push(Number(zhou_doc_id));
    const zhou_r = await zhou_run('UPDATE zhou_kb_doc SET ' + zhou_fields.join(', ') + ' WHERE zhou_doc_id = ?', zhou_values);
    return zhou_r.changes;
}

/** 写入一个知识库切片 */
async function zhou_kb_chunk_add(zhou_doc_id, zhou_index, zhou_content, zhou_keywords) {
    const zhou_r = await zhou_run(
        'INSERT INTO zhou_kb_chunk (zhou_doc_id, zhou_chunk_index, zhou_content, zhou_keywords) VALUES (?, ?, ?, ?)',
        [Number(zhou_doc_id), Number(zhou_index) || 0, zhou_content, zhou_keywords || '']
    );
    return zhou_r.lastInsertRowid;
}

/** 知识库文档列表 */
async function zhou_kb_doc_list(zhou_user_id) {
    return zhou_all(
        'SELECT d.zhou_doc_id, d.zhou_user_id, d.zhou_file_name, d.zhou_file_type, d.zhou_file_size, d.zhou_chunk_count, d.zhou_char_count, d.zhou_status, d.zhou_remark, d.zhou_created_at ' +
        'FROM zhou_kb_doc d WHERE d.zhou_user_id = ? ORDER BY d.zhou_created_at DESC',
        [Number(zhou_user_id) || 0]
    );
}

/** 按 ID 取知识库文档 */
async function zhou_kb_doc_get(zhou_doc_id) {
    return zhou_get(
        'SELECT zhou_doc_id, zhou_user_id, zhou_file_name, zhou_file_type, zhou_file_size, zhou_chunk_count, zhou_char_count, zhou_status, zhou_remark, zhou_created_at FROM zhou_kb_doc WHERE zhou_doc_id = ?',
        [Number(zhou_doc_id)]
    );
}

/** 删除知识库文档（切片随外键级联删除） */
async function zhou_kb_doc_remove(zhou_doc_id) {
    const zhou_r = await zhou_run('DELETE FROM zhou_kb_doc WHERE zhou_doc_id = ?', [Number(zhou_doc_id)]);
    return zhou_r.changes;
}

/** 某文档的全部切片 */
async function zhou_kb_chunks_by_doc(zhou_doc_id) {
    return zhou_all(
        'SELECT zhou_chunk_id, zhou_chunk_index, zhou_content, zhou_keywords FROM zhou_kb_chunk WHERE zhou_doc_id = ? ORDER BY zhou_chunk_index ASC',
        [Number(zhou_doc_id)]
    );
}

/**
 * 知识库切片检索：先用 MySQL 全文索引（ngram 中文分词）召回，
 * 无命中时退化为 LIKE 模糊召回，保证任何提问都能给出结果
 * @param {string} zhou_question 用户提问
 * @param {number} zhou_limit 返回条数
 */
async function zhou_search_chunks(zhou_question, zhou_limit) {
    const zhou_limit_n = Number(zhou_limit) || 3;
    const zhou_text = String(zhou_question || '').replace(/[\s，。？！、,.?!:：；;""''（）()【】\[\]]/g, ' ').trim();
    if (!zhou_text) {
        return [];
    }
    let zhou_rows = [];
    try {
        zhou_rows = await zhou_all(
            'SELECT c.zhou_chunk_id, c.zhou_doc_id, c.zhou_chunk_index, c.zhou_content, c.zhou_keywords, d.zhou_file_name, ' +
            'MATCH(c.zhou_content) AGAINST (? IN NATURAL LANGUAGE MODE) AS zhou_score ' +
            'FROM zhou_kb_chunk c JOIN zhou_kb_doc d ON c.zhou_doc_id = d.zhou_doc_id ' +
            'WHERE MATCH(c.zhou_content) AGAINST (? IN NATURAL LANGUAGE MODE) ORDER BY zhou_score DESC LIMIT ?',
            [zhou_text, zhou_text, zhou_limit_n]
        );
    } catch (e) {
        zhou_rows = [];
    }
    if (zhou_rows.length) {
        return zhou_rows;
    }
    /* 兜底：LIKE 模糊召回 */
    const zhou_words = zhou_split_keywords(zhou_text).slice(0, 6);
    if (!zhou_words.length) {
        return [];
    }
    const zhou_where = zhou_words.map(function () {
        return 'c.zhou_content LIKE ?';
    }).join(' OR ');
    const zhou_params = zhou_words.map(function (w) {
        return '%' + w + '%';
    });
    const zhou_fallback = await zhou_all(
        'SELECT c.zhou_chunk_id, c.zhou_doc_id, c.zhou_chunk_index, c.zhou_content, c.zhou_keywords, d.zhou_file_name, 0 AS zhou_score ' +
        'FROM zhou_kb_chunk c JOIN zhou_kb_doc d ON c.zhou_doc_id = d.zhou_doc_id ' +
        'WHERE (' + zhou_where + ') LIMIT ?',
        zhou_params.concat([zhou_limit_n])
    );
    return zhou_fallback;
}

module.exports = {
    zhou_split_keywords,
    zhou_cut_words,
    zhou_build_vocab,
    zhou_search_goods,
    zhou_search_notices,
    zhou_list_category_brief,
    zhou_split_text,
    zhou_extract_keywords,
    zhou_kb_doc_create,
    zhou_kb_doc_update,
    zhou_kb_chunk_add,
    zhou_kb_doc_list,
    zhou_kb_doc_get,
    zhou_kb_doc_remove,
    zhou_kb_chunks_by_doc,
    zhou_search_chunks
};