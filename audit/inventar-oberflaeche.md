# Feature-Inventar der Oberfläche

**Stand:** `main` = 5ec1e742 · erstellt 2026-09-07 · rein aus dem Quelltext gelesen, nichts ausgeführt.

**Zweck:** Grundlage für die vollständige Live-Prüfung. Was hier nicht steht, wird nicht geprüft;
was hier steht, bleibt nicht ungeprüft.

**Lesehilfe:**

* `zu prüfen: …` heißt: der Code legt das nahe, aber das Verhalten ist erst am laufenden System zu klären.
* Datei:Zeile bezieht sich auf den oben genannten Stand.
* Reiter = `<div class="tab-content">` in `index.html`. Es sind **16** Stück, nicht 14: `current-meta`
  (index.html:1107) und `past-meta` (index.html:1791) tragen zusätzlich `fs-scale` und fehlen deshalb in
  einer naiven Suche nach `class="tab-content"`.

---

## F0 · Rahmen: Kopfzeile, Pokéball-Menü, Navigationsleiste, Tieflinks

**Zweck:** Wie man überhaupt irgendwohin kommt und wo man gerade ist.

### F0.1 – F0.9 Kopfzeile (`index.html:452–637`)

| Nr. | Element | id / Aufruf | Tut |
|---|---|---|---|
| F0.1 | Pokéball-Knopf | `mainMenuTrigger`, `toggleMainMenu()` | öffnet/schließt das Hauptmenü; `aria-expanded` |
| F0.2 | Reiter-Abzeichen | `current-tab-title` | zeigt den Namen des offenen Reiters; auf `meta-analysis-hub` ausgeblendet (app-core.js:1659) |
| F0.3 | Dunkelmodus | `themeToggleBtn`, `toggleTheme()` | Mond-/Sonnensymbol, `aria-pressed` |
| F0.4 | Sprache | `langToggleBtn`, `switchLanguage(...)` | DE ⇄ EN, beschriftet mit der Zielsprache |
| F0.5 | Battle Journal | `battleJournalFab`, `openBattleJournalSheet()` | öffnet die Journal-Schublade; Plakette `battleJournalFabBadge` (Anzahl offener Einträge) |
| F0.6 | My Decks | `openProfileSection('decks')` | Profil → Untertab „My Decks" |
| F0.7 | Wishlist | `openProfileSection('wishlist')` | Profil → Untertab „Wishlist" |
| F0.8 | Database | `switchTab('cards')` | Kartendatenbank |
| F0.9 | Sign In / Profil | `signin-btn` → `showAuthModal('signin')`, danach `user-info` → `switchTabAndUpdateMenu('profile')` | zwei Zustände, umgeschaltet über die Klasse `is-signed-out` am `<html>` (inline-init.js:417) |

### F0.10 – F0.28 Pokéball-Menü (`index.html:474–563`)

Zwei aufklappbare Gruppen (`toggleMenuCluster`), Rest flach.

| Nr. | id | Beschriftung | Ziel |
|---|---|---|---|
| F0.10 | `menu-btn-meta-analysis-hub` | Overview / Startseite | **`current-meta`** (nicht `meta-analysis-hub`) |
| F0.11 | `menu-group-meta` | Meta & Tier Lists | klappt `menu-submenu-meta`, startet offen |
| F0.12 | `menu-btn-city-league` | City League Meta | `city-league` |
| F0.13 | `menu-btn-city-league-analysis` | Deck Analysis (Japan) | `city-league-analysis` |
| F0.14 | `menu-btn-current-meta` | Current Meta (Global) | `current-meta` |
| F0.15 | `menu-btn-current-analysis` | Deck Analysis (Global) | `current-analysis` |
| F0.16 | `menu-btn-past-meta` | Past Meta | `past-meta` |
| F0.17 | `menu-btn-cards` | Card Database | `cards` |
| F0.18 | `menu-btn-deckbuilder` | Deck Builder | `openProfileSection('deckbuilder')` → Profil-Untertab |
| F0.19 | `menu-group-tools` | Tools | klappt `menu-submenu-tools`, startet zu |
| F0.20 | `menu-btn-proxy` | Proxy Printer | `proxy` |
| F0.21 | `menu-btn-showdown` | Playtester (TCG Showdown ↗) | `openShowdownExternal()` — externer Reiter, kein Tab |
| F0.22 | `menu-btn-calculator` | Probability Calculator | `calculator` |
| F0.23 | `menu-btn-meta-call` | Meta Call | `meta-call` |
| F0.24 | `menu-btn-profile` | My Profile | `profile` |
| F0.25 | `menu-btn-side-quest` | Side Quest: Champions | `side-quest` |
| F0.26 | `menu-btn-pocket` | Side Quest: TCG Pocket | `pocket` |
| F0.27 | `menu-btn-tutorial` | How to Use | `tutorial` |
| F0.28 | `menu-btn-quellen` | Sources & Method | `quellen` |

Nicht im Menü: `meta-analysis-hub`, `admin`. Beide nur über Tieflink.

### F0.29 – F0.33 Untere Navigationsleiste (`js/ds-nav.js:51–79`, Host `#dsNavHost`)

Fünf Gruppen, mobil fünf Spalten:

| Nr. | Gruppe | Beschriftung DE/EN | Ziel | leuchtet bei |
|---|---|---|---|---|
| F0.29 | `meta` | Meta / Meta | `current-meta` | current-meta, city-league, past-meta, meta-analysis-hub |
| F0.30 | `decks` | Decks / Decks | `current-analysis` | current-analysis, city-league-analysis |
| F0.31 | `turnier` | Turnier / Event | `meta-call` | meta-call |
| F0.32 | `karten` | Karten / Cards | `cards` | cards, proxy, calculator |
| F0.33 | `champions` | Champions | `side-quest` | side-quest |

Ohne Leuchten: `tutorial`, `quellen`, `profile`, `pocket`, `admin` (bewusst, ds-nav.js:60–75).

### F0.34 Datenraum-Filterzeile (`js/ds-filter.js`)

Über City League, Current Meta und Past Meta wird dieselbe Zeile gesetzt:
`DATENRAUM [🇯🇵 Japan] [🌐 Global] [📦 …]` + zweite Spalte (`Zeitraum` bei Japan, `Format` bei Global/Past).
Der Datenraum-Knopf **wechselt den Reiter**; die Format-Spalte spiegelt `#cityLeagueFormatSelect` bzw.
`#pastMetaFormatFilter` und setzt deren Wert. Global hat keine Wahl, dort steht ein Schild
(`.ds-filter-fixed`). Gesperrte Optionen werden als `disabled` mit `title`-Grund übernommen (ds-filter.js:100–113).
Ab >4 Optionen wird aus der Knopfleiste ein `<select>`.

### F0.35 Tieflinks (`js/inline-init.js:423–512`, `HASH_ALIASES`)

| Hash | Zielreiter |
|---|---|
| `#meta-call`, `#metacall`, `#metacall-tab` | meta-call |
| `#tutorial`, `#how-to-use`, `#howto`, `#help`, `#hilfe`, `#anleitung` | tutorial |
| `#quellen`, `#sources`, `#methodik`, `#method`, `#impressum` | quellen |
| `#quellen-quellen`, `#quellen-begriffe`, `#quellen-zuverlaessig`, `#quellen-trennung`, `#quellen-stand`, `#quellen-rechtliches` | quellen + Abschnitt aufklappen (inline-init.js:644–651) |
| `#city-league` | city-league |
| `#city-league-analysis` | city-league-analysis |
| `#current-meta` | current-meta |
| `#current-analysis`, `#deck-analysis` | current-analysis |
| `#past-meta` | past-meta |
| `#cards` | cards |
| `#proxy` | proxy |
| `#pocket`, `#tcg-pocket`, `#pocket-decks` | pocket |
| `#playtester`, `#sandbox` | meta-analysis-hub + Hinweis-Meldung „Playtester läuft jetzt extern" (600 ms verzögert) |
| `#calculator`, `#probability`, `#wahrscheinlichkeit` | calculator |
| `#profile` | profile |
| `#journal` | profile → Untertab `journal` |
| `#side-quest`, `#sidequest`, `#champions` | side-quest |
| `#meta-analysis-hub`, `#hub`, `#uebersicht` | meta-analysis-hub |
| `#admin`, `#datenluecken` | admin |
| `#metabinder`, `#meta-binder` | profile → `metabinder` |
| `#custombinder`, `#custom-binder` | profile → `custombinder` |
| `#testinggroups`, `#testing-groups` | profile → `testinggroups` |
| `#wishlist` | profile → `wishlist` |
| `#tradelist`, `#trade-list` | profile → `tradelist` |
| `#collection` | profile → `collection` |

**Parameter am Hash:** `?deck=<Name>` (current-meta/current-analysis/city-league/city-league-analysis/past-meta),
`?format=<Key>` (past-meta), `?focusCard=<SET>|<Nr>` (wishlist/tradelist, scrollt und blinkt 3 s amber).

**Kanonischer Hash:** nur Schlüssel, die auf sich selbst zeigen, werden zurückgeschrieben (inline-init.js:711).

**Zustände:** Zeigt ein Alias auf eine Reiter-id ohne DOM-Element, wird der Hash ignoriert und
`console.warn('[deep-link] no tab element for …')` geschrieben (inline-init.js:566–570).

*Zählung F0: 35 Elemente.*

---

## F1 · `meta-analysis-hub` — Meta & Deck Analysis (Kachelseite)

**Zweck:** Einstiegsseite, die ohne Klick sagt, welche Decks gerade das Feld bestimmen, und von dort in
die sechs Meta-/Deck-Ansichten verzweigt.

**Erreichbar:** nur über `#hub`, `#uebersicht`, `#meta-analysis-hub`. Kein Menüeintrag, kein Nav-Knopf.

| Nr. | Element | Datei | Anmerkung |
|---|---|---|---|
| F1.1 | Überschrift „Meta & Deck Analysis" + Untertitel | index.html:642–645 | |
| F1.2 | Hilfeknopf `openTabHelp('meta-analysis-hub')` | index.html:643 | öffnet `#helpModal` |
| F1.3 | Antwortblock „Was gerade läuft" (`#metaHubAnswer`) | meta-analysis-hub.js:73, 448–560 | |
| F1.4 | Kachelgitter (`#metaHubTileGrid`), 6 Kacheln | meta-analysis-hub.js:592–620 | jede Kachel = `<button class="meta-hub-tile" data-sub-tab="…">` |

**F1.5 – F1.10 Kacheln** (`SUB_TABS`, meta-analysis-hub.js:14–26), je Titel + Stichpunkt:

| Nr. | Kachel | Ziel |
|---|---|---|
| F1.5 | City League Meta | `city-league` |
| F1.6 | Deck Analysis (Japan) | `city-league-analysis` |
| F1.7 | Current Meta (Global) | `current-meta` |
| F1.8 | Deck Analysis (Global) | `current-analysis` |
| F1.9 | Past Meta | `past-meta` |
| F1.10 | Meta Call | `meta-call` (`topTab`) |

**F1.11 – F1.16 Kennzahlen im Antwortblock** (`answerHtml`, meta-analysis-hub.js:457–560),
drei Kacheln (`.ds-stat`):

| Nr. | Anzeigename | Berechnet von | Definition daneben? |
|---|---|---|---|
| F1.11 | Rolle: „Erfolgreichstes Deck" / „Meistgespielt · Rang n" | meta-analysis-hub.js:466–487 | Rang = `fieldRank` aus der anteilssortierten Liste |
| F1.12 | Große Zahl = Feldanteil (`d.sharePct`) | `computeConversionPerformance` | Kontextzeile „Meta-Anteil" bzw. „des Metas" |
| F1.13 | „aus N Antritten" (`d.brought`) | ebd. | gerundet, `toLocaleString` |
| F1.14 | „Top-8-Quote X %" (`d.convPct`) | ebd. | |
| F1.15 | „N,N-mal so oft wie der Schnitt" | `d.convPct / (model.conv.expected*100)` | **roh**, nicht geglättet (Kommentar meta-analysis-hub.js:512–520) |
| F1.16 | Nenner-Satz „Aus N gewichteten Antritten · Deck: X von Y in die Top 8." + Verweis „Wie das gerechnet ist →" (`#quellen`) | `answerSentence`/`answerNenner` | Erklärung ausgelagert nach Quellen & Methodik |

**F1.17 Datenstand-Chip** `js-data-freshness` mit `data-quelle="online_tournament_top8_decks.csv"`
(gefüllt von `js/ds-datenstand.js`).

