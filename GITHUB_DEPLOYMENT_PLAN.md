# 📦 GitHub Deployment Plan - HausiTCG Landing Website

## 🎯 Ziel
Neues GitHub Repository für die Landing-Website mit allen relevanten Dateien.

---

## 📁 Dateien für GitHub Pages Deployment

### **Hauptdateien (REQUIRED)**
- ✅ `landing.html` - Haupt-Website (umbenennen zu `index.html`)
- ✅ `README.md` - Repository Beschreibung
- `.gitignore` - Ignore-Datei für Python/temp files

### **Daten-Ordner** `/data/`
Folgende CSV-Dateien werden von der Landing-Site geladen:
- ✅ `data/city_league_decks.csv`
- ✅ `data/city_league_archetypes_comparison.csv`
- ✅ `data/current_meta_decks.csv`
- ✅ `data/current_meta_archetypes_comparison.csv`
- ✅ `data/unified_card_data.csv`

### **Optionale Dateien**
- `formats.json` - Format-Definitionen
- `pokemon_sets_mapping.csv` - Set-Mapping

---

## 🚀 GitHub Pages Setup - Step by Step

### **Schritt 1: Neues Repository erstellen**
1. Gehe zu https://github.com/new
2. Repository Name: `HausiTCG-Landing` (oder dein gewünschter Name)
3. Beschreibung: `Pokemon TCG Analysis - Landing Page & Meta Dashboard`
4. ✅ Public
5. ✅ Add README
6. Create Repository

### **Schritt 2: Lokales Repository vorbereiten**
```powershell
# Neuer Ordner für GitHub Upload
mkdir C:\Users\haush\Desktop\HausiTCG-Landing
cd C:\Users\haush\Desktop\HausiTCG-Landing

# landing.html zu index.html umbenennen (WICHTIG für GitHub Pages)
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\landing.html" "index.html"

# Data-Ordner erstellen und CSV-Dateien kopieren
mkdir data
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\city_league_decks.csv" "data\"
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\city_league_archetypes_comparison.csv" "data\"
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\current_meta_decks.csv" "data\"
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\current_meta_archetypes_comparison.csv" "data\"
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\unified_card_data.csv" "data\"

# Optional: formats.json
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\formats.json" "."
```

### **Schritt 3: .gitignore erstellen**
Erstelle eine `.gitignore` Datei im Ordner:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.venv/
venv/
ENV/

# IDE
.vscode/
.idea/
*.code-workspace

# OS
.DS_Store
Thumbs.db
desktop.ini

# Temp
*.tmp
*.log
*.bak
*.swp

# Build
*.exe
*.spec
build/
dist/

# Batch Scripts (nicht für Landing-Site benötigt)
*.bat

# Python Scripts (Landing-Site benötigt nur HTML+CSV)
*.py
```

### **Schritt 4: Git initialisieren und pushen**
```powershell
cd C:\Users\haush\Desktop\HausiTCG-Landing

# Git initialisieren
git init
git add .
git commit -m "Initial commit: Landing page with CSV data"

# Mit GitHub verbinden (ersetze USERNAME/REPO)
git remote add origin https://github.com/CapTheAvenger/HausiTCG-Landing.git
git branch -M main
git push -u origin main
```

### **Schritt 5: GitHub Pages aktivieren**
1. Gehe zu deinem Repository auf GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` → Ordner: `/ (root)`
5. **Save**
6. Warte 1-2 Minuten

### **Schritt 6: Website testen**
Deine Website ist verfügbar unter:
```
https://captheavenger.github.io/HausiTCG-Landing/
```

---

## 📝 README.md Inhalt (Vorschlag)

