<!--
  姓名：周浩 | 学号：24001010105 |
  时间：2026-11-09 | 大模型：Space Bunny
-->

# 接口文档 zhou_interface.md

> 规则：每次创建或修改接口后**追加**记录，格式为
> `接口路径 | HTTP 方法 | 请求参数（含示例）| 响应格式（含 JSON 示例）| 修改时间`。
> 统一响应格式：`{ "code": 0, "msg": "提示信息", "data": { ... } }`，code = 0 成功，非 0 失败。
> 服务地址：`http://127.0.0.1:8105`，接口前缀：`/api/`。

---

## 一、首页与公告

### 1. 首页聚合统计

- 接口路径：`/api/home`
- HTTP 方法：GET
- 请求参数：无
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取首页数据成功",
  "data": {
    "zhou_user_count": 10,
    "zhou_goods_count": 15,
    "zhou_order_count": 9,
    "zhou_message_count": 10,
    "zhou_comment_count": 9,
    "zhou_category_count": 8,
    "zhou_avg_price": 627.69,
    "zhou_hot_goods": [{ "zhou_goods_id": 4, "zhou_title": "联想小新 Air14 i5/16G/512G", "zhou_price": 3200, "zhou_view_count": 615 }],
    "zhou_new_goods": [{ "zhou_goods_id": 1, "zhou_title": "高等数学同济第七版上册", "zhou_price": 25 }]
  }
}
```

- 修改时间：2026-11-09

### 2. 平台公告列表

- 接口路径：`/api/notice`
- HTTP 方法：GET
- 请求参数：`zhou_type`（可选，公告类型：公告 / 通知 / 活动），示例：`?zhou_type=公告`
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取公告列表成功",
  "data": {
    "zhou_list": [
      { "zhou_notice_id": 1, "zhou_title": "平台交易守则", "zhou_publisher": "平台管理员", "zhou_notice_type": "公告", "zhou_created_at": "2026-03-02 10:00:00" }
    ]
  }
}
```

- 修改时间：2026-11-09
---

## 二、商品与分类

### 3. 商品列表（分页 / 搜索 / 分类筛选 / 排序）

- 接口路径：`/api/goods`
- HTTP 方法：GET
- 请求参数：

| 参数 | 类型 | 必填 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| zhou_page | number | 否 | 页码，默认 1 | `1` |
| zhou_size | number | 否 | 每页条数，默认 9 | `9` |
| zhou_keyword | string | 否 | 标题或描述关键字 | `耳机` |
| zhou_category_id | number | 否 | 分类主键 | `2` |
| zhou_status | string | 否 | 商品状态：在售 / 已售出 / 已下架 | `在售` |
| zhou_user_id | number | 否 | 按卖家筛选 | `1` |
| zhou_sort | string | 否 | new / hot / price_asc / price_desc | `hot` |

- 请求示例：`GET /api/goods?zhou_page=1&zhou_size=9&zhou_keyword=耳机&zhou_sort=hot`
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取商品列表成功",
  "data": {
    "zhou_list": [
      {
        "zhou_goods_id": 9,
        "zhou_user_id": 5,
        "zhou_category_id": 2,
        "zhou_title": "索尼 WH-1000XM4 降噪耳机",
        "zhou_description": "降噪效果优秀，耳罩无掉皮，附收纳盒与音频线。",
        "zhou_price": 780,
        "zhou_original_price": 1299,
        "zhou_stock": 1,
        "zhou_cover": "images/goods09.png",
        "zhou_condition": "九成新",
        "zhou_trade_place": "一号宿舍楼",
        "zhou_status": "在售",
        "zhou_view_count": 287,
        "zhou_created_at": "2026-09-30 21:40:00",
        "zhou_cate_name": "电子数码",
        "zhou_nickname": "赵梦琪",
        "zhou_college": "网安24001"
      }
    ],
    "zhou_total": 15,
    "zhou_page": 1,
    "zhou_size": 9
  }
}
```

- 修改时间：2026-11-09

### 4. 商品详情（含评价）

- 接口路径：`/api/goods/:zhou_id`
- HTTP 方法：GET
- 请求参数：路径参数 `zhou_id`（商品主键），示例：`3`
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取商品详情成功",
  "data": {
    "zhou_goods": { "zhou_goods_id": 3, "zhou_title": "二手 iPad 第九代 64G 深空灰", "zhou_price": 1450, "zhou_view_count": 404 },
    "zhou_comments": [
      { "zhou_comment_id": 3, "zhou_rating": 4, "zhou_content": "整体不错，就是充电器不是原装的", "zhou_nickname": "周浩", "zhou_created_at": "2026-10-09 10:25:00" }
    ]
  }
}
```

