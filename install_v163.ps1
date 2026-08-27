$ErrorActionPreference = "Stop"
$index = ".\public\index.html"
if (!(Test-Path $index)) { throw "Run this installer from the MedShield-AI project root." }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index ".\public\index_before_v163_$stamp.html" -Force

$html = Get-Content $index -Raw -Encoding UTF8
$html = [regex]::Replace($html,'\s*<link rel="stylesheet" href="\./v163-content-rich\.css[^"]*"\s*/?>','')
$html = [regex]::Replace($html,'\s*<script defer src="\./v163-content-rich\.js[^"]*"></script>','')

$cssTag='    <link rel="stylesheet" href="./v163-content-rich.css?v=1630" />'
$jsTag='    <script defer src="./v163-content-rich.js?v=1630"></script>'

$html=$html.Replace("</head>","$cssTag`r`n  </head>")
$html=$html.Replace("</body>","$jsTag`r`n  </body>")
Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\v163-content-rich.js"
if ($LASTEXITCODE -ne 0) { throw "v163 JS syntax check failed." }

Write-Host ""
Write-Host "MedShield-AI v1.6.3 Content Rich installed."
Write-Host "Backend / D1 / Risk Story unchanged."
Write-Host ""
npm run dev
