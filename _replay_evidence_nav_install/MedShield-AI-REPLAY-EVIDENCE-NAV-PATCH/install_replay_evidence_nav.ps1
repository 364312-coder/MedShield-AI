param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath (Join-Path $public 'index.html'))) { throw "Target public/index.html not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_replay_evidence_nav_backup_" + $stamp)
New-Item -ItemType Directory -Force -Path $backup | Out-Null
$files = @('medshield-simulation-v2.js','medshield-app-shell.js','medshield-app-shell.css')
foreach ($f in $files) {
  $dst = Join-Path $public $f
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $f) -Force }
}
$payload = Join-Path $PSScriptRoot 'payload\public'
foreach ($f in $files) {
  $src = Join-Path $payload $f
  if (-not (Test-Path -LiteralPath $src)) { throw "Patch payload missing: $f" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $public $f) -Force
}
Write-Host 'REPLAY + EVIDENCE NAV FIX INSTALLED' -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host 'Modified: medshield-simulation-v2.js, medshield-app-shell.js, medshield-app-shell.css'
Write-Host 'Plety background: NOT MODIFIED'
Write-Host 'Home / Worker / D1 / Wrangler: NOT MODIFIED'
