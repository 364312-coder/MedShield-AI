param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
$dst = Join-Path $public 'medshield-app-shell.css'
if (-not (Test-Path -LiteralPath $dst)) { throw "Target file missing: $dst" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_evidence_faq_fix_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $dst -Destination (Join-Path $backup 'medshield-app-shell.css') -Force
$src = Join-Path $PSScriptRoot 'payload\public\medshield-app-shell.css'
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host 'EVIDENCE FAQ FIX INSTALLED'
Write-Host ('Backup: ' + $backup)
Write-Host 'Plety / Simulation / Worker / D1 / Wrangler: NOT MODIFIED'
