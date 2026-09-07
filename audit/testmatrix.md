# Testmatrix — Live-Prüfung TheDipidis

**Datum:** 07.09.2026 · **Stand:** `main` = `5ec1e742`

**Zweck:** Dies ist das Arbeitsdokument, gegen das die Live-Prüfung läuft. Es führt
`audit/inventar-oberflaeche.md` (662 Oberflächenelemente, Gruppen F0–F19, plus 14
Hypothesen) und `audit/datenfluss.md` (Datenflusskarte je Kennzahl, verwaiste Daten,
leere Rechnungen, doppelte Rechenwege) zu einer einzigen Prüfliste zusammen.

**Regel:** Es wird nichts geprüft, was nicht in dieser Liste steht, und nichts in
dieser Liste bleibt ungeprüft.

**Aufbau:**
* **Teil A** — Prüfzeilen je Oberflächenelement, gruppiert F0–F19 (aus dem Inventar).
* **Teil B** — Datenprüfzeilen `D1…`, aus der Datenflusskarte: Kennzahlen gegen
  Formel und Rohdatei, verwaiste Dateien, leere Rechnungen, doppelte Rechenwege.
* **Teil C** — Hypothesen `H1…H14` aus „Was mir aufgefallen ist", je mit der
  Handlung, die sie live bestätigt oder widerlegt.
* **Teil D** — Zählung: Zeilen je Team und insgesamt.

**Spalten:** `Nr` (unverändert aus dem Inventar/der Datenflusskarte übernommen) ·
`Element` · `Was geprüft wird` (ausführbare Anweisung: Handlung → erwartetes
Ergebnis) · `Team` (QA = Technik, SPIELER = Nutzersicht anhand Mega Excadrill,
DATEN = Scraper/Datenbasis; Mehrfachnennung erlaubt) · `Status` (überall `offen`)
· `Nachweis` (leer).

---

## Teil A — Prüfzeilen je Oberflächenelement

### F0 · Rahmen: Kopfzeile, Pokéball-Menü, Navigationsleiste, Tieflinks

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F0.1 | Pokéball-Knopf | Auf `mainMenuTrigger` klicken → Hauptmenü öffnet sich, `aria-expanded` wechselt auf `true`. Erneut klicken → Menü schließt, `aria-expanded` zurück auf `false`. | QA | offen | |
| F0.2 | Reiter-Abzeichen | Zwischen zwei Reitern wechseln → `current-tab-title` zeigt jeweils den Namen des neu geöffneten Reiters. Reiter `current-meta` (intern `meta-analysis-hub`? prüfen) aufrufen → Abzeichen ist ausgeblendet. | QA | offen | |
| F0.3 | Dunkelmodus | `themeToggleBtn` klicken → Farbschema wechselt hell↔dunkel, Icon wechselt Mond/Sonne, `aria-pressed` wechselt mit. Seite neu laden → gewählter Modus bleibt erhalten. | QA | offen | |
| F0.4 | Sprache | `langToggleBtn` klicken → Oberfläche wechselt DE⇄EN; die Beschriftung des Knopfes selbst zeigt die **Zielsprache**, nicht die aktuelle. | QA | offen | |
| F0.5 | Battle Journal | Angemeldet mit offenen Journal-Einträgen: `battleJournalFab` klicken → Journal-Schublade öffnet sich; Plakette `battleJournalFabBadge` zeigt die korrekte Anzahl offener Einträge. Erfordert Anmeldung. | QA, SPIELER | offen | |
| F0.6 | My Decks | `openProfileSection('decks')` auslösen (Kopfzeilen-Link) → Profil öffnet sich direkt auf Untertab „My Decks". Ohne Anmeldung → Anmeldewand statt Inhalt. | QA | offen | |
| F0.7 | Wishlist | Analog F0.6 mit Untertab „Wishlist". | QA | offen | |
| F0.8 | Database | Klick → wechselt zu Reiter `cards` (Kartendatenbank). | QA | offen | |
| F0.9 | Sign In / Profil | Ohne Anmeldung: `signin-btn` klicken → Anmeldemodal öffnet sich. Mit Testkonto anmelden → Kopfzeile zeigt `user-info` statt `signin-btn` (Klasse `is-signed-out` verschwindet vom `<html>`-Element); `user-info` klicken → wechselt zu Reiter `profile` und aktualisiert das Menü. Erfordert Testkonto. | QA | offen | |
| F0.10 | Menüpunkt „Overview / Startseite" | `menu-btn-meta-analysis-hub` klicken → prüfen, welcher Reiter tatsächlich öffnet: laut Code `current-meta`, **nicht** `meta-analysis-hub` trotz der id. Vgl. H9. | QA | offen | |
| F0.11 | Menügruppe „Meta & Tier Lists" | Gruppenkopf `menu-group-meta` klicken → Untermenü `menu-submenu-meta` klappt zu (startet beim Öffnen des Hauptmenüs offen). Erneut klicken → klappt wieder auf. | QA | offen | |
| F0.12 | Menüpunkt „City League Meta" | Klick → öffnet Reiter `city-league`. | QA | offen | |
| F0.13 | Menüpunkt „Deck Analysis (Japan)" | Klick → öffnet Reiter `city-league-analysis`. | QA | offen | |
| F0.14 | Menüpunkt „Current Meta (Global)" | Klick → öffnet Reiter `current-meta`. | QA | offen | |
| F0.15 | Menüpunkt „Deck Analysis (Global)" | Klick → öffnet Reiter `current-analysis`. | QA | offen | |
| F0.16 | Menüpunkt „Past Meta" | Klick → öffnet Reiter `past-meta`. | QA | offen | |
| F0.17 | Menüpunkt „Card Database" | Klick → öffnet Reiter `cards`. | QA | offen | |
| F0.18 | Menüpunkt „Deck Builder" | Klick → `openProfileSection('deckbuilder')` öffnet Profil direkt auf Untertab Deck Builder. | QA | offen | |
| F0.19 | Menügruppe „Tools" | Gruppenkopf `menu-group-tools` klicken → Untermenü `menu-submenu-tools` klappt auf (startet zu, anders als F0.11). | QA | offen | |
| F0.20 | Menüpunkt „Proxy Printer" | Klick → öffnet Reiter `proxy`. | QA | offen | |
| F0.21 | Menüpunkt „Playtester (TCG Showdown ↗)" | Klick → `openShowdownExternal()` öffnet TCG Showdown in einem **neuen** Browser-Tab; die App selbst wechselt **nicht** den Reiter. | QA | offen | |
| F0.22 | Menüpunkt „Probability Calculator" | Klick → öffnet Reiter `calculator`. | QA | offen | |
| F0.23 | Menüpunkt „Meta Call" | Klick → öffnet Reiter `meta-call`. | QA | offen | |
| F0.24 | Menüpunkt „My Profile" | Klick → öffnet Reiter `profile`. | QA | offen | |
| F0.25 | Menüpunkt „Side Quest: Champions" | Klick → öffnet Reiter `side-quest`. | QA | offen | |
| F0.26 | Menüpunkt „Side Quest: TCG Pocket" | Klick → öffnet Reiter `pocket`. | QA | offen | |
| F0.27 | Menüpunkt „How to Use" | Klick → öffnet Reiter `tutorial`. | QA | offen | |
| F0.28 | Menüpunkt „Sources & Method" | Klick → öffnet Reiter `quellen`. Zusätzlich prüfen: `meta-analysis-hub` und `admin` sind **nirgends** im Menü verlinkt (nur per Tieflink erreichbar) — Menü einmal komplett durchklicken und bestätigen, dass beide fehlen. | QA | offen | |
| F0.29 | Untere Nav-Leiste: Gruppe „Meta" | Auf Mobilbreite: Reiter `current-meta`, `city-league`, `past-meta` und `meta-analysis-hub` einzeln aufrufen → Nav-Gruppe „Meta" leuchtet jeweils; Gruppe antippen → wechselt zu `current-meta`. | QA | offen | |
| F0.30 | Untere Nav-Leiste: Gruppe „Decks" | Reiter `current-analysis` und `city-league-analysis` aufrufen → Gruppe „Decks" leuchtet; antippen → wechselt zu `current-analysis`. | QA | offen | |
| F0.31 | Untere Nav-Leiste: Gruppe „Turnier" | Reiter `meta-call` aufrufen → Gruppe „Turnier" leuchtet; antippen → wechselt zu `meta-call`. | QA | offen | |
| F0.32 | Untere Nav-Leiste: Gruppe „Karten" | Reiter `cards`, `proxy`, `calculator` aufrufen → Gruppe „Karten" leuchtet in allen drei Fällen; antippen → wechselt zu `cards`. | QA | offen | |
| F0.33 | Untere Nav-Leiste: Gruppe „Champions" | Reiter `side-quest` aufrufen → Gruppe „Champions" leuchtet; antippen → wechselt zu `side-quest`. Zusätzlich: Reiter `tutorial`, `quellen`, `profile`, `pocket`, `admin` einzeln aufrufen → **keine** der fünf Gruppen leuchtet (bewusst so vorgesehen). | QA | offen | |
| F0.34 | Datenraum-Filterzeile | In `city-league`: Datenraum-Knopf zwischen 🇯🇵 Japan und 🌐 Global umschalten → Reiter wechselt entsprechend. Bei Japan die Zeitraum-Spalte ändern → spiegelt sich in `cityLeagueFormatSelect`/`pastMetaFormatFilter`. Bei Global: Format-Spalte zeigt festes Schild ohne Auswahlmöglichkeit (`.ds-filter-fixed`). Eine gesperrte Option anklicken → bleibt `disabled`, `title` zeigt den Sperrgrund. Bei mehr als 4 Optionen prüfen, dass aus der Knopfleiste ein `<select>` wird. | QA | offen | |
| F0.35 | Tieflinks (Hash-Aliase) | Stichprobe direkt in der Adressleiste aufrufen: `#tutorial`, `#quellen`, `#city-league`, `#calculator`, `#wishlist`, `#meta-analysis-hub`, `#admin`, `#playtester` → jeweils der passende Reiter/Untertab öffnet; `#playtester`/`#sandbox` → öffnet `meta-analysis-hub`, nach 600 ms erscheint der Hinweis „Playtester läuft jetzt extern …". Parameter testen: `#current-analysis?deck=Mega Excadrill` → Deck ist vorausgewählt; `#past-meta?format=<Key>` setzt den Formatfilter; `?focusCard=<SET>|<Nr>` in Wishlist/Tradelist → scrollt zur Karte und lässt sie 3 s amber blinken. Einen erfundenen Hash auf eine nicht existierende Reiter-id aufrufen → Hash wird ignoriert, Konsole zeigt `[deep-link] no tab element for …`. Nach Navigation prüfen, ob die Adressleiste auf den kanonischen Hash-Schlüssel zurückgeschrieben wird. | QA | offen | |

### F1 · `meta-analysis-hub` — Meta & Deck Analysis (Kachelseite)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F1.1 | Überschrift + Untertitel | Reiter über `#hub` aufrufen → Überschrift „Meta & Deck Analysis" und Untertitel sind sichtbar. | QA | offen | |
| F1.2 | Hilfeknopf | Klick auf den Hilfeknopf → `#helpModal` öffnet sich mit zum Reiter passendem Inhalt. | QA | offen | |
| F1.3 | Antwortblock „Was gerade läuft" | Bei geladenen Daten: `#metaHubAnswer` zeigt einen Fließtext mit Deckname und Zahlen. Netzwerk der CSV `online_tournament_top8_decks.csv` blockieren → Block bleibt vollständig leer, **keine** Platzhalter-Meldung erscheint. | QA, DATEN | offen | |
| F1.4 | Kachelgitter | `#metaHubTileGrid` zeigt genau 6 Kacheln, unabhängig davon, ob Daten geladen sind. | QA | offen | |
| F1.5 | Kachel „City League Meta" | Klick → öffnet Reiter `city-league`. | QA | offen | |
| F1.6 | Kachel „Deck Analysis (Japan)" | Klick → öffnet Reiter `city-league-analysis`. | QA | offen | |
| F1.7 | Kachel „Current Meta (Global)" | Klick → öffnet Reiter `current-meta`. | QA | offen | |
| F1.8 | Kachel „Deck Analysis (Global)" | Klick → öffnet Reiter `current-analysis`. | QA | offen | |
| F1.9 | Kachel „Past Meta" | Klick → öffnet Reiter `past-meta`. | QA | offen | |
| F1.10 | Kachel „Meta Call" | Klick → öffnet Reiter `meta-call` (oberster Reiter der Gruppe). | QA | offen | |
| F1.11 | Rolle „Erfolgreichstes Deck" / „Meistgespielt · Rang n" | Prüfen, welcher Text erscheint und ob der genannte Rang mit der tatsächlichen Position des Decks in der anteilssortierten Liste übereinstimmt (Deck Mega Excadrill als Stichprobe: eigenen Rang in der Rangliste nachzählen). | SPIELER | offen | |
| F1.12 | Große Zahl = Feldanteil | Angezeigten Prozentwert mit der Kontextzeile „Meta-Anteil"/„des Metas" gegen die Tabelle in `current-meta` nachrechnen — müssen übereinstimmen. | SPIELER, DATEN | offen | |
| F1.13 | „aus N Antritten" | Zahl `N` gegen den gerundeten, mit `toLocaleString` formatierten Wert aus `computeConversionPerformance` nachrechnen (Rohwert aus `online_tournament_top8_decks.csv`). | DATEN | offen | |
| F1.14 | „Top-8-Quote X %" | Zahl mit `top8/brought` aus derselben Berechnung nachrechnen. | DATEN | offen | |
| F1.15 | „N,N-mal so oft wie der Schnitt" | Nachrechnen: `d.convPct / (model.conv.expected*100)` — Formel ist laut Kommentar **roh**, nicht geglättet; prüfen, dass hier tatsächlich der ungeglättete Wert steht und nicht versehentlich der geglättete. | DATEN | offen | |
| F1.16 | Nenner-Satz + Verweis „Wie das gerechnet ist →" | Satz „Aus N gewichteten Antritten · Deck: X von Y in die Top 8." auf Plausibilität prüfen; Klick auf den Verweis → springt zu `#quellen` mit der passenden Definition. | SPIELER | offen | |
| F1.17 | Datenstand-Chip | Chip mit `data-quelle="online_tournament_top8_decks.csv"` zeigt ein aktuelles Datum/Zeit passend zum letzten Scraper-Lauf. | DATEN | offen | |

