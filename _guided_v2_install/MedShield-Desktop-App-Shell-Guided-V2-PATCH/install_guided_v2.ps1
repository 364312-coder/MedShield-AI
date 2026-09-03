param([Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = "Stop"
$public = Join-Path $Target "public"
if (-not (Test-Path -LiteralPath (Join-Path $public "index.html"))) { throw "Target public/index.html not found" }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_guided_v2_backup_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @("index.html","medshield-app-shell.css","medshield-app-shell.js","medshield-simulation-v2.css","medshield-simulation-v2.js")
foreach($f in $files){
  $current = Join-Path $public $f
  if(Test-Path -LiteralPath $current){ Copy-Item -LiteralPath $current -Destination (Join-Path $backup $f) -Force }
}
$payload = Join-Path $PSScriptRoot "payload\public"
foreach($f in $files){
  $src = Join-Path $payload $f
  if(-not (Test-Path -LiteralPath $src)){ throw ("Payload missing: " + $f) }
  Copy-Item -LiteralPath $src -Destination (Join-Path $public $f) -Force
}
Write-Host "MEDSHIELD GUIDED V2 INSTALLED"
Write-Host ("Backup: " + $backup)
Write-Host "Plety background: NOT MODIFIED"
Write-Host "Worker / D1 / Wrangler: NOT MODIFIED"
