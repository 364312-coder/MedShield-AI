param(
    [Parameter(Mandatory=$true)]
    [string]$Target
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath $public)) { throw "Target public directory not found: $public" }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_risk_layout_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$index = Join-Path $public "index.html"
if (Test-Path -LiteralPath $index) { Copy-Item -LiteralPath $index -Destination (Join-Path $backup "index.html") -Force }

Copy-Item -LiteralPath (Join-Path $here "index.html") -Destination $index -Force
Copy-Item -LiteralPath (Join-Path $here "medshield-risk-layout.css") -Destination (Join-Path $public "medshield-risk-layout.css") -Force

Write-Host "Risk Assessment layout fine-tune installed." -ForegroundColor Green
Write-Host "Changed only: public/index.html + public/medshield-risk-layout.css"
Write-Host "Typography: unchanged"
Write-Host "Plety/dynamic background: unchanged"
Write-Host "Other views and JS behavior: unchanged"
Write-Host "Backup: $backup"