### F2 · `city-league` — City League Meta (Japan)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F2.1 | Hilfeknopf | Klick → `#helpModal` öffnet sich mit Inhalt zu `city-league`. | QA | offen | |
| F2.2 | Datenstand-Chip | Chip mit `data-quelle="city_league_archetypes.csv"` zeigt Datum; da diese Datei laut Datenflusskarte **0 Datenzeilen** hat (§10.1 in `datenfluss.md`), prüfen, welches Datum/welcher Zustand angezeigt wird. | DATEN | offen | |
| F2.3 | Format-Auswahl | `cityLeagueFormatSelect` auf „Past Meta" umstellen → Inhalt wechselt auf den Vorzeitraum-Datensatz; zurück auf „Current Meta" → wechselt zurück. | QA | offen | |
| F2.4 | Datenraum-Filterzeile | Siehe F0.34 — hier im Kontext von `city-league` ausführen. | QA | offen | |
| F2.5 | Suchfeld Vergleichstabelle | In `cityLeagueSearchFilter` einen bekannten Archetyp-Namen eingeben → `#cityLeagueFullTable` filtert auf Treffer, `#cityLeagueSearchResults` zeigt die Trefferanzahl korrekt. | QA | offen | |
| F2.6 | Tier-Held-Kacheln | Kacheln sind nach Anzahl absteigend sortiert; Rangplakette, Name, „n Varianten", Deckzahl-Plakette und „Ø-Rang"-Plakette sind für jede Kachel vorhanden und plausibel. | SPIELER | offen | |
| F2.7 | Tier-Abschnitte 1/2/3/Trending | Prüfen: Tier 1 enthält Plätze 1–3, Tier 2 Plätze 4–10, Tier 3 Plätze 11–20, Rogue/Trending den Rest; der Rogue-Block ist als `<details>` einklapp-/aufklappbar. | SPIELER | offen | |
| F2.8 | Karte „Archetype Overview" | Gesamtzahl, Top-3 nach Anzahl und Top-3 nach Ø-Platzierung gegen die Vergleichstabelle F2.14 nachrechnen. | DATEN | offen | |
| F2.9 | Karte „Top-10 Changes" | Ein-/Aussteiger der Top 10 prüfen; ohne Vorzeitraum bzw. ohne Top-10-Änderungen erscheinen die Leerfall-Texte `cl.noBaseline`/`cl.noTop10Changes`. | SPIELER, DATEN | offen | |
| F2.10 | Karte „Data Source" | Zeitraum und Anzahl Turniere gegen die Fußzeile F2.16 nachrechnen. | DATEN | offen | |
| F2.11 | Tabelle „Popularity Decreases / Seltener gespielt" | Zeigt genau die Top 10 der Rückgänge, Spalten Archetype/Old Count/New Count/Change/Ø-Platzierung sind korrekt befüllt. | DATEN | offen | |
| F2.12 | Tabelle „Performance Improvers" | Spalten Archetype/Count/Ø-Platzierung korrekt befüllt. | DATEN | offen | |
| F2.13 | Tabelle „Performance Decliners" | Analog F2.12. | DATEN | offen | |
| F2.14 | Tabelle „Full Comparison Table (Top 30)" | Zeigt genau die Top 30 nach Deck/Count/Ø-Platzierung. | DATEN | offen | |
| F2.15 | Tabelle „Archetype Combined" | Spalten Main Pokémon/Varianten/Count/Ø-Platzierung korrekt befüllt. | DATEN | offen | |
| F2.16 | Fußzeile | „Generated <Datum>" und „Total tracked <n>" stimmen mit dem tatsächlichen Datenstand überein. | DATEN | offen | |
| F2.17 | Klickpfad Tier-Held-Kachel → Deck Analysis | Auf eine Held-Kachel klicken → wechselt zu `city-league-analysis`, Deck-Dropdown zeigt `GROUP:<v1>|<v2>…` vorbelegt mit den Varianten. Zurück über Pokéball, Nav-Leiste und Browser-Zurück je einzeln prüfen. | QA | offen | |
| F2.18 | Klickpfad Archetyp-Zelle → Deck Analysis | In einer der Tabellen F2.11–F2.15 auf eine Archetyp-Zelle klicken → wechselt zu `city-league-analysis`, Dropdown vorbelegt, Seite scrollt nach oben; es gibt **keine** eigene Zurück-Taste — mit Browser-Zurück testen. | QA | offen | |
| F2.19 | Kennzahl Count / New Count / Old Count | Werte gegen `city_league_archetypes.csv` nachrechnen (Datei hat laut Datenflusskarte 0 Zeilen — prüfen, was dann angezeigt wird). | DATEN | offen | |
| F2.20 | Kennzahl Change (`count_change`) | Wert = New Count − Old Count nachrechnen. | DATEN | offen | |
| F2.21 | Kennzahl Ø-Platzierung | Angezeigter Wert entspricht `new_avg_placement` aus der CSV, formatiert über `_rang()`. | DATEN | offen | |
| F2.22 | Kennzahl Varianten-Anzahl je Held | Anzahl der auf einer Held-Kachel zusammengefassten Varianten stimmt mit der Anzahl der Deck-Dropdown-Einträge nach Klick auf F2.17 überein. | DATEN | offen | |

### F3 · `city-league-analysis` — Deck Analysis (Japan)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F3.1 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `city-league-analysis`. | QA | offen | |
| F3.2 | Datenstand-Chip | Chip `data-quelle="city_league_analysis.csv"` — Datei hat laut Datenflusskarte 0 Zeilen; prüfen, welcher Zustand angezeigt wird. | DATEN | offen | |
| F3.3 | Format-Auswahl (spiegelt F2.3) | `cityLeagueFormatSelectAnalysis` auf „Past" stellen, dann in `city-league` (F2.3) prüfen, ob die dortige Auswahl mitgezogen ist, und umgekehrt. | QA | offen | |
| F3.4 | Datum von | `cityLeagueDateFrom` setzen → Deck-Statistik und Kartenübersicht filtern auf Listen ab diesem Datum. | QA | offen | |
| F3.5 | Datum bis | `cityLeagueDateTo` setzen → filtert auf Listen bis zu diesem Datum. | QA | offen | |
| F3.6 | Deck-Archetyp-Auswahl | Ohne Auswahl zeigt das Feld „-- Please Select Deck --"; Mega Excadrill auswählen → Statistik/Karten/Builder erscheinen. | SPIELER | offen | |
| F3.7 | Card Share Filter | Nacheinander `all`/`90`/`70`/`50` wählen → Kartenliste filtert entsprechend auf Inklusionsrate. | SPIELER | offen | |
| F3.8 | „Cards in deck (unique / avg. list)" | Wert für Mega Excadrill von Hand aus den Kartenzeilen nachzählen. | SPIELER, DATEN | offen | |
| F3.9 | „Decks Used" + Fußnote | Wert prüfen; Fußnote `cityLeagueStatDecksNote` beobachten — steht als `hidden` im Markup, prüfen unter welcher Bedingung sie sichtbar wird. | SPIELER | offen | |
| F3.10 | „Avg Placement" | Wert von Hand aus den Platzierungen der geladenen Listen nachrechnen. | SPIELER, DATEN | offen | |
| F3.11 | Zähler „n Karten / n Gesamt" | Zahl stimmt mit der tatsächlich angezeigten Kartenanzahl im Grid überein. | QA | offen | |
| F3.12 | Kartensuche | In `cityLeagueOverviewSearch` einen Kartennamen eingeben → `filterOverviewCards()` reduziert das Grid auf Treffer. | QA | offen | |
| F3.13–F3.21 | 9 Typfilter (All/Pokemon/Supporter/Item/Tool/Stadium/Energy/SpecialEnergy/AceSpec) | Jeden Typfilter einzeln anklicken → Kartengrid zeigt nur Karten dieses Typs; „All" ist voreingestellt und zeigt wieder alle. | SPIELER | offen | |
| F3.22–F3.24 | Seltenheit min/max/all | `overviewRarityMin` ist voreingestellt (aktiver Zustand `btn-success`); auf `overviewRarityMax` bzw. `overviewRarityAll` umschalten → Filterlogik ändert sich sichtbar im Grid. | SPIELER | offen | |
| F3.25 | Copy Decklist | Klick auf „Copy Decklist" → Zwischenablage enthält die Liste im PTCGL/Limitless-Format; Format nachprüfen. | QA | offen | |
| F3.26 | Grid/Table-Umschalter | `toggleDeckGridView()` klicken → schaltet zwischen `#cityLeagueDeckTableView` und `#cityLeagueDeckVisual` um. | QA | offen | |
| F3.27 | Karten-Legende fehlt | Bestätigen, dass in dieser Ansicht **keine** Legende „Was bedeuten die Symbole auf den Karten?" existiert (anders als in F4.50) — prüfen, ob das so gewollt ist. | QA | offen | |
| F3.28 | Consistency Generate | Klick → `autoCompleteConsistency('cityLeague','min')` befüllt „Your Deck" automatisch für Mega Excadrill; Deckinhalt gegen die Kartenübersicht plausibilisieren. | SPIELER | offen | |
| F3.29 | ↑ Max Rarity | Klick → `toggleDeckRarity('cityLeague', …)` wechselt die im generierten Deck verwendeten Prints auf die seltenste verfügbare Variante. | QA | offen | |
| F3.30 | Kennzahl „# n /60" | Deck manuell verändern (Karte hinzufügen/entfernen) → Zähler `cityLeagueDeckCount` aktualisiert sich sofort korrekt. | QA | offen | |
| F3.31 | Kennzahl „♦ (n Unique)" | Analog F3.30 für `cityLeagueDeckCountUnique`. | QA | offen | |
| F3.32 | Kennzahl „€ Preis" | `cityLeagueDeckPrice` gegen die Summe der Einzelpreise aller Karten im Deck nachrechnen (`js/app-price.js`). | DATEN | offen | |
| F3.33 | Test Draw | Klick → `#drawSimulatorModal` öffnet sich mit einer gezogenen Starthand aus dem aktuellen Deck. | QA | offen | |
| F3.34 | TCG Showdown ↗ | Klick → `openInShowdownFromBuilder('cityLeague')` öffnet TCG Showdown mit dem aktuellen Deck in neuem Tab. | QA | offen | |
| F3.35 | Clear | Klick → `clearDeck('cityLeague')` leert das Deck vollständig, Leerzustand „Your deck is empty" erscheint. | QA | offen | |
| F3.36 | „How the consistency builder works" | `<details>` aufklappen → Gewichtungsregeln (Top-4 voll, Day-2 ≈30 %, Day-1 ≈10 %) sind lesbar und decken sich mit dem tatsächlichen Ergebnis von F3.28. | SPIELER | offen | |
| F3.37 | Handstatistik | `#cityLeagueHandStats` zeigt eine plausible Verteilung nach dem Generieren eines Decks. | SPIELER | offen | |
| F3.38 | Save | Klick → `saveCurrentDeckToProfile('cityLeague')` speichert das Deck im Profil unter „My Decks" (Anmeldung nötig). | QA | offen | |
| F3.39 | Why? (Build Info) | Klick → `showConsistencyBuildInfo('cityLeague')` öffnet eine Erklärung, die zur tatsächlichen Kartenauswahl passt. | SPIELER | offen | |
| F3.40 | Compare | Klick → `#deckCompareModal` öffnet sich; beide Optionen (manuelle Liste, eigenes gespeichertes Deck) einzeln durchspielen. | QA | offen | |
| F3.41 | Copy | Klick → `copyDeck('cityLeague')` kopiert die aktuelle Liste in die Zwischenablage. | QA | offen | |
| F3.42 | Deck → Proxy | Klick → `sendCurrentDeckToProxyPrinter('cityLeague')` überträgt das Deck in die Proxy-Warteschlange; zusätzlich prüfen, ob die Beschriftung tatsächlich „Deck ? Proxy" statt „Deck → Proxy" zeigt (vgl. H14). | QA | offen | |
| F3.43 | Share | Klick → `shareDeck('cityLeague')` öffnet `#shareImageModal` mit einem Bild des Decks. | QA | offen | |
| F3.44 | PTCGL Import | Eine PTCGL-formatierte Liste einfügen → `importFromPTCGL('cityLeague')` übernimmt sie korrekt ins Deck. | QA | offen | |
| F3.45 | PTCGL Export | Klick → `exportToPTCGL('cityLeague')` liefert eine korrekt formatierte PTCGL-Liste des aktuellen Decks. | QA | offen | |
| F3.46 | Grid | Klick → `generateDeckGrid('cityLeague')` öffnet `#deckGridPreviewModal` mit einer Bildvorschau des Decks. | QA | offen | |
| F3.47 | Deck-Suche mit Autovervollständigung | In `cityLeagueDeckGridSearch` tippen → `#cityLeagueDeckAutocomplete` schlägt passende Karten vor; Auswahl fügt die Karte dem Deck hinzu. | QA | offen | |
| F3.48 | Bank | `#cityLeagueBenchSection` zeigt die nicht im Deck verwendeten, aber im Set relevanten Karten korrekt an. | SPIELER | offen | |
| F3.49 | Zähler (Meta Card Analysis) | `cityLeagueMetaCardCount` stimmt mit der Anzahl im Meta-Card-Gitter überein. | DATEN | offen | |
| F3.50–F3.53 | Anteilsfilter All/>90 %/>70 %/>50 % | Jeden Filter einzeln anklicken → Meta-Card-Gitter zeigt nur Karten mit passender Inklusionsrate; „All" ist voreingestellt. | SPIELER | offen | |
| F3.54–F3.57 | Typfilter All/Trainer/Pokémon/Energy | Jeden Filter einzeln anklicken → Gitter filtert entsprechend; „All" ist voreingestellt. | SPIELER | offen | |
| F3.58–F3.60 | Sortierung by Type/by Share %/by Avg Count | Jede Sortierung anklicken → Reihenfolge der Karten ändert sich entsprechend; „by Type" ist aktiv voreingestellt. | QA | offen | |
| F3.61 | Suche (Meta Card Analysis) | In `cityLeagueMetaSearch` tippen → `filterMetaCards('cityLeague')` reduziert das Gitter auf Treffer. | QA | offen | |
| F3.62 | Load Meta Analysis | Klick auf `cityLeagueMetaReloadBtn` → lädt die Analyse; Beschriftung wechselt danach tatsächlich auf „Reload". | QA | offen | |
| F3.63 | Leerzustand-Knopf | Im ungeladenen Zustand den zweiten „Load Meta Analysis"-Knopf im Gitter-Leerzustand klicken → löst dieselbe Ladefunktion aus wie F3.62. | QA | offen | |
| F3.64 | Abschnitt „Tech vs Normal" | Mit generiertem Deck: Added/Cut/Count changes/Total consistency score/Δ vs Normal sind befüllt und rechnerisch nachvollziehbar. | SPIELER, DATEN | offen | |
| F3.65 | Rote Plakette | Zeigt korrekt die Max-Anzahl der Karte in einer einzelnen (Top-)Liste. | SPIELER | offen | |
| F3.66 | Grüne Plakette | Zeigt korrekt die Anzahl Kopien der Karte im eigenen Deck; ändert sich sofort beim Hinzufügen/Entfernen. | QA | offen | |
| F3.67 | Wunschzettel-Herz | Klick → Karte wird der Wunschliste hinzugefügt/entfernt; in `profile → wishlist` nachprüfen. Erfordert Anmeldung. | QA | offen | |
| F3.68 | Bernstein-Plakette | Zeigt korrekt an, wenn andere Prints derselben Karte in der eigenen Sammlung vorhanden sind. Erfordert Anmeldung mit Sammlung. | QA | offen | |
| F3.69 | Set + Inklusionsrate | „SET 123 · 100 %" — Set/Nummer und Prozentsatz gegen die Kartenübersicht nachrechnen. | DATEN | offen | |
| F3.70 | Ø-Anzahl | „Ø 3,2x (2,8x)" — beide Werte (nur spielende Decks / alle Decks) einzeln nachrechnen. | DATEN | offen | |
| F3.71 | Deck-Verbreitung | „87/100 (87 %)" — Zähler, Nenner und Prozentsatz gegeneinander nachrechnen. | DATEN | offen | |
| F3.72 | − / + / ★ | Minus/Plus ändern die Kopienanzahl im Deck sofort; ★ öffnet `#raritySwitcherModal` zum Wechsel von Print & Seltenheit. | QA | offen | |
| F3.73 | L / P / Preis | „L" öffnet Limitless-Kartenseite, „P" fügt die Karte dem Proxy-Drucker hinzu, Preis-Link öffnet Cardmarket — alle drei einzeln anklicken. | QA | offen | |
| F3.74 | 📌 / 🚫 | Nur im Cooking Mode sichtbar: 📌 pinnt eine Karte, 🚫 schließt sie aus; Wirkung auf die Kartenauswahl von F3.28 prüfen. | SPIELER | offen | |

