@echo off
chcp 65001 >nul
cls
echo ============================================================
echo       ALL CARDS SCRAPER - Current Meta (Standard H-Block)
echo ============================================================
echo.
echo Dieser Scraper zieht NUR Karten aus aktuellen Standard-Sets:
echo   ASC, SSP, SCR, TWM, TEF, PAR, MEW, OBF, PAL, SVI
echo.
echo Dauer: ca. 1-2 Stunden (statt 8+ Stunden für alle Sets)
echo.
echo ============================================================
echo.

REM Copy the current meta settings to be the active settings
copy /Y "all_cards_scraper_settings_CURRENT_META.json" "all_cards_scraper_settings.json" >nul

REM Delete old database to start fresh
if exist "data\all_cards_database.csv" (
    echo Lösche alte Datenbank...
    del "data\all_cards_database.csv"
    echo.
)

REM Run the scraper
echo Starte Scraper...
echo.
.venv\Scripts\python.exe all_cards_scraper.py

echo.
echo ============================================================
echo Scraper abgeschlossen!
echo ============================================================
echo.
pause
