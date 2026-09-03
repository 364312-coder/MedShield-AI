param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "Target public directory not found: $public" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_fine_tune_round7_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @("index.html","medshield-app-shell.js")
foreach ($name in $files) {
  $dst = Join-Path $public $name
  $source = Join-Path $src $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Patch file missing: $source" }
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force }
  Copy-Item -LiteralPath $source -Destination $dst -Force
}
Write-Host "Round 7 installed. Backup: $backup" -ForegroundColor Green