### F4 · `current-analysis` — Deck Analysis (Global)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F4.1 | „Quick overview" | Ist beim Öffnen des Reiters voreingestellt (Session-flüchtig — nach Neuladen der Seite erneut prüfen). | QA | offen | |
| F4.2 | „Deep Dive" | Klick → `data-cm-view` am Reiter wechselt, alle `.cm-deep-dive-only`-Elemente werden sichtbar; Seite neu laden → springt zurück auf „vanilla". | QA | offen | |
| F4.3–F4.5 | Turnierformat All/Limitless Decks/Major Tournament Decks | Jeden einzeln anklicken → Statusanzeige F4.6 und die Kacheln F4.15–18 aktualisieren sich passend zum gewählten Format; „All" ist voreingestellt. | SPIELER | offen | |
| F4.6 | Statusanzeige zum Filter | Zeigt einen Text, der zur aktuellen Filterauswahl passt. | QA | offen | |
| F4.7 | Datenfenster ab | `currentMetaDateFrom` setzen → Statistik filtert entsprechend; danach in `meta-call` (F5.7) prüfen, dass **derselbe** Wert dort erscheint (gemeinsamer Zustand, vgl. H7). | QA | offen | |
| F4.8 | Clear (Datum) | Klick → `clearCurrentMetaDateFrom()` setzt das Datumsfeld zurück und hebt den Filter auf. | QA | offen | |
| F4.9 | Statusanzeige zum Datum | Zeigt einen zum gesetzten/gelöschten Datum passenden Text. | QA | offen | |
| F4.10 | Deck-Archetyp-Auswahl | Mega Excadrill auswählen → Statistik/Karten/Builder erscheinen mit passenden Daten. | SPIELER | offen | |
| F4.11 | „+ Fuse with archetype (Cooking)" | Nur im Deep Dive sichtbar; ein zweites Deck wählen → Cooking-Modus kombiniert beide Archetypen sichtbar (z. B. in F3.74-analogen Pin/Exclude-Symbolen). | SPIELER | offen | |
| F4.12 | Card Share Filter | all/90/70/50 einzeln anklicken → Kartenliste filtert entsprechend. | SPIELER | offen | |
| F4.13 | Leerzustand „Wähle ein Deck-Archetype…" | Ohne Deckauswahl sichtbar, `currentAnalysisEmptyState`; nach Auswahl verschwindet er. | QA | offen | |
| F4.14 | Archetyp-Karte | Nach Auswahl von Mega Excadrill: `currentMetaArchetypeCard` zeigt eine vollständige Karte mit allen vier Kacheln F4.15–18. | SPIELER | offen | |
| F4.15 | Kachel „Anteil" | Prozentwert (`d.share`) und Zahl (`d.count`/Major-Antritte) für Mega Excadrill von Hand nachrechnen; Nenner steht nur im `title`-Hinweis — daraufhin prüfen. | SPIELER, DATEN | offen | |
| F4.16 | Kachel „Win Rate" | Wert für beide Seiten (online/Major) nachrechnen; `title` erklärt den Remisquote-Unterschied — Text mit den tatsächlichen Unentschieden-Zahlen abgleichen. | SPIELER, DATEN | offen | |
| F4.17 | Kachel „Top-8-Quote (online)" | `top8/brought` roh nachrechnen; Feldschnitt „Schnitt aller Decks X %" daneben plausibilisieren. | DATEN | offen | |
| F4.18 | Kachel „Day-2-Quote (Major)" | `m.day2Quote` und Feldschnitt nachrechnen; bei zu wenig Daten erscheint „–"/„kein Major"/„zu wenig Daten" statt einer Zahl. | DATEN | offen | |
| F4.19 | „Cards in deck (unique / avg. list)" | Wert für Mega Excadrill von Hand aus den Kartenzeilen nachzählen. | SPIELER, DATEN | offen | |
| F4.20 | „Total Win Rate Limitless Online Tournaments" | Wert gegen `win_rate_numeric` aus `limitless_online_decks.csv` für Mega Excadrill nachrechnen. | DATEN | offen | |
| F4.21 | „Matchup vs Top 20" | Format „54,12 % (17 MU)" nachrechnen: gewichtetes Mittel nur über Gegner mit `rank ≤ 20`; prüfen, dass weder „(17 MU)" noch Nenner noch Rang-Schwelle irgendwo erklärt sind (vgl. H6). | DATEN | offen | |
| F4.22 | „Used in Top 256" | Liste/Anzahl gegen die tatsächlichen Top-256-Platzierungen von Mega Excadrill nachrechnen. | DATEN | offen | |
| F4.23 | Tabelle „Best Matchups" (nur Deep Dive) | Spalten Opponent/Win Rate/Record korrekt befüllt und nach Win Rate absteigend geordnet; Tabelle selbst ist **nicht** klickbar sortierbar. | SPIELER, DATEN | offen | |
| F4.24 | Tabelle „Worst Matchups" | Analog F4.23, aufsteigend/schlechteste zuerst; bei fehlenden Daten „No data available" über `colspan=3`. | SPIELER, DATEN | offen | |
| F4.25 | Gegnersuche | In `currentMetaOpponentSearch` tippen → Dropdown zeigt passende Gegner; Auswahl erscheint in `#currentMetaOpponentSelected`. | QA | offen | |
| F4.26 | Matchup-Detail | Nach Auswahl eines Gegners in F4.25: `#currentMetaMatchupDetails` zeigt Detailwerte, die zur Tabelle passen. | SPIELER, DATEN | offen | |
| F4.27 | Tabelle vs Meta Call | Spalten Opponent/Field %/Win Rate korrekt befüllt, nicht sortierbar (anklicken testen). | DATEN | offen | |
| F4.28 | Zusammenfassung (vs Meta Call) | Text fasst die Tabelle F4.27 korrekt zusammen. | SPIELER | offen | |
| F4.29 | Legende der Farbstufen | Farben der Zellen in F4.27 mit den Schwellen ≥60/53–60/47–53/40–47/<40 abgleichen. | QA | offen | |
| F4.30 | Tabelle „Your Build vs Vanilla" | Spalten Opponent/Field %/Vanilla/Your Build/Delta korrekt, Delta = Your Build − Vanilla, nicht sortierbar. | SPIELER, DATEN | offen | |
| F4.31 | Zusammenfassung/Detail | Text fasst F4.30 korrekt zusammen und öffnet Details bei Klick. | SPIELER | offen | |
| F4.32 | Erkannte Techs | Liste zeigt tatsächlich vom eigenen Build abweichende Karten gegenüber der Vanilla-Liste. | SPIELER | offen | |
| F4.33 | Kartendiff | Diff-Ansicht zeigt korrekt hinzugefügte/entfernte Karten gegenüber Vanilla. | SPIELER | offen | |
| F4.34 | Zähler (Card Overview) | `currentMetaCardCount`/`currentMetaCardCountSummary` stimmen mit dem sichtbaren Grid überein. | QA | offen | |
| F4.35 | Suche (Card Overview) | In `currentMetaOverviewSearch` tippen → filtert das Grid korrekt. | QA | offen | |
| F4.36–F4.44 | 9 Typfilter | Jeden Typfilter einzeln anklicken → Grid filtert korrekt; „All" voreingestellt. | SPIELER | offen | |
| F4.45–F4.47 | Seltenheit min/max/all | Analog F3.22–24. | SPIELER | offen | |
| F4.48 | Copy | Klick → `copyCurrentMetaDeckOverview()` kopiert die Liste. | QA | offen | |
| F4.49 | Grid | Klick → `toggleCurrentMetaDeckGridView()` schaltet die Ansicht um. | QA | offen | |
| F4.50 | Karten-Legende `<details>` | Aufklappen → Erklärung A–K deckt sich mit den tatsächlich in F4-Kartenkacheln verwendeten Symbolen (identisch zu F3.65–74); prüfen, dass diese Legende **nur hier** existiert (vgl. H11). | QA | offen | |
| F4.51 | Consistency Generate | Analog F3.28 für `currentMeta`/Mega Excadrill. | SPIELER | offen | |
| F4.52 | „Build vs …" (Deep Dive) | Klick → `#antiTechModal` öffnet sich, Zieldeck wählen → Konter werden in Tech-Slots übernommen. | SPIELER | offen | |
| F4.53 | ↑ Max Rarity | Analog F3.29. | QA | offen | |
| F4.54–F4.56 | Kennzahlen #/60, ♦ Unique, € Preis | Analog F3.30–32 für `currentMeta`. | QA, DATEN | offen | |
| F4.57 | Test Draw | Analog F3.33. | QA | offen | |
| F4.58 | TCG Showdown ↗ | Analog F3.34. | QA | offen | |
| F4.59 | Clear | Analog F3.35 (`currentMetaClearDeckBtn`). | QA | offen | |
| F4.60 | Algorithmus-Hinweis `<details>` | Aufklappen → Inhalt lesbar und passend zum tatsächlichen Bauverhalten. | SPIELER | offen | |
| F4.61 | Tech-Slots-Zeile (Deep Dive) | Zähler `currentMetaTechSlotsCount` zeigt „0/10" initial; nach Hinzufügen eines Techs über den Picker zählt er hoch. | QA | offen | |
| F4.62 | Tech-Slots leeren | Klick → `clearTechSlots('currentMeta')` leert alle Tech-Slots, Zähler zurück auf „0/10". | QA | offen | |
| F4.63 | Handstatistik | `#currentMetaHandStats` zeigt plausible Verteilung nach Deckgenerierung. | SPIELER | offen | |
| F4.64–F4.73 | Your Deck: Save/Why/Compare/Copy/Deck→Proxy/Share/PTCGL Import/PTCGL Export/Grid/Suche+Autocomplete | Alle zehn Funktionen einzeln durchspielen wie F3.38–47, Quelle `currentMeta`. | QA | offen | |
| F4.74 | Bank | `#currentMetaBenchSection` analog F3.48. | SPIELER | offen | |
| F4.75–F4.78 | Anteilsfilter All/>90/>70/>50 | Analog F3.50–53. | SPIELER | offen | |
| F4.79–F4.82 | Typfilter All/Trainer/Pokémon/Energy | Analog F3.54–57. | SPIELER | offen | |
| F4.83–F4.85 | Sortierung by Type/by Share%/by Avg Count | Analog F3.58–60. | QA | offen | |
| F4.86 | Suche (Meta Card Analysis) | `currentMetaMetaSearch` analog F3.61. | QA | offen | |
| F4.87 | Knopf „Load Meta Analysis" (ohne id) | Klick lädt die Analyse; danach prüfen, ob sich die Beschriftung umbenennt (vgl. H2 — die id `currentMetaMetaReloadBtn`, die dafür gesucht wird, existiert laut Code nicht). | QA | offen | |
| F4.88 | Leerzustand „Meta analysis loading" | Vor dem Laden sichtbar mit Knopf; Knopf löst F4.87 aus. | QA | offen | |
| F4.89 | Tech vs Normal | Analog F3.64 für `currentMeta`. | SPIELER, DATEN | offen | |
| F4.90 | Quick Reference Lists | Zwei Spalten „Latest Major · Best Placement" und „Latest Online · Typical Build" — Inhalte gegen die tatsächlich jüngsten Turniere/Listen von Mega Excadrill nachrechnen. | SPIELER, DATEN | offen | |
| F4.91 | 3-way Compare | Klick → `#threeWayCompareModal` öffnet sich mit drei Spalten (Builder/Major/Online); Schließen über Knopf **und** Klick auf Hintergrund je einzeln testen. | QA | offen | |
| F4.92 | Hilfeknopf (Tech Lab) | Klick → `#helpModal` mit Inhalt zu `tech-lab`. | QA | offen | |
| F4.93 | Zielkarten-Suche | In `techLabTargetSearch` tippen → Dropdown zeigt passende Karten. | QA | offen | |
| F4.94 | Vorschau + Name | Nach Auswahl einer Zielkarte: Thumbnail und Name werden korrekt angezeigt. | QA | offen | |
| F4.95 | Reset overrides | Startet `disabled`; nach einer Änderung aktiv → Klick setzt Overrides zurück. | QA | offen | |
| F4.96 | Starthinweis | Vor jeder Interaktion sichtbar, danach ausgeblendet/ersetzt. | QA | offen | |
| F4.97 | Abschnitt „Beaten by" | Liste zeigt tatsächlich Decks, gegen die die Zielkarte laut Matchup-Daten schlecht steht; Zusammenfassung und Non-Ex-Teilliste stimmen damit überein. | SPIELER, DATEN | offen | |
| F4.98 | „+ Add missing" (Beaten by) | Startet `disabled`; nach Erkennung fehlender Einträge aktiv → Klick öffnet F4.101. | QA | offen | |
| F4.99 | Abschnitt „Good against" | Analog F4.97, umgekehrte Richtung. | SPIELER, DATEN | offen | |
| F4.100 | „+ Add missing" (Beats) | Analog F4.98. | QA | offen | |
| F4.101 | Modal „Add a tech the engine missed" | Klick auf F4.98/F4.100 → Modal öffnet sich mit Suchfeld `techLabAddSearch`; hinzugefügter Eintrag erscheint danach in der jeweiligen Liste. | QA | offen | |

### F5 · `meta-call` — Meta Call

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F5.1 | Zurück-Knopf „← Startseite" | Klick → `switchTabAndUpdateMenu('current-meta')` wechselt zurück nach `current-meta`. | QA | offen | |
| F5.2 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `meta-call`. | QA | offen | |
| F5.3 | Szenarien-Auswahl | Ein gespeichertes Szenario wählen → Konfiguration (Feld, Filter, Einstellungen) lädt entsprechend nach. | SPIELER | offen | |
| F5.4 | Szenario auffrischen | Klick → `_refreshScenario()` lädt die zugrundeliegenden Daten neu, ohne die Konfiguration zu verlieren. | QA | offen | |
| F5.5 | Szenario speichern | Klick → `_saveScenario()` speichert die aktuelle Konfiguration; danach über F5.3 wieder abrufbar. | QA | offen | |
| F5.6 | Szenario löschen | Klick → `_deleteScenario()` entfernt das gewählte Szenario dauerhaft aus F5.3. | QA | offen | |
| F5.7 | Datenfenster ab | `metacallDateFrom` setzen → prüfen, dass **derselbe** Zustand wie `#currentMetaDateFrom` (F4.7) gilt: in `current-analysis` wechseln → dortiges Feld zeigt denselben Wert. | QA | offen | |
| F5.8 | Clear (Datum) | Klick → `clearCurrentMetaDateFrom()` setzt Datum zurück, wirkt sich auch auf F4.7 aus. | QA | offen | |
| F5.9 | Hinweistext zum Fenster | Zeigt korrekt einen der Zustände „aktiv"/„automatisch"/„keiner" passend zur Datumseinstellung. | QA | offen | |
| F5.10 | Meta-Quelle | `.mc-source-format-select` auf `past` stellen → `_setMetaSource('past', v)` wechselt die Datengrundlage sichtbar (z. B. andere Deckliste im Feld). | DATEN | offen | |
| F5.11 | City-League-Quellen (Checkboxen) | Beide Checkboxen (current/past) einzeln an-/abwählen → Feldtabelle F5.19 berücksichtigt die gewählten Quellen. | DATEN | offen | |
| F5.12 | Top-Cut-Größe | Wert ändern → Empfehlungstabelle/Berechnung berücksichtigt die neue Cut-Größe. | SPIELER | offen | |
| F5.13 | Spielerzahl | Wert im Bereich 2–9999 setzen, Grenzwerte testen (1 und 10000 eingeben) → Feld klemmt auf 2–9999. | QA | offen | |
| F5.14 | Runden | Wert setzen (1–15) → Berechnung reagiert; Grenzwerte testen. | QA | offen | |
| F5.15 | Day-2-Punkte | Wert setzen (1–45) → Berechnung reagiert; Grenzwerte testen. | QA | offen | |
| F5.16 | Turniername | Text eingeben (max 60 Zeichen) → erscheint im generierten Turnierbild F5.17; Grenze bei 60 Zeichen testen. | QA | offen | |
| F5.17 | Turnierbild erzeugen | Klick → `generateTournamentImage()` erzeugt ein Bild mit Turniername, Feld und Einstellungen aus F5.10–16. | QA | offen | |
| F5.18 | Modus-Reiter (`.mc-tt-tab`) | Prüfen, welche Reiter tatsächlich sichtbar sind und wie sie sich je nach Meta-Quelle (F5.10) und eingefrorenem/laufendem Meta unterscheiden. | QA | offen | |
| F5.19 | Feldtabelle-Kopf | Spalten Deck/Online/Personal/Final/Players/Ø-Begegnungen sind vorhanden, jede mit erklärendem `title`-Hinweis beim Hover. | SPIELER | offen | |
| F5.20 | Schätzfeld je Zeile | Für Mega Excadrill einen Wert zwischen 0 und 100 (Schrittweite 0,1) eintragen → „Final" und Empfehlungstabelle reagieren entsprechend. | SPIELER | offen | |
| F5.21 | Zeile aufklappen | Klick auf `.mc-row-toggle` → zeigt Detailinformationen zur Zeile (z. B. Online/Personal-Herkunft). | QA | offen | |
| F5.22 | „Alle Details" | Klick → `_toggleAllDetails()` klappt alle Zeilen gleichzeitig auf/zu. | QA | offen | |
| F5.23 | „Feld gruppieren" | Klick → `_toggleGroupField()` gruppiert die Feldtabelle sichtbar um (z. B. nach Archetyp-Familie). | QA | offen | |
| F5.24 | Feld als Bild teilen | Klick → `exportFieldShareImage()` erzeugt ein Bild der aktuellen Feldtabelle. | QA | offen | |
| F5.25 | Eigenes Deck hinzufügen | Klick → `_addCustomDeck()` fügt eine neue leere Zeile zur Eingabe hinzu. | QA | offen | |
| F5.26 | Name/Anteil/Entfernen (eigenes Deck) | Namen aus `mc-custom-datalist` wählen oder eintippen, Anteil (0–100) setzen, dann über `.mc-custom-remove-btn` wieder entfernen → Feldtabelle reagiert bei jedem Schritt. | SPIELER | offen | |
| F5.27 | Mein Deck | Mega Excadrill in `mc-my-deck` eintragen → Empfehlungstabelle bezieht das eigene Deck in die Matchup-Rechnung ein. | SPIELER | offen | |
| F5.28 | Overrides ein/aus | Klick → `_toggleOverrides()` blendet die Win-Rate-Override-Eingaben (F5.30) ein/aus. | QA | offen | |
| F5.29 | Brick-Filter | `.mc-brick-filter-select` umstellen → `_onBrickFilter(v)` filtert die Empfehlung entsprechend. | SPIELER | offen | |
| F5.30 | Win-Rate-Override je Gegner | Wert 0–100 gegen einen bestimmten Gegner setzen → Empfehlungstabelle übernimmt den manuellen Wert statt der berechneten Win Rate. | SPIELER | offen | |
| F5.31 | Day-2-Bild teilen | Klick → `exportDay2ShareImage()` erzeugt ein Bild der Day-2-Prognose. | QA | offen | |
| F5.32 | Empfehlungstabelle mit „Why?" | Spalte „Why?" (`.mc-rec-toggle-th`) aufklappen und über `.mc-rec-reason-jump` zur Begründung springen — Sprungziel prüfen. | SPIELER | offen | |
| F5.33 | Feld+Empfehlungen als Bild | Klick → `exportFieldAndRecsShareImage()` erzeugt ein kombiniertes Bild. | QA | offen | |
| F5.34 | Mobile Detailschalter | Auf Mobilbreite: `.mc-mobile-detail-toggle` klappt Detailinformationen ein/aus, die auf Desktop dauerhaft sichtbar sind. | QA | offen | |
| F5.35 | Frozen-Banner | Bei eingefrorenem vergangenem Meta: Banner ersetzt die Konfigurationselemente F5.3–F5.17 vollständig. | QA | offen | |
| F5.36 | Frozen-Anteilstabelle | Zeigt die eingefrorenen Anteile korrekt, ohne Bearbeitungsmöglichkeit. | DATEN | offen | |
| F5.37 | Frozen-Empfehlungstabelle | Spalten „Score" und „Win %" mit `title`-Erklärung; Custom Decks/My Deck/Results sind vollständig ausgeblendet. | DATEN | offen | |