**Zustände:**
* Laden: kein eigener Ladezustand; `#metaHubAnswer` bleibt leer, bis die CSV da ist.
* Fehler: `loadAnswerRows()` setzt `_answerRows = null` und **zeichnet den Block gar nicht** —
  „kein Platzhalter" (meta-analysis-hub.js:95).
* Kachelgitter: immer vorhanden, unabhängig von Daten.

*Zählung F1: 17 Elemente.*

---

## F2 · `city-league` — City League Meta (Japan)

**Zweck:** Was in Japan gerade gespielt wird — Tier-Bänder, Auf-/Absteiger, Vergleichstabellen.

**Host:** `#cityLeagueContent`, gezeichnet von `js/app-city-league.js` (Info-Blöcke) und
`js/app-tier-meta.js:1164` (Tier-Abschnitte in `#cityLeagueTierSections`).

### Bedienelemente

| Nr. | Element | id / Aufruf | Werte |
|---|---|---|---|
| F2.1 | Hilfeknopf | `openTabHelp('city-league')` | |
| F2.2 | Datenstand-Chip | `data-quelle="city_league_archetypes.csv"` | |
| F2.3 | Format-Auswahl | `cityLeagueFormatSelect` → `switchCityLeagueFormat(v)` | `current` (Current Meta) / `past` (Past Meta) |
| F2.4 | Datenraum-Filterzeile | ds-filter.js | s. F0.34 |
| F2.5 | Suchfeld Vergleichstabelle | `cityLeagueSearchFilter` | filtert `#cityLeagueFullTable`, Trefferanzeige in `#cityLeagueSearchResults` |

### Abschnitte / Tabellen

| Nr. | Abschnitt | Spalten | sortierbar | Voreinstellung |
|---|---|---|---|---|
| F2.6 | Tier-Held-Kacheln (`section.tier-hero-section`) | Rangplakette, Name, „n Varianten", Plakette Deckzahl, Plakette „Ø-Rang" | nein | nach Anzahl |
| F2.7 | Tier-Abschnitte `tier-1` / `tier-2` / `tier-3` / `tier-trending` | Deckkacheln | nein | Tier 1 = Plätze 1–3, Tier 2 = 4–10, Tier 3 = 11–20, Rogue/Trending = Rest (app-tier-meta.js:826–838); Rogue-Block ist ein `<details>` |
| F2.8 | Karte „Archetype Overview" | Gesamtzahl, Top-3 nach Anzahl, Top-3 nach Ø-Platzierung | nein | |
| F2.9 | Karte „Top-10 Changes" | Ein-/Aussteiger der Top 10 | nein | Leerfall: `cl.noBaseline` bzw. `cl.noTop10Changes` |
| F2.10 | Karte „Data Source" | Zeitraum, Anzahl Turniere | nein | |
| F2.11 | Tabelle „Popularity Decreases" / „Seltener gespielt" | Archetype · Old Count · New Count · Change · Ø-Platzierung | nein | Top 10 der Rückgänge |
| F2.12 | Tabelle „Performance Improvers" | Archetype · Count · Ø-Platzierung | nein | |
| F2.13 | Tabelle „Performance Decliners" | Archetype · Count · Ø-Platzierung | nein | |
| F2.14 | Tabelle „Full Comparison Table (Top 30)" (`#cityLeagueFullTable`) | Deck · Count · Ø-Platzierung | nein | Top 30 |
| F2.15 | Tabelle „Archetype Combined" (`#cityLeagueCombinedTable`) | Main Pokémon · Varianten · Count · Ø-Platzierung | nein | |
| F2.16 | Fußzeile | „Generated <Datum>", „Total tracked <n>" | | |

### Klickpfade

* **F2.17** Tier-Held-Kachel → `analyzeCombinedArchetype(main, variants)` (app-tier-meta.js:911) →
  wechselt nach **`city-league-analysis`** und setzt dort `GROUP:<v1>|<v2>…` im Deck-Dropdown
  (app-core.js:1737–1760). Zurück: Pokéball / Nav-Leiste / Browser-Zurück.
* **F2.18** Archetyp-Zelle in F2.11–F2.15 → `jumpToCardAnalysis(name, 'cityLeague')` (app-core.js:1665)
  → `city-league-analysis`, Dropdown vorbelegt, Seite scrollt nach oben. Zurück: keine eigene Zurück-Taste.

### Kennzahlen

| Nr. | Name in der Oberfläche | Quelle |
|---|---|---|
| F2.19 | Count / New Count / Old Count | `city_league_archetypes.csv` |
| F2.20 | Change (`count_change`) | ebd. |
| F2.21 | Ø-Platzierung (`new_avg_placement`, gezeichnet von `_rang()`) | ebd. |
| F2.22 | Varianten-Anzahl je Held | app-tier-meta.js |

**Zustände:**
* Laden: `<div class="loading">Loading...</div>` (index.html:702), zusätzlich
  `showTableSkeleton(content, {rows:8, cols:5})` beim Formatwechsel (app-city-league.js:310).
* Saisonhinweis: `role="status"`-Block „📅 Season pause: …" (index.html:693–699). Per CSS
  (`css/city-league.css`, `.cl-season-notice`) standardmäßig `display:none`; eingeblendet nur über
  `setCitySeasonNotice(true)` (app-city-league.js:535–553), wenn die **aktuelle** Rotation keine
  City-League-Daten führt. Derselbe Block steht ein zweites Mal in `city-league-analysis`
  (index.html:721–727); beide werden gemeinsam geschaltet.
* Leerzustand ohne Vorzeitraum: `keinVorzeitraum` unterdrückt Ein-/Aussteigerlisten (app-city-league.js:1036).

*Zählung F2: 22 Elemente.*

---

## F3 · `city-league-analysis` — Deck Analysis (Japan)

**Zweck:** Ein japanisches Deck von innen: welche Karten drin sind, wie oft, und daraus ein eigener Bau.

### Kopf & Filter

| Nr. | Element | id / Aufruf | Werte |
|---|---|---|---|
| F3.1 | Hilfeknopf | `openTabHelp('city-league-analysis')` | |
| F3.2 | Datenstand-Chip | `data-quelle="city_league_analysis.csv"` | |
| F3.3 | Format-Auswahl | `cityLeagueFormatSelectAnalysis` → `switchCityLeagueFormat` | current / past — **spiegelt F2.3** (app-city-league.js:297–300) |
| F3.4 | Datum von | `cityLeagueDateFrom` → `applyCityLeagueDateFilter()` | `<input type=date>` |
| F3.5 | Datum bis | `cityLeagueDateTo` → `applyCityLeagueDateFilter()` | `<input type=date>` |
| F3.6 | Deck-Archetyp | `cityLeagueDeckSelect` | dynamisch befüllt; Voreinstellung „-- Please Select Deck --" |
| F3.7 | Card Share Filter | `cityLeagueFilterSelect` (Handler per `onchange` in JS, app-city-league.js:4828) | `all` / `90` / `70` / `50` |

### Deck-Statistik (`#cityLeagueStatsSection`)

| Nr. | Kennzahl | id | Definition daneben? |
|---|---|---|---|
| F3.8 | „Cards in deck (unique / avg. list)" | `cityLeagueStatCards` | nein |
| F3.9 | „Decks Used" | `cityLeagueStatDecksUsed` + Fußnote `cityLeagueStatDecksNote` (`hidden`) | Fußnote nur bedingt |
| F3.10 | „Avg Placement" | `cityLeagueStatAvgPlacement` | nein |

### Card Overview (`#cityLeagueCardsSection`)

| Nr. | Element | id / Aufruf |
|---|---|---|
| F3.11 | Zähler „n Karten / n Gesamt" | `cityLeagueCardCount`, `cityLeagueCardCountSummary` |
| F3.12 | Kartensuche | `cityLeagueOverviewSearch` → `filterOverviewCards()` |
| F3.13–F3.21 | 9 Typfilter | `overviewTypeAll/Pokemon/Supporter/Item/Tool/Stadium/Energy/SpecialEnergy/AceSpec` → `setOverviewCardTypeFilter(...)`; Voreinstellung „All" |
| F3.22–F3.24 | Seltenheit | `overviewRarityMin` (Voreinstellung, `btn-success`) / `overviewRarityMax` / `overviewRarityAll` → `setOverviewRarityMode(...)` |
| F3.25 | Copy Decklist | `copyDeckOverview()` — PTCGL/Limitless-Format |
| F3.26 | Grid/Table-Umschalter | `toggleDeckGridView()`, `data-view-toggle="grid"` — schaltet `#cityLeagueDeckTableView` ⇄ `#cityLeagueDeckVisual` |
| F3.27 | Karten-Legende | in dieser Ansicht **nicht** vorhanden (liegt nur in `current-analysis`, index.html:1345) — *zu prüfen: ob das gewollt ist* |

### Deck Builder (`#cityLeagueDeckBuilderSection`)

| Nr. | Element | Aufruf |
|---|---|---|
| F3.28 | Consistency Generate | `autoCompleteConsistency('cityLeague','min')` |
| F3.29 | ↑ Max Rarity | `toggleDeckRarity('cityLeague', this)` |
| F3.30 | Kennzahl „# n /60" | `cityLeagueDeckCount` |
| F3.31 | Kennzahl „♦ (n Unique)" | `cityLeagueDeckCountUnique` |
| F3.32 | Kennzahl „€ Preis" | `cityLeagueDeckPrice` (js/app-price.js) |
| F3.33 | Test Draw | `openDrawSimulator('cityLeague')` → Modal `#drawSimulatorModal` |
| F3.34 | TCG Showdown ↗ | `openInShowdownFromBuilder('cityLeague')` |
| F3.35 | Clear | `clearDeck('cityLeague')` |
| F3.36 | „How the consistency builder works" | `<details>` mit Gewichtungsregeln (Top-4 voll, Day-2 ≈30 %, Day-1 ≈10 %) |
| F3.37 | Handstatistik | `#cityLeagueHandStats` |

### Your Deck (`#cityLeagueMyDeckVisual`)

| Nr. | Element | Aufruf |
|---|---|---|
| F3.38 | Save | `saveCurrentDeckToProfile('cityLeague')` |
| F3.39 | Why? (Build Info) | `showConsistencyBuildInfo('cityLeague')` |
| F3.40 | Compare | `openDeckCompare('cityLeague')` → `#deckCompareModal` |
| F3.41 | Copy | `copyDeck('cityLeague')` |
| F3.42 | Deck → Proxy | `sendCurrentDeckToProxyPrinter('cityLeague')` — **Beschriftung im Markup „Deck ? Proxy"** |
| F3.43 | Share | `shareDeck('cityLeague')` |
| F3.44 | PTCGL Import | `importFromPTCGL('cityLeague')` |
| F3.45 | PTCGL Export | `exportToPTCGL('cityLeague')` |
| F3.46 | Grid | `generateDeckGrid('cityLeague')` |
| F3.47 | Deck-Suche mit Autovervollständigung | `cityLeagueDeckGridSearch` + `#cityLeagueDeckAutocomplete` |
| F3.48 | Bank | `#cityLeagueBenchSection` |

### Meta Card Analysis (Top 10 Archetypes)

| Nr. | Element | Aufruf |
|---|---|---|
| F3.49 | Zähler | `cityLeagueMetaCardCount` |
| F3.50–F3.53 | Anteilsfilter All / >90 % / >70 % / >50 % | `setMetaShareFilter('cityLeague', …)`, Voreinstellung All |
| F3.54–F3.57 | Typfilter All / Trainer / Pokémon / Energy | `setMetaCardTypeFilter('cityLeague', …)`, Voreinstellung All |
| F3.58–F3.60 | Sortierung: by Type (aktiv) / by Share% / by Avg Count | `sortMetaCards('cityLeague', …)` |
| F3.61 | Suche | `cityLeagueMetaSearch` → `filterMetaCards('cityLeague')` |
| F3.62 | Load Meta Analysis | `cityLeagueMetaReloadBtn` → `loadMetaCardAnalysis('cityLeague')`; benennt sich nach dem Laden in „Reload" um (app-meta-cards.js:731–738) |
| F3.63 | Leerzustand-Knopf | zweiter „Load Meta Analysis" im Leerzustand des Gitters |

### Tech vs Normal

| Nr. | Element | id |
|---|---|---|
| F3.64 | Abschnitt „Tech vs Normal" + Untertitel | `cityLeagueTechVsNormalSection` / `…Body` (app-deck-builder.js:484–520); zeigt Added / Cut / Count changes / Total consistency score / Δ vs Normal |

### Karten-Kacheln im Gitter (je Karte, gilt auch für F5)

