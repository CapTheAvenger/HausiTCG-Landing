@echo off
echo =========================================
echo  CITY LEAGUE ANALYSIS (FAST MODE)
echo =========================================
echo.
echo Running with reduced limits for faster execution:
echo - 8 decklists per league instead of 16
echo - Reduced delay (1.0s instead of 1.5s)
echo.
echo Expected runtime: ~50%% faster than normal mode
echo.
pause

REM Backup original settings
copy /Y city_league_analysis_settings.json city_league_analysis_settings_BACKUP.json > nul
echo Backed up original settings

REM Use FAST settings
copy /Y city_league_analysis_settings_FAST.json city_league_analysis_settings.json > nul
echo Switched to FAST mode settings

REM Run scraper
python city_league_analysis_scraper.py

REM Restore original settings
copy /Y city_league_analysis_settings_BACKUP.json city_league_analysis_settings.json > nul
del city_league_analysis_settings_BACKUP.json > nul
echo Restored original settings

echo.
pause
