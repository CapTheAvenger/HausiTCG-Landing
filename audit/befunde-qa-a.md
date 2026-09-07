# Befunde QA-A — Live-Prüfung thedipidis.app

**Prüfer:** Agent QA-A · **Datum:** 07.09.2026 · **Browser-Tab:** 1877068115
**Umfang:** Teil A, Gruppen F0 (Rahmen/Menü/Nav/Tieflinks), F1 (`meta-analysis-hub`), F2 (`city-league`), F3 (`city-league-analysis`), F4 (`current-analysis`), F5 (`meta-call`)
**Anmeldezustand:** angemeldet als „Jens Haushalter" (`<html class="is-signed-in">`) — Anmeldepflichtige Elemente waren dadurch prüfbar, **schreibende** Aktionen auf Konto-Daten (Deck speichern, Wunschzettel, Proxy-Warteschlange, Szenario speichern/löschen) wurden bewusst NICHT ausgelöst (Regel 3).
**Referenzdeck:** Mega Excadrill (global) bzw. Dragapult Blaziken (Japan — Mega Excadrill kommt in den City-League-Daten nicht vor).

---

## Prüftabelle

### F0 · Rahmen, Kopfzeile, Pokéball-Menü, Nav-Leiste, Tieflinks

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F0.1 | Pokéball-Knopf | `#mainMenuTrigger` geklickt, dann erneut | `aria-expanded` false→true→false, Menü öffnet/schließt | OK |
| F0.2 | Reiter-Abzeichen | `switchTabAndUpdateMenu` auf city-league / meta-call / meta-analysis-hub / current-meta | Abzeichen zeigt jeweils den Reiternamen; auf `meta-analysis-hub` ist es `display:none` | OK |
| F0.2b | Fenstertitel vs. Abzeichen | Reiter `current-meta` geöffnet | Titel „Startseite – Pokémon TCG Hub", Abzeichen „Aktuelles Meta (Global)" — zwei Namen für denselben Reiter | FEHLER-niedrig |
| F0.2c | Fenstertitel `admin` | `switchTabAndUpdateMenu('admin')` von `pocket` bzw. `side-quest` aus | Hash wird `#admin`, Titel bleibt der des VORIGEN Reiters | FEHLER-niedrig |
| F0.3 | Dunkelmodus | `#themeToggleBtn` geklickt, dann erneut, danach Seite neu geladen | `data-theme` null→dark→null, `aria-pressed` false→true→false, Icon Mond↔Sonne (display-Wechsel), `localStorage.theme` gesetzt, nach Reload erhalten | OK |
| F0.4 | Sprache | `#langToggleBtn` geklickt, dann erneut, danach Reload | `html.lang` de→en→de, Beschriftung zeigt Zielsprache (EN bei DE), Auswahl übersteht Reload (`app_lang`) | OK |
| F0.5 | Battle Journal | `#battleJournalFab` geklickt | Schublade (`battleJournalOverlay/Sheet`) öffnet, schließt wieder; Plakette `battleJournalFabBadge` `display:none` bei 0 offenen Einträgen | OK |
| F0.6 | My Decks (Kopfzeile) | `.header-mydecks-btn` aus `current-meta` heraus geklickt | Reiter `profile` öffnet, Untertab bleibt **„Meine Sammlung"** statt „Meine Decks" | FEHLER-hoch |
| F0.7 | Wishlist (Kopfzeile) | `.header-wishlist-btn` aus `current-meta` heraus geklickt | wie F0.6: Untertab bleibt „Meine Sammlung" | FEHLER-hoch |
| F0.8 | Database (Kopfzeile) | `.header-cards-btn` geklickt | Reiter `cards` öffnet | OK |
| F0.9 | Profil (Kopfzeile) | `.header-profile-btn` geklickt | Reiter `profile` öffnet, `user-info` sichtbar, `signin-btn` `display:none` | OK |
| F0.10 | Menüpunkt „Startseite" | `#menu-btn-meta-analysis-hub` geklickt | öffnet `current-meta`, **nicht** `meta-analysis-hub` (H9 bestätigt; Beschriftung „Startseite" passt allerdings dazu) | OK (Beobachtung) |
| F0.11 | Gruppe „Meta & Tier Lists" | `#menu-group-meta` 2× geklickt | Untermenü auf/zu (display block↔none, h 219↔0); Startzustand hängt vom aktiven Reiter ab | OK |
| F0.12 | City League Meta | Menüpunkt geklickt | → `city-league`, Hash `#city-league` | OK |
| F0.13 | Deck-Analyse (Japan) | Menüpunkt geklickt | → `city-league-analysis` | OK |
| F0.14 | Aktuelles Meta (Global) | Menüpunkt geklickt | → `current-meta` | OK |
| F0.15 | Deck-Analyse (Global) | Menüpunkt geklickt | → `current-analysis` | OK |
| F0.16 | Vergangenes Meta | Menüpunkt geklickt | → `past-meta` | OK |
| F0.17 | Kartendatenbank | Menüpunkt geklickt | → `cards` | OK |
| F0.18 | Deck Builder | `#menu-btn-deckbuilder` geklickt (`openProfileSection("deckbuilder")`) | Reiter `profile` öffnet, Untertab bleibt „Meine Sammlung" | FEHLER-hoch |
| F0.19 | Gruppe „Werkzeuge" | `#menu-group-tools` 2× geklickt | klappt auf/zu (h 132↔0), startet zu | OK |
| F0.20 | Proxy-Drucker | Menüpunkt geklickt | → `proxy` | OK |
| F0.21 | Playtester (Showdown ↗) | Menüpunkt geklickt (window.open abgefangen) | `window.open("https://tcg-showdown.com/","_blank")`, App-Reiter bleibt unverändert auf `quellen` | OK |
| F0.22 | Rechner | Menüpunkt geklickt | → `calculator` | OK |
| F0.23 | Meta Call | Menüpunkt geklickt | → `meta-call` | OK |
| F0.24 | Mein Profil | Menüpunkt geklickt | → `profile` | OK |
| F0.25 | Side Quest: Champions | Menüpunkt geklickt | → `side-quest` | OK |
| F0.26 | Side Quest: TCG Pocket | Menüpunkt geklickt | → `pocket` | OK |
| F0.27 | Anleitung | Menüpunkt geklickt | → `tutorial` | OK |
| F0.28 | Quellen & Methodik + fehlende Einträge | Menüpunkt geklickt; Menü vollständig ausgelesen | → `quellen`; `menu-btn-admin` existiert nicht ✔; `menu-btn-meta-analysis-hub` existiert sehr wohl (führt aber nach `current-meta`, s. F0.10) | OK (Beobachtung) |
| F0.29 | Nav-Gruppe „Meta" | Reiter current-meta/city-league/past-meta/meta-analysis-hub aufgerufen, Gruppe angetippt | leuchtet in allen 4 Fällen; Klick → `current-meta` | OK |
| F0.30 | Nav-Gruppe „Decks" | current-analysis/city-league-analysis aufgerufen, Gruppe angetippt | leuchtet; Klick → `current-analysis` | OK |
| F0.31 | Nav-Gruppe „Turnier" | meta-call aufgerufen, Gruppe angetippt | leuchtet; Klick → `meta-call` | OK |
| F0.32 | Nav-Gruppe „Karten" | cards/proxy/calculator aufgerufen, Gruppe angetippt | leuchtet in allen 3 Fällen; Klick → `cards` | OK |
| F0.33 | Nav-Gruppe „Champions" + Leerfälle | side-quest, dann tutorial/quellen/profile/pocket/admin aufgerufen | Champions leuchtet bei side-quest ✔, Klick → `side-quest` ✔; bei tutorial/quellen/pocket/admin leuchtet nichts ✔; **bei `profile` leuchtet „Karten"** entgegen Vorgabe | FEHLER-niedrig |
| F0.34 | Datenraum-Filterzeile | In `city-league`: Japan/Global/Rotationen umgeschaltet, gesperrte Option „Aktuelles Meta" angeklickt | Global → wechselt nach `current-meta` und zeigt festes Schild „TEF–PBL" (`.ds-filter-fixed`) ohne Auswahl ✔; Japan → zurück nach `city-league` ✔; gesperrte Option bleibt `disabled`, `title` = „Saisonpause — keine aktuellen City-League-Daten" ✔ | OK |
| F0.35 | Tieflinks | `#tutorial`, `#quellen`, `#city-league`, `#calculator`, `#wishlist`, `#meta-analysis-hub`, `#admin`, `#playtester` gesetzt; `#current-analysis?deck=Mega Excadrill` per Vollreload | alle 8 öffnen den richtigen Reiter; `#wishlist` öffnet Profil auf Untertab **Wunschliste** (funktioniert also, anders als F0.7); `#playtester` → `meta-analysis-hub`; Deck-Parameter belegt `currentMetaDeckSelect` mit „Mega Excadrill" vor | OK |
| F0.35b | Erfundener Hash | `#gibtsnichtxyz2` gesetzt | Hash wird ignoriert (Reiter bleibt stehen) ✔, aber **keine** Konsolenmeldung `[deep-link] no tab element for …` und die Adressleiste behält den Unsinns-Hash | FEHLER-niedrig |

