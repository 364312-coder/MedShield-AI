param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public folder not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_fine_tune_round3_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$src = Join-Path $PSScriptRoot 'index.html'
$dst = Join-Path $public 'index.html'
if (-not (Test-Path -LiteralPath $src)) { throw "STOP: patch index.html missing" }
if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup 'index.html') -Force }
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host "Fine Tune Round 3 installed. Backup: $backup" -ForegroundColor Green
Write-Host "Changed only: public/index.html"
