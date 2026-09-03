MedShield-AI · 实验验证最终严格版

范围：仅重构 App Shell 的“实验验证”视图。
未修改：HOME、系统概览、风险研判、防御能力、动态演示、Plety 动态背景、全局字体、Worker、D1、Wrangler、后端。

正式口径：
- Accuracy 98.44%; Precision 98.66%; Recall 96.10%; F1 97.36%; AUC 98.61%; Attack Containment 96.10%.
- Image Leakage ≈99.96%; EMR Leakage 99.50%; Data Exfiltration ≈99.79%; Multi-source Attack ≈99.92%; Slow Data Exfiltration 100%; Account Abuse 76.46% (当前弱场景).
- 攻击 15,000; 成功遏制 14,415; 未成功 585; False Blocking 1.28%.
- Policy: P0=33,854 (67.71%); P1=698 (1.40%); P2=407 (0.81%); P3=15,041 (30.08%).
- Integrity NORMAL 49,998; high-confidence anomaly 2; expected 2; detected 2; recovery requested/attempted/success/cold backup 均为 2; mean recovery pipeline latency ≈9.05 ms.
- 3,000 个未见攻击事件：仅表述为“本次正式实验中检出率 100%”。
- Permission/Network actions SIMULATED; Key enforcement PARTIAL; DICOM/EMR embedded watermark runtime UNAVAILABLE; unknown leaked-image blind attribution UNAVAILABLE; real HIS/PACS control NOT IMPLEMENTED.
- Synthetic / Public Experimental Data; Frontend visualization ≠ Production Control.
- AI Prediction ≠ Training Label.
