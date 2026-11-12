# 校园二手交易平台 + LLM 智能客服

> 姓名：周浩 ｜ 学号：24001010105 ｜ 班级：计科24001 ｜ 课程：高级网页设计 I
> 项目类型：全栈三级项目 + 《LLM 应用设计》实验（前后端分离 + 大模型 API 调用）

一个面向本校师生的二手物品交易平台，并在其上扩展了 **基于大语言模型的 AI 智能客服**：
后端以 Node.js + Express 作为中间层保管 API Key 并转发请求，前端通过后端接口与大模型交互，
知识库来自 MySQL 商品库 / 公告库 / 本地上传文件（RAG），回答附带引用溯源。

---

## 一、功能清单

### 1. 交易平台基础功能

| 模块 | 页面 | 说明 |
| --- | --- | --- |
| 首页 | `index.html` | 平台统计、热门商品、公告、功能入口 |
| 逛集市 | `goods.html` | 商品列表、分类筛选、关键词搜索、分页 |
| 商品详情 | `goods-detail.html` | 详情、收藏、下单、联系卖家 |
| 发布闲置 | `publish.html` | 表单校验并提交商品 |
| 登录注册 | `login.html` | 账号登录、注册 |

### 2. LLM 应用（本次实验重点）

| 模块 | 页面 / 接口 | 说明 |
| --- | --- | --- |
| 多轮智能问答 | `chat.html` + `POST /api/ai/chat` | SSE 流式输出、Enter 发送 / Shift+Enter 换行、**生成中断**、Markdown 与代码块渲染 |
| 会话管理 | `GET/POST/PUT/DELETE /api/session` | 会话列表、重命名、删除、历史消息回放、导出为 txt |
| 上下文管理 | 后端 `zhou_prepare_context` | 保留最近 6 轮原文，更早的消息由大模型压缩为摘要写入会话表，并按 Token 预算裁剪 |
| RAG 知识库 | `kb.html` + `POST /api/kb/upload` | PDF / TXT 上传 → 解析 → 按句切分入库 → ngram 全文索引 → Top-K 检索 → 标注引用来源 |
| 结构化输出 | `structured.html` + `POST /api/ai/structured` | 评论情感分类与实体抽取，输出固定 JSON 结构，含解析、字段校验、重试与兜底 |
| 模型切换 | `GET /api/ai/models` | 拉取平台可用模型（97 个）并在下拉框切换 |
| 用量统计 | `GET /api/ai/stats` | 会话数、消息数、累计 token 与费用估算 |

### 3. 工程规范

- 前端：原生 HTML / CSS / JavaScript，**不引入任何第三方框架与 CDN**
- 后端：Node.js + Express，RESTful + MVC 风格，全部接口以 `/api/` 为前缀，统一返回 `{ code, msg, data }`
- 数据库：MySQL 8.4（mysql2 连接池），12 张表，每表不少于 8 条真实业务测试数据
- 密钥与凭据只写入 `backend/.env`（已在 `.gitignore` 中），不入代码库
- 所有请求参数与响应数据输出到浏览器控制台，便于取证与调试

---

## 二、环境要求

| 项目 | 版本 / 要求 |
| --- | --- |
| Node.js | 24 及以上 |
| MySQL | 8.0 及以上（本机使用 8.4.6） |
| 浏览器 | Edge 或 Chrome |
| 大模型平台 | 硅基流动 SiliconFlow（默认模型 `deepseek-ai/DeepSeek-V4-Flash`） |
| 网络 | 需可访问大模型 API |

后端依赖（`backend/package.json`）：`express`、`cors`、`dotenv`、`mysql2`、`multer`、`pdf-parse`

---

## 三、目录结构

