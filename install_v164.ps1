$ErrorActionPreference = "Stop"

$index = ".\public\index.html"
if (!(Test-Path $index)) {
  throw "Run this installer from the MedShield-AI project root."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v164_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8

$html = [regex]::Replace(
  $html,
  '\s*<link rel="stylesheet" href="\./v164-sci-fi-hud\.css[^"]*"\s*/?>',
  ''
)

$html = [regex]::Replace(
  $html,
  '\s*<script defer src="\./v164-sci-fi-hud\.js[^"]*"></script>',
  ''
)

$cssTag='    <link rel="stylesheet" href="./v164-sci-fi-hud.css?v=1640" />'
$jsTag='    <script defer src="./v164-sci-fi-hud.js?v=1640"></script>'

$html=$html.Replace("</head>","$cssTag`r`n  </head>")
$html=$html.Replace("</body>","$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v164-sci-fi-hud.js"
if ($LASTEXITCODE -ne 0) {
  throw "v164 JS syntax check failed."
}

Write-Host ""
Write-Host "======================================"
Write-Host "MedShield-AI v1.6.4 Sci-Fi HUD"
Write-Host "======================================"
Write-Host ""
Write-Host "HUD corners / scanline / grid / telemetry applied."
Write-Host "No opacity transition added."
Write-Host "Backend / D1 / API unchanged."
Write-Host ""

npm run dev
