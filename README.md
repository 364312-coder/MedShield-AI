# MedShield-AI — Plety Background Only

本补丁只做一件事：把 Plety Prompt 中 Hero 使用的背景视频作为 MedShield-AI 全站固定背景。

视频：
https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4

不会修改：
- 原有布局
- 页面内容
- Hero 文字
- Risk Story / Risk Console
- 六层能力
- 事件控制台
- Formal Evidence
- FAQ / Footer 结构
- Worker
- D1
- API
- 正式实验数据

文件：
- public/medshield-plety-bg.css
- public/medshield-plety-bg.js
- install_plety_bg.ps1

安装：
1. 将本包内容解压到项目根目录。
2. PowerShell：
   cd "C:\Users\18950843148\Desktop\网页设计"
   powershell -ExecutionPolicy Bypass -File ".\install_plety_bg.ps1"
3. 打开：
   http://127.0.0.1:8787/?v=plety-bg-1
4. Ctrl + Shift + R
