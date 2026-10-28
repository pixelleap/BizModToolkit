@echo off
setlocal
cd /d "%~dp0"
set "TARGET="
for %%F in ("dist\*.html") do if not defined TARGET set "TARGET=%%~fF"
if defined TARGET (
  start "" "%TARGET%"
) else (
  echo dist\*.html not found
  pause
)