@echo off
chcp 65001 >nul
cls
echo ============================================================
echo        ALL CARDS SCRAPER - TESTLAUF (nur 3 Seiten)
echo ============================================================
echo.
echo Dieser Scraper zieht NUR die ersten 3 Seiten (~150 Karten)
echo Perfekt zum Testen der Funktionalität!
echo.
echo Dauer: ca. 2-3 Minuten
echo.
echo ============================================================
echo.

REM Copy the test settings to be the active settings
copy /Y "all_cards_scraper_settings_TEST.json" "all_cards_scraper_settings.json" >nul

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
