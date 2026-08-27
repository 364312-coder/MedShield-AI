# MedShield-AI Web v1.0 全栈版

这一版不再是 GitHub Pages 的纯静态模拟页面。

## 架构

```text
浏览器
  ↓
Cloudflare Workers Static Assets
  ↓
/api/*
  ↓
Worker API
  ↓
Cloudflare D1
```

## 真正持久化的内容

- 事件当前阶段
- 事件状态
- 每次处置动作
- 审计日志

刷新页面以后，处置阶段不会恢复到初始状态。

## 保持只读的正式实验数据

以下文件继续作为正式 run 证据，不被网页修改：

- `public/data/summary.json`
- `public/data/metrics.json`
- `public/data/run_config.json`
- `public/data/behavior_manifest.json`
- `public/data/results.csv`

## API

- `GET /api/health`
- `GET /api/incidents`
- `POST /api/incidents/:id/action`
- `POST /api/incidents/:id/reset`
- `GET /api/audit?incident_id=...`
- `DELETE /api/audit?incident_id=...`

动作顺序：

```text
analyze
→ defend
→ integrity
→ recover
→ audit
```

后端会校验阶段顺序，不能跳步骤。

## 本地运行

这一版不要再使用：

```text
python -m http.server
```

因为 Python 静态服务器没有 `/api/*` 后端。

正确方式：

```powershell
npm install
npx wrangler d1 migrations apply medshield-ai-db --local
npm run dev
```

Wrangler 会同时启动静态前端、本地 Worker API 和本地 D1。

## 正式部署

1. 登录 Cloudflare：

```powershell
npx wrangler login
```

2. 创建 D1：

```powershell
npx wrangler d1 create medshield-ai-db
```

3. 把命令返回的数据库 ID 写入 `wrangler.jsonc` 的：

```text
REPLACE_WITH_D1_DATABASE_ID
```

4. 初始化远程数据库：

```powershell
npm run db:migrate:remote
```

5. 部署：

```powershell
npm run deploy
```

部署完成后会得到真实公网 `*.workers.dev` 地址。

## 重要边界

网页操作现在会真实调用后端 API 并持久化数据库，但：
- 权限/网络隔离仍是竞赛系统内的处置状态记录，不直接控制真实医院基础设施；
- 正式 AI 模型目前没有部署成在线推理服务，风险结果仍基于正式实验方案与预置事件；
- DICOM 原生运行时和 EMR 内嵌水印运行时仍保持原能力边界。
