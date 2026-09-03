param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "Target public directory not found: $public" }
$src = Join-Path $PSScriptRoot "medshield-app-shell.css"
$dst = Join-Path $public "medshield-app-shell.css"
if (-not (Test-Path -LiteralPath $src)) { throw "Patch source missing: $src" }
if (-not (Test-Path -LiteralPath $dst)) { throw "Target file missing: $dst" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_risk_layout_direct_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $dst -Destination (Join-Path $backup "medshield-app-shell.css") -Force
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host "Risk layout refinement installed." -ForegroundColor Green
Write-Host "Changed only: public/medshield-app-shell.css"
Write-Host "Backup: $backup"