```markdown
# 🎴 HausiTCG - Pokemon TCG Analysis Dashboard

Eine interaktive Landing-Page für Pokemon TCG Meta-Analysen mit Live-Daten aus City League und Current Meta Turnieren.

## 🌐 Live-Website
**[https://captheavenger.github.io/HausiTCG-Landing/](https://captheavenger.github.io/HausiTCG-Landing/)**

## ✨ Features

- **🇯🇵 City League Meta**: Japan City League Turniere & Entwicklung
- **📊 City League Deck Analysis**: Detaillierte Deck-Analysen mit Datum-Filter
- **🎮 Current Meta**: Aktuelle Meta-Übersicht
- **📈 Current Meta Deck Analysis**: Deck-Builder und Analyse-Tools
- **🏆 Past Meta**: Historische Daten
- **🧰 Cards**: Karten-Datenbank

## 📱 Mobile-Optimiert
- Responsive Design für alle Bildschirmgrößen
- Touch-optimierte Buttons (min. 44x44px)
- Optimierte Layouts für Smartphones (480px, 375px Breakpoints)

## 🔄 Daten-Update
Die CSV-Dateien im `/data/` Ordner werden regelmäßig aktualisiert und automatisch von der Website geladen.

## 🛠️ Technologie
- Pure HTML/CSS/JavaScript
- Keine externen Dependencies
- GitHub Pages Hosting

## 📊 Datenquellen
- City League: Limitless TCG Japan
- Current Meta: Limitless TCG Online
- Card Data: Pokemon TCG API

---

**© 2026 HausiTCG - Pokemon TCG Analysis**
```

---

## 🔄 Regelmäßige Updates (nach Setup)

### **Daten aktualisieren (ohne Python-Scripts hochzuladen)**
```powershell
# In deinem lokalen HausiTCG-Landing Ordner
cd C:\Users\haush\Desktop\HausiTCG-Landing

# Neue CSV-Dateien kopieren (nach Scraper-Run)
Copy-Item "C:\Users\haush\OneDrive\Desktop\Hausi´s Pokemon TCG Analysis\data\*.csv" "data\" -Force

# Git committen und pushen
git add data/*.csv
git commit -m "Update: CSV data $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push

# GitHub Pages aktualisiert automatisch nach ~1-2 Minuten
```

---

## 🎯 Was NICHT ins Repository kommt
- ❌ Python Scripts (.py Dateien)
- ❌ Batch Files (.bat Dateien)
- ❌ EXE Files
- ❌ .venv/ Ordner
- ❌ Scraper-Tools
- ❌ Build-Tools

**Nur die fertige Landing-Page + CSV-Daten!**

---

## ⚠️ Wichtige Hinweise

### **CORS-Problem (Cross-Origin)**
GitHub Pages kann CSV-Dateien problemlos laden, **ABER**:
- Die CSV-Dateien müssen im **gleichen Repository/Domain** sein
- Pfade in `landing.html` müssen relativ sein: `data/city_league_decks.csv` ✅
- Absolute Pfade funktionieren NICHT: `C:\Users\...` ❌

### **index.html statt landing.html**
GitHub Pages nutzt automatisch `index.html` als Startseite.
**WICHTIG**: `landing.html` → `index.html` umbenennen!

### **Data-Ordner Struktur**
Die HTML-Datei lädt CSVs von:
```
https://captheavenger.github.io/HausiTCG-Landing/data/city_league_decks.csv
```

Verzeichnisstruktur im Repository:
```
HausiTCG-Landing/
├── index.html          (umbenannt von landing.html)
├── README.md
├── .gitignore
├── formats.json        (optional)
└── data/
    ├── city_league_decks.csv
    ├── city_league_archetypes_comparison.csv
    ├── current_meta_decks.csv
    ├── current_meta_archetypes_comparison.csv
    └── unified_card_data.csv
```

---

## 🚨 Altes Repository löschen (Optional)

Falls du das alte Repository **komplett löschen** willst:

1. Gehe zu https://github.com/CapTheAvenger/HausiTCG
2. **Settings** (rechts oben)
3. Ganz runter scrollen → **Danger Zone**
4. **Delete this repository**
5. Repository-Namen eingeben zur Bestätigung
6. Delete

**⚠️ VORSICHT**: Alle Daten/History gehen verloren!

---

## ✅ Checkliste

- [ ] Neues Repository erstellt
- [ ] Lokalen Ordner vorbereitet
- [ ] `landing.html` → `index.html` umbenannt
- [ ] CSV-Dateien in `data/` Ordner kopiert
- [ ] `.gitignore` erstellt
- [ ] README.md erstellt
- [ ] Git initialisiert und gepusht
- [ ] GitHub Pages aktiviert
- [ ] Website getestet
- [ ] Altes Repository gelöscht (optional)

---

**Fertig! 🎉**

Deine Landing-Website ist jetzt live auf GitHub Pages!
