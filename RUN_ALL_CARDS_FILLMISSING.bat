@echo off
setlocal

echo ============================================================
echo   ALL CARDS SCRAPER - FILL MISSING DATA ONLY
echo ============================================================
echo.
echo WARNUNG: Dieses Script ergänzt NUR fehlende URLs und Rarities!
echo.
echo WICHTIG: Starte dies NUR wenn update_int_prints.exe FERTIG ist!
echo          Sonst gehen die international_prints Updates verloren!
echo.
echo ============================================================
echo.
echo Ist update_int_prints.exe komplett fertig? (J/N)
choice /C JN /N /M "Fortsetzten? "
if errorlevel 2 goto :cancel

cd /d "%~dp0"

echo.
echo [START] Starte Scraper zum Ergänzen fehlender Daten...
echo.

REM Copy settings file to dist folder
copy /Y "all_cards_scraper_settings_FILLMISSING.json" "dist\all_cards_scraper_settings.json" >nul

REM Run the scraper
dist\all_cards_scraper.exe

echo.
echo ============================================================
echo Scraping abgeschlossen!
echo ============================================================
echo.
echo Prüfe Beispiel-Karten:
findstr /C:"Tinkatuff,PAL,103" data\all_cards_database.csv
findstr /C:"Tinkatuff,PAL,104" data\all_cards_database.csv
echo.

pause
goto :end

:cancel
echo.
echo Abgebrochen! Warte bis update_int_prints.exe fertig ist.
echo.
pause

:end
endlocal
