@echo off
title Menu Creator — deploy to Render (manual — no API key needed)
color 0B
echo.
echo  ============================================================
echo   Menu Creator — get a working HTTPS link
echo  ============================================================
echo.
echo  FASTEST TODAY (no Render login):
echo    Double-click NETLIFY-DROP.bat — drag folder, get link in 2 min.
echo.
echo  PERMANENT FREE LINK (GitHub Pages):
echo    1. Push is on GitHub already.
echo    2. Open: https://github.com/shyam1-jpg/menu-creator/settings/pages
echo    3. Source: GitHub Actions  (not "Deploy from branch")
echo    4. Wait 2 min, then open:
echo       https://shyam1-jpg.github.io/menu-creator/
echo.
echo  ----------------------------------------------------------
echo   RENDER FIX (if you want menu-creator.onrender.com)
echo  ----------------------------------------------------------
echo.
echo  Your Render service (404 = subdomain off or wrong type):
echo    https://dashboard.render.com/web/srv-d8oagn8k1i2s738d7fc0
echo.
start https://dashboard.render.com/web/srv-d8oagn8k1i2s738d7fc0
echo.
echo  ON RENDER — do ONE of these:
echo.
echo  A) Fix existing service (Settings tab):
echo     - On Render Subdomain: ENABLED  (not disabled)
echo     - Type: Static Site OR Web Service (Node)
echo     - Build: npm install ^&^& npm run build
echo     - Start (Web only): npm start
echo     - Publish dir (Static only): .  (dot = root)
echo     Then Manual Deploy - Deploy latest commit
echo.
echo  B) If still 404 — delete service, then:
echo     New - Blueprint - connect shyam1-jpg/menu-creator
echo     (render.yaml now uses Static Site — simpler, no Node)
echo.
echo  Wait 2-3 minutes, then open:
echo    https://menu-creator.onrender.com/
echo.
echo  Reply "live" when any link shows Menu Creator (not 404).
echo.
pause
