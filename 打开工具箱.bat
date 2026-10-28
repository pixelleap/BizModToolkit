@echo off
set ELECTRON_RUN_AS_NODE=
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0launch-desktop.ps1"