```
高级网页设计/
├── AGENTS.md                  项目开发规范（命名、注释、记录文件约定）
├── README.md                  本文件
├── zhouhao_prompt.md          提示词记录（根目录，另有镜像 yuanlei_prompt.md）
├── frontend/                  前端（原生三件套）
│   ├── index.html  goods.html  goods-detail.html  publish.html  login.html
│   ├── chat.html              AI 智能客服（多轮对话）
│   ├── kb.html                RAG 知识库管理
│   ├── structured.html         结构化输出（评论情感分类）
│   ├── css/zhou_main.css  css/zhou_chat.css
│   ├── js/zhou_api.js  zhou_common.js  zhou_md.js
│   ├── js/zhou_chat.js  zhou_kb.js  zhou_structured.js
│   └── images/  fonts/
├── backend/                   后端（Node.js + Express）
│   ├── app.js                 服务入口（端口 8325，静态托管 frontend/）
│   ├── .env                   凭据配置（gitignore，不入库）
│   ├── .env.example           配置示例
│   ├── db/zhou_db.js          mysql2 连接池封装
│   ├── db/zhou_init_mysql.sql 平台 8 张表全量脚本
│   ├── db/zhou_init_llm.sql   LLM 实验 4 张表全量脚本
│   ├── models/                数据层
│   ├── controllers/           控制器
│   ├── routes/zhou_index.js   路由汇总
│   ├── middleware/            统一响应与异常处理
│   ├── utils/zhou_llm.js      大模型调用封装（流式 / 非流式 / 费用估算）
│   ├── zhou_interface.md      接口文档（镜像 yuan_interface.md）
│   └── zhou_database.md       数据库文档（镜像 yuan_database.md）
```

---

## 四、配置项（backend/.env）

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `DB_USER` / `DB_PASSWORD` | MySQL 账号密码 | 必填 |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | 数据库地址、端口、库名 | `127.0.0.1` / `3306` / `zhou_campus_market` |
| `PORT` | 后端服务端口（实验指导书要求 8325） | `8325` |
| `LLM_API_KEY` | 大模型 API Key（**私密，只放 .env**） | 必填 |
| `LLM_BASE_URL` | OpenAI 兼容接口地址 | `https://api.siliconflow.cn/v1` |
| `LLM_MODEL` | 默认模型 | `deepseek-ai/DeepSeek-V4-Flash` |
| `LLM_TIMEOUT` | 调用超时（毫秒） | `45000` |
| `LLM_KEEP_ROUNDS` | 上下文保留轮数 | `6` |
| `LLM_CTX_BUDGET` | 上下文 Token 预算 | `4000` |
| `KB_CHUNK_SIZE` | 知识库切片目标字数 | `300` |
| `LLM_PRICE_INPUT` / `LLM_PRICE_OUTPUT` | 费用估算单价（元 / 百万 token） | `2` / `8` |

---

## 五、启动步骤

```bash
# 1. 安装依赖
cd backend
npm i

# 2. 配置凭据
copy .env.example .env      # Windows；Linux/macOS 用 cp
#   然后编辑 .env，填入 MySQL 密码与 LLM_API_KEY

# 3. 初始化数据库（12 张表 + 测试数据）
npm run initdb              # 平台 8 张表
node db/zhou_init_llm.js    # LLM 实验 4 张表

# 4. 启动服务
npm start                   # 或 node app.js
```

启动成功后：

- 首页：<http://127.0.0.1:8325/>
- AI 客服：<http://127.0.0.1:8325/chat.html>
- 知识库：<http://127.0.0.1:8325/kb.html>
- 结构化输出：<http://127.0.0.1:8325/structured.html>

测试账号：`zhou01` ~ `zhou10`，密码均为 `123456`（MD5 加盐存储，盐值 `sbtest_2026`）。
---

## 六、接口清单（共 40 个，全部以 /api/ 为前缀）

| 模块 | 接口 | 方法 |
| --- | --- | --- |
| 首页 | `/home`、`/notice` | GET |
| 商品 | `/goods`、`/goods/:id`、`/category` | GET |
| 商品 | `/goods`、`/goods/:id/status`、`/goods/:id` | POST / PUT / DELETE |
| 用户 | `/user/login`、`/user/register`、`/user`、`/user/:id` | POST / GET / PUT |
| 订单 | `/order`、`/order/:id/status`、`/comment` | GET / POST / PUT |
| 私信收藏 | `/message`、`/message/:id/read`、`/favorite` | GET / POST / PUT |
| **AI 客服** | `/ai/chat`、`/ai/model`、`/ai/models`、`/ai/stats`、`/ai/structured` | POST / GET |
| **会话** | `/session`、`/session/:id`、`/session/:id/export`、`/session/stats` | GET / POST / PUT / DELETE |
| **知识库** | `/kb/upload`、`/kb/doc`、`/kb/doc/:id` | POST / GET / DELETE |

