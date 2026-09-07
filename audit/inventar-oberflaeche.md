# Inventar der Oberfläche — thedipidis.app

Stand: 07.09.2026 · Git `5d9ab9a8` · ausgeliefert `202609071722-bc9a494` · `window.APP_VERSION = '202609071700'`
Neu aufgebaut aus `index.html` (4.000 Zeilen) und den zugehörigen `js/`-Dateien. Nichts aus dem Vorlauf übernommen.

**Lesart der Spalten**
- *Kennung* — feste Adresse für Prüfberichte. Gruppe = Reiter, laufende Nummer innerhalb der Gruppe.
- *Bezeichnung* — was auf dem Bildschirm steht (deutsche Fassung). `data-i18n`-Schlüssel liefern zur Laufzeit den Text; im Markup steht als Rückfall Englisch.
- *Ort* — `index.html:Zeile` für statisches Markup, `Datei:Zeile` für zur Laufzeit erzeugtes, Container-ID in Klammern.
- *Soll* — was das Element tun soll.
- *Nachweis* — nachprüfbares Kriterium.

**Reiter (`.tab-content`), 16 Stück** — `current-meta` und `past-meta` tragen zusätzlich `fs-scale`; eine Suche nach `class="tab-content"` mit Anführungszeichen findet sie nicht.

| # | ID | Zeile | Gruppe |
|---|---|---|---|
| 1 | `meta-analysis-hub` | 647 | F1 |
| 2 | `city-league` | 688 | F2 |
| 3 | `city-league-analysis` | 715 | F3 |
| 4 | `current-meta` (`active` beim Start) | 1114 | F4 |
| 5 | `current-analysis` | 1143 | F5 |
| 6 | `past-meta` | 1798 | F6 |
| 7 | `meta-call` | 2075 | F7 |
| 8 | `cards` | 2085 | F8 |
| 9 | `proxy` | 2169 | F9 |
| 10 | `tutorial` | 2233 | F10 |
| 11 | `quellen` | 2271 | F11 |
| 12 | `admin` | 2287 | F12 |
| 13 | `side-quest` | 2304 | F13 |
| 14 | `pocket` | 2339 | F14 |
| 15 | `calculator` | 2350 | F15 |
| 16 | `profile` | 2407 | F16 |

**Profil-Untertabs (`.profile-tab-content`), 11 Stück** — F16: `profile-collection` (2564), `profile-decks` (2638), `profile-wishlist` (2679), `profile-tradelist` (2733), `profile-metabinder` (2773), `profile-custombinder` (2804), `profile-journal` (2869), `profile-deckcompare` (2908), `profile-deckbuilder` (2926, leer, JS füllt), `profile-testinggroups` (2933, leer, JS füllt), `profile-settings` (2938).

---

## F0 — Seitenübergreifend (Kopfzeile, Menü, Navigation, Fuß, globale Dialoge)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F0.1 | „Skip to content" (Sprungmarke) | index.html:456 | Erster Tabstopp; springt auf `#main-content` | Tab bei frisch geladener Seite fokussiert den Link; Enter setzt Fokus in den Inhalt |
| F0.2 | Pokéball-Knopf (Menü öffnen) | index.html:466 (`#mainMenuTrigger`) | `toggleMainMenu()`; `aria-expanded` wechselt | Klick öffnet `#mainMenuDropdown` (`.show`); zweiter Klick schließt; `aria-expanded` folgt |
| F0.3 | Menü-Überschrift „Hauptmenü" | index.html:472 | reine Beschriftung | Text vorhanden, kein Klickziel |
| F0.4 | Menüpunkt „Übersicht" | index.html:478 (`#menu-btn-meta-analysis-hub`) | `switchTabAndUpdateMenu('current-meta')` | Reiter wird `current-meta`, Adresszeile `#current-meta`, Menüpunkt bekommt `.active` |
| F0.5 | Menügruppe „Meta & Tier-Listen" (auf/zu) | index.html:482 (`#menu-group-meta`) | `toggleMenuCluster('meta')`, Standard offen | `#menu-submenu-meta` wechselt `.open`; `aria-expanded` folgt |
| F0.6 | Menüpunkt „City League Meta" | index.html:489 | → Reiter `city-league` | Reiter aktiv + Hash + Kopfabzeichen |
| F0.7 | Menüpunkt „Deck-Analyse (Japan)" | index.html:492 | → `city-league-analysis` | wie F0.6 |
| F0.8 | Menüpunkt „Current Meta (Global)" | index.html:495 | → `current-meta` | wie F0.6 |
| F0.9 | Menüpunkt „Deck-Analyse (Global)" | index.html:498 | → `current-analysis` | wie F0.6 |
| F0.10 | Menüpunkt „Past Meta" | index.html:501 | → `past-meta` | wie F0.6 |
| F0.11 | Menüpunkt „Kartendatenbank" | index.html:506 | → `cards` | wie F0.6 |
| F0.12 | Menüpunkt „Deck Builder" | index.html:514 (`#menu-btn-deckbuilder`) | `openProfileSection('deckbuilder')` — Profil + Untertab | nach Klick ist `#profile` aktiv UND `#profile-deckbuilder` sichtbar; Hash nennt den Untertab (`inline-init.js:345`, `__dsSchreibeProfilHash`) |
| F0.13 | Menügruppe „Werkzeuge" (auf/zu) | index.html:525 (`#menu-group-tools`) | `toggleMenuCluster('tools')`, Standard zu | `#menu-submenu-tools` wechselt `.open` |
| F0.14 | Menüpunkt „Proxy Printer" | index.html:532 | → `proxy` | wie F0.6 |
| F0.15 | Menüpunkt „Playtester (TCG Showdown ↗)" | index.html:538 (`#menu-btn-showdown`) | `openShowdownExternal()` — externer Tab | neuer Browser-Tab auf TCG Showdown; eigener Reiter wechselt NICHT (`js/tcg-showdown-link.js`) |
| F0.16 | Menüpunkt „Wahrscheinlichkeitsrechner" | index.html:541 | → `calculator` | wie F0.6 |
| F0.17 | Menüpunkt „Meta Call" | index.html:545 | → `meta-call` | wie F0.6 |
| F0.18 | Menüpunkt „Mein Profil" | index.html:548 | → `profile` | wie F0.6 |
| F0.19 | Menüpunkt „Side Quest: Champions" | index.html:551 | → `side-quest` | wie F0.6 |
| F0.20 | Menüpunkt „Side Quest: TCG Pocket" | index.html:554 | → `pocket` | wie F0.6 |
| F0.21 | Menüpunkt „Anleitung" | index.html:557 | → `tutorial` | wie F0.6 |
| F0.22 | Menüpunkt „Quellen & Methodik" | index.html:560 | → `quellen` | wie F0.6 |
| F0.23 | Seitentitel „Pokémon TCG Hub" + Untertitel | index.html:567/571 | fest | Text steht, wechselt mit der Sprache |
| F0.24 | Reiter-Abzeichen im Kopf | index.html:569 (`#current-tab-title`) | zeigt Beschriftung des aktiven Menüpunkts; auf `meta-analysis-hub` ausgeblendet | nach jedem Reiterwechsel steht dort der Menütext; auf dem Hub `display:none` (`inline-init.js:302`) |
| F0.25 | Dunkelmodus-Umschalter | index.html:576 (`#themeToggleBtn`) | `toggleTheme()`; Wahl in `localStorage['theme']` | `<html data-theme="dark">` wechselt, `aria-pressed` folgt, Wahl übersteht Neuladen (`inline-init.js:30`) |
| F0.26 | Sprachumschalter „EN/DE" | index.html:585 (`#langToggleBtn`) | `switchLanguage()` DE↔EN | alle `data-i18n`-Texte wechseln; `languageChanged` löst Navigation, Ausweis und Abschnittsköpfe neu aus (`i18n.js:5368`) |
| F0.27 | Kopfknopf „Journal" + Zähler | index.html:586 (`#battleJournalFab`, `#battleJournalFabBadge`) | öffnet Battle-Journal-Blatt; Abzeichen = ungesyncte Einträge | Klick zeigt `#battleJournalOverlay`; Zahl = Länge des Outbox-Puffers |
| F0.28 | Kopfknopf „Meine Decks" | index.html:595 | `openProfileSection('decks')` | `#profile` aktiv, `#profile-decks` sichtbar, Hash nennt Untertab |
| F0.29 | Kopfknopf „Wunschliste" | index.html:602 | `openProfileSection('wishlist')` | wie F0.28 mit `#profile-wishlist` |
| F0.30 | Kopfknopf „Datenbank" | index.html:615 | `switchTabAndUpdateMenu('cards')` | Reiter `cards` UND Hash `#cards` (Befund vom 07.09.2026 behoben) |
| F0.31 | Kopfknopf „Anmelden" | index.html:620 (`#signin-btn`) | `showAuthModal('signin')` | `#auth-modal` verliert `.d-none` |
| F0.32 | Kopfknopf „Profil" (angemeldet) | index.html:625 (in `#user-info`) | → `profile` | nur sichtbar, wenn angemeldet; `#user-info` verliert `.user-info-hidden` |
| F0.33 | Hauptnavigation (5 Gruppen) | index.html:643 (`#dsNavHost`), gefüllt von `ds-nav.js:163` | Meta · Decks · Turnier · Karten · Champions; Klick ruft `switchTabAndUpdateMenu(g.go)` | 5 Knöpfe vorhanden; der zum aktiven Reiter gehörende trägt `aria-current="page"` |
| F0.34 | Mobile Navigationsleiste (unten) | index.html:3005 (`#dsTabbarHost`), `ds-nav.js:173` | dieselben 5 Ziele mit Glyphen | auf ≤768 px sichtbar, 5 Knöpfe, `aria-current` synchron zu F0.33 |
| F0.35 | Datenraum-Ausweis | index.html:644 (`#dsSpaceHost`), `ds-nav.js:252` | Region · Quelle · Stichprobe · Zeitfenster · Stand · Verweis „Quellen & Methodik →" | nur auf `city-league`, `city-league-analysis`, `current-meta`, `current-analysis`, `past-meta` sichtbar (`SPACES`, ds-nav.js:92); sonst `hidden`. Fehlende Angaben werden weggelassen, nicht erfunden |
| F0.36 | Ausweis-Zustandssatz „Saisonpause" / „Schnappschuss fehlt" | `ds-nav.js:296-298` | zwei verschiedene Sätze für zwei verschiedene Zustände | bei `facts.pause` steht Saisonpause, bei `facts.luecke` „Schnappschuss fehlt — nicht erhoben"; nie beides |
| F0.37 | Datenraum-Filterzeile „DATENRAUM / FORMAT" | `ds-filter.js:156` (über den drei Meta-Ansichten) | Raum wechselt den Reiter; Formatspalte bedient das vorhandene `<select>` | 3 Raum-Knöpfe, genau einer `is-on`/`aria-pressed=true`; Formatwechsel setzt `#cityLeagueFormatSelect` bzw. `#pastMetaFormatFilter` und feuert `change` |
| F0.38 | Format-Schild (Global) | `ds-filter.js:201` (`.ds-filter-fixed`) | zeigt laufendes Fenster, kein Schalter | im Raum „Global" steht ein Schild mit dem Formatkürzel, kein anklickbares Element |
| F0.39 | Gesperrte Format-Option | `ds-filter.js:245/262` | sichtbar, nicht wählbar, mit Grund im `title` | gesperrte Option ist `disabled`/`aria-disabled` und trägt `title` mit Begründung — im Auswahlfeld **und** in der Knopfleiste |
| F0.40 | Frische-Chips „Daten: …" | index.html:693, 719, 1118, 1801, 2087 + `meta-analysis-hub.js:551` | `ds-datenstand.js:158` füllt je Chip aus `data-quelle` | jeder Chip zeigt das Datum SEINER Datei; leere Datei ⇒ „keine Daten" + `is-unbekannt`; > 14 Tage ⇒ `is-alt` |
| F0.41 | Fußzeile „Letzte Aktualisierung" | index.html:3007 (`#last-update`) | Stand von `limitless_online_decks.csv`, sonst „unbekannt" | zeigt nie das Datum des Besuchs (`app-init.js:32`) |
| F0.42 | Hilfe-Knopf je Ansicht (`.tab-help-btn`) | 13× in index.html (650, 693, 719, 1118, 1146, 1716, 1801, 2087, 2175, 2239, 2356, 2412, 2469, 2775, 2806) | `openTabHelp(id)` öffnet `#helpModal` | Modal öffnet, Titel und Text passen zur übergebenen Kennung (`app-core.js:351`) |
| F0.43 | Hilfe-Dialog | index.html:3902 (`#helpModal`) | Titel, Text, Schließen | `×` und Klick auf Hintergrund schließen |
| F0.44 | Toast-Bereich | index.html:3899 (`#toast-container`) | `showToast()` legt Meldungen ab, `aria-live=polite` | Meldung erscheint und verschwindet nach Ablauf (`app-core.js:134`) |
| F0.45 | „← Startseite" (Zurück-Leiste der Werkzeug-Reiter) | index.html:2078, 2172, 2236, 2274, 2290, 2307, 2342, 2353 (8×) | → `current-meta` | in jedem der 8 Reiter genau einer, führt auf die Startseite |
| F0.46 | Anmelde-/Registrierdialog | index.html:3013 (`#auth-modal`) | Anmelden, Registrieren, Google, Passwort vergessen | Felder `#signin-email/-password`, `#signup-email/-password/-password-confirm`; Umschalten zwischen den beiden Formularen; `#google-signin-btn`; `#password-reset-btn` |
| F0.47 | Reiter-Adresse (Deep-Link) | `inline-init.js:259/735/971` | jeder Reiterwechsel schreibt per `pushState` einen Hash; Aufruf mit Hash öffnet den Reiter | `history.length` steigt je Wechsel um 1; Zurück-Knopf wechselt Ansicht statt die Seite zu verlassen |
| F0.48 | Versions-Prüfung + Neuladen | index.html:82 | vergleicht `version.json` mit `APP_VERSION`, räumt Caches, lädt hart neu | bei neuerer Serverversion Hard-Reload mit `?_v=` |
| F0.49 | Service-Worker-Meldung „Neue Version wird geladen…" | index.html:3979 | Hinweis-Toast bei neuem SW | erscheint bei `updatefound`, verschwindet nach 3 s |
| F0.50 | Tieflink-Tabelle (Reiter) | `inline-init.js:548` (`HASH_ALIASES`) | jeder Reiter und jeder Quellen-Abschnitt hat mindestens eine Kurzform; unbekannte Hashes steigen wortlos aus | `tests/unit/test-tieflinks.js` verbietet doppelte Schlüssel; `#overview`, `#hub`, `#uebersicht` → `meta-analysis-hub`; `#quellen-umfang` → `quellen`; `#playtester`/`#sandbox` → `meta-analysis-hub` statt auf eine leere Seite |
| F0.51 | Tieflink-Tabelle (Profil-Untertabs) | `inline-init.js:690` (`PROFILE_SUBTAB_FOR_HASH`) | jede `id="profile-X"` braucht einen Eintrag HIER **und** in `HASH_ALIASES` | `tests/unit/test-profil-untertabs-tieflink.js` prüft die Regel; 11 von 11 Untertabs auflösbar, `#deckcompare` und `#settings` seit 07.09.2026 dabei |
| F0.52 | Karten-Legende (aufklappbar) | index.html:1345-1409 (`details.ds-legend`) | erklärt A–K der Kartenkacheln | eingeklappt ~44 px; aufgeklappt Musterkarte + 11 Legendenzeilen (A Max-Anzahl, B im Deck, C Wunschliste, D andere Prints, E Name, F Set+Rate, G Ø-Anzahl, H Verbreitung, I −/+/★, J L/P/Preis, K Pin/Exclude) |

