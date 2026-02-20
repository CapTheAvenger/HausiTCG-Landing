@echo off
REM Update Pokemon TCG Card Database
REM ===================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo UPDATE POKEMON TCG CARD DATABASE
echo ============================================================================
echo.
echo ENGLISH CARDS:
echo   1 = Auto-detect (incremental if exists, full otherwise)
echo   2 = Full download (3-4 hours)
echo   3 = Incremental update (new cards only, 5-10 minutes)
echo.
echo JAPANESE CARDS (4 latest sets only):
echo   4 = Download/Update Japanese cards (30-45 minutes)
echo.
echo   q = Exit
echo.

set /p choice="Choose option (1-4, q): "

if /i "%choice%"=="1" (
    echo.
    echo Starting auto-detect mode for English cards...
    python update_cards.py --type english --mode auto
    goto done
)

if /i "%choice%"=="2" (
    echo.
    echo WARNING: Full English download takes 3-4 hours!
    set /p confirm="Are you sure? (y/n): "
    if /i "!confirm!"=="y" (
        python update_cards.py --type english --mode full
    ) else (
        echo Cancelled.
    )
    goto done
)

if /i "%choice%"=="3" (
    echo.
    echo Starting incremental update for English cards...
    python update_cards.py --type english --mode incremental
    goto done
)

if /i "%choice%"=="4" (
    echo.
    echo Starting Japanese cards scraper (4 latest sets)...
    python update_cards.py --type japanese
    goto done
)

if /i "%choice%"=="q" (
    echo Exiting.
    goto done
)

echo Invalid choice!

:done
pause