| Nr. | Element | Bedeutung |
|---|---|---|
| F3.65 | Rote Plakette | Max-Anzahl in einer einzelnen Liste |
| F3.66 | Grüne Plakette | Kopien in deinem Deck |
| F3.67 | Wunschzettel-Herz | Karte auf die Wunschliste |
| F3.68 | Bernstein-Plakette | andere Prints im Besitz |
| F3.69 | Set + Inklusionsrate | „SET 123 · 100 %" |
| F3.70 | Ø-Anzahl | „Ø 3,2x (2,8x)" — nur spielende Decks / alle Decks |
| F3.71 | Deck-Verbreitung | „87/100 (87 %)" |
| F3.72 | − / + / ★ | Kopie weg / dazu / Print & Seltenheit wechseln (`#raritySwitcherModal`) |
| F3.73 | L / P / Preis | Limitless öffnen / Proxy / Cardmarket |
| F3.74 | 📌 / 🚫 | nur im Cooking Mode: Pin / Exclude |

**Zustände:**
* Leerzustand „Wähle ein Deck": Statistik/Karten/Builder sind `d-none` und werden erst durch den
  MutationObserver in index.html:947–958 eingeblendet, sobald `#cityLeagueStatsSection` sichtbar wird.
* Leeres Deck: `.deck-builder-empty-state` „Your deck is empty" + zwei Knöpfe (Generate / Test Draw).
* Meta-Gitter ungeladen: „Meta analysis not loaded yet" + Knopf.
* Fehler: kein eigener Fehlerzustand sichtbar; Warnungen nur in der Konsole (app-city-league.js:4725).

*Zählung F3: 74 Elemente.*

---

## F4 · `current-analysis` — Deck Analysis (Global)

**Zweck:** Ein globales Deck von innen — Karten, Anteile, Win Rate, Matchups, Bau, Tech-Suche.

### Ansichtsmodus

| Nr. | Element | id |
|---|---|---|
| F4.1 | „Quick overview" (Voreinstellung) | `cmViewModeVanillaBtn` → `setCurrentMetaViewMode('vanilla')` |
| F4.2 | „Deep Dive" | `cmViewModeDeepDiveBtn` → `setCurrentMetaViewMode('deepDive')` |

Der Modus setzt `data-cm-view` am Reiter; alles mit `.cm-deep-dive-only` ist nur im Deep Dive sichtbar
(app-current-meta-analysis.js:1393–1420). **Session-flüchtig:** jeder Seitenneuladen startet in „vanilla".

### Filter

| Nr. | Element | id / Aufruf | Werte |
|---|---|---|---|
| F4.3–F4.5 | Turnierformat: All / Limitless Decks / Major Tournament Decks | `currentMetaFilterAll/Live/Play` → `setCurrentMetaFormatFilter(...)` | Voreinstellung „All" |
| F4.6 | Statusanzeige zum Filter | `currentMetaFilterStatus` | |
| F4.7 | Datenfenster ab | `currentMetaDateFrom` → `setCurrentMetaDateFrom(v)` | `<input type=date>`; **derselbe Zustand wie `#metacallDateFrom` in F5** |
| F4.8 | Clear | `currentMetaDateClear` → `clearCurrentMetaDateFrom()` | |
| F4.9 | Statusanzeige zum Datum | `currentMetaDateStatus` | |
| F4.10 | Deck-Archetyp | `currentMetaDeckSelect` | |
| F4.11 | „+ Fuse with archetype (Cooking)" | `currentMetaDeckSelectSecondary` — nur Deep Dive | Voreinstellung „-- None (single deck) --" |
| F4.12 | Card Share Filter | `currentMetaFilterSelect` | all / 90 / 70 / 50 |

### Kopfblöcke

| Nr. | Element | id |
|---|---|---|
| F4.13 | Leerzustand „Wähle ein Deck-Archetype…" | `currentAnalysisEmptyState` |
| F4.14 | Archetyp-Karte | `currentMetaArchetypeCard` (js/app-archetype-card.js) |

**F4.15–F4.18 Kacheln der Archetyp-Karte** (`tilesHtml`, app-archetype-card.js:613–830), je zweigeteilt
online | Major:

| Nr. | Anzeigename | Rechnung | Erklärung |
|---|---|---|---|
| F4.15 | „Anteil" | `d.share` %, rechts `d.count` (Listen) bzw. Major-Antritte | Nenner im `title`-Hinweis, nicht auf der Fläche |
| F4.16 | „Win Rate" | Siege / alle Partien, beide Seiten gleich | `title` erklärt Remisquote-Unterschied und ±KI |
| F4.17 | „Top-8-Quote (online)" | `top8 / brought` roh, daneben „Schnitt aller Decks X %" | `title` |
| F4.18 | „Day-2-Quote (Major)" | `m.day2Quote`, daneben Feldschnitt | `title` |

Leerfall je Kachel: „–" mit „keine Daten" / „zu wenig Daten" / „kein Major".

### Deck-Statistik (`#currentMetaStatsSection`)

| Nr. | Kennzahl | id | Rechnung | Definition daneben? |
|---|---|---|---|---|
| F4.19 | „Cards in deck (unique / avg. list)" | `currentMetaStatCards` | app-current-meta-analysis.js:1996 | nein |
| F4.20 | „Total Win Rate Limitless Online Tournaments" | `currentMetaStatWinrate` | `win_rate_numeric` aus `limitless_online_decks.csv` (a-c-m-a.js:1946–1952) | nein |
| F4.21 | „Matchup vs Top 20" | `currentMetaStatMatchup` | gewichtetes Mittel der Matchups gegen Decks mit `rank ≤ 20`, Format „54,12 % (17 MU)" (a-c-m-a.js:1955–1993) | nein |
| F4.22 | „Used in Top 256" | `currentMetaTop256Section` / `…List` | | |

### Matchups (nur Deep Dive, `#currentMetaMatchupsSection`)

| Nr. | Element | Spalten | sortierbar |
|---|---|---|---|
| F4.23 | Tabelle „Best Matchups" (`#currentMetaBestMatchups`) | Opponent · Win Rate · Record | nein |
| F4.24 | Tabelle „Worst Matchups" (`#currentMetaWorstMatchups`) | Opponent · Win Rate · Record | nein |
| F4.25 | Gegnersuche | `currentMetaOpponentSearch` → `filterCurrentMetaOpponents(this)`, Dropdown `#currentMetaOpponentDropdown`, Auswahl in `#currentMetaOpponentSelected` |
| F4.26 | Matchup-Detail | `#currentMetaMatchupDetails` |

Leerzustand beider Tabellen: eine Zeile „No data available" über `colspan=3`.

### Matchups vs Meta Call (nur Deep Dive)

| Nr. | Element | Spalten |
|---|---|---|
| F4.27 | Tabelle `#currentMetaVsMetaCallBody` | Opponent · Field % · Win Rate — nicht sortierbar |
| F4.28 | Zusammenfassung | `#currentMetaVsMetaCallSummary` |
| F4.29 | Legende der Farbstufen | ≥60 % stark gut · 53–60 gut · 47–53 neutral · 40–47 schlecht · <40 stark schlecht |

### Your Build vs Vanilla (nur Deep Dive)

| Nr. | Element | Spalten |
|---|---|---|
| F4.30 | Tabelle `#currentMetaUserVsVanillaOpponentBody` | Opponent · Field % · Vanilla · Your Build · Delta — nicht sortierbar |
| F4.31 | Zusammenfassung / Detail | `#currentMetaUserVsVanillaSummary`, `…Detail` |
| F4.32 | Erkannte Techs | `#currentMetaUserVsVanillaDetectedTech` |
| F4.33 | Kartendiff | `#currentMetaUserVsVanillaCardDiff` |

### Card Overview (`#currentMetaCardsSection`)

| Nr. | Element | id / Aufruf |
|---|---|---|
| F4.34 | Zähler | `currentMetaCardCount` + `currentMetaCardCountSummary` |
| F4.35 | Suche | `currentMetaOverviewSearch` → `filterCurrentMetaOverviewCards()` |
| F4.36–F4.44 | 9 Typfilter | `currentMetaOverviewType…` → `setCurrentMetaOverviewCardTypeFilter(...)` |
| F4.45–F4.47 | Seltenheit min/max/all | `setCurrentMetaOverviewRarityMode(...)` |
| F4.48 | Copy | `copyCurrentMetaDeckOverview()` |
| F4.49 | Grid | `toggleCurrentMetaDeckGridView()` |
| F4.50 | Karten-Legende `<details>` „Was bedeuten die Symbole auf den Karten?" | index.html:1345–1425, erklärt A–K (identisch mit F3.65–F3.74) |

### Deck Builder (`#currentMetaDeckBuilderSection`)

| Nr. | Element | Aufruf |
|---|---|---|
| F4.51 | Consistency Generate | `autoCompleteConsistency('currentMeta','min')` |
| F4.52 | „Build vs …" (Deep Dive) | `openAntiTechModal('currentMeta')` → `#antiTechModal` |
| F4.53 | ↑ Max Rarity | `toggleDeckRarity('currentMeta', this)` |
| F4.54–F4.56 | Kennzahlen #/60, ♦ Unique, € Preis | `currentMetaDeckCount`, `…Unique`, `…Price` |
| F4.57 | Test Draw | `openDrawSimulator('currentMeta')` |
| F4.58 | TCG Showdown ↗ | `openInShowdownFromBuilder('currentMeta')` |
| F4.59 | Clear | `currentMetaClearDeckBtn` |
| F4.60 | Algorithmus-Hinweis `<details>` | |
| F4.61 | Tech-Slots-Zeile (Deep Dive) | Zähler `currentMetaTechSlotsCount` „0/10", Gitter `…Grid`, Picker `…Picker` + `…Input` (`techSlotSearch`) |
| F4.62 | Tech-Slots leeren | `clearTechSlots('currentMeta')` |
| F4.63 | Handstatistik | `#currentMetaHandStats` |
| F4.64–F4.73 | Your Deck: Save · Why? · Compare · Copy · Deck→Proxy · Share · PTCGL Import · PTCGL Export · Grid · Suche+Autocomplete | analog F3.38–F3.47, Quelle `currentMeta` |
| F4.74 | Bank | `#currentMetaBenchSection` |

### Meta Card Analysis (`currentMeta`)

| Nr. | Element |
|---|---|
| F4.75–F4.78 | Anteilsfilter All / >90 / >70 / >50 |
| F4.79–F4.82 | Typfilter All / Trainer / Pokémon / Energy |
| F4.83–F4.85 | Sortierung by Type (aktiv) / by Share% / by Avg Count |
| F4.86 | Suche `currentMetaMetaSearch` |
| F4.87 | Knopf „Load Meta Analysis" (index.html:1661, **ohne id**) |
| F4.88 | Leerzustand „Meta analysis loading" + Knopf |

### Tech vs Normal / Quick Reference

| Nr. | Element | id |
|---|---|---|
| F4.89 | Tech vs Normal | `currentMetaTechVsNormalSection` |
| F4.90 | Quick Reference Lists | `currentMetaQuickRefSection`, zwei Spalten: „Latest Major · Best Placement" (`…MajorBody`) und „Latest Online · Typical Build" (`…OnlineBody`) |
| F4.91 | 3-way Compare | `openThreeWayCompare()` → Modal `#threeWayCompareModal` (Builder · Major · Online), schließen über `closeThreeWayCompare()` oder Klick auf den Hintergrund |

### Tech Lab (`#techLabSection`, nur Deep Dive, immer sichtbar auch ohne Deck)

| Nr. | Element | id |
|---|---|---|
| F4.92 | Hilfeknopf | `openTabHelp('tech-lab')` |
| F4.93 | Zielkarten-Suche | `techLabTargetSearch` + Dropdown `techLabTargetDropdown` |
| F4.94 | Vorschau + Name | `techLabTargetThumb`, `techLabTargetLabel` |
| F4.95 | Reset overrides | `techLabResetBtn` (startet `disabled`) |
| F4.96 | Starthinweis | `techLabStartHint` |
| F4.97 | Abschnitt „Beaten by" | `techLabBeatenByList`, `…Summary`, `…NonEx` |
| F4.98 | „+ Add missing" (Beaten by) | `techLabAddBeatenByBtn` (startet `disabled`) |
| F4.99 | Abschnitt „Good against" | `techLabBeatsList`, `…Summary` |
| F4.100 | „+ Add missing" (Beats) | `techLabAddBeatsBtn` |
| F4.101 | Modal „Add a tech the engine missed" | `techLabAddOverlay` + `techLabAddSearch` |

