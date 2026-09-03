param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'

$public = Join-Path $Target 'public'
$targetHtml = Join-Path $public 'index.html'
$targetCss  = Join-Path $public 'medshield-app-shell.css'
$sourceHtml = Join-Path $PSScriptRoot 'index.html'
$sourceCss  = Join-Path $PSScriptRoot 'medshield-app-shell.css'

foreach ($p in @($targetHtml,$targetCss,$sourceHtml,$sourceCss)) {
  if (-not (Test-Path -LiteralPath $p)) { throw "STOP: required file missing: $p" }
}

# Conservative baseline checks: this patch is only for the current MedShield App Shell.
$currentHtml = Get-Content -LiteralPath $targetHtml -Raw -Encoding UTF8
if ($currentHtml -notmatch 'id="features"') { throw 'STOP: current index.html does not contain #features; refusing to overwrite.' }
if ($currentHtml -notmatch 'v14-risk-story|risk-final-layout|risk-method-strip') { throw 'STOP: current Risk Assessment structure is not recognized; refusing to overwrite.' }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_risk_final_design_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $targetHtml -Destination (Join-Path $backup 'index.html') -Force
Copy-Item -LiteralPath $targetCss  -Destination (Join-Path $backup 'medshield-app-shell.css') -Force

# Only these two files are replaced. Plety/background, fonts, JS, Simulation,
# Evidence, backend, Worker/D1/Wrangler and every other page remain untouched.
Copy-Item -LiteralPath $sourceHtml -Destination $targetHtml -Force
Copy-Item -LiteralPath $sourceCss  -Destination $targetCss -Force

# Post-install validation.
$installedHtml = Get-Content -LiteralPath $targetHtml -Raw -Encoding UTF8
$installedCss  = Get-Content -LiteralPath $targetCss -Raw -Encoding UTF8
if ($installedHtml -notmatch 'data-risk-final="1"') { throw 'STOP: final Risk layout marker missing after install.' }
if ($installedCss -notmatch 'RISK FINAL SINGLE LAYOUT START') { throw 'STOP: final Risk CSS marker missing after install.' }
if ($installedHtml -notmatch 'medshield-plety-bg\.css\?v=sourcefix3-20260828') { throw 'STOP: Plety background reference changed unexpectedly.' }

Write-Host ''
Write-Host 'MEDSHIELD RISK FINAL DESIGN INSTALLED' -ForegroundColor Green
Write-Host 'Changed only:'
Write-Host '  public/index.html (Risk Assessment DOM + CSS cache-buster)'
Write-Host '  public/medshield-app-shell.css (single scoped Risk layout block)'
Write-Host ''
Write-Host 'UNCHANGED:'
Write-Host '  fonts / Plety dynamic background / app-shell JS'
Write-Host '  Home / Overview / Capabilities / Simulation / Evidence'
Write-Host '  one-click attack / dialogs / backend / Worker / D1 / Wrangler'
Write-Host "Backup: $backup"
