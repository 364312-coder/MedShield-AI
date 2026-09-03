param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
$payload = Join-Path $PSScriptRoot 'payload\public'
if (-not (Test-Path -LiteralPath (Join-Path $public 'index.html'))) { throw "public\index.html not found: $public" }
foreach ($name in @('index.html','medshield-simulation-v2.css','medshield-simulation-v2.js')) {
  $src = Join-Path $payload $name
  if (-not (Test-Path -LiteralPath $src)) { throw "payload missing: $name" }
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_simlab_batch_final_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($name in @('index.html','medshield-simulation-v2.css','medshield-simulation-v2.js')) {
  $src = Join-Path $public $name
  if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $backup $name) -Force }
}
foreach ($name in @('index.html','medshield-simulation-v2.css','medshield-simulation-v2.js')) {
  Copy-Item -LiteralPath (Join-Path $payload $name) -Destination (Join-Path $public $name) -Force
}
Write-Host 'MEDSHIELD BATCH + FINAL EVIDENCE FIX INSTALLED' -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host 'Plety background: NOT MODIFIED'
Write-Host 'App Shell / Worker / D1 / Wrangler: NOT MODIFIED'
