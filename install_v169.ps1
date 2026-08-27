$ErrorActionPreference = "Stop"

$index = ".\public\index.html"

if (!(Test-Path $index)) {
  throw "Run this installer from the MedShield-AI project root."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v169_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8

$html = [regex]::Replace(
  $html,
  '\s*<link rel="stylesheet" href="\./v169-risk-root-reset\.css[^"]*"\s*/?>',
  ''
)

$html = [regex]::Replace(
  $html,
  '\s*<script defer src="\./v169-risk-root-reset\.js[^"]*"></script>',
  ''
)

$cssTag = '    <link rel="stylesheet" href="./v169-risk-root-reset.css?v=1690" />'
$jsTag  = '    <script defer src="./v169-risk-root-reset.js?v=1690"></script>'

$html = $html.Replace("</head>", "$cssTag`r`n  </head>")
$html = $html.Replace("</body>", "$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v169-risk-root-reset.js"
if ($LASTEXITCODE -ne 0) {
  throw "v169 JS syntax check failed."
}

Write-Host ""
Write-Host "=========================================="
Write-Host "MedShield-AI v1.6.9 ROOT RESET"
Write-Host "=========================================="
Write-Host ""
Write-Host "Risk node will be cloned and rebuilt."
Write-Host "Old GSAP references removed."
Write-Host "Old ScrollTriggers removed."
Write-Host "Pin spacers removed."
Write-Host "No new Risk animation added."
Write-Host ""

npm run dev
