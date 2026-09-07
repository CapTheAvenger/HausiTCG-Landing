# Abschlussbericht — 100 % Agenten-Live-Prüfung, Datenverifikation und Turniervorbereitung

**Seite:** thedipidis.app · **Lauf:** 07.09.2026 · **Ausgeliefert:** `202609071722-bc9a494`
**Ziel des Betreibers:** Turnier 26.09.2026 Frankfurt, Format TEF–PBL, ca. 2.700 Spieler, Deck Mega Excadrill, Ziel Day 2.

Alles hier ist gemessen. Wo nicht gemessen werden konnte, steht **NICHT GEPRÜFT** — nie „OK".

---

## 1. Was ausgeliefert wurde

| PR | Inhalt | Prüfungen |
|---|---|---|
| **#695** | Tech-Belege (Entscheidung 2b), Navigation und Tieflinks, Meta Call M1–M6, Online-Deckliste-Leser samt Arbeitsablauf, Spalte `quelle` für 30.459 Zeilen | 3/3 grün, gemerged |
| **#696** | Nacharbeit nach unabhängiger Abnahme: Deckschutz, Kartenabdeckung, Quellenangaben, Win-%-Konvention, drei Datenbefunde, Wachen | 3/3 grün, gemerged |

**Testbestand am Ende:** 4.793 JS-Zusicherungen · 1.546 Python-Tests · beide grün.
15 leere Testdateien bestehen unverändert fort (vorbestehend, im Lauf ausgewiesen).

---

## 2. Arbeitsweise

Jede Änderung durchlief drei Hände:

1. **Bauen** — ein Agent je Dateimenge, Dateimengen paarweise überschneidungsfrei.
2. **Unabhängige Abnahme** — ein zweiter Agent, der die Änderung nicht gebaut hat: Diff lesen, Behauptungen nachmessen, eigene Mutationen fahren, md5 vorher/nachher.
3. **Nacharbeit** — ein dritter Agent behebt, was die Abnahme gefunden hat.

**Das hat sich gelohnt.** Von vier Paketen wurde in der ersten Abnahme **kein einziges vollständig** abgenommen. Die Abnahme fand unter anderem: eine Datenverlustgefahr, zwei weiterhin erfundene Zahlen und eine Quellenangabe auf eine Datei, die es nicht gibt.

---

## 3. Behobene Befunde — nach Schwere

### 3.1 Datenverlust (schwer)

**Ein Doppelklick auf „Leeren" löschte das Deck unwiederbringlich.**
Geprüft an `clearDeck('pastMeta')` mit zwei Aufrufen im Abstand von 0 ms → Deck geleert, `localStorage.removeItem('pastMetaDeck')` ausgeführt.
Behoben: der zweite Klick zählt erst nach 400 ms; geprüft mit echter Uhr bei 0/50/120/250/399 ms → Deck bleibt vollständig; bei 450/1500 ms → geleert.
Zwei Folgefehler mitbehoben: das Leeren einer Quelle setzte `rarityPreferences` **aller drei** Quellen zurück; und `updateDeckDisplay` löschte `autosave_deck`, die letzte Sicherungskopie. Beides jetzt nicht mehr.

### 3.2 Erfundene Zahlen (schwer — Regelverstoß)

| Wo | Was behauptet wurde | Jetzt |
|---|---|---|
| Handstatistik | „Mulligan 100,0 %", sobald die Kartendatenbank nur teilweise geladen war — im Past-Meta-Reiter der Regelfall | keine Prozentzahl, solange eine Deckkarte unbestimmbar ist; stattdessen der Grund |
| Kartenabdeckung | Zähler über drei Erhebungen summiert. Live gemessen: **545 von 3.491** Einträgen mit Zähler über Nenner, Höchstwert **270 %** | gerechnet in genau **einer** Erhebung, die an der Plakette steht. Live nachgemessen: **13 Plaketten, 0 über 100 %, Höchstwert 100,0 %**, Beispiel „🔥 100,0% Coverage · 20/20 · Current Meta / Meta Live · Max: 4x" |
| Rechner | Eingabe `6.5` wurde still als 6 gerechnet | der Ersatzwert steht sichtbar da |

### 3.3 Falsche Quellenangabe (schwer — Regelverstoß)

