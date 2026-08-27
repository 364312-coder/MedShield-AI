PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO incidents
(id, title, asset_type, data_level, risk_score, anomaly_type, policy, status, stage, result, created_at, updated_at)
VALUES
('emr-leak', '电子病历异常外传', '电子病历', 'D3', 0.89, 'EMR_LEAKAGE', 'P3', '待分析', 0, '已遏制 / 已入池', '2026-08-27T00:00:04Z', '2026-08-27T00:00:04Z'),
('data-exfil', '敏感数据外传', '医疗数据', 'D3', 0.88, 'DATA_EXFILTRATION', 'P3', '待分析', 0, '传输已阻断', '2026-08-27T00:00:05Z', '2026-08-27T00:00:05Z'),
('multi-source', '多源联合攻击', '多源资产', 'D3', 0.93, 'MULTI_SOURCE_ATTACK', 'P3', '待分析', 0, '联合攻击已遏制', '2026-08-27T00:00:06Z', '2026-08-27T00:00:06Z'),
('slow-exfil', '慢速数据外传', '医疗数据', 'D3', 0.86, 'SLOW_DATA_EXFILTRATION', 'P3', '待分析', 0, '慢速外传已识别', '2026-08-27T00:00:07Z', '2026-08-27T00:00:07Z'),
('normal-burst', '正常高频业务访问', '电子病历', 'D2', 0.19, 'NORMAL', 'P0', '正常', 0, '保持基础防护', '2026-08-27T00:00:08Z', '2026-08-27T00:00:08Z'),
('trap-image', 'Trap 医学影像被访问', 'Trap 医学影像', 'D3', 0.92, 'TRAP_ACCESS', 'P3', '待处置', 0, 'Trap 上下文触发 P3', '2026-08-27T00:00:09Z', '2026-08-27T00:00:09Z'),
('trap-emr', 'Trap 电子病历被访问', 'Trap EMR', 'D3', 0.90, 'TRAP_ACCESS', 'P3', '待处置', 0, 'Trap 上下文触发 P3', '2026-08-27T00:00:10Z', '2026-08-27T00:00:10Z'),
('off-hours-emr', '非工作时段批量访问 EMR', '电子病历', 'D2', 0.72, 'ACCOUNT_ABUSE', 'P2', '待分析', 0, '访问范围已收紧', '2026-08-27T00:00:11Z', '2026-08-27T00:00:11Z'),
('privilege-probe', '连续权限探测', '账号 / 权限', 'D2', 0.74, 'PRIVILEGE_PROBE', 'P2', '待分析', 0, '权限探测已限制', '2026-08-27T00:00:12Z', '2026-08-27T00:00:12Z'),
('suspicious-export', '可疑批量导出任务', '医疗数据', 'D3', 0.84, 'SUSPICIOUS_EXPORT', 'P3', '待分析', 0, '导出任务已阻断', '2026-08-27T00:00:13Z', '2026-08-27T00:00:13Z'),
('abnormal-api', '异常接口调用', 'API / 服务', 'D2', 0.69, 'ABNORMAL_API', 'P2', '待分析', 0, '接口访问已限流', '2026-08-27T00:00:14Z', '2026-08-27T00:00:14Z'),
('cold-restore', 'Cold Backup 恢复请求', '备份 / 恢复', 'D3', 0.63, 'RECOVERY_REQUEST', 'P2', '待验证', 0, 'Cold 恢复成功', '2026-08-27T00:00:15Z', '2026-08-27T00:00:15Z');

INSERT INTO audit_logs (incident_id, action, message, created_at)
SELECT id, 'created', '安全事件已进入处置队列：' || title, created_at
FROM incidents
WHERE id IN (
  'emr-leak','data-exfil','multi-source','slow-exfil','normal-burst',
  'trap-image','trap-emr','off-hours-emr','privilege-probe',
  'suspicious-export','abnormal-api','cold-restore'
)
AND NOT EXISTS (
  SELECT 1 FROM audit_logs WHERE audit_logs.incident_id = incidents.id
);
