@echo off
setlocal EnableExtensions

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=C:\Users\18950843148\Desktop\网页设计"
set "PUBLIC=%TARGET%\public"
set "HERE=%~dp0"
set "PAYLOAD=%HERE%payload\public"
set "BACKUP=%TARGET%\_app_shell_backup_%RANDOM%"

if not exist "%PUBLIC%\index.html" (
  echo ERROR: %PUBLIC%\index.html not found.
  exit /b 1
)
if not exist "%PAYLOAD%\index.html" (
  echo ERROR: patch payload missing.
  exit /b 1
)

mkdir "%BACKUP%" >nul 2>nul
copy /Y "%PUBLIC%\index.html" "%BACKUP%\index.html" >nul
if exist "%PUBLIC%\medshield-app-shell.css" copy /Y "%PUBLIC%\medshield-app-shell.css" "%BACKUP%\medshield-app-shell.css" >nul
if exist "%PUBLIC%\medshield-app-shell.js" copy /Y "%PUBLIC%\medshield-app-shell.js" "%BACKUP%\medshield-app-shell.js" >nul

copy /Y "%PAYLOAD%\index.html" "%PUBLIC%\index.html" >nul || exit /b 1
copy /Y "%PAYLOAD%\medshield-app-shell.css" "%PUBLIC%\medshield-app-shell.css" >nul || exit /b 1
copy /Y "%PAYLOAD%\medshield-app-shell.js" "%PUBLIC%\medshield-app-shell.js" >nul || exit /b 1

echo.
echo MEDSHIELD DESKTOP APP SHELL INSTALLED
echo Routes: HOME / OVERVIEW / RISK / CAPABILITIES / CONSOLE / EVIDENCE
echo Plety blue dynamic background: NOT MODIFIED
echo Simulation CSS/JS: NOT MODIFIED
echo Worker / D1 / Wrangler: NOT MODIFIED
echo Backup: %BACKUP%
exit /b 0
