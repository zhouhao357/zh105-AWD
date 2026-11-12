/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-12 | 大模型：Space Bunny
 *
 * zhou_kb.js —— RAG 知识库页面逻辑（上传、列表、切片查看、删除）
 * 规则：服务器返回的数据与错误信息全部输出到浏览器控制台。
 */

'use strict';

var zhou_kb_user_id = 1;

document.addEventListener('DOMContentLoaded', function () {
    zhou_render_nav('kb');
    zhou_load_docs();

    var zhou_box = document.getElementById('zhou_upload_box');
    var zhou_input = document.getElementById('zhou_file_input');

    zhou_box.addEventListener('click', function () {
        zhou_input.click();
    });
    zhou_input.addEventListener('change', function () {
        if (this.files && this.files.length) {
            zhou_upload(this.files[0]);
        }
    });

    /* 拖拽上传 */
    ['dragenter', 'dragover'].forEach(function (evt) {
        zhou_box.addEventListener(evt, function (e) {
            e.preventDefault();
            zhou_box.classList.add('zhou_upload_drag');
        });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
        zhou_box.addEventListener(evt, function (e) {
            e.preventDefault();
            zhou_box.classList.remove('zhou_upload_drag');
        });
    });
    zhou_box.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files.length) {
            zhou_upload(e.dataTransfer.files[0]);
        }
    });

    document.getElementById('zhou_refresh_doc').addEventListener('click', zhou_load_docs);
});
/** 上传文件（带进度显示，使用 XHR 以获取上传进度事件） */
function zhou_upload(zhou_file) {
    console.log('[kb] 选择文件：', zhou_file.name, zhou_file.type, zhou_file.size);
    var zhou_form = new FormData();
    zhou_form.append('zhou_file', zhou_file);
    zhou_form.append('zhou_user_id', String(zhou_kb_user_id));

    var zhou_prog = document.getElementById('zhou_upload_progress');
    var zhou_inner = document.getElementById('zhou_progress_inner');
    var zhou_text = document.getElementById('zhou_progress_text');
    zhou_prog.style.display = 'block';
    zhou_inner.style.width = '0%';
    zhou_text.textContent = '上传中…';

    var zhou_xhr = new XMLHttpRequest();
    zhou_xhr.open('POST', '/api/kb/upload');
    zhou_xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
            var zhou_pct = Math.round((e.loaded / e.total) * 100);
            zhou_inner.style.width = zhou_pct + '%';
            zhou_text.textContent = '上传进度 ' + zhou_pct + '%（' + zhou_file.name + '）';
        }
    });
    zhou_xhr.addEventListener('load', function () {
        zhou_inner.style.width = '100%';
        var zhou_json = {};
        try {
            zhou_json = JSON.parse(zhou_xhr.responseText);
        } catch (e) {
            zhou_json = { code: -1, msg: '响应解析失败' };
        }
        console.log('[kb] 上传响应：', zhou_json);
        if (zhou_json.code === 0) {
            zhou_text.textContent = '上传成功，正在解析并切分…';
            zhou_tip('zhou_upload_tip', '解析成功：' + zhou_json.data.zhou_file_name + '（' + zhou_json.data.zhou_chunk_count + ' 个片段）', 'ok');
            zhou_show_result(zhou_json.data);
            zhou_load_docs();
        } else {
            zhou_text.textContent = '上传失败';
            zhou_tip('zhou_upload_tip', zhou_json.msg || '上传失败', 'err');
        }
    });
    zhou_xhr.addEventListener('error', function () {
        zhou_text.textContent = '上传失败';
        zhou_tip('zhou_upload_tip', '网络异常，上传失败', 'err');
    });
    zhou_xhr.send(zhou_form);
}

