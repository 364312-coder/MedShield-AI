param(
  [Parameter(Mandatory=$true)]
  [string]$Target
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
  if (-not (Test-Path -LiteralPath $path)) {
    throw "STOP: required path missing: $path"
  }
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Target ("_backup_evidence_proof_v53_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $jsPath -Destination (Join-Path $backup "medshield-app-shell.js") -Force
Copy-Item -LiteralPath $cssPath -Destination (Join-Path $backup "medshield-app-shell.css") -Force
Copy-Item -LiteralPath $indexPath -Destination (Join-Path $backup "index.html") -Force

function Read-Utf8([string]$Path) {
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom([string]$Path,[string]$Text) {
  [System.IO.File]::WriteAllText($Path,$Text,$utf8)
}

function Restore-Backup {
  Copy-Item -LiteralPath (Join-Path $backup "medshield-app-shell.js") -Destination $jsPath -Force
  Copy-Item -LiteralPath (Join-Path $backup "medshield-app-shell.css") -Destination $cssPath -Force
  Copy-Item -LiteralPath (Join-Path $backup "index.html") -Destination $indexPath -Force
}

try {
  $js = Read-Utf8 $jsPath
  $newFunc = Read-Utf8 $funcPath

  $pattern = '(?s)  function moveEvidence\(view\)\{.*?\r?\n  \}\r?\n\r?\n  function setEvidenceTab'
  $rx = New-Object System.Text.RegularExpressions.Regex($pattern)
  $matches = $rx.Matches($js)
  if ($matches.Count -ne 1) {
    throw "STOP: expected exactly one live moveEvidence renderer, found $($matches.Count)."
  }

  $replacement = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    return $newFunc + "`r`n`r`n  function setEvidenceTab"
  }
  $jsNew = $rx.Replace($js, $replacement, 1)

  if ($jsNew -notmatch 'EVIDENCE_PROOF_V5_2_CN') {
    throw "STOP: renderer sentinel missing after replacement."
  }
  if ($jsNew -notmatch 'evidence-proof-dashboard') {
    throw "STOP: renderer root missing after replacement."
  }
  Write-Utf8NoBom $jsPath $jsNew

  $css = Read-Utf8 $cssPath
  $cssPatch = Read-Utf8 $cssPatchPath
  $css = [System.Text.RegularExpressions.Regex]::Replace(
    $css,
    '(?s)\s*/\* EVIDENCE_PROOF_V5_START.*?/\* EVIDENCE_PROOF_V5_END \*/\s*',
    ''
  )
  $cssNew = $css.TrimEnd() + "`r`n`r`n" + $cssPatch.Trim() + "`r`n"
  Write-Utf8NoBom $cssPath $cssNew

  $index = Read-Utf8 $indexPath
  $index = [System.Text.RegularExpressions.Regex]::Replace(
    $index,
    'medshield-app-shell\.css\?v=[^"''\s>]+',
    'medshield-app-shell.css?v=evidence-proof-v5-3-cn-20260903'
  )
  $index = [System.Text.RegularExpressions.Regex]::Replace(
    $index,
    'medshield-app-shell\.js\?v=[^"''\s>]+',
    'medshield-app-shell.js?v=evidence-proof-v5-3-cn-20260903'
  )
  Write-Utf8NoBom $indexPath $index

  $checkJs = Read-Utf8 $jsPath
  $moveEvidenceCount = ([System.Text.RegularExpressions.Regex]::Matches(
    $checkJs,
    '(?m)^\s*function\s+moveEvidence\s*\(\s*view\s*\)\s*\{'
  )).Count
  if ($moveEvidenceCount -ne 1) {
    throw "STOP: moveEvidence validation failed. Found $moveEvidenceCount."
  }
  if ($checkJs -notmatch 'EVIDENCE_PROOF_V5_2_CN') {
    throw "STOP: post-write JS sentinel validation failed."
  }

  $checkCss = Read-Utf8 $cssPath
  $startCount = ([System.Text.RegularExpressions.Regex]::Matches($checkCss, 'EVIDENCE_PROOF_V5_START')).Count
  $endCount = ([System.Text.RegularExpressions.Regex]::Matches($checkCss, 'EVIDENCE_PROOF_V5_END')).Count
  if ($startCount -ne 1 -or $endCount -ne 1) {
    throw "STOP: Evidence CSS block validation failed ($startCount/$endCount)."
  }
  $openCount = ([System.Text.RegularExpressions.Regex]::Matches($checkCss, '\{')).Count
  $closeCount = ([System.Text.RegularExpressions.Regex]::Matches($checkCss, '\}')).Count
  if ($openCount -ne $closeCount) {
    throw "STOP: CSS brace validation failed ($openCount/$closeCount)."
  }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    & node --check $jsPath
    if ($LASTEXITCODE -ne 0) {
      throw "STOP: node --check failed."
    }
  }

  Write-Host ""
  Write-Host "MedShield-AI Evidence Proof V5.3 CN installed and validated." -ForegroundColor Green
  Write-Host "Backup: $backup"
  Write-Host "Patched: public\medshield-app-shell.js"
  Write-Host "Patched: public\medshield-app-shell.css"
  Write-Host "Cache-busted: public\index.html"
  Write-Host "Sentinel: EVIDENCE_PROOF_V5_2_CN"
  Write-Host ""
}
catch {
  Restore-Backup
  Write-Host "Installation failed; original files restored from backup." -ForegroundColor Red
  throw
}
