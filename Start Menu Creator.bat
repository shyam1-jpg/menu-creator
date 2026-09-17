@echo off
title Menu Creator
cd /d "%~dp0"
set "URL=http://127.0.0.1:4002/"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Opening index.html as a file.
  echo For Print/PDF casing updates, install Node.js, then double-click this again.
  echo That opens http://127.0.0.1:4002/ instead of a stale cached app.
  start "" "%~dp0index.html"
  goto :eof
)

if not exist "node_modules\express" (
  echo Installing dependencies...
  call npm install
)

powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',4002); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo Starting Menu Creator at %URL%
  start "Menu Creator server" /D "%~dp0" cmd /k npm start
  timeout /t 3 /nobreak >nul
)

echo Opening %URL%
start "" "%URL%"
