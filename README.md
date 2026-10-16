# 招聘系统接口课堂测试 - 接口说明文档

## 基本信息
- **学生姓名**：周浩
- **学号**：24001010105
- **Email**：2541154643@qq.com
- **City**：大连
- **基础地址**：`http://localhost:8080/api`
- **数据源**：内存临时数据
- **数据格式**：JSON

## 统一返回格式

所有接口返回统一的 JSON 格式：

```json
{
  "code": 200,         // 状态码：200成功，400参数错误，404未找到，500服务器错误
  "message": "操作成功", // 提示信息
  "data": {}           // 数据内容，失败时为null
}
```

---

## 任务01：查询职位详情

- **方法**：GET
- **路径**：`/jobs/{id}`
- **请求示例**：`GET http://localhost:8080/api/jobs/1`

### 正常请求（职位存在）
```json
// 响应 200
{
  "code": 200,
  "message": "查询职位详情成功",
  "data": {
    "id": 1,
    "title": "Java高级开发工程师",
    "company": "阿里巴巴",
    "city": "杭州",
    "salary": "25K-45K",
    "description": "负责核心电商平台的Java后端开发...",
    "requirements": "5年以上Java开发经验..."
  }
}
```

### 异常请求（职位不存在）
```json
// GET http://localhost:8080/api/jobs/999
// 响应 404
{
  "code": 404,
  "message": "职位不存在，编号：999"
}
```

---

## 任务02：创建完整简历

- **方法**：POST
- **路径**：`/resumes`
- **请求体示例**：

```json
{
  "userId": 1,
  "realName": "张三",
  "gender": 1,
  "avatar": "",
  "phone": "13800138001",
  "email": "zhangsan@example.com",
  "city": "杭州",
  "education": "本科",
  "experience": "3年",
  "expectedSalary": "15K-25K",
  "skills": "Java,Spring Boot,MySQL",
  "introduction": "热爱编程，有良好的团队协作能力"
}
```

### 成功响应
```json
// 响应 200
{
  "code": 200,
  "message": "简历创建成功",
  "data": {
    "id": 1,
    "userId": 1,
    "realName": "张三",
    "gender": 1,
    "avatar": "",
    "phone": "13800138001",
    "email": "zhangsan@example.com",
    "city": "杭州",
    "education": "本科",
    "experience": "3年",
    "expectedSalary": "15K-25K",
    "skills": "Java,Spring Boot,MySQL",
    "introduction": "热爱编程，有良好的团队协作能力"
  }
}
```

---

## 任务03：创建简历字段校验

- **方法**：POST
- **路径**：`/resumes`

### 校验规则
| 字段 | 校验规则 |
|------|---------|
| userId | 不能为空 |
| realName | 不能为空 |
| phone | 不能为空，必须为11位手机号格式（1开头） |
| email | 不能为空，必须为合法邮箱格式 |

### 校验失败请求示例
```json
{
  "userId": 1,
  "realName": "",
  "phone": "123",
  "email": "invalid-email",
  "city": "大连"
}
```

### 校验失败响应
```json
// 响应 400
{
  "code": 400,
  "message": "字段校验失败",
  "data": {
    "realName": "姓名不能为空",
    "phone": "电话格式不正确，应为11位手机号",
    "email": "邮箱格式不正确"
  }
}
```

---

## 任务04：查询简历详情

- **方法**：GET
- **路径**：`/resumes/{id}`
- **请求示例**：`GET http://localhost:8080/api/resumes/1`

### 成功响应
```json
// 响应 200
{
  "code": 200,
  "message": "查询简历详情成功",
  "data": {
    "id": 1,
    "userId": 1,
    "realName": "张三",
    "gender": 1,
    "phone": "13800138001",
    "email": "zhangsan@example.com",
    "city": "杭州",
    "education": "本科",
    "experience": "3年",
    "expectedSalary": "15K-25K",
    "skills": "Java,Spring Boot,MySQL",
    "introduction": "热爱编程，有良好的团队协作能力"
  }
}
```

---

## 任务05：查询不存在的简历

- **方法**：GET
- **路径**：`/resumes/{id}`
- **请求示例**：`GET http://localhost:8080/api/resumes/999`

### 失败响应
```json
// 响应 404
{
  "code": 404,
  "message": "简历不存在，编号：999"
}
```

> 不会返回错误的简历数据，data 为 null。

---

## 任务06：修改简历基本信息

- **方法**：PUT
- **路径**：`/resumes/{id}`
- **请求体示例**：

```json
{
  "realName": "张三（已更新）",
  "phone": "13900139001",
  "email": "new@example.com",
  "city": "上海"
}
```

### 成功响应
```json
// 响应 200
{
  "code": 200,
  "message": "简历更新成功",
  "data": {
    "id": 1,
    "userId": 1,
    "realName": "张三（已更新）",
    "gender": 1,
    "phone": "13900139001",
    "email": "new@example.com",
    "city": "上海",
    "education": "本科",
    "experience": "3年",
    "expectedSalary": "15K-25K",
    "skills": "Java,Spring Boot,MySQL",
    "introduction": "热爱编程，有良好的团队协作能力"
  }
}
```

> 采用部分更新策略，仅更新请求体中包含的字段，未提供的字段保持不变。

---

## 任务07：修改简历求职信息

- **方法**：PUT
- **路径**：`/resumes/{id}`
- **请求体示例**：

```json
{
  "education": "硕士",
  "experience": "5年",
  "expectedSalary": "20K-35K",
  "skills": "Java,Spring Cloud,Redis,Kafka",
  "introduction": "资深Java开发工程师，擅长高并发系统设计"
}
```

### 成功响应
```json
// 响应 200
{
  "code": 200,
  "message": "简历更新成功",
  "data": {
    "id": 1,
    "userId": 1,
    "realName": "张三（已更新）",
    "gender": 1,
    "phone": "13900139001",
    "email": "new@example.com",
    "city": "上海",
    "education": "硕士",
    "experience": "5年",
    "expectedSalary": "20K-35K",
    "skills": "Java,Spring Cloud,Redis,Kafka",
    "introduction": "资深Java开发工程师，擅长高并发系统设计"
  }
}
```

---

## 技术栈

- Java 17
- Spring Boot 3.2.3
- Spring Web (REST API)
- Spring Validation (字段校验)
- 内存数据（ConcurrentHashMap）

## 启动方式

```bash
mvn spring-boot:run
```

服务启动后访问 `http://localhost:8080/api` 即可使用所有接口。
