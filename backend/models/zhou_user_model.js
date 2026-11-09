/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-09 | 大模型：Space Bunny
 *
 * zhou_user_model.js —— 用户表数据访问层（MySQL）
 */

'use strict';

const { zhou_all, zhou_get, zhou_run } = require('../db/zhou_db');

/** 登录校验：账号 + MD5 密码 */
async function zhou_login(zhou_username, zhou_password) {
    return zhou_get(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_created_at FROM zhou_user WHERE zhou_username = ? AND zhou_password = ? LIMIT 1',
        [zhou_username, zhou_password]
    );
}

/** 按主键查询用户 */
async function zhou_get_user(zhou_user_id) {
    return zhou_get(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_created_at FROM zhou_user WHERE zhou_user_id = ? LIMIT 1',
        [zhou_user_id]
    );
}

/** 用户列表（分页 + 关键字） */
async function zhou_list_users(zhou_page, zhou_size, zhou_keyword) {
    const zhou_offset = (zhou_page - 1) * zhou_size;
    let zhou_where = 'WHERE 1 = 1';
    const zhou_params = [];
    if (zhou_keyword) {
        zhou_where += ' AND (zhou_username LIKE ? OR zhou_nickname LIKE ? OR zhou_college LIKE ?)';
        zhou_params.push('%' + zhou_keyword + '%', '%' + zhou_keyword + '%', '%' + zhou_keyword + '%');
    }
    const zhou_rows = await zhou_all(
        'SELECT zhou_user_id, zhou_username, zhou_nickname, zhou_college, zhou_phone, zhou_balance, zhou_credit, zhou_status, zhou_created_at FROM zhou_user ' + zhou_where + ' ORDER BY zhou_user_id DESC LIMIT ? OFFSET ?',
        zhou_params.concat([zhou_size, zhou_offset])
    );
    const zhou_total = await zhou_get('SELECT COUNT(*) AS zhou_cnt FROM zhou_user ' + zhou_where, zhou_params);
    return { zhou_list: zhou_rows, zhou_total: zhou_total.zhou_cnt };
}
/** 新增用户 */
async function zhou_create_user(zhou_data) {
    const zhou_info = await zhou_run(
        'INSERT INTO zhou_user (zhou_username, zhou_password, zhou_nickname, zhou_gender, zhou_college, zhou_phone, zhou_avatar, zhou_balance, zhou_credit, zhou_status, zhou_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [zhou_data.zhou_username, zhou_data.zhou_password, zhou_data.zhou_nickname, zhou_data.zhou_gender || '保密',
         zhou_data.zhou_college || '', zhou_data.zhou_phone || '', zhou_data.zhou_avatar || 'images/avatar01.png',
         zhou_data.zhou_balance || 0, zhou_data.zhou_credit || 100, '正常', zhou_data.zhou_created_at]
    );
    return zhou_info;
}

/** 更新用户资料 */
async function zhou_update_user(zhou_user_id, zhou_data) {
    const zhou_fields = ['zhou_nickname', 'zhou_gender', 'zhou_college', 'zhou_phone', 'zhou_avatar', 'zhou_balance', 'zhou_credit', 'zhou_status'];
    const zhou_sets = [];
    const zhou_params = [];
    zhou_fields.forEach(function (zhou_key) {
        if (zhou_data[zhou_key] !== undefined) {
            zhou_sets.push(zhou_key + ' = ?');
            zhou_params.push(zhou_data[zhou_key]);
        }
    });
    if (!zhou_sets.length) {
        return { changes: 0 };
    }
    zhou_params.push(zhou_user_id);
    return zhou_run('UPDATE zhou_user SET ' + zhou_sets.join(', ') + ' WHERE zhou_user_id = ?', zhou_params);
}

/** 删除用户 */
async function zhou_delete_user(zhou_user_id) {
    return zhou_run('DELETE FROM zhou_user WHERE zhou_user_id = ?', [zhou_user_id]);
}

module.exports = {
    zhou_login,
    zhou_get_user,
    zhou_list_users,
    zhou_create_user,
    zhou_update_user,
    zhou_delete_user
};