## F1 — Meta & Deck Analysis Hub (`#meta-analysis-hub`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F1.1 | Überschrift „Meta & Deck-Analyse" + Hilfe | index.html:650 | Titel, Hilfeknopf | siehe F0.42 |
| F1.2 | Untertitel „Wähle eine Kategorie" | index.html:651 | fest | Text steht |
| F1.3 | Block „Was gerade läuft" | `#metaHubAnswer`, `meta-analysis-hub.js:538` | Aussagesatz + 3 Kacheln + Nenner + Verweis | Satz nennt Deck, Top-8-Quote, Schnitt, Vielfaches |
| F1.4 | Aussagesatz mit Gewichtungs-Chip | `meta-analysis-hub.js:383` (`span.mah-quote`) | die Quote trägt im `title` die Auskunft, ob gezählt oder nach Aktualität gewichtet | `title` enthält bei `hatRoh` „aus gezählten Starts", sonst „nach Aktualität gewichtet: … voll, ältere halb" |
| F1.5 | Kachel „Erfolgreichstes Deck" | `meta-analysis-hub.js:460` | Rolle, Name, Meta-Anteil groß, Top-8-Quote + Vielfaches | Kachel 1 trägt Rolle „Erfolgreichstes Deck"; Anteilswort „Meta-Anteil" |
| F1.6 | Kacheln „Meistgespielt · Rang n" | `meta-analysis-hub.js:481` | echter Feldrang, nicht laufender Zähler | Rang = `fieldRank`; bei Headline auf Rang 1 trägt die nächste Kachel „Rang 2" |
| F1.7 | Mindeststichprobe der Überschrift | `meta-analysis-hub.js:220` (`HEADLINE_MIN_BROUGHT = 100`) | nur Decks mit ≥100 gezählten Antritten dürfen Headline werden | Deck mit 53 Antritten erscheint nie als „stärkstes Deck" |
| F1.8 | Nennerzeile unter dem Satz | `meta-analysis-hub.js:399` | „Aus n Antritten · Deck: x von y in die Top 8" | Zahlen ganzzahlig, wenn gezählt; nur ohne gezählte Spalten halbe Werte + Wort „gewichtet" |
| F1.9 | Verweis „Wie das gerechnet ist →" | `meta-analysis-hub.js:556` | Anker `#quellen` | Klick öffnet Reiter Quellen & Methodik |
| F1.10 | Frische-Chip des Blocks | `meta-analysis-hub.js:551` | `data-quelle="online_tournament_top8_decks.csv"` | Datum = Stand genau dieser Datei |
| F1.11 | Kachelraster (6 Kacheln) | `#metaHubTileGrid`, `meta-analysis-hub.js:596` | City League, Deck-Analyse JP, Current Meta, Deck-Analyse Global, Past Meta, Meta Call — je Titel + Stichpunkte | 6 `.meta-hub-tile`; jede führt auf ihren Reiter, Meta Call auf `meta-call` (nicht ins Profil) |
| F1.12 | Unternavigation im Hub + „Zurück" | `meta-analysis-hub.js:648/655` (`#metaHubSubNavHost`) | Wechsel zwischen den 6 Unteransichten, Rückweg zum Kachelraster | Leiste erscheint nach Betreten einer Unteransicht; `#metaHubBackBtn` bringt das Raster zurück |

## F2 — City League Meta (`#city-league`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F2.1 | Überschrift „City-League-Entwicklung" + Hilfe + Frische-Chip | index.html:693 | Titel; Chip aus `city_league_archetypes.csv` | Chip nennt Datum dieser Datei |
| F2.2 | Format-Auswahl (Aktuelles/Vergangenes Meta) | index.html:696 (`#cityLeagueFormatSelect`) | `switchCityLeagueFormat()` | Wechsel lädt die Tier-Liste neu; Wahl bleibt über Sitzungen erhalten |
| F2.3 | Saisonpause-Hinweis | index.html:702 (`.cl-season-notice`) | nur zeigen, wenn wirklich Saisonpause | von CSS versteckt, per Inline-`display` eingeblendet (`app-city-league.js:552`) — nicht dauerhaft sichtbar, und auf beiden Reitern gleich |
| F2.4 | Ladeanzeige „Lädt…" | index.html:711 | verschwindet nach dem Laden | nach dem Rendern nicht mehr im DOM |
| F2.5 | Held-Kacheln (Top-Archetypen) | `app-tier-meta.js:1038` (`section.tier-hero-section`) | je Kachel Rang, Name, Variantenzahl, Deckzahl, Ø-Rang | Kachel ist per Tastatur erreichbar (`role="button"`, `tabindex="0"`); Enter/Leertaste lösen aus |
| F2.6 | Ø-Rang auf zwei Stellen | `app-tier-meta.js:1057` | dieselbe Genauigkeit wie die Tabelle darunter | Kachel und Tabelle zeigen denselben Wert mit 2 Nachkommastellen |
| F2.7 | Grundlagenzeile der CL-Tier-Liste | `app-tier-meta.js:1093` (`p.tier-grundlage`) | nennt Listenzahl, Archetypenzahl, Einzelstücke | Absatz steht zwischen Kacheln und Tier-Blöcken und trägt die drei Zahlen |
| F2.8 | Tier-Blöcke 1/2/3/Trending | `app-tier-meta.js:1101` | je Tier eine Deckliste, leere Tiers werden weggelassen | kein leerer Tier-Kasten sichtbar |
| F2.9 | Deck-Zeile → Analyse | `app-tier-meta.js:1070` (`analyzeCombinedArchetype`) | Klick öffnet die Deck-Analyse mit diesem Archetyp | Reiter `city-league-analysis` mit vorgewähltem Deck |
| F2.10 | Behälter `#cityLeagueTierSections` / `#cityLeagueContent` | index.html:709/710 | Aufnahmeort der gerenderten Liste | nach dem Laden nicht leer |
| F2.11 | Infokarte „Archetyp-Übersicht" | `app-city-league.js:1193` | Gesamtzahl + Top 3 nach Anzahl + Top 3 nach Platzierung | drei Zahlen und zwei Dreierlisten |
| F2.12 | Infokarte „Top-10-Veränderungen" | `app-city-league.js:1205` | Aufsteiger (+) und Absteiger (−); ohne Vorzeitraum ausdrücklich `cl.noBaseline` statt einer Behauptung | ohne Vorzeitraum sind `entries`/`exits` leer und der Hinweistext steht da (`app-city-league.js:1186`) |
| F2.13 | Infokarte „Datenquelle" | `app-city-league.js:1214` | Zeitraum + Turnierzahl | beide Werte gefüllt oder „N/A" |
| F2.14 | **Leerzustand der Vergleichstabellen** — „Warum hier keine Vergleichstabellen stehen" | `app-city-league.js:1034-1161` (`cityLeagueVergleichLeerHinweis`) | nennt jede fehlende Rubrik beim Namen und den Grund; nennt zusätzlich die drei Rubriken, die gerechnet, aber nie als Tabelle gezeigt werden, mit ihrer Zahl | Block erscheint nur, wenn etwas fehlt (`''` sonst); alle Zahlen werden hineingereicht (Archetypen, Zeitraum, Turniere, Mindestlisten, Mindestanteil) — keine im Text nachgerechnet (Befund B4) |
| F2.15 | Tabelle „Seltener gespielt" | `app-city-league.js:1263` | Spalten Archetyp · alte Anzahl · neue Anzahl · Änderung | nur bei `decreased.length > 0` |
| F2.16 | Tabelle „Performance verbessert" | `app-city-league.js:1301` | Spalten Archetyp · Anzahl · Ø-Platzierung | nur bei `improvers.length > 0` |
| F2.17 | Tabelle „Performance verschlechtert" | `app-city-league.js:1330` | wie F2.16 | nur bei `decliners.length > 0` |
| F2.18 | Archetyp-Verweis in den Tabellen | `app-city-league.js:1318/1347` (`a.archetype-jump-link`) | `jumpToCardAnalysis(name,'cityLeague')` | Klick öffnet die Deck-Analyse mit diesem Archetyp; Symbol vor dem Namen |
| F2.19 | Tabelle „Vollständiger Vergleich" | `app-city-league.js:1365` | alle Archetypen | erscheint zusammen mit F2.16/F2.17 |
| F2.20 | Suchfeld der Vergleichstabelle | `app-city-league.js:1367` (`#cityLeagueSearchFilter`) | `debouncedFilterCityLeagueTable()` | Zeilenzahl sinkt beim Tippen |
| F2.21 | Block „Archetyp kombiniert" + Erklärung | `app-city-league.js:1374` | erklärt die Zusammenfassung von Varianten | Text `cl.combinedExplanation` |
| F2.22 | Fußzeile „Erzeugt am …" + „Insgesamt erfasst n" | `app-city-league.js:1382` | Zeitstempel im Gebietsschema der Seite | englische Fassung zeigt `en-GB`, deutsche `de-DE` |
| F2.23 | Nicht gezeichnete Rubriken | `app-city-league.js:974-976` (`newArchetypes`, `disappeared`, `increased`) | werden gerechnet, aber als Tabelle NICHT gezeigt — sie werden in F2.14 mit Zahl genannt | sind sie > 0, steht ihre Zahl im Leerzustandsblock; eine eigene Tabelle gibt es für sie nicht |

## F3 — City League Deck-Analyse (`#city-league-analysis`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F3.1 | Überschrift + Hilfe + Frische-Chip (`city_league_analysis.csv`) | index.html:719 | Chip zeigt „keine Daten", wenn die Datei 0 Zeilen hat | leere Datei ⇒ kein Datum, sondern „keine Daten" (`ds-datenstand.js:169`) |
| F3.2 | Format-Auswahl | index.html:722 (`#cityLeagueFormatSelectAnalysis`) | wie F2.2 | beide Auswahlfelder bleiben synchron |
| F3.3 | Saisonpause-Hinweis | index.html:728 | wie F2.3 | — |
| F3.4 | Datum „Von" | index.html:737 (`#cityLeagueDateFrom`) | `applyCityLeagueDateFilter()` | Filter wirkt auf die geladenen Listen |
| F3.5 | Datum „Bis" | index.html:742 (`#cityLeagueDateTo`) | wie F3.4 | — |
| F3.6 | Formathinweis „TT.MM.JJJJ" | index.html:738/743 | fest | steht unter beiden Feldern |
| F3.7 | Deck-Auswahl | index.html:750 (`#cityLeagueDeckSelect`) | Archetyp wählen ⇒ lädt Statistik, Kartenübersicht, Deck Builder | nach Auswahl verliert `#cityLeagueStatsSection` `.d-none`, dadurch werden F3.11 und F3.20 sichtbar (Beobachter index.html:951) |
| F3.8 | Karten-Anteilsfilter | index.html:757 (`#cityLeagueFilterSelect`) | Alle / >90 / >70 / >50 % | Kartenzahl in F3.12 ändert sich |
| F3.9 | Kennzahl „Karten im Deck (einzig / Ø-Liste)" | index.html:769 (`#cityLeagueStatCards`) | zwei Zahlen | Wert ≠ „-" nach Deckwahl |
| F3.10 | Kennzahl „genutzte Decks" + Fußnote | index.html:773/774 (`#cityLeagueStatDecksUsed`, `#cityLeagueStatDecksNote`) | Fußnote nur wenn nötig | `hidden` solange kein Zusatz (`app-city-league.js:3243`) |
| F3.11 | Kennzahl „Ø Platzierung" | index.html:779 (`#cityLeagueStatAvgPlacement`) | Zahl | wie F3.9 |
| F3.12 | Kartenzahl-Anzeige | index.html:787 (`#cityLeagueCardCount`, `#cityLeagueCardCountSummary`) | „n Karten / m Gesamt" | Zahlen folgen Filter und Suche |
| F3.13 | Kartensuche | index.html:790 (`#cityLeagueOverviewSearch`) | `filterOverviewCards()`, entprellt 300 ms | Suche nach Name (DE/EN), Set+Nummer, Pokédex-Nr. filtert das Raster |
| F3.14 | Typfilter (9 Knöpfe) | index.html:792-801 | Alle · Pokémon · Supporter · Item · Tool · Stadion · Energie · Spez.-Energie · Ace Spec | genau einer trägt `.active` |
| F3.15 | Seltenheits-Umschalter (3 Knöpfe) | index.html:804-806 | Niedrig / Max / Alle Drucke | genau einer aktiv; Kartenbilder wechseln |
| F3.16 | „Deckliste kopieren" | index.html:809 | `copyDeckOverview()` → Zwischenablage im PTCGL-Format | Toast bestätigt; Zwischenablage enthält Zeilen `n Name SET Nr` |
| F3.17 | „Grid"-Umschalter | index.html:810 | `toggleDeckGridView()` | wechselt zwischen `#cityLeagueDeckTableView` und `#cityLeagueDeckVisual` |
| F3.18 | Kartentabelle | index.html:813 (`#cityLeagueDeckTable`) | Tabellenansicht der Karten | nach Deckwahl gefüllt |
| F3.19 | Kartenraster | index.html:817 (`#cityLeagueDeckGrid`) | Kachelansicht mit Plaketten und Aktionsknöpfen A–K (siehe F0.52) | jede Kachel trägt −/+/★ und L/P/Preis |
| F3.20 | Abschnitt „Deck Builder" | index.html:820 (`#cityLeagueDeckBuilderSection`) | erscheint mit der Deckwahl | siehe F3.7 |
| F3.21 | „Consistency Generate" | index.html:826 | `autoCompleteConsistency('cityLeague','min')` | Deckzähler springt auf ~60 |
| F3.22 | „↑ Max Rarity" | index.html:827 | `toggleDeckRarity('cityLeague', …)` | jede Karte wechselt auf den höchsten Druck; erneuter Klick zurück |
| F3.23 | Kennzahl „Karten /60" | index.html:834 (`#cityLeagueDeckCount`) | laufende Zahl | Änderung blendet F3.26 ein/aus (Beobachter index.html:970) |
| F3.24 | Kennzahl „einzigartige Karten" | index.html:838 (`#cityLeagueDeckCountUnique`) | Zahl in Klammern | — |
| F3.25 | Kennzahl „Preis" | index.html:842 (`#cityLeagueDeckPrice`) | Summe in € mit Komma | Format „0,00 €" |
| F3.26 | „Test Draw" | index.html:848 | `openDrawSimulator('cityLeague')` | Dialog F17.14 öffnet |
| F3.27 | „📋 TCG Showdown ↗" | index.html:849 | Deck kopieren + externen Tab öffnen | Zwischenablage gefüllt, neuer Tab |
| F3.28 | „Leeren" (zweistufig) | index.html:850 (`.deck-builder-clear-btn`) | 1. Klick schärft und beschriftet „Wirklich leeren?", 2. Klick leert | siehe F17.1 |
| F3.29 | Aufklapp-Hinweis „Wie der Consistency-Builder rechnet" | index.html:852 | Erklärtext, eingeklappt | `<details>` startet zu |
| F3.30 | Handstatistik | index.html:860 (`#cityLeagueHandStats`) | Kennzahlen zur Starthand | nach „Generate" gefüllt (`app-features.js:1459`) |
| F3.31 | Panel „Dein Deck" | index.html:861 (`#cityLeagueMyDeckVisual`) | erscheint ab 1 Karte | `.d-none` verschwindet bei Zähler > 0 |
| F3.32 | „Speichern" | index.html:865 | `saveCurrentDeckToProfile('cityLeague')` | Deck erscheint unter Profil → Meine Decks |
| F3.33 | „Warum?" (Bauauskunft) | index.html:866 | `showConsistencyBuildInfo()` | Dialog nennt je Karte die Herleitung; Zeile „Datenbasis: n Listen" |
| F3.34 | „Vergleichen" | index.html:867 | `openDeckCompare('cityLeague')` | `#deckCompareModal` öffnet |
| F3.35 | „Kopieren" | index.html:868 | `copyDeck('cityLeague')` | Zwischenablage gefüllt |
| F3.36 | „Deck → Proxy" | index.html:869 | `sendCurrentDeckToProxyPrinter()` | Warteschlange gefüllt + Reiter `proxy` |
| F3.37 | „Teilen" | index.html:870 | `shareDeck('cityLeague')` | Bildvorschau F17.15 |
| F3.38 | „PTCGL"-Import | index.html:871 | `importFromPTCGL('cityLeague')` | Eingabefeld/Dialog; Liste landet im Deck |
| F3.39 | „PTCGL"-Export | index.html:872 | `exportToPTCGL('cityLeague')` | Zwischenablage im PTCGL-Format |
| F3.40 | „Grid" (Deckbild) | index.html:873 | `generateDeckGrid('cityLeague')` | `#deckGridPreviewModal` öffnet |
| F3.41 | Deck-Suche mit Vorschlagsliste | index.html:876 (`#cityLeagueDeckGridSearch`, `#cityLeagueDeckAutocomplete`) | Suchen und Hinzufügen | Tippen zeigt Vorschläge; Klick fügt Karte hinzu |
| F3.42 | Leerzustand „Dein Deck ist leer" | index.html:880 | Symbol, Titel, Text, 2 Knöpfe („Deck generieren", „Test Draw öffnen") | sichtbar solange 0 Karten, `role="status"` |
| F3.43 | Bankreihe | index.html:887 (`#cityLeagueBenchSection`) | zeigt überzählige Kopien | gefüllt von `app-deck-builder.js:8640` |
| F3.44 | Meta-Kartenanalyse: Kartenzahl | index.html:894 (`#cityLeagueMetaCardCount`) | „n Karten" | — |
| F3.45 | Anteilsfilter (4 Knöpfe) | index.html:897-900 | Alle / >90 / >70 / >50 % | genau einer `.active` |
| F3.46 | Typfilter (4 Knöpfe) | index.html:903-906 | Alle / Trainer / Pokémon / Energie | genau einer `.active` |
| F3.47 | Sortierung (3 Knöpfe) | index.html:908-910 | nach Typ / Anteil / Ø-Anzahl | Reihenfolge im Raster ändert sich |
| F3.48 | Meta-Kartensuche | index.html:912 (`#cityLeagueMetaSearch`) | `filterMetaCards('cityLeague')`, entprellt | — |
| F3.49 | Leerzustand „Meta-Analyse noch nicht geladen" | index.html:914 | Text + Knopf „Meta-Analyse laden" | vor dem Laden sichtbar |
| F3.50 | Knopf „Meta-Analyse laden" (Fußreihe) | index.html:932 (`#cityLeagueMetaReloadBtn`) | lädt bzw. lädt neu; Beschriftung wechselt nach dem Laden | nach dem Laden steht dort nicht mehr derselbe Text wie im Leerzustand |
| F3.51 | Abschnitt „Tech vs Normal" | index.html:936 (`#cityLeagueTechVsNormalSection`) | vergleicht letzte Normal- und Tech-Liste | erscheint nur mit Daten |

