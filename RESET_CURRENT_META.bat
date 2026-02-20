@echo off
echo =========================================
echo  RESET CURRENT META DATA
echo =========================================
echo.
echo This will DELETE the Current Meta analysis data.
echo All Meta Live and Meta Play data will be removed.
echo.
echo Files to delete:
echo - data\current_meta_card_data.csv
echo.
pause

if exist "data\current_meta_card_data.csv" (
    del "data\current_meta_card_data.csv"
    echo ✓ Deleted current_meta_card_data.csv
) else (
    echo ! current_meta_card_data.csv not found
)

echo.
echo Reset complete!
echo Run RUN_CURRENT_META_ANALYSIS.bat to rebuild the data.
echo.
pause