- 失败响应：`{ "code": 404, "msg": "商品不存在或已被删除", "data": null }`
- 修改时间：2026-11-09

### 5. 发布商品

- 接口路径：`/api/goods`
- HTTP 方法：POST
- 请求参数（JSON）：

```json
{
  "zhou_title": "九成新折叠桌",
  "zhou_price": 68,
  "zhou_original_price": 120,
  "zhou_stock": 1,
  "zhou_condition": "九成新",
  "zhou_trade_place": "六号楼门口",
  "zhou_description": "毕业清仓，自提",
  "zhou_category_id": 3,
  "zhou_user_id": 1
}
```

- 响应格式：

```json
{ "code": 0, "msg": "商品发布成功，等待审核", "data": { "zhou_goods_id": 21 } }
```

- 失败响应：`{ "code": 400, "msg": "缺少必填参数：zhou_price, zhou_category_id, zhou_user_id", "data": null }`
- 修改时间：2026-11-09

### 6. 修改商品状态

- 接口路径：`/api/goods/:zhou_id/status`
- HTTP 方法：PUT
- 请求参数：路径 `zhou_id`；体 `zhou_status`（在售 / 已售出 / 已下架），示例：`{ "zhou_status": "已下架" }`
- 响应格式：`{ "code": 0, "msg": "商品状态已更新", "data": { "zhou_changes": 1, "zhou_status": "已下架" } }`
- 修改时间：2026-11-09

### 7. 删除商品

- 接口路径：`/api/goods/:zhou_id`
- HTTP 方法：DELETE
- 请求参数：路径 `zhou_id`，示例：`21`
- 响应格式：`{ "code": 0, "msg": "商品已删除", "data": { "zhou_changes": 1 } }`
- 修改时间：2026-11-09

### 8. 分类列表

- 接口路径：`/api/category`
- HTTP 方法：GET
- 请求参数：无
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取分类列表成功",
  "data": {
    "zhou_list": [
      { "zhou_category_id": 1, "zhou_cate_name": "教材教辅", "zhou_cate_icon": "images/cate_book.png", "zhou_cate_desc": "课本、考研资料、习题册与真题", "zhou_sort_order": 1 }
    ]
  }
}
```

- 修改时间：2026-11-09
---

## 三、用户

### 9. 登录

- 接口路径：`/api/user/login`
- HTTP 方法：POST
- 请求参数：`{ "zhou_username": "zhou01", "zhou_password": "123456" }`
- 响应格式：

```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "zhou_user": {
      "zhou_user_id": 1,
      "zhou_username": "zhou01",
      "zhou_nickname": "周浩",
      "zhou_college": "计科24001",
      "zhou_phone": "13800138001",
      "zhou_balance": 128.5,
      "zhou_credit": 100,
      "zhou_status": "正常"
    }
  }
}
```

- 失败响应：`{ "code": 401, "msg": "账号或密码错误", "data": null }`
- 修改时间：2026-11-09

### 10. 注册

- 接口路径：`/api/user/register`
- HTTP 方法：POST
- 请求参数：`{ "zhou_username": "zhou11", "zhou_password": "123456", "zhou_nickname": "林同学", "zhou_college": "计科24001", "zhou_phone": "13800138011" }`
- 响应格式：`{ "code": 0, "msg": "注册成功", "data": { "zhou_user_id": 11 } }`
- 失败响应：`{ "code": 409, "msg": "该账号已被注册", "data": null }`
- 修改时间：2026-11-09

### 11. 用户列表

- 接口路径：`/api/user`
- HTTP 方法：GET
- 请求参数：`zhou_page`（默认 1）、`zhou_size`（默认 10）、`zhou_keyword`（账号 / 昵称 / 学院模糊搜索）
- 响应格式：`{ "code": 0, "msg": "获取用户列表成功", "data": { "zhou_list": [], "zhou_total": 10, "zhou_page": 1, "zhou_size": 10 } }`
- 修改时间：2026-11-09

### 12. 用户详情

- 接口路径：`/api/user/:zhou_id`
- HTTP 方法：GET
- 请求参数：路径 `zhou_id`，示例：`1`
- 响应格式：`{ "code": 0, "msg": "获取用户信息成功", "data": { "zhou_user": { "zhou_user_id": 1, "zhou_nickname": "周浩" } } }`
- 修改时间：2026-11-09

### 13. 更新用户资料

- 接口路径：`/api/user/:zhou_id`
- HTTP 方法：PUT
- 请求参数：路径 `zhou_id`；体可含 `zhou_nickname`、`zhou_college`、`zhou_phone`、`zhou_balance`、`zhou_credit`、`zhou_status`
- 响应格式：`{ "code": 0, "msg": "资料已更新", "data": { "zhou_changes": 1 } }`
- 修改时间：2026-11-09

---

## 四、订单与评价

### 14. 订单列表

- 接口路径：`/api/order`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（用户主键）、`zhou_role`（buyer 买家 / seller 卖家，默认 buyer）
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取订单列表成功",
  "data": {
    "zhou_list": [
      {
        "zhou_order_id": 1,
        "zhou_order_no": "ZO20260915001",
        "zhou_goods_id": 4,
        "zhou_goods_title": "联想小新 Air14 i5/16G/512G",
        "zhou_buyer_name": "孙浩然",
        "zhou_seller_name": "张子轩",
        "zhou_total_amount": 3200,
        "zhou_status": "已完成",
        "zhou_created_at": "2026-09-15 10:02:00"
      }
    ]
  }
}
```