### F6 · `cards` — Card Database

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F6.1 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `cards`. | QA | offen | |
| F6.2 | Datenstand-Chip | Chip im `<h2>` zeigt ein aktuelles Datum passend zum letzten Kartendaten-Build. | DATEN | offen | |
| F6.3 | Kartensuche mit Autovervollständigung | „Excadrill" eintippen → `#cardSearchAutocomplete` schlägt passende Karten vor; Auswahl filtert das Gitter. | SPIELER | offen | |
| F6.4 | Filterpanel ein/aus | Klick → `toggleCardsFilterPanel()` klappt das Panel auf/zu, `aria-expanded` wechselt mit. | QA | offen | |
| F6.5 | Filter „Meta / Format" | Radios `total`/`all_playables`/`city_league` einzeln wählen → Kartenliste filtert entsprechend; „total" ist voreingestellt. | SPIELER | offen | |
| F6.6 | Filter „Set" | Ein Set auswählen → Liste zeigt nur Karten dieses Sets. | SPIELER | offen | |
| F6.7 | Filter „Rarity" | Eine Seltenheit auswählen → Liste filtert entsprechend. | SPIELER | offen | |
| F6.8 | Filter „Category" | Eine Kategorie auswählen → Liste filtert entsprechend. | SPIELER | offen | |
| F6.9 | Filter „Element Type" | Einen Energietyp auswählen → Liste filtert entsprechend. | SPIELER | offen | |
| F6.10 | Filter „Main Pokemon" | In `mainPokemonSearch` „Excadrill" eintippen, dann in der Liste auswählen → Kartenliste filtert auf Karten dieses Hauptpokémon. | SPIELER | offen | |
| F6.11 | Filter „Archetype" | Mega Excadrill über `archetypeSearch` suchen und wählen → Liste zeigt die für dieses Deck relevanten Karten. | SPIELER | offen | |
| F6.12 | Filter „Deck Coverage" | Eine Option wählen → Liste filtert entsprechend. | SPIELER | offen | |
| F6.13 | Reset Filters | Klick → `resetCardFilters()` setzt alle gesetzten Filter (F6.5–12) zurück auf den Ausgangszustand. | QA | offen | |
| F6.14 | Sortierung | `set`/`deck`/`coverage`/`pokedex` einzeln wählen → Reihenfolge der Karten ändert sich entsprechend; „set" ist voreingestellt. | QA | offen | |
| F6.15 | Standard Print | Ist beim Start aktiv; Klick auf einer bereits umgestellten Ansicht → schaltet zurück auf Standarddruck je Karte. | QA | offen | |
| F6.16 | All Prints | Klick → zeigt alle verfügbaren Drucke jeder Karte statt nur eines. | QA | offen | |
| F6.17 | Trefferanzeige | Startet mit „Loading cards…", zeigt danach die korrekte Trefferzahl passend zum Gitter. | QA | offen | |
| F6.18 | Kartengitter | Zeigt Karten passend zu den aktuell aktiven Filtern (F6.5–14). | SPIELER | offen | |

### F7 · `proxy` — Proxy Printer

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F7.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F7.2 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `proxy`. | QA | offen | |
| F7.3 | Decklisten-Eingabe | Eine PTCGL-Liste in `proxyDecklistInput` einfügen. | QA | offen | |
| F7.4 | Add Decklist to Queue | Klick → `importDecklistToProxy()` übernimmt die eingefügte Liste (F7.3) vollständig in die Warteschlange F7.16. | QA | offen | |
| F7.5 | Kartenname | „Excadrill" eintippen → `datalist`-Vorschläge erscheinen passend. | QA | offen | |
| F7.6 | Set | Set-Kürzel für die gewählte Karte eintragen. | QA | offen | |
| F7.7 | Nummer | Kartennummer eintragen. | QA | offen | |
| F7.8 | Anzahl | Wert setzen (min 1, Vorgabe 1); Grenze testen. | QA | offen | |
| F7.9 | Add Card | Klick → `addManualProxyCard()` fügt die manuell eingegebene Karte (F7.5–8) der Warteschlange hinzu. | QA | offen | |
| F7.10 | Aus Binder laden | Klick → `cbLoadBinderIntoProxy()` überträgt einen zuvor angelegten Custom Binder in die Warteschlange. Erfordert Anmeldung mit angelegtem Binder. | QA | offen | |
| F7.11 | Add City League Deck | Klick → `addCurrentDeckToProxy('cityLeague')` überträgt das aktuelle Deck aus `city-league-analysis`. | QA | offen | |
| F7.12 | Add Current Meta Deck | Klick → `addCurrentDeckToProxy('currentMeta')` überträgt das aktuelle Deck aus `current-analysis`. | QA | offen | |
| F7.13 | Add Past Meta Deck | Klick → `addCurrentDeckToProxy('pastMeta')` überträgt das aktuelle Deck aus `past-meta`. | QA | offen | |
| F7.14 | Print Queue | Klick → `printProxyQueue()` öffnet den Druckdialog mit allen Karten der Warteschlange als Proxy-Layout. | QA | offen | |
| F7.15 | Clear Queue | Klick → `clearProxyQueue()` leert die Warteschlange vollständig, Leerzustand erscheint. | QA | offen | |
| F7.16 | Warteschlange | Zeigt nach F7.4/F7.9/F7.11–13 korrekt alle hinzugefügten Karten mit Anzahl. | QA | offen | |

### F8 · `tutorial` — How to Use

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F8.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F8.2 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `tutorial`. | QA | offen | |
| F8.3 | Link „Anleitung (deutsch)" | Klick → öffnet `tutorial/tutorial.de.html`, Seite lädt fehlerfrei. | QA | offen | |
| F8.4 | Link „Guide (english)" | Klick → öffnet `tutorial/tutorial.en.html`, Seite lädt fehlerfrei. | QA | offen | |
| F8.5 | Restlicher Inhalt aus `js/ds-tutorial.js` | Prüfen, was dieses Modul zusätzlich in den Reiter zeichnet — Inhalt vollständig sichten und auf Plausibilität prüfen. | QA | offen | |

### F9 · `quellen` — Quellen & Methodik

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F9.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F9.2 | Abschnitt „Quellen" | Startet **offen** beim Aufruf des Reiters. | QA | offen | |
| F9.3 | Abschnitt „Datenumfang" | Startet zu; aufklappen zeigt die Kennzahlen aus F9.15. | QA | offen | |
| F9.4 | Abschnitt „Begriffe" | Startet zu; aufklappen zeigt die Begriffsdefinitionen F9.9–14. | QA | offen | |
| F9.5 | Abschnitt „Zuverlässigkeit" | Startet zu; Inhalt auf Aktualität prüfen. | DATEN | offen | |
| F9.6 | Abschnitt „Trennung der Datenräume" | Startet zu; Inhalt beschreibt korrekt, wie Japan/Global getrennt gehalten werden. | DATEN | offen | |
| F9.7 | Abschnitt „Stand / Aktualisierung" | Startet zu; genannte Zeitpläne mit den tatsächlichen Workflow-Läufen aus `datenfluss.md` §2 abgleichen. | DATEN | offen | |
| F9.8 | Abschnitt „Rechtliches" | Startet zu; Inhalt vorhanden und lesbar. | QA | offen | |
| F9.9–F9.14 | Begriffsdefinitionen (Anteil, Antritt, Top-8-Quote, ggü. Schnitt, Win Rate, Tier-Einordnung) | Jede der sechs Definitionen mit der tatsächlichen Berechnung an der jeweiligen Anzeigestelle (F1, F15 u. a.) abgleichen — insbesondere „geglättet vs. roh" bei „ggü. Schnitt" und „Remis im Nenner, nicht als halber Sieg" bei Win Rate. | DATEN | offen | |
| F9.15 | Datenumfang zur Laufzeit | Von `js/ds-datenumfang.js` ergänzte Zeilenzahlen mit den tatsächlichen Zeilenzahlen der geladenen Dateien (vgl. `datenfluss.md` §1) abgleichen. | DATEN | offen | |

### F10 · `admin` — Datenlücken

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F10.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F10.2 | Titel „Datenlücken" | Sichtbar beim Aufruf über `#admin`/`#datenluecken`. | QA | offen | |
| F10.3 | Einleitung + Hinweis „nicht zugangsgeschützt" | Ohne jede Anmeldung `#admin` direkt aufrufen → Seite ist vollständig erreichbar, Hinweis ist sichtbar. | QA | offen | |
| F10.4 | Filterchip „Alle n" | Zeigt korrekt die Gesamtzahl aller Lücken; Klick zeigt alle Klassen gemeinsam. | DATEN | offen | |
| F10.5 | Filterchips je Klasse | Jede Klasse einzeln anklicken → nur Lücken dieser Klasse werden angezeigt. | DATEN | offen | |
| F10.6 | Lückenkarte | Titel, „Steht in `<code>`" und Notiz sind für eine Beispiel-Lücke korrekt befüllt. | DATEN | offen | |
| F10.7 | Einstufungs-Plakette | Zeigt „eindeutig belegt"/„Bestätigung nötig"/„ungeprüft" passend zur tatsächlichen Datenlage der jeweiligen Lücke. | DATEN | offen | |
| F10.8 | Vorschlag: Wert + Begründung | Begründung und genannte Fähigkeiten der Grundform sind für eine Beispiel-Lücke fachlich korrekt. | DATEN | offen | |
| F10.9 | Knopf „Quelle ansehen ↗" | Klick → öffnet `v.quelle` in neuem Tab, Link funktioniert. | QA | offen | |
| F10.10 | Knopf „Bestätigen & senden ↗" | Klick → `issueUrl(l)` öffnet ein vorbefülltes GitHub-Issue mit korrekten Angaben zur Lücke. | QA | offen | |
| F10.11 | Sammelknopf „Alle n Vorschläge auf einmal bestätigen ↗" | Ab 2 Vorschlägen sichtbar; Klick → Adresse enthält alle offenen Vorschläge, gedeckelt auf 6000 Zeichen (`MAX_ADRESSE`) — mit vielen offenen Lücken die Deckelung gezielt provozieren. | QA, DATEN | offen | |
| F10.12 | Fußblock „Wie es weitergeht" + Inventarzeit | Genannte UTC-Zeit „Inventar erzeugt" mit der tatsächlichen Erzeugungszeit von `data/datenluecken.json` abgleichen. **Achtung:** laut `datenfluss.md` §9.2 erzeugt **kein Ablauf** diese Datei — prüfen, wie alt der Stand tatsächlich ist. | DATEN | offen | |

### F11 · `side-quest` — Side Quest: Pokémon Champions

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F11.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F11.2 | Statuszeile | `sideQuestStatus` (`aria-live="polite"`) zeigt bei einer Aktion (z. B. Laden) eine Statusmeldung. | QA | offen | |
| F11.3 | Unterreiter „Teams" | Ist beim Öffnen aktiv, `sideQuestTeamsHost` sichtbar, alle anderen Hosts `hidden`. | QA | offen | |
| F11.4 | Unterreiter „Usage" | Klick → `sideQuestUsageHost` wird sichtbar, Teams-Host verschwindet. | QA | offen | |
| F11.5 | Unterreiter „Matchups" | Klick → `sideQuestMatchupsHost` wird sichtbar. | QA | offen | |
| F11.6 | Unterreiter „Pokémon" | Klick → `sideQuestPokedexHost` wird sichtbar. | QA | offen | |
| F11.7 | Unterreiter „Team-Builder" | Klick → `sideQuestBuilderHost` wird sichtbar. | QA | offen | |
| F11.8 | Unterreiter „Status" | Klick → `sideQuestZustaendeHost` wird sichtbar. | QA | offen | |
| F11.9 | Unterreiter „Look up" | Klick → `sideQuestResourcesHost` wird sichtbar. | QA | offen | |
| F11.10 | Replica-Code kopieren | Klick auf `.side-quest-copy-btn` bei einem Team → Code landet in der Zwischenablage. | QA | offen | |
| F11.11 | Eigenen Code kopieren | Klick auf `.side-quest-copyown-btn` → eigener Team-Code landet in der Zwischenablage. | QA | offen | |
| F11.12 | Export-Auswahl Copy/Limitless/Showdown | Jede der drei Optionen einzeln wählen. | QA | offen | |
| F11.13 | Export öffnen | Klick auf `.side-quest-export-btn` → exportiert im zuvor gewählten Format (F11.12). | QA | offen | |
| F11.14 | Team importieren | Öffnen, Namen eingeben, Import durchführen, abbrechen — alle vier Zustände (`open`/`name`/`do`/`cancel`) einzeln testen. | QA | offen | |
| F11.15 | Aktives Team setzen | Klick auf `.side-quest-active-btn` → Team wird als aktives Team markiert und bleibt es nach Neuladen. | QA | offen | |
| F11.16 | Markierung (mark) | Klick auf `.side-quest-mark-btn` → Team wird markiert/entmarkiert. | QA | offen | |
| F11.17 | Filter setzen/entfernen/leeren | Alle drei Aktionen (`.side-quest-filter-trigger`, `-remove`, `-clear`) einzeln testen → Teamliste filtert entsprechend. | QA | offen | |
| F11.18 | Info | Klick auf `.side-quest-info-btn` → zeigt Zusatzinformationen zum Team. | QA | offen | |
| F11.19 | Claude-Knopf | Klick auf `.side-quest-claude-btn` → prüfen, was tatsächlich passiert (im Code nicht eindeutig, laut Inventar *zu prüfen*). | QA | offen | |
| F11.20 | Modal schließen | Klick auf `.side-quest-modal-close` → offenes Modal schließt sich. | QA | offen | |
| F11.21 | Formatwahl (Usage) | „Doubles" ist voreingestellt; auf „Singles" umstellen → Nutzungsdaten wechseln entsprechend. | SPIELER | offen | |
| F11.22 | Typfilter (Usage) | Einen Typ wählen (Voreinstellung leer/alle) → Liste filtert entsprechend. | SPIELER | offen | |
| F11.23 | Formatwahl (Matchups) | Format umstellen → Kreuztabelle F11.27 wechselt entsprechend. | SPIELER | offen | |
| F11.24 | Sortierung (Matchups) | `_sort` ändern → Reihenfolge der Kreuztabelle ändert sich. | QA | offen | |
| F11.25 | Suche (Matchups) | In `.sq-search` einen Pokémon-Namen eingeben → Kreuztabelle filtert entsprechend. | QA | offen | |
| F11.26 | Team-Chips setzen/entfernen | `.sq-team-chip` setzen und über `.sq-team-chip-weg` wieder entfernen → Kreuztabelle reagiert. | QA | offen | |
| F11.27 | Kreuztabelle | Kopfspalte = Gegner-Pokémon, Zeilenkopf = eigenes Pokémon; Werte plausibilisieren, Tabelle ist **nicht** sortierbar (anklicken testen). | SPIELER, DATEN | offen | |
| F11.28 | „Mehr" / „Zurück" | `.sq-more` zeigt weitere Zeilen/Spalten, `.sq-back` kehrt zur reduzierten Ansicht zurück. | QA | offen | |
| F11.29 | Formatumschalter Singles/Doubles (Pokédex) | „Doubles" voreingestellt; auf „Singles" umstellen → Werte in der Tabelle F11.33 wechseln. | SPIELER | offen | |
| F11.30 | Suche (Pokédex) | In `sqpSearch` einen Namen eingeben → Tabelle filtert entsprechend. | QA | offen | |
| F11.31 | Typfilter (Pokédex) | `sqpType` setzen → Tabelle filtert entsprechend. | SPIELER | offen | |
| F11.32 | Presets | Einen Preset wählen → Tabelle filtert/sortiert entsprechend dem Preset. | SPIELER | offen | |
| F11.33 | Sortierbare Tabelle (Mon/HP/Atk/Def/SpA/SpD/Spe/Total) | Jede Spalte anklicken → sortiert danach; Voreinstellung ist „total" absteigend — beim Öffnen prüfen. | SPIELER | offen | |
| F11.34 | Detailansicht | Ein Pokémon anklicken → Tabelle Base True/Lv50/Used/Range öffnet sich mit korrekten Werten. | SPIELER | offen | |
| F11.35 | Detail schließen | Klick auf `.sqp-d-close` → Detailansicht schließt sich. | QA | offen | |
| F11.36–F11.44 | Team-Builder-Slots (Suche/Name/Fähigkeit/Item/Attacken/Wesen, Chips, Rechner, Setzen, Speichern, Als aktiv, Bearbeiten, Zurücksetzen, Leeren, Export, Zurück, Modal schließen) | Ein vollständiges Team für einen Pokémon-Slot zusammenstellen (Suche → Name → Fähigkeit → Item → 4 Attacken → Wesen), Rechner prüfen, speichern, als aktiv setzen, danach bearbeiten, zurücksetzen, leeren und exportieren — jede Funktion einzeln auslösen und Ergebnis prüfen. | SPIELER | offen | |
| F11.45 | Statuszustände | Kopfzeile `.sz-kopf` (`data-sz-id`) klappt auf/zu; „Alle" (`.sz-alle`) klappt alle gleichzeitig. | QA | offen | |
| F11.46 | Suche (Look up) | In `sqResSearch` einen Begriff eingeben → Liste filtert entsprechend. | QA | offen | |
| F11.47 | Filterchips (Look up) | `data-sq-res-filter` einzeln anklicken → Liste filtert entsprechend. | QA | offen | |
| F11.48 | „Nur Champions" | Klick auf `.sq-res-champ` → Liste zeigt nur Champions-relevante Einträge. | QA | offen | |

