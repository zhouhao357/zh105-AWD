<!--
  姓名：周浩 | 学号：24001010105 |
  时间：2026-11-12 | 大模型：Space Bunny
  说明：本文件为实验指导书占位符命名的镜像，内容与 zhouhao_prompt.md 保持一致。
-->

# AI 提示词记录

> 规则：每次向 AI 发出开发指令后追加一条，格式为「时间 | 提示词全文 | 大模型名称」。
> 一律追加写入，禁止覆盖已有内容。

---

## 记录 1

时间：2026-11-09 13:47
大模型：Space Bunny

提示词全文：

在当前项目根目录创建 AGENTS.md，写入以下规则。

## 项目结构与技术栈
- 前端：frontend/ 目录
  - 原生 HTML、CSS、JavaScript，禁止使用任何第三方库、框架、CDN 链接
  - 目录结构：frontend/ 下建 css/、js/、fonts/、images/ 子目录；
    fonts/ 存放 iconfont 图标文件（如果有）
- 后端：backend/ 目录，Node.js + Express，RESTful+MVC 风格，
  所有接口以 /api/ 为前缀，端口固定为 8325（你的学号后3位），
  并以 express.static 托管 frontend/ 目录
  后端支持所有跨域访问。
- 后端依赖安装：优先 cnpm i 包名；失败或超时则使用 npm i 包名
- 数据库： SQLite； MySQL （用户名root、密码：****），二选一，另外一个删除
- 数据库凭据写入 backend/.env（变量名：DB_USER、DB_PASSWORD、
  DB_HOST、DB_NAME），不得出现在代码或 AGENTS.md 中；
  .env 同时加入 .gitignore
- 根据后端的要求自行建立和修改数据库表，每张表建立后，插入至少 8 条有真实业务意义的测试数据

## 命名与注释
- CSS 类名、JS 变量名、JS 函数名、数据库表名（及字段相关命名）
  一律以 zhou_ 开头
- 每个文件头部包含注释块：
  姓名：【需修改：你的姓名】 | 学号：【需修改：你的学号】 |
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
## 前端约定
- 服务器返回的数据和错误信息输出到浏览器控制台（console.log /
  console.error）；
- 新建 HTML 页面后，在 frontend/index.html 中追加超链接入口；
  文件名包含 detail 的页面除外
。姓名：周浩。学号：24001010105

---

## 记录 2

时间：2026-11-09 13:52
大模型：Space Bunny

提示词全文：

看看做的对不对

---

---

## 记录 3

时间：2026-11-09 14:05
大模型：Space Bunny

提示词全文：

端口改成8105

---

## 记录 4

时间：2026-11-09 14:07
大模型：Space Bunny

提示词全文：

SQ

（说明：选择 SQLite 作为数据库，MySQL 相关配置与驱动不引入，数据库凭据写入 backend/.env）

---
---

## 记录 5

时间：2026-11-09 15:10
大模型：Space Bunny

提示词全文：

用mysql

（说明：数据库由 SQLite 切换为 MySQL 8.4，驱动改用 mysql2 连接池，SQLite 相关文件与脚本删除，
建表与测试数据迁移到 MySQL，凭据写入 backend/.env）

---
## 记录 6

时间：2026-11-12
大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）

提示词全文：

完成一个 chat.html，内容是调用接口完成聊天功能，发送的提示词和接收的数据都在控制台输出。

Api-key：sk-****（已提供，按规范不写入代码与文档，实际只写入 backend/.env 的 LLM_API_KEY，
backend/.env 已在 .gitignore 中）

curl 示例：
curl -X POST https://api.siliconflow.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-****" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash","messages":[{"role":"system","content":"你是一个有用的助手"}]}'

（说明：新增后端接口 POST /api/ai/chat、GET /api/ai/model，
新增前端页面 frontend/chat.html 及其 css/js，发送的提示词与接收的响应均 console 输出）

---

## 记录 7

时间：2026-11-12
大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）

提示词全文：

按《LLM应用设计 实验指导书》与《LLM应用设计 项目报告》模板完善本项目：
补充多轮对话与会话管理、上下文压缩、RAG 文件上传与解析切分、结构化 JSON 输出、
流式输出与中断、模型切换与 token 用量统计，端口改为 8325，并同步 yuan_ 前缀记录文件、
完善 README，生成实验报告与源码压缩包。

（说明：本次按实验指导书补齐 AI 功能完整性与工程规范；密钥仅存于 backend/.env，不入库）

---


## 记录 8

时间：2026-11-12
大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）

提示词全文：

修正历史上传时因编码问题产生的乱码文件名，并复查知识库关键词质量：
1）修正 zhou_kb_doc 中乱码文件名与重名文档，按执行顺序把 SQL 追加到
   backend/zhou_database.md（并同步 yuan_database.md 镜像）；
2）优化切片关键词提取，消除「园二」「手集」「材约」等跨字噪声；
3）回归验证既有 23 个业务接口与全部 LLM 接口不受影响。

（说明：本次仅涉及数据修正与内部实现优化，接口契约与数据库表结构未变更；
关键词提取由「2 字滑窗 + 频次阈值」升级为「正向最大匹配分词 + 词频统计 + 虚词过滤」）

---