- 修改时间：2026-11-09

### 15. 下单

- 接口路径：`/api/order`
- HTTP 方法：POST
- 请求参数：`{ "zhou_goods_id": 1, "zhou_buyer_id": 2, "zhou_quantity": 1, "zhou_remark": "当面交易" }`
- 响应格式：`{ "code": 0, "msg": "下单成功，请尽快完成付款", "data": { "zhou_order_id": 10, "zhou_order_no": "ZO202611090010" } }`
- 失败响应：`{ "code": 400, "msg": "不能购买自己发布的商品", "data": null }`、`{ "code": 409, "msg": "该商品当前状态为「已售出」，无法下单", "data": null }`
- 修改时间：2026-11-09

### 16. 更新订单状态

- 接口路径：`/api/order/:zhou_id/status`
- HTTP 方法：PUT
- 请求参数：路径 `zhou_id`；体 `zhou_status`（待付款 / 待发货 / 待收货 / 已完成 / 已取消 / 退款中 / 已退款）
- 响应格式：`{ "code": 0, "msg": "订单状态已更新", "data": { "zhou_changes": 1, "zhou_status": "已完成" } }`
- 修改时间：2026-11-09

### 17. 评价列表

- 接口路径：`/api/comment`
- HTTP 方法：GET
- 请求参数：`zhou_goods_id`（商品主键）
- 响应格式：`{ "code": 0, "msg": "获取评价列表成功", "data": { "zhou_list": [{ "zhou_comment_id": 1, "zhou_rating": 5, "zhou_content": "卖家描述很准", "zhou_nickname": "孙浩然" }] } }`
- 修改时间：2026-11-09

### 18. 发表评价

- 接口路径：`/api/comment`
- HTTP 方法：POST
- 请求参数：`{ "zhou_goods_id": 4, "zhou_order_id": 1, "zhou_user_id": 8, "zhou_rating": 5, "zhou_content": "卖家描述很准" }`
- 响应格式：`{ "code": 0, "msg": "评价发表成功", "data": { "zhou_comment_id": 10 } }`
- 修改时间：2026-11-09
---

## 五、私信与收藏

### 19. 私信列表

- 接口路径：`/api/message`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（必填，用户主键）
- 响应格式：

```json
{
  "code": 0,
  "msg": "获取私信列表成功",
  "data": {
    "zhou_list": [
      { "zhou_message_id": 1, "zhou_sender_name": "李思远", "zhou_receiver_name": "周浩", "zhou_goods_title": "高等数学同济第七版上册", "zhou_content": "同学你好，还在吗？", "zhou_is_read": 1, "zhou_created_at": "2026-10-29 09:12:00" }
    ],
    "zhou_unread": 1
  }
}
```

