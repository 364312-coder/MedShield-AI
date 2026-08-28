$ErrorActionPreference = "Stop"

$project = Get-Location
$payload = Join-Path $PSScriptRoot "payload\public"
$target = Join-Path $project "public"

if (!(Test-Path (Join-Path $target "index.html"))) {
    throw "Run this script from the MedShield-AI project root."
}
if (!(Test-Path (Join-Path $payload "index.html"))) {
    throw "Installer payload is missing."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $project ("_sourcefix3_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$files = @(
  "index.html",
  "competition.css",
  "competition.js",
  "medshield-final.css",
  "medshield-final.js",
  "medshield-plety-bg.css",
  "medshield-plety-bg.js"
)

foreach ($f in $files) {
    $dst = Join-Path $target $f
    if (Test-Path $dst) {
        Copy-Item $dst (Join-Path $backup $f) -Force
    }
    Copy-Item (Join-Path $payload $f) $dst -Force
}

node --check (Join-Path $target "competition.js")
if ($LASTEXITCODE -ne 0) { throw "competition.js syntax check failed" }

node --check (Join-Path $target "medshield-final.js")
if ($LASTEXITCODE -ne 0) { throw "medshield-final.js syntax check failed" }

node --check (Join-Path $target "medshield-plety-bg.js")
if ($LASTEXITCODE -ne 0) { throw "medshield-plety-bg.js syntax check failed" }

$indexText = Get-Content (Join-Path $target "index.html") -Raw -Encoding UTF8
$cssText = Get-Content (Join-Path $target "medshield-final.css") -Raw -Encoding UTF8

if ($indexText -notmatch "V3-ACTIVE") {
    throw "index.html V3 marker missing"
}
if ($cssText -notmatch "MEDSHIELD_SOURCE_FIX_V3_ACTIVE") {
    throw "medshield-final.css V3 marker missing"
}

Write-Host ""
Write-Host "SOURCE FIX V3 installed." -ForegroundColor Green
Write-Host ("Backup: " + $backup)
Write-Host ""
Write-Host "IMPORTANT: restart Wrangler so the served files are guaranteed current."
Write-Host ""
Write-Host "Run:"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open:"
Write-Host "  http://127.0.0.1:8787/?v=sourcefix3-20260828"
Write-Host ""
