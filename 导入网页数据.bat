@echo off
setlocal
if "%~1"=="" (
  echo Drag the exported JSON file onto this BAT.
  echo.
  echo In the app: Share - Data - Export JSON
  pause
  exit /b 1
)
cd /d "%~dp0"
echo Importing: %~1
node tools\import-state.mjs "%~1" .
if errorlevel 1 (
  echo.
  echo Import failed.
  pause
  exit /b 1
)
echo.
echo Building and publishing...
call publish.bat