param(
  [Parameter(Mandatory=$true)]
  [string]$Target
)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
$dest = Join-Path $public "medshield-app-shell.css"
$src = Join-Path $PSScriptRoot "medshield-app-shell.css"
if (-not (Test-Path -LiteralPath $dest)) { throw "STOP: missing target CSS: $dest" }
if (-not (Test-Path -LiteralPath $src)) { throw "STOP: missing patch CSS: $src" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_risk_history_cleanup_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $dest -Destination (Join-Path $backup "medshield-app-shell.css") -Force
Copy-Item -LiteralPath $src -Destination $dest -Force
Write-Host "Risk-history cleanup installed." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed: public/medshield-app-shell.css ONLY"
