$ErrorActionPreference = "Stop"

$index = ".\public\index.html"

if (!(Test-Path $index)) {
  throw "Run this installer from the MedShield-AI project root."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v162_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8

$html = [regex]::Replace(
  $html,
  '\s*<link rel="stylesheet" href="\./v162-forensic-evidence\.css[^"]*"\s*/?>',
  ''
)

$html = [regex]::Replace(
  $html,
  '\s*<script defer src="\./v162-forensic-evidence\.js[^"]*"></script>',
  ''
)

$cssTag='    <link rel="stylesheet" href="./v162-forensic-evidence.css?v=1620" />'
$jsTag='    <script defer src="./v162-forensic-evidence.js?v=1620"></script>'

$html=$html.Replace("</head>","$cssTag`r`n  </head>")
$html=$html.Replace("</body>","$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v162-forensic-evidence.js"

if ($LASTEXITCODE -ne 0) {
  throw "v162 JS syntax check failed."
}

Write-Host ""
Write-Host "============================================="
Write-Host "MedShield-AI v1.6.2 Forensic + Evidence"
Write-Host "============================================="
Write-Host ""
Write-Host "Case panel -> forensic workspace."
Write-Host "Evidence panel -> vertical evidence graph."
Write-Host "Risk Story / backend unchanged."
Write-Host ""

npm run dev
