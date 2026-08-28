$ErrorActionPreference = "Stop"

$index = ".\public\index.html"

if (!(Test-Path $index)) {
    throw "请从 MedShield-AI 项目根目录运行此脚本。"
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_plety_bg_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8

# Remove duplicate background-only references.
$html = [regex]::Replace(
    $html,
    '\s*<link[^>]+href=["'']\.?/medshield-plety-bg\.css(?:\?[^"'']*)?["''][^>]*>',
    '',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [regex]::Replace(
    $html,
    '\s*<script[^>]+src=["'']\.?/medshield-plety-bg\.js(?:\?[^"'']*)?["''][^>]*>\s*</script>',
    '',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$cssTag = '    <link rel="stylesheet" href="./medshield-plety-bg.css?v=plety-bg-1" />'
$jsTag  = '    <script defer src="./medshield-plety-bg.js?v=plety-bg-1"></script>'

$html = $html.Replace("</head>", "$cssTag`r`n  </head>")
$html = $html.Replace("</body>", "$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\medshield-plety-bg.js"
if ($LASTEXITCODE -ne 0) {
    throw "medshield-plety-bg.js 语法检查失败。"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Plety Background Only installed"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "只增加背景视频与遮罩。"
Write-Host "没有修改页面布局。"
Write-Host "没有修改文字内容。"
Write-Host "没有修改事件控制台。"
Write-Host "没有修改 Worker / D1 / API。"
Write-Host ""
Write-Host "Starting preview..."
Write-Host ""

npm run dev
