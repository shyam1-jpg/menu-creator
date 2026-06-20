@echo off
title Menu Creator — one-click Render deploy
color 0B
echo.
echo  ============================================================
echo   Menu Creator — finish Render deploy (GitHub already done)
echo  ============================================================
echo.
echo  GitHub repo is live:
echo    https://github.com/shyam1-jpg/menu-creator
echo.
echo  Paste your Render API key once (same account as kiteline.uk):
echo    https://dashboard.render.com/u/settings#api-keys
echo    Create key named "Menu Creator deploy" if you don't have one.
echo.
start https://dashboard.render.com/u/settings#api-keys
echo.
set /p RENDERKEY="Paste Render API key here: "
if "%RENDERKEY%"=="" (
  echo Cancelled — no API key entered.
  pause
  exit /b 1
)
echo.
echo  Deploying to Render (fixes service srv-d8oagn8k1i2s738d7fc0)...
set RENDER_API_KEY=%RENDERKEY%
cd /d "%~dp0"
node scripts/fix-render-deploy.js
echo.
if %ERRORLEVEL% EQU 0 (
  echo  Opening live app...
  start https://menu-creator.onrender.com/
  start https://menu-creator.onrender.com/manifest.json
)
pause