/** 展示本次上传结果 */
function zhou_show_result(zhou_data) {
    var zhou_html = '<div class="zhou_kb_row"><b>' + zhou_md_escape(zhou_data.zhou_file_name) + '</b>' +
        '<span class="zhou_kb_tag">' + zhou_data.zhou_file_type.toUpperCase() + '</span>' +
        '<span class="zhou_kb_tag">' + zhou_data.zhou_file_size + ' 字节</span>' +
        '<span class="zhou_kb_tag">' + zhou_data.zhou_chunk_count + ' 个片段</span></div>';
    zhou_html += '<div class="zhou_kb_chunk_list">';
    (zhou_data.zhou_chunks || []).forEach(function (c) {
        zhou_html += '<div class="zhou_kb_chunk"><div class="zhou_kb_chunk_head">片段 ' + c.zhou_chunk_index +
            '　<span class="zhou_kb_kw">' + zhou_md_escape(c.zhou_keywords || '') + '</span></div>' +
            '<div class="zhou_kb_chunk_body">' + zhou_md_escape(c.zhou_excerpt) + '…</div></div>';
    });
    zhou_html += '</div>';
    document.getElementById('zhou_upload_result').innerHTML = zhou_html;
}
/** 加载知识库文档列表 */
function zhou_load_docs() {
    zhou_request('/kb/doc?zhou_user_id=' + zhou_kb_user_id, 'GET').then(function (res) {
        console.log('[kb] 文档列表：', res.data.zhou_list);
        var zhou_box = document.getElementById('zhou_doc_list');
        if (!res.data.zhou_list.length) {
            zhou_box.innerHTML = '<div class="zhou_kb_empty">还没有上传任何知识库文件</div>';
            return;
        }
        var zhou_html = '';
        res.data.zhou_list.forEach(function (d) {
            zhou_html += '<div class="zhou_kb_row zhou_kb_doc" data-id="' + d.zhou_doc_id + '">' +
                '<div class="zhou_kb_doc_main">' +
                '<div class="zhou_kb_doc_name">' + zhou_md_escape(d.zhou_file_name) + '</div>' +
                '<div class="zhou_kb_doc_meta">' + d.zhou_file_type.toUpperCase() + ' ｜ ' + d.zhou_file_size + ' 字节 ｜ ' +
                d.zhou_chunk_count + ' 个片段 ｜ ' + d.zhou_char_count + ' 字符 ｜ ' + zhou_md_escape(d.zhou_status) +
                ' ｜ ' + zhou_time(d.zhou_created_at) + '</div>' +
                '</div>' +
                '<div class="zhou_kb_ops">' +
                '<button class="zhou_session_op" data-act="chunk">查看切片</button>' +
                '<button class="zhou_session_op zhou_session_del" data-act="del">删除</button>' +
                '</div></div>';
        });
        zhou_box.innerHTML = zhou_html;
        zhou_box.onclick = function (e) {
            var zhou_btn = e.target.closest('.zhou_session_op');
            if (!zhou_btn) return;
            var zhou_id = Number(zhou_btn.closest('.zhou_kb_doc').getAttribute('data-id'));
            if (zhou_btn.getAttribute('data-act') === 'chunk') {
                zhou_show_chunks(zhou_id);
            } else {
                zhou_delete_doc(zhou_id);
            }
        };
    }).catch(function (e) {
        console.error('[kb] 获取文档列表失败：', e);
    });
}

/** 查看文档切片 */
function zhou_show_chunks(zhou_id) {
    zhou_request('/kb/doc/' + zhou_id, 'GET').then(function (res) {
        console.log('[kb] 切片详情：', res.data);
        var zhou_html = '<div class="zhou_kb_doc_name">' + zhou_md_escape(res.data.zhou_doc.zhou_file_name) + '</div>';
        zhou_html += '<div class="zhou_kb_chunk_list">';
        res.data.zhou_chunks.forEach(function (c) {
            zhou_html += '<div class="zhou_kb_chunk"><div class="zhou_kb_chunk_head">片段 ' + c.zhou_chunk_index +
                '　<span class="zhou_kb_kw">' + zhou_md_escape(c.zhou_keywords || '') + '</span></div>' +
                '<div class="zhou_kb_chunk_body">' + zhou_md(c.zhou_content) + '</div></div>';
        });
        zhou_html += '</div>';
        document.getElementById('zhou_chunk_detail').innerHTML = zhou_html;
    }).catch(function (e) {
        console.error('[kb] 获取切片失败：', e);
    });
}

/** 删除文档 */
function zhou_delete_doc(zhou_id) {
    if (!window.confirm('确定删除该知识库文档及其全部切片吗？')) return;
    zhou_request('/kb/doc/' + zhou_id, 'DELETE').then(function (res) {
        console.log('[kb] 删除成功：', res.data);
        zhou_tip('zhou_upload_tip', '删除成功', 'ok');
        zhou_load_docs();
    }).catch(function (e) {
        console.error('[kb] 删除失败：', e);
    });
}