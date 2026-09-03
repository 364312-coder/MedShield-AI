param(
  [Parameter(Mandatory=$false)]
  [string]$Target = "C:\Users\18950843148\Desktop\网页设计"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$patchDir = Join-Path $root "patch"
$publicDir = Join-Path $Target "public"
$jsPath = Join-Path $publicDir "medshield-app-shell.js"
$cssPath = Join-Path $publicDir "medshield-app-shell.css"
$indexPath = Join-Path $publicDir "index.html"
$funcPath = Join-Path $patchDir "moveEvidence.v5.jsfrag"
$cssPatchPath = Join-Path $patchDir "evidence-proof-v5.css"

foreach ($path in @($Target,$publicDir,$jsPath,$cssPath,$indexPath,$funcPath,$cssPatchPath)) {
  if (-not (Test-Path -LiteralPath $path)) { throw "STOP: required path missing: $path" }
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_backup_evidence_proof_v5_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $jsPath -Destination (Join-Path $backup "medshield-app-shell.js") -Force
Copy-Item -LiteralPath $cssPath -Destination (Join-Path $backup "medshield-app-shell.css") -Force
Copy-Item -LiteralPath $indexPath -Destination (Join-Path $backup "index.html") -Force

function Write-Utf8NoBom([string]$Path,[string]$Text) {
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path,$Text,$enc)
}

function Restore-Backup {
  Copy-Item -LiteralPath (Join-Path $backup "medshield-app-shell.js") -Destination $jsPath -Force
  Copy-Item -LiteralPath (Join-Path $backup "medshield-app-shell.css") -Destination $cssPath -Force
  Copy-Item -LiteralPath (Join-Path $backup "index.html") -Destination $indexPath -Force
}

try {
  $js = [System.IO.File]::ReadAllText($jsPath)
  $newFunc = [System.IO.File]::ReadAllText($funcPath)

  # Replace exactly the real dynamic Evidence renderer. This is the critical fix.
  $pattern = '(?s)  function moveEvidence\(view\)\{.*?\r?\n  \}\r?\n\r?\n  function setEvidenceTab'
  $rx = New-Object System.Text.RegularExpressions.Regex($pattern)
  $matches = $rx.Matches($js)
  if ($matches.Count -ne 1) {
    throw "STOP: expected exactly one moveEvidence renderer, found $($matches.Count). No files changed permanently."
  }
  $jsNew = $rx.Replace($js, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newFunc + "`r`n`r`n  function setEvidenceTab" }, 1)
  if ($jsNew -notmatch 'EVIDENCE_PROOF_V5' -or $jsNew -notmatch 'evidence-proof-dashboard') {
    throw "STOP: Evidence V5 sentinel missing after renderer replacement."
  }
  Write-Utf8NoBom $jsPath $jsNew

  # Replace only our isolated Evidence V5 style block; do not touch global/risk/simulation/background CSS.
  $css = [System.IO.File]::ReadAllText($cssPath)
  $cssPatch = [System.IO.File]::ReadAllText($cssPatchPath)
  $css = [System.Text.RegularExpressions.Regex]::Replace($css,'(?s)\s*/\* EVIDENCE_PROOF_V5_START.*?/\* EVIDENCE_PROOF_V5_END \*/\s*','')
  $cssNew = $css.TrimEnd() + "`r`n`r`n" + $cssPatch.Trim() + "`r`n"
  Write-Utf8NoBom $cssPath $cssNew

  # Cache-bust only the App Shell assets so the browser cannot reuse the old Evidence renderer.
  $index = [System.IO.File]::ReadAllText($indexPath)
  $index = [System.Text.RegularExpressions.Regex]::Replace($index,'medshield-app-shell\.css\?v=[^"''\s>]+','medshield-app-shell.css?v=evidence-proof-v5-1-20260903')
  $index = [System.Text.RegularExpressions.Regex]::Replace($index,'medshield-app-shell\.js\?v=[^"''\s>]+','medshield-app-shell.js?v=evidence-proof-v5-1-20260903')
  Write-Utf8NoBom $indexPath $index

  # Structural validation.
  $checkJs = [System.IO.File]::ReadAllText($jsPath)
  $moveEvidenceCount = ([System.Text.RegularExpressions.Regex]::Matches($checkJs, '(?m)^\s*function\s+moveEvidence\s*\(\s*view\s*\)\s*\{')).Count
  if ($moveEvidenceCount -ne 1) { throw "STOP: moveEvidence count validation failed. Found $moveEvidenceCount." }
  if ($checkJs -notmatch 'ATTACK SCENARIO COVERAGE' -or $checkJs -notmatch 'CONFIRMED SECURITY FEEDBACK') { throw "STOP: new Evidence DOM validation failed." }

  $checkCss = [System.IO.File]::ReadAllText($cssPath)
  $open = ([regex]::Matches($checkCss,'\{')).Count
  $close = ([regex]::Matches($checkCss,'\}')).Count
  if ($open -ne $close) { throw "STOP: CSS brace validation failed ($open/$close)." }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    & node --check $jsPath
    if ($LASTEXITCODE -ne 0) { throw "STOP: node --check failed." }
  }

  Write-Host "" 
  Write-Host "MedShield-AI Evidence Proof V5.1 installed and validated." -ForegroundColor Green
  Write-Host "Backup: $backup"
  Write-Host "Patched real renderer: public\medshield-app-shell.js"
  Write-Host "Patched isolated styles: public\medshield-app-shell.css"
  Write-Host "Cache-busted references: public\index.html"
  Write-Host "Sentinel: EVIDENCE_PROOF_V5"
  Write-Host ""
}
catch {
  Restore-Backup
  Write-Host "Installation failed; original files restored from backup." -ForegroundColor Red
  throw
}