- 失败响应：`{ "code": 400, "msg": "缺少必填参数：zhou_user_id", "data": null }`
- 修改时间：2026-11-09

### 20. 发送私信

- 接口路径：`/api/message`
- HTTP 方法：POST
- 请求参数：`{ "zhou_goods_id": 1, "zhou_sender_id": 2, "zhou_receiver_id": 1, "zhou_content": "同学你好，明天能交易吗？" }`
- 响应格式：`{ "code": 0, "msg": "私信发送成功", "data": { "zhou_message_id": 11 } }`
- 失败响应：`{ "code": 400, "msg": "不能给自己发送私信", "data": null }`
- 修改时间：2026-11-09

### 21. 标记私信已读

- 接口路径：`/api/message/:zhou_id/read`
- HTTP 方法：PUT
- 请求参数：路径 `zhou_id`（私信主键）
- 响应格式：`{ "code": 0, "msg": "已标记为已读", "data": { "zhou_changes": 1 } }`
- 修改时间：2026-11-09

### 22. 收藏列表

- 接口路径：`/api/favorite`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（必填，用户主键）
- 响应格式：`{ "code": 0, "msg": "获取收藏列表成功", "data": { "zhou_list": [{ "zhou_favorite_id": 1, "zhou_goods_id": 9, "zhou_title": "索尼 WH-1000XM4 降噪耳机", "zhou_price": 780, "zhou_created_at": "2026-10-01 10:15:00" }] } }`
- 修改时间：2026-11-09

### 23. 收藏 / 取消收藏（切换）

- 接口路径：`/api/favorite`
- HTTP 方法：POST
- 请求参数：`{ "zhou_user_id": 1, "zhou_goods_id": 2 }`
- 响应格式：`{ "code": 0, "msg": "收藏成功", "data": { "zhou_canceled": false } }`（取消时 msg 为「已取消收藏」，`zhou_canceled` 为 true）
- 修改时间：2026-11-09

---

## 六、错误码约定

| code | 含义 | 典型场景 |
| --- | --- | --- |
| 0 | 成功 | 正常返回业务数据 |
| 400 | 参数错误 | 缺少必填参数、价格非法、购买自己的商品 |
| 401 | 认证失败 | 账号或密码错误 |
| 403 | 状态禁止 | 账号被封禁无法登录 |
| 404 | 资源不存在 | 商品不存在、订单不存在、接口不存在 |
| 409 | 状态冲突 | 账号已注册、商品已售出无法下单 |
| 500 | 服务器异常 | 未捕获异常，统一返回 `服务器内部错误：xxx` |

- 修改时间：2026-11-09
---

## 七、数据库切换记录（2026-11-09）

- 变更内容：数据层由 SQLite（Node 内置 node:sqlite）切换为 **MySQL 8.4**（mysql2 连接池），
  SQLite 方案已按项目规范「二选一」原则删除（`db/zhou_init.sql` 与 SQLite 数据文件不再使用）。
- 接口影响：**无**。所有接口路径、请求参数、响应结构与错误码保持不变，
  仅底层实现由同步调用改为 async/await，数据访问层接口由 `db/zhou_db.js` 统一屏蔽驱动差异。
- 数据一致性：测试数据已通过 `npm run initdb` 全量迁移到 MySQL，表结构与数据条数与原 SQLite 版本一致。
- 连接配置：`backend/.env` 的 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME，
  服务启动时由 `db/zhou_db.js` 的 `zhou_check()` 自检连接，连接失败会在控制台给出明确提示。
- 修改时间：2026-11-09
---

## 八、AI 智能客服接口（2026-11-12 新增）

> 链路：关键词切分 → 词表反查 → MySQL 商品/公告召回 → 相关性打分重排 →
> 知识上下文拼装 → 大模型生成 → 引用溯源返回。
> 大模型通过 OpenAI 兼容协议调用，密钥写在 backend/.env（LLM_API_KEY），不进入代码库。

### 24. 智能客服问答

