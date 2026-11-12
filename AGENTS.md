<!--
  姓名：周浩 | 学号：24001010105 |
  时间：2026-11-09 | 大模型：Space Bunny
-->

## 项目结构与技术栈
- 前端：frontend/ 目录
  - 原生 HTML、CSS、JavaScript，禁止使用任何第三方库、框架、CDN 链接
  - 目录结构：frontend/ 下建 css/、js/、fonts/、images/ 子目录；
    fonts/ 存放 iconfont 图标文件（如果有）
- 后端：backend/ 目录，Node.js + Express，RESTful+MVC 风格，
  所有接口以 /api/ 为前缀，端口固定为 8325（与《LLM应用设计 实验指导书》一致），
  并以 express.static 托管 frontend/ 目录
  后端支持所有跨域访问。
- 后端依赖安装：优先 cnpm i 包名；失败或超时则使用 npm i 包名
- 数据库： SQLite 与 MySQL 二选一（本项目已选 **MySQL 8.4**，驱动 mysql2 连接池；
  SQLite 方案已按"另一个删除"的要求清理，建表脚本为 backend/db/zhou_init_mysql.sql）
- 数据库凭据写入 backend/.env（变量名：DB_USER、DB_PASSWORD、
  DB_HOST、DB_NAME），不得出现在代码或 AGENTS.md 中；
  .env 同时加入 .gitignore
- 根据后端的要求自行建立和修改数据库表，每张表建立后，插入至少 8 条有真实业务意义的测试数据

## 命名与注释
- CSS 类名、JS 变量名、JS 函数名、数据库表名（及字段相关命名）
  一律以 zhou_ 开头
- 每个文件头部包含注释块：
  姓名：周浩 | 学号：24001010105 |
  时间：yyyy-mm-dd | 大模型：{本次使用的大模型名称}

## 记录文件（一律追加写入，禁止覆盖已有内容）
- zhouhao_prompt.md（项目根目录）：每次向 AI 发出开发指令后，
  追加记录：时间 | 提示词全文 | 大模型名称
- backend/zhou_interface.md：每次创建或修改接口后，追加：
  接口路径 | HTTP 方法 | 请求参数（含示例）|
  响应格式（含 JSON 示例）| 修改时间
- backend/zhou_database.md：每次建表、改表或插入数据后，
  按执行顺序追加对应 SQL 语句（含测试数据的 INSERT），
  要求仅凭此文件即可在新机器上完整重建数据库
- 统一 JSON 响应格式：{ "code": 0, "msg": "提示信息", "data": {...} }，
  code=0 表示成功，非 0 表示失败
- 镜像约定：实验指导书以占位符 yuan_ 命名记录文件，故同时维护
  backend/yuan_interface.md、backend/yuan_database.md、yuanlei_prompt.md，
  内容与上述 zhou_ 版本保持一致（改 zhou_ 后同步刷新镜像）
## LLM 应用约定（2026-11-12 新增）
- 大模型凭据只允许出现在 backend/.env（LLM_API_KEY / LLM_BASE_URL / LLM_MODEL），
  .env 已在 .gitignore 中，禁止写入代码、文档与提交记录
- 所有模型调用统一经 backend/utils/zhou_llm.js 封装，前端不得直接请求大模型地址
- 聊天接口 POST /api/ai/chat 支持 zhou_stream=true 的 SSE 流式返回，
  流式事件体沿用 { code, msg, data } 统一格式
- 多轮对话：保留最近 LLM_KEEP_ROUNDS 轮原文，更早消息压缩为摘要写入
  zhou_session.zhou_summary，并记录 zhou_summarized_count 防止重复压缩
- 知识库：文件仅支持 PDF / TXT，单个不超过 10MB，切片写入 zhou_kb_chunk，
  检索优先使用 ngram 全文索引，无命中时 LIKE 兜底
- 结构化输出：必须先定义 JSON 结构，再实现提示词与解析校验，
  后端需完成 JSON 解析、字段与类型校验，失败重试一次并提供兜底结果

## 前端约定
- 服务器返回的数据和错误信息输出到浏览器控制台（console.log /
  console.error）；
- 新建 HTML 页面后，在 frontend/index.html 中追加超链接入口；
  文件名包含 detail 的页面除外
