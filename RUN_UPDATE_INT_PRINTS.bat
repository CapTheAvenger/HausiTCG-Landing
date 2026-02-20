@echo off
setlocal

echo ============================================================
echo   UPDATE INTERNATIONAL PRINTS IN ALL_CARDS_DATABASE.CSV
echo ============================================================
echo.
echo Dieses Script aktualisiert NUR die international_prints Spalte.
echo Alle anderen Daten (rarity, image_url) bleiben erhalten.
echo.
echo Geschätzte Dauer: 7-8 Stunden
echo Empfohlen: Über Nacht laufen lassen
echo.
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if backup exists
if exist "data\all_cards_database_BACKUP_before_int_prints_fix.csv" (
    echo [OK] Backup gefunden: all_cards_database_BACKUP_before_int_prints_fix.csv
) else (
    echo [INFO] Erstelle Backup vor Update...
    copy "data\all_cards_database.csv" "data\all_cards_database_BACKUP_before_int_prints_fix.csv" >nul
    echo [OK] Backup erstellt!
)

echo.
echo [START] Update wird gestartet...
echo.

REM Check if EXE exists, otherwise use Python
if exist "dist\update_int_prints.exe" (
    echo [INFO] Running compiled executable...
    dist\update_int_prints.exe
) else (
    echo [INFO] Executable not found, running Python script...
    echo [INFO] Make sure you have activated the virtual environment!
    python update_int_prints.py
)

echo.
echo ============================================================
echo Update abgeschlossen!
echo ============================================================
echo.

REM Show sample results
echo Prüfe Beispiel-Karten:
echo.
findstr /C:"N's Darumaka" data\all_cards_database.csv
findstr /C:"N's Darmanitan" data\all_cards_database.csv
echo.

pause
endlocal
