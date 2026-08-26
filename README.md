# MedShield-AI 中文比赛展示前端

这是 MedShield-AI 的单页中文比赛展示版，用于把最终正式实验结果展示成可答辩的网页系统。

## 打开方式

建议用本地服务打开，避免浏览器直接打开文件时拦截 `fetch` 读取 JSON/CSV：

```powershell
cd "C:\Users\18950843148\Desktop\网页设计"
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

公网部署可继续使用 GitHub Pages：

```text
https://364312-coder.github.io/MedShield-AI/
```

## 数据来源

前端只读取 `public/data/` 中从最终正式 run 复制来的只读数据：

```text
summary.json
metrics.json
run_config.json
behavior_manifest.json
results.csv
```

不直接加载完整 `events.jsonl`，不修改原始后端目录，不训练模型，不重算策略。

## 本版更新

- 全站中文化。
- 首页改为比赛答辩大屏。
- 增加“展示主线”和“数据资产”模块。
- 重新组织 Step01–Step14 防护流程。
- 增加三个演示场景：医学影像泄露、医学影像篡改、电子病历篡改。
- 增加中文指标解释、策略等级解释、答辩讲解提示。
- 强化能力边界，避免夸大生产能力。
