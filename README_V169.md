# MedShield-AI v1.6.9 — Risk Root Reset

这次不是覆盖样式，而是直接从 DOM 根源处理：

1. Kill 所有与 Risk Story / Recovery 有关的 ScrollTrigger
2. Kill 旧 GSAP tween
3. 拆除 pin-spacer
4. cloneNode(true) 重建一个“干净”的 Risk Story
5. 清除所有 inline style
6. 用普通 Section 布局重新插回页面
7. 不再创建任何 Risk Story 滚动动画

因此旧转场不再有机会继续控制新的 Risk Story 节点。

不修改 Worker / D1 / API / 正式实验数据。
