PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  data_level TEXT NOT NULL,
  risk_score REAL NOT NULL,
  anomaly_type TEXT NOT NULL,
  policy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待分析',
  stage INTEGER NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 5),
  result TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incident_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL,
  action TEXT NOT NULL,
  stage INTEGER NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_incident_actions_incident
  ON incident_actions(incident_id, id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_incident
  ON audit_logs(incident_id, id);

INSERT OR IGNORE INTO incidents
(id, title, asset_type, data_level, risk_score, anomaly_type, policy, status, stage, result, created_at, updated_at)
VALUES
('img-leak', '医学影像异常外传', '医学影像', 'D3', 0.91, 'IMAGE_LEAKAGE', 'P3', '待分析', 0, '已遏制 / 已入池', '2026-08-27T00:00:00Z', '2026-08-27T00:00:00Z'),
('img-tamper', '医学影像完整性异常', '医学影像', 'D3', 0.96, 'INTEGRITY_ANOMALY', 'P3', '待分析', 0, 'Cold 恢复成功', '2026-08-27T00:00:01Z', '2026-08-27T00:00:01Z'),
('emr-tamper', '电子病历疑似篡改', '电子病历', 'D3', 0.94, 'TAMPERING', 'P3', '待分析', 0, '恢复后正常', '2026-08-27T00:00:02Z', '2026-08-27T00:00:02Z'),
('account-abuse', '账号滥用', '账号 / 权限', 'D2', 0.78, 'ACCOUNT_ABUSE', 'P2', '待分析', 0, '权限已收紧', '2026-08-27T00:00:03Z', '2026-08-27T00:00:03Z');

INSERT INTO audit_logs (incident_id, action, message, created_at)
SELECT id, 'created', '安全事件已进入处置队列：' || title, created_at
FROM incidents
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs WHERE audit_logs.incident_id = incidents.id
);
