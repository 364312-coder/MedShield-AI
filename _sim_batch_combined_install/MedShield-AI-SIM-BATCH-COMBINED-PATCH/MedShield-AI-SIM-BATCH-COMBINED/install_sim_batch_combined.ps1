param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public directory not found: $public" }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_sim_batch_combined_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @("index.html","medshield-simulation-v2.js","medshield-simulation-v2.css")
foreach($name in $files){
  $src = Join-Path $here $name
  $dst = Join-Path $public $name
  if (-not (Test-Path -LiteralPath $src)) { throw "STOP: patch file missing: $src" }
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force }
}
foreach($name in $files){ Copy-Item -LiteralPath (Join-Path $here $name) -Destination (Join-Path $public $name) -Force }
node --check (Join-Path $public "medshield-simulation-v2.js")
if ($LASTEXITCODE -ne 0) { throw "STOP: JS syntax validation failed" }
Write-Host "Installed Simulation combined multi-event evidence popup." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed only: index.html, medshield-simulation-v2.js, medshield-simulation-v2.css"
