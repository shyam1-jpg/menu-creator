@echo off
title Menu Creator — instant phone link (Netlify Drop)
color 0E
echo.
echo  ============================================================
echo   Menu Creator — get a phone link in 2 minutes (FREE)
echo  ============================================================
echo.
echo  Step 1: Netlify Drop page opens in your browser.
echo  Step 2: Drag the menu-creator FOLDER onto the page.
echo.
echo  Folder to drag:
echo    %~dp0
echo.
start https://app.netlify.com/drop
explorer "%~dp0"
echo.
echo  After drop, Netlify gives you a link like:
echo    https://something-random.netlify.app
echo.
echo  Open that link on your phone — Menu Creator should load.
echo  Reply "live" with your Netlify link when it works.
echo.
pause