- 接口路径：`/api/ai/chat`
- HTTP 方法：POST
- 请求参数：`{ "zhou_question": "有什么耳机" }`
  - `zhou_question`：必填，字符串，最长 500 字；为空或非字符串返回 400
- 响应格式：

```json
{
  "code": 0,
  "msg": "智能客服回答成功",
  "data": {
    "zhou_question": "有什么耳机",
    "zhou_answer": "平台上目前有一款耳机在售：索尼 WH-1000XM4 降噪耳机……",
    "zhou_model": "deepseek-ai/DeepSeek-V4-Flash",
    "zhou_elapsed": 4847,
    "zhou_usage": { "prompt_tokens": 288, "completion_tokens": 135, "total_tokens": 423 },
    "zhou_prompt": [ { "role": "system", "content": "你是校园二手集市平台的智能客服……" }, { "role": "user", "content": "平台知识库：……" } ],
    "zhou_refs": [
      { "zhou_goods_id": 9, "zhou_title": "索尼 WH-1000XM4 降噪耳机", "zhou_price": 780, "zhou_cate_name": "电子数码", "zhou_trade_place": "一号宿舍楼", "zhou_score": 12 }
    ],
    "zhou_debug": { "zhou_keywords": ["耳机"], "zhou_candidates": 1, "zhou_vocab_size": 313 },
    "zhou_notices": [ { "zhou_title": "校园二手集市交易守则", "zhou_notice_type": "公告" } ]
  }
}
```

- 错误码：
  - `400` 缺少参数 / 参数非字符串 / 问题为空 / 超过 500 字 / 请求体非法 JSON
  - `500` 未配置 `LLM_API_KEY`
  - `502` 大模型调用失败（超时或上游报错）
- 修改时间：2026-11-12

### 25. 获取当前大模型信息

- 接口路径：`/api/ai/model`
- HTTP 方法：GET
- 请求参数：无
- 响应格式：`{ "code": 0, "msg": "获取大模型信息成功", "data": { "zhou_ready": true, "zhou_model": "deepseek-ai/DeepSeek-V4-Flash" } }`
  - `zhou_ready`：为 false 表示 backend/.env 未配置 LLM_API_KEY，聊天接口将返回 500
- 修改时间：2026-11-12

---

## 九、错误码补充（2026-11-12）

| code | 含义 | 典型场景 |
| --- | --- | --- |
| 502 | 上游服务异常 | 大模型接口超时或返回错误 |

- 修改时间：2026-11-12

---

## 十、LLM 应用设计实验新增接口（2026-11-12）

### 26. 智能客服问答（支持多轮上下文与 SSE 流式）

- 接口路径：`/api/ai/chat`
- HTTP 方法：POST
- 请求参数：
  - `zhou_question`（必填，字符串，最长 500 字）
  - `zhou_session_id`（可选，指定会话则携带历史上下文，不传则自动新建会话）
  - `zhou_user_id`（可选，默认 1）、`zhou_model`（可选，切换模型）
  - `zhou_stream`（可选，布尔，true 时以 SSE 流式返回）
- 响应格式（非流式）：`{ "code": 0, "msg": "智能客服回答成功", "data": { "zhou_session_id": 14, "zhou_answer": "...", "zhou_model": "deepseek-ai/DeepSeek-V4-Flash", "zhou_elapsed": 11836, "zhou_usage": { "prompt_tokens": 490, "completion_tokens": 85, "total_tokens": 575 }, "zhou_cost": { "zhou_cost_yuan": 0.0017 }, "zhou_prompt": [], "zhou_summary": "", "zhou_context_rounds": 6, "zhou_compressed": 0, "zhou_refs": [], "zhou_kb_refs": [], "zhou_debug": {} } }`
- 响应格式（流式 SSE，事件体沿用统一格式）：
  - `data: {"code":0,"msg":"增量文本","data":{"zhou_delta":"目前平台上"}}`
  - `data: {"code":0,"msg":"完成","data":{"zhou_answer":"...","zhou_elapsed":11836,"zhou_usage":{},"zhou_refs":[]}}`
- 错误码：`400` 参数非法 / `404` 会话不存在 / `500` 未配置密钥 / `502` 大模型调用失败
- 修改时间：2026-11-12

### 27. 获取当前大模型信息

