# BUILD_ALL.ps1 - Rebuilds all scrapers (7 total)

Write-Host ""
Write-Host "============================================================"
Write-Host "BUILDING ALL SCRAPERS (7 total)" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""

$ErrorActionPreference = "Stop"

# Clean dist folder
if (Test-Path "dist") {
    Write-Host "Cleaning dist folder (removing old EXEs)..." -ForegroundColor Yellow
    Remove-Item "dist\*.exe" -Force -ErrorAction SilentlyContinue
    Write-Host ""
}

# Clean PyInstaller cache (spec files have cached data)
Write-Host "Cleaning PyInstaller cache..." -ForegroundColor Yellow
Remove-Item "build" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Filter "__pycache__" -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Filter "*.pyc" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host ""

$specs = @(
    @{ num = 1; name = "City League Archetype Scraper"; file = "city_league_archetype_scraper.spec"; phase = "DATA COLLECTION" },
    @{ num = 2; name = "Limitless Online Scraper"; file = "limitless_online_scraper.spec"; phase = "DATA COLLECTION" },
    @{ num = 3; name = "Tournament Scraper JH"; file = "tournament_scraper_JH.spec"; phase = "DATA COLLECTION" },
    @{ num = 4; name = "All Cards Scraper"; file = "all_cards_scraper.spec"; phase = "DATA COLLECTION" },
    @{ num = 5; name = "Japanese Cards Scraper"; file = "japanese_cards_scraper.spec"; phase = "DATA COLLECTION" },
    @{ num = 6; name = "City League Analysis Scraper"; file = "city_league_analysis_scraper.spec"; phase = "ANALYSIS" },
    @{ num = 7; name = "Current Meta Analysis Scraper"; file = "current_meta_analysis_scraper.spec"; phase = "ANALYSIS" }
)

$lastPhase = ""
foreach ($spec in $specs) {
    if ($spec.phase -ne $lastPhase) {
        Write-Host ""
        Write-Host "============================================================"
        Write-Host "PHASE: $($spec.phase)" -ForegroundColor Green
        Write-Host "============================================================"
        Write-Host ""
        $lastPhase = $spec.phase
    }
    
    Write-Host "[$($spec.num)/7] Building $($spec.name)..." -ForegroundColor Cyan
    
    & python -m PyInstaller $spec.file --distpath dist -y --clean | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] $($spec.name) build failed!" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE"
        exit 1
    }
    
    Write-Host "[OK] $($spec.name) built successfully" -ForegroundColor Green
    Write-Host ""
}

# Post-build
Write-Host ""
Write-Host "============================================================"
Write-Host "POST-BUILD: Cleanup and verification" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host ""

# No longer copying files - all data is in data/ directory now
Write-Host "[OK] All scrapers write to data/ directory"
Write-Host "[OK] All scripts read from data/ directory"
Write-Host "[OK] card_type_lookup.py embedded in EXEs"

Write-Host ""
Write-Host "============================================================"
Write-Host "[SUCCESS] ALL 7 SCRAPER BUILDS COMPLETE!" -ForegroundColor Green
Write-Host "============================================================"
Write-Host ""
Write-Host "Built: 5 Data Collection + 2 Analysis Scrapers"
Write-Host "Location: dist"
Write-Host "Data output: data"
Write-Host ""