### F12 · `pocket` — Side Quest: TCG Pocket

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F12.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F12.2 | Kopf: Titel + Untertitel | Sichtbar beim Öffnen des Reiters. | QA | offen | |
| F12.3 | Quellenzeile | „Einstufung von Game8, keine von uns gemessene Zahl" sichtbar, Link zu game8.co funktioniert, „Stand …" zeigt ein plausibles Datum. | DATEN | offen | |
| F12.4 | Alterswarnung | Prüfen, ob die Warnung erscheint, sobald der Datenstand älter als `PLAUSIBEL_TAGE` Tage ist — aktuellen Datenstand gegen die Schwelle abgleichen. | DATEN | offen | |
| F12.5 | Filter „Alle" | Ist voreingestellt, zeigt alle Decks. | QA | offen | |
| F12.6 | Filter „Tier-Liste" | Klick → zeigt nur Decks der Tier-Liste. | SPIELER | offen | |
| F12.7 | Filter „Neues Set" | Klick → zeigt nur Decks aus dem neuen Set. | SPIELER | offen | |
| F12.8 | Deckzeile | Klick auf eine Deckzeile → Overlay F12.12–17 öffnet sich mit den Daten dieses Decks. | SPIELER | offen | |
| F12.9 | Tier-Gruppierung | Reihenfolge folgt `TIER_ORDNUNG`, innerhalb einer Stufe alphabetisch — Stichprobe nachprüfen. | DATEN | offen | |
| F12.10 | Abweichende Stufen (Dubletten) | Eine zusammengelegte Dublette suchen → ist als solche markiert. | DATEN | offen | |
| F12.11 | Rechnungsblock | Zahlen „n Einträge bei Game8 — n ohne lesbares Muster, n als Dublette zusammengelegt" gegen die tatsächliche Liste nachzählen; Liste der fehlenden Decks stimmt. | DATEN | offen | |
| F12.12 | Overlay: Schließen | Klick auf `.pk-schliessen` → Overlay schließt sich. | QA | offen | |
| F12.13 | Overlay: Name + Stufe | Zeigt korrekten Namen, Stufe, „Game8" und Stand-Datum. | DATEN | offen | |
| F12.14 | Overlay: 2D-Muster | Muster wird gezeichnet und ist mit einem zweiten Gerät tatsächlich scanbar. | SPIELER | offen | |
| F12.15 | Overlay: Hinweis „Bildschirm hell stellen" | Text sichtbar im Overlay. | QA | offen | |
| F12.16 | Overlay: Kartenliste | Pokémon/Trainer mit Stückzahl und SET-Nr. stimmen mit der tatsächlichen Deckliste überein. | DATEN | offen | |
| F12.17 | Bildschirm-Wachhalten | Während das Overlay offen ist, schaltet sich der Bildschirm nicht selbst ab (`navigator.wakeLock`) — auf einem echten Mobilgerät testen. | QA | offen | |

### F13 · `calculator` — TCG Probability Calculator

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F13.1 | Zurück „← Startseite" | Klick → wechselt zu `current-meta`. | QA | offen | |
| F13.2 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `calculator`. | QA | offen | |
| F13.3 | Cards in Deck | Wert außerhalb 1–99 eingeben → JS klemmt auf 1–99, Vorgabe ist 60. | QA | offen | |
| F13.4 | Copies in Deck | Deck-Größe auf 99 setzen, dann 60+ Kopien eingeben → Markup blockt bei `max=60`, obwohl JS bis `deckSize` klemmen würde (vgl. H8) — Diskrepanz gezielt provozieren. | QA | offen | |
| F13.5 | Cards Drawn | Wert außerhalb 1–60/`deckSize` eingeben → JS klemmt entsprechend, Vorgabe ist 7. | QA | offen | |
| F13.6 | Already in Hand | Bei 5+ Kopien im Deck einen Wert über 4 eingeben → Markup blockt bei `max=4`, obwohl JS bis `copies` klemmen würde (vgl. H8) — Diskrepanz gezielt provozieren. | QA | offen | |
| F13.7 | Ergebnis „Draw (at least 1)" | Bekannte Eingaben nachrechnen, Farbcodierung (≥70 % high, ≥40 % mid, sonst low) prüfen. | QA | offen | |
| F13.8 | Fußzeile Draw | Text „n von m Karten, k gezogen" stimmt mit den Eingaben überein. | QA | offen | |
| F13.9 | Ergebnis „In Prize Cards" | Nachrechnen, Hinweis „(at least 1, after opening hand)" korrekt. | QA | offen | |
| F13.10 | Fußzeile Prize | Text „n übrig in m ungesehenen Karten, 6 davon Preiskarten" stimmt. | QA | offen | |
| F13.11 | Ergebnis „Topdeck Chance" | Nachrechnen, Hinweis „(next card drawn)" korrekt. | QA | offen | |
| F13.12 | Fußzeile Topdeck | Text „n von m ungesehenen Karten" stimmt. | QA | offen | |
| F13.13 | Klemm-Rückmeldung | Einen Wert außerhalb des gültigen Bereichs eingeben → `.calc-input-geklemmt` erscheint 1600 ms mit `title` „Wert auf den gültigen Bereich a–b gesetzt — gerechnet wird mit c." | QA | offen | |

### F14 · `profile` — My Profile

