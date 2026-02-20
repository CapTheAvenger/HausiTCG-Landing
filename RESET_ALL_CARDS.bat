@echo off
echo =========================================
echo  RESET ALL CARDS DATABASE
echo =========================================
echo.
echo This will DELETE the complete All Cards Database.
echo All historical card data will be removed.
echo.
echo Files to delete:
echo - data\all_cards_database.csv
echo - data\all_cards_database.json
echo.
pause

if exist "data\all_cards_database.csv" (
    del "data\all_cards_database.csv"
    echo ✓ Deleted all_cards_database.csv
) else (
    echo ! all_cards_database.csv not found
)

if exist "data\all_cards_database.json" (
    del "data\all_cards_database.json"
    echo ✓ Deleted all_cards_database.json
) else (
    echo ! all_cards_database.json not found
)

echo.
echo Reset complete!
echo Run RUN_ALL_CARDS_SCRAPER.bat to rebuild the database.
echo.
pause
