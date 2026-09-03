param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public folder not found: $public" }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @('index.html','medshield-app-shell.js','medshield-simulation-v2.js')
foreach ($name in $files) {
  if (-not (Test-Path -LiteralPath (Join-Path $here $name))) { throw "STOP: patch file missing: $name" }
  if (-not (Test-Path -LiteralPath (Join-Path $public $name))) { throw "STOP: target file missing: $name" }
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_scheme_alignment_smallfix_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup | Out-Null
foreach ($name in $files) {
  Copy-Item -LiteralPath (Join-Path $public $name) -Destination (Join-Path $backup $name) -Force
}
foreach ($name in $files) {
  Copy-Item -LiteralPath (Join-Path $here $name) -Destination (Join-Path $public $name) -Force
}
node --check (Join-Path $public 'medshield-app-shell.js')
if ($LASTEXITCODE -ne 0) { throw 'STOP: medshield-app-shell.js syntax failed' }
node --check (Join-Path $public 'medshield-simulation-v2.js')
if ($LASTEXITCODE -ne 0) { throw 'STOP: medshield-simulation-v2.js syntax failed' }
Write-Host "[PASS] Scheme alignment small fix installed" -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed only: index.html, medshield-app-shell.js, medshield-simulation-v2.js"