## F4 — Current Meta / Startseite (`#current-meta`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F4.1 | Überschrift „Current meta" + Formatkürzel | index.html:1118 (`#cmFormatLabel`) | Kürzel aus `window._formatWindow` | `ds-nav.js:411` schreibt „ · TEF–PBL"; überlebt Rotation |
| F4.2 | Hilfe-Knopf + Frische-Chip (`limitless_online_decks.csv`) | index.html:1118 | — | siehe F0.40/F0.42 |
| F4.3 | Skelett-Vorschau beim Laden | index.html:1139 | 6 Platzhalterkarten | verschwinden nach dem Laden |
| F4.4 | Abschnitt „Die meistgespielten Decks" | `ds-sections.js:67`, Inhalt `app-tier-meta.js:1483` | offen beim Start | Kopf klappt auf/zu, Zustand in `localStorage['ds_sections_v1']` |
| F4.5 | Held-Kacheln Global | `app-tier-meta.js:1543` | Rang, Name, Variantenzahl, Anteil, „WR x % · n" | jede WR trägt ihren Nenner (Antritte); ohne Antritte bleibt der Zusatz weg |
| F4.6 | Abschnitt „Matchups" (Heatmap) | `ds-sections.js:70`, `app-current-meta.js:688` (`#matchupHeatmapContainer`) | offen beim Start | Gitter mit WR/M je Paarung |
| F4.7 | Heatmap-Suche Y-Achse | `app-current-meta.js:292` (`#heatmapSearchY`) | filtert Zeilen, entprellt | Zeilenzahl sinkt |
| F4.8 | Heatmap-Suche X-Achse | `app-current-meta.js:296` (`#heatmapSearchX`) | filtert Spalten | Spaltenzahl sinkt |
| F4.9 | Heatmap-Leerzustand mit Grund | `app-current-meta.js:377` (`p.heatmap-empty-reason`) | nennt, WELCHE Suche leer lief | Text nennt den gesuchten Begriff |
| F4.10 | Heatmap-Legende (WR / M) | `app-current-meta.js:689` ff. | Wörter einmal oben, Kürzel in den Zellen | Legende vorhanden, Zellen tragen Kürzel |
| F4.11 | Heatmap-Zelle → Toast | `app-current-meta.js:679` | Klick zeigt vollen Tooltip als Meldung | Toast enthält Bilanz + Präsenzangabe oder „Major fehlt" |
| F4.12 | Abschnitt „Meistgespielte Karten" | `ds-sections.js:73`, `app-tier-meta.js:3058` | offen beim Start | Kartenraster |
| F4.13 | Anzahl-Umschalter „Top n" | `app-tier-meta.js:3043` (`#staplesAnzahl-<n>`) | Umfang der Staple-Liste | genau einer `.active`/`aria-pressed=true` |
| F4.14 | „Bild erzeugen" (Staples) | `app-tier-meta.js:3052` | `staplesBildErzeugen()` | Bildvorschau F17.15 öffnet |
| F4.15 | Kartenknöpfe ♡ / ★ im Staple-Raster | `app-tier-meta.js:3086` ff. | Wunschliste / Druckwechsel | ♡ setzt Karte auf die Wunschliste, ★ öffnet den Druck-Wechsler |
| F4.16 | Abschnitt „Gegen welches Meta?" (EV-Rechner) | `ds-sections.js:76`, `ds-ev-rechner.js:420` | eingeklappt beim Start | Kopf vorhanden |
| F4.17 | EV: Deck-Auswahl | `ds-ev-rechner.js:433` (`.ds-ev-deck`) | eigenes Deck wählen | Ergebnis rechnet neu |
| F4.18 | EV: Feld-Auswahl | `ds-ev-rechner.js:436` (`.ds-ev-feldwahl`) | gegen welches Feld | Feldnotiz darunter wechselt |
| F4.19 | EV: Rundenzahl | `ds-ev-rechner.js:439` (`.ds-ev-runden`) | 1–20 | Ergebnis skaliert mit den Runden |
| F4.20 | EV: Ergebnis + Fußnote | `ds-ev-rechner.js:443/444` | Tabelle + Herkunft | Ergebnis nicht leer nach Auswahl |
| F4.21 | Abschnitt „Tier-Liste" | `ds-sections.js:79` | eingeklappt beim Start | Kopf + Unterzeile „alle Archetypen nach Stärke gruppiert" |
| F4.22 | Grundlagenzeile der Tier-Liste (Global) | `app-tier-meta.js:173/2492` (`p.tier-grundlage`) | erklärt den zusammengesetzten Wert mit allen Gewichten, Deckeln, Schwellen; nennt ausdrücklich, wenn KEINE Turnierdatei vorliegt | alle Zahlen im Satz stammen zur Laufzeit aus denselben Konstanten wie die Rechnung (`test-cm-tier-grundlage.js`); Satz nennt „Listenzahl des größten Archetyps", nicht die des Rang-1-Decks |
| F4.23 | Abschnitt „Meta-Performance" (Rangliste) | `ds-sections.js:82`, `app-tier-meta.js:2254` | eingeklappt; sortierbare Tabelle | Kopf + Tabelle |
| F4.24 | Rangliste: Spalte „#" | `app-tier-meta.js:2308` | laufende Nummer | — |
| F4.25 | Rangliste: Spalte „Deck" | `app-tier-meta.js:2070` | Name | sortierbar |
| F4.26 | Rangliste: Spalte „Listen" | `app-tier-meta.js:2071` | Decklisten aus den Online-Turnieren | Sortierung erkennt Tausenderpunkt korrekt (`rangliste-sortieren.js:56`) |
| F4.27 | Rangliste: Spalte „Anteil" | `app-tier-meta.js:2073` | % | Glossarhinweis `hilf:'share'` |
| F4.28 | Rangliste: Spalte „Win Rate" | `app-tier-meta.js:2074` | Siege / alle Partien | Tooltip nennt Quelle und Rechnung |
| F4.29 | Rangliste: Spalte „Turnier-Antritte" | `app-tier-meta.js:2103` | gezählte Starts | Spalte wird ausgeblendet, solange KEINE Zeile einen Wert hat (`SPALTEN_SICHTBAR`, 2155) |
| F4.30 | Rangliste: Spalte „Top 8" | `app-tier-meta.js:2110` | Anzahl | wie F4.29 |
| F4.31 | Rangliste: Spalte „Top-8-Quote" | `app-tier-meta.js:2114` | % | bleibt auch ohne gezählte Starts stehen |
| F4.32 | Rangliste: Spalte „ggü. Schnitt" | `app-tier-meta.js:2125` | Vielfaches, geglättet; Zusatz nennt den Meta-Durchschnitt dieses Laufs | Tooltip enthält „Der Meta-Durchschnitt liegt bei x %" |
| F4.33 | Rangliste: Sortierung je Spaltenkopf | `rangliste-sortieren.js:129` | Klick sortiert auf/ab | Pfeilrichtung wechselt; Handler hängt am `document`, überlebt Neuzeichnen |
| F4.34 | Hinweis über der Rangliste | `app-tier-meta.js:2256` | beschreibt nur die Spalten, die auch dastehen | Text erwähnt „Turnier-Antritte" nur, wenn die Spalte sichtbar ist |
| F4.35 | Hinweis auf nicht zugeordnete Turniernamen | `app-tier-meta.js:2237` | nennt die betroffenen Namen | Absatz nur bei tatsächlich offenen Zuordnungen |
| F4.36 | „Ansicht zurücksetzen" + „n von 6 Abschnitten offen" | `ds-sections.js:246` (`#dsSecReset`) | nur sichtbar, wenn vom Standard abgewichen | Zähler nie größer als die Zahl der Abschnitte (unbekannte IDs werden verworfen, `ds-sections.js:255`) |