**Zustände:**
* Ohne Auswahl: `#currentAnalysisEmptyState` sichtbar, alles andere `d-none`.
* Sichtbarkeit von Karten/Builder folgt `#currentMetaStatsSection` per MutationObserver (index.html:977–988).
* Kein sichtbarer Fehlerzustand für fehlende CSVs.

*Zählung F4: 101 Elemente.*

---

## F5 · `meta-call` — Meta Call

**Zweck:** Sagt das Feld des nächsten Turniers voraus und leitet daraus eine Deck-Empfehlung ab.

**Host:** `#metaCallHost`, gezeichnet von `js/app-meta-call.js` (`renderAll`, ab Zeile 10411).

| Nr. | Element | id / Aufruf |
|---|---|---|
| F5.1 | Zurück-Knopf „← Startseite" | `switchTabAndUpdateMenu('current-meta')` (index.html:2071) |
| F5.2 | Hilfeknopf | `openTabHelp('meta-call')` |
| F5.3 | Szenarien-Auswahl | `.mc-scenarios-select` → `MetaCall._onScenarioSelect(v)` |
| F5.4 | Szenario auffrischen | `MetaCall._refreshScenario()` |
| F5.5 | Szenario speichern | `MetaCall._saveScenario()` |
| F5.6 | Szenario löschen | `MetaCall._deleteScenario()` |
| F5.7 | Datenfenster ab | `metacallDateFrom` → `setCurrentMetaDateFrom(v)` — **derselbe Zustand wie F4.7** |
| F5.8 | Clear (Datum) | `clearCurrentMetaDateFrom()` |
| F5.9 | Hinweistext zum Fenster | `mc.dateWindowActive/Auto/None` |
| F5.10 | Meta-Quelle | `.mc-source-format-select` → `MetaCall._setMetaSource('past', v)` |
| F5.11 | City-League-Quellen | zwei Checkboxen (`current` / `past`) |
| F5.12 | Top-Cut-Größe | `mc-topcut` → `_onSetting('topCutSize', n)` |
| F5.13 | Spielerzahl | `mc-players` (`number`, 2–9999) |
| F5.14 | Runden | `mc-rounds` (`select` oder `number` 1–15) |
| F5.15 | Day-2-Punkte | `mc-day2pts` (`number`, 1–45) |
| F5.16 | Turniername | `mc-turniername` (Text, max 60) |
| F5.17 | Turnierbild erzeugen | `MetaCall.generateTournamentImage()` |
| F5.18 | Modus-Reiter (`.mc-tt-tab`) | mehrere Gruppen, app-meta-call.js:9570/9682/9723 — *zu prüfen: welche Reiter genau sichtbar sind* |

### Feldtabelle (`renderFieldPanel`, app-meta-call.js:10086–10160)

| Nr. | Element | Spalten / Werte |
|---|---|---|
| F5.19 | Tabellenkopf | Deck · **Online** · **Personal** (Schätzfeld) · **Final** · **Players** · **Ø-Begegnungen (n R.)** — jede Spalte mit `title`-Erklärung |
| F5.20 | Schätzfeld je Zeile | `<input type=number min=0 max=100 step=0.1>` |
| F5.21 | Zeile aufklappen | `.mc-row-toggle` |
| F5.22 | „Alle Details" | `MetaCall._toggleAllDetails()` |
| F5.23 | „Feld gruppieren" | `MetaCall._toggleGroupField()` |
| F5.24 | Feld als Bild teilen | `MetaCall.exportFieldShareImage()` |

### Eigene Decks / Mein Deck

| Nr. | Element |
|---|---|
| F5.25 | Eigenes Deck hinzufügen | `.mc-custom-add-btn` → `MetaCall._addCustomDeck()` |
| F5.26 | Name (mit `datalist` `mc-custom-datalist`) + Anteil (`number` 0–100) + Entfernen (`.mc-custom-remove-btn`) |
| F5.27 | Mein Deck | `mc-my-deck` (Textfeld mit `datalist`) |
| F5.28 | Overrides ein/aus | `mc-override-btn` → `MetaCall._toggleOverrides()` |
| F5.29 | Brick-Filter | `.mc-brick-filter-select` → `_onBrickFilter(v)` |
| F5.30 | Win-Rate-Override je Gegner | `<input type=number 0–100>` |

### Ergebnisse & Empfehlungen

| Nr. | Element |
|---|---|
| F5.31 | Day-2-Bild teilen | `MetaCall.exportDay2ShareImage()` |
| F5.32 | Empfehlungstabelle mit Spalte „Why?" (`.mc-rec-toggle-th`) und Sprung zur Begründung (`.mc-rec-reason-jump`) |
| F5.33 | Feld+Empfehlungen als Bild | `MetaCall.exportFieldAndRecsShareImage()` |
| F5.34 | Mobile Detailschalter | `.mc-mobile-detail-toggle` |

### Eingefrorenes vergangenes Meta (`_inFrozenPastMode`, app-meta-call.js:10508)

| Nr. | Element |
|---|---|
| F5.35 | Frozen-Banner statt Konfiguration |
| F5.36 | Frozen-Anteilstabelle |
| F5.37 | Frozen-Empfehlungstabelle mit Spalten „Score" und „Win %" (je mit `title`) |

**Zustände:** Der große Statusstreifen (`_renderPredictorStatusBanner`) ist bewusst abgeschaltet
(app-meta-call.js:10473–10486); der kleine `renderPredictorBanner()` läuft. Bei eingefrorenem Past-Meta
entfallen Custom Decks / My Deck / Results vollständig.

*Zählung F5: 37 Elemente.*

---

## F6 · `cards` — Card Database

**Zweck:** Jede Karte suchen und filtern; Einstieg in Sammlung, Wunschliste und Proxy.

| Nr. | Element | id / Aufruf | Werte |
|---|---|---|---|
| F6.1 | Hilfeknopf | `openTabHelp('cards')` | |
| F6.2 | Datenstand-Chip | im `<h2>` | |
| F6.3 | Kartensuche mit Autovervollständigung | `cardSearch` + `#cardSearchAutocomplete` | |
| F6.4 | Filterpanel ein/aus | `cardsFiltersToggle` → `toggleCardsFilterPanel()`, `aria-expanded="true"` | |
| F6.5 | Filter „Meta / Format" | `#filter-meta-format` → Radios `baseMetaFilter` | `total` (Voreinstellung) / `all_playables` / `city_league` |
| F6.6 | Filter „Set" | `#setFilterOptions` | dynamisch |
| F6.7 | Filter „Rarity" | `#rarityFilterOptions` | dynamisch |
| F6.8 | Filter „Category" | `#categoryFilterOptions` | dynamisch |
| F6.9 | Filter „Element Type" | `#elementTypeFilterOptions` | dynamisch |
| F6.10 | Filter „Main Pokemon" | `#mainPokemonList` + Suchfeld `mainPokemonSearch` | dynamisch |
| F6.11 | Filter „Archetype" | `#archetypeList` + Suchfeld `archetypeSearch` | dynamisch |
| F6.12 | Filter „Deck Coverage" | `#deckCoverageFilterOptions` | dynamisch |
| F6.13 | Reset Filters | `resetCardFilters()` | |
| F6.14 | Sortierung | `cardSortOrder` → `filterAndRenderCards()` | `set` (Voreinstellung) / `deck` / `coverage` / `pokedex` |
| F6.15 | Standard Print | `btnStandardPrint` → `setPrintView(true)` | aktiv beim Start |
| F6.16 | All Prints | `btnAllPrints` → `setPrintView(false)` | |
| F6.17 | Trefferanzeige | `cardResultsInfo` | Start: „Loading cards…" |
| F6.18 | Kartengitter | `cardsContent` | |

Alle acht Filtergruppen starten **eingeklappt** (`collapsed`, `aria-expanded="false"`) und öffnen per Klick
oder Enter/Leertaste (app-cards-db.js:172–180).

**Zustände:** Ladezustand = Skelettkacheln in `#cardsContent` (index.html:2154) + Text „Loading cards…".
Leer-/Fehlerzustand: *zu prüfen: was `filterAndRenderCards()` bei 0 Treffern zeigt.*

*Zählung F6: 18 Elemente.*

---

## F7 · `proxy` — Proxy Printer

**Zweck:** Karten zum Ausdrucken sammeln und die Warteschlange drucken.

| Nr. | Element | id / Aufruf |
|---|---|---|
| F7.1 | Zurück „← Startseite" | `switchTabAndUpdateMenu('current-meta')` |
| F7.2 | Hilfeknopf | `openTabHelp('proxy')` |
| F7.3 | Decklisten-Eingabe | `proxyDecklistInput` (`textarea`) |
| F7.4 | Add Decklist to Queue | `proxyImportDecklistBtn` → `importDecklistToProxy()` |
| F7.5 | Kartenname | `proxyManualName` (+ `datalist` `proxyManualNameSuggestions`, app-core.js:382) |
| F7.6 | Set | `proxyManualSet` |
| F7.7 | Nummer | `proxyManualNumber` |
| F7.8 | Anzahl | `proxyManualCount` (`number`, min 1, Vorgabe 1) |
| F7.9 | Add Card | `proxyAddManualCardBtn` → `addManualProxyCard()` |
| F7.10 | Aus Binder laden | `proxyLoadBinderBtn` → `cbLoadBinderIntoProxy()` |
| F7.11 | Add City League Deck | `proxyAddCityLeagueDeckBtn` → `addCurrentDeckToProxy('cityLeague')` |
| F7.12 | Add Current Meta Deck | `proxyAddCurrentMetaDeckBtn` → `addCurrentDeckToProxy('currentMeta')` |
| F7.13 | Add Past Meta Deck | `proxyAddPastMetaDeckBtn` → `addCurrentDeckToProxy('pastMeta')` |
| F7.14 | Print Queue | `proxyPrintQueueBtn` → `printProxyQueue()` |
| F7.15 | Clear Queue | `proxyClearQueueBtn` → `clearProxyQueue()` |
| F7.16 | Warteschlange | `proxyQueueList` |

**Zustände:** Leerzustand „Proxy queue is empty" mit Knopf, der den Fokus in `#proxyDecklistInput` setzt.

*Zählung F7: 16 Elemente.*

---

## F8 · `tutorial` — How to Use

**Zweck:** Anleitung.

| Nr. | Element |
|---|---|
| F8.1 | Zurück „← Startseite" |
| F8.2 | Hilfeknopf `openTabHelp('tutorial')` |
| F8.3 | Link „Anleitung (deutsch)" → `tutorial/tutorial.de.html` |
| F8.4 | Link „Guide (english)" → `tutorial/tutorial.en.html` |
| F8.5 | Restlicher Inhalt aus `js/ds-tutorial.js` — *zu prüfen: was dieses Modul in den Reiter zeichnet* |

*Zählung F8: 5 Elemente.*

---

## F9 · `quellen` — Quellen & Methodik

**Zweck:** Woher jede Zahl kommt, was jeder Begriff bedeutet, wie oft aktualisiert wird, Rechtliches.

**Host:** `#quellenHost`, gezeichnet von `js/app-quellen.js:395`.

| Nr. | Element | Abschnitts-id | Startzustand |
|---|---|---|---|
| F9.1 | Zurück „← Startseite" | `quellenZurueck` | |
| F9.2 | Abschnitt „Quellen" | `quellen` | **offen** |
| F9.3 | Abschnitt „Datenumfang" | `umfang` | zu |
| F9.4 | Abschnitt „Begriffe" | `begriffe` | zu |
| F9.5 | Abschnitt „Zuverlässigkeit" | `zuverlaessig` | zu |
| F9.6 | Abschnitt „Trennung der Datenräume" | `trennung` | zu |
| F9.7 | Abschnitt „Stand / Aktualisierung" | `stand` | zu |
| F9.8 | Abschnitt „Rechtliches" | `rechtliches` | zu |

**F9.9–F9.14 Begriffsdefinitionen** (app-quellen.js:96–170) — hier stehen die Definitionen, auf die die
Verweise „Wie das gerechnet ist →" / „Nenner und Rechenweg →" aus F1 und F15 zeigen:
Anteil · Antritt (gewichtet) · Top-8-Quote · ggü. Schnitt (geglättet vs. roh) · Win Rate (Remis im Nenner,
nicht als halber Sieg) · Tier-Einordnung.

**F9.15 Datenumfang zur Laufzeit** — `js/ds-datenumfang.js` ergänzt gezählte Zeilen der geladenen Dateien.

**Zustände:** *zu prüfen: ob es einen Ladezustand gibt; `render()` zeichnet aus einer festen Textstruktur,
`ds-datenumfang.js` liefert nach.*

*Zählung F9: 15 Elemente.*

---

## F10 · `admin` — Datenlücken