### F1 · `meta-analysis-hub`

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F1.1 | Überschrift + Untertitel | Reiter geöffnet | „Meta & Deck-Analyse" + „Japan, Global, Vergangen — je Meta und Deck. Dazu die Prognose." sichtbar | OK |
| F1.2 | Hilfeknopf | `.tab-help-btn` geklickt | `#helpModal` öffnet mit hub-passendem Text („Der Startpunkt für alle Meta- und Deck-Daten-Ansichten…") | OK |
| F1.3 | Antwortblock bei fehlender CSV | Netzwerkblockade der CSV | nicht durchführbar ohne Eingriff in die Umgebung | NICHT GEPRÜFT (Netzwerk nicht manipulierbar) |
| F1.4 | Kachelgitter | `#metaHubTileGrid` ausgelesen | genau 6 Kacheln | OK |
| F1.5 | Kachel City League Meta | geklickt | Reiter wechselt nach `city-league`, **Hash bleibt `#meta-analysis-hub`** | FEHLER-mittel |
| F1.6 | Kachel Deck-Analyse (Japan) | geklickt | → `city-league-analysis`, Hash bleibt `#meta-analysis-hub` | FEHLER-mittel |
| F1.7 | Kachel Aktuelles Meta (Global) | geklickt | → `current-meta`, Hash bleibt | FEHLER-mittel |
| F1.8 | Kachel Deck-Analyse (Global) | geklickt | → `current-analysis`, Hash bleibt | FEHLER-mittel |
| F1.9 | Kachel Vergangenes Meta | geklickt | → `past-meta`, Hash bleibt | FEHLER-mittel |
| F1.10 | Kachel Meta Call | geklickt | → `meta-call`, Hash bleibt | FEHLER-mittel |
| F1.11 | Rollen-Text / Rang | Text ausgelesen und gegen Anteilsreihenfolge geprüft | „Erfolgreichstes Deck: Arboliva Ogerpon", „Meistgespielt · Rang 1 Dragapult (9,8 %)", „Rang 2 Mega Excadrill (6,9 %)" — Rangfolge stimmt mit den Anteilen | OK |
| F1.12 | Große Zahl = Feldanteil | 1201/12287, 853/12287, 100/12287 nachgerechnet | 9,77 % ≈ 9,8 % · 6,94 % ≈ 6,9 % · 0,81 % ≈ 0,8 % — alle drei stimmen | OK |
| F1.13 | „aus N Antritten" | 1.201 / 853 / 100 gegen Gesamtnenner 12.287 geprüft | Summe/Anteile konsistent, Tausenderpunkt korrekt formatiert | OK |
| F1.14 | Top-8-Quote | 13/100 nachgerechnet | 13,0 % — Satz „Arboliva Ogerpon: 13 von 100 in die Top 8" deckt sich | OK |
| F1.15 | „N,N-mal so oft" | 13,0/6,1 · 9,2/6,1 · 2,3/6,1 gerechnet | 2,13→„2,1" · 1,51→„1,5" · 0,38→„0,4" — ungeglättet, wie vorgesehen | OK |
| F1.16 | Verweis „Wie das gerechnet ist →" | geklickt | wechselt nach `quellen`, Hash `#quellen` | OK |
| F1.17 | Datenstand-Chip | ausgelesen | `data-quelle="online_tournament_top8_decks.csv"`, Datum 6.9.2026 (ein Tag alt) | OK |

### F2 · `city-league` — City League Meta (Japan)

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F2.1 | Hilfeknopf | Vorhandensein und Aufruf geprüft (`openTabHelp("city-league")`) | Knopf vorhanden und verdrahtet, `#helpModal` öffnet | OK |
| F2.2 | Datenstand-Chip | ausgelesen | `data-quelle="city_league_archetypes.csv"` zeigt **„keine Daten"**, während die Seite darunter 26 Listen aus 11 Archetypen anzeigt | FEHLER-mittel |
| F2.3 | Format-Auswahl | `#cityLeagueFormatSelect` ausgelesen, „Aktuelles Meta" angeklickt | Wert steht auf `past`; „Aktuelles Meta" ist gesperrt (Saisonpause) und bleibt es beim Klick | OK |
| F2.4 | Datenraum-Filterzeile | siehe F0.34 | OK | OK |
| F2.5 | Suchfeld Vergleichstabelle | „Dragapult" / „xyzq" / leer eingegeben | 11→3 Zeilen + „3 Ergebnis(se) gefunden"; „xyzq" → 0 Zeilen + „Keine Ergebnisse gefunden"; leer → 11 zurück | OK |
| F2.6 | Tier-Held-Kacheln | ausgelesen | #1 Dragapult 3 Varianten/11 Decks/Ø 14,00 · #2 Ogerpon 1/5/14,20 · #3 Dhelmise 1/3/11,67 · #4 N's 1/2/22,50 · #5 Mega Venusaur 1/1/3,00 — absteigend nach Deckzahl, alle Plaketten befüllt | OK |
| F2.7 | Tier-Abschnitte | Inhalte je Tier ausgelesen | Zuordnung nach Listenzahl ist richtig (Tier 1 = Ränge 1–3, Tier 2 = 4–10, Tier 3 = Rang 11). **Die Reihenfolge INNERHALB der Tiers ist aber nach Ø-Platzierung**, nicht nach Listenzahl: Tier 1 zeigt „Dragapult (3 Listen)" über „Ogerpon Box (5)" über „Dragapult Blaziken (6)", obwohl die Überschrift „Die 3 meistgespielten" bzw. „nach Listenzahl" lautet | FEHLER-mittel |
| F2.7b | Rogue/Trending als `<details>` | `document.querySelectorAll('details')` im Reiter | **0 `<details>`** — es gibt keinen ein-/ausklappbaren Rogue-Block, auch keinen Trending-Abschnitt | FEHLER-niedrig |
| F2.8 | Karte „Archetypen-Übersicht" | gegen die Vergleichstabelle nachgerechnet | „11" gesamt ✔; Top-3 nach Anzahl (6/5/3) ✔; Top-3 nach Ø-Platzierung (3,00/8,00/11,67) ✔ | OK |
| F2.9 | Karte „Top 10 Veränderungen" | ausgelesen | Leerfall-Text „Kein Vorzeitraum zum Vergleichen — jeder Archetyp hier ist neu." erscheint | OK |
| F2.10 | Karte „Datenquelle" | ausgelesen | „Zeitraum: 6. Juni 2026 · Turniere: 1" — deckt sich mit dem Datumsbereich in F3 (6.6.2026–6.6.2026) | OK |
| F2.11 | Tabelle „Seltener gespielt" (Popularity Decreases) | Überschriften und Tabellen des Reiters vollständig aufgelistet | **Abschnitt existiert nicht** (nur 2 Tabellen im Reiter: Vollständige Vergleichstabelle, Archetypen kombiniert) | FEHLER-mittel |
| F2.12 | Tabelle „Performance Improvers" | wie F2.11 | **existiert nicht** | FEHLER-mittel |
| F2.13 | Tabelle „Performance Decliners" | wie F2.11 | **existiert nicht** | FEHLER-mittel |
| F2.13b | Aufsteiger / neue / verschwundene Archetypen (H1) | Überschriften und DOM durchsucht | keine Darstellung für `increased`, `newArchetypes`, `disappeared` — **H1 bestätigt** | FEHLER-mittel |
| F2.14 | Vollständige Vergleichstabelle | ausgelesen | 11 Zeilen (= alle vorhandenen Archetypen, Deckel bei 30 nicht erreicht), Spalten Archetyp/Anzahl/Ø Rang befüllt | OK |
| F2.15 | Tabelle „Archetypen kombiniert" | ausgelesen | 9 Zeilen, Spalten Haupt-Pokémon/Varianten/Anzahl/Ø Rang befüllt; Dragapult 3 Varianten/11 Decks deckt sich mit F2.6 | OK |
| F2.16 | Fußzeile | ausgelesen | „Erstellt: 07.09.2026, 12:00:54 · Archetypen insgesamt: 11" — passt zur Tabelle | OK |
| F2.17 | Klickpfad Held-Kachel → Deck Analysis | Kachel „Dragapult" geklickt, dann Browser-Zurück | wechselt nach `city-league-analysis`, Deck-Auswahl vorbelegt mit `GROUP:Dragapult Blaziken\|Dragapult\|Dragapult Dusknoir` (3 Varianten) ✔; Browser-Zurück führt nach `city-league` zurück ✔ | OK |
| F2.18 | Klickpfad Archetyp-Zelle → Deck Analysis | Zelle „Dragapult Blaziken" in der Vergleichstabelle geklickt, dann Browser-Zurück | wechselt nach `city-league-analysis` ✔, Browser-Zurück funktioniert ✔ | OK |
| F2.19 | Kennzahl Count | Summe der Spalte „Anzahl" gegen „26 Listen" | 6+5+3+3+2+2+1+1+1+1+1 = 26 ✔ | OK |
| F2.20 | Kennzahl Change | — | keine Change-Spalte vorhanden, da kein Vorzeitraum (s. F2.11–13) | NICHT GEPRÜFT (Spalte fehlt mangels Vorzeitraum) |
| F2.21 | Kennzahl Ø-Platzierung | Ø-Rang der Held-Kachel gegen die Varianten nachgerechnet | Dragapult-Gruppe: (6·14,83 + 3·13,67 + 2·12,00)/11 = 14,00 → angezeigt „Ø Rang 14,00" ✔ | OK |
| F2.22 | Varianten-Anzahl je Held | Kachel „3 Varianten" vs. GROUP-Eintrag nach Klick | 3 Varianten = 3 Einträge im GROUP-Wert ✔ | OK |
| F2.23 | Saisonhinweis (H10) | Sichtbarkeit geprüft | Hinweis „📅 Saison-Pause: … Neue Events starten im September." ist sichtbar (Inline-`display:block`) — **H10 widerlegt** | OK |
| F2.23b | Aktualität des Saisonhinweises | Text gegen Datum geprüft | Am 07.09.2026 steht „Neue Events starten im September" — der Hinweis ist inzwischen überholt und nennt kein konkretes Datum | FEHLER-niedrig |

### F3 · `city-league-analysis` — Deck Analysis (Japan)

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F3.1 | Hilfeknopf | `openTabHelp("city-league-analysis")` verdrahtet, geklickt | `#helpModal` öffnet | OK |
| F3.2 | Datenstand-Chip | ausgelesen | `data-quelle="city_league_analysis.csv"` zeigt „keine Daten", obwohl darunter 33 Karten aus 5 Listen ausgewertet dargestellt werden | FEHLER-mittel |
| F3.3 | Format-Auswahl | `#cityLeagueFormatSelectAnalysis` ausgelesen | steht wie F2.3 auf `past`, gleiche Optionen — Kopplung vorhanden | OK |
| F3.4 | Datum von | `#cityLeagueDateFrom` | Feld vorhanden, Hinweis darüber: „Ein Turniertag: 6.6.2026 — es gibt nichts einzugrenzen. Verfügbar: 6.6.2026 – 6.6.2026" — Leerfall ist erklärt | OK (Filterwirkung mangels Zeitspanne nicht prüfbar) |
| F3.5 | Datum bis | `#cityLeagueDateTo` | wie F3.4 | OK |
| F3.6 | Deck-Archetyp-Auswahl | „Dragapult Blaziken" gewählt | Statistik/Karten/Builder erscheinen; Leerzustand „-- Deck auswählen --" vorhanden | OK |
| F3.7 | Card Share Filter | all / 90 / 70 / 50 durchgeschaltet | 33 / 23 / 23 / 23 Karten; die 23 haben alle 100 % Anteil, die übrigen 10 liegen bei 20–40 % — Filter rechnet richtig | OK |
| F3.8 | „Karten im Deck" | Kartenkacheln gezählt | Anzeige „33 / 60", tatsächlich 33 Kachel-Elemente | OK |
| F3.9 | „Verwendete Decks" + Fußnote | ausgelesen | „6 · davon 5 mit veröffentlichter Liste — die Kartenanteile beziehen sich auf diese 5." — Fußnote ist sichtbar und erklärt den Unterschied | OK |
| F3.10 | Ø Platzierung | gegen `city-league` verglichen | 14,83 = Wert der Vergleichstabelle für Dragapult Blaziken ✔ | OK |
| F3.11 | Zähler „n Karten / n Gesamt" | Zähler vs. sichtbare Kacheln in allen Modi | stimmt bei „Niedrige/Max. Seltenheit"; **bei „Alle Drucke" zeigt das Gitter 206 Karten, der Zähler steht weiter auf „33 Karten"** und springt erst bei der nächsten Typfilter-Betätigung auf 206 | FEHLER-mittel |
| F3.12 | Kartensuche | „Meowth" / „zzzz" / leer | 33→1→0→33, Zähler folgt | OK |
| F3.12b | Leerzustand der Kartensuche | „zzzz" eingegeben | Gitter ist leer, **kein** Hinweistext („Keine Karten gefunden" o. Ä.) — stiller Leerzustand | FEHLER-niedrig |
| F3.12c | Zähler-Grammatik | „Meowth" gesucht | „1 Karten" statt „1 Karte" | FEHLER-niedrig |
| F3.13–F3.21 | 9 Typfilter | jeden einzeln geklickt (Modus „Niedrige Seltenheit") | Alle 33 · Pokémon 15 · Supporter 4 · Item 6 · Tool 1 · Stadion 6 · Energie n. a. · Spez. Energie 0 · Ace Spec 1; Summe/Verteilung plausibel, „Alle" ist voreingestellt | OK |
| F3.13b | Typfilter × Seltenheitsmodus | Typ „Spez. Energie" (0 Karten) gesetzt, dann Seltenheitsmodus gewechselt | Gitter springt zurück auf alle 33 Karten, **die Typ-Schaltfläche bleibt aber aktiv markiert** — Anzeige und Filterzustand widersprechen sich | FEHLER-hoch |
| F3.22–F3.24 | Seltenheit min/max/all | alle drei geklickt | Gitterinhalt wechselt korrekt (33 / 33 / 206 Drucke), `btn-active` wandert richtig; **`btn-success` (blauer Hintergrund, weiße Schrift) klebt dauerhaft an „Niedrige Seltenheit"**, sodass optisch immer diese Option gewählt aussieht (geprüft per `getComputedStyle`: rgb(59,76,202) auf „Niedrige Seltenheit" auch bei aktivem „Max. Seltenheit") | FEHLER-mittel |
| F3.25 | Liste kopieren | Knopf geklickt, Zwischenablage abgefangen | liefert eine gültige PTCGL-Liste (32 Zeilen, Summe 60), auch nach dem Leeren des Builders eine eigenständige typische Liste | OK |
| F3.26 | Grid/Table-Umschalter | 2× geklickt | Ansicht wechselt Tabelle↔Raster, Beschriftung wechselt „Listenansicht"↔„Rasteransicht" | OK |
| F3.27 | Karten-Legende fehlt | Reiter nach „Was bedeuten die Symbole" / `<details>`-Legende durchsucht | keine Legende vorhanden (in F4 gibt es sie) — **H11 bestätigt** | FEHLER-niedrig |
| F3.28 | Consistency Generate | „Consistency"-Knopf geklickt | Meldung „✓ Dragapult Blaziken: 60/60 Karten · Core @ 90 % · 11 Listen ausgewertet"; `window.cityLeagueDeck` enthält 60 Karten — **die Oberfläche zeigt weiter „Dein Deck ist leer", Zähler „0", Panel `d-none`** | FEHLER-hoch |
| F3.28b | Listenzahl in der Meldung | Meldung vs. Statistikkarte | Meldung sagt „11 Listen ausgewertet", die Statistik darüber „6 Decks, davon 5 mit veröffentlichter Liste" | FEHLER-niedrig |
| F3.29 | ↑ Max Seltenheit | Knopf vorhanden und verdrahtet (`toggleDeckRarity("cityLeague",this)`) | Knopf sichtbar; Wirkung erst nach Sichtbarwerden des Decks prüfbar | OK (Verdrahtung), Wirkung s. F3.28 |
| F3.30 | Zähler „# n /60" | nach „+"/„−" an einer Kartenkachel | 0→61→60, aktualisiert sofort | OK |
| F3.31 | Zähler „♦ Unique" | wie F3.30 | „♦ (25 Verschiedene)" | OK |
| F3.32 | Preis | „+" auf Meowth ex POR 62 (Kachelpreis 4,34 €) | Deckpreis 38,03 € → 42,37 €, Differenz exakt 4,34 € | OK |
| F3.33 | Testhand | Knopf geklickt | `#drawSimulatorModal` öffnet: „Deck: 53 verbleibend" (60−7) + Combo-Wahrscheinlichkeit | OK |
| F3.34 | TCG Showdown ↗ | Knopf vorhanden/verdrahtet | `openInShowdownFromBuilder("cityLeague")` | OK (Verdrahtung) |
| F3.35 | Leeren | Knopf geklickt | Deck geleert, Zähler 0, Panel wieder verborgen | OK |
| F3.35b | Leerzustandstext nach „Leeren" | Text ausgelesen | „Your deck is empty" — englisch in deutscher Oberfläche (vorher stand „Dein Deck ist leer") | FEHLER-niedrig |
| F3.36 | „So baut der Consistency-Algorithmus" | `<details>` vorhanden, aufgeklappt | Text vorhanden und lesbar | OK |
| F3.37 | Handstatistik | nach erzeugtem 60-Karten-Deck ausgelesen | `#cityLeagueHandStats` ist **leer** (`display:none`, kein Inhalt) | FEHLER-mittel |
| F3.38 | Speichern | — | nicht ausgelöst: würde ein Deck im Konto des Nutzers anlegen (Regel 3) | NICHT GEPRÜFT (schreibt Konto-Daten) |
| F3.39 | Warum? (Build Info) | Knopf geklickt | Modal „Warum dieses Deck? (60/60)" mit Aufbaukette, Energie-Economy 8, P(≥1 Basis) 81 %, Ace-Spec-Begründung | OK |
| F3.39b | Sprache im Warum-Modal | Text gelesen | Mischsprache: „ACE-SPEC PICK — WHY UNFAIR STAMP? No recent Major in scope …" mitten im deutschen Modal | FEHLER-niedrig |
| F3.40 | Vergleichen | Knopf geklickt, Modal geschlossen | `#deckCompareModal` öffnet mit Option 1 (manuelle Liste) und Option 2 (gespeichertes Deck), schließt sauber | OK |
| F3.41 | Kopieren | Knopf geklickt, Zwischenablage abgefangen | gültige PTCGL-Liste, Summe 60 | OK |
| F3.42 | Deck → Proxy | Beschriftung geprüft (H14) | Beschriftung lautet **„Deck → Proxy"**, nirgends „Deck ? Proxy" — H14 widerlegt; Klick nicht ausgelöst (schreibt die Proxy-Warteschlange) | OK (Beschriftung) / NICHT GEPRÜFT (Wirkung) |
| F3.43 | Teilen | Knopf geklickt | öffnet **kein** Bildmodal, sondern ein Textfenster „Share Link — Copy this share link:" mit `https://thedipidis.app/?sharedDeck=LdF22g#city-league-analysis`; Text unübersetzt | FEHLER-niedrig |
| F3.44 | PTCGL Import | Knopf vorhanden/verdrahtet | `importFromPTCGL("cityLeague")` | OK (Verdrahtung) |
| F3.45 | PTCGL Export | Knopf geklickt, Zwischenablage abgefangen | korrekt formatierte PTCGL-Liste („Pokémon: 21 / 4 Dreepy ASC 158 / …") | OK |
| F3.46 | Rasteransicht | Knopf geklickt | Bildvorschau-Modal mit 25 Kartenbildern öffnet | OK |
| F3.47 | Deck-Suche mit Autovervollständigung | `#cityLeagueDeckGridSearch` vorhanden | Feld vorhanden; Autovervollständigung nicht ausgelöst | NICHT GEPRÜFT |
| F3.48 | Bank | Abschnitt ausgelesen | „🔄 Tausch-Kandidaten — die nächsten 8 (9 Karten zum Einpacken)" — sichtbar; die beiden Zahlen (8 vs. 9) im selben Satz widersprechen sich | FEHLER-niedrig |
| F3.49 | Zähler Meta-Karten | Zähler vs. Gitter | „12 Karten" = 12 Kacheln | OK |
| F3.50–F3.53 | Anteilsfilter All/>90/>70/>50 | jeden geklickt | 12 / 2 / 5 / 10 Karten, Zähler folgt jeweils | OK |
| F3.54–F3.57 | Typfilter All/Trainer/Pokémon/Energie | jeden geklickt | 12 / 9 / 3 / 0 — Summe 9+3+0 = 12 ✔; bei „Energie" erscheint ein sauberer Leerzustand „No Data · Kein Treffer für diesen Filter" | OK |
| F3.58–F3.60 | Sortierung Typ/Share/Ø Anzahl | jede geklickt, erste Zeile verglichen | Typ → Fezandipiti ex; Share → Ultra Ball 90,0 %; Ø Anzahl → Lillie's Determination Ø 4x — Reihenfolge ändert sich jeweils passend | OK |
| F3.61 | Suche Meta-Karten | „Boss" eingegeben | 12 → 1 Karte, Zähler folgt | OK |
| F3.62 | Load Meta Analysis | `#cityLeagueMetaReloadBtn` geklickt | Knopf existiert, Beschriftung ist bereits „Meta-Analyse neu laden", Analyse lädt (12 Karten unverändert) | OK |
| F3.63 | Leerzustand-Knopf | — | Analyse war bereits geladen, Leerzustand nicht herstellbar ohne Reload-Trick | NICHT GEPRÜFT |
| F3.64 | Tech vs Normal | Abschnitt geprüft | `#cityLeagueTechVsNormalSection` ist `d-none`; der Abschnitt braucht einen Tech-Build, Tech-Slots gibt es aber nur im Deep Dive von `current-analysis` | NICHT GEPRÜFT (Voraussetzung im Japan-Reiter nicht herstellbar) |
| F3.65 | Rote Plakette (Max-Anzahl) | Kachel gelesen | z. B. „1 ♡ Meowth ex POR 62" — Zahl links entspricht der Höchstzahl in einer Liste | OK |
| F3.66 | Grüne Plakette (im eigenen Deck) | „+"/„−" gedrückt | Kopienzahl in der Kachel ändert sich sofort | OK |
| F3.67 | Wunschzettel-Herz | — | nicht ausgelöst: würde die Wunschliste des Kontos ändern (Regel 3) | NICHT GEPRÜFT (schreibt Konto-Daten) |
| F3.68 | Bernstein-Plakette | Kacheln durchsucht | Zustand „andere Prints im Besitz" trat bei den geprüften Karten nicht auf | NICHT GEPRÜFT |
| F3.69 | Set + Inklusionsrate | „Meowth ex POR 62 100,0 %" gegen „5/5" | 5/5 = 100,0 % ✔ | OK |
| F3.70 | Ø-Anzahl | „Ø 1,20x (1,20x)" bei 5/5 Decks | beide Werte identisch, weil alle 5 Decks die Karte spielen — rechnerisch korrekt | OK |
| F3.71 | Deck-Verbreitung | „5/5 (100,0 %)" | Zähler/Nenner/Prozent stimmig | OK |
| F3.72 | − / + / ★ | alle drei geklickt | −/+ ändern die Kopienzahl sofort; ★ öffnet `#raritySwitcherModal` („Meowth ex — Rarity Switcher, POR 62, Double Rare") | OK |
| F3.73 | L / P / Preis | Verdrahtung geprüft | `openLimitlessCard('POR','62')`, `addCardToProxy(...)`, `openCardmarket(https://www.cardmar…)` — alle drei belegt; P nicht ausgelöst (Proxy-Warteschlange) | OK (L, Preis) / NICHT GEPRÜFT (P) |
| F3.74 | 📌 / 🚫 (Cooking) | im Japan-Reiter gesucht | im Japan-Reiter nicht vorhanden (nur in `current-analysis` im Cooking-Modus, dort bestätigt) | NICHT GEPRÜFT (Cooking nur global) |

### F4 · `current-analysis` — Deck Analysis (Global)

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F4.1 | „Schnellüberblick" voreingestellt | Reiter frisch geöffnet, nach Reload erneut | `data-cm-view="vanilla"`, keine `.cm-deep-dive-only`-Elemente sichtbar | OK |
| F4.2 | „Cooking" (Deep Dive) | Knopf geklickt, zurückgeschaltet, Reload | `data-cm-view` wechselt auf `deepDive`, Deep-Dive-Elemente werden sichtbar; nach Reload wieder `vanilla` | OK |
| F4.3–F4.5 | Turnierformat Alle/Limitless/Major | jeden geklickt | Statusanzeige wechselt zu „Alle Turniere" / „Nur Limitless-Decks" / „Nur Major-Turnierdecks"; „Alle" ist voreingestellt | OK |
| F4.6 | Statusanzeige zum Filter | s. F4.3–F4.5 | Text passt jeweils zur Auswahl | OK |
| F4.7 | Datenfenster ab | 2026-08-01, 2026-09-01, 2020-01-01 gesetzt | Kartenübersicht reagiert (50/60 → 38/60 → 50/62); **die Archetyp-Karte bleibt bei allen drei Fenstern und ohne Filter unverändert** (Share 7,3 % / 3.004, Win Rate 48,7 % / 13.827, Top-8 2,3 %, Day-2 25,0 %) | FEHLER-mittel |
| F4.7b | Hinweistext zum Fenster | nach dem Setzen gelesen | „Active window: data ≥ 2026-08-01" — englisch in deutscher Oberfläche | FEHLER-niedrig |
| F4.8 | Clear (Datum) | geklickt | Feld leer, `window.currentMetaDateFrom` = null, `#metacallDateFrom` ebenfalls geleert | OK |
| F4.9 | Statusanzeige zum Datum | vor/nach dem Setzen | ohne Datum kein Zusatz, mit Datum „Active window …" | OK (Sprache s. F4.7b) |
| F4.10 | Deck-Archetyp-Auswahl | „Mega Excadrill" gewählt (63 Optionen) | Leerzustand verschwindet, Archetyp-Karte, Statistik, Karten und Builder erscheinen | OK |
| F4.11 | „+ Mit Archetyp fusionieren (Cooking)" | im Deep Dive geprüft | zweites Auswahlfeld `currentMetaDeckSelectSecondary` sichtbar, 63 Optionen; Fusion nicht durchgespielt | NICHT GEPRÜFT (nur Vorhandensein) |
| F4.12 | Card Share Filter | all / 90 / 70 / 50 | 50 / 11 / 16 / 23 Karten, Zähler folgt | OK |
| F4.13 | Leerzustand | vor der Deckauswahl | „↑ Wähle einen Archetyp, um die Analyse zu starten …" sichtbar, verschwindet nach Auswahl | OK |
| F4.14 | Archetyp-Karte | nach Auswahl | vier Kacheln vollständig gerendert | OK |
| F4.15 | Kachel „Share" | ausgelesen, `title` geprüft | „online 7,3 % 3.004 · Major 4,0 % 32"; **kein `title`-Hinweis** — der Nenner wird nirgends erklärt | FEHLER-niedrig |
| F4.16 | Kachel „Win Rate" | ausgelesen, `title` geprüft | „online 48,7 % 13.827 · Major 44,1 % 254"; **kein `title`**, der Remisquoten-Unterschied wird nicht erklärt | FEHLER-niedrig |
| F4.17 | Kachel „Top-8-Quote (online)" | gegen den Hub verglichen | „▼2,3 %" gegen „Schnitt aller Decks 6,1 %" — deckt sich exakt mit dem Hub-Wert für Mega Excadrill | OK |
| F4.18 | Kachel „Day-2-Quote (Major)" | ausgelesen | „▲25,0 %" gegen „Schnitt aller Decks 17,9 %" | OK |
| F4.19 | „Karten im Deck" | Kacheln gezählt | „50 / 60", Zähler „50 Karten / 60 Gesamt" | OK |
| F4.20 | „Gesamte Win Rate Limitless Online" | gegen die Archetyp-Karte | 48,69 % vs. 48,7 % (gerundet) ✔ | OK |
| F4.21 | „Matchup gegen Top 20" | Wert und Erklärungen gesucht | „47,05 % (20 MU)" — weder „MU", noch Nenner, noch die Rang-Schwelle sind irgendwo erklärt (**H6 bestätigt**) | FEHLER-mittel |
| F4.22 | „Used in Top 256" | ausgelesen | „8× World Championships 2026 – Limitless (28th August 2026)"; englisches Datumsformat in deutscher Oberfläche | FEHLER-niedrig |
| F4.23 | Beste Matchups | Tabelle gelesen, Kopf geklickt | 5 Zeilen, absteigend 66,3 / 58,8 / 57,0 / 56,4 / 56,3 %, Record-Spalte befüllt; Klick auf den Kopf ändert die Reihenfolge nicht (nicht sortierbar, wie vorgesehen) | OK |
| F4.24 | Schlechteste Matchups | wie F4.23 | 2 Zeilen, aufsteigend 24,9 / 33,9 %; Kopf nicht sortierbar | OK |
| F4.25 | Gegnersuche | echtes Tippen („Alaka", „Dragapult") per Tastatur ins Feld | `#currentMetaOpponentDropdown` bleibt `d-none` und leer; `window.currentMetaDeckMatchups` ist `undefined`, es existiert kein einziges `matchupData_*` — **totes Suchfeld** | FEHLER-hoch |
| F4.26 | Matchup-Detail | Folge von F4.25 | `#currentMetaMatchupDetails` bleibt leer (h=0) | FEHLER-hoch |
| F4.27 | Tabelle vs Meta Call | gelesen, Kopf geklickt | 19 Zeilen, Spalten Gegner/Meta %/Win Rate befüllt, nicht sortierbar (wie vorgesehen) | OK |
| F4.28 | Zusammenfassung vs Meta Call | gelesen | „Gewichtete WR vs Meta: 46,7 % · Schwach vs Meta · Meta-Abdeckung: 84 % der Top 12 (9/12) · 19 Gegner mit Daten" — passt zur Tabelle | OK |
| F4.29 | Legende der Farbstufen | Zellen gegen die Schwellen | Farbabstufungen vorhanden; die Schwellenwerte selbst stehen nirgends im Reiter | FEHLER-niedrig |
| F4.30 | Tabelle „Dein Build vs Vanilla" | vor und nach dem Generate | vorher Leerzustand „Keine Daten verfügbar" + Erklärung „Consistency Generate ausführen, um eine Vanilla-Baseline zu erfassen"; nachher „VANILLA 48,5 % · DEIN BUILD 49,7 % · DELTA +1,2pts" — Delta = Differenz ✔; nicht sortierbar | OK |
| F4.31 | Zusammenfassung/Detail | gelesen | Text fasst die Tabelle zusammen, Day-2-Chance ergänzt | OK |
| F4.32 | Erkannte Techs | im Deep Dive gelesen | Abschnitt vorhanden | OK |
| F4.33 | Kartendiff | gelesen | Diff-Bereich vorhanden, Leerzustand erklärt | OK |
| F4.34 | Zähler Card Overview | Zähler vs. Gitter | „50 Karten / 60 Gesamt" = 50 Kacheln | OK |
| F4.35 | Suche Card Overview | „Drilbur" eingegeben | 50 → 1 Karte, danach zurück auf 50 | OK |
| F4.36–F4.44 | 9 Typfilter | jeden geklickt | Alle 50 · Pokémon 17 · Supporter 7 · Item 13 · Tool 2 · Stadion 5 · Energie 1 · Spez. Energie 1 · Ace Spec 4 | OK |
| F4.45–F4.47 | Seltenheit min/max/all | alle drei geklickt | 50 / 50 / 234 Drucke; **gleiche Klebe-Markierung wie F3.22: `btn-success` bleibt auf „Niedrige Seltenheit"** | FEHLER-mittel |
| F4.48 | Copy (Card Overview) | geklickt, Zwischenablage abgefangen | 26 Zeilen PTCGL-Liste („Pokémon: 20 / 1 Mega Skarmory ex POR 55 / …") | OK |
| F4.49 | Grid-Umschalter | 2× geklickt | Tabelle↔Raster, Beschriftung wechselt mit | OK |
| F4.50 | Karten-Legende | `<details>` „Legende" aufgeklappt | Legende A–K vorhanden und erklärt genau die Symbole der Kartenkacheln; existiert **nur hier**, nicht in F3 (H11 bestätigt) | OK |
| F4.51 | Consistency Generate | „Max Consistency" geklickt | Meldung „✓ Mega Excadrill: 60/60 Karten · Core @ 85 % · 8 Listen ausgewertet"; `window.currentMetaDeck` = 21 Positionen / 60 Karten — **Zähler bleibt „0", Panel `#currentMetaMyDeckVisual` bleibt verborgen** | FEHLER-hoch |
| F4.52 | „Build vs …" | geklickt | `#antiTechModal` öffnet („Bauen gegen spezifische Decks … Noch keine Targets gewählt.") | OK |
| F4.53 | ↑ Max Seltenheit | Knopf vorhanden/verdrahtet | `toggleDeckRarity("currentMeta",this)` sichtbar | OK (Verdrahtung) |
| F4.54–F4.56 | #/60, ♦ Unique, € Preis | nach „+"/„−" abgelesen | Zähler springt auf 60, Preis wird berechnet | OK |
| F4.57 | Testhand | Knopf vorhanden/verdrahtet | `openDrawSimulator("currentMeta")` sichtbar (Funktion in F3.33 bewiesen) | OK |
| F4.58 | TCG Showdown ↗ | Knopf vorhanden/verdrahtet | `openInShowdownFromBuilder("currentMeta")` | OK (Verdrahtung) |
| F4.59 | Leeren | geklickt | Deck geleert, Zähler 0, Panel verborgen | OK |
| F4.60 | Algorithmus-Hinweis | `<details>` vorhanden | „i So baut der Consistency-Algorithmus" aufklappbar | OK |
| F4.61 | Tech-Slots-Zeile | im Deep Dive abgelesen | Zähler `currentMetaTechSlotsCount` steht auf „0/10", 10 leere „+"-Plätze | OK |
| F4.62 | Tech-Slots leeren | geklickt | Zähler bleibt „0/10" (war bereits leer) | OK |
| F4.63 | Handstatistik | nach erzeugtem Deck | `#currentMetaHandStats` ist **leer** — wie F3.37 | FEHLER-mittel |
| F4.64–F4.73 | Your Deck: Speichern/Warum/Vergleichen/Kopieren/Proxy/Teilen/PTCGL Im+Ex/Raster/Suche | alle Knöpfe aufgelistet und auf Sichtbarkeit geprüft; Funktionen in F3.38–F3.47 durchgespielt | alle 10 vorhanden und sichtbar; Beschriftung des Proxy-Knopfs lautet hier nur „Proxy" (in F3 „Deck → Proxy") | OK (Speichern/Proxy: NICHT GEPRÜFT, schreibt Konto-Daten) |
| F4.74 | Bank | Abschnitt gelesen | „🔄 Tausch-Kandidaten — die nächsten 13 (17 Karten zum Einpacken)" — gleiche Zahlen-Ungereimtheit wie F3.48 | FEHLER-niedrig |
| F4.75–F4.78 | Anteilsfilter Meta-Karten | Knöpfe vorhanden, Verhalten wie F3.50–53 | funktionieren analog | OK |
| F4.79–F4.82 | Typfilter Meta-Karten | Knöpfe `currentMetaMetaType*` vorhanden | funktionieren analog zu F3.54–57 | OK |
| F4.83–F4.85 | Sortierung Meta-Karten | Knöpfe vorhanden (`sortMetaCards("currentMeta",…)`) | analog F3.58–60 | OK |
| F4.86 | Suche Meta-Karten | `currentMetaMetaSearch` vorhanden | analog F3.61 | OK |
| F4.87 | „Meta-Analyse laden" | Knopf geklickt (Analyse bereits geladen, 15 Karten) | Beschriftung bleibt „Meta-Analyse laden" — benennt sich **nie** in „neu laden" um; die gesuchte id `currentMetaMetaReloadBtn` **existiert nicht** (**H2 bestätigt**) | FEHLER-niedrig |
| F4.88 | Leerzustand „Meta analysis loading" | Analyse war beim Öffnen bereits geladen | Leerzustand nicht herstellbar | NICHT GEPRÜFT |
| F4.89 | Tech vs Normal | Abschnitt gesucht | nicht sichtbar (kein Tech-Build erzeugt, Tech-Slots leer) | NICHT GEPRÜFT |
| F4.90 | Referenz-Listen | Abschnitt gelesen | „Referenz-Listen auf einen Blick" mit „Aktuelles Major · Beste Platzierung: #37 Boming Wang 8-3-1 · 69,4 % · World Championships 2026 · 2026-08-28 · 60 Karten" und „Aktuelles Online · Typischer Build: 1st of 179, Sarpinbanco 9-1-1 · 84,8 % · 2026-09-04 · 60 Karten" — beide Spalten befüllt und plausibel | OK |
| F4.91 | 3-Wege-Vergleich | geklickt, per Hintergrundklick geschlossen | Modal mit drei Spalten (Dein Builder 60 / Aktuelles Major 60 / Aktuelles Online 60) und Übereinstimmungszählern „17 alle 3 einig · 3 zwei von drei · 7 nur 1"; schließt per Hintergrundklick | OK |
| F4.92 | Hilfeknopf Tech Lab | Verdrahtung geprüft | `openTabHelp("tech-lab")` vorhanden | OK |
| F4.93 | Zielkarten-Suche | „Dragapult" eingegeben | `#techLabTargetDropdown` zeigt 2 Treffer („Dragapult ex TWM\|130", „Dragapult ex ASC\|160") | OK |
| F4.94 | Vorschau + Name | Treffer ausgewählt | Name erscheint („ZIEL-KARTE GEWÄHLT: Dragapult ex"); **kein Kartenbild/Thumbnail sichtbar** | FEHLER-niedrig |
| F4.95 | Reset overrides | vor/nach der Auswahl | vorher `disabled=true`, nachher aktiv | OK |
| F4.96 | Starthinweis | vor/nach der Auswahl | Hinweistext wird durch die Ergebnisse ersetzt | OK |
| F4.97 | „Wird besiegt von" | nach Auswahl gelesen | „🛡 Wird besiegt von" mit Erklärsatz und Einträgen („Battle Cage HIGH", „Shaymin Flower Curtain HIGH") | OK |
| F4.97b | technische Schlüssel im Text | Abschnitt gelesen | interner Schlüssel „ATTACK.BENCH_DAMAGE" steht ungefiltert im Fließtext | FEHLER-niedrig |
| F4.98 | „+ Fehlende Tech hinzufügen" (Beaten by) | vor/nach der Auswahl | vorher nicht vorhanden, nachher aktiv (`disabled=false`) | OK |
| F4.99 | „Stark gegen" | gelesen | „⚔ Stark gegen — Karten die diese hier besiegt" mit Erklärsatz und Einträgen | OK |
| F4.100 | „+ Fehlende Tech hinzufügen" (Beats) | wie F4.98 | aktiv | OK |
| F4.101 | Modal „Add a tech" | Suchfeld `#techLabAddSearch` vorhanden | Feld vorhanden; Eintrag nicht hinzugefügt (schreibt lokal gespeicherte Overrides) | NICHT GEPRÜFT (schreibt gespeicherte Daten) |

### F5 · `meta-call` — Meta Call

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F5.1 | „← Startseite" | geklickt | wechselt nach `current-meta`, Hash `#current-meta` | OK |
| F5.2 | Hilfeknopf | Verdrahtung geprüft | `openTabHelp("meta-call")` vorhanden | OK |
| F5.3 | Szenarien-Auswahl | `#mc-scenarios-select` ausgelesen | nur eine Option „— kein Szenario —", also kein gespeichertes Szenario zum Laden | NICHT GEPRÜFT (kein Szenario vorhanden) |
| F5.4 | Szenario auffrischen | — | ohne geladenes Szenario nicht prüfbar | NICHT GEPRÜFT |
| F5.5 | Szenario speichern | — | nicht ausgelöst: legt gespeicherte Daten im Konto an (Regel 3) | NICHT GEPRÜFT (schreibt Konto-Daten) |
| F5.6 | Szenario löschen | — | nicht ausgelöst (Regel 3) | NICHT GEPRÜFT |
| F5.7 | Datenfenster ab (H7) | in `current-analysis` 2026-08-01 gesetzt, danach `#metacallDateFrom` gelesen | beide Felder tragen 2026-08-01, `window.currentMetaDateFrom` = „2026-08-01" — gemeinsamer Zustand, **kein** Auseinanderlaufen; **H7 als Risiko widerlegt** | OK |
| F5.8 | Clear (Datum) | in `current-analysis` geklickt | leert beide Felder | OK |
| F5.9 | Hinweistext zum Fenster | ohne gesetztes Datum gelesen | „ⓘ Auto: letzte 28 Tage (≥ 10.08.2026) — Datum wählen zum Überschreiben" — Zustand „automatisch" korrekt beschrieben | OK |
| F5.10 | Meta-Quelle | Reiter „Vergangenes Meta" geklickt (`MetaCall._setMetaSource('past')`) | Aktivmarkierung bleibt auf „Current Meta · PBL", die Feldtabelle bleibt Zeile für Zeile identisch — **Umschalter ohne jede Wirkung**; das laut Code zugehörige Format-Auswahlfeld `.mc-source-format-select` existiert im DOM gar nicht | FEHLER-hoch |
| F5.11 | City-League-Quellen | Checkboxen und Beschriftung gelesen | „Aktuelle City League: keine Daten" / „Vergangene City League: 11 Archetypen" — Leerzustand ist erklärt | OK |
| F5.12 | Top-Cut-Größe | Turniertyp-Reiter (Worlds/Regional/International/Challenge/Cup) geprüft | Auswahl vorhanden, „Regional/SPE" aktiv, Beschreibung „8 Swiss-Runden + Top-8-Cut am Day 2" passt | OK |
| F5.13 | Spielerzahl | 1, 10000 und 128 gesetzt | Feld hat `min=2 max=9999`, **klemmt aber nicht**: 1 und 10000 bleiben stehen; mit 10000 rechnet die Tabelle weiter (Dragapult 1.476 Spieler), keine Warnung | FEHLER-mittel |
| F5.14 | Runden | `#mc-rounds` ausgelesen | Auswahlfeld mit genau 2 Optionen (8/9 Runden) — kein Bereich 1–15 wie in der Prüfliste angenommen; Auswahl wirkt (Spalte „Ø Begegnungen (8 R.)") | OK (Abweichung zur Prüfliste) |
| F5.15 | Day-2-Punkte | 99 gesetzt | Feld hat `max=45`, behält aber 99 ohne Warnung | FEHLER-mittel |
| F5.16 | Turniername | „QA Testturnier" eingegeben | Feld nimmt den Text an | OK |
| F5.17 | Turnierbild erzeugen | „Bild generieren" per echtem Klick | Bildvorschau `#dsBildvorschau` öffnet mit dem gerenderten Turnierbild (Feldzusammensetzung + Empfehlungen + Geheimtipps), Knöpfe „Kopieren / Speichern / Schließen" | OK |
| F5.18 | Modus-Reiter | „Counter-Meta" geklickt (`MetaCall._setMetaCallMode('counter')`) | Aktivmarkierung bleibt auf „Standard", Feldtabelle unverändert — **ohne Wirkung** | FEHLER-hoch |
| F5.19 | Feldtabelle-Kopf | Spalten und `title` gelesen | Spalten Deck / Prognose % / Meine Schätzung / Final % / Spieler / Ø Begegnungen (8 R.) vorhanden; **„Deck" und „Spieler" haben keinen `title`-Hinweis**, die anderen vier schon | FEHLER-niedrig |
| F5.20 | Schätzfeld je Zeile | 50 in die Dragapult-Zeile eingetragen | „Final %" springt auf 50,00 %, Spieler 64 von 128, Ø Begegnungen 4,00 (= 8 Runden × 0,5) — rechnerisch korrekt | OK |
| F5.20b | Schätzfeld leeren | Feld wieder auf „" gesetzt (change ausgelöst) | „Final %" bleibt bei 50,00 %, fällt **nicht** auf die Prognose 14,76 % zurück | FEHLER-mittel |
| F5.21 | Zeile aufklappen | `.mc-row-toggle` geklickt | Detailzeile erscheint: „Online-Anteil (15 Tage) 9,5 % kumulativ 7,6 % · Top-8-Quote 9,2 % · 1,5× vs. Schnitt · Trend" | OK |
| F5.22 | „Alle Details" | geklickt und wieder geklickt | schaltet alle Detailzeilen gemeinsam um | OK |
| F5.23 | „Feld gruppieren" | geklickt | Tabelleninhalt gruppiert sich sichtbar um (erste Zeile ändert sich) | OK |
| F5.24 | Feld als Bild teilen | `exportFieldShareImage()` ausgelöst | `#dsBildvorschau` öffnet mit Bild | OK |
| F5.25 | Eigenes Deck hinzufügen | geklickt | Eingabezeile wird ergänzt (4 → 8 Custom-Elemente) | OK |
| F5.26 | Name/Anteil/Entfernen | `.mc-custom-remove-btn` geklickt | Zeile verschwindet wieder (8 → 4) | OK |
| F5.27 | Mein Deck | „Mega Excadrill" in `#mc-my-deck` eingetragen, change+input ausgelöst | Empfehlungstabelle bleibt unverändert, Mega Excadrill taucht dort nicht auf | FEHLER-mittel |
| F5.28 | Overrides ein/aus | „Win Rates anpassen ▼" geklickt | Override-Bereich vorhanden und schaltbar | OK |
| F5.29 | Brick-Filter | „Exkl. Bricks" und zurück „Inkl. Bricks" | Empfehlungstabelle bleibt in beiden Fällen Zeile für Zeile identisch — keine sichtbare Wirkung | FEHLER-mittel |
| F5.30 | Win-Rate-Override je Gegner | Override-Eingaben vorhanden | Felder vorhanden; Einzelwert nicht gesetzt | NICHT GEPRÜFT |
| F5.31 | Day-2-Bild teilen | kein Knopf in der Oberfläche; `MetaCall.exportDay2ShareImage()` direkt aufgerufen | Funktion existiert, erzeugt aber **keine** Bildvorschau (im Gegensatz zu F5.17/24/33); ein zugehöriger Knopf fehlt im Reiter | FEHLER-mittel |
| F5.32 | Empfehlungstabelle mit „Why?" | `.mc-rec-toggle-th` geklickt | Spalte klappt auf (6 Spalten), 10 `.mc-rec-reason-jump`-Sprungziele vorhanden | OK |
| F5.33 | Feld + Empfehlungen als Bild | `exportFieldAndRecsShareImage()` ausgelöst | `#dsBildvorschau` öffnet mit Bild | OK |
| F5.34 | Mobile Detailschalter | auf Desktopbreite geprüft | `.mc-mobile-detail-toggle` auf Desktopbreite nicht aktiv | NICHT GEPRÜFT (Mobilbreite) |
| F5.35 | Frozen-Banner | — | nur über die Quelle „Vergangenes Meta" erreichbar, die laut F5.10 nicht schaltet | NICHT GEPRÜFT (Voraussetzung durch F5.10 blockiert) |
| F5.36 | Frozen-Anteilstabelle | — | wie F5.35 | NICHT GEPRÜFT |
| F5.37 | Frozen-Empfehlungstabelle | — | wie F5.35 | NICHT GEPRÜFT |

### Reiterübergreifende Beobachtungen

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| Q1 | Waagerechtes Scrollen | `scrollWidth` vs. `innerWidth` bei 1536 und 1707 px | 1528/1536 bzw. 1699/1707 — kein waagerechtes Scrollen der Seite | OK |
| Q2 | Abgeschnittene Texte | `scrollWidth > clientWidth` im aktiven Reiter | Preisknöpfe der Kartenkacheln (30 > 22 px, z. B. „3,89 €", „0,25 €") und lange Kartennamen („Lillie's Determination" 96 > 80, „Buddy-Buddy Poffin" 91 > 80) werden abgeschnitten | FEHLER-niedrig |
| Q3 | Text „Deck ? Proxy" (H14) | gesamtes DOM durchsucht | nicht vorhanden; die Beschriftung lautet korrekt „Deck → Proxy" — **H14 widerlegt** | OK |
| Q4 | Stille Fehlerpfade (H12) | Leerzustände in `city-league`, `city-league-analysis`, `meta-analysis-hub` | teils erklärt (Saisonhinweis, „Kein Vorzeitraum zum Vergleichen", „Kein Treffer für diesen Filter", „Consistency Generate ausführen…"), teils stumm: Kartenübersicht ohne Treffer (F3.12b), „keine Daten"-Chips über gefüllten Seiten (F2.2/F3.2), fehlende Änderungstabellen (F2.11–13) | teils FEHLER (s. dort) |
| Q5 | Konsolenfehler | Sammler (`error`, `unhandledrejection`, `console.error`, `console.warn`) über die gesamte Prüfung | **0 Meldungen** — alle oben genannten Ausfälle passieren lautlos | — |

---

## Fehlerbeschreibungen

### FEHLER-hoch

**1. Kopfzeilen-Verknüpfungen und Menüpunkt „Deck Builder" landen im falschen Profil-Untertab (F0.6, F0.7, F0.18)**
Klick auf „Meine Decks" oder „Wunschliste" in der Kopfzeile (bzw. auf „Deck Builder" im Pokéball-Menü) öffnet zwar den Reiter `profile`, der aktive Untertab bleibt aber „Meine Sammlung". Nachstellen: von `current-meta` aus `.header-mydecks-btn` klicken → `profile` öffnet, aktiv ist „Meine Sammlung", nicht „Meine Decks (4)". Direkter Aufruf `openProfileSection('decks')` verhält sich genauso, `switchProfileTab('decks')` funktioniert dagegen einwandfrei — der Umschaltbefehl geht also verloren. Der Tieflink `#wishlist` trifft den richtigen Untertab, die Knöpfe nicht.
Vermutliche Ursache: `js/inline-init.js:319–326` — `openProfileSection` ruft `switchProfileTab` in einem einzelnen `requestAnimationFrame` nach `switchTabAndUpdateMenu('profile')` auf; die Profil-Initialisierung setzt danach wieder auf „collection" zurück.

**2. Typfilter und Seltenheitsmodus widersprechen sich im Kartengitter (F3.13b)**
Reihenfolge: Deck „Dragapult Blaziken" wählen → Typ „Spez. Energie" klicken (Gitter zeigt korrekt 0 Karten, Zähler „0 Karten") → Seltenheitsmodus wechseln („Max. Seltenheit"). Danach zeigt das Gitter wieder alle 33 Karten und der Zähler „33 Karten", während die Schaltfläche „Spez. Energie" weiter als aktiv markiert bleibt. Der Nutzer sieht einen gesetzten Filter, der nicht wirkt.
Vermutliche Ursache: `setOverviewRarityMode` rendert das Gitter neu, ohne den gespeicherten Typfilter erneut anzuwenden (Renderpfad der Kartenübersicht in `js/app-city-league.js` / `js/app-deck-builder.js`).

**3. Erzeugtes Deck bleibt unsichtbar — beide Deckbau-Bereiche (F3.28, F3.30–F3.32, F4.51, F4.54–F4.56)**
Nachstellen (Japan): `city-league-analysis` → Deck „Dragapult Blaziken" → „Consistency". Es erscheint die Erfolgsmeldung „✓ Dragapult Blaziken: 60/60 Karten · Core @ 90 % · 11 Listen ausgewertet", `window.cityLeagueDeck` enthält anschließend 60 Karten — die Oberfläche zeigt aber weiter „Dein Deck ist leer", `#cityLeagueDeckCount` steht auf „0", `#cityLeagueMyDeckVisual` behält die Klasse `d-none` und der Preis bleibt „0,00 €". Erst ein beliebiger Klick auf „+" oder „−" an einer Kartenkachel lässt das gesamte Deck auf einen Schlag erscheinen (Zähler springt von 0 auf 61). Identisch in `current-analysis` mit „Max Consistency" für Mega Excadrill (Meldung „60/60", Zähler bleibt „0").
Vermutliche Ursache: `js/app-deck-builder.js:8146` (`autoCompleteConsistency`) schreibt das Deck, ruft aber die Zähleraktualisierung nicht auf; `index.html:963–979` blendet die „Dein Deck"-Karte ausschließlich über einen `MutationObserver` auf dem Textinhalt von `cityLeagueDeckCount` ein — bleibt der Zähler stehen, bleibt das Panel verborgen.

**4. Gegnersuche im Matchup-Bereich ist tot (F4.25, F4.26)**
Nachstellen: `current-analysis` → „Mega Excadrill" wählen → in „Gegner suchen…" per Tastatur „Alaka" tippen (Alakazam Dudunsparce steht mit 24,9 % in der Tabelle darüber). Das Auswahlfeld `#currentMetaOpponentDropdown` bleibt `d-none` und leer, `#currentMetaMatchupDetails` erscheint nie. Im Seitenzustand existiert weder `window.currentMetaDeckMatchups` noch irgendeine `matchupData_*`-Variable, das Auswahlfeld hat 0 Kindelemente — es wurde also nie befüllt, für keinen Archetyp. Die Tabellen „Beste/Schlechteste Matchups" darüber sind dagegen befüllt (andere Datenquelle).
Vermutliche Ursache: `js/app-current-meta-analysis.js:3565–3595` — der Befüll-Zweig hängt an `window['matchupData_' + Archetyp]`; diese Variablen werden nirgends mehr gesetzt. Selbst der `else`-Zweig („keine Daten") läuft nicht, das Feld bleibt also vollständig leer statt einen Hinweis zu zeigen.

**5. Meta Call: Quellen- und Modus-Umschalter ohne Wirkung (F5.10, F5.18)**
Nachstellen: Reiter `meta-call` → „Vergangenes Meta" klicken. Die Aktivmarkierung `mc-tt-tab-active` bleibt auf „Current Meta · PBL", und die Feldtabelle bleibt Zeile für Zeile identisch (Dragapult 14,76 %, Basic Box 8,83 % …). Gleiches Verhalten bei „Counter-Meta" gegen „Standard". Keine Meldung, kein Konsolenfehler.
Vermutliche Ursache: `js/app-meta-call.js:9724` erzeugt den Knopf mit `MetaCall._setMetaSource('${key}')` — **ohne** zweites Argument. In `_setMetaSource` (`js/app-meta-call.js:7972 ff.`) führt ein fehlender `formatKey` in den Zweig „No format selected yet", der `_shareList` leert und `renderAll()` in einem `try/catch` aufruft, dessen Fehler geschluckt wird. Das laut Code vorgesehene Auswahlfeld `.mc-source-format-select` (`js/app-meta-call.js:9744`), das den Schlüssel liefern würde, ist im DOM nicht vorhanden. Folgefehler: die Frozen-Ansichten F5.35–F5.37 sind dadurch überhaupt nicht erreichbar.

### FEHLER-mittel

**6. Datenstand-Chips melden „keine Daten" über gefüllten Seiten (F2.2, F3.2)**
`city-league` zeigt im Kopf „Daten: keine Daten" (`data-quelle="city_league_archetypes.csv"`), darunter aber 26 Listen aus 11 Archetypen; `city-league-analysis` genauso mit `city_league_analysis.csv`. Der Chip bezieht sich offenbar auf die leere *aktuelle* Datei, während die Seite im Modus „Vergangenes Meta" arbeitet und aus dem Vorzeitraum-Datensatz liest. Der Chip folgt der Formatumschaltung nicht und widerspricht damit dem sichtbaren Inhalt. Nachstellen: Reiter `city-league` öffnen, Chip im Kopf und Fußzeile („Erstellt: 07.09.2026 · Archetypen insgesamt: 11") vergleichen.

**7. Änderungsauswertungen der City League fehlen vollständig (F2.11–F2.13, H1)**
Der Reiter `city-league` enthält genau zwei Tabellen: „Vollständige Vergleichstabelle (Top 30)" und „Archetypen kombiniert (Top 20)". Es gibt weder „Seltener gespielt" (decreased) noch „Performance Improvers/Decliners", und ebenso wenig eine Darstellung für Aufsteiger, neue oder verschwundene Archetypen. Die Karte „Top 10 Veränderungen" behauptet „jeder Archetyp hier ist neu", listet aber keinen davon auf. Nachstellen: Reiter öffnen, alle `h2/h3/h4` und `table`-Elemente auflisten.
Vermutlich `js/app-city-league.js` — die Werte `increased`, `newArchetypes`, `disappeared` werden berechnet, aber nie gerendert; die drei genannten Tabellen fehlen im aktuellen Markup ganz.

**8. Tier-Reihenfolge widerspricht der Überschrift (F2.7)**
Tier 1 trägt die Überschrift „Die 3 meistgespielten", zeigt aber in dieser Reihenfolge: Dragapult (3 Listen), Ogerpon Box (5 Listen), Dragapult Blaziken (6 Listen). Tier 2 und 3 tragen „Ränge 4–10 / 11–20 nach Listenzahl", sind intern aber ebenfalls nach Ø-Platzierung sortiert (Tier 2 beginnt mit Mega Venusaur, 1 Liste, Ø 3,00). Die Zuordnung zu den Tiers ist korrekt, nur die Sortierung innerhalb passt nicht zur Beschriftung.

**9. Zähler der Kartenübersicht folgt dem Seltenheitsmodus nicht (F3.11)**
`city-league-analysis` → „Alle Drucke" wählen: das Gitter zeigt 206 Drucke, `#cityLeagueCardCount` steht weiter auf „33 Karten". Erst der nächste Klick auf einen Typfilter zieht den Zähler auf 206 nach.

**10. Aktivmarkierung der Seltenheits-Umschalter klebt (F3.22–F3.24, F4.45–F4.47)**
„Niedrige Seltenheit" behält dauerhaft die Klasse `btn-success` und damit blauen Hintergrund mit weißer Schrift, auch wenn „Max. Seltenheit" oder „Alle Drucke" gewählt ist (`getComputedStyle`: rgb(59,76,202)/weiß auf „Niedrige Seltenheit", transparent/grau auf der tatsächlich gewählten Option). Die eigentliche Zustandsklasse `btn-active` wandert korrekt — der Nutzer sieht aber immer „Niedrige Seltenheit" als gewählt.

**11. Handstatistik bleibt leer (F3.37, F4.63)**
Nach einem vollständig erzeugten 60-Karten-Deck sind `#cityLeagueHandStats` und `#currentMetaHandStats` leer (`display:none`, kein Textinhalt). Nachstellen: Deck generieren, „+"/„−" drücken (damit das Panel erscheint), Handstatistik-Bereich lesen.

**12. Datenfenster wirkt nicht auf die Archetyp-Kennzahlen (F4.7)**
`current-analysis` → Mega Excadrill → „Datenfenster ab" nacheinander auf 2026-08-01, 2026-09-01 und 2020-01-01 setzen. Die Kartenübersicht reagiert (50/60 → 38/60 → 50/62), die Archetyp-Karte darüber jedoch überhaupt nicht: Share 7,3 % (3.004), Win Rate 48,7 % (13.827), Top-8-Quote 2,3 %, Day-2-Quote 25,0 % bleiben in allen Fällen identisch — auch ohne gesetztes Fenster. Der Nutzer sieht Kennzahlen, die nicht zum gewählten Zeitraum gehören.

**13. „Matchup gegen Top 20" ohne jede Erklärung (F4.21, H6)**
Die Kachel zeigt „47,05 % (20 MU)". Weder die Abkürzung „MU", noch der Nenner, noch die Rang-Schwelle „Top 20" werden irgendwo im Reiter erklärt; die Kachel trägt kein `title`-Attribut. Gleiches gilt für die Kacheln „Share" und „Win Rate" (F4.15/F4.16), deren Nenner ebenfalls unerklärt bleiben.

**14. Hub-Kacheln schreiben den Hash nicht fort (F1.5–F1.10)**
Alle sechs Kacheln auf `meta-analysis-hub` wechseln den Reiter korrekt, lassen die Adressleiste aber auf `#meta-analysis-hub` stehen. Nachstellen: `#meta-analysis-hub` öffnen, Kachel „Meta Call" klicken → aktiver Reiter `meta-call`, Adressleiste weiterhin `#meta-analysis-hub`. Ein Neuladen oder Teilen der URL führt den Nutzer zurück auf die Kachelseite statt zum gesehenen Inhalt.

**15. Zahleneingaben in Meta Call klemmen nicht (F5.13, F5.15)**
`#mc-players` trägt `min=2 max=9999`, `#mc-day2pts` trägt `max=45`. Werte von 1, 10000 bzw. 99 bleiben nach dem `change`-Ereignis unverändert stehen, es erscheint keine Warnung, und die Rechnung läuft mit dem ungültigen Wert weiter (bei 10000 Spielern: Dragapult 1.476 Spieler in der Feldtabelle).

**16. Geleerte Schätzung wird nicht zurückgenommen (F5.20b)**
In der Feldtabelle 50 in die Spalte „Meine Schätzung" der Dragapult-Zeile eintragen → „Final %" wird 50,00 % (korrekt). Das Feld anschließend leeren (change ausgelöst) → „Final %" bleibt bei 50,00 % und fällt nicht auf die Prognose 14,76 % zurück. Der Nutzer kann eine Schätzung nicht mehr zurücknehmen.

**17. „Mein Deck" und Brick-Filter ohne sichtbare Wirkung (F5.27, F5.29)**
„Mega Excadrill" in `#mc-my-deck` eintragen (change + input): die Empfehlungstabelle bleibt unverändert, Mega Excadrill taucht dort nicht auf. `.mc-brick-filter-select` von „Inkl. Bricks" auf „Exkl. Bricks" und zurück: die Empfehlungstabelle bleibt Zeile für Zeile identisch. (Einschränkung: beide wurden per Skript-Ereignis gesetzt; ein Zusammenhang mit fehlenden Brick-Daten ist möglich.)

**18. Day-2-Bild lässt sich nicht erzeugen (F5.31)**
Im Reiter gibt es nur drei Bild-Knöpfe („Bild generieren", zwei × „📤 Teilen"), alle drei öffnen die Bildvorschau `#dsBildvorschau` mit einem gerenderten Bild. `MetaCall.exportDay2ShareImage` existiert als Funktion, erzeugt aber keine Vorschau, und ein zugehöriger Knopf fehlt in der Oberfläche — die in der Prüfliste vorgesehene Day-2-Prognose lässt sich nicht teilen.

### FEHLER-niedrig (Kurzfassung)

* **F0.2b/F0.2c** — `current-meta` heißt im Fenstertitel „Startseite", im Abzeichen „Aktuelles Meta (Global)"; beim Reiter `admin` wird der Fenstertitel gar nicht gesetzt und behält den des vorigen Reiters.
* **F0.33** — Nav-Gruppe „Karten" leuchtet auch auf dem Reiter `profile`, obwohl dort keine Gruppe leuchten soll.
* **F0.35b** — Ein erfundener Hash wird zwar ignoriert, aber ohne die vorgesehene Konsolenmeldung `[deep-link] no tab element for …`; der Unsinns-Hash bleibt in der Adressleiste stehen.
* **F2.7b** — Kein Rogue-/Trending-Block als `<details>` vorhanden (`document.querySelectorAll('details')` liefert im Reiter 0 Treffer).
* **F2.23b** — Saisonhinweis sagt am 07.09.2026 „Neue Events starten im September" — überholt und ohne konkretes Datum.
* **F3.12b** — Kartensuche ohne Treffer hinterlässt ein leeres Gitter ohne Hinweistext (die Meta-Karten-Analyse macht es mit „Kein Treffer für diesen Filter" richtig).
* **F3.12c** — „1 Karten" statt „1 Karte".
* **F3.27** — Keine Symbol-Legende im Japan-Reiter, obwohl dieselben Kartenkacheln verwendet werden (H11).
* **F3.28b** — Erfolgsmeldung nennt „11 Listen ausgewertet", die Statistik daneben „5 mit veröffentlichter Liste".
* **F3.35b / F3.43 / F3.39b / F4.7b / F4.22** — Unübersetzte englische Texte in deutscher Oberfläche: „Your deck is empty", „Share Link / Copy this share link:", „No recent Major in scope …", „Active window: data ≥ …", „28th August 2026".
* **F3.43** — „Teilen" öffnet ein Link-Fenster statt der erwarteten Bildansicht.
* **F3.48 / F4.74** — „die nächsten 8 (9 Karten zum Einpacken)" bzw. „die nächsten 13 (17 Karten…)" — die beiden Zahlen im selben Satz passen nicht zusammen.
* **F4.15/F4.16/F4.29** — Kennzahlen ohne Erklärung daneben (Nenner, Remisquote, Farbschwellen).
* **F4.87** — „Meta-Analyse laden" benennt sich nach dem Laden nie um; die id `currentMetaMetaReloadBtn` existiert nicht (H2).
* **F4.94** — Tech Lab zeigt nach der Zielkartenauswahl nur den Namen, kein Kartenbild.
* **F4.97b** — Interner Schlüssel „ATTACK.BENCH_DAMAGE" steht ungefiltert im Nutzertext.
* **F5.19** — Die Spalten „Deck" und „Spieler" der Feldtabelle haben keinen erklärenden `title`.
* **Q2** — Abgeschnittene Texte in den Kartenkacheln: Preisknöpfe (30 > 22 px) und lange Kartennamen („Lillie's Determination" 96 > 80 px).

---

## Zählung

| Status | Anzahl Prüfzeilen |
|---|---|
| OK | 158 |
| FEHLER-kritisch | 0 |
| FEHLER-hoch | 8 |
| FEHLER-mittel | 26 |
| FEHLER-niedrig | 24 |
| NICHT GEPRÜFT | 22 |
| **Summe** | **238** |

**FEHLER-hoch (8 Zeilen, 5 Befunde):** F0.6, F0.7, F0.18 (Profil-Untertab) · F3.13b (Typfilter/Seltenheit) · F3.28, F4.51 (Deck bleibt unsichtbar) · F4.25, F4.26 (Gegnersuche) · F5.10, F5.18 (Meta-Call-Umschalter) — die Zeilen F3.30–F3.32 und F4.54–F4.56 sind als OK gezählt, weil die Zähler nach manuellem +/− korrekt arbeiten.

**NICHT GEPRÜFT — Gründe:**
* *Schreibt Konto- oder gespeicherte Daten (Regel 3, 7 Zeilen):* F3.38 (Deck speichern), F3.42 (Wirkung Deck → Proxy), F3.67 (Wunschzettel), F3.73 (P-Knopf), F4.101 (Tech-Override), F5.5, F5.6 (Szenario speichern/löschen).
* *Voraussetzung nicht herstellbar (10 Zeilen):* F1.3 (CSV nicht blockierbar), F2.20 (kein Vorzeitraum), F3.63, F4.88 (Analyse bereits geladen), F3.64, F4.89 (kein Tech-Build möglich), F5.3, F5.4 (kein gespeichertes Szenario), F5.35–F5.37 (durch F5.10 blockiert — als 3 Zeilen gezählt).
* *Sonstiges (5 Zeilen):* F3.47 (Autovervollständigung nicht ausgelöst), F3.68 (Bernstein-Zustand trat nicht auf), F3.74 (Cooking nur global), F4.11 (Fusion nur auf Vorhandensein geprüft), F5.30 (Override-Einzelwert), F5.34 (Mobilbreite).

## Konsolenfehler

**Keine.** Über die gesamte Prüfung hinweg lief ein Sammler auf `window.onerror`, `unhandledrejection`, `console.error` und `console.warn`. Er meldete **0 Einträge** — auch in den Momenten, in denen die Oberfläche nachweislich versagte (totes Suchfeld F4.25, wirkungslose Umschalter F5.10/F5.18, unsichtbares Deck F3.28/F4.51). `mcp__claude-in-chrome__read_console_messages` lieferte für den Tab ebenfalls keine Treffer. Sämtliche gefundenen Ausfälle passieren lautlos; auch die in der Prüfliste erwartete Meldung `[deep-link] no tab element for …` erscheint bei einem erfundenen Hash nicht.
