/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_kb_controller.js —— RAG 知识库控制器（本地文件上传 → 解析 → 切分 → 入库）
 * 支持格式：PDF（pdf-parse 解析）、TXT（UTF-8 直读）
 */

'use strict';

const { zhou_success, zhou_fail } = require('../middleware/zhou_response');
const zhou_kb_model = require('../models/zhou_kb_model');

/* 上传限制：单个文件最大 10 MB */
const ZHOU_MAX_SIZE = 10 * 1024 * 1024;
/* 切片目标字数 */
const ZHOU_CHUNK_SIZE = Number(process.env.KB_CHUNK_SIZE || 300);

/** 从 PDF 二进制解析出纯文本 */
async function zhou_parse_pdf(zhou_buffer) {
    const { PDFParse } = require('pdf-parse');
    const zhou_parser = new PDFParse({ data: zhou_buffer });
    try {
        const zhou_result = await zhou_parser.getText();
        return zhou_result && zhou_result.text ? zhou_result.text : '';
    } finally {
        await zhou_parser.destroy();
    }
}

/** 解析上传文件为纯文本 */
async function zhou_parse_file(zhou_file) {
    const zhou_ext = (zhou_file.originalname || '').split('.').pop().toLowerCase();
    if (zhou_ext === 'pdf') {
        return { zhou_type: 'pdf', zhou_text: await zhou_parse_pdf(zhou_file.buffer) };
    }
    if (zhou_ext === 'txt' || zhou_ext === 'md') {
        return { zhou_type: 'txt', zhou_text: zhou_file.buffer.toString('utf8') };
    }
    throw new Error('不支持的文件格式：' + zhou_ext + '，仅支持 PDF / TXT');
}

/**
 * multer 按 latin1 解析文件名，中文会乱码，这里转回 utf-8
 */
function zhou_file_name(zhou_file) {
    const zhou_raw = zhou_file.originalname || '未命名文件';
    try {
        return Buffer.from(zhou_raw, 'latin1').toString('utf8');
    } catch (e) {
        return zhou_raw;
    }
}

/** POST /api/kb/upload 上传并解析知识库文件 */
async function zhou_kb_upload(req, res) {
    const zhou_file = req.file;
    if (!zhou_file) {
        return zhou_fail(res, 400, '未收到上传文件，请选择 PDF 或 TXT 文件');
    }
    if (zhou_file.size > ZHOU_MAX_SIZE) {
        return zhou_fail(res, 400, '文件大小不能超过 10 MB');
    }

    const zhou_user_id = Number(req.body.zhou_user_id) || 1;
    const zhou_name = zhou_file_name(zhou_file);
    let zhou_parsed;
    try {
        zhou_parsed = await zhou_parse_file(zhou_file);
    } catch (e) {
        console.error('[zhou_kb] 文件解析失败：' + e.message);
        return zhou_fail(res, 400, '文件解析失败：' + e.message);
    }

    const zhou_text = zhou_parsed.zhou_text || '';
    if (!zhou_text.trim()) {
        return zhou_fail(res, 400, '文件内容为空或无法提取到文字');
    }

    /* 建档 */
    const zhou_doc_id = await zhou_kb_model.zhou_kb_doc_create(
        zhou_user_id,
        zhou_name,
        zhou_parsed.zhou_type,
        zhou_file.size,
        '解析中'
    );

    /* 切分并入库 */
    const zhou_chunks = zhou_kb_model.zhou_split_text(zhou_text, ZHOU_CHUNK_SIZE);
    for (let zhou_i = 0; zhou_i < zhou_chunks.length; zhou_i++) {
        await zhou_kb_model.zhou_kb_chunk_add(
            zhou_doc_id,
            zhou_i,
            zhou_chunks[zhou_i],
            zhou_kb_model.zhou_extract_keywords(zhou_chunks[zhou_i])
        );
    }

    await zhou_kb_model.zhou_kb_doc_update(
        zhou_doc_id,
        zhou_chunks.length,
        zhou_text.length,
        '已解析',
        '自动切分 ' + zhou_chunks.length + ' 个片段'
    );

    const zhou_detail = await zhou_kb_model.zhou_kb_chunks_by_doc(zhou_doc_id);
    console.log('[zhou_kb] 文档入库成功：' + zhou_name + ' → ' + zhou_chunks.length + ' 个切片');

    return zhou_success(res, {
        zhou_doc_id: zhou_doc_id,
        zhou_file_name: zhou_name,
        zhou_file_type: zhou_parsed.zhou_type,
        zhou_file_size: zhou_file.size,
        zhou_char_count: zhou_text.length,
        zhou_chunk_count: zhou_chunks.length,
        zhou_chunks: zhou_detail.map(function (c) {
            return {
                zhou_chunk_index: c.zhou_chunk_index,
                zhou_keywords: c.zhou_keywords,
                zhou_excerpt: String(c.zhou_content || '').slice(0, 100)
            };
        })
    }, '知识库文件解析入库成功');
}

/** GET /api/kb/doc 知识库文档列表 */
async function zhou_kb_doc_list(req, res) {
    const zhou_user_id = Number(req.query.zhou_user_id) || 1;
    const zhou_list = await zhou_kb_model.zhou_kb_doc_list(zhou_user_id);
    return zhou_success(res, { zhou_list: zhou_list }, '获取知识库文档列表成功');
}

/** GET /api/kb/doc/:id 文档切片详情 */
async function zhou_kb_doc_detail(req, res) {
    const zhou_id = Number(req.params.zhou_id);
    const zhou_doc = await zhou_kb_model.zhou_kb_doc_get(zhou_id);
    if (!zhou_doc) {
        return zhou_fail(res, 404, '知识库文档不存在：' + zhou_id);
    }
    const zhou_chunks = await zhou_kb_model.zhou_kb_chunks_by_doc(zhou_id);
    return zhou_success(res, {
        zhou_doc: zhou_doc,
        zhou_chunks: zhou_chunks
    }, '获取文档切片成功');
}

/** DELETE /api/kb/doc/:id 删除知识库文档 */
async function zhou_kb_doc_remove(req, res) {
    const zhou_id = Number(req.params.zhou_id);
    const zhou_changes = await zhou_kb_model.zhou_kb_doc_remove(zhou_id);
    if (!zhou_changes) {
        return zhou_fail(res, 404, '知识库文档不存在：' + zhou_id);
    }
    return zhou_success(res, { zhou_doc_id: zhou_id }, '删除知识库文档成功');
}

module.exports = {
    zhou_kb_upload,
    zhou_kb_doc_list,
    zhou_kb_doc_detail,
    zhou_kb_doc_remove,
    zhou_parse_file
};