完整参数与响应示例见 `backend/zhou_interface.md`（镜像 `backend/yuan_interface.md`）与
`backend/zhou_database.md`（镜像 `backend/yuan_database.md`）。

---

## 七、数据库重建

仅凭 `backend/zhou_database.md` 中的 SQL 即可在新机器上完整重建数据库：

```bash
cd backend
npm run initdb              # 执行 db/zhou_init_mysql.sql
node db/zhou_init_llm.js    # 执行 db/zhou_init_llm.sql
```

12 张表：

`zhou_user`、`zhou_category`、`zhou_goods`、`zhou_order`、`zhou_comment`、`zhou_message`、
`zhou_favorite`、`zhou_notice`（平台 8 张）
`zhou_session`、`zhou_chat_message`、`zhou_kb_doc`、`zhou_kb_chunk`（LLM 实验 4 张）

---

## 八、实现要点

### 1. 中间层代理

浏览器不直接访问大模型。前端 `fetch('/api/ai/chat')` → Express 校验参数、组装 messages、
从 `.env` 读取密钥转发到 SiliconFlow → 按统一格式返回，前端全程接触不到密钥。

### 2. 提示词工程

系统提示词明确角色、任务边界、输出格式与字数限制（≤200 字），并要求"没有资料时明确说明"，
避免模型编造商品与价格；结构化输出场景额外使用少样本示例固化 JSON 格式。

### 3. 上下文管理与压缩

- 历史消息按顺序追加进 `messages`，实现多轮对话
- 只保留最近 `LLM_KEEP_ROUNDS` 轮原文，更早的消息交由大模型压缩为 120 字摘要，
  写入 `zhou_session.zhou_summary`，同时记录 `zhou_summarized_count` 防止重复压缩
- 近期原文若超出 `LLM_CTX_BUDGET`，从最旧一条开始丢弃，保证不超上下文窗口

### 4. RAG 检索

```
用户问题 → 2 字滑窗切词 → 库内词表反查 → 商品库 LIKE 召回 + 打分重排
        → 公告库召回 → 知识库切片全文索引（ngram）召回，无命中时 LIKE 兜底
        → 合并 Top-K → 拼进 system prompt → 模型生成 → 返回引用溯源
```

### 5. 结构化输出的可靠性

定义 JSON 结构 → 提示词 + 少样本示例 → 模型输出 → 去掉代码块包裹 → `JSON.parse`
→ 字段与类型校验（枚举、数值范围、数组元素结构）→ 失败则把错误原因回灌让模型自纠重试一次
→ 仍失败返回兜底结果并置 `need_review=true`，绝不把未校验的模型输出直接透给前端。

### 6. 流式输出与中断

`zhou_stream=true` 时后端以 SSE 逐块推送增量文本，事件体沿用 `{ code, msg, data }`；
前端用 `fetch` + `ReadableStream` 读取，用 `AbortController` 实现"中断"按钮。

---

## 九、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 启动报 `EADDRINUSE` | 8325 端口被旧进程占用，先结束旧 `node app.js` 进程 |
| 控制台提示「未配置 LLM_API_KEY」 | `backend/.env` 中缺少或未正确填写 `LLM_API_KEY` |
| 聊天接口返回 502 | 大模型平台超时或网络不通，先用 curl 验证连通性 |
| 知识库检索无命中 | 全文索引为 ngram 模式，需 MySQL 8.0+；初始化脚本会自动创建索引 |
| 端口冲突需临时改端口 | 修改 `backend/.env` 的 `PORT`，前端使用相对路径调用，无需改动 |

---

## 十、版本记录

| 日期 | 内容 |
| --- | --- |
| 2026-11-09 | 完成平台 8 张表与 23 个接口，SQLite → MySQL 8.4 迁移 |
| 2026-11-12 | 完成《LLM 应用设计》实验：新增 4 张表、17 个 AI 相关接口、3 个新页面，流式输出、多轮上下文、RAG 上传、结构化输出、模型切换与用量统计；端口调整为 8325 |