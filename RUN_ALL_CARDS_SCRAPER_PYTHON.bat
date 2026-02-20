@echo off
setlocal

echo ============================================================
echo       ALL CARDS SCRAPER - Running Python script directly
echo ============================================================
echo This bypasses the EXE to avoid potential ChromeDriver issues
echo ============================================================
echo.

cd /d "%~dp0"

set LOG_DIR=dist\logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set LOG_FILE=%LOG_DIR%\all_cards_scraper_%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo Working Directory: %CD%
echo Data will be saved to: %CD%\data\
echo Log: %LOG_FILE%
echo.
echo Starting scraper...
echo.

python all_cards_scraper.py

echo.
echo ============================================================
echo Scraper abgeschlossen!
echo ============================================================
echo.
echo Daten gespeichert: %CD%\data\all_cards_database.csv
echo.
pause
endlocal
