param(
  [Parameter(Mandatory=$false)]
  [string]$Target = "C:\Users\18950843148\Desktop\网页设计"
)

$ErrorActionPreference = "Stop"

$sourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicSource = Join-Path $sourceRoot "public"
$publicTarget = Join-Path $Target "public"

if (-not (Test-Path -LiteralPath $Target)) {
  throw "Target project not found: $Target"
}
if (-not (Test-Path -LiteralPath $publicTarget)) {
  throw "Target public directory not found: $publicTarget"
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_backup_evidence_final_strict_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$files = @(
  "index.html",
  "medshield-app-shell.css",
  "medshield-app-shell.js"
)

foreach ($file in $files) {
  $src = Join-Path $publicSource $file
  $dst = Join-Path $publicTarget $file

  if (-not (Test-Path -LiteralPath $src)) {
    throw "Patch file missing: $src"
  }

  if (Test-Path -LiteralPath $dst) {
    Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $file) -Force
  }

  Copy-Item -LiteralPath $src -Destination $dst -Force
}

Write-Host ""
Write-Host "MedShield-AI Evidence Final Strict installed." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Changed only: public/index.html, public/medshield-app-shell.css, public/medshield-app-shell.js"
Write-Host ""
