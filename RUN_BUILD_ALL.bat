@echo off
REM Simple wrapper to run BUILD_ALL.ps1 with PowerShell
setlocal enabledelayedexpansion

echo Starting build process...
echo.

REM Change to script directory
cd /d "%~dp0"

REM Kill any running scrapers to unlock the exes
echo Killing any running scraper processes...
taskkill /IM city_league_analysis_scraper.exe /F /T 2>nul
taskkill /IM current_meta_analysis_scraper.exe /F /T 2>nul
taskkill /IM limitless_online_scraper.exe /F /T 2>nul
taskkill /IM city_league_archetype_scraper.exe /F /T 2>nul
taskkill /IM tournament_scraper_JH.exe /F /T 2>nul
taskkill /IM japanese_cards_scraper.exe /F /T 2>nul
taskkill /IM all_cards_scraper.exe /F /T 2>nul
taskkill /IM scrape_cardmarket_prices.exe /F /T 2>nul

timeout /t 1 /nobreak >nul

echo.

REM Run PowerShell script
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\BUILD_ALL.ps1'"

REM Check if error occurred
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================================
    echo ERROR: Build failed with exit code %ERRORLEVEL%
    echo ============================================================
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo Build completed successfully!
echo ============================================================
echo.
pause
