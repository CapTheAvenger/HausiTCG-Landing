@echo off
chcp 65001 >nul
cls
echo ============================================================
echo            LANDING PAGE - HTML Viewer öffnen
echo ============================================================
echo.
echo Öffnet die Landing Page im Browser...
echo.

REM Öffne die Landing Page im Standard-Browser
start "" "landing.html"

echo.
echo Landing Page wurde im Browser geöffnet!
echo.
echo Alle Funktionen sind jetzt in landing.html integriert:
echo   - Deck Builder
echo   - City League Analysis
echo   - Card Database
echo.
echo ============================================================
timeout /t 3 >nul
