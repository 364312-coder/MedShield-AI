param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public folder not found: $public" }
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target "_fine_tune_round2_backup_$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @("medshield-app-shell.js","medshield-simulation-v2.js")
foreach ($f in $files) {
  $dst = Join-Path $public $f
  if (-not (Test-Path -LiteralPath $dst)) { throw "STOP: target missing: $dst" }
  Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $f) -Force
  Copy-Item -LiteralPath (Join-Path $src $f) -Destination $dst -Force
}
node --check (Join-Path $public "medshield-app-shell.js")
if ($LASTEXITCODE -ne 0) { throw "STOP: medshield-app-shell.js syntax failed" }
node --check (Join-Path $public "medshield-simulation-v2.js")
if ($LASTEXITCODE -ne 0) { throw "STOP: medshield-simulation-v2.js syntax failed" }
Write-Host "ROUND2 installed. Backup: $backup" -ForegroundColor Green
