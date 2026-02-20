@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GitHub Landing-Site vorbereiten
echo ========================================
echo.
echo Dieses Script erstellt einen neuen Ordner
echo mit allen Dateien für GitHub Pages.
echo.
pause

powershell.exe -ExecutionPolicy Bypass -File "%~dp0PREPARE_GITHUB_LANDING.ps1"

pause
