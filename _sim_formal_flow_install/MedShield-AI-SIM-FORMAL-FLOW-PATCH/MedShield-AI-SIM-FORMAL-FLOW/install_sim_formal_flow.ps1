param(
    [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public directory not found: $public" }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @("index.html","medshield-simulation-v2.js","medshield-simulation-v2.css")
foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $here $f))) { throw "STOP: patch file missing: $f" }
}
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_sim_formal_flow_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($f in $files) {
    $dst = Join-Path $public $f
    if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $f) -Force }
}
foreach ($f in $files) {
    Copy-Item -LiteralPath (Join-Path $here $f) -Destination (Join-Path $public $f) -Force
}
node --check (Join-Path $public "medshield-simulation-v2.js")
if ($LASTEXITCODE -ne 0) { throw "STOP: JS syntax check failed; backup: $backup" }
Write-Host "SIM FORMAL FLOW INSTALLED" -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed only: index.html / medshield-simulation-v2.js / medshield-simulation-v2.css"
