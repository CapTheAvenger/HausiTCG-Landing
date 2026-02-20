# GitHub Landing-Website Vorbereitung
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  HausiTCG Landing - GitHub Setup  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = $PSScriptRoot
$targetDir = "C:\Users\haush\Desktop\HausiTCG-Landing"

# 1. Ziel-Ordner vorbereiten
Write-Host "[1/6] Ziel-Ordner vorbereiten..." -ForegroundColor Yellow

if (Test-Path $targetDir) {
    Write-Host "   Warnung: Ordner existiert bereits!" -ForegroundColor Red
    $confirm = Read-Host "   Möchten Sie ihn löschen und neu erstellen? (j/n)"
    if ($confirm -eq "j") {
        Remove-Item -Path $targetDir -Recurse -Force
        Write-Host "   ✓ Alter Ordner gelöscht" -ForegroundColor Green
    }
    else {
        Write-Host "   Abgebrochen." -ForegroundColor Red
        exit
    }
}

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Write-Host "   ✓ Ordner erstellt: $targetDir" -ForegroundColor Green

# 2. landing.html zu index.html kopieren
Write-Host "[2/6] landing.html zu index.html kopieren..." -ForegroundColor Yellow
Copy-Item "$sourceDir\landing.html" "$targetDir\index.html" -Force
Write-Host "   ✓ index.html erstellt" -ForegroundColor Green

# 3. Data-Ordner und CSV-Dateien kopieren
Write-Host "[3/6] CSV-Daten kopieren..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$targetDir\data" -Force | Out-Null

$csvFiles = @(
    "city_league_decks.csv",
    "city_league_archetypes_comparison.csv",
    "current_meta_decks.csv",
    "current_meta_archetypes_comparison.csv",
    "unified_card_data.csv"
)

foreach ($file in $csvFiles) {
    $sourcePath = "$sourceDir\data\$file"
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath "$targetDir\data\" -Force
        Write-Host "   ✓ $file" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠ $file nicht gefunden!" -ForegroundColor Red
    }
}

# 4. Optional: formats.json kopieren
Write-Host "[4/6] Optional: formats.json kopieren..." -ForegroundColor Yellow
if (Test-Path "$sourceDir\formats.json") {
    Copy-Item "$sourceDir\formats.json" "$targetDir\" -Force
    Write-Host "   ✓ formats.json kopiert" -ForegroundColor Green
}
else {
    Write-Host "   ⚠ formats.json nicht gefunden (optional)" -ForegroundColor Yellow
}

# 5. README.md erstellen
Write-Host "[5/6] README.md erstellen..." -ForegroundColor Yellow
if (Test-Path "$sourceDir\GITHUB_README.md") {
    Copy-Item "$sourceDir\GITHUB_README.md" "$targetDir\README.md" -Force
    Write-Host "   ✓ README.md erstellt" -ForegroundColor Green
}
else {
    Write-Host "   ⚠ GITHUB_README.md nicht gefunden" -ForegroundColor Red
}

# 6. .gitignore erstellen
Write-Host "[6/6] .gitignore erstellen..." -ForegroundColor Yellow
if (Test-Path "$sourceDir\GITHUB_GITIGNORE.txt") {
    Copy-Item "$sourceDir\GITHUB_GITIGNORE.txt" "$targetDir\.gitignore" -Force
    Write-Host "   ✓ .gitignore erstellt" -ForegroundColor Green
}
else {
    Write-Host "   ⚠ GITHUB_GITIGNORE.txt nicht gefunden" -ForegroundColor Red
}

# Zusammenfassung
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Vorbereitung abgeschlossen!   " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ordner-Struktur:" -ForegroundColor White
Write-Host "  $targetDir" -ForegroundColor Gray
Write-Host "  ├── index.html" -ForegroundColor Gray
Write-Host "  ├── README.md" -ForegroundColor Gray
Write-Host "  ├── .gitignore" -ForegroundColor Gray
Write-Host "  ├── formats.json (optional)" -ForegroundColor Gray
Write-Host "  └── data/" -ForegroundColor Gray
Write-Host "      ├── city_league_decks.csv" -ForegroundColor Gray
Write-Host "      ├── city_league_archetypes_comparison.csv" -ForegroundColor Gray
Write-Host "      ├── current_meta_decks.csv" -ForegroundColor Gray
Write-Host "      ├── current_meta_archetypes_comparison.csv" -ForegroundColor Gray
Write-Host "      └── unified_card_data.csv" -ForegroundColor Gray
Write-Host ""

# Nächste Schritte
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "        Nächste Schritte:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Neues GitHub Repository erstellen:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Git initialisieren und pushen:" -ForegroundColor White
Write-Host '   cd "C:\Users\haush\Desktop\HausiTCG-Landing"' -ForegroundColor Cyan
Write-Host "   git init" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host '   git commit -m "Initial commit: Landing page"' -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/CapTheAvenger/HausiTCG-Landing.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. GitHub Pages aktivieren:" -ForegroundColor White
Write-Host "   Settings -> Pages -> Source: main / (root)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Website ist live nach 1-2 Minuten:" -ForegroundColor White
Write-Host "   https://captheavenger.github.io/HausiTCG-Landing/" -ForegroundColor Cyan
Write-Host ""

# Ordner öffnen
Write-Host "=====================================" -ForegroundColor Cyan
$openFolder = Read-Host "Ordner jetzt öffnen? (j/n)"
if ($openFolder -eq "j") {
    Start-Process explorer.exe $targetDir
}

Write-Host ""
Write-Host "✓ Fertig!" -ForegroundColor Green
