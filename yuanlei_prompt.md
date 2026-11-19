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


## 记录 9

时间：2026-11-19
大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）

提示词全文：

在搞你个登录和注册页面

（说明：排查发现登录/注册页为三级项目原有功能，LLM 实验未改动，但新增的
AI 客服页与知识库页未接入登录态：zhou_user_id 硬编码为 1，且导航栏「退出」
未清除 localStorage、登录成功固定跳首页。本次修复打通登录态与 AI 功能：
1）zhou_api.js 新增 zhou_current_user_id / zhou_current_user_name /
   zhou_set_redirect / zhou_get_redirect / zhou_clear_redirect；
2）zhou_chat.js、zhou_kb.js 改用真实登录用户 ID，未登录时回退游客模式（ID 1）；
3）zhou_common.js 导航「退出」真正清除登录态，「登录 / 注册」记录来源页；
4）zhou_login.js 登录成功后跳回来源页；
5）chat.html 侧栏新增「当前会话归属用户」显示，zhou_chat.css 配套样式。
实测：游客→登录 zhou05→跳回 chat.html→/api/ai/chat 请求 zhou_user_id=5→
知识库按用户隔离→退出后 localStorage 清空→回到游客模式，控制台无报错。）

---
## 记录 10

时间：2026-11-19
大模型：Space Bunny（业务大模型 deepseek-ai/DeepSeek-V4-Flash）

提示词全文：

首页要求动画设计

要求必须登录进去才能进入首页。登录和注册是可以用的

自己优化

（说明：完成首页动画体系与首页登录守卫，并自主优化若干健壮性问题：
1）新增 frontend/css/zhou_anim.css 与 frontend/js/zhou_anim.js（纯原生，无第三方库）：
   Hero 动态网格纹理 + 三团漂浮光斑、标题逐字入场（41 字符阶梯 45ms）、
   副标题打字机、鼠标视差、统计数字 requestAnimationFrame 滚动计数、
   IntersectionObserver 滚动入场、顶部滚动进度条、返回顶部按钮；
2）index.html 增加首页登录守卫（<head> 内联脚本，渲染前跳转，无闪烁），
   未登录时记录来源页，登录成功自动回到首页；
3）login.html 已登录时显示当前用户与「进入首页」按钮；
4）修复 MutationObserver 与计数动画互相触发的死循环（统计值恒为 0）；
5）修复快速滚动跳过元素导致卡片永久隐藏、数字停留在 0 的问题；
6）增加 zhou_anim_ready 兜底类：脚本被禁用或出错时页面内容仍完整可见；
7）支持 prefers-reduced-motion 系统偏好；
8）修正 Hero 描述中残留的「SQLite」为「MySQL 8.4」。
实测：游客访问首页被拦截 → 注册唯一性校验 409 → 登录跳回首页 → 首页动画就绪；
四视口（1440/1024/768/390）均无横向溢出、无控制台报错。）

---