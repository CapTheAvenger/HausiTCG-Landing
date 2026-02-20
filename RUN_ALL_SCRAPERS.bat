@echo off
chcp 65001 >nul
cls
echo ============================================================
echo              UNIFIED SCRAPER TCG - Quick Start
echo ============================================================
echo.
echo Startet Ace Spec Scraper zuerst, dann alle anderen parallel:
echo   0. Ace Spec Scraper (aktualisiert bekannte Ace Specs)
echo   1. All Cards Database Scraper (laut Settings-Datei)
echo   2. Japanese Cards Database Scraper (4 neueste Sets)
echo   3. City League Archetype Scraper
echo   4. Limitless Online Scraper
echo   5. Tournament Scraper JH
echo   6. City League Analysis Scraper
echo   7. Current Meta Analysis Scraper
echo.
echo ============================================================
pause

echo.
echo ============================================================
echo [0/8] Starte Ace Spec Scraper (Aktualisiere Ace Spec Liste)...
echo ============================================================
python ace_spec_scraper.py
if errorlevel 1 (
    echo.
    echo [WARNING] Ace Spec Scraper fehlgeschlagen - nutze Fallback Liste
    echo.
)

echo.
echo ============================================================
echo [1/8] Starte All Cards Database Scraper (laut Settings)...
echo ============================================================
REM Run the all cards scraper with current settings from all_cards_scraper_settings.json
.venv\Scripts\python.exe all_cards_scraper.py
if errorlevel 1 (
    echo.
    echo [WARNING] All Cards Scraper fehlgeschlagen
    echo.
)

echo.
echo ============================================================
echo [2/8] Starte Japanese Cards Database Scraper (4 neueste Sets)...
echo ============================================================
.venv\Scripts\python.exe japanese_cards_scraper.py
if errorlevel 1 (
    echo.
    echo [WARNING] Japanese Cards Scraper fehlgeschlagen
    echo.
)

echo.
echo ============================================================
echo Card Databases aktualisiert. Starte alle anderen parallel...
echo ============================================================
echo.

REM Start all scrapers with unique process names
start "1-City-Archetype" "dist\city_league_archetype_scraper.exe"
start "2-Limitless-Online" "dist\limitless_online_scraper.exe"
start "3-Tournament-JH" "dist\tournament_scraper_JH.exe"
start "4-City-Analysis" "dist\city_league_analysis_scraper.exe"
start "5-Current-Meta" "dist\current_meta_analysis_scraper.exe"

REM Call PowerShell monitoring script
powershell -NoProfile -ExecutionPolicy Bypass -File "monitor_scrapers.ps1"

echo.
echo ============================================================
echo              ALLE SCRAPER ABGESCHLOSSEN!
echo ============================================================
echo.
echo Ergebnisse findest du im "data\" Ordner:
echo   - all_cards_database.csv (Card Database - EN/Standard)
echo   - japanese_cards_database.csv (Card Database - JP/4 neueste Sets)
echo   - city_league_archetypes.csv + HTML
echo   - limitless_online_decks.csv + HTML
echo   - limitless_online_decks_comparison.csv + HTML
echo   - tournament_cards_data.csv
echo   - tournament_cards_data_cards.csv
echo   - city_league_analysis.csv
echo   - current_meta_card_data.csv
echo.
echo ============================================================
pause
