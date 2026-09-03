@echo off
setlocal EnableExtensions

set "TARGET=%CD%"
set "PAYLOAD=%~dp0payload\public"

if not exist "%TARGET%\public\index.html" (
  echo [ERROR] public\index.html was not found in the current directory.
  echo Run this installer from the MedShield-AI project root.
  exit /b 1
)

if not exist "%PAYLOAD%\index.html" (
  echo [ERROR] Patch payload is incomplete.
  exit /b 1
)

set "BACKUP=%TARGET%\_simlab_final_backup_%RANDOM%%RANDOM%"
mkdir "%BACKUP%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Could not create backup directory.
  exit /b 1
)

copy /Y "%TARGET%\public\index.html" "%BACKUP%\index.html" >nul
if exist "%TARGET%\public\medshield-simulation-v2.css" copy /Y "%TARGET%\public\medshield-simulation-v2.css" "%BACKUP%\medshield-simulation-v2.css" >nul
if exist "%TARGET%\public\medshield-simulation-v2.js" copy /Y "%TARGET%\public\medshield-simulation-v2.js" "%BACKUP%\medshield-simulation-v2.js" >nul

copy /Y "%PAYLOAD%\index.html" "%TARGET%\public\index.html" >nul || exit /b 1
copy /Y "%PAYLOAD%\medshield-simulation-v2.css" "%TARGET%\public\medshield-simulation-v2.css" >nul || exit /b 1
copy /Y "%PAYLOAD%\medshield-simulation-v2.js" "%TARGET%\public\medshield-simulation-v2.js" >nul || exit /b 1

echo.
echo ==============================================
echo MEDSHIELD SIMULATION LAB FINAL INSTALLED
echo ==============================================
echo Backup: %BACKUP%
echo UI owner: medshield-simulation-v2.css/js only
echo Old v22/v23/v24 UI layers: NOT REQUIRED
echo Worker / Wrangler / app.js: NOT MODIFIED
echo.

where node >nul 2>&1
if not errorlevel 1 (
  node --check "%TARGET%\public\medshield-simulation-v2.js"
  if errorlevel 1 (
    echo [ERROR] JavaScript syntax check failed.
    exit /b 1
  )
  echo JavaScript syntax: PASS
)

echo Installation complete.
exit /b 0
