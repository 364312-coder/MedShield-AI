MedShield-AI Evidence Proof V5.3 CN

本版本只修复 V5.2 中文版安装器的 Windows PowerShell 编码/解析问题。
页面设计、中文文案、正式实验数据与 Evidence V5.2 保持一致。

关键修复：
1. 安装器脚本本身只使用 ASCII 字符，避免 Windows PowerShell 5.1 将无 BOM UTF-8 中文脚本按本地 ANSI 编码解析。
2. 所有中文页面内容从 UTF-8 JS fragment 文件读取，不把中文常量写入 PowerShell 脚本。
3. 安装后的验证只检查 ASCII sentinel、DOM root、moveEvidence 数量和 CSS marker，不再使用中文正则验证。
4. 安装失败会自动恢复 public/medshield-app-shell.js、CSS 和 index.html。

目标：C:\Users\18950843148\Desktop\网页设计
安装时请通过 -Target 参数传入项目路径。