- 接口路径：`/api/ai/model`
- HTTP 方法：GET
- 请求参数：无
- 响应格式：`{ "code": 0, "msg": "获取大模型信息成功", "data": { "zhou_ready": true, "zhou_model": "deepseek-ai/DeepSeek-V4-Flash", "zhou_keep_rounds": 6, "zhou_ctx_budget": 4000 } }`
- 修改时间：2026-11-12

### 28. 获取平台可用模型列表

- 接口路径：`/api/ai/models`
- HTTP 方法：GET
- 请求参数：无
- 响应格式：`{ "code": 0, "msg": "获取模型列表成功", "data": { "zhou_list": [{ "zhou_id": "deepseek-ai/DeepSeek-V4-Flash", "zhou_owned": "siliconflow" }], "zhou_current": "deepseek-ai/DeepSeek-V4-Flash" } }`
- 修改时间：2026-11-12

### 29. Token 用量与费用统计

- 接口路径：`/api/ai/stats`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（可选，默认 1）
- 响应格式：`{ "code": 0, "msg": "获取用量统计成功", "data": { "zhou_session_count": 6, "zhou_message_total": 12, "zhou_token_total": 3357, "zhou_cost": { "zhou_cost_yuan": 0.0067 } } }`
- 修改时间：2026-11-12

### 30. 评论情感分类（结构化 JSON 输出）

- 接口路径：`/api/ai/structured`
- HTTP 方法：POST
- 请求参数：`{ "zhou_text": "卖家很靠谱，耳机降噪效果超出预期。" }`（必填，最长 1000 字）
- 响应格式：`{ "code": 0, "msg": "结构化解析成功", "data": { "zhou_result": { "zhou_sentiment": "positive", "zhou_confidence": 0.95, "zhou_aspects": ["商品质量", "物流"], "zhou_entities": [{ "zhou_name": "耳机", "zhou_type": "other" }], "zhou_summary": "卖家靠谱，耳机降噪与续航超出预期。", "zhou_need_review": false }, "zhou_raw": "{...}", "zhou_retry": 0, "zhou_schema": {} } }`
- 说明：后端对模型输出执行 JSON 解析、字段与类型校验，失败自动重试一次，仍失败返回兜底结果（need_review=true）
- 修改时间：2026-11-12

### 31. 会话列表

- 接口路径：`/api/session`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（可选，默认 1）
- 响应格式：`{ "code": 0, "msg": "获取会话列表成功", "data": { "zhou_list": [{ "zhou_session_id": 1, "zhou_title": "询问降噪耳机价格", "zhou_model": "deepseek-ai/DeepSeek-V4-Flash", "zhou_summary": "...", "zhou_message_count": 4, "zhou_token_total": 812, "zhou_created_at": "2026-11-09 09:12:00", "zhou_updated_at": "2026-11-09 09:18:00" }] } }`
- 修改时间：2026-11-12

### 32. 新建会话

- 接口路径：`/api/session`
- HTTP 方法：POST
- 请求参数：`{ "zhou_user_id": 1, "zhou_title": "新的对话", "zhou_model": "deepseek-ai/DeepSeek-V4-Flash" }`（除 zhou_user_id 外均可选）
- 响应格式：`{ "code": 0, "msg": "创建会话成功", "data": { "zhou_session_id": 15, "zhou_title": "新的对话" } }`
- 修改时间：2026-11-12

### 33. 会话详情与历史消息回放

- 接口路径：`/api/session/:zhou_id`
- HTTP 方法：GET
- 请求参数：路径参数 `zhou_id`（会话主键）
- 响应格式：`{ "code": 0, "msg": "获取会话详情成功", "data": { "zhou_session": {}, "zhou_messages": [{ "zhou_message_id": 1, "zhou_role": "user", "zhou_content": "...", "zhou_tokens": 26, "zhou_elapsed": 0, "zhou_created_at": "2026-11-09 09:12:00" }] } }`
- 修改时间：2026-11-12

### 34. 重命名会话

- 接口路径：`/api/session/:zhou_id`
- HTTP 方法：PUT
- 请求参数：`{ "zhou_title": "耳机咨询改" }`
- 响应格式：`{ "code": 0, "msg": "重命名会话成功", "data": { "zhou_session_id": 14, "zhou_title": "耳机咨询改" } }`
- 修改时间：2026-11-12