**Zweck:** Zeigt alles, was die Seite über sich selbst nicht weiß, mit Vorschlag und Quelle;
„Bestätigen" öffnet ein vorbefülltes GitHub-Issue.

**Erreichbar:** nur über `#admin` / `#datenluecken`. Kein Zugangsschutz — die Seite sagt das selbst.

| Nr. | Element | Datei |
|---|---|---|
| F10.1 | Zurück „← Startseite" | `adminZurueck` |
| F10.2 | Titel „Datenlücken" | `adminTitel` |
| F10.3 | Einleitung + Hinweis „nicht zugangsgeschützt" | app-admin.js:81, 102 |
| F10.4 | Filterchip „Alle **n**" | app-admin.js:337 |
| F10.5 | Filterchips je Klasse (aus `_meta.jeKlasse`) | app-admin.js:341 |
| F10.6 | Lückenkarte: Titel, „Steht in <code>", Notiz | `karteHtml`, app-admin.js:259 |
| F10.7 | Einstufungs-Plakette | `eindeutig belegt` / `Bestätigung nötig` / `ungeprüft` |
| F10.8 | Vorschlag: Wert + Begründung + Fähigkeiten der Grundform | |
| F10.9 | Knopf „Quelle ansehen ↗" | öffnet `v.quelle` in neuem Reiter |
| F10.10 | Knopf „Bestätigen & senden ↗" | `issueUrl(l)` |
| F10.11 | Sammelknopf „Alle n Vorschläge auf einmal bestätigen ↗" (bzw. „n von g") | `issueUrlSammel`, nur ab 2 Vorschlägen; Adresslänge auf 6000 Zeichen gedeckelt (`MAX_ADRESSE`) |
| F10.12 | Fußblock „Wie es weitergeht" + „Inventar erzeugt <Zeit> UTC" | |

**Zustände:**
* Laden: „Lädt …" (app-admin.js:317).
* Leer: „Keine offene Lücke." + „Das Inventar ist leer — jede geprüfte Stelle trägt einen belegten Wert."
* Fehler: „Das Lücken-Inventar konnte nicht geladen werden." + „data/datenluecken.json fehlt oder ist
  unlesbar. Erzeugen mit: python3 scripts/datenluecken.py"

*Zählung F10: 12 Elemente.*

---

## F11 · `side-quest` — Side Quest: Pokémon Champions

**Zweck:** Top-Doubles-Teams aus Pokémon Champions mit Replica-Codes, Nutzungszahlen, Matchups,
Pokédex und Team-Builder. Anderes Spiel, bewusst getrennt vom TCG.

| Nr. | Element | id / Attribut |
|---|---|---|
| F11.1 | Zurück „← Startseite" | |
| F11.2 | Statuszeile | `sideQuestStatus` (`aria-live="polite"`) |

**F11.3–F11.9 Unterreiter** (`.side-quest-subtab`, `role="tab"`, index.html:2308–2321):

| Nr. | Beschriftung | `data-sq-view` | Host | Modul |
|---|---|---|---|---|
| F11.3 | Teams (aktiv) | `teams` | `sideQuestTeamsHost` | app-side-quest.js |
| F11.4 | Usage | `usage` | `sideQuestUsageHost` | app-side-quest-usage.js |
| F11.5 | Matchups | `matchups` | `sideQuestMatchupsHost` | app-side-quest-matchups.js |
| F11.6 | Pokémon | `pokedex` | `sideQuestPokedexHost` | app-side-quest-pokedex.js |
| F11.7 | Team-Builder | `builder` | `sideQuestBuilderHost` | app-side-quest-builder.js |
| F11.8 | Status | `status` | `sideQuestZustaendeHost` | app-side-quest-status.js |
| F11.9 | Look up | `resources` | `sideQuestResourcesHost` | app-side-quest-resources.js |

Alle Hosts außer Teams starten `hidden`.

### Teams (F11.10–F11.20)

| Nr. | Element | Klasse |
|---|---|---|
| F11.10 | Replica-Code kopieren | `.side-quest-copy-btn` |
| F11.11 | Eigenen Code kopieren | `.side-quest-copyown-btn` |
| F11.12 | Export-Auswahl: Copy / Limitless / Showdown | `.side-quest-export-choice` mit `sq-target-copy` / `-limitless` / `-showdown` |
| F11.13 | Export öffnen | `.side-quest-export-btn` |
| F11.14 | Team importieren | `.side-quest-import-open`, `-name`, `-do`, `-cancel` |
| F11.15 | Aktives Team setzen | `.side-quest-active-btn` |
| F11.16 | Markierung (mark) | `.side-quest-mark-btn` |
| F11.17 | Filter setzen / entfernen / leeren | `.side-quest-filter-trigger`, `-remove`, `-clear` |
| F11.18 | Info | `.side-quest-info-btn` |
| F11.19 | Claude-Knopf | `.side-quest-claude-btn` — *zu prüfen: was er tut* |
| F11.20 | Modal schließen | `.side-quest-modal-close` |

### Usage (F11.21–F11.22)

| Nr. | Element |
|---|---|
| F11.21 | Formatwahl `data-sq-format` — Voreinstellung `doubles` (app-side-quest-usage.js:31) |
| F11.22 | Typfilter `data-sq-type` — Voreinstellung leer (alle) |

### Matchups (F11.23–F11.28)

| Nr. | Element |
|---|---|
| F11.23 | Formatwahl `data-sq-format` |
| F11.24 | Sortierung (`_sort`) |
| F11.25 | Suche `.sq-search` |
| F11.26 | Team-Chips setzen/entfernen (`.sq-team-chip`, `.sq-team-chip-weg`) |
| F11.27 | Kreuztabelle: Kopfspalte = Gegner-Pokémon (`<th scope=col>`), Zeilenkopf = eigenes Pokémon (`<th scope=row>`) — nicht sortierbar |
| F11.28 | „Mehr" / „Zurück" | `.sq-more`, `.sq-back` |

### Pokédex (F11.29–F11.35)

| Nr. | Element |
|---|---|
| F11.29 | Formatumschalter Singles/Doubles (`data-tfmt`), Voreinstellung `doubles` |
| F11.30 | Suche `sqpSearch` |
| F11.31 | Typfilter `sqpType` |
| F11.32 | Presets `data-sqp-preset` |
| F11.33 | **Sortierbare Tabelle** (`data-sqp-sort`, `role="button"`): Mon · HP · Atk · Def · SpA · SpD · Spe · Total — Voreinstellung `total`, absteigend (app-side-quest-pokedex.js:34, 591–601) |
| F11.34 | Detailansicht mit Tabelle Base True · Lv50 · Used · Range |
| F11.35 | Detail schließen | `.sqp-d-close` |

### Team-Builder (F11.36–F11.44)

Slots je Pokémon: Name/Suche (`.sqb-search`, `.sqb-name`), Fähigkeit (`.sqb-ability`), Item (`.sqb-item`),
Attacken (`.sqb-move`), Wesen (`.sqb-nature`); dazu Chips, Rechner (`.sqb-rechner`), Setzen (`.sqb-setzen`),
Speichern (`.sqb-do-save`), Als aktiv (`.sqb-do-active`), Bearbeiten (`.sqb-edit`), Zurücksetzen
(`.sqb-reset`), Leeren (`.sqb-clear`), Export (`.sqb-exp`), Zurück (`.sqb-back`), Modal schließen
(`.sqb-modal-x`).

### Status (F11.45) · Look up (F11.46–F11.48)

| Nr. | Element |
|---|---|
| F11.45 | Statuszustände: Kopfzeile aufklappbar (`.sz-kopf`, `data-sz-id`), „Alle" (`.sz-alle`) |
| F11.46 | Suche `sqResSearch` |
| F11.47 | Filterchips `data-sq-res-filter` |
| F11.48 | „Nur Champions" | `.sq-res-champ` |

**Zustände:** `#sideQuestStatus` ist die gemeinsame Melderfläche. Einzelne Module melden Leerzustände
selbst — *zu prüfen: je Unterreiter, was bei fehlender Datei erscheint.*

*Zählung F11: 48 Elemente.*

---

## F12 · `pocket` — Side Quest: TCG Pocket

**Zweck:** Game8-Tier-Liste für TCG Pocket; ein Deck antippen zeigt ein 2D-Muster, das ein zweites Gerät scannt.

**Host:** `#pocketListe` (`aria-live="polite"`), Overlay `#pocketOverlay`. Modul: `js/ds-pocket.js`.

| Nr. | Element | Datei |
|---|---|---|
| F12.1 | Zurück „← Startseite" | index.html:2335 |
| F12.2 | Kopf: Titel + Untertitel | ds-pocket.js:114–126 |
| F12.3 | Quellenzeile „Einstufung von Game8, keine von uns gemessene Zahl" + Link game8.co + „Stand …" | ds-pocket.js:128–136 |
| F12.4 | Alterswarnung ab `PLAUSIBEL_TAGE` Tagen ohne Auffrischung | ds-pocket.js:138–144 |
| F12.5 | Filter „Alle" (Voreinstellung) | `data-pk-filter="alle"` |
| F12.6 | Filter „Tier-Liste" | `data-pk-filter="tier"` |
| F12.7 | Filter „Neues Set" | `data-pk-filter="set"` |
| F12.8 | Deckzeile | `.pk-zeile`, `data-pk-deck="<i>"` → öffnet das Overlay |
| F12.9 | Tier-Gruppierung nach `TIER_ORDNUNG`, innerhalb alphabetisch | ds-pocket.js:176–215 |
| F12.10 | Abweichende Stufen (zusammengelegte Dubletten) werden markiert | ds-pocket.js:96–107 |
| F12.11 | Rechnungsblock „n Einträge bei Game8 — n ohne lesbares Muster, n als Dublette zusammengelegt" + Liste der fehlenden Decks | ds-pocket.js:265–285 |
| F12.12 | Overlay: Schließen `.pk-schliessen` (`data-pk-zu`) | ds-pocket.js:361 |
| F12.13 | Overlay: Name (role=heading), „Stufe X · Game8 · Stand …" | |
| F12.14 | Overlay: 2D-Muster (`window.qrSvg.svg`) | js/qr-svg.js |
| F12.15 | Overlay: Hinweis „Bildschirm hell stellen und in Pocket abscannen." | |
| F12.16 | Overlay: Kartenliste Pokémon / Trainer mit Stückzahl und SET-Nr. | `kartenliste()` |
| F12.17 | Bildschirm-Wachhalten (`navigator.wakeLock`) während des Overlays | ds-pocket.js:288–300 |

**Zustände:**
* Laden: „Lädt…" / „Loading…"
* Leer (Liste vorhanden, aber 0 Decks): „Die Tier-Liste ist leer."
* Leer (Filter trifft nichts): „Für diese Auswahl steht kein Deck in der Liste."
* Fehler beim Laden: „Die Tier-Liste konnte nicht geladen werden. Bist du gerade offline?" (`is-fehler`)
* Muster nicht zeichenbar: Fehlerkasten + Code als markierbarer Text (ds-pocket.js:352–358)
* Deck ohne Kartenliste: `karten_hinweis` als Grund, sonst nichts (ds-pocket.js:311–318)

*Zählung F12: 17 Elemente.*

---

## F13 · `calculator` — TCG Probability Calculator

**Zweck:** Wahrscheinlichkeit, eine bestimmte Karte in Starthand, Preiskarten oder im Topdeck zu haben.

| Nr. | Element | id | Werte |
|---|---|---|---|
| F13.1 | Zurück „← Startseite" | | |
| F13.2 | Hilfeknopf | `openTabHelp('calculator')` | |
| F13.3 | Cards in Deck | `calc-deck-size` | `number`, min 1, max 99, Vorgabe 60; JS klemmt auf 1–99 |
| F13.4 | Copies in Deck | `calc-copies` | `number`, min 1, **max 60 im Markup**, JS klemmt auf 1–`deckSize` |
| F13.5 | Cards Drawn | `calc-drawn` | `number`, min 1, max 60, Vorgabe 7; JS klemmt auf 1–`deckSize` |
| F13.6 | Already in Hand | `calc-in-hand` | `number`, min 0, **max 4 im Markup**, JS klemmt auf 0–`copies` |
| F13.7 | Ergebnis „Draw (at least 1)" | `res-draw` | Farbe: ≥70 % high, ≥40 % mid, sonst low |
| F13.8 | Fußzeile Draw | `calc-fuss-draw` | „n von m Karten, k gezogen" |
| F13.9 | Ergebnis „In Prize Cards" | `res-prize` | Note „(at least 1, after opening hand)" |
| F13.10 | Fußzeile Prize | `calc-fuss-prize` | „n übrig in m ungesehenen Karten, 6 davon Preiskarten" |
| F13.11 | Ergebnis „Topdeck Chance" | `res-topdeck` | Note „(next card drawn)" |
| F13.12 | Fußzeile Topdeck | `calc-fuss-topdeck` | „n von m ungesehenen Karten" |
| F13.13 | Klemm-Rückmeldung | `.calc-input-geklemmt` + `title` „Wert auf den gültigen Bereich a–b gesetzt — gerechnet wird mit c." (1600 ms) | app-calculator.js:60–72 |

