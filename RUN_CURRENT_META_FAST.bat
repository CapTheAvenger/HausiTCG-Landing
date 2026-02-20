@echo off
echo =========================================
echo  CURRENT META SCRAPER (FAST MODE)
echo =========================================
echo.
echo Running with reduced limits for faster execution:
echo - 30 decks instead of 60
echo - 10 lists per deck instead of 20
echo - 30 tournaments instead of 60
echo - Reduced delays (2s/4s instead of 4s/8s)
echo.
echo Expected runtime: ~1 hour (vs ~3-4 hours in normal mode)
echo.
pause

REM Backup original settings
copy /Y current_meta_analysis_settings.json current_meta_analysis_settings_BACKUP.json > nul
echo Backed up original settings

REM Use FAST settings
copy /Y current_meta_analysis_settings_FAST.json current_meta_analysis_settings.json > nul
echo Switched to FAST mode settings

REM Run scraper
python current_meta_analysis_scraper.py

REM Restore original settings
copy /Y current_meta_analysis_settings_BACKUP.json current_meta_analysis_settings.json > nul
del current_meta_analysis_settings_BACKUP.json > nul
echo Restored original settings

echo.
pause
