param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath (Join-Path $public 'index.html'))) { throw "public\index.html not found: $Target" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target "_converged_fix_backup_$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @('index.html','medshield-app-shell.css','medshield-app-shell.js','medshield-simulation-v2.css','medshield-simulation-v2.js')
foreach($f in $files){$src=Join-Path $public $f;if(Test-Path -LiteralPath $src){Copy-Item -LiteralPath $src -Destination (Join-Path $backup $f) -Force}}
$payload = Join-Path $PSScriptRoot 'payload\public'
foreach($f in $files){$src=Join-Path $payload $f;if(-not(Test-Path -LiteralPath $src)){throw "payload missing: $f"};Copy-Item -LiteralPath $src -Destination (Join-Path $public $f) -Force}
Write-Host 'MEDSHIELD CONVERGED FIX INSTALLED' -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host 'Plety background files: NOT MODIFIED'
Write-Host 'Worker / D1 / Wrangler: NOT MODIFIED'
