param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
$payload = Join-Path $PSScriptRoot "payload\public"
if (-not (Test-Path -LiteralPath (Join-Path $public "medshield-app-shell.css"))) { throw "Target app-shell CSS missing" }
if (-not (Test-Path -LiteralPath (Join-Path $public "medshield-app-shell.js"))) { throw "Target app-shell JS missing" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_evidence_stability_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $public "medshield-app-shell.css") -Destination (Join-Path $backup "medshield-app-shell.css") -Force
Copy-Item -LiteralPath (Join-Path $public "medshield-app-shell.js") -Destination (Join-Path $backup "medshield-app-shell.js") -Force
Copy-Item -LiteralPath (Join-Path $payload "medshield-app-shell.css") -Destination (Join-Path $public "medshield-app-shell.css") -Force
Copy-Item -LiteralPath (Join-Path $payload "medshield-app-shell.js") -Destination (Join-Path $public "medshield-app-shell.js") -Force
Write-Host "EVIDENCE STABILITY FIX INSTALLED"
Write-Host "Changed: medshield-app-shell.css / medshield-app-shell.js"
Write-Host "Backup: $backup"
Write-Host "Home / Plety / Simulation / Worker / D1 / Wrangler: NOT MODIFIED"
