param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
$targetCss = Join-Path $public 'medshield-app-shell.css'
$sourceCss = Join-Path $PSScriptRoot 'medshield-app-shell.css'
if (-not (Test-Path -LiteralPath $targetCss)) { throw "STOP: target CSS missing: $targetCss" }
if (-not (Test-Path -LiteralPath $sourceCss)) { throw "STOP: patch CSS missing" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_risk_true_cleanup_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $targetCss -Destination (Join-Path $backup 'medshield-app-shell.css') -Force
# Safety: only replace the single app-shell stylesheet. No JS/HTML/background files touched.
Copy-Item -LiteralPath $sourceCss -Destination $targetCss -Force
Write-Host "RISK TRUE CLEANUP INSTALLED" -ForegroundColor Green
Write-Host "Changed: public/medshield-app-shell.css only"
Write-Host "Backup: $backup"
Write-Host "Fonts kept; Plety/background untouched; HTML/JS untouched."
