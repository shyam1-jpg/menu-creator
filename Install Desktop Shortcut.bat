@echo off
set "APP_DIR=%~dp0"
set "LAUNCHER=%APP_DIR%Start Menu Creator.bat"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Menu Creator.lnk'); $s.TargetPath = '%LAUNCHER%'; $s.WorkingDirectory = '%APP_DIR%'; $s.Description = 'Menu Creator - design printable menus'; $s.Save()"
echo.
echo Desktop shortcut created: Menu Creator
echo Double-click it anytime to open the app.
echo.
pause
