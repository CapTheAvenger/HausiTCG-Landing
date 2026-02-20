@echo off
chcp 65001 >nul
cls

echo ============================================================
echo CURRENT META - Direct Python Execution (WITH DEBUG)
echo ============================================================
echo.
echo Diese Variante startet die Python-Skripte direkt.
echo Fehler werden angezeigt und du kannst sie sehen!
echo.
echo ============================================================
pause

REM Change to workspace directory
cd /d "%~dp0"

REM Prüfe ob Python installiert ist
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Python nicht gefunden!
    echo Bitte stelle sicher, dass Python installiert und im PATH ist.
    echo.
    pause
    exit /b 1
)

echo Python gefunden! Starte Scraper...
echo.

REM Run the current meta analysis scraper directly
echo ============================================================
echo STARTE: Current Meta Analysis Scraper
echo ============================================================
echo.

python current_meta_analysis_scraper.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Current Meta Analysis Scraper fehlgeschlagen!
    echo Error Code: %ERRORLEVEL%
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [SUCCESS] Alle Scraper abgeschlossen!
echo ============================================================
echo.
echo Ergebnisse im "data\" Ordner:
echo   - current_meta_card_data.csv
echo.
pause
