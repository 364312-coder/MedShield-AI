param(
  [Parameter(Mandatory=$true)]
  [string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
$payload = Join-Path $PSScriptRoot 'payload\public'
if (-not (Test-Path -LiteralPath $public)) { throw "Target public folder not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_simlab_stage_fix_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @('index.html','medshield-simulation-v2.css','medshield-simulation-v2.js')
foreach ($name in $files) {
  $dst = Join-Path $public $name
  $src = Join-Path $payload $name
  if (-not (Test-Path -LiteralPath $src)) { throw "Payload missing: $src" }
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force }
  Copy-Item -LiteralPath $src -Destination $dst -Force
}
Write-Host ''
Write-Host 'MEDSHIELD SIMULATION STAGE FIX INSTALLED' -ForegroundColor Green
Write-Host ('Backup: ' + $backup)
Write-Host 'Fix 1: removed generic .next class collision' -ForegroundColor Green
Write-Host 'Fix 2: running simulation cannot be reset by scenario/mode clicks' -ForegroundColor Green
Write-Host 'Fix 3: central stage uses three compact visual bands' -ForegroundColor Green
Write-Host 'UI owner: medshield-simulation-v2.css/js only' -ForegroundColor Green
Write-Host 'Worker / Wrangler: NOT MODIFIED'
