param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "public directory not found: $public" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target "_risk_final_refine_backup_$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @("index.html","medshield-app-shell.css","medshield-app-shell.js")
foreach ($f in $files) {
  $src = Join-Path $public $f
  if (-not (Test-Path -LiteralPath $src)) { throw "missing target file: $src" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $backup $f) -Force
}

# Use the vetted source files included with this patch. No other files are touched.
$payload = Join-Path $PSScriptRoot "payload"
foreach ($f in $files) {
  Copy-Item -LiteralPath (Join-Path $payload $f) -Destination (Join-Path $public $f) -Force
}

# Syntax check JS. Roll back all three files if it fails.
& node --check (Join-Path $public "medshield-app-shell.js")
if ($LASTEXITCODE -ne 0) {
  foreach ($f in $files) { Copy-Item -LiteralPath (Join-Path $backup $f) -Destination (Join-Path $public $f) -Force }
  throw "JS syntax check failed. Restored backup: $backup"
}

Write-Host "RISK FINAL REFINE INSTALLED" -ForegroundColor Green
Write-Host "Changed ONLY: public/index.html, public/medshield-app-shell.css, public/medshield-app-shell.js"
Write-Host "Fonts: unchanged by this patch"
Write-Host "Plety/dynamic background: untouched"
Write-Host "Backup: $backup"
