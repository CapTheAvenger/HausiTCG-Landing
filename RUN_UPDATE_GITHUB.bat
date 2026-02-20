@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GitHub Data Update
echo ========================================
echo.
echo Dieses Script kopiert aktualisierte CSV-Dateien
echo ins GitHub-Repository und pusht die Änderungen.
echo.
pause

powershell.exe -ExecutionPolicy Bypass -File "%~dp0UPDATE_GITHUB_DATA.ps1"

pause