`data/tournament_cards_data_cards.csv` stand sichtbar auf der Seite. **Diese Datei existiert nicht** — sie ist ein Ladeschlüssel, aufgelöst auf die Formatdatei.
Live nachgeprüft: dort steht jetzt „Quelle: ./data/tournament_cards_data_cards_TEF-PBL.csv — genau die Formatdatei, die der Lader für TEF-PBL holt."
Beide betroffenen Module prüfen jetzt **jeden** in einem Oberflächentext genannten `data/`-Pfad gegen das Dateisystem, mit einer Zusicherung, die bei einem nicht existierenden Pfad rot wird.

### 3.4 „Win %" waren drei verschiedene Formeln (schwer)

Nachgerechnet, Zeile für Zeile:

| Datei | Formel | geprüfte Zeilen |
|---|---|---|
| `limitless_online_decks.csv` | S/(S+N+U) | 135 von 136 (Ausnahme Wailord — Datenfehler der Quelle) |
| `limitless_online_decks_matchups.csv` | S/(S+N) | 1.716 von 1.716 |
| `labs_tournament_decks*.csv` | Matchpunkte (3S+U)/3n | 9.426 von 9.426 |
| `labs_tournament_matchups*.csv` | Matchpunkte | 95.972 von 95.972 |

Der Predictor-5.3-Vergleich stellte zwei davon nebeneinander. Beide Seiten laufen jetzt in S/(S+N); die Verschiebung für Mega Excadrill geht von **−4,60** auf **−1,24** Punkte zurück. Die Kurznamen der drei Konventionen sind entwirrt und stehen als `title` an jedem Chip.

### 3.5 Tote Gegnersuche

Die Gegner-Matchup-Auswahl war doppelt tot: sie las Globals, die es seit einem Umbau nicht mehr gibt, und das Detailfeld trug `display:none` auf der Grundklasse, während nur `d-none` entfernt wurde.
Live nachgeprüft: 20 Gegner in der Liste; Klick auf „Alakazam Dudunsparce" → „Win Rate 24,87 % · Record 187 - 565 - 6 · Partien gesamt 758" — deckungsgleich mit `data/limitless_online_decks_matchups.csv`.

### 3.6 Weitere behobene Befunde

Navigation und Tieflinks (alle 16 Reiter und alle 11 Profil-Untertabs hin und zurück), neun tote Anleitungsverweise, Hilfe-Dialog mit Escape und Fokusführung, Fenstertitel für `admin`, Knopf-Hervorhebung (der abgewählte Knopf war grün statt neutral), Tier-Sortierung gegen ihre eigene Überschrift, Formatauswahl-Abgleich, Zähler mit zwei Wahrheiten, erklärte Leerzustände statt stiller Lücken.

---

## 4. Datenverifikation

### 4.1 Was in Ordnung ist

| Prüfung | Ergebnis |
|---|---|
| Decklisten mit genau 60 Karten | **1.201 von 1.201** |
| Verstöße gegen die 4er-Regel | **0** |
| doppelte Kartenzeilen | **0** |
| Karten-IDs ohne Treffer im Bestand (20.878 Karten) | **0 von 30.459** |
| Σ `player_count` = `total_players` | **71 von 71 Turnieren** |
| Σ `day2_share_pct` = 100,00 | **71 von 71** |

### 4.2 Was repariert wurde

**100 von 1.201 Decklisten trugen `0-0-0`** — bei Worlds jede fünfte (28 von 143), darunter Platz 53, Mega Excadrill.
Ursache gemessen: der Rückfall im Scraper feuerte nur bei komplett genulltem Stapel, und der Namensschlüssel war groß-/kleinschreibungsempfindlich gegen eine Datei, die Namen kleingeschrieben führt. Zeichengenau: **0 Treffer**. Normalisiert: **84**. Über den Platz zusätzlich: **alle übrigen**.
Ergebnis: **0 von 1.201** ohne Bilanz. 2.555 Zeilen geändert, 1.823.468 Zellen der übrigen Spalten Zelle für Zelle verglichen — keine Abweichung.
Alle acht Mega-Excadrill-Listen bei Worlds tragen jetzt ihre Bilanz.

**`day1` war eine byte-genaue Kopie von `overall`** in allen Paarungsdateien — die Quelle ignoriert das `d1`-Flag. Keine Zahl wurde verändert; neue Spalten `tagesfilter_quelle` und `ist_spiegel` machen es aus der Datei heraus erkennbar. Die 80 Zeilen mit `vs_count ≠ S+N+U` sind Spiegelpaarungen und in allen 80 exakt Faktor 2 — richtige Zählweise, jetzt benannt.

