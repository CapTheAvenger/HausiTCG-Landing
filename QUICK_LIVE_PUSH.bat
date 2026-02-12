@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ================================
echo QUICK LIVE PUSH - START
echo ================================
echo.

REM Get current timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

echo [%date% %time%] Checking git status...
git status

echo.
echo [%date% %time%] Staging files: data/, deck_viewer.html, index.html
git add data/ deck_viewer.html index.html

echo.
echo [%date% %time%] Committing changes...
git commit -m "Quick live push - %date% %time%"

if errorlevel 1 (
    echo.
    echo [WARNING] Nothing to commit - files already up to date
    echo.
    goto :pushonly
)

:pushonly
echo.
echo [%date% %time%] Pushing to main branch...
git push origin main

echo.
echo [%date% %time%] Syncing gh-pages with main...
git checkout gh-pages 2>nul
git reset --hard main 2>nul
git push origin gh-pages --force

echo.
echo [%date% %time%] Switching back to main...
git checkout main 2>nul

echo.
echo ================================
echo QUICK LIVE PUSH - DONE!
echo ================================
echo.
echo Website should be live in 1-2 minutes:
echo https://captheavenger.github.io/HausiTCG/
echo.

pause
