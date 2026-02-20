@echo off
chcp 65001 >nul
cls
echo ============================================================
echo           DATA CLEANUP - Duplikate entfernen
echo ============================================================
echo.
echo Dieses Skript entfernt Duplikate und alte Datenbanken:
echo   - Löscht dist\data\ komplett (alle Scraper nutzen nur noch data\)
echo   - Behält data\ (Haupt-Datenbank-Ordner)
echo.
echo ============================================================
echo.

if exist "dist\data" (
    echo [1/2] Lösche dist\data\...
    rmdir /S /Q "dist\data"
    echo       ✓ dist\data\ wurde gelöscht
) else (
    echo       ℹ dist\data\ existiert nicht (bereits bereinigt)
)

echo.
echo [2/2] Prüfe data\ Ordner...
if exist "data" (
    echo       ✓ data\ existiert (Haupt-Datenbank-Ordner)
) else (
    echo       ! WARNUNG: data\ existiert nicht! Wird beim nächsten Scraper-Lauf erstellt.
)

echo.
echo ============================================================
echo           CLEANUP ABGESCHLOSSEN!
echo ============================================================
echo.
echo Alle Scraper schreiben jetzt nur noch in: data\
echo HTML-Dateien laden von: data\
echo.
echo Keine Duplikate mehr! ✓
echo.
pause