**Die Decklisten decken nur das Tag-2-Feld ab.** Nicht durch einen Filter im Code, sondern weil limitlesstcg.com für Tag-1-Spieler keine Listen veröffentlicht. Belegt: Turnier 0071 hat 797 Spieler, davon 143 mit `day2=1` — und genau diese 143 stehen in der Datei, Plätze 1–143 lückenlos.
Für Mega Excadrill: **8 Listen von 32 Piloten bei 797 Spielern.** Das steht jetzt an allen vier Anzeigen, nicht nur an einer. Der Kommentar nannte die Feldgröße mit 774; belegt sind 797 (drei Dateien übereinstimmend) — korrigiert und gegen die Dateien zugesichert.

### 4.3 Wachen gegen stilles Veralten

Vorher: der Herzschlag deckte vier Jobs ab, die **gesamte Online-Seite** der Datengrundlage war ungedeckt, und `limitless_online_fenster.csv` — die Datei mit dem einzigen aktuellen Meta-Anteil — hatte weder Frische-Anzeige noch Datenstand noch Herzschlag, bei einem Arbeitsschritt mit `continue-on-error`.

Jetzt: vier Online-Scraper im Herzschlag, vier Dateien im Datenstand, eine Stillstandswache (eine Datei, die über mehrere planmäßige Läufe byte-identisch bleibt, meldet sich), und der Fensterschritt kann nicht mehr still scheitern — der Ausfall ist an drei Stellen sichtbar.
Wächterstand: CRITICAL 0 · WARN 16 · INFO 10. Die sieben neuen WARN sind echte Lücken, die der nächste Wochenlauf (Di, 08.09.) schließt.

---

## 5. Vertrauensurteil je Quelle

| Quelle | Kennzahl | Urteil | Stichprobe |
|---|---|---|---|
| `limitless_online_fenster.csv` | Meta-Anteil (aktuell) | **VERLÄSSLICH** | 10.330 Decks / 15 Tage |
| `limitless_online_decks.csv` | Win % gesamt | **VERLÄSSLICH** | 13.827 Partien (Excadrill) |
| `limitless_online_decks_matchups.csv` | Paarungen | **VERLÄSSLICH** | 10.361 Partien, alle 20 Gegner ≥ 142 |
| dieselbe | Zeitbezug | **EINGESCHRÄNKT** | kein Datumsfeld — kumulativ |
| `limitless_online_decks.csv` | Meta-Anteil kumulativ | **EINGESCHRÄNKT** | 7,29 % kumulativ gegen 5,98 % im Fenster |
| `online_tournament_top8_decks.csv` | Top-8-Quote | **EINGESCHRÄNKT** | 853 Antritte; zwei Nenner in einer Zeile |
| dieselbe | `avg_winrate_in_top8` | **NICHT VERLÄSSLICH** | Spalte enthält Matchpunkte, keine Prozentwerte |
| `labs_tournament_decks_TEF-PBL.csv` | Anteil, Win %, Day-2-Quote | **EINGESCHRÄNKT** | **1 Turnier**, 254 Partien, 32 Antritte |
| dieselbe | `top8_conv_rate` | **NICHT VERLÄSSLICH** | steht in 4.713 von 4.713 Zeilen auf 0.0 — tote Spalte |
| `labs_tournament_matchups_TEF-PBL.csv` | Paarungen Papier | **NICHT VERLÄSSLICH** | von 27 Gegnern hat **einer** ≥ 30 Partien |
| `tournament_decklists_per_player.csv` | Kartenabdeckung | **VERLÄSSLICH** | 1.201 Listen, 0 Fehler |
| dieselbe | Feldabdeckung | **EINGESCHRÄNKT** | Tag-2-Feld, 143 von 797 |
| `city_league_*` | alles | **NICHT VERLÄSSLICH** | 0 Zeilen seit 38 Tagen — ehrlich ausgewiesen (japanische Saisonpause) |

---

## 6. Turniervorbereitung Frankfurt

Vollständig in `audit/turniervorbereitung-frankfurt.md`. Kern, live nachgeprüft:

**Mega Excadrill · 15,8 % Day-2-Chance · 16 Punkte in 8 Runden.**
Darunter steht jetzt: „Turnierrahmen: 2.700 Spieler — geht nicht in diese Chance ein. Sie folgt aus Runden, Punkteziel, Feldanteilen und Paarungen." Denn die Spielerzahl ging nie in die Rechnung ein; vorher stand sie daneben, als täte sie es.
Datengrundlage auf dem Banner: 46 Major-Turnier-Zeilen, Online-Stichprobe 10.330 Decks aus 15 Tagen (22.08.–06.09.2026), Gewichtung 80 % Papier (45 % Day 2 · 35 % Day 1) · 20 % Online.

