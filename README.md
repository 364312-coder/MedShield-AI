# MedShield-AI Frontend Dashboard

这是 `作品赛/MedShield-AI` 的单页前端展示原型。

## 打开方式

建议用本地服务打开，否则浏览器可能因为安全限制拦截 `fetch` 读取本地 JSON/CSV。

```powershell
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
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

原始后端目录没有被修改。