**Hinweis:** Fast alle Elemente dieser Gruppe sind ohne Anmeldung nicht erreichbar
oder nicht sinnvoll prüfbar — Anmeldung mit einem Testkonto ist Voraussetzung für
F14.4 ff.

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F14.1 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `profile`. | QA | offen | |
| F14.2 | Anmeldewand | Ohne Anmeldung: `profile-auth-prompt` mit Knopf „Sign In / Sign Up" ist die einzige sichtbare Fläche. Klick → `showAuthModal('signin')`. | QA | offen | |
| F14.3 | Inhalt nach Anmeldung | Nach Anmeldung mit Testkonto: `profile-content` wird sichtbar (verliert `d-none`). Erfordert Anmeldung. | QA | offen | |
| F14.4 | Cloud-Sync-Status | Zeigt „Initialisiere…" beim Laden, danach einen plausiblen Sync-Status. Erfordert Anmeldung. | QA | offen | |
| F14.5 | „Jetzt synchronisieren" | Klick → `forceCloudSync()` löst eine sichtbare Synchronisation aus, Status aktualisiert sich. Erfordert Anmeldung. | QA | offen | |
| F14.6–F14.9 | Vier Kopfkennzahlen (Name/Cards Owned/Collection Value/Saved Decks) | Alle vier Werte gegen die tatsächliche Sammlung/Decks des Testkontos nachzählen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.10 | Battle-Journal-Kasten | „Log Match" öffnet die Journal-Schublade (F19.17), „Sync Now" löst eine Synchronisation aus. Erfordert Anmeldung. | QA | offen | |
| F14.11 | Untertab „My Collection" | Ist beim Öffnen aktiv. Erfordert Anmeldung. | QA | offen | |
| F14.12 | Untertab „Wishlist" | Klick → `switchProfileTab('wishlist')` wechselt den Inhalt. Erfordert Anmeldung. | QA | offen | |
| F14.13 | Untertab „Trade List" | Klick → wechselt zu `tradelist`. Erfordert Anmeldung. | QA | offen | |
| F14.14 | Untertab „Meta Binder" | Klick → wechselt zu `metabinder`. Erfordert Anmeldung. | QA | offen | |
| F14.15 | Untertab „Custom Binder" | Klick → wechselt zu `custombinder`. Erfordert Anmeldung. | QA | offen | |
| F14.16 | Untertab „My Decks" | Klick → wechselt zu `decks`. Erfordert Anmeldung. | QA | offen | |
| F14.17 | Untertab „Compare Decklists" | Klick → wechselt zu `deckcompare`. Erfordert Anmeldung. | QA | offen | |
| F14.18 | Untertab „Deck Builder" | Klick → wechselt zu `deckbuilder`. Erfordert Anmeldung. | QA | offen | |
| F14.19 | Untertab „Battle Journal" | Klick → wechselt zu `journal`. Erfordert Anmeldung. | QA | offen | |
| F14.20 | Untertab „Testing Groups" | Klick → wechselt zu `testinggroups`. Erfordert Anmeldung. | QA | offen | |
| F14.21 | „Meta Call →" | Klick → verlässt das Profil, wechselt zu Reiter `meta-call` (nicht wie die anderen ein Untertab). Erfordert Anmeldung. | QA | offen | |
| F14.22 | Untertab „Settings" | Klick → wechselt zu `settings`. Erfordert Anmeldung. | QA | offen | |
| F14.23–F14.34 | Collection (Import, Sortierung, Filter, Clear, Suche, Gitter, Leerzustand) | CSV importieren, alle vier Sortierungen und alle Filteroptionen (All + 10 Energietypen + Supporter/Item/Tool/Special Energy/Basic Energy) einzeln durchspielen, suchen, `clearCollection()` auslösen und den Leerzustand „Your collection is empty" mit Knopf „Open Card Database" prüfen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.35–F14.44 | Wishlist (Bot-Import, Suche, Set-Filter, Gitterbild, Kopieren, Cardmarket-Wants, Leeren, Trefferzeile, Gitter, Leerzustand) | Jede der zehn Funktionen einzeln auslösen; insbesondere `copyWishlistForCardmarket()` gegen `#wishlistCardmarketModal` prüfen und Leerzustand „Your wishlist is empty" mit „Find Cards". Erfordert Anmeldung. | SPIELER | offen | |
| F14.45–F14.52 | Trade List (Suche, Set-Filter, Gitterbild, Kopieren, Leeren, Trefferzeile, Gitter, Leerzustand) | Analog F14.35–44, Leerzustand „Your trade list is empty". Erfordert Anmeldung. | SPIELER | offen | |
| F14.53–F14.60 | Meta Binder (Hilfe, Generate, Load Saved, Add Missing to Wishlist, Proxy All Missing, Proxy NEW Cards, Blöcke, Gitter, Dropped-Modal) | „Generate Binder" auslösen → Gitter füllt sich, danach werden die drei zunächst `disabled` Knöpfe aktiv; „Load Saved Binder" nach dem Speichern erneut laden; Modal „Dropped Cards" öffnen und Inhalt prüfen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.61–F14.75 | Custom Binder (Ordnerleiste, Modus, Archetyp-Suche, Dropdown, Top 10 Meta, Chips, Schwelle, Generate, Speichern-Varianten, Wishlist/Proxy-Aktionen, Druckliste, Blöcke, Gitter, Leerzustand) | Mega Excadrill über die Archetyp-Suche hinzufügen, Schwelle „Nur Kern (>70 %)" (Voreinstellung) gegen „Alle Karten"/„Kern + Tech" testen, Binder generieren, speichern („Ordner speichern"/„Als neuen Ordner"/„Auf aktuellen Stand bringen" einzeln), Druckmodus mit „Noch nicht Gedruckte → Druckliste" und „Gefilterte als gedruckt ✓" durchspielen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.76–F14.83 | My Decks (Compare Built Decks, New Folder, Suche, Filterchip, Ordner-Navigation, Ordner-Zusammenfassung, Gitter, Leerzustand) | Neuen Ordner anlegen, ein gebautes Deck hineinlegen, Filterchip „IRL Built Only" prüfen, Leerzustand „No saved decks yet" mit „Build a Deck" → führt zu `city-league`. Erfordert Anmeldung. | SPIELER | offen | |
| F14.84–F14.87 | Compare Decklists (Deck A, Deck B, Compare, Ergebnis) | Zwei unterschiedliche Decklisten einfügen, „Compare" klicken → `profileCompareResult` zeigt einen korrekten Diff. Erfordert Anmeldung. | SPIELER | offen | |
| F14.88–F14.96 | Deck Builder (Profil) (Suche, Filterzeile, Trefferzähler, Filter leeren, Ergebnisgitter, Deckname, Deckzähler, Deck leeren, Einfüge-Panel, Mulligan-Block, Toast, Zoom-Overlay) | Ein Deck über Suche/Filter zusammenstellen, per Paste-Feld eine Liste einfügen, Mulligan-Statistik prüfen, „Deck leeren" mit Bestätigungsdialog (`confirm()`) auslösen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.97–F14.104 | Battle Journal (Log Match, Sync Now, Copy All, Clear Journal, Statistik, vier Filter, Matchup Spreadsheet, Liste, Ausstehende Einträge) | Einen Match protokollieren, alle vier Filter (Meta/Type/Tournament/Result) einzeln durchspielen, „Matchup Spreadsheet" öffnen, „Copy All" und „Clear Journal" auslösen. Erfordert Anmeldung. | SPIELER | offen | |
| F14.105–F14.112 | Testing Groups (Hilfe, Gruppe anlegen/öffnen/schließen/löschen/verlassen, Mitglied einladen/entfernen, Deck hinzufügen/umbenennen/entfernen, Zeilenfilter, Load into Meta Call, JSON-Export) | Eine Gruppe anlegen, ein Mitglied per E-Mail einladen, ein Deck hinzufügen und umbenennen, „Load into Meta Call" prüfen (Deck erscheint dort), JSON-Export prüfen. Erfordert Anmeldung, ggf. Zweitkonto für Einladung. | SPIELER | offen | |
| F14.113–F14.119 | Settings (Anzeigename, Telegram-Preisalarme, Chat-ID, Schwelle, Speichern, Sign Out) | Anzeigename ändern und speichern (max 50 Zeichen), Preisalarme aktivieren mit Chat-ID und Schwelle (0–100, Vorgabe 10), speichern, „Sign Out" auslösen → Nutzer wird abgemeldet, Kopfzeile zeigt wieder F0.9-Zustand „Sign In". Erfordert Anmeldung. | QA | offen | |

### F15 · `current-meta` — Current Meta (Global)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F15.1 | Abschnitt „Die meistgespielten Decks" | Startet **offen** beim Aufruf des Reiters. | QA | offen | |
| F15.2 | Abschnitt „Matchups" | Startet offen. | QA | offen | |
| F15.3 | Abschnitt „Meistgespielte Karten" | Startet offen. | QA | offen | |
| F15.4 | Abschnitt „Gegen welches Meta?" | Startet zu. | QA | offen | |
| F15.5 | Abschnitt „Tier-Liste" | Startet zu. | QA | offen | |
| F15.6 | Abschnitt „Meta-Performance" | Startet zu. | QA | offen | |
| F15.7 | Abschnittszustände (localStorage) | Alle sechs Abschnitte in einen bestimmten Zustand bringen, Seite neu laden → Zustände bleiben erhalten (`ds_sections_v1`). Manuell eine unbekannte id in den localStorage-Eintrag schreiben → wird beim Lesen gefiltert, kein Fehler. | QA | offen | |
| F15.8 | „Ansicht zurücksetzen" | Erscheint erst, wenn vom Standard abgewichen wurde; Klick → alle Abschnitte zurück auf Standardzustand F15.1–6. | QA | offen | |
| F15.9–F15.14 | Spaltenköpfe, Sortierverhalten, Rangneuzählung, Sichtbarkeitsgrenze der Tabelle „Meta-Performance" | Jeden sortierbaren Spaltenkopf außer `#` anklicken → Reihenfolge kehrt sich um; Voreinstellung ist „Listen" absteigend beim Öffnen prüfen; nach Sortierung ist `#` neu durchgezählt und die Sichtbarkeitsgrenze wieder auf die ersten 25 gesetzt; Leerwerte „–" landen am Tabellenende. | SPIELER | offen | |
| F15.15 | Knopf „Alle n Decks zeigen" / „Nur die Top 25 zeigen" | Klick → zeigt alle Decks statt nur Top 25; erneuter Klick → wieder nur Top 25. | QA | offen | |
| F15.16 | Fußnote nicht zugeordnete Turniernamen | Vorhanden und listet tatsächlich Namen auf, die nicht in `archetype_aliases.json` zugeordnet sind. | DATEN | offen | |
| F15.17 | Held-Kachel | Rangplakette, Name, „n Varianten", Anteils-Plakette (mit `title` zur Summierung über Varianten) und „WR x % · n"-Plakette sind für Mega Excadrill (falls in Top-Kacheln vertreten, sonst ein anderes Beispiel) korrekt befüllt. | SPIELER | offen | |
| F15.18 | Klick/Enter/Leertaste auf Held-Kachel | Alle drei Auslösewege einzeln testen → `navigateToCMAnalysisWithCombinedDeck` wechselt zu `current-analysis`; Rückweg über Nav-Leiste, Pokéball und Browser-Zurück je einzeln testen. | QA | offen | |
| F15.19–F15.22 | Tier-Abschnitte 1/2/3/Trending-Rogue | Prüfen: Tier 1 = Anteil ≥ 8 %, Tier 2 = 4–8 %, Tier 3 = 1,5–4 %, Trending/Rogue = WR > 52 % oder positive Veränderung — für mehrere Decks die tatsächlichen Werte gegen die Einordnung nachrechnen. | DATEN | offen | |
| F15.23 | Plakette „n Listen" mit „dünne Stichprobe" | Ein Deck mit wenigen Listen suchen → Markierung `tier-listen-duenn` erscheint. | DATEN | offen | |
| F15.24 | Grundlagen-Zeile unter den Kacheln | Text ist vorhanden und stimmt inhaltlich mit der Tier-Einordnung überein. | QA | offen | |
| F15.25 | Deckauswahl (Gegen welches Meta?) | Mega Excadrill auswählen → Ergebnisblock aktualisiert sich. | SPIELER | offen | |
| F15.26 | Feldauswahl | Ein bestimmtes Feld wählen → Berechnung berücksichtigt es. | SPIELER | offen | |
| F15.27 | Rundenzahl | Wert 1–20 setzen, Grenzen testen → Berechnung reagiert. | QA | offen | |
| F15.28 | Ergebnisblock | Zeigt ein plausibles Ergebnis passend zu Deck/Feld/Runden. | SPIELER, DATEN | offen | |
| F15.29 | Feldnotiz + Fußnote | Beide Texte inhaltlich korrekt zum gewählten Feld. | QA | offen | |
| F15.30 | Tabelle Gegner-Deck/…/Matches/trägt bei | Werte nachrechnen, Tabelle ist **nicht** sortierbar (anklicken testen). | DATEN | offen | |
| F15.31 | Statistikkarte „Archetype Overview" | Gesamtzahl, Top-3 nach Count und Top-3 nach Win Rate (Schwelle ≥10 % der Deckzahl des Spitzendecks) nachrechnen. | DATEN | offen | |
| F15.32 | Statistikkarte Meta-Statistiken | Werte aus `patchMetaStats()` gegen die Rohdaten nachrechnen. | DATEN | offen | |
| F15.33 | Best/Worst-Matchup-Tabellen | Spalten Deck/Rank/Win Rate korrekt, auf Mobilbreite wird „Win Rate" zu „WR"; Tabelle nicht sortierbar. | SPIELER, DATEN | offen | |
| F15.34 | Vollständige Vergleichstabelle | Spalte „Rank" enthält korrekt eingerechnete „(↑n)/(↓n)/(-)"-Änderung statt separater Old-Rank/Rank-Δ-Spalten; nicht sortierbar. | DATEN | offen | |
| F15.35 | Deckname als Link | Klick auf einen Decknamen in F15.34 → `jumpToCardAnalysis` wechselt zu `current-analysis` mit diesem Deck vorausgewählt. | QA | offen | |
| F15.36 | Top-100-Matchup-Block entfernt | Bestätigen, dass dieser Block aus der eingefügten HTML tatsächlich entfernt wurde und nirgends sichtbar ist. | QA | offen | |
| F15.37 | Matchup-Heatmap | `#matchupHeatmapContainer` zeigt eine vollständige, farbcodierte Heatmap; Zellenwerte stichprobenartig nachrechnen. | SPIELER, DATEN | offen | |
| F15.38 | Meistgespielte Karten | `div.top-cards-container` zeigt die tatsächlich meistgespielten Karten passend zur Kartenstatistik. | DATEN | offen | |

### F16 · `past-meta` — Past Meta

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F16.1 | Hilfeknopf | Klick → `#helpModal` mit Inhalt zu `past-meta`. | QA | offen | |
| F16.2 | Datenstand-Chip | Zeigt ein Datum passend zum eingefrorenen Format. | DATEN | offen | |
| F16.3 | Formatfilter | „-- All Formats --" wählbar sowie jedes abgeschlossene Fenster einzeln → Inhalt wechselt entsprechend. | SPIELER | offen | |
| F16.4 | Turnierfilter | „-- All Tournaments --" sowie einzelne Turniere wählen → Inhalt filtert entsprechend. | SPIELER | offen | |
| F16.5 | Deck-Archetyp-Auswahl | Mega Excadrill (falls im Vorformat vertreten, sonst Alakazam Dudunsparce als Beispiel aus H10) auswählen → Statistik erscheint. | SPIELER | offen | |
| F16.6 | Card Share Filter | all/90/70/50 einzeln anklicken. | SPIELER | offen | |
| F16.7–F16.9 | Deck-Statistik (Cards in deck, Tournament, Format) | Alle drei Werte für das gewählte Deck nachrechnen; keine Definitionen daneben vorhanden — Verständlichkeit ohne Erklärung einschätzen. | SPIELER | offen | |
| F16.10 | Abschnitt „Tournament Performance" | Hinweistext und Kartenraster zeigen plausible, zum Turnier passende Werte. | SPIELER, DATEN | offen | |
| F16.11 | Abschnitt „Most Successful List" | Zeigt tatsächlich die erfolgreichste Liste des gewählten Decks. | SPIELER, DATEN | offen | |
| F16.12 | Card Overview: Suche | Kartenname eingeben → Grid filtert entsprechend. | QA | offen | |
| F16.13–F16.21 | 9 Typfilter | Jeden einzeln anklicken, „All" voreingestellt. | SPIELER | offen | |
| F16.22–F16.24 | Seltenheit min/max/all | „min" voreingestellt, auf max/all umschalten. | SPIELER | offen | |
| F16.25 | Copy | Klick → `copyPastMetaDeckOverview()` kopiert die Liste. | QA | offen | |
| F16.26 | Grid | Klick → `togglePastMetaDeckGridView()` schaltet die Ansicht um. | QA | offen | |
| F16.27–F16.32 | Deck Builder (Consistency Generate, Max Rarity, Test Draw, TCG Showdown, Clear, Algorithmus-`<details>`) | Alle sechs Funktionen durchspielen; insbesondere prüfen, dass der Formattor (`in_person_legal_date`) hier **nicht** greift (vgl. H10/D-Zeile zu Zwei Wege #10) — d. h. auch ältere Listen fließen ein. | SPIELER, DATEN | offen | |
| F16.33 | „Build vs …" | Klick → `openAntiTechModal('pastMeta')` öffnet den Anti-Tech-Dialog. | SPIELER | offen | |
| F16.34 | Tech-Slots leeren + Picker | Tech über `pastMetaTechSlotInput` hinzufügen, dann leeren. | QA | offen | |
| F16.35 | Handstatistik | `pastMetaHandStats` zeigt plausible Verteilung. | SPIELER | offen | |
| F16.36–F16.45 | Your Deck (Save/Why/Compare/Copy/Deck→Proxy/Share/PTCGL Import/PTCGL Export/Grid/Suche+Autocomplete) | Alle zehn Funktionen analog F3.38–47 durchspielen. | QA | offen | |
| F16.46 | Bank | `pastMetaBenchSection` analog F3.48. | SPIELER | offen | |
| F16.47 | Tech vs Normal | Analog F3.64/F4.89 für `pastMeta`. | SPIELER, DATEN | offen | |

### F17 · `deckbuilder` (Menüziel, kein eigener Reiter)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F17.1 | Menü-Hervorhebung | Über `menu-btn-deckbuilder` navigieren → prüfen, ob das Menü „Deck Builder" hervorhebt oder fälschlich „My Profile"; zusätzlich prüfen, ob das Kopf-Abzeichen (F0.2) denselben Namen zeigt. | QA | offen | |
| F17.2 | Ohne Anmeldung | Ohne Anmeldung `menu-btn-deckbuilder` anklicken → landet auf der Anmeldewand F14.2 statt direkt im Deck Builder. | QA | offen | |

### F18 · `showdown` (Menüziel, extern)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F18.1 | Menüpunkt „Playtester" | Klick → `openShowdownExternal()` öffnet TCG Showdown in neuem Tab, **kein** Tabwechsel in der App selbst. | QA | offen | |
| F18.2 | Übergabe aus jedem Deck Builder | „📋 TCG Showdown ↗" aus F3.34, F4.58 und F16.30 je einzeln auslösen → `openInShowdownFromBuilder(source)` übergibt jeweils das richtige, aktuelle Deck. | QA | offen | |
| F18.3 | Alte Tieflinks `#playtester`/`#sandbox` | Beide Aliase aufrufen → landen auf `meta-analysis-hub`, nach 600 ms erscheint „Der Playtester läuft jetzt extern über TCG Showdown — im Menü unter ‚Werkzeuge'." | QA | offen | |

### F19 · Modale und Overlays (reiterübergreifend)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| F19.1 | Hilfe (`helpModal`) | Von jedem der Reiter mit Hilfeknopf öffnen (Stichprobe: 3 verschiedene Reiter) → Inhalt passt jeweils zum Reiter; schließen über Knopf **und** Hintergrundklick. | QA | offen | |
| F19.2 | Anmeldung (`auth-modal`) | E-Mail/Passwort-Anmeldung, Google-Anmeldung und Passwort-Zurücksetzen je einzeln durchspielen; `signin`/`signup`-Varianten testen; schließen über Knopf und Hintergrund. | QA | offen | |
| F19.3 | Starthand-Simulator | Öffnen aus einem Deck Builder (F3.33) → `simulatorHandGrid` zeigt eine gezogene Hand; „Combo Probability" mit `comboTargetBadges` gegen eine bekannte Zielkarte nachrechnen. | SPIELER, DATEN | offen | |
| F19.4 | Deck Compare | Öffnen aus F3.40 → Option 1 (manuelle Liste) und Option 2 (eigenes gespeichertes Deck) je einzeln testen, Ergebnis nachrechnen. | SPIELER | offen | |
| F19.5 | 3-way Compare | Öffnen aus F4.91 → Builder/Major/Online-Spalten zeigen konsistente Daten für Mega Excadrill; schließen über `closeThreeWayCompare()`. | SPIELER, DATEN | offen | |
| F19.6 | Anti-Tech / Build vs | Öffnen aus F4.52 → beide Schritte (Deckauswahl → Tech-Vorschläge) einzeln durchlaufen, Vorschläge auf Plausibilität prüfen. | SPIELER | offen | |
| F19.7 | Rarity Switcher | ★-Knopf (F3.72) auf einer Karte anklicken → Modal zeigt verfügbare Prints/Seltenheiten, Auswahl wechselt die Karte im Deck. | QA | offen | |
| F19.8 | Matchup-Analyse | Öffnen über `openMatchupAnalysisModal()` → Heatmap, Beste/Schlechteste/Alle Matchups anzeigen, Chip-Filter `maFilterTypeChips` filtert korrekt. | SPIELER, DATEN | offen | |
| F19.9 | Deck-Gitter-Vorschau | Öffnen aus F3.46 → Bildvorschau zeigt das tatsächliche Deck korrekt; schließen über `closeDeckGridPreview()`. | QA | offen | |
| F19.10 | Bildansicht | Auf ein Kartenbild im Gitter klicken → `imageViewModal` öffnet die Karte in groß; schließen über `closeImageView()`. | QA | offen | |
| F19.11 | Vollbildkarte | Karte antippen → `fullscreenCardModal` öffnet sich; schließen über `closeFullscreenCard()`. | QA | offen | |
| F19.12 | Einzelkarte | `singleCardModal` öffnen und über `closeSingleCard()` schließen. | QA | offen | |
| F19.13 | Deck-Bild teilen | Öffnen aus F3.43 → `shareImageModal` zeigt ein korrektes Bild des Decks; schließen über `closeShareImageModal()`. | QA | offen | |
| F19.14 | Wishlist-Gitter | Öffnen aus F14.35–44 → zeigt alle Wunschlisten-Karten als Bild. Erfordert Anmeldung. | QA | offen | |
| F19.15 | Cardmarket-Wants-Helfer | Öffnen aus F14.35–44 → `wishlistCardmarketModal` liefert eine für Cardmarket brauchbare Liste. Erfordert Anmeldung. | QA | offen | |
| F19.16 | Tradelist-Gitter | Öffnen aus F14.45–52 → zeigt alle Tauschlisten-Karten als Bild. Erfordert Anmeldung. | QA | offen | |
| F19.17 | Battle-Journal-Schublade | Öffnen über `openBattleJournalSheet()` → Turniertyp-Chips, Deck-Autocomplete (eigen + Gegner), Bo3-Details und Speicher-Animation einzeln durchspielen. Erfordert Anmeldung. | SPIELER | offen | |
| F19.18 | Journal: Turnier bearbeiten | Ein protokolliertes Turnier bearbeiten → Änderungen werden übernommen; schließen über `closeEditTournamentModal()`. Erfordert Anmeldung. | QA | offen | |
| F19.19 | Journal: Match bearbeiten | Einen protokollierten Match bearbeiten → Änderungen werden übernommen; schließen über `closeEditEntryModal()`. Erfordert Anmeldung. | QA | offen | |
| F19.20 | Meta Binder: verworfene Karten | Nach „Generate Binder" öffnen → zeigt tatsächlich verworfene Karten korrekt; schließen über `closeMetaBinderDroppedModal()`. Erfordert Anmeldung. | SPIELER | offen | |
| F19.21 | Tech Lab: fehlenden Tech ergänzen | Öffnen aus F4.98/F4.100 → Suche funktioniert, hinzugefügter Eintrag erscheint danach in der jeweiligen Liste (F4.97/F4.99). | QA | offen | |
| F19.22 | Pocket-Muster | Öffnen aus F12.8, schließen über `.pk-schliessen` — bereits unter F12.12 geprüft; hier zusätzlich das Zusammenspiel mit dem Wachhalte-Modus (F12.17) im offenen Zustand prüfen. | QA | offen | |
| F19.23 | Meldungen (Toast) | Eine Aktion auslösen, die `showNotification(...)` aufruft (z. B. Deck speichern) → Toast erscheint in `#toast-container`, `aria-live="polite"` greift, verschwindet automatisch nach kurzer Zeit. | QA | offen | |

---

## Teil B — Datenprüfzeilen (aus `audit/datenfluss.md`)

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| D1 | Kennzahl **Win %** — drei Konventionen an sieben Anzeigestellen | Für Mega Excadrill (bzw. ein Deck mit ausreichend Partien) an jeder der sieben Anzeigestellen aus `datenfluss.md` §3.4 die angezeigte Zahl gegen die dort genannte Formel und die Rohdatei nachrechnen: Deck-Kachel Tierliste (`mitUnentschieden`, Beta-Prior k=50), Heatmap-Zelle „online" (`ohneUnentschieden`, k=20, kursiv unter 10 Matches), Matchup-Tabelle Archetyp-Karte (`ohneUnentschieden`, k=20, `THIN_GAMES=20`), Major-Win-Rate Archetyp-Karte (`mitUnentschieden`, **neu gerechnet** aus wins/losses/ties, **nicht** `win_pct` gelesen, gedämpft unter 100 Partien), „Cumulative Win %" in `past-meta` (**Matchpunkte**), Labs-Beitrag zum Tier-Score (`win_pct`=Matchpunkte, nur ab `games ≥ 15`), Matchup-Mischung im Meta Call (Day-2 0,45/Day-1 0,35/Online 0,20). Bei jedem Wert prüfen, ob Unentschieden wie in der jeweiligen Konvention beschrieben behandelt werden. | SPIELER, DATEN | offen | |
| D2 | Kennzahl **Meta-Anteil** — Online kumulativ (`share_numeric`) | Angezeigten Wert „Anteil"/„Share online" für Mega Excadrill gegen `share_numeric` aus `limitless_online_decks.csv` nachrechnen; Nenner ist die Zahl der Decklisten **inklusive** der weggeworfenen Zeile „Other" — bestätigen, dass die Summe aller `share_numeric` merklich unter 100 % bleibt (heute gemessen 96,19 %). | DATEN | offen | |
| D3 | Kennzahl **Meta-Anteil** — Fenster (`share_fenster`) | Wert „Fenster"/Trend-Spalte im Meta Call für Mega Excadrill gegen `count_fenster/Σcount_fenster` aus `limitless_online_fenster.csv` nachrechnen; bestätigen, dass der Nenner ein **anderer** ist als bei D2 (Fensterzuwächse statt Gesamtliste). | DATEN | offen | |
| D4 | Kennzahl **Meta-Anteil** — Präsenzturniere (`share_pct`) | Wert „Anteil Major"/„Field Share" gegen `player_count/total_players` aus `labs_tournament_decks.csv` nachrechnen; bestätigen, dass hier über **Spieler**, nicht über Listen genannt wird. | DATEN | offen | |
| D5 | Kennzahl **Antritte** (`total_brought`) | Angezeigte Zahl „Antritte"/„gebracht" gegen die gezählte **und** die gewichtete Spalte nachrechnen; bestätigen, dass `gezaehlteZeilen()` konsequent auf eine der beiden Varianten schaltet (alles oder nichts je Zeile), nicht gemischt. | DATEN | offen | |
| D6 | Kennzahl **Meta-Anteil** — Prognose/Final % im Meta Call | Für Mega Excadrill (oder ein anderes im Feld vertretenes Deck) den „Prognose"/„Final %"-Wert Schritt für Schritt nachrechnen: rezenzgewichteter Anker (λ=0,40) → Leistungsfaktor (γ-Fenster 2 Turniere, Faktor-Deckel 0,85–…) → Mittelwertrückkehr (Exponent 0,92); bei fehlender Deckkenntnis den Rückfall-Pfad mit den dort genannten Gewichten (0,40/0,20/0,15/0,15/0,10 bzw. mit City-League-Schaltern 0,32/0,35/…) prüfen. | DATEN | offen | |
| D7 | Kennzahl **Max Consistency** | Für Mega Excadrill (8 Listen, alle aus Worlds 2026, Plätze 37–122) den generierten Deck-Inhalt (F3.28/F4.51) gegen die Formel aus §5.1 nachrechnen (`weightedShare`, `weightedAvgCount`, `topCutFreq`, Platzgewicht als Maximum aus absoluter/feldrelativer Skala, Größengewicht); bestätigen, dass wegen `MIN_WEIGHTED_LISTS = 3` **nicht** in den Alt-Pfad zurückgefallen wird (8 ≥ 3), und den „Why?"-Dialog (F3.39) auf die genannten Turnierzahl/Namen/Datum/Platzspanne prüfen. | SPIELER, DATEN | offen | |
| D8 | Kennzahl **Tech-Cut** — Baustein A (Bedrohungslage) | Für eine Kategorie aus `active_threats.json` (z. B. `hand_disruption`, `weighted_meta_share = 0,2678`) den Wert gegen die Formel in §6.1 nachrechnen (Schwellen `INCLUSION_FLOOR=0,25`, `META_SHARE_FLOOR=0,005`, `CATEGORY_FLOOR=0,02`, Maximum je Archetyp statt Summe). | DATEN | offen | |
| D9 | Kennzahl **Tech-Cut** — Baustein B (Tech-Audit im Bauer) | Für Mega Excadrill im Deck Builder die vorgeschlagene Konteranzahl je Kategorie gegen `weighted_meta_share`-Schwellen (0,30/0,60) und Aggressionszuschlag nachrechnen; Score-Wirkung (+18 gewählt / −20 redundant) am „Why?"-Dialog nachvollziehen. | SPIELER, DATEN | offen | |
| D10 | Kennzahl **Tech-Cut** — Baustein C (Tech-Ideen) | Eine angezeigte Tech-Idee gegen die fünf Paarungen in `card_capability_interactions.json` (Version 0.1, 15.05.2026) abgleichen; bestätigen, dass „Keine Idee gefunden" erscheint, sobald keine der fünf Regeln zutrifft, und dass **keine** Anteils-/Platzierungs-/Siegquote daneben steht (bewusst getrennt vom Beleg-Block). | DATEN | offen | |
| D11 | **Archetyp-Erkennung** — Mega Excadrill | Bestätigen, dass „Mega Excadrill" in allen sechs Quelldateien (`archetype_icons.json`, `limitless_online_decks.csv`, `labs_tournament_decks.csv`, `online_tournament_top8_decks.csv`, `tournament_decklists_per_player.csv`, `current_meta_card_data.csv`) identisch geschrieben ist und ohne Alias-Eintrag über den Namen zusammengeführt wird; die Anzeige in allen Reitern (city-league-analysis, current-analysis, past-meta, cards) zeigt durchgängig denselben Namen für dasselbe Deck. | DATEN | offen | |
| D12 | Kennzahl **Top-8 vs. Erwartung** | Wert für Mega Excadrill (oder ein Deck mit ≥ `CONV_MIN_N=20` Antritten) gegen `smoothed`/`rawPct` aus §8.1 nachrechnen (`CONV_PRIOR=50`); ein Deck mit weniger als 20 Antritten suchen und bestätigen, dass es aus der **Liste** fliegt, nicht nur aus dem Feldmittel. | DATEN | offen | |
| D13 | Kennzahl **Deckempfehlung** („Was bringe ich mit?") | Score für ein angezeigtes Deck gegen die Formel in §8.2 nachrechnen (`D1`, `D2`, `p0`, `k=30` bzw. `60`); bestätigen, dass nur Decks mit `MIN_ZIELSPIELER=8` und Anker mit `MIN_ANZEIGE=30` in die Top 10 kommen. | DATEN | offen | |
| D14 | Kennzahl **Preise** | Für eine Beispielkarte den angezeigten „€"-Wert gegen `price_data.csv` nachrechnen; bestätigen, dass bei `no_trend`/`trend_below_low`/`eur_price==0`/`eur_low>eur_price` tatsächlich `eur_low` statt `eur_price` angezeigt wird (§8.3); eine Karte mit `mapping_status=collision` suchen und prüfen, was dann angezeigt wird. | DATEN | offen | |
| D15 | Kennzahl **Kartentrends** (▲/▼) | Für eine City-League-Karte den Pfeil gegen `getTrendIndicator()` nachrechnen (Schwellen ±2, Staple-Schutz bei >95 % und diff>−10); bestätigen, dass in `current-analysis` **keine** Pfeile erscheinen (nur `source==='cityLeague'`) — und dass wegen §10.1 auch im City-League-Reiter „aktuell" aktuell keine Pfeile erscheinen können. | DATEN | offen | |
| D16 | Kennzahl **Stichprobengrößen** im Block „Quellen & Methodik" | Angezeigte Zahlen (Gemeldete Listen/Turniere/Spieler) gegen `totalEntries = Σ new_count` und die rekonstruierte Feldgröße nachrechnen; Seite länger als 24 h offen lassen bzw. `sessionStorage`-Eintrag `ds_datenumfang_v1` manuell altern lassen → Block aktualisiert sich (`HOECHSTALTER_MS`). | DATEN | offen | |
| D17 | Kennzahl **Datenstand** („Daten: …") | Angezeigtes Datum je Reiter gegen `data/data_stand.json` abgleichen; bestätigen, dass das Datum aus dem **Git-Verlauf** kommt, nicht aus `Last-Modified`; für eine Datei ohne bekannten Stand prüfen, dass „unbekannt" und **nicht** das heutige Datum erscheint. | DATEN | offen | |
| D18 | Kennzahl **Pocket-Tierliste** | Eine Stufe in `pocket` gegen `data/pocket_tierlist.json` und die Game8-Quelle abgleichen; bestätigen, dass unbekannte Stufen ausgewiesen und nicht stillschweigend einsortiert werden; Datenstand gegen `pocket-tierlist.yml` prüfen — der Ablauf hat **keinen** Zeitplan, nur `workflow_dispatch`. | DATEN | offen | |
| D19 | Verwaiste Datei `labs_tournament_scraper.log` (0 B) | Bestätigen, dass die Datei tatsächlich leer und von keinem Feature referenziert ist — versehentlich unter `data/` abgelegtes Protokoll. | DATEN | offen | |
| D20 | Verwaiste Datei `online_tournament_scraper.log` (0 B) | Analog D19. | DATEN | offen | |
| D21 | Verwaiste Datei `per_decklist_scraper.log` (0 B) | Analog D19. | DATEN | offen | |
| D22 | Verwaiste Datei `tournament_scraper.log` (139 B) | Analog D19. | DATEN | offen | |
| D23 | Verwaiste Datei `city_league_archetypes_comparison.html` (21 KB) | Bestätigen, dass kein Frontend-Code sie liest — einziger Treffer ist ein Dokumentationsverweis. | DATEN | offen | |
| D24 | Verwaiste Datei `data/datenluecken.json` | Bestätigen: `js/app-admin.js` liest sie (Admin-Reiter F10), aber **kein** Workflow erzeugt sie; aktueller Stand ist `anzahl: 0` vom 2026-08-31 — prüfen, wie alt er inzwischen ist. | DATEN | offen | |
| D25 | Verwaiste Datei `pokepricelab_worklist.csv` | Bestätigen, dass sie nur von `triage_pokepricelab_report.py` berührt wird, kein Frontend-Bezug. | DATEN | offen | |
| D26 | Verwaiste Datei `pokepricelab_verification.csv` | Bestätigen, dass Ablauf nur `workflow_dispatch` ist, kein Zeitplan. | DATEN | offen | |
| D27 | Verwaiste Datei `pokepricelab_catalog_index.csv` (4,7 MB) | Bestätigen, dass Dateistand seit 2026-08-17 unverändert ist. | DATEN | offen | |
| D28 | Verwaiste Datei `calibration/indy_2026_actuals.json` | Bestätigen, dass `tools/calibrate_meta_call_indy.py` in keinem Workflow steht. | DATEN | offen | |
| D29 | Verwaiste Datei `_archetype_mapping_gaps.json` | Bestätigen, dass `archetype_mapping_audit.py` in `weekly-full-update.yml:267–275` **nicht** aufgerufen wird. | DATEN | offen | |
| D30 | Verwaiste Datei `all_cards_database.json` (16 MB) | Bestätigen, dass das Frontend tatsächlich `all_cards_merged`/`cards_chunk_*` liest und diese Datei nur ein Zwischenprodukt ist. | DATEN | offen | |
| D31 | Verwaiste Datei `all_cards_merged.csv` (7 MB) | Bestätigen, dass das Frontend nur die `.json`-Fassung liest. | DATEN | offen | |
| D32 | Verwaiste Dateien `city_league_archetypes_comparison_M3.csv` / `city_league_analysis_M3.csv` (31 MB) | Bestätigen, dass beide im Frontend-Code nur als **Kommentar** erscheinen, nicht tatsächlich gelesen werden. | DATEN | offen | |
| D33 | Verwaiste Datei `meta_play_decks_cache.json` (534 KB) | Bestätigen, dass sie nur Scraper-Zwischenspeicher ist. | DATEN | offen | |
| D34 | Verwaiste Dateien `price_guide_6.json` / `products_singles_6.json` / `products_nonsingles_6.json` | Bestätigen, dass die Seite nur `price_data.csv` (über `cards_chunk_*`) liest, diese drei Dateien nur Zwischenstufen sind. | DATEN | offen | |
| D35 | Verwaiste Datei `testing_group_bootstrap.json` | Bestätigen, dass `index.html` sie referenziert, aber kein Ablauf sie pflegt (Stand 2026-08-17) — prüfen, ob Testing Groups (F14.105–112) davon betroffen sind. | DATEN | offen | |
| D36 | Verwaiste Dateien `offline-images-manifest.json` / `offline-manifest.json` | Bestätigen, dass der Dateistand (2026-08-17) hinter dem täglich neu gebauten Kartenbestand zurückliegt — Offline-Modus mit veraltetem Manifest testen. | DATEN | offen | |
| D37 | Praktisch tot: `labs_tournament_decks_TEF-PBL.csv` / `…_matchups_TEF-PBL.csv` | Bestätigen, dass beide geladen werden, aber nur **ein einziges** Turnier enthalten — Auswirkung auf die Aussagekraft der Major-Zahlen in F4/F16 einschätzen. | DATEN | offen | |
| D38 | Praktisch tot: `city_league_images.json` (38 KB) | Bestätigen, dass sie seit 2026-08-17 unverändert ist und zum leeren City-League-Zweig gehört (vgl. D39). | DATEN | offen | |
| D39 | Leere Rechnung: City League „aktuell" (4 Dateien nur Kopfzeile) | In den Reitern `city-league` und `city-league-analysis` im Modus „Current" bestätigen, dass tatsächlich keine Daten erscheinen (Stand laut `data_stand.json`: 2026-07-31); zusätzlich prüfen, dass die Kartentrend-Pfeile (D15) und `getCityLeagueDeckCountFallback` im Deck Builder entsprechend reagieren. | DATEN | offen | |
| D40 | Leere Rechnung: drei Konversionsspalten immer 0 (`labs_tournament_decks.csv`) | Bestätigen, dass `top8_conv_rate`/`top16_conv_rate`/`top32_conv_rate` in allen 4.713 Zeilen `0` sind und der Meta Call konsequent auf den Day-2-Ersatz umschaltet (§10.2); insbesondere `labsT8Boost` beobachten — er sollte strukturell auf 0 rechnen, wo der Ersatz nicht greift. | DATEN | offen | |
| D41 | Leere Rechnung: fünf Regeln als „Formatabdeckung" (`card_capability_interactions.json`) | Bereits unter D10 geprüft — hier zusätzlich bestätigen, dass Version und Datum (0.1, 15.05.2026) seither unverändert sind. | DATEN | offen | |
| D42 | Leere Rechnung: `data/datenluecken.json` zeigt „keine Lücken" | Admin-Reiter (F10) zeigt „Keine offene Lücke" — bestätigen, dass das an der fehlenden Erzeugung liegt (D24), nicht daran, dass tatsächlich keine Lücken bestehen. | DATEN | offen | |
| D43 | Leere Rechnung: `data/ace_specs.json` fehlt oder veraltet | Bestätigen, dass ohne diese Datei (39 Namen, Stand 2026-02-18) **jedes** generierte Deck ohne ACE SPEC gebaut würde — an einem generierten Deck (F3.28/F4.51) prüfen, ob ein ACE SPEC enthalten ist. | DATEN | offen | |
| D44 | Leere Rechnung: Max Consistency fällt für 15 von 27 Archetypen auf Alt-Pfad zurück | Für ein Deck mit < 3 gewichteten Listen (nicht Mega Excadrill, das hat 8) bestätigen, dass der Bauer **still** auf den Alt-Pfad (Stufen 0/0c/1/2/LRM) umschaltet, ohne dass die Oberfläche das kenntlich macht. | SPIELER, DATEN | offen | |
| D45 | Leere Rechnung: `prizepack_official_images.csv` veraltet trotz Sonntags-Ablauf | Dateistand der CSV (2026-08-17) gegen die JSON-Fassung (2026-09-07) und den tatsächlichen letzten Lauf von `prizepack-official-images.yml` abgleichen. | DATEN | offen | |
| D46 | Zwei Wege #1: Win Rate desselben Decks am Major | Für ein Deck mit hoher Unentschieden-Quote am Major (Referenzwert 10,98 %) die Zahl in `past-meta` (Matchpunkte) und auf der Archetyp-Karte in `current-meta` (S/(S+N+U)) nebeneinanderlegen → Abweichung von rund 5 Punkten bestätigen. | SPIELER, DATEN | offen | |
| D47 | Zwei Wege #2: Meta-Anteil, Donut vs. Tabelle | Für Mega Excadrill den Anteilswert im Donut (`feldGroesseAusAnteilen`) gegen den Wert in der danebenstehenden Tabelle (`share_numeric`) vergleichen — beide sollten nach der Reparatur übereinstimmen; bestätigen, dass ohne den rekonstruierten Nenner tatsächlich 8,1 % vs. 7,75 % aufgetreten wäre (Regressionstest). | SPIELER, DATEN | offen | |
| D48 | Zwei Wege #3: Meta-Anteil, dritte Fassung (`share_kumulativ` vs. `share_numeric`) | Für dasselbe Deck `share_kumulativ` aus `limitless_online_fenster.csv` gegen `share_numeric` aus `limitless_online_decks.csv` vergleichen und die im Dateikopf selbst genannte Nenner-Differenz (38.398 vs. 39.826) nachvollziehen. | DATEN | offen | |
| D49 | Zwei Wege #4: Top-8-Quote gewichtet vs. gezählt | Feldwert gewichtet (6,19 %) gegen gezählt (6,14 %) vergleichen; bestätigen, dass alle Ansichten seit dem 02.09.2026 einheitlich `gezaehlteZeilen()` folgen — **außer** `js/app-meta-call.js:6133`, das weiterhin `top8_conv_rate` liest, welches in allen Zeilen 0 ist (vgl. D40). | DATEN | offen | |
| D50 | Zwei Wege #5: `consistency_score` im Warum-Dialog, zwei Skalen | Für ein Deck im neuen Bauer (Skala 0–100) und ein Deck im Alt-Pfad (Skala 0–120, Tech-Boni ±18/−20) den „Why?"-Dialog öffnen und die jeweilige Skala prüfen; bestätigen, dass die Wahl allein davon abhängt, ob der Archetyp ≥ 3 Listen im Formatfenster hat (Mega Excadrill mit 8 Listen sollte den **neuen** Bauer nutzen). | SPIELER, DATEN | offen | |
| D51 | Zwei Wege #6: Max-Consistency-Bau, zwei Algorithmen | Für ein Deck im neuen (6-Phasen, Core 90/85/80 %) und ein Deck im Alt-Pfad (Stufen 0/0c/1/2/LRM, Core ≥75, Extended ≥40) den jeweils erzeugten Deckinhalt vergleichen; in der Konsole nach „Phase Y.2 declined" suchen, um den Umschaltpunkt sichtbar zu machen. | QA, DATEN | offen | |
| D52 | Zwei Wege #7: Win-Rate-Glättung, zwei Prioren | Auf einem Bildschirm (z. B. Deck-Kachel + Heatmap-Zelle desselben Decks gleichzeitig sichtbar) bestätigen, dass k=50 (Deck-Ebene) und k=20 (Matchup-Ebene) nebeneinanderstehen, ohne dass ein Hinweis auf den Unterschied hinweist. | SPIELER, DATEN | offen | |
| D53 | Zwei Wege #8: Zähler der Deck-Glättung, `games` vs. Listen | Für Dragapult (oder ein anderes Deck mit großem Unterschied Listen/Partien) `deck.new_count` (Listen, 3.138) gegen die tatsächlichen Partien (14.861) vergleichen; bestätigen, dass der Tooltip korrekt „aus N Listen" schreibt, während die Formel intern `games` nennt — Wirkung auf die Glättungsstärke (≈4,7×) nachvollziehen. | DATEN | offen | |
| D54 | Zwei Wege #9: Archetyp-Zuordnung, Python vs. JavaScript | Für eine Karte mit Set-Kürzel oder „ex" im Namen (nicht Mega Excadrill, dort ist die Normalisierung trivial) bestätigen, dass die Python-Signatur (Symbole, `archetype_matcher.py`) und die JS-Normalisierung (`app-meta-cards.js`) zum selben Ergebnis kommen; die vier Paare in `archetype_aliases.json` gezielt gegenprüfen. | DATEN | offen | |
| D55 | Zwei Wege #10: Formattor für Decklisten, `currentMeta`/`cityLeague` vs. `past-meta` | Für ein im Vorformat übernommenes Deck (Referenz Alakazam Dudunsparce, 61 von 75 Listen aus dem Vorformat) bestätigen, dass `past-meta` **kein** Datumstor anwendet, während `currentMeta`/`cityLeague` auf `in_person_legal_date` filtern — mit Mega Excadrill (nur Worlds-Listen, alle nach dem Formatbeginn) den Unterschied gegenprüfen, dass dort beide Pfade dieselbe Grundmenge nutzen. | SPIELER, DATEN | offen | |

---

## Teil C — Hypothesen (aus „Was mir aufgefallen ist")

| Nr | Element | Was geprüft wird | Team | Status | Nachweis |
|---|---|---|---|---|---|
| H1 | Drei berechnete Listen der City League werden nie gezeichnet | In `city-league` (Format „Past", da „Current" leer ist, vgl. D39) bestätigen, dass **nur** die Tabelle „Popularity Decreases/Seltener gespielt" (Absteiger) erscheint und **keine** Tabelle/Ansicht für Aufsteiger, neue oder verschwundene Archetypen existiert — obwohl `increased`, `newArchetypes`, `disappeared` laut Code berechnet werden. Widerlegt, wenn irgendwo doch eine dieser drei Listen sichtbar ist. | QA, DATEN | offen | |
| H2 | Knopf „Meta-Analyse laden" in Deck Analysis (Global) benennt sich nie um | In `current-analysis` (F4.87) „Load Meta Analysis" anklicken und warten, bis die zwölf Kacheln geladen sind → prüfen, ob die Beschriftung auf „Reload"/„Erneut laden" wechselt (wie in `city-league-analysis`, F3.62) oder unverändert „Load Meta Analysis" stehen bleibt. Bestätigt, wenn sie stehen bleibt. | QA | offen | |
| H3 | Sortierung der Spalte „Deck" liest Ziffern als Zahl | In `current-meta`, Tabelle „Meta-Performance" (F15.9–16), die Spalte „Deck" anklicken: prüfen, ob im aktuellen Datensatz ein Deckname eine Ziffer enthält (z. B. eine Set-/Versionsangabe); falls ja, beobachten, ob Zeilen mit Ziffer numerisch und Zeilen ohne Ziffer als Text ans Ende sortiert werden, und ob die Startrichtung von der ersten Zeile abhängt statt konsistent A→Z zu beginnen. Ohne Ziffer im Datensatz bleibt die Hypothese unentscheidbar — das im Nachweis vermerken. | QA, DATEN | offen | |
| H4 | Tote Einträge in `PROFILE_SUBTAB_FOR_HASH` | `#hub`, `#uebersicht` und `#overview` einzeln in der Adressleiste aufrufen: `#hub`/`#uebersicht` sollten zu `meta-analysis-hub` führen (nicht zu einem Profil-Untertab); `#overview` sollte **nirgendwohin** führen und auch keine Konsolenmeldung erzeugen (stiller Tieflink ins Leere). Bestätigt, wenn `#overview` tatsächlich wirkungslos bleibt und still scheitert, statt wie sonst mit `[deep-link] no tab element for …` in der Konsole aufzufallen. | QA | offen | |
| H5 | Abschnitt „Datenumfang" hat keinen Tieflink | `#quellen-umfang` in der Adressleiste aufrufen → prüfen, ob die Seite `quellen` öffnet, aber der Abschnitt „Datenumfang" **nicht** aufklappt (Rückfall auf `Quellen.open('')`), im Gegensatz zu den funktionierenden Aliassen wie `#quellen-begriffe`. Bestätigt, wenn der Abschnitt zu bleibt. | QA | offen | |
| H6 | Kennzahlen ohne Definition daneben | Für „Matchup vs Top 20" (F4.21), „Total Win Rate Limitless Online Tournaments" (F4.20), „Avg Placement"/„Ø-Platzierung" (F3.10, F2.21 u. a.) und „Decks Used" (F3.9) prüfen, ob am jeweiligen Anzeigeort selbst (nicht nur unter Quellen & Methodik) eine Erklärung von Nenner/Schwelle/Rang-Grenze zu finden ist; zusätzlich beobachten, unter welcher Bedingung die Fußnote `cityLeagueStatDecksNote` (startet `hidden`) tatsächlich erscheint. | SPIELER | offen | |
| H7 | Zwei Datumsfelder auf denselben Zustand | In `meta-call` das Datum in `#metacallDateFrom` (F5.7) ändern, dann zu `current-analysis` wechseln und `#currentMetaDateFrom` (F4.7) prüfen → müssen denselben Wert und denselben Statustext zeigen; danach umgekehrt in `current-analysis` ändern und in `meta-call` prüfen. Widerlegt, wenn die beiden Felder auseinanderlaufen. | QA | offen | |
| H8 | Grenzen im Rechner: Markup und JS widersprechen sich | In `calculator`: „Cards in Deck" auf 99 setzen, dann versuchen, „Copies in Deck" über 60 zu setzen → prüfen, ob der Browser-Zähler bei 60 blockt, obwohl die Rechnung laut JS bis 99 zuließe. Ebenso: bei 5+ Kopien im Deck versuchen, „Already in Hand" über 4 zu setzen → prüfen, ob der Zähler bei 4 blockt. Bestätigt, wenn beide Grenzen tatsächlich am Markup-Maximum blocken. | QA | offen | |
| H9 | Menüpunkt „Startseite" führt nicht auf die Kachelseite | Im Pokéball-Menü auf „Overview / Startseite" (F0.10) klicken → prüfen, ob tatsächlich `current-meta` statt `meta-analysis-hub` geöffnet wird. Bestätigt, wenn die Kachelseite dabei **nicht** erreicht wird und nur über `#hub` direkt erreichbar bleibt. | QA | offen | |
| H10 | „Season pause"-Hinweis hängt an einer Inline-Angabe gegen eine CSS-Vorgabe | Prüfen, ob der Hinweis „📅 Season pause: …" erscheint, wenn „Current Meta" (Japan) leer ist (aktuell der Fall laut D39), und ob er verschwindet, sobald ein Turnier im aktuellen Fenster erscheint — und zwar **auf beiden** Stellen gleich (`city-league` **und** `city-league-analysis`, index.html:693 und :721). Zusätzlich: nach einer beliebigen Aktion, die die Blöcke neu zeichnet, erneut prüfen, ob der Hinweis noch sichtbar ist (Inline-`style`-Wert könnte zurückgesetzt worden sein). | QA, DATEN | offen | |
| H11 | Karten-Legende nur an einer von drei gleichen Ansichten | Die Kartengitter in `city-league-analysis` (#cityLeagueDeckGrid), `current-analysis` (mit Legende, F4.50) und `past-meta` (#pastMetaDeckGrid) nebeneinander prüfen: nur `current-analysis` hat die `<details>`-Legende „Was bedeuten die Symbole auf den Karten?", obwohl alle drei dieselben Plaketten/Knöpfe A–K zeichnen. Bestätigt, wenn die Legende tatsächlich nur in `current-analysis` existiert. | SPIELER | offen | |
| H12 | Fehler bleiben in der Konsole statt auf dem Bildschirm | Drei Fehlerpfade gezielt provozieren und dabei sowohl den Bildschirm als auch die Konsole beobachten: (a) Rangliste in `current-meta` nicht baubar → Bildschirm zeigt den Abschnitt „Meta-Performance" ersatzlos nicht, Konsole „Top-8-Block konnte nicht gerendert werden"; (b) `cityLeagueFilterSelect` nicht vorhanden → Konsole „cityLeagueFilterSelect not found …", Kartenübersicht bleibt leer ohne Meldung; (c) CSV für „Was gerade läuft" (F1.3) schlägt fehl → Block fehlt komplett ohne Meldung. Bestätigt, wenn der Bildschirm in allen drei Fällen ohne jede sichtbare Fehlermeldung bleibt. | QA | offen | |
| H13 | Kein Meta-Card-Analysis-Block in Past Meta | In `past-meta` bestätigen, dass — anders als in `city-league-analysis` (F3.49–63) und `current-analysis` (F4.75–88) — kein Block „Meta Card Analysis (Top 10 Archetypes)" existiert; einschätzen, ob das im Nutzererleben als Lücke auffällt (SPIELER-Perspektive: gezielt versuchen, den Block zu finden, ohne vorher zu wissen, dass er fehlt). | QA, SPIELER | offen | |
| H14 | Beschriftung „Deck ? Proxy" | An allen drei Stellen (`city-league-analysis` F3.42, `current-analysis` F4.64–73, `past-meta` F16.36–45) den Knopf „Deck → Proxy" ansehen, bevor und nachdem `js/i18n.js` sicher geladen hat (z. B. Seite mit geleertem Cache neu laden und den Ladeaugenblick beobachten) → prüfen, ob kurzzeitig „Deck ? Proxy" statt „Deck → Proxy" sichtbar ist, und ob der Zustand nach vollständigem Laden korrekt „→" zeigt. | QA | offen | |

---

## Teil D — Zählung

**Zeilen insgesamt: 546** (Teil A: 477 · Teil B: 55 · Teil C: 14).

Teil-A-Zeilen bilden alle 662 nummerierten Oberflächenelemente aus `audit/inventar-oberflaeche.md`
ab; wo das Inventar mehrere Nummern in einer Tabellenzeile bzw. einem Fließtextblock zu einem
Bereich zusammengefasst hat (z. B. „F3.13–F3.21" für 9 Typfilter), ist dieser Bereich unverändert
als eine Prüfzeile mit einer Handlung für alle enthaltenen Elemente übernommen — jede Nummer aus
dem Inventar erscheint damit genau einmal, entweder einzeln oder als Teil eines im Inventar selbst
gebildeten Bereichs.

**Zeilen je Team** (Mehrfachnennung möglich, Summe größer als 546):

| Team | Zeilen |
|---|---|
| QA (Technik) | 303 |
| SPIELER (Nutzersicht Mega Excadrill) | 137 |
| DATEN (Scraper/Datenbasis) | 149 |

**Zeilen je Teil:**

| Teil | Zeilen |
|---|---|
| Teil A — Oberflächenelemente (F0–F19) | 477 |
| Teil B — Datenprüfzeilen (D1–D55) | 55 |
| Teil C — Hypothesen (H1–H14) | 14 |
| **Gesamt** | **546** |

**Zeilen je Gruppe in Teil A:**

| Gruppe | Zeilen | Zugrundeliegende Inventar-Elemente |
|---|---|---|
| F0 | 35 | 35 |
| F1 | 17 | 17 |
| F2 | 22 | 22 |
| F3 | 56 | 74 |
| F4 | 70 | 101 |
| F5 | 37 | 37 |
| F6 | 18 | 18 |
| F7 | 16 | 16 |
| F8 | 5 | 5 |
| F9 | 10 | 15 |
| F10 | 12 | 12 |
| F11 | 40 | 48 |
| F12 | 17 | 17 |
| F13 | 13 | 13 |
| F14 | 30 | 119 |
| F15 | 30 | 38 |
| F16 | 21 | 47 |
| F17 | 2 | 2 |
| F18 | 3 | 3 |
| F19 | 23 | 23 |
| **Summe** | **477** | **662** |

**Zeilen je Kategorie in Teil B:**

| Kategorie | Zeilen |
|---|---|
| Kennzahl gegen Formel und Rohdatei (D1–D18) | 18 |
| Verwaiste Datei (D19–D38) | 20 |
| Leere Rechnung (D39–D45) | 7 |
| Zwei Rechenwege für dieselbe Zahl (D46–D55) | 10 |
