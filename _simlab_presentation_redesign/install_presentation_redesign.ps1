param(
  [Parameter(Mandatory=$true)]
  [string]$Target
)
$ErrorActionPreference = 'Stop'
$target = (Resolve-Path -LiteralPath $Target).Path
$public = Join-Path $target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "public folder not found: $public" }
$srcRoot = Join-Path $PSScriptRoot 'payload\public'
$files = @('index.html','medshield-simulation-v2.css','medshield-simulation-v2.js')
foreach ($f in $files) {
  $src = Join-Path $srcRoot $f
  if (-not (Test-Path -LiteralPath $src)) { throw "payload missing: $src" }
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $target ("_simlab_presentation_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($f in $files) {
  $dst = Join-Path $public $f
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $f) -Force }
  Copy-Item -LiteralPath (Join-Path $srcRoot $f) -Destination $dst -Force
}
Write-Host ''
Write-Host 'MEDSHIELD SIMULATION PRESENTATION REDESIGN INSTALLED'
Write-Host ("Backup: " + $backup)
Write-Host 'Changed only:'
Write-Host '  public\index.html'
Write-Host '  public\medshield-simulation-v2.css'
Write-Host '  public\medshield-simulation-v2.js'
Write-Host 'No Worker / Wrangler / other page sections modified.'
