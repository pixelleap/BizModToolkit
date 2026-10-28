@echo off
set "TARGET="
for %%F in ("%~dp0dist\*.html") do if not defined TARGET set "TARGET=%%~fF"
if defined TARGET (
  start "" "%TARGET%"
) else (
  echo Cannot find dist\*.html
  pause
)