**Der gefährliche Feldanteil ist 27,25 %** — neun Gegner unter 45 % Win %, gewichtete Win % darin 34,11 %. Die drei Grundgesamtheiten sind sich einig (kumulativ 27,06 %, Worlds-Papier 25,74 %). Aber **26,64 Prozentpunkte des Feldes haben gar keine gemessene Paarung.**

**Tech-Karten lassen sich in diesem Projekt inhaltlich nicht begründen.** `all_cards_database.json`: das Feld `card_text` ist leer bei 1.175/1.175 Supportern, 992/994 Items, 334/334 Tools, 270/270 Stadien. Zu jeder Trainer-Tech-Karte ist nur Häufigkeit belegbar, nie Wirkung. Für **keine** der fünf schlechten Paarungen existiert eine Partienmessung, die eine Karte rechtfertigt. Genau deshalb kennzeichnet die Seite seit Entscheidung 2b jede Empfehlung als belegt oder unbelegt.

---

## 7. NICHT GEPRÜFT

| Punkt | Was fehlt |
|---|---|
| Rundenzahl in Frankfurt bei ~2.700 Spielern | die Ausschreibung. 8 ist eine Eingabe, keine Ableitung — steht jetzt auf der Seite |
| Fehler durch fehlende Swiss-Paarung in `calcDay2` | das Modell zieht jede Runde unabhängig; die Größe der Abweichung ist nicht gemessen |
| ob zwischen 07. und 26.09. ein Präsenzturnier in TEF–PBL liegt | `labs_tournaments.json` endet bei 0071 |
| Tera-Anteil im Feld | existiert in keiner Datei |
| Wirkung jeder Trainerkarte | `card_text` ist für Trainer leer |
| wie viele Listen labs.limitlesstcg.com für 0071 führt | belegt ≥ 256; mehr braucht einen Abruf |
| `format_window.json`, Feld `set_addition_only` | keine zweite Quelle im Repo, gegen die es prüfbar wäre |
| `labs_tournament_matchups.csv` | bewusst ohne Stillstandswache (32-Tage-Lücke im Sommer gemessen) — Stillstand ist dort nicht von Gesundheit zu unterscheiden |

**Formatfrage geklärt:** live an limitlesstcg.com/cards am 07.09.2026 nachgesehen — jüngste englische Hauptserie ist **Pitch Black (PBL), 17.07.2026**; danach ist **kein Set gelistet**. Die rechnerische 56-Tage-Kadenz ergäbe den 25.09., einen Tag vor dem Turnier — dafür gibt es aber keinen angekündigten Titel. TEF–PBL ist am 07.09. der Stand; vor dem Turnier noch einmal prüfen.

---

## 8. Offene Testdaten

| Was | Wo | Warum noch da |
|---|---|---|
| 3 Matches unter „CLAUDE AUDIT TEST — bitte loeschen" (Dragapult vs Alakazam Dudunsparce / vs Alakazam / vs Charizard) | Profil → Battle Journal, Filter „Turnier" | Kontoeinträge löschen gehört dem Betreiber, nicht mir. Drei Klicks auf „Del" |
| Meta-Call-Turniername „QA Testturnier" | Meta Call | ersetzt durch „Frankfurt 26.09.2026 (TEF-PBL)" |

---

## 9. Live-Nachweis

Ausgeliefert `202609071722-bc9a494`, Service Worker und Cache geleert, alle 16 Reiter durchgeklickt:

| Prüfung | Ergebnis |
|---|---|
| Reiter aktivieren | 16 von 16 |
| Konsolenfehler | 0 |
| `NaN` im sichtbaren Text | 0 |
| `undefined` im sichtbaren Text | 0 |
| waagerechter Bildlauf | 0 |
| Adresszeile folgt dem Reiter | 16 von 16 |

Einzeln live gegengeprüft: Meta-Call-Frankfurt-Szenario, Rundenhinweis, Gewichtungszeile, Gegnersuche mit Zahlen aus der Quelldatei, Quellenangabe „Used in Top 256", Tier-Grundlagenzeile mit allen Schwellen, Leerzustand der Vergleichstabellen, Kartenabdeckung mit Erhebung und Nenner, Fenstertitel `admin`.
