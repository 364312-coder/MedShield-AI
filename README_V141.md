# MedShield-AI Web v1.4.1 — Capability Architecture

仅修改“核心能力”区块。

覆盖文件：
- public/index.html
- public/impeccable-v14.css
- public/impeccable-v14.js

不修改：
- public/app.js
- public/data/
- wrangler.jsonc
- src/
- migrations/
- D1 / Worker API

核心能力由原 8 个小卡片重构为 6 层系统能力架构：
AI 风险感知 → Policy Engine → 主动防御 → 医疗数据完整性 → 密码与备份 → 安全评估与反馈。
