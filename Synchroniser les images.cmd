@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-image-schedule.ps1" -AppliquerChaine
set "WARRENFALL_RESULT=%ERRORLEVEL%"
pause
exit /b %WARRENFALL_RESULT%
