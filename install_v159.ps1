$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$index = Join-Path $root "public\index.html"

if (!(Test-Path $index)) {
  throw "Run this installer from the MedShield-AI project root."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $index (Join-Path $root "public\index_before_v159_$stamp.html") -Force

$html = Get-Content $index -Raw -Encoding UTF8

$html = [regex]::Replace(
  $html,
  '\s*<link rel="stylesheet" href="\./v159-multi-incidents\.css[^"]*"\s*/?>',
  ''
)
$html = [regex]::Replace(
  $html,
  '\s*<script defer src="\./v159-multi-incidents\.js[^"]*"></script>',
  ''
)

$cssTag = '    <link rel="stylesheet" href="./v159-multi-incidents.css?v=1590" />'
$jsTag  = '    <script defer src="./v159-multi-incidents.js?v=1590"></script>'

$html = $html.Replace("</head>", "$cssTag`r`n  </head>")
$html = $html.Replace("</body>", "$jsTag`r`n  </body>")

Set-Content -Path $index -Value $html -Encoding UTF8

node --check ".\public\app.js"
if ($LASTEXITCODE -ne 0) { throw "app.js syntax check failed." }

node --check ".\public\v159-multi-incidents.js"
if ($LASTEXITCODE -ne 0) { throw "v159 JS syntax check failed." }

Write-Host ""
Write-Host "Applying D1 migration locally..."
npx wrangler d1 migrations apply medshield-ai-db --local
if ($LASTEXITCODE -ne 0) { throw "Local D1 migration failed." }

Write-Host ""
Write-Host "Applying D1 migration remotely..."
npx wrangler d1 migrations apply medshield-ai-db --remote
if ($LASTEXITCODE -ne 0) { throw "Remote D1 migration failed." }

Write-Host ""
Write-Host "Checking remote incident count..."
npx wrangler d1 execute medshield-ai-db --remote --command "SELECT COUNT(*) AS incident_count FROM incidents;"

Write-Host ""
Write-Host "v1.5.9 installed. Starting local preview..."
npm run dev
