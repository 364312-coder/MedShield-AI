$ErrorActionPreference = "Stop"
$index = ".\public\index.html"
if (!(Test-Path $index)) { throw "Run this installer from the MedShield-AI project root." }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v160_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8
$html = [regex]::Replace($html,'\s*<link rel="stylesheet" href="\./v160-visual-polish\.css[^"]*"\s*/?>','')
$html = [regex]::Replace($html,'\s*<script defer src="\./v160-visual-polish\.js[^"]*"></script>','')

$cssTag='    <link rel="stylesheet" href="./v160-visual-polish.css?v=1600" />'
$jsTag='    <script defer src="./v160-visual-polish.js?v=1600"></script>'

$html=$html.Replace("</head>","$cssTag`r`n  </head>")
$html=$html.Replace("</body>","$jsTag`r`n  </body>")
Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v160-visual-polish.js"
if ($LASTEXITCODE -ne 0) { throw "v160 JS syntax check failed." }

Write-Host ""
Write-Host "v1.6.0 Visual Polish installed."
Write-Host "Risk Story / Worker / D1 / API unchanged."
Write-Host ""
npm run dev
