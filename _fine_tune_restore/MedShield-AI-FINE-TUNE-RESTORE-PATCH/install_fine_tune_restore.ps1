param(
  [Parameter(Mandatory=$true)][string]$Target
)
$ErrorActionPreference = 'Stop'
$public = Join-Path $Target 'public'
if (-not (Test-Path -LiteralPath $public)) { throw "STOP: public folder not found: $public" }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $Target ("_fine_tune_restore_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @('index.html','medshield-app-shell.js','medshield-app-shell.css','medshield-simulation-v2.js','medshield-simulation-v2.css')
foreach($name in $files){
  $dst = Join-Path $public $name
  if(Test-Path -LiteralPath $dst){ Copy-Item -LiteralPath $dst -Destination (Join-Path $backup $name) -Force }
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $dst -Force
}
node --check (Join-Path $public 'medshield-app-shell.js')
if($LASTEXITCODE -ne 0){ throw 'STOP: medshield-app-shell.js syntax failed' }
node --check (Join-Path $public 'medshield-simulation-v2.js')
if($LASTEXITCODE -ne 0){ throw 'STOP: medshield-simulation-v2.js syntax failed' }
Write-Host "Installed. Backup: $backup" -ForegroundColor Green
