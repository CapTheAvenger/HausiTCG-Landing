# 🎴 HausiTCG - Pokemon TCG Analysis Dashboard

Eine interaktive Landing-Page für Pokemon TCG Meta-Analysen mit Live-Daten aus City League und Current Meta Turnieren.

## 🌐 Live-Website
**[https://captheavenger.github.io/HausiTCG-Landing/](https://captheavenger.github.io/HausiTCG-Landing/)**

## ✨ Features

### 🇯🇵 City League Meta
- Übersicht aller Japan City League Turniere
- Archetype-Entwicklung und Trends
- Vergleich alter vs. neuer Daten

### 📊 City League Deck Analysis
- Detaillierte Deck-Analysen mit interaktiven Filtern
- **Datum-Filter**: Turniere nach Zeitraum filtern
- **Deck-Auswahl**: Über 30 Archetypen analysieren
- **Karten-Filter**: Pokemon, Trainer, Energie separat anzeigen
- **Rarity-Switcher**: Verschiedene Karten-Versionen auswählen
- **Image View**: Alle Deck-Karten visuell anzeigen
- **Auto-Update**: Zähler und Statistiken passen sich dynamisch an

### 🎮 Current Meta
- Aktuelle Meta-Übersicht basierend auf Online-Turnieren
- Top-Decks und Winrates
- Meta-Share Analysen

### 📈 Current Meta Deck Analysis
- Deck-Builder mit Drag & Drop
- Karten-Suche und Filter
- Export-Funktionen

### 🏆 Past Meta
- Historische Turnier-Daten
- Meta-Entwicklung über Zeit

### 🧰 Cards
- Vollständige Karten-Datenbank
- Detaillierte Karten-Informationen
- Set-Informationen

## 📱 Mobile-Optimiert

Die gesamte Website ist vollständig für mobile Geräte optimiert:

- ✅ **Responsive Design** für alle Bildschirmgrößen
- ✅ **Touch-optimierte Buttons** (min. 44x44px)
- ✅ **Breakpoints**: 768px (Tablets), 480px (Phones), 375px (Small Phones)
- ✅ **Optimierte Layouts**: Datum-Filter werden auf Mobile gestackt
- ✅ **Horizontal scrollbare Tabellen** auf kleinen Bildschirmen
- ✅ **Auto-Zoom Prevention**: font-size: 16px für Inputs (iOS)
- ✅ **Kompakte Karten-Grids** für bessere Übersicht

## 🔄 Daten-Updates

Die CSV-Dateien im `/data/` Ordner werden regelmäßig aktualisiert:

```
data/
├── city_league_decks.csv                      # City League Deck-Daten
├── city_league_archetypes_comparison.csv      # Archetype-Vergleiche
├── current_meta_decks.csv                     # Current Meta Decks
├── current_meta_archetypes_comparison.csv     # Meta Archetype-Vergleiche
└── unified_card_data.csv                      # Karten-Datenbank
```

Die Website lädt diese Dateien automatisch und aktualisiert alle Ansichten dynamisch.

## 🛠️ Technologie

- **Frontend**: Pure HTML/CSS/JavaScript
- **Keine externen Dependencies**: Alles läuft direkt im Browser
- **Hosting**: GitHub Pages (kostenlos)
- **Encoding**: UTF-8-BOM für korrekte Umlaute
- **Delimiter**: Semikolon (`;`) für CSV-Dateien

## 📊 Datenquellen

- **City League**: [Limitless TCG - Japan City League](https://limitlesstcg.com/tournaments/japan)
- **Current Meta**: Limitless TCG Online Turniere
- **Card Data**: Pokemon TCG API & Scraper

## 🎯 Besondere Features

### Datum-Filter (City League Analysis)
Filter Turniere nach Zeitraum und sehe:
- Angepasste Deck-Counts
- Filterte Karten-Statistiken
- Prozentuale Verteilung
- Durchschnittliche Karten-Counts

### Rarity-Switcher
Wähle zwischen verschiedenen Karten-Versionen:
- Ultra Rare
- Special Illustration Rare
- Hyper Rare
- Normale Version
- **Mixed Rarity**: Kombiniere verschiedene Versionen

### Image View Modal
- Visueller Überblick über alle Deck-Karten
- Karten-Counts als Badges
- Click-to-Zoom Funktion
- Responsive Grid-Layout

### URL-Correction für japanische Karten
Automatische Korrektur der Bild-URLs für japanische M3-Set Karten:
- `tpci` → `tpc` (Server)
- `EN` → `JP` (Sprache)
- `M3_046` → `M3_46` (Leading Zero Removal)

## 🔧 Lokale Entwicklung

Falls du die Website lokal testen möchtest:

```powershell
# HTTP Server starten (Python)
python -m http.server 8000

# Website aufrufen
http://localhost:8000/index.html
```

**Wichtig**: Die Website benötigt einen HTTP Server, da CSV-Dateien via Fetch-API geladen werden (nicht per file://).

## 📝 Lizenz

Dieses Projekt ist für den persönlichen Gebrauch und die Pokemon TCG Community.

**Datenquellen**:
- Limitless TCG für Turnier-Daten
- Pokemon Company für Karten-Bilder

## 🤝 Beitragen

Vorschläge und Feedback sind willkommen! Öffne ein Issue oder Pull Request.

## 📞 Kontakt

- **GitHub**: [@CapTheAvenger](https://github.com/CapTheAvenger)
- **Projekt**: [HausiTCG-Landing](https://github.com/CapTheAvenger/HausiTCG-Landing)

---

**© 2026 HausiTCG - Pokemon TCG Analysis Dashboard**

Erstellt mit ❤️ für die Pokemon TCG Community
