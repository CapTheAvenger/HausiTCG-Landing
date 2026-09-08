# Abschlussbericht — 100 % Agenten-Live-Prüfung, Datenverifikation und Turniervorbereitung

**Seite:** thedipidis.app · **Lauf:** 07.–08.09.2026 · **Ausgeliefert:** `202609080208-42294a3` (PR #697 und #698, beide gemerged)
**Ziel des Betreibers:** Turnier 26.09.2026 Frankfurt, Format TEF–PBL, ca. 2.700 Spieler, Deck Mega Excadrill, Ziel Day 2.

Alles hier ist gemessen. Wo nicht gemessen werden konnte, steht **NICHT GEPRÜFT** — nie „OK".

---

## 1. Was ausgeliefert wurde

| PR | Inhalt | Prüfungen |
|---|---|---|
| **#697** | Nacharbeit der drei unabhängigen Prüfberichte, 15 leere Testdateien gefüllt, fünf dabei gefundene Produktivfehler behoben, Attributmaskierung an über 90 Stellen | 3/3 grün, gemerged (`33eb397`) |
| **#698** | Win-%-Benennung: jede Quote trägt den Namen ihrer Konvention; drei tote i18n-Schlüssel entfernt; Sprachreinheitstest auf Vorlagen umgestellt | 3/3 grün, gemerged (`13a218a`) |

**Testbestand am Ende:** 6.056 JS-Zusicherungen · 1.603 Python-Tests · beide grün.
**0 leere Testdateien** (vorher 15 — das war eine Lücke, die grün aussah).

---

## 2. Bestandsaufnahme (Phase 1)

Frisch erhoben, nicht fortgeschrieben:

- `audit/inventar-oberflaeche.md` — **542 Einträge**, Gruppen F0–F17, 16 Reiter, 11 Profil-Unterreiter.
  Gemessen: kein toter `on…`-Haken in `index.html`, keine doppelte `id` unter 585 statischen Kennungen.
- `audit/datenfluss.md` — 7 Abschnitte, Kerntabelle „Kennzahl → Nenner → Quelldatei/Feld".
- `audit/testmatrix.md` — **838 Zeilen** (Block F 722, Block D 88, Block H 28 Hypothesen).

---

## 3. Befunde der drei unabhängigen Prüfberichte — alle behoben

### 3.1 Zahlen, die genauer aussahen als sie sind

| Befund | Vorher | Jetzt |
|---|---|---|
| Hochgerechneter Nenner als exakt ausgewiesen (**schwer**) | `3.138 / 41.200` | `3.138 / ≈ 41.200`, dazu der Rechenweg im Hinweis: 39.694 gelistete Listen tragen 96,19 % der Anteile, daraus ≈ 41.200 (eingegrenzt 41.192–41.207) |
| „1.506 Other" als gezählt geschrieben | „1.506" | „rund 1.500 (41.200 − 39.694 = 1.506, je nach Nenner 1.498 bis 1.513) — auch diese Zahl ist nicht gezählt" |
| Datenstand-Chip stellte Teilwissen als Gesamtwissen dar | „älteste Quelle" | „älteste der 2 von 3 Quellen mit Stand", Titel nennt die übergangene Datei |
| Glättungs-Fußnote nannte die kleinere Ursache | pauschal „Glättung" | zerlegt in Glättungs- und Gewichtungsanteil, nennt den größeren — je Deck gerechnet (Dragapult: −0,13 gegen +0,70 → Gewichtung) |
| „elf mit einer Liste, vier mit zweien" | falsch | zur Laufzeit gezählt: **10 und 5**, mit Quellenangabe im Text |

Beleg für alle: `data/limitless_online_decks.csv` (`count`, `share_numeric`), `data/tournament_decklists_per_player.csv` (`deck_archetype`, `tournament_date`), `data/format_window.json` (`in_person_legal_date`).

### 3.2 Ein scheingrüner Wächter

`backend/scrapers/per_decklist_scraper.py` bog `get_data_dir` **dauerhaft** auf dem echten Modul in `sys.modules` um und nahm es nie zurück. Folge: die Mutation „Fix vollständig zurückdrehen" ließ die **gesamte** Python-Suite grün (1583 passed). Der Wachhund davor konnte den Fehler nicht mehr sehen — der Test vor ihm hatte das Modul für ihn umgebogen.

Behoben durch den Kontextmanager `_overrides_aus()` mit `finally`. Nachgemessen: mit zurückgedrehtem Fix ist der Wachhund jetzt rot. **13 von 13 Mutationen** werden gefangen, keine überlebt.

### 3.3 Oberfläche

- Nach der Umbenennung `menu-btn-meta-analysis-hub` → `menu-btn-home` blieb beim Hub **kein Menüpunkt markiert**. Eigener Menüpunkt wieder angelegt; live nachgemessen: **16 von 16 Reitern markieren genau einen** Punkt, Ausnahme `admin` ist benannt und begründet (die Seite steht bewusst nicht im Menü).
- City League: der Herkunftssatz stand **zweimal** → jetzt einmal, in der Karte „Datenquelle", die immer gerendert wird.
- Die Begründung im Leerzustand war **sachlich falsch**. Nachgezählt an `data/city_league_archetypes_past_comparison.csv`: 11 von 11 Zeilen haben `count_change > 0`, alle 11 tragen `status = NEU`, 0 tragen `VERSCHWUNDEN`. Der Text nennt jetzt genau diese Bilanz.
- Der Notaus `.d-none` wirkte gegen die eingespielte Regel nicht mehr → `:not(.d-none)` in der Sichtbarkeitsregel.
- Drei Tabellen erschienen mit heutigen Daten **nie**. Statt unsichtbar zu bleiben, steht dort jetzt ein benannter Leerzustand mit Quelle und Zeitfenster.
- „Special Event" ist ein fest verdrahteter Scraper-Platzhalter, keine Quellangabe → in der Oberfläche als solcher gekennzeichnet.

---

## 4. Fünf Produktivfehler, gefunden beim Füllen der leeren Testdateien

Diese fünf standen in keinem Prüfbericht. Sie kamen ans Licht, weil die 15 leeren Testdateien echte Tests bekamen.

1. **Die kartenweise Seltenheits-Vorliebe wirkte nie.** `getGlobalRarityPreference()` lieferte immer `'min'`/`'max'`, der Zweig `mode === 'specific'` war unerreichbar. Der Nutzer stellte etwas ein, und nichts geschah. Gemessen: Vorliebe `SSP 181` → gezeigt wurde `TEF 12`; nach der Behebung `SSP 181`. Der Cache-Schlüssel führt die Vorliebe bereits — vorher folgenlos, jetzt tragend.
2. **`isAceSpec(null)` warf** `TypeError` statt `false` zurückzugeben, während die drei Nachbarklassifizierer `null` anstandslos vertragen.
3. **Rücknahme in der Sammlung.** Zwei gleichzeitige, abgelehnte Klicks hinterließen eine Karte „besessen ohne Anzahl". Die Zugehörigkeit wird jetzt aus dem zurückgerechneten Zählerstand abgeleitet, nicht aus einer je Klick gemerkten Momentaufnahme.
4. **Maskierung griff zu spät.** `escapeJsStr` allein reicht für einen Wert in einem HTML-Attribut nicht: der HTML-Zerteiler läuft vor dem JS-Zerteiler, ein `"` im Namen erzeugt ein **zweites Ereignisattribut**. An über 90 Stellen in 11 Dateien auf `escapeHtmlAttr(escapeJsStr(x))` umgestellt. Die Reihenfolge ist gemessen, nicht geraten: umgekehrt führt `x'); alert(1); ('` tatsächlich aus. Heute nicht ausnutzbar — keine der 20.878 Zeilen in `data/all_cards_merged.json` trägt `"` oder `<` im Namen —, aber das war eine Eigenschaft der Daten, nicht des Codes.
5. **Zwei Archetyp-Normalisierer** trugen unterschiedliche Apostroph-Zeichenklassen; `N's Zoroark ex` lief im einen ins Leere. Vereinheitlicht auf sieben Schreibweisen, testseitig zeichengleich festgenagelt.

---

## 5. Win-%-Benennung (PR #698)

Anordnung: „Win-Raten überall in der Limitless-Bezeichnung ‚Win %' — keine eigenen Begriffe."

Das war **kein pauschales Umbenennen**. `js/win-rate-konvention.js` führt drei Konventionen, und „Win %" gehört allein den Matchpunkten. Jede Stelle wurde an ihrer Rechenstelle geprüft:

| Quelle | Nachgerechnet | Konvention | Name |
|---|---|---|---|
| `limitless_online_decks_matchups.csv` `win_rate` | 1.716/1.716 Zeilen, max. 0,005 pp | S/(S+N) | Siegquote ohne Unentschieden |
| `labs_tournament_matchups_TEF-PBL.csv` `vs_win_pct` | 1.866/1.866, max. 0,005 pp | (3S+U)/3n | **Win %** |
| `labs_tournament_decks.csv` `win_pct` | 4.713/4.713 | (3S+U)/3n | **Win %** |
| `limitless_online_decks.csv` `win_rate_numeric` | 135/136, max. 0,01 pp | S/(S+N+U) | Siegquote inkl. Unentschieden |
| `js/matchup-glaettung.js` `quote()` | (S+k/2)/(S+N+k) | S/(S+N) | Siegquote ohne Unentschieden |

Kürzel („WR") bleiben, wo der Platz knapp ist — aber nur mit einem Hinweis, der vollen Namen und Formel nennt. Ein Kürzel ohne Hinweis ist ein Hausname. Auf den Bildkarten steht der Name **auf der Leinwand**, weil ein Bild keine Sprechblase hat.

Die Namen werden überall zur Laufzeit aus dem Modul geholt. Fällt es aus, steht die **Formel** da — nie ein Hausname.

Der Sprachreinheitstest verglich den angezeigten Text stumpf mit dem Rohwert und meldete die Vorlagen als Abweichung. Statt die Schlüssel zu überspringen (das hätte die Leck-Erkennung geblendet) zählt er jetzt die erlaubten Füllungen auf. Nachgeprüft: setzt der Füller einen fremden Namen ein, meldet er wieder 5 Fehler.

---

## 6. Datenverifikation (Phase 4)

**Karte für Karte gegen die Originalquelle**, nicht gegen die eigene Datenbank:

- **10 von 10 Decklisten** gegen limitlesstcg.com — 8 Mega Excadrill von Worlds (Slugs 28784, 28785, 28786, 28797, 28831, 28833, 28849, 28852), dazu 28249 und 27927. Alle 60 Karten je Liste identisch.
- **5 Turniere** gegen labs.limitlesstcg.com — 0067 Lima, 0068 Indianapolis, 0069 Turin, 0070 New Orleans, 0071 San Francisco. Archetypzahlen CSV gegen Quelle 41/41, 69/69, 65/65, 82/82, 46/46; Anteile, Bilanzen und Quoten identisch.
- **Datumsfehler behoben:** Turnier 0070 stand als 2026-06-10 statt 2026-06-12. Ursache war der still wirkungslose Override-Pfad (Abschnitt 3.2). 16.960 Zellen geändert — **alle** in `tournament_date`, 0 in den übrigen 21 Spalten, 30.459 Zeilen unverändert.
- **H4 aufgelöst:** Die neueste JP City League an der Quelle ist der 06.05.2026, das Scrape-Fenster beginnt am 31.07.2026 — die Saisonpause ist echt, kein Scraper-Fehler. Aber `city_league_analysis_past` beruht auf `additional_tournament_ids: [568]` = **Japan Championships 2026**, nicht auf City Leagues. Das steht jetzt in der Oberfläche.

---

## 7. Turniervorbereitung Frankfurt (Phase 3)

### 7.1 Was die Daten tragen

Im Formatfenster (ab `in_person_legal_date` = 2026-07-31) liegen **143 Listen aus einem einzigen Turnier** (0071 Worlds), davon **8 Mega Excadrill**. Das sind laut `data/labs_tournament_decks_TEF-PBL.csv` (`player_count` 32, `day2_players` 8) **exakt die acht Tag-2-Qualifikanten von 32 Piloten**.

**Kern — in allen 8 Listen, gleiche Anzahl (13 Slots):** Beldum 4, Metang 4, Genesect ex 2, Mega Excadrill ex 2, Mega Skarmory ex 1.

**Fast Kern — in allen 8, unterschiedliche Anzahl:** Metal Energy (16–19, Median 17), Buddy-Buddy Poffin (1–4, Median 4), Drilbur (2–4, Median 4), Team Rocket's Petrel (2–4, Median 4), Jumbo Ice Cream (2–4, Median 3), Metagross (1–2, Median 1).

Kern und fast Kern belegen im Median 46 der 60 Slots. **23 Karten sind Streitfall**; die fünf verbreitetsten stehen in 6 von 8 Listen (Pokégear 3.0, Kieran, Boss's Orders, Hero's Cape, Switch). Acht Karten stehen in genau einer Liste, sieben davon in derselben.

### 7.2 Was die Daten NICHT tragen

**Keine einzige Tech-Karte lässt sich aus diesen Daten beurteilen.** Drei Gründe, jeder für sich ausreichend:

1. Es gibt nur drei verschiedene Bilanzen unter acht Listen (8-3-1 viermal, 7-4-1 zweimal, 6-4-2 zweimal). Der größte gemessene Unterschied beruht auf 3 gegen 5 Listen.
2. Die Auswahl ist vollständig auf Erfolg gefiltert: alle acht haben Tag 2 erreicht. Die **24 gescheiterten** Mega-Excadrill-Listen veröffentlicht Limitless prinzipiell nicht.
3. Die vier 8-3-1-Listen teilen fast denselben Bau — jede Karte darin „gewinnt", unabhängig von ihrer Wirkung.

**Datenlage trägt das nicht.** Was fehlen würde: die Listen der Tag-1-Ausscheider, oder ein zweites Präsenzturnier in TEF–PBL.

### 7.3 Gegnerfeld

Online, 15-Tage-Fenster (`data/limitless_online_fenster.csv`, 10.330 Decks): Dragapult 9,49 % · Alakazam Dudunsparce 7,59 % (+1,92 pp) · Dragapult Dusknoir 6,54 % · **Mega Excadrill 5,98 % (−2,25 pp)** · Slowking 5,89 %.

Präsenz (`data/labs_tournament_decks_TEF-PBL.csv`, Worlds, 797 Spieler): Dragapult 22,33 % · Dragapult Dusknoir 10,41 % · Dragapult Blaziken 9,79 % · Basic Box 9,28 % · **Mega Excadrill 4,02 %**.

**Dragapult-Varianten stehen online bei 21,5 %, bei Worlds bei 42,5 %.** Ob Frankfurt näher am Online- oder am Worlds-Feld liegt, sagen die Daten **nicht** — es gibt kein offenes Präsenzturnier in diesem Format.

### 7.4 Paarungen (S/(S+N), alle über 500 Partien)

Stark: Grimmsnarl Froslass 58,82 % · Dragapult Dusknoir 56,98 % · N's Zoroark 56,39 % · Dhelmise 56,32 % · Festival Lead 54,33 % · Dragapult 52,33 % · Spiegel 50,00 %.

**Drei Löcher, zusammen 18,55 % des Fensterfelds:** Alakazam Dudunsparce **24,87 %** (bei 7,59 % Feldanteil und dem stärksten Aufwärtstrend), Dragapult Blaziken **38,25 %**, Slowking **37,16 %**.

Die Präsenz-Gegenprobe zeigt in dieselbe Richtung (Alakazam 2-17-1, Slowking 2-8-1, Blaziken 4-10-1), ist aber mit 11 bis 27 Partien je Paarung **dünn** und trägt als Zahl nicht.

### 7.5 Day-2-Chance

Die angezeigten **21,58 %** sind exakt nachgerechnet: (8 + 30 · 0,179419) / (32 + 30) = 21,5848 %, aus `data/labs_tournament_decks_TEF-PBL.csv`. **Keine Abweichung.**

Was **nicht** eingeht: die Spielerzahl. Weder 797 noch 2.700 stehen in der Formel. Ebenso wenig Win-Raten, Kartenwahl oder Rundenzahl. Der Anker ist **ein einziges Turnier mit 32 Piloten**, und zwar Worlds — ein eingeladenes Feld, kein offenes Regional.

Die Markov-Kette im Meta Call rechnet anders und kommt mit eigenen, benannten Eingaben auf 14,64 % (8 Runden) bzw. 8,71 % (9 Runden). Der Code benennt die Lücke selbst und rechnet sie nicht weg. Diese Nachrechnung **bestätigt** sie und beziffert sie auf 6,9 Prozentpunkte.

---

## 8. Live-Nachprüfung nach der Auslieferung

Auf `202609080008-33eb397` gemessen, vor der zweiten Auslieferung:

- 16 von 16 Reitern aktivieren, rendern und markieren **genau einen** Menüpunkt (Ausnahme `admin`, benannt).
- **0 Konsolenfehler**, 0 `NaN`, 0 `undefined`, **0 Querlauf** über alle Reiter.
- Archetyp-Kachel zeigt `3.138 / ≈ 41.200`; der Hinweis nennt Rechenweg, Intervall und die Abgrenzung zum Meta-Anteil der Startseite.
- City League: Herkunftssatz **einmal**, „Special Event" als Scraper-Angabe gekennzeichnet, Leerzustand nennt Quelle und Zeitfenster.
- Meta Call sagt von sich aus: „Runden sind hier eine Eingabe, keine Ableitung aus der Spielerzahl … Vor dem Turnier gegen die Ausschreibung prüfen: 9 statt 8 Runden setzt das Punkteziel auf 19."

---

## 9. Offen — ausdrücklich NICHT als erledigt gezählt

| Punkt | Stand |
|---|---|
| **Drei Testpartien im Kampftagebuch** („CLAUDE AUDIT TEST — bitte loeschen") | **ERLEDIGT, aber nicht von mir.** Live nachgemessen am 08.09.2026 auf `202609080208-42294a3`, angemeldet als `SUSCeMi8oS…`: das Kampftagebuch führt „0 Matches · 0 Win · 0 Loss · 0 Tie" und zeigt „Noch keine Journal-Einträge." Die drei Einträge sind also weg. Gelöscht habe ich sie nicht — Kontodaten zu löschen liegt außerhalb dessen, was ich selbst tun darf. |
| **Rundenzahl bei großen Turnieren** | Vorgabe bleibt 8 Runden / 16 Punkte, unabhängig von der Spielerzahl. Die offizielle Seite der International Championships sagt: „The number of Swiss rounds will be determined by attendance." Die Oberfläche weist ausdrücklich darauf hin und lässt 9 Runden wählen. Ob die Vorgabe der Spielerzahl folgen soll, ist eine Entscheidung des Betreibers und im Chat gestellt. |
| **Exakte Rundenstaffelung nach Spielerzahl** | **NICHT GEPRÜFT.** Die offizielle Handbuch-PDF ist gegen automatisches Abrufen gesperrt. Eine Sekundärquelle nennt 9 Runden als Normalfall und Tag 2 als Top 32 oder ≥ 19 Punkte; das ist kein Primärbeleg. |
| **`city-league-tier-title` auf dem Telefon** | Rendert 12 px statt 14,04 px wegen der Pauschalregel `.tab-content [class*="title"]{font-size:12px !important}`. Bewusst nicht mitbehoben — das braucht eine eigene Abnahme, weil die Regel viele Stellen trägt. |
| **144 verwaiste CSS-Klassen** | Inventarisiert (25 mit Inline-Stil, 45 mit gestyltem Geschwister, 72 ohne Stil). Zwei mit sichtbarer Wirkung behoben, der Rest ist unsichtbar und harmlos. |

---

## 10. Verfahren

Jede Behebung ist durch eine **Mutationsprobe** abgesichert: Änderung zurückdrehen → der Test muss rot werden → wiederherstellen. Wo eine Mutation überlebte, wurde der Test nachgeschärft und erneut gemessen; das ist mehrfach vorgekommen und jedes Mal im Bericht des jeweiligen Agenten festgehalten.

Bei der Win-%-Benennung fängt der Konventionstest zusätzlich den Fehler **in die andere Richtung** ab: eine S/(S+N)-Zahl „Win %" zu nennen ist genauso falsch wie ein Hausname.

Keine Änderung an bestehenden Nutzerdaten. Keine erfundene Zahl: jede Zahl in diesem Bericht ist entweder aus einer Datei unter `data/` gerechnet (Datei und Feld genannt) oder live im Browser abgelesen.
