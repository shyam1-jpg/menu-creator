@echo off
title Menu Creator — get ONE working HTTPS link today
color 0B
setlocal

set "ROOT=%~dp0"
set "RENDER=https://dashboard.render.com/web/srv-d8oagn8k1i2s738d7fc0"
set "LIVE=https://menu-creator.onrender.com/"

echo.
echo  ============================================================
echo   Menu Creator — pick ONE path below
echo  ============================================================
echo.
echo  [A] FASTEST (about 2 min, no login)
echo      Double-click NETLIFY-DROP.bat
echo      Drag the _site folder onto Netlify Drop — get instant HTTPS link.
echo.
echo  [B] RENDER (menu-creator.onrender.com) — 3 clicks after push:
echo      1. Settings tab
echo      2. Render Subdomain: ENABLED  (fixes "no-server" 404)
echo      3. Manual Deploy - Deploy latest commit
echo      Build: npm install ^&^& npm run build
echo      Publish directory: _site
echo.
echo  [C] GITHUB PAGES (permanent, free):
echo      https://github.com/shyam1-jpg/menu-creator/settings/pages
echo      Source: GitHub Actions  (not "Deploy from branch")
echo      Then open: https://shyam1-jpg.github.io/menu-creator/
echo.
echo  Building _site folder now (needed for Netlify + Render)...
echo.

cd /d "%ROOT%"
call npm install >nul 2>&1
call npm run build
if errorlevel 1 (
  echo.
  echo  Build failed — check Node.js is installed (node -v).
  pause
  exit /b 1
)

echo.
echo  _site ready at: %ROOT%_site
echo.
echo  Opening Render dashboard — do the 3 clicks in section [B] above.
start "" "%RENDER%"
echo.
echo  Waiting 3 minutes for Render deploy, then opening %LIVE%
echo  (Skip wait if you used Netlify Drop instead.)
timeout /t 180 /nobreak >nul
start "" "%LIVE%"
echo.
echo  Reply "live" when Menu Creator loads (not plain "Not Found").
echo.
pause
