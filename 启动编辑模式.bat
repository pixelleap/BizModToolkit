@echo off
cd /d "%~dp0"
echo Starting local edit server...
echo Browser should open automatically.
echo Close this window to stop.
node server.mjs
echo.
echo Server stopped.
pause