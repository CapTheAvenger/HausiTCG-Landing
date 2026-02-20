@echo off
echo ===============================================================
echo   CardMarket Price Scraper
echo   Scrapes prices for set specified in scraper_config.json
echo ===============================================================
echo.

REM Activate virtual environment
echo [1/2] Activating Python environment...
call .venv\Scripts\activate.bat

REM Check if selenium is installed
python -c "import selenium" 2>nul
if errorlevel 1 (
    echo.
    echo [!] Selenium not found. Installing...
    pip install selenium
    echo.
)

REM Run scraper
echo [2/2] Starting price scraper...
echo.
python cardmarket_price_scraper.py

echo.
echo ===============================================================
echo   Scraping completed!
echo   Check price_scraper.log for details
echo ===============================================================
pause
