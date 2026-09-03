param([string]$Target)
$ErrorActionPreference = 'Stop'
if (-not $Target) { throw 'Target project path required' }
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "public folder not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_risk_layout_round9_backup_" + $stamp)
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach ($name in @('index.html','medshield-risk-layout.css')) {
  $dst = Join-Path $public $name
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force }
}
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item -LiteralPath (Join-Path $root 'index.html') -Destination (Join-Path $public 'index.html') -Force
Copy-Item -LiteralPath (Join-Path $root 'medshield-risk-layout.css') -Destination (Join-Path $public 'medshield-risk-layout.css') -Force
Write-Host "Installed risk-layout round9. Backup: $backup" -ForegroundColor Green