## F5 — Deck-Analyse Global (`#current-analysis`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F5.1 | Überschrift + Hilfe + Untertitel | index.html:1146/1148 | — | — |
| F5.2 | Tiefenumschalter „Schnellüberblick / Deep Dive" | index.html:1151/1156 | `setCurrentMetaViewMode()`; im Schnellüberblick sind alle `.cm-deep-dive-only`-Blöcke aus | `aria-selected` wechselt; Zahl sichtbarer `.cm-deep-dive-only` geht auf 0 bzw. zurück |
| F5.3 | Turnierformat-Filter (3 Knöpfe) | index.html:1167-1169 | Alle / Limitless-Decks / Major-Turnier-Decks | genau einer `.active`; `#currentMetaFilterStatus` sagt, was gefiltert ist |
| F5.4 | Datenfenster „ab" | index.html:1175 (`#currentMetaDateFrom`) | `setCurrentMetaDateFrom()` | Tabellen rechnen neu; dasselbe Feld gibt es in Meta Call (F7.5) und beide zeigen denselben Wert |
| F5.5 | „Leeren" (Datenfenster) | index.html:1177 (`#currentMetaDateClear`) | `clearCurrentMetaDateFrom()` | Feld leer, `#currentMetaDateStatus` aktualisiert |
| F5.6 | Deck-Auswahl | index.html:1183 (`#currentMetaDeckSelect`) | lädt den Archetyp | `#currentAnalysisEmptyState` verschwindet, `#currentMetaArchetypeCard` erscheint |
| F5.7 | Zweitdeck „+ Fusion (Cooking)" | index.html:1189 (`#currentMetaDeckSelectSecondary`) | nur im Deep Dive | in `.cm-deep-dive-only`; Standard „Keins (Einzeldeck)" |
| F5.8 | Karten-Anteilsfilter | index.html:1195 (`#currentMetaFilterSelect`) | Alle / >90 / >70 / >50 % | Kartenzahl ändert sich |
| F5.9 | Leerzustand „Wähle ein Deck-Archetype…" | index.html:1207 (`#currentAnalysisEmptyState`) | Pfeil, Titel, Hinweis | sichtbar bis zur ersten Deckwahl |
| F5.10 | Archetyp-Karte (eingebettet) | index.html:1214 (`#currentMetaArchetypeCard`), `app-archetype-card.js:1343` | Kopf + Kachelblock, ohne Matchup-Tabelle (Variante `embed`) | Karte trägt Namen, Symbole und den Bild-Knopf |
| F5.11 | Archetyp-Karte: Knopf „Bild" | `app-archetype-card.js:1308` (`.arc-share`) | Analyse als Bild 1200×675 | Bildvorschau öffnet |
| F5.12 | Archetyp-Kacheln (4 Stück) | `app-archetype-card.js:897` | Vertretung, WR, Konversion, Tag 2 | jede Kachel trägt Wert + Beschriftung; Kacheln ohne Präsenzdaten sagen das im Klartext („Für dieses Format gibt es noch kein Präsenzturnier mit diesem Deck") |
| F5.13 | Zeitraumzeile der Kacheln | `app-archetype-card.js:971` (`p.arc-zeitraum`) | Zeitraum der Präsenzzahlen | Absatz mit `title` |
| F5.14 | Archetyp-Matchup-Tabelle | `app-archetype-card.js:1213` | Spalten: Gegner-Deck · WR · M · W · L · T · Major-WR · Major-Matches | Kopfzelle „T", nicht „U"; Major-Spalten fehlen ganz, wenn keine Präsenzdaten vorliegen |
| F5.15 | Legende der Matchup-Tabelle | `app-archetype-card.js:1268` | erklärt WR/M/W/L/T und Major-Spalten; ohne Präsenzdaten ein eigener Satz | genau eine der beiden Fassungen steht da |
| F5.16 | Mindeststichprobe bei Präsenz-Paarungen | `app-archetype-card.js:1197` (`p.arc-mu-note-praesenz`) | Prozentwert erst ab `MIN_PRAESENZ_PARTIEN`; darunter Bilanz + Partienzahl; Hinweis nennt Schwelle, Punktverschiebung und „k von g Zeilen" | Hinweis erscheint nur, wenn mindestens eine Zeile unter der Schwelle liegt; Zellen unter der Schwelle tragen `arc-mu-major-duenn` |
| F5.17 | Kennzahl „Karten im Deck" | index.html:1222 (`#currentMetaStatCards`) | zwei Zahlen | ≠ „-" nach Deckwahl |
| F5.18 | Kennzahl „Gesamt-Win-Rate Limitless Online" | index.html:1226 (`#currentMetaStatWinrate`) | % | — |
| F5.19 | Kennzahl „Matchup ggü. Top 20" | index.html:1230 (`#currentMetaStatMatchup`) | % | — |
| F5.20 | Block „In Top 256 verwendet" | index.html:1233 (`#currentMetaTop256Section/List`) | Liste, sonst versteckt | `.d-none` solange leer (`app-current-meta-analysis.js:2297`) |
| F5.21 | Tabelle „Beste Matchups" | index.html:1261 | Spalten Gegner · Win Rate · Bilanz | Leerzustand: eine Zeile „Keine Daten verfügbar" über 3 Spalten |
| F5.22 | Tabelle „Schlechteste Matchups" | index.html:1278 | wie F5.21 | wie F5.21 |
| F5.23 | Gegnersuche | index.html:1298 (`#currentMetaOpponentSearch`, `#currentMetaOpponentDropdown`) | Tippen filtert die Gegnerliste; Auswahl schreibt in `#currentMetaOpponentSelected` und füllt `#currentMetaMatchupDetails` | Liste wird auf JEDEM Weg gefüllt (`app-current-meta-analysis.js:4067`), auch auf dem CSV-Ersatzweg |
| F5.24 | Leerzustand der Gegnersuche mit Grund | `app-current-meta-analysis.js:4042` (`.cm-gegner-leer`) | drei unterscheidbare Sätze: „noch nicht geladen" / „Datei ohne Zeilen" / „für dieses Deck keine Paarungen" | der ausgegebene Satz nennt Deckname und Datei und benennt den zutreffenden der drei Zustände |
| F5.25 | Abschnitt „Matchups vs Meta Call" | index.html:1458 (`#currentMetaVsMetaCallSection`) | nur Deep Dive | `.cm-deep-dive-only` |
| F5.26 | Tabelle „vs vorhergesagtes Feld" | index.html:1464 | Spalten Gegner · Feld-% · Win Rate | Leerzustand: `td colspan=3` mit `.mc-vs-empty` (`app-current-meta-analysis.js:2665`) |
| F5.27 | Legende der WR-Pillen | index.html:1478-1487 | Farbstufen mit Schwellen | 5 Legendeneinträge |
| F5.28 | Abschnitt „Dein Build vs Vanilla" | index.html:1499 (`#currentMetaUserVsVanillaSection`) | nur Deep Dive | — |
| F5.29 | Tabelle „Vanilla vs dein Build" | index.html:1508 | Spalten Gegner · Feld-% · Vanilla · Dein Build · Delta | Leerzustand: `td colspan=5` mit `.mc-vs-empty` (`app-current-meta-analysis.js:3343`) |
| F5.30 | Erkannte Techs | index.html:1505 (`#currentMetaUserVsVanillaDetectedTech`) | Liste der Tech-Karten | gefüllt nach Build |
| F5.31 | Kartenunterschied | index.html:1529 (`#currentMetaUserVsVanillaCardDiff`) | Karten-Diff zur Vanilla-Liste | — |
| F5.32 | Deck Builder (Global) — Werkzeugleiste | index.html:1534 (`#currentMetaDeckBuilderSection`) | wie F3.20-F3.43 mit Quelle `currentMeta` | Beobachter index.html:998/1029 blendet Panels ein |
| F5.33 | „Build vs …" | index.html:1540 | `openAntiTechModal('currentMeta')`, nur Deep Dive | `#antiTechModal` öffnet |
| F5.34 | Tech-Slot-Reihe | index.html:1573 (`.tech-slots-row[data-source=currentMeta]`) | Zähler „n/10", Raster, „Leeren" | `#currentMetaTechSlotsCount` folgt der Belegung |
| F5.35 | Tech-Slot-Suche | index.html:1583 (`#currentMetaTechSlotInput`, `#currentMetaTechSlotDropdown`) | `techSlotSearch()`; Esc schließt | Vorschläge erscheinen; Esc blendet den Wähler aus |
| F5.36 | „Quick Reference Lists" | index.html:1689 (`#currentMetaQuickRefSection`) | zwei Spalten: letztes Major (beste Platzierung) und typischer Online-Build | beide `.current-meta-quickref-body` gefüllt |
| F5.37 | „3-Wege-Vergleich" | index.html:1703 | `openThreeWayCompare()` | `#threeWayCompareModal` verliert `.d-none`, `#threeWayCompareBody` gefüllt |
| F5.38 | Tech Lab: Zielkarten-Suche | index.html:1724 (`#techLabTargetSearch`, `#techLabTargetDropdown`) | Karte wählen | `#techLabTargetLabel` zeigt den Namen statt „keine" |
| F5.39 | Tech Lab: Vorschaubild + Auswahlanzeige | index.html:1732/1735 | Bild + Name | — |
| F5.40 | Tech Lab: „Overrides zurücksetzen" | index.html:1740 (`#techLabResetBtn`) | löscht lokale Korrekturen | erst nach einer Korrektur aktiv (`disabled` im Ausgangszustand) |
| F5.41 | Tech Lab: Starthinweis | index.html:1744 (`#techLabStartHint`) | „Wähle eine Zielkarte…" | sichtbar bis zur ersten Auswahl |
| F5.42 | Tech Lab: Abschnitt „Wird geschlagen von" | index.html:1749 | Zusammenfassung + Liste | `#techLabBeatenByList` gefüllt |
| F5.43 | Tech Lab: „+ Fehlende ergänzen" (schlägt) | index.html:1753 (`#techLabAddBeatenByBtn`) | öffnet `#techLabAddOverlay` | erst nach Zielwahl aktiv |
| F5.44 | Tech Lab: Abschnitt „Gut gegen" | index.html:1765 | Zusammenfassung + Liste | `#techLabBeatsList` gefüllt |
| F5.45 | Tech Lab: „+ Fehlende ergänzen" (wird geschlagen) | index.html:1769 (`#techLabAddBeatsBtn`) | wie F5.43 | — |
| F5.46 | Tech Lab: Datenhinweis | index.html:1777 | nennt Quelle und Speicherort der lokalen Korrekturen | Text nennt `data/card_capability_*.json` und den `localStorage`-Schlüssel |
| F5.47 | Tech Lab: Dialog „Tech ergänzen" | index.html:1782 (`#techLabAddOverlay`) | Suche + Auswahl + Schließen | Auswahl erscheint sofort in der Liste und übersteht Neuladen |
| F5.48 | Tech Lab: Alter der Datenbasis | `app-tech-lab.js:166` | Datum über der Liste | Datumsangabe vorhanden |
| F5.49 | Kartenübersicht (Global) | index.html:1311-1343 | Suche, 9 Typfilter, 3 Seltenheitsknöpfe, „Kopieren", „Grid" | wie F3.12-F3.19 mit Präfix `currentMeta` |
| F5.50 | Meta-Kartenanalyse (Global) | index.html:1633-1669 | 4 Anteils-, 4 Typ-, 3 Sortierknöpfe, Suche, Leerzustand, Knopfreihe zum Laden | wie F3.44-F3.50 mit Präfix `currentMeta`. **Offen:** dem Knopf in index.html:1668 fehlt `id="currentMetaMetaReloadBtn"`, nach dem `app-meta-cards.js:733` sucht — die Umbenennung greift dort nie |
| F5.51 | „Tech vs Normal" (Global) | index.html:1672 (`#currentMetaTechVsNormalSection`) | wie F3.51 | — |

## F6 — Past Meta (`#past-meta`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F6.1 | Überschrift + Hilfe + Frische-Chip | index.html:1801 | — | — |
| F6.2 | Meta/Format-Filter | index.html:1809 (`#pastMetaFormatFilter`) | abgeschlossene Formatfenster | Auswahl lädt die Turnierliste neu |
| F6.3 | Turnier-Filter | index.html:1815 (`#pastMetaTournamentFilter`) | Turnier eingrenzen | — |
| F6.4 | Ladeanzeige der Turnierliste | index.html:1834 (`#pastMetaLadestand`) | `role="status" aria-live="polite"`, `hidden` solange nichts lädt | während des Nachladens Fortschrittstext, danach wieder `hidden` (`app-past-meta.js:173`) |
| F6.5 | Deck-Auswahl | index.html:1838 (`#pastMetaDeckSelect`) | Archetyp | blendet Statistik/Karten/Builder ein (Beobachter index.html:1010) |
| F6.6 | Karten-Anteilsfilter | index.html:1844 (`#pastMetaFilterSelect`) | Alle / >90 / >70 / >50 % | — |
| F6.7 | Sammelauswahl-Hinweis | index.html:1868 (`#pastMetaFamilieHinweis`) | erscheint nur bei gewählter Deck-FAMILIE und erklärt, dass die Prozentzahlen dann über alle Varianten laufen | `hidden` bei Einzelvariante (`app-past-meta.js:1141`) |
| F6.8 | Kennzahl „Karten im Deck" | index.html:1874 (`#pastMetaStatCards`) | zwei Zahlen; `title` erklärt links/rechts | Tooltip vorhanden |
| F6.9 | Kennzahl „Turnier" | index.html:1878 (`#pastMetaStatTournament`) | Name | — |
| F6.10 | Kennzahl „Format" | index.html:1882 (`#pastMetaStatFormat`) | Kürzel | — |
| F6.11 | Abschnitt „Turnier-Performance" | index.html:1889 (`#pastMetaPerformanceSection`) | nur bei EINEM gewählten Format | bei Filter „alle Formate" ausgeblendet |
| F6.12 | Matchup-Block Past | index.html:1894 (`#pastMetaMatchupBlock`) | Paarungen des Archetyps | Mindeststichprobe greift (`app-past-meta.js:2151`) |
| F6.13 | Abschnitt „Erfolgreichste Liste" | index.html:1902 (`#pastMetaMostSuccessfulSection/Body`) | bestplatzierte Einzelliste + „Vergleichen" | Block erscheint nach Deckwahl |
| F6.14 | Kartenübersicht Past | index.html:1911-1935 | Zahl, Suche, 9 Typfilter, 3 Seltenheitsknöpfe, „Kopieren", „Grid" | wie F3.12-F3.19 mit Präfix `pastMeta` |
| F6.15 | Deck Builder Past | index.html:1952-2043 | Generate, Max Rarity, Kennzahlen, Test Draw, Showdown, Leeren (zweistufig), Algo-Hinweis, Tech-Slots, „Dein Deck" mit 9 Knöpfen, Suche, Leerzustand, Bank | wie F3.20-F3.43 mit Präfix `pastMeta` |
| F6.16 | „Build vs …" (Past) | index.html:1996 | `openAntiTechModal('pastMeta')` | Modal öffnet |
| F6.17 | „Tech vs Normal" (Past) | index.html:2049 (`#pastMetaTechVsNormalSection`) | wie F3.51 | — |

## F7 — Meta Call (`#meta-call`)

Reiter enthält statisch nur die Zurück-Leiste und `#metaCallHost` (index.html:2081). Alles Weitere zeichnet `MetaCall.renderAll()` (`app-meta-call.js:10883`).

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F7.1 | Überschrift „Meta Call" + Hilfe | `app-meta-call.js:10936` | Untertitel nennt das ZIEL typabhängig (`_zielKurz()`) | bei Cup steht „Top 8", bei Challenge „1.-2.", sonst „Day 2" — nirgends hart „Day 2" |
| F7.2 | Szenarien-Leiste | `app-meta-call.js:14166` (`renderScenariosBar`) | Szenarien speichern/laden/löschen (localStorage) | gespeichertes Szenario übersteht Neuladen |
| F7.3 | Datenfenster-Kachel | `app-meta-call.js:10919` (`.metacall-date-window`) | Label, Datumsfeld, „Leeren", aktiver Fensterhinweis | Hinweis nennt das Datum in Seitensprache (TT.MM.JJJJ / TT/MM/JJJJ), nicht ISO |
| F7.4 | Datumsfeld | `app-meta-call.js:10930` (`#metacallDateFrom`) | schreibt `setCurrentMetaDateFrom()` | Änderung wirkt auch in F5.4 |
| F7.5 | „Leeren" (Datenfenster) | `app-meta-call.js:10933` | `clearCurrentMetaDateFrom()`, nur sichtbar wenn gesetzt | ohne Wert `display:none` |
| F7.6 | Quellen-Umschalter „Current Meta / Vergangenes Meta" | `app-meta-call.js:10092` (`renderMetaSourcePanel`) | bleibt AUCH im eingefrorenen Past-Modus stehen | im eingefrorenen Modus sind die `.mc-tt-tab`-Pillen weiter vorhanden (Befund M1, 07.09.2026) |
| F7.7 | Format-Auswahl im Past-Modus | `app-meta-call.js:10135` | Auswahl des abgeschlossenen Formats | `_setMetaSource('past', wert)` |
| F7.8 | Quellenhinweis-Chip | `app-meta-call.js:10130` | „📌 eingefroren" bzw. „ⓘ Matchups = labs majors" | genau einer der beiden Chips |
| F7.9 | Modus-Umschalter „standard / counter" | `app-meta-call.js:10069` | im eingefrorenen Modus ausgeblendet | — |
| F7.10 | Datenquellen-Schalter (City League) | `app-meta-call.js:10164` (`renderSourcesPanel`) | zwei Kästchen mit Anzahlangabe | `.mc-source-meta` nennt die Zahl der Einträge je Quelle |
| F7.11 | Turniertyp-Reiter (5) | `app-meta-call.js:9963` | Worlds · Regional · International · Challenge · Cup | genau einer `mc-tt-tab-active`; Beschriftungen der Felder darunter wechseln mit dem Typ |
| F7.12 | Typbeschreibung | `app-meta-call.js:9966` | ein Satz je Typ | Text wechselt mit F7.11 |
| F7.13 | Feld „Spielerzahl" | `app-meta-call.js:9970` (`#mc-players`) | 2–9999 | Wert erscheint in der Feldtabelle und auf den Bildern |
| F7.14 | Feld „Runden" | `app-meta-call.js:9979/9983` (`#mc-rounds`) | bei Majors Auswahl 8/9, sonst Zahleneingabe 1–15 | Typwechsel wechselt das Bedienelement |
| F7.15 | Rundenhinweis (Herkunft) | `app-meta-call.js:9857` (`p.mc-runden-herkunft`) | nur bei Major-Typen: „Runden sind hier eine Eingabe, keine Ableitung aus der Spielerzahl … x statt y Runden setzt das Punkteziel auf z" | Satz erscheint NUR bei Worlds/Regional/International; die genannte Zielpunktzahl stammt aus `MAJOR_DAY2_POINTS`, nicht aus Text |
| F7.16 | Feld „Punkteziel" | `app-meta-call.js:9990` (`#mc-day2pts`) | 1–45; Beschriftung typabhängig | bei Cup „Ziel-Cut-Punkte", bei Challenge „Ziel-Top-Punkte", sonst „Day-2-Punkte" |
| F7.17 | Feld „Top Cut" (nur Cup) | `app-meta-call.js:9951` (`#mc-topcut`) | 4 oder 8 | erscheint nur beim Typ Cup |
| F7.18 | Feld „Turniername" | `app-meta-call.js:9997` (`#mc-turniername`) | max. 60 Zeichen; erscheint auf dem Bild | — |
| F7.19 | Grenzen-Hinweis | `app-meta-call.js:10007` (`#mc-grenzen-hinweis`) | `role="status" aria-live="polite"`, `hidden` solange nichts zu melden ist | erscheint nur bei unplausiblen Eingaben |
| F7.20 | Zielhinweis + Swiss-Calculator-Link | `app-meta-call.js:10009/9946` | Link nur bei lokalen Typen | bei Major-Typen kein Link |
| F7.21 | „Bild erzeugen" (Turnierbild) | `app-meta-call.js:10011` | `generateTournamentImage()` | Bildvorschau öffnet |
| F7.22 | Vorhersage-Banner | `app-meta-call.js:11537` (`renderPredictorBanner`) | nennt den Modus (A/B) samt Zeilenzahl | Banner ist verdrahtet und sichtbar; der große Diagnose-Streifen bleibt absichtlich aus |
| F7.23 | Stichproben-Chip im Banner | `app-meta-call.js:11720` | sagt, wenn kein gültiges Tagesfenster gilt | Warnfarbe + Erklärung im `title` |
| F7.24 | Gewichtungs-Chip im Banner | `app-meta-call.js:11738` (`span.mc-predictor-banner-gewichtung`) | „Gewichtung der Paarungen: x % Papier (y % Day 2 · z % Day 1) · w % Online" plus ggf. „Predictor 5.3 für <Deck>: ±n pp" | alle Prozente kommen zur Laufzeit aus `MATCHUP_BLEND_WEIGHT_*`; der `title` nennt die Konvention S/(S+N) aus `js/win-rate-konvention.js` und begründet sie |
| F7.25 | Feld-Panel: Kopf „Top N" + „n Spieler" | `app-meta-call.js:10474-10476` | Abzeichen | Spielerzahl entspricht F7.13 |
| F7.26 | „Alle auf-/zuklappen" | `app-meta-call.js:10477` | `_toggleAllDetails()` | alle Detailzeilen wechseln gemeinsam |
| F7.27 | „Gruppieren" | `app-meta-call.js:10481` | `_toggleGroupField()` — Familien statt Varianten | Gruppenzeilen mit Variantenzahl erscheinen |
| F7.28 | „Teilen" (Feldtabelle als Bild) | `app-meta-call.js:10485` | `exportFieldShareImage()` | Bildvorschau |
| F7.29 | Feldtabelle: Spalten | `app-meta-call.js:10506-10519` | Deck · Online % · Persönlich · Final · Spieler · Ø Begegnungen (n R.) | Kopf der letzten Spalte nennt die aktuelle Rundenzahl |
| F7.30 | Persönliche Anteilseingabe je Deck | `app-meta-call.js:10225` (`.mc-personal-input`) | überschreibt den Online-Anteil | Finalspalte wechselt auf `has-personal` |
| F7.31 | Detailzeile je Deck | `app-meta-call.js:10232/10256` | Aufklappknopf + Intel-Block | Klick öffnet die Zeile darunter |
| F7.32 | Eigene Decks (Custom) | `app-meta-call.js:10528` (`#mc-custom-decks-panel`) | bis `MAX_CUSTOM` Zeilen mit Name + Anteil + Entfernen; „Hinzufügen" bzw. Höchstzahl-Hinweis | Zähler „n/MAX" im Kopf stimmt mit der Zeilenzahl überein |
| F7.33 | Panel „Mein Deck" | `app-meta-call.js:10613` | Deckwahl + Override-Tabelle (`renderOverrideTable`, 10656) | eigene Matchup-Werte übersteuern die Basis |
| F7.34 | Ergebnis-Panel | `app-meta-call.js:10727` | Chance auf das Ziel + Erwartungswerte | ohne gewähltes Deck steht dort `mc.noDeckMsg` statt Zahlen |
| F7.35 | Rechnungszeile | `app-meta-call.js:10717` (`_day2RechnungsZeile`) | „n Pkt. in m Rd." | Werte aus F7.14/F7.16 |
| F7.36 | Turnierrahmen-Zeile | `app-meta-call.js:10721` (`_day2RahmenZeile`) | „Turnierrahmen: n Spieler — geht nicht in diese Chance ein. Sie folgt aus Runden, Punkteziel, Feldanteilen und Paarungen." | steht eine Zeile UNTER der Rechnung; Ändern der Spielerzahl ändert die Chance nicht |
| F7.37 | Empfehlungs-Panel | `app-meta-call.js:10993` (`renderRecommendationsPanel`) | Decks nach Zielwahrscheinlichkeit + Geheimtipps; eigenes Deck markiert | Panel entfällt, wenn beide Listen leer sind |
| F7.38 | Eingefrorenes Past-Meta: Banner | `app-meta-call.js:11275` | sagt, dass das Format abgeschlossen ist | erscheint nur in diesem Zustand |
| F7.39 | Eingefrorenes Past-Meta: Anteils-Panel | `app-meta-call.js:11307/11351` | Endstand-Anteilstabelle | ersetzt Feld-/Custom-/MyDeck-/Ergebnis-Panels |
| F7.40 | Eingefrorenes Past-Meta: Empfehlungen | `app-meta-call.js:11392` | Final-Kumulativ-Rangliste | — |
| F7.41 | Brick-Filter-Stand | `app-meta-call.js:10582` (`.mc-brick-filter-stand`) | sagt, dass der Filter erst mit gewähltem Deck wirkt | Text „wirkt erst, wenn ein Deck gewählt ist" |

## F8 — Kartendatenbank (`#cards`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F8.1 | Überschrift + Hilfe + Frische-Chip | index.html:2087 | — | — |
| F8.2 | Kartensuche mit Vorschlägen | index.html:2096 (`#cardSearch`, `#cardSearchAutocomplete`) | Namenssuche | Vorschlagsliste erscheint beim Tippen |
| F8.3 | „Filter ausblenden/einblenden" | index.html:2100 (`#cardsFiltersToggle`) | `toggleCardsFilterPanel()` | `aria-expanded` wechselt, Filterraster erscheint/verschwindet |
| F8.4 | Filtergruppe „Meta / Format" | `#filter-meta-format`, `app-cards-db.js:74` | 3 Radios: Gesamt · Alle spielbaren · Nur City League | genau einer gewählt |
| F8.5 | Filtergruppe „Set" | `#filter-set`, `app-cards-db.js:88` + `populateSetFilter` (1298) | Sets nach Erscheinungsdatum, neueste zuerst | Reihenfolge folgt `pokemon_sets_mapping.csv` |
| F8.6 | Filtergruppe „Seltenheit" | `#filter-rarity`, `app-cards-db.js:102` | Mehrfachauswahl | — |
| F8.7 | Filtergruppe „Kategorie" | `#filter-category`, `app-cards-db.js:113` | Mehrfachauswahl | — |
| F8.8 | Filtergruppe „Energietyp" | `#filter-element-type`, `app-cards-db.js:1251` | 10 deutsche Typnamen (Pflanze … Farblos), Wert bleibt englisch | Beschriftungen deutsch, Filterlogik unverändert |
| F8.9 | Filtergruppe „Haupt-Pokémon" + Suche | `#filter-main-pokemon`, `app-cards-db.js:134` | Liste + eigenes Suchfeld (`#mainPokemonSearch`), das nur im aufgeklappten Zustand sichtbar ist | Suchfeld `display:none` solange die Gruppe zu ist |
| F8.10 | Filtergruppe „Archetyp" + Suche | `#filter-archetype`, `app-cards-db.js:146` (`#archetypeSearch`) | wie F8.9 | — |
| F8.11 | Filtergruppe „Kartenabdeckung" | `#filter-deck-coverage`, `app-cards-db.js:158` + `populateDeckCoverageFilter` (1281) | genau zwei Schwellen: ≥50 %, ≥70 % | ≥90 % und 100 % gibt es nicht mehr (strukturell unerreichbar) |
| F8.12 | Filterkopf mit Tastaturbedienung | `app-cards-db.js:178` | Enter/Leertaste klappen auf | jede `.cards-filter-header[role=button]` reagiert auf beide Tasten |
| F8.13 | „Filter zurücksetzen" | index.html:2142 | `resetCardFilters()` | alle Kästchen/Radios leer, Trefferzahl = Gesamtzahl |
| F8.14 | Sortierung | index.html:2147 (`#cardSortOrder`) | Nach Set / Wie Deck-Übersicht / Nach Abdeckung / Nach Pokédex-Nr. | Reihenfolge im Raster ändert sich |
| F8.15 | Druck-Ansicht „Standard / Alle Drucke" | index.html:2155/2156 | `setPrintView()` | genau einer `.active` |
| F8.16 | Trefferanzeige | index.html:2158 (`#cardResultsInfo`) | „n Karten" | Zahl folgt Filter und Suche |
| F8.17 | Kartenraster | index.html:2164 (`#cardsContent`) | 63 Karten je Seite, Skelett beim Laden | Blätterung vorhanden (`app-cards-db.js:198`) |
| F8.18 | Abdeckungs-Plakette mit Erhebungsangabe | `app-cards-db.js:3559` | Plakette zeigt Bruch + Name der Erhebung: „x/y · <Erhebung>" | jede Prozentzahl auf der Plakette ist aus GENAU dieser einen Erhebung gerechnet; kein Wert über 100 % |
| F8.19 | Zusatz „Weitere Erhebungen: …" | `app-cards-db.js:3563` | nennt abweichende Erhebungen mit Bruch und Prozent | erscheint nur, wenn andere Erhebungen dieselbe Karte anders melden |
| F8.20 | Wahl der gezeigten Erhebung | `app-cards-db.js:3776` (`calculateDynamicCoverage`) | immer die GRÖSSTE Erhebung unter den gefilterten Archetypen — für alle Karten der Seite dieselbe | zwei Karten derselben Seite nennen dieselbe Erhebung |
| F8.21 | Kartenaktionen (je Karte) | `app-cards-db.js` (Raster) | Sammlung +/−, Wunschliste ♡, Tradelist, Druckwechsler ★, Proxy, Marktpreis | Klick ändert Zähler im Profil |

## F9 — Proxy Printer (`#proxy`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F9.1 | Überschrift + Hilfe | index.html:2175 | — | — |
| F9.2 | Decklisten-Eingabe | index.html:2185 (`#proxyDecklistInput`) | Freitext im PTCGL-Format | Beispielformat als Platzhalter |
| F9.3 | „Deckliste zur Warteschlange" | index.html:2187 (`#proxyImportDecklistBtn`) | `importDecklistToProxy()` | Warteschlangenzahl steigt |
| F9.4 | Einzelkarte: Name (mit Vorschlagsliste) | index.html:2194 (`#proxyManualName`, `list=proxyManualNameSuggestions`) | Datalist wird von `app-core.js:464` erzeugt | Vorschläge erscheinen beim Tippen |
| F9.5 | Einzelkarte: Set | index.html:2195 (`#proxyManualSet`) | Set-Kürzel | — |
| F9.6 | Einzelkarte: Nummer | index.html:2196 (`#proxyManualNumber`) | Kartennummer | — |
| F9.7 | Einzelkarte: Anzahl | index.html:2197 (`#proxyManualCount`) | ≥ 1 | — |
| F9.8 | „Karte hinzufügen" | index.html:2201 (`#proxyAddManualCardBtn`) | `addManualProxyCard()` | Karte erscheint in der Warteschlange |
| F9.9 | „Aus Binder laden" | index.html:2208 (`#proxyLoadBinderBtn`) | `cbLoadBinderIntoProxy()` — noch nicht gedruckte Karten | Warteschlange gefüllt |
| F9.10 | „City-League-Deck hinzufügen" | index.html:2209 | `addCurrentDeckToProxy('cityLeague')` | — |
| F9.11 | „Current-Meta-Deck hinzufügen" | index.html:2210 | `addCurrentDeckToProxy('currentMeta')` | — |
| F9.12 | „Past-Meta-Deck hinzufügen" | index.html:2211 | `addCurrentDeckToProxy('pastMeta')` | — |
| F9.13 | „Warteschlange drucken" | index.html:2212 | `printProxyQueue()` | Druckansicht öffnet |
| F9.14 | „Warteschlange leeren" | index.html:2213 | `clearProxyQueue()` | Leerzustand F9.15 erscheint |
| F9.15 | Leerzustand „Proxy-Warteschlange ist leer" | index.html:2218 | Symbol, Titel, Text, Knopf „Deckliste hinzufügen" (setzt Fokus in F9.2) | Knopf fokussiert `#proxyDecklistInput` ohne zu scrollen |

## F10 — Anleitung (`#tutorial`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F10.1 | Überschrift + Hilfe + Untertitel | index.html:2239/2240 | — | — |
| F10.2 | Nachgeladene Anleitung | index.html:2252 (`#tutorialHost`, `data-state`), `js/ds-tutorial.js` | lädt `tutorial/tutorial.<sprache>.html` beim Öffnen und bei jedem Sprachwechsel | `data-state` wechselt von `idle`; nach Sprachwechsel steht der Text in der neuen Sprache |
| F10.3 | Ladezeile „Anleitung wird geladen …" | index.html:2253 | Übergangszustand | verschwindet nach dem Laden |
| F10.4 | `<noscript>`-Verweise | index.html:2254 | direkte Links auf beide Sprachfassungen | ohne JS zwei funktionierende Links |

## F11 — Quellen & Methodik (`#quellen`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F11.1 | Überschrift | index.html:2277 (`#quellenTitel`) | von `app-quellen.js:404` sprachabhängig gesetzt | wechselt mit der Sprache |
| F11.2 | Zurück-Knopf | index.html:2274 (`#quellenZurueck`) | Beschriftung von `app-quellen.js:406` gesetzt | wechselt mit der Sprache |
| F11.3 | Abschnitt „Woher die Zahlen kommen" | `app-quellen.js:48` (`#qu-quellen`) | offen beim Start | `<details open>` |
| F11.4 | Abschnitt „Worauf die Zahlen beruhen" | `app-quellen.js:73` (`#qu-umfang`) | Datenumfang aus `ds-datenumfang.js` | Zahlen zur Laufzeit gerechnet, nicht abgeschrieben |
| F11.5 | Abschnitt „Was die Begriffe heißen" | `app-quellen.js:96` (`#qu-begriffe`) | Glossar inkl. der drei Win-Rate-Konventionen | Konventionstexte kommen aus `js/win-rate-konvention.js` |
| F11.6 | Abschnitt „Wie zuverlässig das ist" | `app-quellen.js:170` (`#qu-zuverlaessig`) | — | — |
| F11.7 | Abschnitt „Was getrennt bleibt" | `app-quellen.js:186` (`#qu-trennung`) | Trennung Japan / Global / Past — der Satz, der früher unter jedem Ausweis stand | genau einmal auf der Seite |
| F11.8 | Abschnitt „Wie aktuell das ist" | `app-quellen.js:194` (`#qu-stand`) | — | — |
| F11.9 | Abschnitt „Rechtliches" | `app-quellen.js:203` (`#qu-rechtliches`) | — | — |
| F11.10 | Ankersprung aus dem Ausweis | `ds-nav.js:305` (`a.qu-verweis[href="#quellen"]`) | öffnet den Reiter, ggf. den passenden Abschnitt | Klick auf „Quellen & Methodik →" landet hier |

## F12 — Datenlücken (`#admin`, nicht im Menü)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F12.1 | Überschrift „Datenlücken" | index.html:2293 (`#adminTitel`) | von `app-admin.js:299` gesetzt | — |
| F12.2 | Zurück-Knopf | index.html:2290 (`#adminZurueck`) | `app-admin.js:301` | — |
| F12.3 | Leitsatz + Offen-Hinweis | `app-admin.js:325` | sagt ausdrücklich, dass das kein Zugangsschutz ist | zwei Absätze über der Liste |
| F12.4 | Filter-Chips je Lückenklasse | `app-admin.js:337/341` (`.dl-chip`) | „Alle n" + je Klasse ein Chip mit Anzahl | genau einer `is-an`; Summe der Klassen = Gesamt |
| F12.5 | Lückenkarten | `app-admin.js:263` (`.dl-karte`) | Titel + Beschreibung + ggf. Vorschlag | Liste folgt dem Filter |
| F12.6 | Sammel-Knopf „Alle melden" | `app-admin.js:352` (`.dl-btn--haupt`) | GitHub-Issue-Link über alle Karten mit Vorschlag | nur bei > 1 Vorschlag; Beschriftung nennt n von g |
| F12.7 | Leerzustand | `app-admin.js:305/329` | „keine Lücken" mit Erklärtext | statt leerer Liste |
| F12.8 | Fußblock „Wie geht es weiter" + Stand | `app-admin.js:372` | Text + Erzeugungszeitpunkt der Datei | Zeitstempel aus `_daten._meta.erzeugt` |

## F13 — Side Quest: Pokémon Champions (`#side-quest`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F13.1 | Überschrift + Untertitel | index.html:2310/2311 | — | — |
| F13.2 | Statuszeile | index.html:2313 (`#sideQuestStatus`, `aria-live`) | Lade- und Fehlermeldungen | Meldung erscheint beim Laden |
| F13.3 | Unterreiter „Teams" | index.html:2315 | `#sideQuestTeamsHost` sichtbar, alle anderen `hidden` | genau ein Host ohne `hidden`; `aria-selected` folgt |
| F13.4 | Unterreiter „Usage" | index.html:2316 | `#sideQuestUsageHost` | — |
| F13.5 | Unterreiter „Matchups" | index.html:2317 | `#sideQuestMatchupsHost` | — |
| F13.6 | Unterreiter „Pokémon" | index.html:2318 | `#sideQuestPokedexHost` | — |
| F13.7 | Unterreiter „Team-Builder" | index.html:2319 | `#sideQuestBuilderHost` | — |
| F13.8 | Unterreiter „Status" | index.html:2320 | `#sideQuestZustaendeHost` | — |
| F13.9 | Unterreiter „Look up" | index.html:2321 | `#sideQuestResourcesHost` | — |
| F13.10 | Team-Karte: Kopie-Knopf für Replica-Code | `app-side-quest.js:534` | ein Tippen kopiert den Code | Toast bestätigt; Zwischenablage enthält den Code |
| F13.11 | Team-Karte: Marker (getestet/…) | `app-side-quest.js:308` | Status je Team, gemerkt | Marker übersteht Neuladen |
| F13.12 | Team-Karte: Info / Claude / Play / Export / Aktiv / Eigenes kopieren | `app-side-quest.js:469-523` | je eine Aktion | jeder Knopf löst genau seine Aktion aus |
| F13.13 | Team-Detail-Dialog | `app-side-quest.js:623` | Titel + Schließen | `×` schließt |
| F13.14 | Export-Dialog | `app-side-quest.js:867` | Titel + Schließen | — |
| F13.15 | Usage: Typfilter | `app-side-quest-usage.js:394` | Knopfleiste, einer `on` | — |
| F13.16 | Usage: Formatfilter | `app-side-quest-usage.js:488` | Knopfleiste, einer `on` | — |
| F13.17 | Matchups: Suche | `app-side-quest-matchups.js:711` (`.sq-search`) | filtert Paarungen | — |
| F13.18 | Matchups: Sortierknöpfe | `app-side-quest-matchups.js:770` | einer `on` | — |
| F13.19 | Matchups: Gegnertyp-Auswahl | `app-side-quest-matchups.js:791` | Auswahlfeld | — |
| F13.20 | Matchups: Team-Chips + Entfernen | `app-side-quest-matchups.js:1020/1028` | Chips als eigenständige Knöpfe (kein Knopf im Knopf) | gültiges HTML, beide Knöpfe einzeln bedienbar |
| F13.21 | Matchups: Rechner (Attacke/Fähigkeit/Item/Wesen/EVs) | `app-side-quest-matchups.js:615-683` | Auswahlfelder + Schieberegler + „Zurücksetzen" | Schadensausgabe ändert sich |
| F13.22 | Pokédex: Suche | `app-side-quest-pokedex.js:1362` (`#sqpSearch`) | Namenssuche | — |
| F13.23 | Pokédex: Typ- und Formfilter | `app-side-quest-pokedex.js:706/707` | `#sqpType`, `#sqpForm` | — |
| F13.24 | Pokédex: Format-Umschalter Doubles/Singles | `app-side-quest-pokedex.js:710/711` | einer `is-active` | — |
| F13.25 | Pokédex: Voreinstellungen (Presets) | `app-side-quest-pokedex.js:683` | Sortier-Vorlagen mit Richtung | — |
| F13.26 | Pokédex: Detailblatt mit Suche | `app-side-quest-pokedex.js:1244-1321` | Schließen, Suchfeld, Trefferliste | — |
| F13.27 | Team-Builder: Vorschläge | `app-side-quest-builder.js:315` | Pokémon hinzufügen | Team wächst |
| F13.28 | Team-Builder: Bearbeiten-Dialog | `app-side-quest-builder.js:620` | Fähigkeit, Item, Attacken, EVs | Werte werden übernommen |
| F13.29 | Team-Builder: Speichern / Aktiv setzen / Export / Rechner | `app-side-quest-builder.js:582-589` | vier Aktionen | — |
| F13.30 | Statuszustände: Zustandsköpfe | `app-side-quest-status.js:204` | auf/zu je Zustand | — |
| F13.31 | Statuszustände: „Alle" | `app-side-quest-status.js:301` | alle auf/zu | — |
| F13.32 | Look up: Filter-Chips mit Anzahl | `app-side-quest-resources.js:476` | einer `is-active`, Anzahl je Chip | — |
| F13.33 | Look up: „nur Champions" | `app-side-quest-resources.js:491` | Umschalter | — |
| F13.34 | Look up: Suche | `app-side-quest-resources.js:521` (`#sqResSearch`) | filtert Einträge | — |
| F13.35 | Look up: aufklappbare Einträge | `app-side-quest-resources.js:455` | `aria-expanded` folgt | — |

## F14 — Side Quest: TCG Pocket (`#pocket`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F14.1 | Kopf „Side Quest · Pokémon TCG Pocket" + Untertitel | `ds-pocket.js:119/122` | erklärt die Bedienung in einem Satz | — |
| F14.2 | Quellenzeile | `ds-pocket.js:128` | „Einstufung von Game8, keine von uns gemessene Zahl" + Link + Stand | Zeile nennt die Fremdquelle ausdrücklich |
| F14.3 | Alterswarnung | `ds-pocket.js:139` | ab `PLAUSIBEL_TAGE` Tagen ohne Auffrischung | Satz nennt die Tageszahl |
| F14.4 | Filterleiste „Alle / Tier-Liste / Neues Set" | `ds-pocket.js:153` | einer `is-active`/`aria-pressed=true` | Liste kürzt sich entsprechend |
| F14.5 | Stufen-Abschnitte mit Anzahl | `ds-pocket.js:183` | je Stufe Überschrift + Zähler | Zähler = Zeilen im Abschnitt |
| F14.6 | Deck-Zeile | `ds-pocket.js:188` | Marke, Name, Fußnote, Pfeil; öffnet das Muster | Klick öffnet `#pocketOverlay` |
| F14.7 | Abschnitt „Ohne bekannte Stufe" | `ds-pocket.js:236` | eigene Gruppe + Erklärsatz | erscheint nur bei unbekannten Stufen |
| F14.8 | Rechnungsblock | `ds-pocket.js:265` | „x von y Einträgen … n ohne lesbares Muster" | Zahlen stimmen mit der Liste überein |
| F14.9 | Muster-Overlay (2D-Code) | index.html:2347 (`#pocketOverlay`), `ds-pocket.js:348` | QR aus `js/qr-svg.js`, Deckname, Kartenliste, Schließen | Overlay `hidden` bis zum Klick; `×` schließt |
| F14.10 | Fehlerfall ohne Muster | `ds-pocket.js:317/354` | Klartext statt leerem Kasten | Meldung „Keine Kartenliste: …" |
| F14.11 | Listen-Host | index.html:2345 (`#pocketListe`, `aria-live="polite"`) | Ladezustand, Leerzustand, Liste | „Lädt…" / „Die Tier-Liste ist leer." / Liste |

## F15 — Wahrscheinlichkeitsrechner (`#calculator`)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F15.1 | Überschrift + Hilfe + Untertitel | index.html:2356/2358 | — | — |
| F15.2 | Feld „Karten im Deck" | index.html:2365 (`#calc-deck-size`) | 1–99, Vorgabe 60 | Ergebnis rechnet neu |
| F15.3 | Feld „Kopien im Deck" | index.html:2369 (`#calc-copies`) | 1–60, Vorgabe 1 | — |
| F15.4 | Feld „gezogene Karten" | index.html:2373 (`#calc-drawn`) | 1–60, Vorgabe 7 | — |
| F15.5 | Feld „bereits auf der Hand" | index.html:2377 (`#calc-in-hand`) | 0–4, Vorgabe 0 | — |
| F15.6 | Ergebnis „Ziehen (mind. 1)" | index.html:2385 (`#res-draw`) | Prozentwert, Farbe nach Höhe | ≠ „–" nach Eingabe |
| F15.7 | Fußnote zum Ziehen | index.html:2386 (`#calc-fuss-draw`) | Randbedingung, wenn nötig | leer, wenn nichts zu sagen ist |
| F15.8 | Ergebnis „In den Preiskarten" | index.html:2391 (`#res-prize`) + Fußnote 2393 | Prozentwert | — |
| F15.9 | Ergebnis „Topdeck-Chance" | index.html:2397 (`#res-topdeck`) + Fußnote 2399 | Prozentwert | — |

## F16 — Profil (`#profile`) und Untertabs

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F16.1 | Überschrift + Hilfe + Untertitel | index.html:2410-2414 | — | — |
| F16.2 | Anmeldeaufforderung (ausgeloggt) | index.html:2418 (`#profile-auth-prompt`) | Bild, Titel, Text, Knopf „Anmelden / Registrieren" | ausgeloggt sichtbar, `#profile-content` `.d-none` |
| F16.3 | Cloud-Sync-Anzeige | index.html:2436 (`#cloud-sync-status`, `#cloud-sync-detail`) | Zustand des Firestore-Caches | Text ≠ „Initialisiere…" nach dem Laden |
| F16.4 | „Jetzt synchronisieren" | index.html:2442 (`#cloud-sync-refresh-btn`) | `forceCloudSync()` | frischer Serverabruf, Detailtext aktualisiert |
| F16.5 | Kennzahl „Name" | index.html:2450 (`#profile-user-name`) | Anzeigename | — |
| F16.6 | Kennzahl „Karten im Besitz" | index.html:2454 (`#profile-cards-count`) | Zahl | folgt der Sammlung |
| F16.7 | Kennzahl „Sammlungswert" | index.html:2458 (`#profile-collection-value`) | Betrag in € | Format mit Komma |
| F16.8 | Fußnote zum Sammlungswert | index.html:2462 (`#profile-collection-value-note`) | erklärt, woraus die Summe besteht; `hidden`, solange nichts zu sagen ist | `firebase-collection.js:959` |
| F16.9 | Kennzahl „gespeicherte Decks" | index.html:2466 (`#profile-decks-count`) | Zahl | — |
| F16.10 | Battle-Journal-Kachel: Titel + Hilfe | index.html:2469 | — | — |
| F16.11 | Battle-Journal-Kachel: „Ausstehende Syncs" | index.html:2477 (`#battleJournalProfilePending`) | Zahl | = Länge der Outbox |
| F16.12 | Battle-Journal-Kachel: „Sync-Status" | index.html:2481 (`#battleJournalProfileState`) | Zustandstext | — |
| F16.13 | „Match eintragen" | index.html:2485 | `openBattleJournalSheet()` | Blatt öffnet |
| F16.14 | „Jetzt synchronisieren" (Journal) | index.html:2486 | `flushBattleJournalOutbox()` | Zähler sinkt |
| F16.15 | Untertab-Gruppe „Karten & Sammlung" | index.html:2495 | Beschriftung + 5 Knöpfe | Gruppenlabel sichtbar |
| F16.16 | Untertab „Meine Sammlung" (+ Zähler) | index.html:2498 (`#tab-count-collection`) | `switchProfileTab('collection')` | `#profile-collection` `.active` |
| F16.17 | Untertab „Wunschliste" (+ Zähler) | index.html:2501 | — | — |
| F16.18 | Untertab „Tauschliste" (+ Zähler) | index.html:2504 | — | — |
| F16.19 | Untertab „Meta Binder" | index.html:2507 | — | — |
| F16.20 | Untertab „Custom Binder" | index.html:2510 | — | — |
| F16.21 | Untertab-Gruppe „Decks" | index.html:2516 | 3 Knöpfe | — |
| F16.22 | Untertab „Meine Decks" (+ Zähler) | index.html:2519 | — | — |
| F16.23 | Untertab „Decklisten vergleichen" | index.html:2522 | — | — |
| F16.24 | Untertab „Deck Builder" | index.html:2525 | ruft `ProfileDeckBuilder.activate()` beim ersten Öffnen | `#profile-deckbuilder` wird gefüllt |
| F16.25 | Untertab-Gruppe „Spiel & Analyse" | index.html:2531 | 3 Knöpfe | — |
| F16.26 | Untertab „Battle Journal" | index.html:2534 | — | — |
| F16.27 | Untertab „Testing Groups" | index.html:2537 | `TestingGroups.init()` | `#profile-testinggroups` gefüllt |
| F16.28 | Knopf „Meta Call →" | index.html:2547 | `switchTabAndUpdateMenu('meta-call')` — verlässt das Profil | landet im eigenen Reiter, nicht hinter der Anmeldewand |
| F16.29 | Untertab-Gruppe „Konto" + „Einstellungen" | index.html:2553/2557 | — | — |
| **Sammlung** | | | | |
| F16.30 | „Dex-Import" | index.html:2570 | `dexImportOpenFilePicker()` + verstecktes `#dexImportFileInput` (.csv) | Dateiwahl öffnet, CSV wird eingelesen |
| F16.31 | Sortierung der Sammlung | index.html:2580 (`#collection-sort`) | 4 Optionen (neueste Sets, Element, Pokédex, Preis absteigend) | Reihenfolge ändert sich |
| F16.32 | Filter der Sammlung | index.html:2586 (`#collection-filter`) | 17 Optionen (alle, 10 Pokémon-Typen, Supporter, Item, Tool, Spez.-Energie, Basis-Energie) | Trefferzahl ändert sich |
| F16.33 | „Sammlung leeren" | index.html:2606 | `clearCollection()` | Leerzustand F16.36 erscheint |
| F16.34 | Ladehinweis „Elementtypen werden geladen" | index.html:2610 (`#collection-type-loading`) | nur während des Ladens | `.d-none` danach |
| F16.35 | Sammlungssuche | index.html:2616 (`#collection-search`) + Trefferzeile 2619 | entprellt | Trefferzeile nennt die Zahl |
| F16.36 | Leerzustand „Deine Sammlung ist leer" | index.html:2623 | Symbol, Titel, Text, Knopf „Kartendatenbank öffnen" | `role="status"` |
| **Meine Decks** | | | | |
| F16.37 | „Gebaute Decks vergleichen" | index.html:2643 | `compareActiveDecks()` | Vergleichsdialog |
| F16.38 | „Neuer Ordner" | index.html:2644 | `createDeckFolder()` | Ordner erscheint in F16.41 |
| F16.39 | Decksuche | index.html:2652 (`#decks-search`) | Name oder Archetyp | — |
| F16.40 | Filter „Nur IRL gebaut" | index.html:2655 (`#decks-filter-built`) | `toggleBuiltFilter()`; `title` erklärt IRL | Chip wechselt Zustand |
| F16.41 | Ordner-Navigation | index.html:2659 (`#decks-folder-nav`) | Pfad + Wechsel | `.d-none` ohne Ordner |
| F16.42 | Ordner-Zusammenfassung (Kern/Tech) | index.html:2663 (`#decks-folder-summary`) | Auswertung je Ordner | `.d-none` ohne Ordner |
| F16.43 | Leerzustand „Noch keine gespeicherten Decks" | index.html:2666 | + Knopf „Deck bauen" → `city-league` | — |
| **Wunschliste** | | | | |
| F16.44 | „📋 Liste einfügen" (Telegram-Bot) | index.html:2686 | `wishlistBotImportOpen()` | Einfügedialog, ganze Bot-Nachricht wird akzeptiert |
| F16.45 | Wunschlisten-Suche | index.html:2694 (`#wishlist-search`) + Trefferzeile 2716 | entprellt | — |
| F16.46 | Set-Filter der Wunschliste | index.html:2698 (`#wishlist-set-filter`) | Auswahlfeld | — |
| F16.47 | „Grid" | index.html:2703 | `openWishlistGridModal()` | F17.9 öffnet |
| F16.48 | „Kopieren" | index.html:2706 | `copyWishlistToClipboard()` | — |
| F16.49 | „🛒 Cardmarket" | index.html:2709 | `copyWishlistForCardmarket()` | F17.10 öffnet |
| F16.50 | „Wunschliste leeren" | index.html:2712 | `clearWishlist()` | Leerzustand erscheint |
| F16.51 | Leerzustand „Deine Wunschliste ist leer" | index.html:2719 | + Knopf „Karten finden" | — |
| **Tauschliste** | | | | |
| F16.52 | Tauschlisten-Suche + Set-Filter | index.html:2740/2744 | — | — |
| F16.53 | „Grid" / „Kopieren" / „Tauschliste leeren" | index.html:2749/2752/2755 | drei Aktionen | — |
| F16.54 | Leerzustand „Deine Tauschliste ist leer" | index.html:2760 | + Knopf „Karten finden" | — |
| **Meta Binder** | | | | |
| F16.55 | Überschrift + Hilfe + Untertitel | index.html:2775/2776 | — | — |
| F16.56 | „Binder erzeugen" | index.html:2779 | `buildMetaBinder()` | `#metaBinderStats` verliert `.d-none` |
| F16.57 | „📂 Gespeicherten Binder laden" | index.html:2780 (`#metaBinderLoadSaved`) | letzte Fassung | — |
| F16.58 | „Fehlende auf Wunschliste" | index.html:2781 (`#metaBinderAddWishlist`) | `disabled` bis der Binder steht | — |
| F16.59 | „Alle Fehlenden an Proxy" | index.html:2782 (`#metaBinderSendProxy`) | wie F16.58 | — |
| F16.60 | „NEUE Karten an Proxy" | index.html:2783 (`#metaBinderProxyNew`) | wie F16.58 | — |
| F16.61 | Statistik / Filter / Delta | index.html:2785-2787 | erscheinen mit dem Binder | alle drei `.d-none` im Ausgangszustand |
| F16.62 | Leerzustand „Meta Binder noch nicht erzeugt" | index.html:2789 | + 2 Knöpfe | — |
| F16.63 | Dialog „Weggefallene Karten" | index.html:3742 (`#metaBinderDroppedModal`, `#metaBinderDroppedCount`) | Liste der aus dem Umfang gefallenen Karten | Zahl im Kopf = Länge der Liste |
| **Custom Binder** | | | | |
| F16.64 | Überschrift + Hilfe + Untertitel | index.html:2806/2807 | — | — |
| F16.65 | Ordnerleiste | index.html:2812 (`#cbBinderBar`) | gespeicherte Ordner als Einstieg | von `cbRenderBinderBar()` gefüllt |
| F16.66 | Modus „Sammlung / Druckliste" | index.html:2816/2817 | `cbSetMode()` | einer `.active`; F16.73/F16.74 erscheinen nur im Druckmodus |
| F16.67 | Archetyp-Suche | index.html:2823 (`#cbArchetypeSearch`) | `cbFilterArchetypeList()` | — |
| F16.68 | „Suchen ▾" | index.html:2824 (`#cbDropdownToggle`) | öffnet `#cbArchetypeDropdown` | — |
| F16.69 | „Top 10 Meta" | index.html:2825 (`#cbTopMetaBtn`) | wählt die Top 10 auf einmal | 10 Chips in `#cbSelectedChips` |
| F16.70 | Schwelle „Alle / Kern + Tech (≥30 %) / Nur Kern (>70 %)" | index.html:2834-2836 | `cbSetThreshold()`; Vorgabe 70 | einer `.active` |
| F16.71 | „Custom Binder erzeugen" | index.html:2840 (`#cbGenerateBtn`) | `disabled` ohne Auswahl | wird aktiv, sobald ein Archetyp gewählt ist |
| F16.72 | „Ordner speichern" / „Als neuen Ordner" / „Auf aktuellen Stand bringen" | index.html:2841-2843 | drei Aktionen | Ordner erscheint in F16.65 |
| F16.73 | „Fehlende auf Wunschliste" / „Alle Fehlenden an Proxy" | index.html:2844/2845 | `disabled` bis der Binder steht | — |
| F16.74 | „Noch nicht Gedruckte → Druckliste" / „Gefilterte als gedruckt ✓" | index.html:2846/2847 | nur im Druckmodus (`.d-none` sonst) | — |
| F16.75 | Voreinstellungsleiste / Statistik / Filter / Abgleich / Delta | index.html:2850-2854 | erscheinen mit dem Binder | alle `.d-none` im Ausgangszustand |
| F16.76 | Leerzustand „Archetypen wählen und Binder erzeugen" | index.html:2856 | Titel + Hinweis | — |
| **Battle Journal (Verlauf)** | | | | |
| F16.77 | „Match eintragen" / „Jetzt synchronisieren" / „Alles kopieren" / „Journal leeren" | index.html:2872-2875 | vier Aktionen | — |
| F16.78 | Verlaufsstatistik | index.html:2876 (`#journalHistoryStats`) | Kennzahlen | — |
| F16.79 | Filter „Format" | index.html:2878 (`#journalFilterMeta`) | Auswahlfeld | Liste kürzt sich |
| F16.80 | Filter „Turniertyp" | index.html:2881 (`#journalFilterType`) | 7 Typen + „Alle" | — |
| F16.81 | Filter „Turnier" | index.html:2891 (`#journalFilterTournament`) | Auswahlfeld | — |
| F16.82 | Filter „Ergebnis" | index.html:2894 (`#journalFilterResult`) | Sieg / Niederlage / Unentschieden | — |
| F16.83 | „Matchup-Tabelle" | index.html:2900 | `toggleMatchupStats()` | `#journalMatchupStats` erscheint |
| F16.84 | Verlaufsliste | index.html:2903 (`#journalHistoryList`) | Einträge, je mit Bearbeiten | Klick öffnet F17.5/F17.6 |
| **Decklisten vergleichen** | | | | |
| F16.85 | Feld „Deck A (alt)" | index.html:2915 (`#profileCompareListA`) | Freitext | — |
| F16.86 | Feld „Deck B (neu)" | index.html:2919 (`#profileCompareListB`) | Freitext | — |
| F16.87 | „Vergleichen" | index.html:2923 | `profileCompareDecklists()` | `#profileCompareResult` verliert `.d-none` |
| **Deck Builder (Profil)** | | | | |
| F16.88 | Kartensuche | `app-profile-deck-builder.js:998` (`#pdb-search`) | Namenssuche | Trefferliste |
| F16.89 | „Filter zurücksetzen" | `app-profile-deck-builder.js:1004` (`#pdb-clear-filters`) | — | — |
| F16.90 | Deckname | `app-profile-deck-builder.js:1012` (`#pdb-deck-name`) | Freitext | wird beim Speichern übernommen |
| F16.91 | Kartenzähler | `app-profile-deck-builder.js:1011` (`#pdb-deck-count`) | „n Karten" | — |
| F16.92 | „Deck leeren" | `app-profile-deck-builder.js:1018` (`#pdb-clear-deck`) | leert die Liste | — |
| F16.93 | „Einfügen" (Liste) | `app-profile-deck-builder.js:1028` (`#pdb-paste-btn`) | PTCGL-Liste einlesen | Karten erscheinen |
| F16.94 | Mulligan-Rechner | `app-profile-deck-builder.js:1032` | Wahrscheinlichkeit der Fehlhand | Wert ändert sich mit der Liste |
| F16.95 | Set-Suche | `app-profile-deck-builder.js:1135` (`#pdb-set-search`) | — | — |
| F16.96 | Kartenlupe (Zoom-Dialog) mit „＋ Hinzufügen" | `app-profile-deck-builder.js:929/940` | Bild + Hinzufügen + Schließen | — |
| **Testing Groups** | | | | |
| F16.97 | Überschrift + Hilfe | `app-testing-groups.js:1211` | — | — |
| F16.98 | Neue Gruppe: Name + „Erstellen" | `app-testing-groups.js:1215/1216` (`#tg-new-name`) | max. 60 Zeichen | Gruppe erscheint unter „Meine Gruppen" |
| F16.99 | Gruppenliste + „Öffnen" | `app-testing-groups.js:1200/1218` | — | — |
| F16.100 | Gruppendetail: Titel (Umbenennen per Doppelklick) | `app-testing-groups.js:1394` | nur für Eigentümer | — |
| F16.101 | Matrix-Eingabe je Paarung | `app-testing-groups.js:1282/1336` | Zahleneingaben 0–100 | Werte werden gespeichert |
| F16.102 | Deck umbenennen / entfernen | `app-testing-groups.js:1291/1292` | zwei Aktionen je Zeile | — |
| F16.103 | Deck hinzufügen | `app-testing-groups.js:1362/1366` (`#tg-new-deck`) | — | — |
| F16.104 | Zeilenfilter-Chips + „Alle" / „Keine" | `app-testing-groups.js:1374/1382/1383` | — | — |
| F16.105 | „🔗 Einladungslink" | `app-testing-groups.js:1398` | erzeugt Link `#tg-join=…` | Aufruf des Links tritt der Gruppe bei (`app-testing-groups.js:1745`) |
| F16.106 | „💾 JSON exportieren" | `app-testing-groups.js:1409` | Datei | — |
| F16.107 | „→ In Meta Call laden" | `app-testing-groups.js:1410` | überträgt die Gruppe in den Predictor | Meta Call zeigt die Gruppendaten |
| F16.108 | „Löschen" / „Verlassen" | `app-testing-groups.js:1412/1413` | je nach Rolle genau einer | — |
| F16.109 | Aktivitätsprotokoll | `app-testing-groups.js:1391` (`#tg-activity-log`) | letzte Änderungen | — |
| F16.110 | „← Zurück" | `app-testing-groups.js:1404` | schließt das Detail | — |
| **Einstellungen** | | | | |
| F16.111 | „Anzeigename" + „Speichern" | index.html:2944/2946 (`#settings-display-name`) | max. 50 Zeichen | Name erscheint in F16.5 |
| F16.112 | Preisalarme: Ein/Aus | index.html:2972 (`#settings-price-alerts-enabled`) | Kästchen | — |
| F16.113 | Preisalarme: Telegram-Chat-ID | index.html:2977 (`#settings-price-alerts-chatid`) | numerisch | Hilfetext erklärt `/myid` |
| F16.114 | Preisalarme: Tauschlisten-Schwelle | index.html:2983 (`#settings-price-alerts-threshold`) | 0–100 %, Vorgabe 10 | — |
| F16.115 | „Speichern" (Preisalarme) | index.html:2989 | `savePriceAlerts()` | Toast bestätigt |
| F16.116 | „Abmelden" | index.html:2994 | `signOut()` | `#profile-auth-prompt` erscheint wieder |

## F17 — Dialoge, Blätter und Overlays (seitenweit)

| Kennung | Bezeichnung | Ort | Soll | Nachweis |
|---|---|---|---|---|
| F17.1 | Zwei-Schritt-Bestätigung „Leeren → Wirklich leeren?" | `app-deck-builder.js:1290-1483` | 1. Klick schärft (Beschriftung „Wirklich leeren?"), 2. Klick nach Mindestwartezeit leert; Entprellung verwirft Doppelklicks; Frist läuft ab | Doppelklick leert NICHT (Toast „Zu schnell — lies bitte kurz…"); Sprachwechsel während der Frist lässt die Warnung stehen, weil dem Knopf sein `data-i18n` entzogen wird; nach dem Entschärfen trägt er wieder die übersetzte Beschriftung |
| F17.2 | Anmeldedialog | index.html:3013 (`#auth-modal`) | siehe F0.46 | — |
| F17.3 | Bild-Teilen-Dialog | index.html:3099 (`#shareImageModal`) | „Speichern", ggf. „Teilen", „Schließen" | Teilen-Knopf nur, wenn das Gerät es kann |
| F17.4 | Turnier bearbeiten | index.html:3124 (`#bjEditTournamentModal`) | Name, Format, Typ-Chips (7), Deck (Datalist), eingefrorene Liste, Platzierung (Datalist mit 8 Vorschlägen) | Änderungen wirken auf ALLE Einträge des Turniers; die gespielte Liste wird als Kopie eingefroren |
| F17.5 | Einzelmatch bearbeiten | index.html:3226 (`#bjEditEntryModal`) | eigenes Deck, Gegner, Ergebnis, Anzugsreihenfolge, Brick, Mulligan, Notizen (max. 200), BO3-Spielfelder | BO3-Block ersetzt die BO1-Felder |
| F17.6 | Matchup-Analyse | index.html:3268 (`#matchupAnalysisModal`) | Filter: eigenes Deck, Meta, Turniertyp-Chips (8), Turnier, Bricks (inkl./exkl./nur); Zusammenfassung, Heatmap, beste/schlechteste, alle Paarungen | Filteränderung zeichnet neu (`renderMatchupAnalysis()`) |
| F17.7 | Deck-Grid-Vorschau | index.html:3352 (`#deckGridPreviewModal`) | Titel, Kartenraster, Anzahl, „💾 Als Bild speichern" | — |
| F17.8 | Kartenbild-Übersicht | index.html:3369 (`#imageViewModal`) | „Teilen", „Schließen" | — |
| F17.9 | Wunschlisten-Raster | index.html:3385 (`#wishlistGridModal`) | „Speichern", „Schließen" | — |
| F17.10 | Cardmarket-Helfer | index.html:3407 (`#wishlistCardmarketModal`) | Abschnitt 1 Direktlinks (exakter Druck), Abschnitt 2 Einfügetext (beliebige Version) + „Kopieren" + Link zur Wants-Liste | Einleitung erklärt den Unterschied; 🔍 markiert Karten ohne Direktlink |
| F17.11 | Tauschlisten-Raster | index.html:3441 (`#tradelistGridModal`) | „Speichern", „Schließen" | — |
| F17.12 | Vollbild-Karte | index.html:3458 (`#fullscreenCardModal`) | Bild + Schließen | Klick auf den Hintergrund schließt |
| F17.13 | Einzelkarten-Ansicht | index.html:3464 (`#singleCardModal`) | Bild, Titel, Limitless-Knopf (dynamisch) | — |
| F17.14 | Seltenheits-/Druckwechsler | index.html:3474 (`#raritySwitcherModal`) | Liste aller Drucke | Auswahl tauscht den Druck im Deck |
| F17.15 | Anti-Tech „Build vs …" | index.html:3484 (`#antiTechModal`) | Schritt 1: Ziel-Decks (Chips, Schnellauswahl aus dem Meta-Call-Feld mit Feld-% und WR-Pille, Freitextsuche, Aggression mild/standard/heavy); Schritt 2: Tech-Karten-Auswahl mit Zähler im Knopf | „Weiter" bleibt `disabled` ohne Ziel; „Bauen mit n Karten" nennt die gewählte Zahl; „← Zurück" führt auf Schritt 1 |
| F17.16 | Deck-Vergleich | index.html:3572 (`#deckCompareModal`) | Option 1 Freitextliste + „Vergleichen"/„Leeren"; Option 2 gespeichertes Deck + „Mit ausgewähltem Deck vergleichen" | `#deckCompareResult` verliert `.d-none` |
| F17.17 | Battle-Journal-Blatt | index.html:3610 (`#battleJournalOverlay`) | Dunkelmodus-Umschalter, Schließen, Statuszeile, Formular, Fußbereich mit ausstehenden Einträgen | Formular speichert offline und synchronisiert später |
| F17.18 | Journal: „Turnier fortsetzen" | index.html:3627 (`#battleJournalLastTournamentBtn`) | übernimmt das zuletzt benutzte Turnier | `.d-none` beim ersten Eintrag |
| F17.19 | Journal: Turniername | index.html:3634 (`#battleJournalTournamentName`) | Freitext | — |
| F17.20 | Journal: Meta-Format | index.html:3642 (`#battleJournalMeta`) | Auswahlfeld (`data-meta-format-options`) | Optionen zur Laufzeit gefüllt |
| F17.21 | Journal: Turniertyp-Chips (7) | index.html:3648-3654 | genau einer aktiv, schreibt in `#battleJournalType` | — |
| F17.22 | Journal: eigenes Deck (Vorschläge) | index.html:3661 (`#battleJournalOwnDeckValue`) | Autovervollständigung | — |
| F17.23 | Journal: Gegner (Vorschläge) | index.html:3675 (`#battleJournalOpponentValue`) | Autovervollständigung | — |
| F17.24 | Journal: BO1/BO3 | index.html:3690/3691 | Umschalter, schreibt in `#battleJournalBestOf` | BO3 blendet `#battleJournalGameDetails` ein |
| F17.25 | Journal: Brick / Mulligan / Notizen | index.html:3706/3712/3719 | zwei Kästchen mit Erklärung + Textfeld (max. 200) | — |
| F17.26 | Journal: „Leeren" / „Match speichern" | index.html:3723/3724 | Entwurf verwerfen / speichern | Speicheranimation `#battleJournalSaveFx` |
| F17.27 | Journal: ausstehende Einträge + „Jetzt synchronisieren" | index.html:3734/3736 | Liste + Aktion | Zähler sinkt nach dem Sync |
| F17.28 | Starthand-Simulator | index.html:3866 (`#drawSimulatorModal`) | „Neue Hand", „Karte ziehen", Reststapel, Handraster | Restzahl sinkt beim Ziehen |
| F17.29 | Kombinations-Rechner | index.html:3878-3892 | 4 Auswahlfelder, „Chance berechnen", „Auswahl leeren", Ergebnis | Monte-Carlo über 10.000 Läufe; Ergebnis erscheint in `#comboResultDisplay` |
| F17.30 | Bildvorschau (gemeinsam) | `ds-bildvorschau.js:134` (`.ds-bildvorschau-modal`) | Titel, Bild, „📋 Kopieren", „💾 Speichern", „Schließen" | Fokus kehrt nach dem Schließen auf den auslösenden Knopf zurück; Esc schließt |

---

## Seit dem letzten Lauf hinzugekommen oder geändert

Abgeglichen mit der Vorfassung von `audit/inventar-oberflaeche.md` (Stand 07.09.2026, 09:33 Uhr) — der jetzige Code ist neuer (Git `5d9ab9a8`, ausgeliefert `202609071722-bc9a494`).

| Kennung | Was neu oder geändert ist |
|---|---|
| F17.1 | **Zwei-Schritt-Bestätigung beim Deck-Leeren.** Erster Klick schärft und beschriftet den Knopf „Wirklich leeren?", zweiter Klick nach Mindestwartezeit leert. Entprellung (`DECK_LEEREN_PRELL_MS`) verwirft Doppelklicks; ein Sprachwechsel innerhalb der Frist kann die Warnung nicht mehr überschreiben, weil dem Knopf sein `data-i18n` entzogen wird (Befunde B1–B3). Betrifft F3.28, F5.32, F6.15. |
| F8.18, F8.19, F8.20 | **Erhebungsangabe an der Kartenabdeckung.** Die Plakette zeigt Bruch und Namen der Erhebung; abweichende Erhebungen werden mit Bruch und Prozent genannt. Gerechnet wird in genau EINER Erhebung (der größten unter den gefilterten Archetypen) — vorher wurde über drei Erhebungen summiert, mit Werten bis 270 %. |
| F4.22 | **Grundlagenzeile der Tier-Liste (Global).** Neuer Absatz `p.tier-grundlage` über den Tier-Blöcken; alle 17 Zahlen zur Laufzeit aus den Rechenkonstanten. Befund B6 korrigiert: der Satz nennt jetzt „Listenzahl des größten Archetyps" statt „des Rang-1-Decks". |
| F2.7 | Grundlagenzeile auch in der City-League-Tier-Liste (`tier.clBasis` mit Listen-, Archetypen- und Einzelstückzahl). |
| F2.14, F2.23 | **Leerzustand der Vergleichstabellen** (City League). Der Block „Warum hier keine Vergleichstabellen stehen“ nennt jede fehlende Rubrik beim Namen und ihren Grund — vorher stand zwischen Infokarten und Vergleichstabelle nichts (Befunde A-F2.11–F2.13 / H1, 07.09.2026). Zusätzlich werden die drei gerechneten, aber nie gezeichneten Rubriken (Häufiger gespielt, neue, verschwundene Archetypen) mit ihrer Zahl genannt, statt zu schweigen. Die Schwelle kommt aus `CL_MINDEST_ANTEIL_GROESSTER` statt als Literal aus dem Text (Befund B4). |
| F5.26, F5.29 | Leerzustand auch in den beiden Meta-Call-Vergleichstabellen: statt leerer `tbody` eine Zeile `.mc-vs-empty` über die volle Spaltenbreite (3 bzw. 5 Spalten). |
| F2.12 | **Top-10-Veränderungen ohne Vorzeitraum** behaupten nichts mehr: `entries`/`exits` bleiben leer und der Hinweis `cl.noBaseline` steht da, statt jeden Archetyp zum Aufsteiger zu erklären. |
| F2.22 | Zeitstempel der City-League-Fußzeile folgt der Seitensprache (`en-GB` / `de-DE`) statt fest `de-DE`. |
| F0.50, F0.51 | **Tieflinks widerspruchsfrei:** `#overview` löst auf (stand vorher nur in der falschen Tabelle), `#quellen-umfang` hat Alias und Weißlisteneintrag, `#deckcompare` und `#settings` sind ergänzt, `#playtester`/`#sandbox` führen auf die Übersicht statt auf eine leere Seite. Zwei Unit-Tests nageln die Regeln fest. |
| F4.29, F4.30, F4.34 | **Tag-2-/Zählungs-Beschriftung der Datenbasis in der Rangliste.** Spalten „Turnier-Antritte" und „Top 8" werden ausgeblendet, solange keine Zeile eine gezählte Zahl trägt; der Hinweistext über der Tabelle beschreibt nur die tatsächlich sichtbaren Spalten. |
| F4.22 | Die Grundlagenzeile nennt die Tag-2-Quote als dritten Anteil ausdrücklich — und sagt im Klartext, wenn für dieses Meta keine Turnierdatei vorliegt und der Anteil deshalb fehlt. |
| F7.36 | **Turnierrahmen-Zeile im Meta Call.** `_day2RahmenZeile()` steht eine Zeile unter der Rechnung: „Turnierrahmen: n Spieler — geht nicht in diese Chance ein. Sie folgt aus Runden, Punkteziel, Feldanteilen und Paarungen." |
| F7.15 | **Rundenhinweis im Meta Call.** `_rundenHerkunftHinweis()` erscheint nur bei den drei Major-Typen und sagt, dass die Rundenzahl eine Eingabe ist; die Alternativ-Zielpunktzahl kommt aus `MAJOR_DAY2_POINTS` (Befund B3). |
| F7.24 | **Gewichtungs-Chip im Vorhersage-Banner.** Nennt das Mischungsverhältnis der Paarungen (Papier/Day 2/Day 1/Online) und die Predictor-5.3-Verschiebung des gewählten Decks; alle Zahlen zur Laufzeit gelesen, der `title` nennt die Konvention S/(S+N) (Befund B4). |
| F5.23, F5.24 | **Gegnersuche.** Die Auswahlliste wird auf JEDEM Weg durch `renderCurrentMetaMatchups()` gefüllt, auch auf dem CSV-Ersatzweg. Der Leerzustand unterscheidet drei Gründe („noch nicht geladen" / „Datei ohne Zeilen" / „für dieses Deck keine Paarungen") statt eines Einheitssatzes (Befund B2). Namen werden zweifach maskiert. |
| F5.14, F5.15, F4.5 | **Win-%-Konventions-Chips.** `js/win-rate-konvention.js` liefert Formel und Wortlaut; die WR-Spalte der Archetyp-Matchups trägt den Hinweis „ohneUnentschieden" im `title`, die Tier-Karten und `ds-share.js` den Kurzhinweis „mitUnentschieden". Belegstand 07.09.2026, gegen die Dateien nachgerechnet. |
| F5.16 | **Mindeststichprobe bei Präsenz-Paarungen.** Die Major-WR erscheint erst ab `MIN_PRAESENZ_PARTIEN` als Prozentwert; darunter Bilanz + Partienzahl. Der Hinweis nennt Schwelle, Punktverschiebung je Partie und „k von g Zeilen" und erscheint nur, wenn wirklich Zeilen betroffen sind. |
| F7.6 | **Quellen-Umschalter bleibt im eingefrorenen Past-Meta stehen** (`_renderFrozenSourceOnlyPanel`, Befund M1 der Live-Prüfung vom 07.09.2026) — vorher war das eingefrorene Format ohne Neuladen eine Sackgasse. |
| F0.30 | **Kopfknopf „Datenbank"** ruft `switchTabAndUpdateMenu()` statt `switchTab()`; die Adresszeile folgt jetzt mit (Nachabnahme 07.09.2026). |
| F0.12, F0.28, F0.29 | **`openProfileSection()` schreibt den Untertab in die Adresse** und wiederholt den Umschaltversuch bis zu einer Sekunde lang; „Meine Decks", „Wunschliste" und der Menüpunkt „Deck Builder" landen nicht mehr auf „Meine Sammlung". Es entsteht nur noch EIN Verlaufseintrag statt zwei. |
| F0.39 | **Gesperrte Format-Optionen** werden jetzt auch im Auswahlfeld-Zweig von `ds-filter.js` als `disabled` übertragen (vorher nur in der Knopfleiste). |
| F4.36 | **Abschnitts-Zähler** verwirft gespeicherte, nicht mehr vorhandene Abschnitts-IDs — „7 von 6 Abschnitten offen" kann nicht mehr auftreten. |
| F6.4 | **Ladeanzeige im Turnier-Filter** (`#pastMetaLadestand`, `role="status"`) — vorher sah die Liste während des Nachladens fertig aus. |
| F6.7 | **Sammelauswahl-Hinweis** (`#pastMetaFamilieHinweis`) erklärt, dass die Prozentzahlen bei gewählter Deck-Familie über alle Varianten laufen. |
| F1.4, F1.7, F1.8 | **Hub:** Gewichtungshinweis sitzt an der Quote statt am Nenner; Mindeststichprobe der Überschrift auf 100 GEZÄHLTE Antritte; die Nennerzeile nennt das Wort „gewichtet" nur noch, wenn wirklich gewichtet wird. |
| F5.2 | **Tiefenumschalter „Schnellüberblick / Deep Dive"** steuert alle `.cm-deep-dive-only`-Blöcke (Fusion, Build vs …, Tech-Slots, Matchups vs Meta Call, Build vs Vanilla, Tech Lab). |
| F7.1 | **Ein Schalter, eine Wahrheit:** `_zielKurz()` ersetzt das an vier Stellen hart geschriebene „Day 2" durch das typgerechte Ziel („Top 8", „1.-2."). |
| F3.50 | **Beschriftung des Neulade-Knopfes** der Meta-Kartenanalyse ändert sich nach dem Laden, statt weiter „Meta-Analyse laden" über zwölf geladenen Kacheln zu stehen. |
| F5.14 | Kopfzelle der Bilanz heißt **„T" statt „U"** (Win-Loss-Tie); Präsenzspalte heißt **„Major-WR"** und rechnet dieselbe Formel wie die WR-Spalte links (vorher „Major-P" mit Matchpunkten). |
| F13.20 | Team-Chips der Champions-Matchups sind **eigenständige Knöpfe** statt Knopf-im-Knopf (gültiges HTML). |
| F0.15 | Menüpunkt **„Playtester (TCG Showdown ↗)"** ersetzt den zurückgebauten Sandbox-Playtester. |
| F16.28 | **Meta Call ist kein Profil-Untertab mehr** — der Knopf im Profil führt in den eigenen Reiter; die Hub-Kachel ebenso (`topTab: 'meta-call'`). |

---

## Auffälligkeiten aus dem Quelltext (für die Prüfung, keine Befunde)

| # | Beobachtung | Ort |
|---|---|---|
| A1 | Der Neulade-Knopf der Meta-Kartenanalyse in **Deck-Analyse (Global)** trägt keine `id`. `app-meta-cards.js:733` sucht `currentMetaMetaReloadBtn` und findet nichts — die Umbenennung auf „Meta-Analyse neu laden“ greift nur in City League. Der Knopf steht also nach dem Laden weiter mit „Meta-Analyse laden“ über gefüllten Kacheln. | index.html:1668 gegen js/app-meta-cards.js:733 |
| A2 | Sichtbarer Rückfalltext **„Deck ? Proxy“** an drei Knöpfen (verlorenes „→“). Zur Laufzeit überschreibt `data-i18n` den Text; sichtbar wäre er nur vor dem ersten i18n-Durchlauf. | index.html:858, 1603, 2022 |
| A3 | **Karten-Legende nur an einer von drei gleichen Ansichten.** `details.ds-legend` kommt genau einmal vor, in `current-analysis`. Die Kartengitter von `city-league-analysis` und `past-meta` zeichnen dieselben Plaketten A–K ohne Legende. | index.html:1345 (einziges Vorkommen) |
| A4 | **Drei gerechnete Rubriken der City League haben keine Tabelle** (`newArchetypes`, `disappeared`, `increased`). Sie werden seit 07.09.2026 wenigstens im Leerzustandsblock mit ihrer Zahl genannt — gezeigt werden sie nicht. | js/app-city-league.js:974-976, 1082-1084 |
| A5 | **Past Meta hat keinen Meta-Kartenanalyse-Block**, obwohl `city-league-analysis` und `current-analysis` je einen haben. Asymmetrie zwischen drei sonst gleich gebauten Ansichten. | index.html:1798-2054 |
| A6 | **Der Menüpunkt mit der id `menu-btn-meta-analysis-hub` öffnet `current-meta`**, nicht `meta-analysis-hub`. id und Ziel widersprechen sich; die Kachelseite ist nur über `#hub` / `#uebersicht` / `#overview` erreichbar. | index.html:478 |
| A7 | **Der Saisonpause-Hinweis hängt an einem Inline-`display`** gegen eine CSS-Vorgabe `display:none`. Jede Stelle, die das `style`-Attribut zurücksetzt oder den Block neu zeichnet, macht ihn wieder unsichtbar. Der Block steht zweimal im Markup. | index.html:702, 728 gegen js/app-city-league.js:552 |
| A8 | **Grenzen des Rechners:** Markup deckelt „Kopien im Deck“ bei 60 und „bereits auf der Hand“ bei 4, `js/app-calculator.js` klemmt dagegen auf `1..deckSize` bzw. `0..copies`. Bei Decksize 99 blockt der Zähler, obwohl die Rechnung mehr zuließe. | index.html:2369, 2377 gegen js/app-calculator.js |
| A9 | **Zwei Datumsfelder auf einen Zustand.** `#currentMetaDateFrom` und `#metacallDateFrom` schreiben beide über `setCurrentMetaDateFrom()` in `window.currentMetaDateFrom`. Absicht — muss aber in beide Richtungen synchron bleiben. | index.html:1175, js/app-meta-call.js:10930 |
| A10 | **Stille Ausfälle:** drei Stellen brechen mit `console.warn` ab, wo der Nutzer nur eine leere Fläche sieht — Meta-Performance-Block, Kartenübersicht der City League, Antwortblock des Hubs. | js/app-tier-meta.js, js/app-city-league.js:4725, js/meta-analysis-hub.js |
| A11 | **Kennzahlen ohne Definition daneben:** „Matchup ggü. Top 20“ nennt weder Nenner noch Rang-Schwelle; „Gesamt-Win-Rate“ sagt nicht, ob Unentschieden im Nenner zählen; „Ø Platzierung“ sagt nicht, worüber gemittelt wird. Die Definitionen stehen nur unter Quellen & Methodik. | index.html:1222, 1226, 769 |
| A12 | **`stopPropagation`** ist der einzige Bezeichner in einem `on…`-Attribut von `index.html`, der keiner globalen Funktion entspricht — Methodenaufruf, kein toter Knopf. Sonst: **kein einziger `onclick` in index.html zeigt ins Leere**, und **keine doppelte `id`** unter 585 statischen IDs. | geprüft über alle `onclick`/`onchange`/`oninput`/`onfocus`/`onblur`/`onsubmit`/`onkeydown`-Attribute |

---

## Zählung

| Gruppe | Bereich | Einträge |
|---|---|---|
| F0 | Seitenübergreifend | 52 |
| F1 | Meta & Deck Analysis Hub | 12 |
| F2 | City League Meta | 23 |
| F3 | City League Deck-Analyse | 51 |
| F4 | Current Meta / Startseite | 36 |
| F5 | Deck-Analyse Global | 51 |
| F6 | Past Meta | 17 |
| F7 | Meta Call | 41 |
| F8 | Kartendatenbank | 21 |
| F9 | Proxy Printer | 15 |
| F10 | Anleitung | 4 |
| F11 | Quellen & Methodik | 10 |
| F12 | Datenlücken | 8 |
| F13 | Side Quest: Champions | 35 |
| F14 | Side Quest: TCG Pocket | 11 |
| F15 | Wahrscheinlichkeitsrechner | 9 |
| F16 | Profil (inkl. 11 Untertabs) | 116 |
| F17 | Dialoge, Blätter, Overlays | 30 |
| **Gesamt** | | **542** |

Im Abschnitt „Seit dem letzten Lauf hinzugekommen oder geändert“: 32 Zeilen, die zusammen 44 verschiedene Kennungen benennen.
