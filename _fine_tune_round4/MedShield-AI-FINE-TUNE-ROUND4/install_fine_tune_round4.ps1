param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "public folder not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_fine_tune_round4_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($name in @('medshield-app-shell.css','medshield-simulation-v2.css')) {
  $dst = Join-Path $public $name
  if (-not (Test-Path -LiteralPath $dst)) { throw "missing target file: $dst" }
  Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $dst -Force
}
Write-Host "Round 4 installed. Backup: $backup" -ForegroundColor Green
Write-Host "Changed CSS only: restored capability 01, viewport fit, typography enlargement." -ForegroundColor Green
