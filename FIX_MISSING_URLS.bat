@echo off
echo ========================================
echo FIX Missing URLs in all_cards_database
echo ========================================
echo.

cd /d "%~dp0"

REM Try to find Python from venv
if exist ".venv\Scripts\python.exe" (
    echo Using Python from .venv
    .venv\Scripts\python.exe fix_missing_urls.py
) else (
    echo Using system Python
    python fix_missing_urls.py
)

echo.
pause
