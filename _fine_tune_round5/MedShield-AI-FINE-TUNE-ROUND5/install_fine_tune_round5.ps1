param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "Target public folder not found: $public" }
$src = Join-Path $PSScriptRoot "medshield-app-shell.js"
$dst = Join-Path $public "medshield-app-shell.js"
if (-not (Test-Path -LiteralPath $src)) { throw "Patch file missing: $src" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target "_fine_tune_round5_backup_$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination $backup -Force }
Copy-Item -LiteralPath $src -Destination $dst -Force
node --check $dst
if ($LASTEXITCODE -ne 0) { throw "JS syntax check failed" }
Write-Host "ROUND5 installed. Backup: $backup" -ForegroundColor Green
