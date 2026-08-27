# MedShield-AI V5.2 医疗安全事件处置控制台（Neural Float 动态背景版）

V5 不再把首页设计成指标展示页，而是改成“医院安全事件处置系统 Demo”。

## 核心变化

- 第一屏不再堆 F1、Recall、资产数量等指标。
- 首页直接进入医疗安全事件现场。
- 左侧是待处置事件队列。
- 中间是事件处置工单。
- 右侧是动态证据链。
- 底部是审计日志终端。
- 用户按流程点击：
  - 分析事件
  - 执行防御策略
  - 验证完整性
  - 执行 Cold 恢复
  - 生成审计记录

## 适合答辩的讲法

本系统不是单点 AI 检测模型，而是面向基层医院电子病历和医学影像的安全事件处置闭环。正常情况下先做基础保护；出现异常后，AI 给出风险判定，策略层执行处置，完整性层确认可信状态，恢复层保证业务可恢复，最终形成审计记录和事件反馈。

## 数据规则

前端只读取：

```text
public/data/summary.json
public/data/metrics.json
public/data/run_config.json
public/data/behavior_manifest.json
public/data/results.csv
```

不加载完整 `events.jsonl`，不修改正式数据，不训练模型，不重算策略。

## 本地运行

```powershell
cd "C:\Users\18950843148\Desktop\网页设计"
python -m http.server 8000 --bind 127.0.0.1
```

访问：

```text
http://127.0.0.1:8000
```

## GitHub Pages

```powershell
cd "C:\Users\18950843148\Desktop\网页设计"
git add .
git commit -m "Upgrade V5 incident response console"
git push
```

然后访问：

```text
https://364312-coder.github.io/MedShield-AI/?v=v5
```

## 边界

当前网页操作为前端演示，不是真实生产控制台。权限/网络动作为模拟执行，密钥强制执行是部分实现，DICOM 原生运行时和 EMR 内嵌水印运行时当前未提供。


## V5.2 动态背景

新增原生 Canvas Neural Float 风格动态背景：青蓝数据网络缓慢漂浮、少量发光节点、轻微鼠标视差，第一屏明显，后半页自动弱化；不依赖 React、Three.js、GSAP 或 CDN。