### 35. 删除会话

- 接口路径：`/api/session/:zhou_id`
- HTTP 方法：DELETE
- 请求参数：路径参数 `zhou_id`
- 响应格式：`{ "code": 0, "msg": "删除会话成功", "data": { "zhou_session_id": 14 } }`（消息随外键级联删除）
- 修改时间：2026-11-12

### 36. 导出会话

- 接口路径：`/api/session/:zhou_id/export`
- HTTP 方法：GET
- 请求参数：路径参数 `zhou_id`
- 响应格式：`{ "code": 0, "msg": "导出会话成功", "data": { "zhou_session_id": 14, "zhou_title": "耳机咨询改", "zhou_text": "# 耳机咨询改\n模型：deepseek-ai/DeepSeek-V4-Flash\n\n我：平台上有什么耳机在卖？\n\nAI：平台上目前有一款耳机在售……" } }`
- 修改时间：2026-11-12

### 37. 知识库文件上传

- 接口路径：`/api/kb/upload`
- HTTP 方法：POST（multipart/form-data）
- 请求参数：表单字段 `zhou_file`（必填，PDF/TXT，≤10MB）、`zhou_user_id`（可选，默认 1）
- 响应格式：`{ "code": 0, "msg": "知识库文件解析入库成功", "data": { "zhou_doc_id": 9, "zhou_file_name": "教材推荐清单.txt", "zhou_file_type": "txt", "zhou_file_size": 297, "zhou_char_count": 72, "zhou_chunk_count": 1, "zhou_chunks": [{ "zhou_chunk_index": 0, "zhou_keywords": "教材,交易", "zhou_excerpt": "..." }] } }`
- 说明：PDF 用 pdf-parse 解析，TXT 按 UTF-8 直读；文本按句切分（默认 300 字）后写入 zhou_kb_chunk
- 错误码：`400` 未收到文件 / 格式不支持 / 内容为空 / 超过 10MB
- 修改时间：2026-11-12

### 38. 知识库文档列表

- 接口路径：`/api/kb/doc`
- HTTP 方法：GET
- 请求参数：`zhou_user_id`（可选，默认 1）
- 响应格式：`{ "code": 0, "msg": "获取知识库文档列表成功", "data": { "zhou_list": [{ "zhou_doc_id": 1, "zhou_file_name": "校园二手集市交易守则.txt", "zhou_file_type": "txt", "zhou_file_size": 2048, "zhou_chunk_count": 2, "zhou_char_count": 386, "zhou_status": "已解析", "zhou_created_at": "2026-11-08 10:00:00" }] } }`
- 修改时间：2026-11-12

### 39. 知识库文档切片详情

- 接口路径：`/api/kb/doc/:zhou_id`
- HTTP 方法：GET
- 请求参数：路径参数 `zhou_id`（文档主键）
- 响应格式：`{ "code": 0, "msg": "获取文档切片成功", "data": { "zhou_doc": {}, "zhou_chunks": [{ "zhou_chunk_id": 1, "zhou_chunk_index": 0, "zhou_content": "...", "zhou_keywords": "交易守则,当面交易" }] } }`
- 修改时间：2026-11-12

### 40. 删除知识库文档

- 接口路径：`/api/kb/doc/:zhou_id`
- HTTP 方法：DELETE
- 请求参数：路径参数 `zhou_id`
- 响应格式：`{ "code": 0, "msg": "删除知识库文档成功", "data": { "zhou_doc_id": 9 } }`（切片随外键级联删除）
- 修改时间：2026-11-12

---

## 十一、端口变更记录（2026-11-12）

- 变更内容：后端服务端口由 **8105** 调整为 **8325**，与《LLM应用设计 实验指导书》
  「网络与端口：后端服务端口固定为 8325」的要求一致。
- 影响范围：`backend/.env` 的 PORT、`backend/.env.example`、`backend/app.js` 默认端口；
  前端页面由后端 express.static 托管，使用相对路径 /api/... 调用，无需改动。
- 访问地址：http://127.0.0.1:8325/ （聊天页 http://127.0.0.1:8325/chat.html ）
- 修改时间：2026-11-12
