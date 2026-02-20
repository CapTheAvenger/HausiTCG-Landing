@echo off
echo =========================================
echo  TOURNAMENT SCRAPER JH (FAST MODE)
echo =========================================
echo.
echo Running with reduced limits for faster execution:
echo - 50 tournaments instead of 100
echo - 50 decks per tournament instead of 100
echo - 0.5s delay instead of 1.0s
echo.
echo Expected runtime: ~50%% faster than normal mode
echo.
pause

REM Backup original settings
copy /Y tournament_JH_settings.json tournament_JH_settings_BACKUP.json > nul
echo Backed up original settings

REM Use FAST settings
copy /Y tournament_JH_settings_FAST.json tournament_JH_settings.json > nul
echo Switched to FAST mode settings

REM Run scraper
python tournament_scraper_JH.py

REM Restore original settings
copy /Y tournament_JH_settings_BACKUP.json tournament_JH_settings.json > nul
del tournament_JH_settings_BACKUP.json > nul
echo Restored original settings

echo.
pause
