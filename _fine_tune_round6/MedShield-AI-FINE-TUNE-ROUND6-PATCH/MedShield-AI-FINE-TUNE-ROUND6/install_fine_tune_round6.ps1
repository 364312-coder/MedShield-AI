param(
    [Parameter(Mandatory=$true)]
    [string]$Target
)
$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "Target public directory not found: $public" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_fine_tune_round6_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($name in @("index.html","medshield-app-shell.js")) {
    $dst = Join-Path $public $name
    if (-not (Test-Path -LiteralPath $dst)) { throw "Missing target file: $dst" }
    Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force
    Copy-Item -LiteralPath (Join-Path $src $name) -Destination $dst -Force
}
node --check (Join-Path $public "medshield-app-shell.js")
if ($LASTEXITCODE -ne 0) { throw "JS syntax check failed" }
Write-Host "Round 6 installed." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed: index.html, medshield-app-shell.js"
Write-Host "Layout/CSS/fonts/Simulation/dialogs/backend: NOT MODIFIED"
