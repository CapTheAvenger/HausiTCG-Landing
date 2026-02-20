@echo off
echo =========================================
echo  RESET CITY LEAGUE DATA
echo =========================================
echo.
echo This will DELETE the City League analysis data.
echo All tournament archetype data will be removed.
echo.
echo Files to delete:
echo - data\city_league_analysis.csv
echo.
pause

if exist "data\city_league_analysis.csv" (
    del "data\city_league_analysis.csv"
    echo ✓ Deleted city_league_analysis.csv
) else (
    echo ! city_league_analysis.csv not found
)

echo.
echo Reset complete!
echo Run RUN_CITY_LEAGUE_ANALYSIS.bat to rebuild the data.
echo.
pause
