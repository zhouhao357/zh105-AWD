---
name: image-link-and-table
overview: 在 index.html 中添加图片超链接区域（点击图片跳转到 2-1.html），并新建 2-1.html 页面，包含一个四行三列的"大国重器"表格（含表头）。
todos:
  - id: add-image-link
    content: 在 index.html 中添加图片超链接区域，点击图片跳转到 2-1.html
    status: completed
  - id: create-table-page
    content: 新建 2-1.html，实现四行三列大国重器表格，保持深色风格并添加返回首页链接
    status: completed
    dependencies:
      - add-image-link
---

## 产品概述

在现有个人主页基础上，增加图片超链接功能，并新建一个展示"大国重器"的表格页面。

## 核心功能

- 在 index.html 中添加图片超链接区域，点击图片跳转到 2-1.html
- 新建 2-1.html 页面，包含四行三列的"大国重器"表格（含表头）
- 表格内容：名称、类别、简介三列，展示中国重大科技工程/装备
- 2-1.html 风格与 index.html 保持一致（深色玻璃拟态风格）
- 页面间可互相跳转

## 技术栈

- 纯 HTML + CSS，无框架依赖
- 延续 index.html 现有技术方案：Inter 字体、CSS 变量、玻璃拟态卡片、渐变背景动画
- 表格使用原生 `<table>` + `<thead>` + `<tbody>` 结构

## 实现方案

### index.html 修改

- 在分割线 `.divider` 与快捷链接之间，新增"图片导航"区域
- 使用 `<a href="2-1.html">` 包裹 `<img>` 实现图片超链接
- 图片使用 Unsplash 占位图（大国重器相关科技主题），设置 `border-radius`、`hover` 缩放效果
- 新增对应 CSS 样式：`.image-link-section`、`.image-link`、`.image-link img`

### 2-1.html 新建

- 复用 index.html 的深色背景、CSS 变量、动态光斑、网格底层等视觉体系
- 卡片内含：标题"大国重器"、四行三列表格、返回首页链接
- 表格结构：`<thead>` 一行表头（名称 | 类别 | 简介），`<tbody>` 三行数据（如歼-20、山东舰、天宫空间站）
- 表格样式：半透明行背景、hover 行高亮、圆角边框、与卡片风格统一

## 实现注意事项

- 图片使用外链占位图，需确保 URL 可访问；如不可用则用 CSS 渐变占位
- 表格在窄屏下使用 `overflow-x: auto` 保证可滚动
- 两个页面间链接使用相对路径（`2-1.html` / `index.html`），无需域名
- 保持 index.html 现有内容不动，仅新增图片区域

## 架构设计

```mermaid
graph LR
    A[index.html<br/>个人主页] -->|点击图片| B[2-1.html<br/>大国重器表格]
    B -->|返回链接| A
```

## 目录结构

```
d:/高级网页设计/
├── index.html    # [MODIFY] 在分割线与快捷链接之间新增图片超链接区域
└── 2-1.html      # [NEW] 大国重器表格页面，深色风格，含四行三列表格和返回首页链接
```