**Zustände:** Startanzeige „–" in allen drei Ergebnissen. Kein Lade- oder Fehlerzustand (reine Rechnung).

*Zählung F13: 13 Elemente.*

---

## F14 · `profile` — My Profile

**Zweck:** Sammlung, Wunschliste, Tauschliste, Ordner, eigene Decks, Journal, Testgruppen, Einstellungen.

### Rahmen

| Nr. | Element | id |
|---|---|---|
| F14.1 | Hilfeknopf | `openTabHelp('profile')` |
| F14.2 | Anmeldewand | `profile-auth-prompt` mit Knopf „Sign In / Sign Up" → `showAuthModal('signin')` |
| F14.3 | Inhalt nach Anmeldung | `profile-content` (startet `d-none`) |
| F14.4 | Cloud-Sync-Status | `cloud-sync-status` / `cloud-sync-detail` (Start: „Initialisiere…") |
| F14.5 | „Jetzt synchronisieren" | `cloud-sync-refresh-btn` → `forceCloudSync()` |
| F14.6–F14.9 | Vier Kopfkennzahlen: Name · Cards Owned · Collection Value · Saved Decks | |
| F14.10 | Battle-Journal-Kasten mit „Log Match" + „Sync Now" | |

### Unterreiter (`#profile-tab-nav`, vier Gruppen)

| Nr. | Beschriftung | Aufruf | Gruppe |
|---|---|---|---|
| F14.11 | My Collection (aktiv) | `switchProfileTab('collection')` | Cards & Collection |
| F14.12 | Wishlist | `switchProfileTab('wishlist')` | Cards & Collection |
| F14.13 | Trade List | `switchProfileTab('tradelist')` | Cards & Collection |
| F14.14 | Meta Binder | `switchProfileTab('metabinder')` | Cards & Collection |
| F14.15 | Custom Binder | `switchProfileTab('custombinder')` | Cards & Collection |
| F14.16 | My Decks | `switchProfileTab('decks')` | Decks |
| F14.17 | Compare Decklists | `switchProfileTab('deckcompare')` | Decks |
| F14.18 | Deck Builder | `switchProfileTab('deckbuilder')` | Decks |
| F14.19 | Battle Journal | `switchProfileTab('journal')` | Play & Analysis |
| F14.20 | Testing Groups | `switchProfileTab('testinggroups')` | Play & Analysis |
| F14.21 | **Meta Call →** | `switchTabAndUpdateMenu('meta-call')` — verlässt das Profil | Play & Analysis |
| F14.22 | Settings | `switchProfileTab('settings')` | Account |

Zähler-Plaketten: `tab-count-collection`, `tab-count-wishlist`, `tab-count-tradelist`, `tab-count-decks`.

### F14.23–F14.34 Collection

Import CSV (`dexImportOpenFilePicker()` + `dexImportFileInput`) · Sortierung `collection-sort`
(`set-newest` Voreinstellung / `element-set-newest` / `pokedex` / `price-desc`) · Filter
`collection-filter` (All · Pokémon gesamt + 10 Energietypen · Supporter · Item · Tool · Special Energy ·
Basic Energy) · `clearCollection()` · Ladehinweis `collection-type-loading` · Suche `collection-search`
+ Trefferzeile `collection-search-results` · Gitter `collection-grid` · Leerzustand „Your collection is
empty" + Knopf „Open Card Database".

### F14.35–F14.44 Wishlist

Bot-Import (`wishlistBotImportOpen()`) · Suche `wishlist-search` · Set-Filter `wishlist-set-filter`
(„All Sets") · Gitterbild (`openWishlistGridModal()`) · Kopieren (`copyWishlistToClipboard()`) ·
Cardmarket-Wants (`copyWishlistForCardmarket()` → `#wishlistCardmarketModal`) · Leeren
(`clearWishlist()`) · Trefferzeile · Gitter `wishlist-grid` · Leerzustand „Your wishlist is empty" +
„Find Cards" · Hilfeknopf `openTabHelp('wishlist')`.

### F14.45–F14.52 Trade List

Suche `tradelist-search` · Set-Filter `tradelist-set-filter` · Gitterbild
(`openTradelistGridModal()`) · Kopieren · Leeren · Trefferzeile · Gitter `tradelist-grid` ·
Leerzustand „Your trade list is empty".

### F14.53–F14.60 Meta Binder

Hilfeknopf `openTabHelp('meta-binder')` · „Generate Binder" (`buildMetaBinder()`) · „📂 Load Saved
Binder" (`loadSavedMetaBinder()`, id `metaBinderLoadSaved`) · „Add Missing to Wishlist"
(`metaBinderAddWishlist`, startet `disabled`) · „Proxy All Missing" (`metaBinderSendProxy`, `disabled`) ·
„Proxy NEW Cards" (`metaBinderProxyNew`, `disabled`) · Blöcke `metaBinderStats` / `metaBinderFilters` /
`metaBinderDelta` (alle `d-none`) · Gitter `metaBinderGrid` mit Leerzustand „Meta Binder not generated
yet" + zwei Knöpfen · Modal `#metaBinderDroppedModal` „Dropped Cards".

### F14.61–F14.75 Custom Binder

Hilfeknopf `openTabHelp('custom-binder')` · Ordnerleiste `cbBinderBar` · Modus
Sammlung/Druckliste (`cbModeCollection` aktiv / `cbModePrint`, `cbSetMode`) · Archetyp-Suche
`cbArchetypeSearch` · „Suchen ▾" (`cbDropdownToggle`) · „Top 10 Meta" (`cbTopMetaBtn`) · Chips
`cbSelectedChips` · Schwelle: „Alle Karten" (0) / „Kern + Tech (≥30 %)" (30) / „Nur Kern (>70 %)" (70,
**Voreinstellung**) · „Generate Custom Binder" (`cbGenerateBtn`, `disabled`) · „Ordner speichern" /
„Als neuen Ordner" / „Auf aktuellen Stand bringen" · „Fehlende auf Wunschliste" · „Alle Fehlenden an
Proxy" · „Noch nicht Gedruckte → Druckliste" (`d-none`) · „Gefilterte als gedruckt ✓" (`d-none`) ·
Blöcke `cbPresetBar` / `cbStats` / `cbFilters` / `cbAbgleich` / `cbDelta` · Gitter `cbGrid` mit
Leerzustand „Select archetypes and generate your binder".

### F14.76–F14.83 My Decks

„Compare Built Decks" (`compareActiveDecks()`) · „New Folder" (`createDeckFolder()`) · Suche
`decks-search` · Filterchip „IRL Built Only" (`decks-filter-built` → `toggleBuiltFilter()`) ·
Ordner-Navigation `decks-folder-nav` (`d-none`) · Ordner-Zusammenfassung `decks-folder-summary` ·
Gitter `decks-grid` · Leerzustand „No saved decks yet" + „Build a Deck" (→ `city-league`).

### F14.84–F14.87 Compare Decklists

`profileCompareListA` („Deck A (Old)") · `profileCompareListB` („Deck B (New)") · Knopf „Compare"
(`profileCompareDecklists()`) · Ergebnis `profileCompareResult` (`d-none`).

### F14.88–F14.96 Deck Builder (Profil)

Host `#profile-deckbuilder`, gezeichnet von `js/app-profile-deck-builder.js:989`:
Suche `pdb-search` · Filterzeile `pdb-filter-row` (Chips für Meta / Typ / Set / Energie / Seltenheit /
JP) · Trefferzähler `pdb-result-count` · „Filter leeren" `pdb-clear-filters` · Ergebnisgitter
`pdb-results` · Deckname `pdb-deck-name` · Deckzähler `pdb-deck-count` · „Deck leeren"
`pdb-clear-deck` (mit `confirm()`) · Einfüge-Panel `<details>` mit `pdb-paste` + `pdb-paste-btn` ·
Mulligan-Block `pdb-mulligan-body` · Toast `pdb-toast` · Zoom-Overlay (`.pdb-zoom-add`, `.pdb-zoom-close`).

### F14.97–F14.104 Battle Journal

„Log Match" · „Sync Now" · „Copy All" (`copyAllJournalEntries()`) · „Clear Journal"
(`clearAllJournalEntries()`) · Statistik `journalHistoryStats` · Filter: `journalFilterMeta`
(„All Formats"), `journalFilterType` (All Types / Worlds / Regional-SPE / International / Challenge /
Cup / Online / Testing), `journalFilterTournament` („All Tournaments"), `journalFilterResult`
(All / Win / Loss / Tie) · „Matchup Spreadsheet" (`toggleMatchupStats()` → `journalMatchupStats`) ·
Liste `journalHistoryList` · Ausstehende Einträge `battleJournalPendingList`.

### F14.105–F14.112 Testing Groups

Host `#profile-testinggroups` (js/app-testing-groups.js): Hilfeknopf `openTabHelp('testing-groups')` ·
Gruppe anlegen (`tg-new-name` + `_uiCreate()`) · Gruppe öffnen/schließen (`openGroup` / `closeGroup`) ·
Gruppe löschen (`deleteGroup`) / verlassen (`leaveGroup`) · Mitglied einladen (`tg-new-member-email`,
`tg-new-member-role`, `_uiAddMember()`, `_uiInvite()`, `removeMember`) · Deck hinzufügen
(`tg-new-deck`, `_uiAddDeck()`), umbenennen (`_uiRenameDeck`), entfernen (`removeDeck`) ·
Zeilenfilter (`selectAllRowFilter`, `clearRowFilter`) · „Load into Meta Call" (`loadIntoMetaCall()`) ·
JSON-Export (`exportJson()`).

### F14.113–F14.119 Settings

Anzeigename `settings-display-name` (max 50) + „Save" (`saveDisplayName()`) · Telegram-Preisalarme
`settings-price-alerts-enabled` (Checkbox) · Chat-ID `settings-price-alerts-chatid` ·
Trade-List-Schwelle `settings-price-alerts-threshold` (0–100, Vorgabe 10) · „Speichern"
(`savePriceAlerts()`) · „Sign Out" (`signOut()`).

**Zustände:** Ohne Anmeldung ist nur F14.2 sichtbar; `profile-content` bleibt `d-none`. Jeder Unterreiter
hat einen eigenen Leerzustand (oben je genannt).

*Zählung F14: 119 Elemente.*

---

## F15 · `current-meta` — Current Meta (Global) *(Menüziel, eigener Reiter)*

**Zweck:** Die Startseite. Was online und auf Majors gerade gespielt wird, als aufklappbare Abschnitte.

**Host:** `#currentMetaContent`. Der sichtbare Grundstock kommt aus der **gescrapten Datei**
`data/limitless_online_decks_comparison.html` (app-meta-cards.js:1517–1531); eingebettete `<script>`-Blöcke
werden bewusst nicht ausgeführt.

### Abschnitte (`js/ds-sections.js:66–89`)

| Nr. | Abschnitt | id | Startzustand | Quelle |
|---|---|---|---|---|
| F15.1 | „Die meistgespielten Decks" | `top` | **offen** | `section.tier-hero-section` |
| F15.2 | „Matchups" | `heatmap` | **offen** | `#matchupHeatmapContainer` |
| F15.3 | „Meistgespielte Karten" | `cards` | **offen** | `div.top-cards-container` |
| F15.4 | „Gegen welches Meta? — was dein Deck über ein ganzes Turnier holt" | `ev` | zu | `div.ds-ev-block` |
| F15.5 | „Tier-Liste — alle Archetypen nach Stärke gruppiert" | `tiers` | zu | Tier-Blöcke |
| F15.6 | „Meta-Performance — Listen, Win Rate und Top-8-Quote je Deck — sortierbar" | `rang` | zu | `div.cm-rangliste-block` |
| F15.7 | Abschnittszustände in `localStorage['ds_sections_v1']`, unbekannte ids werden beim Lesen gefiltert (ds-sections.js:125) | | | |
| F15.8 | „Ansicht zurücksetzen" (erscheint, wenn vom Standard abgewichen) | | | ds-sections.js |

### F15.9–F15.16 Tabelle „Meta-Performance" (app-tier-meta.js:1900–2145)

**Spalten:** `#` (Anzeige-Rang) · Deck · Listen · Anteil · Win Rate · Turnier-Antritte · Top 8 ·
Top-8-Quote · ggü. Schnitt.

* **Alle Spaltenköpfe außer `#` sind sortierbar** (`data-rang-spalte`, `role="button"`, `tabindex=0`).
* **Voreinstellung:** `data-rang-sortiert="listen"`, `data-rang-richtung="ab"` (absteigend nach Listen).
* Sortiert wird über den **angezeigten Zellentext** (`js/rangliste-sortieren.js:32–80`); Leerwerte („–")
  landen immer am Ende.
* Nach dem Sortieren wird `#` neu durchgezählt und die Sichtbarkeitsgrenze auf die ersten 25
  Positionen neu gesetzt.
* **F15.15** Knopf „Alle n Decks zeigen" / „Nur die Top 25 zeigen" (`.cm-rang-mehr-btn`).
* **F15.16** Fußnote: nicht zugeordnete Turniernamen (`archetype_aliases.json`).

Definitionen: jeder Spaltenkopf trägt einen Hilfstext (`hintTerm`), zusätzlich Verweis
„Nenner und Rechenweg →" auf `#quellen`. Die Spalte „ggü. Schnitt" schweigt (`–`) unter `CONV_MIN_N`
gewichteten Antritten und trägt den Feld-Durchschnitt als `zusatz`.

### F15.17–F15.24 Tier-Held-Kacheln & Tier-Liste (app-tier-meta.js:1204–1430)

| Nr. | Element |
|---|---|
| F15.17 | Held-Kachel: Rangplakette, Name, „n Varianten", Plakette Anteil (mit `title` zur Summierung über Varianten), Plakette „WR x % · n" |
| F15.18 | Klick / Enter / Leertaste → `navigateToCMAnalysisWithCombinedDeck(main, variants)` → `current-analysis`. Zurück: Nav-Leiste / Pokéball / Browser-Zurück |
| F15.19–F15.22 | Tier-Abschnitte `tier-1` (Anteil ≥ 8 %) · `tier-2` (4–8 %) · `tier-3` (1,5–4 %) · `tier-trending` / `tier-rogue` (WR > 52 % oder positive Veränderung) — Schwellen in app-tier-meta.js:245–266 |
| F15.23 | Plakette „n Listen" mit Markierung „dünne Stichprobe" (`tier-listen-duenn`) |
| F15.24 | Grundlagen-Zeile unter den Kacheln (`.tier-grundlage`) |

### F15.25–F15.30 „Gegen welches Meta?" (`js/ds-ev-rechner.js`)

| Nr. | Element |
|---|---|
| F15.25 | Deckauswahl `.ds-ev-deck` |
| F15.26 | Feldauswahl `.ds-ev-feldwahl` |
| F15.27 | Rundenzahl `.ds-ev-runden` (`number`, 1–20) |
| F15.28 | Ergebnisblock `.ds-ev-ergebnis` |
| F15.29 | Feldnotiz `.ds-ev-feldnote` und Fußnote `.ds-ev-fuss` |
| F15.30 | Tabelle: Gegner-Deck · (2 Spalten mit `title`-Erklärung) · Matches · trägt bei · (Spalte mit `title`) — nicht sortierbar (ds-ev-rechner.js:367–393) |

### F15.31–F15.36 Aus der gescrapten Datei

| Nr. | Element |
|---|---|
| F15.31 | Statistikkarte „Archetype Overview" — Wert „n (m gruppiert)", Top-3 nach Count, Top-3 nach Win Rate (Schwelle: ≥10 % der Deckzahl des Spitzendecks) — `patchArchetypeOverview()` |
| F15.32 | Statistikkarte Meta-Statistiken — `patchMetaStats()` |
| F15.33 | Best/Worst-Matchup-Tabellen: Deck · Rank · Win Rate; „Win Rate" wird auf Mobil zu „WR" umbenannt (app-meta-cards.js:1770) — nicht sortierbar |
| F15.34 | Vollständige Vergleichstabelle: Deck · **Rank** (Old Rank und „Rank Δ" werden entfernt und als „(↑n)/(↓n)/(-)" in Rank hineingeschrieben) · Count · Win Rate — nicht sortierbar |
| F15.35 | Deckname in F15.34 ist Link → `jumpToCardAnalysis(name, 'currentMeta')` → `current-analysis` |
| F15.36 | Top-100-Matchup-Block wird vor dem Einfügen entfernt (`_dropTop100MatchupSection`) |

### F15.37 Matchup-Heatmap

`renderMatchupHeatmap()` in `#matchupHeatmapContainer`.

### F15.38 Meistgespielte Karten

`renderCurrentMetaTopCards()` → `div.top-cards-container`.

**Zustände:**
* Laden: sechs Skelettkacheln in `#currentMetaContent` (index.html:1130).
* Fehler ohne `.container` in der Scraper-Datei: „Error loading comparison data".
* Fehler beim Laden: „**Error:** Could not load comparison HTML." + Meldungstext (app-meta-cards.js:1585).
* Rangliste nicht baubar: nur `console.warn('Top-8-Block konnte nicht gerendert werden')` — auf dem
  Bildschirm fehlt der Abschnitt dann ersatzlos (app-tier-meta.js:2153).

*Zählung F15: 38 Elemente.*

---

## F16 · `past-meta` — Past Meta *(Menüziel, eigener Reiter)*

**Zweck:** Abgeschlossene Formate, eingefroren, zum Nachschlagen und Vergleichen.

| Nr. | Element | id / Aufruf | Werte |
|---|---|---|---|
| F16.1 | Hilfeknopf | `openTabHelp('past-meta')` | |
| F16.2 | Datenstand-Chip | | |
| F16.3 | Formatfilter | `pastMetaFormatFilter` | „-- All Formats --" + abgeschlossene Fenster |
| F16.4 | Turnierfilter | `pastMetaTournamentFilter` | „-- All Tournaments --" |
| F16.5 | Deck-Archetyp | `pastMetaDeckSelect` | |
| F16.6 | Card Share Filter | `pastMetaFilterSelect` (Handler app-past-meta.js:585) | all / 90 / 70 / 50 |
| F16.7–F16.9 | Deck-Statistik: „Cards in deck" (`pastMetaStatCards`) · „Tournament" (`pastMetaStatTournament`) · „Format" (`pastMetaStatFormat`) | | keine Definitionen daneben |
| F16.10 | Abschnitt „Tournament Performance" (`pastMetaPerformanceSection`) + Hinweistext + Kartenraster `pastMetaPerformanceCards` | | |
| F16.11 | Abschnitt „Most Successful List" (`pastMetaMostSuccessfulSection` / `…Body`) | | |
| F16.12 | Card Overview: Suche `pastMetaOverviewSearch` | | |
| F16.13–F16.21 | 9 Typfilter `pastMetaOverviewType…` → `setPastMetaOverviewCardTypeFilter(...)` | | Voreinstellung All |
| F16.22–F16.24 | Seltenheit min (Voreinstellung) / max / all → `setPastMetaRarityMode(...)` | | |
| F16.25 | Copy | `copyPastMetaDeckOverview()` | |
| F16.26 | Grid | `togglePastMetaDeckGridView()` | |
| F16.27–F16.32 | Deck Builder: Consistency Generate · ↑ Max Rarity · Test Draw · TCG Showdown ↗ · Clear (`pastMetaClearDeckBtn`) · Algorithmus-`<details>` | | |
| F16.33 | „Build vs …" | `openAntiTechModal('pastMeta')` | |
| F16.34 | Tech-Slots leeren + Picker `pastMetaTechSlotInput` | | |
| F16.35 | Handstatistik `pastMetaHandStats` | | |
| F16.36–F16.45 | Your Deck: Save · Why? · Compare · Copy · Deck→Proxy · Share · PTCGL Import · PTCGL Export · Grid · Suche `pastMetaDeckGridSearch` + Autocomplete | | |
| F16.46 | Bank `pastMetaBenchSection` | | |
| F16.47 | Tech vs Normal (`pastMetaTechVsNormalSection`) | | |

**Kein** Meta-Card-Analysis-Block in diesem Reiter (anders als F3/F4).

**Zustände:** Statistik/Karten/Builder `d-none` bis ein Deck geladen ist (MutationObserver
index.html:989–1000). Leeres Deck: „Your deck is empty" + zwei Knöpfe.

**Tieflink:** `#past-meta?deck=X&format=Y` wird über `navigateToPastMetaWithDeck()` bedient
(inline-init.js:590–594).

*Zählung F16: 47 Elemente.*

---

## F17 · `deckbuilder` *(Menüziel, kein eigener Reiter)*

`menu-btn-deckbuilder` → `openProfileSection('deckbuilder')` → Reiter `profile`, Untertab
`profile-deckbuilder`. Elemente sind F14.88–F14.96.

| Nr. | Element |
|---|---|
| F17.1 | Der Menüeintrag hält die Hervorhebung auf „Deck Builder", nicht auf „My Profile" (index.html:509–513) — *zu prüfen: ob das auch das Kopf-Abzeichen betrifft* |
| F17.2 | Bei nicht angemeldetem Nutzer landet man auf der Anmeldewand F14.2 — *zu prüfen* |

*Zählung F17: 2 Elemente.*

---

## F18 · `showdown` *(Menüziel, extern)*

| Nr. | Element |
|---|---|
| F18.1 | `menu-btn-showdown` → `openShowdownExternal()` (js/tcg-showdown-link.js) — öffnet TCG Showdown in einem neuen Reiter, kein Tabwechsel |
| F18.2 | Dieselbe Übergabe aus jedem Deck Builder: „📋 TCG Showdown ↗" → `openInShowdownFromBuilder(source)` (F3.34, F4.58, F16.30) |
| F18.3 | Alte Tieflinks `#playtester` / `#sandbox` landen auf `meta-analysis-hub` und zeigen nach 600 ms die Meldung „Der Playtester läuft jetzt extern über TCG Showdown — im Menü unter ‚Werkzeuge'." |

*Zählung F18: 3 Elemente.*

---

## F19 · Modale und Overlays (reiterübergreifend)

| Nr. | Modal | id | Geöffnet von | Geschlossen mit |
|---|---|---|---|---|
| F19.1 | Hilfe | `helpModal` | `openTabHelp(<18 Schlüssel>)` | `closeHelpModal()` / Klick auf Hintergrund |
| F19.2 | Anmeldung | `auth-modal` | `showAuthModal('signin'\|'signup')` | `closeAuthModal()` / Hintergrund; enthält E-Mail, Passwort, Google-Anmeldung, Passwort-Zurücksetzen |
| F19.3 | Starthand-Simulator | `drawSimulatorModal` / `drawSimModal` | `openDrawSimulator(source)` | `closeDrawSimulator()`; enthält `simulatorHandGrid` und „Combo Probability" mit `comboTargetBadges` |
| F19.4 | Deck Compare | `deckCompareModal` | `openDeckCompare(source)` | `closeDeckCompare()`; Option 1 manuelle Liste, Option 2 eigenes gespeichertes Deck |
| F19.5 | 3-way Compare | `threeWayCompareModal` | `openThreeWayCompare()` | `closeThreeWayCompare()` |
| F19.6 | Anti-Tech / Build vs | `antiTechModal` | `openAntiTechModal(source)` | `closeAntiTechModal()`; zwei Schritte (Deckauswahl → Tech-Vorschläge) |
| F19.7 | Rarity Switcher | `raritySwitcherModal` | ★-Knopf auf jeder Karte | `closeRaritySwitcher()` |
| F19.8 | Matchup-Analyse | `matchupAnalysisModal` | `openMatchupAnalysisModal()` (battle-journal.js:1706) | Heatmap, Beste/Schlechteste/Alle Matchups, Chip-Filter `maFilterTypeChips` |
| F19.9 | Deck-Gitter-Vorschau | `deckGridPreviewModal` | `generateDeckGrid(source)` | `closeDeckGridPreview()` |
| F19.10 | Bildansicht | `imageViewModal` | Kartengitter | `closeImageView()` |
| F19.11 | Vollbildkarte | `fullscreenCardModal` | Karte antippen | `closeFullscreenCard()` |
| F19.12 | Einzelkarte | `singleCardModal` | | `closeSingleCard()` |
| F19.13 | Deck-Bild teilen | `shareImageModal` | `shareDeck(source)` | `closeShareImageModal()` |
| F19.14 | Wishlist-Gitter | `wishlistGridModal` | `openWishlistGridModal()` | |
| F19.15 | Cardmarket-Wants-Helfer | `wishlistCardmarketModal` | `copyWishlistForCardmarket()` | |
| F19.16 | Tradelist-Gitter | `tradelistGridModal` | `openTradelistGridModal()` | |
| F19.17 | Battle-Journal-Schublade | `battleJournalOverlay` / `battleJournalSheet` | `openBattleJournalSheet()` | enthält Turniertyp-Chips, Deck-Autocomplete (eigenes + Gegner), Bo3-Details, Speicher-Animation |
| F19.18 | Journal: Turnier bearbeiten | `bjEditTournamentModal` | | `closeEditTournamentModal()` |
| F19.19 | Journal: Match bearbeiten | `bjEditEntryModal` | | `closeEditEntryModal()` |
| F19.20 | Meta Binder: verworfene Karten | `metaBinderDroppedModal` | | `closeMetaBinderDroppedModal()` |
| F19.21 | Tech Lab: fehlenden Tech ergänzen | `techLabAddOverlay` | `techLabAddBeatenByBtn` / `techLabAddBeatsBtn` | |
| F19.22 | Pocket-Muster | `pocketOverlay` | Deckzeile antippen | `.pk-schliessen` |
| F19.23 | Meldungen (Toast) | `toast-container` (`aria-live="polite"`) | `showNotification(...)` | automatisch |

*Zählung F19: 23 Elemente.*

---

## Zusammenfassung der Zählung

| Gruppe | Reiter | Elemente |
|---|---|---|
| F0 | Rahmen / Navigation / Tieflinks | 35 |
| F1 | meta-analysis-hub | 17 |
| F2 | city-league | 22 |
| F3 | city-league-analysis | 74 |
| F4 | current-analysis | 101 |
| F5 | meta-call | 37 |
| F6 | cards | 18 |
| F7 | proxy | 16 |
| F8 | tutorial | 5 |
| F9 | quellen | 15 |
| F10 | admin | 12 |
| F11 | side-quest | 48 |
| F12 | pocket | 17 |
| F13 | calculator | 13 |
| F14 | profile | 119 |
| F15 | current-meta | 38 |
| F16 | past-meta | 47 |
| F17 | deckbuilder (Menüziel) | 2 |
| F18 | showdown (Menüziel) | 3 |
| F19 | Modale / Overlays | 23 |
| **Summe** | | **662** |

---

## Was mir aufgefallen ist

Hypothesen aus dem Quelltext für die Live-Prüfung — **keine Befunde**.

### 1. Drei berechnete Listen der City League werden nie gezeichnet
`js/app-city-league.js:963` berechnet `increased`, `js/app-city-league.js:998` gibt `newArchetypes`,
`disappeared`, `increased` zurück, `:1016` destrukturiert sie — und danach kommt **kein einziger
Verwendungsort mehr** (geprüft: 0 Treffer nach Zeile 1016). Gezeichnet wird nur `decreased`
(`:1071`, Tabelle „Seltener gespielt"). Vermutung: der Reiter zeigt Absteiger, aber weder Aufsteiger
noch neue noch verschwundene Archetypen — obwohl die Daten dafür fertig danebenliegen. Der Nutzer
sieht damit eine einseitige Bewegungsdarstellung.

### 2. Der Knopf „Meta-Analyse laden" in Deck Analysis (Global) benennt sich nie um
`js/app-meta-cards.js:733` sucht `currentMetaMetaReloadBtn`, um den Knopf nach dem Laden auf
„Erneut laden" umzuschreiben. Diese id existiert in `index.html` **nicht** — der Knopf dort
(`index.html:1661`) hat keine id, nur `cityLeagueMetaReloadBtn` (`index.html:928`) hat eine.
Vermutung: genau der Befund, der für City League am 02.09. behoben wurde, steht in Deck Analysis
(Global) unverändert — nach dem Laden steht „Load Meta Analysis" über zwölf geladenen Kacheln.

### 3. Sortierung der Spalte „Deck" liest Ziffern als Zahl
`js/rangliste-sortieren.js:57` entfernt aus dem Zellentext alles außer Ziffern und Trennzeichen und
gibt für „Charizard ex" `null` zurück (Textvergleich, richtig). Enthält ein Deckname aber eine Ziffer
(z. B. eine Set-/Versionsangabe), liefert `zahl()` eine Zahl, und dann sortiert dieselbe Spalte
gemischt: Zeilen mit Ziffer numerisch, Zeilen ohne Ziffer als Text ans Ende (`:112–116`).
Zusätzlich entscheidet `:98–100` die Startrichtung anhand **einer einzigen Probezelle** — ist die erste
Zeile ein Name mit Ziffer, startet die Spalte absteigend statt bei A. *Zu prüfen: ob im aktuellen
Datensatz überhaupt ein Deckname eine Ziffer trägt.*

### 4. Tote Einträge in `PROFILE_SUBTAB_FOR_HASH`
`js/inline-init.js:530–532` bildet `hub`, `uebersicht` und `overview` auf `meta-analysis-hub` ab.
Der Aufruf ist aber durch `if (tabId === 'profile' && …)` (`:626`) abgesichert, und `hub`/`uebersicht`
zeigen in `HASH_ALIASES` auf den Reiter `meta-analysis-hub`, nicht auf `profile`. Die drei Einträge
können nie feuern. `overview` steht darüber hinaus **gar nicht** in `HASH_ALIASES` — `#overview`
führt nirgendwohin und meldet auch nichts. Vermutung: harmloser toter Code, aber `#overview` ist ein
stiller Tieflink ins Leere, genau der Fehlertyp, den `applyHash()` sonst abfängt.

### 5. Abschnitt „Datenumfang" hat keinen Tieflink
`js/app-quellen.js:73` führt den Abschnitt `umfang`. In `HASH_ALIASES` fehlt `quellen-umfang`, und die
Weißliste `ABSCHNITTE` in `js/inline-init.js:645–646` kennt ihn ebenfalls nicht — sie listet
`quellen, begriffe, zuverlaessig, trennung, stand, rechtliches`. Vermutung: ein Verweis
`#quellen-umfang` öffnet die Seite, klappt den Abschnitt aber nicht auf, sondern fällt auf
`Quellen.open('')` zurück.

### 6. Kennzahlen ohne Definition daneben
* „Matchup vs Top 20" (`index.html:1222`, gerechnet in `js/app-current-meta-analysis.js:1955–1993`):
  gewichtetes Mittel über Gegner mit `rank ≤ 20`, angezeigt als „54,12 % (17 MU)". Weder „(17 MU)"
  noch der Nenner noch die Rang-Schwelle stehen irgendwo in der Oberfläche.
* „Total Win Rate Limitless Online Tournaments" (`index.html:1218`): keine Angabe, ob Remis im Nenner
  zählen — die Definition existiert, steht aber nur unter Quellen & Methodik (`js/app-quellen.js:96 ff.`).
* „Avg Placement" in City League (`index.html:769`) und „Ø-Platzierung" in vier Tabellen
  (`js/app-city-league.js:1092 ff.`): keine Erklärung, worüber gemittelt wird.
* „Decks Used" (`index.html:764`): Fußnote `cityLeagueStatDecksNote` existiert, startet aber `hidden`.
  *Zu prüfen: unter welcher Bedingung sie erscheint.*

### 7. Zwei Datumsfelder auf denselben Zustand
`#currentMetaDateFrom` (`index.html:1166`) und `#metacallDateFrom` (`js/app-meta-call.js:10450`)
schreiben beide über `setCurrentMetaDateFrom(v)` in `window.currentMetaDateFrom`. Der Kommentar sagt,
das sei Absicht. Vermutung für die Prüfung: ändert man das Datum in Meta Call und wechselt danach nach
Deck Analysis (Global), muss das Feld dort denselben Wert und denselben Statustext tragen — und
umgekehrt. Ein Auseinanderlaufen wäre zwei Wahrheiten für ein Fenster.

### 8. Grenzen im Rechner: Markup und JS widersprechen sich
`index.html:2363` setzt `max="60"` für „Copies in Deck", `index.html:2367` `max="4"` für
„Already in Hand". `js/app-calculator.js:93–96` klemmt dagegen auf `1..deckSize` bzw. `0..copies`.
Vermutung: bei Decksize 99 blockt der Browser-Zähler bei 60 Kopien, obwohl die Rechnung mehr zuließe;
und „Already in Hand" ist per Zähler auf 4 gedeckelt, obwohl bei 5+ Kopien mehr auf der Hand liegen
könnten. Das ist keine falsche Zahl, aber eine Grenze, die nicht sagt, dass sie eine ist.

### 9. Der Menüpunkt „Startseite" führt nicht auf die Kachelseite
`index.html:478`: `menu-btn-meta-analysis-hub` trägt `data-tab-id="current-meta"` und öffnet
`current-meta`. Die Kachelseite `meta-analysis-hub` hat damit **keinen** Weg über Menü oder
Navigationsleiste — nur `#hub`. Die Kommentare sagen, das sei so gewollt. Vermutung für die Prüfung:
die id des Knopfes und sein Ziel widersprechen sich; wer den Knopf über die id sucht (Tests,
Tastaturnavigation, künftige Änderungen) landet auf der falschen Annahme.

### 10. „Season pause"-Hinweis hängt an einer Inline-Angabe gegen eine CSS-Vorgabe
`js/app-city-league.js:535–553` schaltet `.cl-season-notice` ausdrücklich auf `display:'block'` bzw.
`'none'`, weil die CSS-Vorgabe `display:none` ist und ein Leerstring den Hinweis nie sichtbar werden
ließ (dokumentierter Befund vom 30.08.2026). Der Block steht zweimal im Markup (`index.html:693` und
`:721`). Vermutung für die Prüfung: sobald **irgendeine** andere Stelle das `style`-Attribut zurücksetzt
oder die Blöcke neu zeichnet, ist der Hinweis wieder unsichtbar — die Anzeige hängt an genau einem
Inline-Wert. Zu prüfen: erscheint der Hinweis, wenn „Current Meta" leer ist, und verschwindet er,
sobald ein Turnier im aktuellen Fenster landet — und zwar auf **beiden** Reitern gleich.

### 11. Karten-Legende nur an einer von drei gleichen Ansichten
Der `<details>`-Block „Was bedeuten die Symbole auf den Karten?" (`index.html:1345`) steht nur in
`current-analysis`. Die Kartengitter in `city-league-analysis` (`#cityLeagueDeckGrid`) und `past-meta`
(`#pastMetaDeckGrid`) zeichnen dieselben Plaketten und Knöpfe (A–K) ohne Legende. Vermutung: die
Erklärung fehlt genau dort, wo ein Nutzer aus Japan-Sicht zuerst hinkommt.

### 12. Fehler bleiben in der Konsole statt auf dem Bildschirm
Drei Stellen brechen still ab, wo der Nutzer eine leere Fläche sieht:
* `js/app-tier-meta.js:2151–2154` — „Top-8-Block konnte nicht gerendert werden", nur `console.warn`;
  auf dem Bildschirm fehlt der Abschnitt „Meta-Performance" ersatzlos.
* `js/app-city-league.js:4725` — „cityLeagueFilterSelect not found - card overview cannot be rendered",
  nur `console.warn`.
* `js/meta-analysis-hub.js:94–96` — schlägt die CSV fehl, wird der Antwortblock „Was gerade läuft"
  ohne Meldung weggelassen; die Startseite sieht dann aus, als gäbe es diesen Block nicht.
Vermutung: alle drei sind derselbe Fehlertyp — eine fehlende Zahl ist von einer nicht existierenden
Zahl nicht zu unterscheiden.

### 13. Kein Meta-Card-Analysis-Block in Past Meta
`city-league-analysis` (F3.49–F3.63) und `current-analysis` (F4.75–F4.88) haben je einen Block
„Meta Card Analysis (Top 10 Archetypes)". In `past-meta` (`index.html:1791–2067`) fehlt er. Vermutung:
gewollt (eingefrorenes Format), aber es ist eine Asymmetrie zwischen drei sonst gleich gebauten
Ansichten — *zu prüfen, ob der Nutzer sie als Lücke erlebt.*

### 14. Beschriftung „Deck ? Proxy"
`index.html:856`, `index.html:1596` und `index.html:2015` tragen als sichtbaren Text
`Deck ? Proxy`. Vermutung: ein verlorengegangenes „→" (Zeichensatzproblem beim Speichern). Der
`data-i18n`-Schlüssel (`btn.deckToProxy` / `cl.btnProxy`) überschreibt den Text vermutlich beim ersten
i18n-Durchlauf — *zu prüfen, ob das Fragezeichen jemals sichtbar wird, etwa vor dem Laden von
`js/i18n.js`.*
