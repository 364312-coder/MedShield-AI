MedShield-AI · Evidence Proof V5.2 CN

本版本基于已成功安装的 Evidence Proof V5.1，只调整“实验验证”页的语言表达，不改页面结构、正式实验数据、字体体系、Plety 背景或其它页面。

语言原则
- 中文为主，英文仅保留必要技术名词与缩写。
- 保留 AutoEncoder、LightGBM、Policy Engine、Security Event Pool、R/A、P0–P3、Trap、AUC、EMR、DICOM、HIS/PACS。
- 场景名称采用中文主名称 + 英文小辅助。

正式方法链
U/F/N → AutoEncoder → E_AE → LightGBM → R/A → Policy Engine(R,D,A,C,Trap) → P0–P3 → 主动防御 → 联合完整性验证 → 条件恢复 → 事件确认 → Security Event Pool → 周期性离线优化。

关键边界
- AI 只输出 R/A，Policy Engine 独立输出 P。
- 数据正常时无需恢复；确认异常才进入可信冷备份恢复与复验。
- 3,000 个未见攻击事件 100% 仅表述为本次正式实验结果。
- 2 个高可信完整性异常不额外解释为“医学影像篡改”。
- Permission / Network 为模拟执行；Key enforcement 为部分实现。
- DICOM/EMR 内嵌水印运行时、未知泄露影像盲溯源、真实 HIS/PACS 生产控制当前未提供。

安装器
- 只替换真实 public/medshield-app-shell.js 中的 moveEvidence(view)。
- 只替换隔离的 Evidence V5 CSS 块。
- 自动备份并在失败时恢复。
- 更新 App Shell 缓存版本。
- 验证 moveEvidence 唯一性、新中文 DOM、CSS 括号及 JS 语法。
