@echo off
setlocal
cd /d "%~dp0"
set "TARGET=%CD%"
cd /d "%~dp0"
if exist "%~1\public\index.html" set "TARGET=%~1"
if not exist "%TARGET%\public\index.html" (
  echo ERROR: Run this installer with the project root as the first argument.
  echo Example: install_central_stage.cmd "C:\path\to\project"
  exit /b 2
)

set "BACKUP=%TARGET%\_simlab_central_stage_backup"
if not exist "%BACKUP%" mkdir "%BACKUP%"
copy /Y "%TARGET%\public\index.html" "%BACKUP%\index.html" >nul
if exist "%TARGET%\public\medshield-simulation-v2.css" copy /Y "%TARGET%\public\medshield-simulation-v2.css" "%BACKUP%\medshield-simulation-v2.css" >nul
if exist "%TARGET%\public\medshield-simulation-v2.js" copy /Y "%TARGET%\public\medshield-simulation-v2.js" "%BACKUP%\medshield-simulation-v2.js" >nul

copy /Y "%~dp0payload\public\index.html" "%TARGET%\public\index.html" >nul
copy /Y "%~dp0payload\public\medshield-simulation-v2.css" "%TARGET%\public\medshield-simulation-v2.css" >nul
copy /Y "%~dp0payload\public\medshield-simulation-v2.js" "%TARGET%\public\medshield-simulation-v2.js" >nul

for %%F in (medshield-simulation.css medshield-simulation.js medshield-simulation-v22-ui.css medshield-simulation-v22-ui.js medshield-simulation-v23-clarity.css medshield-simulation-v23-clarity.js medshield-simulation-v24-ui.css medshield-simulation-v24-ui.js) do (
  if exist "%TARGET%\public\%%F" del /Q "%TARGET%\public\%%F"
)

echo.
echo MEDSHIELD CENTRAL STAGE INSTALLED
echo Single UI owner: medshield-simulation-v2.css / medshield-simulation-v2.js
echo Central attack/data flow: ENABLED
echo U/F/N signal visualization: ENABLED WITHOUT INVENTED NUMERIC VALUES
echo Policy changes topology: ENABLED
echo Evidence dialog: ENABLED
echo Old v22/v23/v24 UI files: REMOVED IF PRESENT
echo Worker / Wrangler / app.js: NOT MODIFIED
echo Backup: %BACKUP%
exit /b 0
