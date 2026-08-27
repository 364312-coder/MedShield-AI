$ErrorActionPreference = "Stop"

$index = ".\public\index.html"

if (!(Test-Path $index)) {
  throw "Run this installer from the MedShield-AI project root."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v161_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8

$html = [regex]::Replace(
  $html,
  '\s*<link rel="stylesheet" href="\./v161-wide-console\.css[^"]*"\s*/?>',
  ''
)

$html = [regex]::Replace(
  $html,
  '\s*<script defer src="\./v161-wide-console\.js[^"]*"></script>',
  ''
)

$cssTag='    <link rel="stylesheet" href="./v161-wide-console.css?v=1610" />'
$jsTag='    <script defer src="./v161-wide-console.js?v=1610"></script>'

$html=$html.Replace("</head>","$cssTag`r`n  </head>")
$html=$html.Replace("</body>","$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v161-wide-console.js"
if ($LASTEXITCODE -ne 0) {
  throw "v161 JS syntax check failed."
}

Write-Host ""
Write-Host "========================================"
Write-Host "MedShield-AI v1.6.1 Wide Console"
Write-Host "========================================"
Write-Host ""
Write-Host "Console width expanded."
Write-Host "Queue / Case / Evidence rebalanced."
Write-Host "Risk Story and backend untouched."
Write-Host ""

npm run dev
