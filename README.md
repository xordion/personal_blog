# AWS 个人网站模板

本目录包含：
- `frontend/`：React + webpack + less 前端（包含首页与简历页）
- `backend/`：评论 API（Node.js + SQLite）

发布前先替换示例内容中的姓名、链接、邮箱。

## 推荐部署架构（React + Node.js，含安全）

前端（React + less + webpack）：
- 构建输出目录：`dist/`
- 托管：`S3(私有)` + `CloudFront` + `Route53` + `ACM`
- 安全：CloudFront 开启 `WAF`、开启 `HTTPS only`、S3 仅允许 CloudFront OAC 访问

后端（评论 API）：
- 应用：`backend/src/server.js`
- 部署：优先 `ECS Fargate` 或 `App Runner`
- 数据库：生产建议 `RDS PostgreSQL`（当前示例为 SQLite，适合入门和单实例）
- 安全：`ALB + ACM HTTPS`、安全组仅开放 443、应用启用 `helmet + rate limit + CORS 白名单`

## 评论功能说明

- 在 `frontend/src/pages/ResumePage.jsx` 中支持：
  - 选中文本后显示悬浮按钮，点击出现评论气泡
  - 气泡中提交评论后，评论显示在页面底部
  - 选中文本会以双引号包裹，灰色展示在评论正文上方
  - 也支持直接在页面底部输入框提交评论
  - 评论者名称使用请求 IP
- API 路径为 `/api/comments`

## 本地运行评论 API

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

3. 启动服务
```bash
npm run dev
```

默认监听 `http://localhost:3000`，数据库文件为 `backend/data/comments.db`。

## 本地联调（前后端）

1. 启动后端 API（3000）
```bash
cd backend
npm install
npm run dev
```

2. 启动 React 前端（8080）
```bash
cd ../frontend
npm install
npm run dev
```

3. 访问联调地址
- 前端：`http://localhost:8080`
- 简历页：`http://localhost:8080/resume`

说明：
- `webpack-dev-server` 已代理 `/api` 到 `http://localhost:3000`
- 因此前端本地运行时也能直接调用评论接口，无需手动改 API 域名
