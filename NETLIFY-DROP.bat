@echo off
title Menu Creator — instant HTTPS link (Netlify Drop)
color 0E
setlocal

set "ROOT=%~dp0"

echo.
echo  ============================================================
echo   Menu Creator — phone link in 2 minutes (FREE, no account)
echo  ============================================================
echo.
echo  Step 1: Building _site folder (icons + app files)...
cd /d "%ROOT%"
call npm install >nul 2>&1
call npm run build
if errorlevel 1 (
  echo  Build failed — install Node.js from https://nodejs.org then retry.
  pause
  exit /b 1
)
echo.
echo  Step 2: Netlify Drop opens in your browser.
echo  Step 3: Drag the _site FOLDER onto the page (not menu-creator root).
echo.
echo  Folder to drag:
echo    %ROOT%_site
echo.
start https://app.netlify.com/drop
explorer "%ROOT%_site"
echo.
echo  Netlify gives a link like: https://something-random.netlify.app
echo  Open it on your phone — Menu Creator should load.
echo  Reply "live" with your Netlify link when it works.
echo.
pause
