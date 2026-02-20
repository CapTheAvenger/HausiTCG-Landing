@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   UNIFIED SCRAPER TCG - Direct Python (No .exe needed)
echo ============================================================
echo.
echo This batch file runs all scrapers directly via Python.
echo Use this if dist/ .exe files are not available.
echo.
echo Runs in order:
echo   0. Ace Spec Scraper (updates current Ace Specs from web)
echo   1. City League Archetype Scraper
echo   2. Limitless Online Scraper  
echo   3. Tournament Scraper JH
echo   4. City League Analysis Scraper
echo   5. Current Meta Analysis Scraper
echo.
echo ============================================================
pause

setlocal enabledelayedexpansion

REM Get Python executable path from venv
set PYTHON=".venv\Scripts\python.exe"

if not exist %PYTHON% (
    echo ERROR: Python virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [0/6] Running Ace Spec Scraper...
echo ============================================================
%PYTHON% ace_spec_scraper.py
if errorlevel 1 (
    echo.
    echo [WARNING] Ace Spec Scraper failed - using fallback list
    echo.
)

echo.
echo ============================================================
echo [1/6] Running City League Archetype Scraper...
echo ============================================================
%PYTHON% city_league_archetype_scraper.py

echo.
echo ============================================================
echo [2/6] Running Limitless Online Scraper...
echo ============================================================
%PYTHON% limitless_online_scraper.py

echo.
echo ============================================================
echo [3/6] Running Tournament Scraper JH...
echo ============================================================
%PYTHON% tournament_scraper_JH.py

echo.
echo ============================================================
echo [4/6] Running City League Analysis Scraper...
echo ============================================================
%PYTHON% city_league_analysis_scraper.py

echo.
echo ============================================================
echo [5/6] Running Current Meta Analysis Scraper...
echo ============================================================
%PYTHON% current_meta_analysis_scraper.py

echo.
echo ============================================================
echo          ALL SCRAPERS COMPLETED!
echo ============================================================
echo.
echo Check data/ folder for generated CSV files.
echo.
pause
