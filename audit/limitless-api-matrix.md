# Limitless-API — Deckungsmatrix

Was die offizielle API liefert, was `backend/scrapers/limitless_api_scraper.py`
davon holt, wo es landet und ob es jemand ansieht.

**Stand:** 08.09.2026 · **Grundlage:** Quelltext, Testfixtures, Ausgabedateien
und CI-Workflow dieses Repos.

**Was hier NICHT geprüft werden konnte:** die *vollständige* Feldliste der
API-Antworten. Die API ist aus dieser Umgebung nicht erreichbar
(`curl https://play.limitlesstcg.com/api/tournaments` → `CONNECT tunnel failed,
response 403`) — genau das, was der Scraper in seinem Kopfkommentar
(Zeile 71-73) selbst festhält. Jeder Feldname unten ist deshalb im Repo belegt:
im Scraper-Quelltext, in seinen Kommentaren, in
`tests/python/test_limitless_api_scraper.py` oder in
`docs/online-datenbasis-ausbau.md`. Ob die API darüber hinaus weitere Felder
liefert, ist **NICHT GEPRÜFT**.

---

## Welche Endpunkte benutzt werden

| Endpunkt | Benutzt? | Beleg | Wann |
|---|---|---|---|
| `/tournaments` | ja | `LimitlessApi.turniere()`, Z. 366-371; Aufruf Z. 1023 | jeder Lauf, bis zu 40 Seiten × 100 |
| `/tournaments/{id}/details` | ja | `details()`, Z. 373-374; Aufruf Z. 1066 | **nur** bei `--tiefe voll` |
| `/tournaments/{id}/standings` | ja | `standings()`, Z. 376-377; Aufruf Z. 1067 / 1074 | immer |
| `/tournaments/{id}/pairings` | ja | `pairings()`, Z. 379-380; Aufruf Z. 1068 | **nur** bei `--tiefe voll` |

Alle vier offiziellen Endpunkte werden angefasst. Bei `--tiefe archetypen`
werden `details` und `pairings` bewusst übersprungen (`details = {}`,
`pairings = []`, Z. 1073-1075) — eine Anfrage je Turnier statt drei.

Der Zustand im Bestand: 186 Turniere `voll`, 210 `archetypen`
(`online_api_tournaments.csv`, Spalte `depth`).

---

## `/tournaments`

| Feld | Wird geholt? | Landet in | Auf der Seite? | Anmerkung |
|---|---|---|---|---|
| `id` | ja | `online_api_tournaments.csv` › `tournament_id`; als Schlüsselspalte in allen vier Dateien | nein | Auch der inkrementelle Schlüssel (`bekannte_turniere()`, Z. 718-736). |
| `name` | ja | `online_api_tournaments.csv` › `name` | nein | Nur Protokollausgabe im Lauf (Z. 1098). |
| `date` | ja | `…tournaments.csv` › `date`; abgeleitet `meta` in **allen vier** Dateien; `date` (nur Tag) in Archetyp-, Karten- und Matchupzeilen | nein | `meta` = Formatfenster über `formatschluessel()`, Z. 203-211. |
| `format` | ja | `…tournaments.csv` › `format` | nein | Nur Filterwert. Trägt nichts: alle 396 Zeilen im Bestand haben `STANDARD` — genau der im Kopfkommentar (Z. 132-136) beschriebene Grund für die `meta`-Spalte. |
| `players` | ja | `…tournaments.csv` › `players`, `online_api_archetypes.csv` › `players` | nein | Auch Schwellwertfilter (`min_spieler`, Standard 100). |
| `organizerId` | ja | `…tournaments.csv` › `organizer_id` | nein | Z. 851. In allen 396 Zeilen gefüllt, von niemandem gelesen. |
| weitere Felder | **NICHT GEPRÜFT** | — | — | API nicht erreichbar; der Quelltext nennt keine weiteren. |

---

## `/tournaments/{id}/details`

| Feld | Wird geholt? | Landet in | Auf der Seite? | Anmerkung |
|---|---|---|---|---|
| `phases` (Liste) | ja | `…tournaments.csv` › `phases` (nur die **Anzahl**, `len(phasen)`, Z. 854) | nein | Der Inhalt der Phasen geht bis auf zwei Felder verloren. |
| `phases[].type` | ja | fließt in `swiss_rounds` ein | nein | Z. 807-808: nur die erste Phase mit `type == "SWISS"` zählt. |
| `phases[].rounds` | ja | `…tournaments.csv` › `swiss_rounds` | nein | Nur die Swiss-Phase; Top-Cut-Runden fallen weg. |
| `phases[].phase` | **nein** | — | nein | Belegt in `test_limitless_api_scraper.py:205`. Verworfen. |
| `phases[].mode` | **nein** | — | nein | Belegt ebd. (`"mode": "BO3"`). Verworfen — Bo1/Bo3 ist damit nirgends bekannt. |
| `isOnline` | ja | `…tournaments.csv` › `is_online` | nein | Z. 852. |
| `decklists` | ja | `…tournaments.csv` › `has_decklists` | nein | Z. 853. **Unzuverlässig**, siehe Befund 4. |
| weitere Felder | **NICHT GEPRÜFT** | — | — | |

Bei `--tiefe archetypen` ist `details` leer. Folge im Bestand: 210 von 396
Zeilen tragen `is_online` und `has_decklists` **leer** und `swiss_rounds`/
`phases` als **0** — siehe Befund 5.

---

## `/tournaments/{id}/standings`

| Feld | Wird geholt? | Landet in | Auf der Seite? | Anmerkung |
|---|---|---|---|---|
| `player` | ja | in **keiner** Spalte | nein | Nur intern als Schlüssel: `deck_je_spieler()` (Z. 387-395) und Zuordnung Partie → Deck. Bewusst — eine Spielerspalte wäre eine personenbezogene Ausgabe, die kein Konsument braucht. |
| `deck.id` | ja | `…archetypes.csv` › `archetype_id`; `…cards_*.csv` › `archetype_id`; `…matchups_*.csv` › `archetype_id`/`opponent_id` | nein | |
| `deck.name` | ja | `…archetypes.csv` › `archetype_name` | nein | Der einzig zulässige Weg zum Namen (`deck_namen()`, Z. 398-410; Begründung Z. 36-47: Slug-Weg trifft 26 von 62, `deck.name` 61 von 62). |
| `deck.icons` | **nein** | — | nein | Belegt in Z. 38 des Kopfkommentars und in `test_limitless_api_scraper.py:39`. Verworfen — siehe „Nicht genutzt". |
| `decklist.pokemon[]` / `.trainer[]` / `.energy[]` | ja | `…cards_*.csv` (eine Zeile je Karte × Archetyp) | nein | `GRUPPEN`, Z. 103. Die Gruppe steht in Spalte `group`. |
| `decklist.*[].set` | ja | `…cards_*.csv` › `set` | nein | Auch Rohstoff für den Rotationsanker (`update_sets.py`). |
| `decklist.*[].number` | ja | `…cards_*.csv` › `number` | nein | |
| `decklist.*[].count` | ja | `…cards_*.csv` › `copies_total`, `avg_count` | nein | |
| `decklist.*[].name` | ja | `…cards_*.csv` › `card` | nein | Erster gesehener Name gewinnt (`name_je.setdefault`, Z. 546). |
| `record.wins` / `.losses` / `.ties` | ja | `…archetypes.csv` › `wins`, `losses`, `ties`, `matches`, `win_rate` — **nur** wenn keine Pairings vorliegen | nein | `bilanz_aus_records()`, Z. 435-455. Spalte `record_source` sagt, welcher Weg es war. Im Bestand: 8.101 Zeilen `pairings`, 9.297 Zeilen `records`. |
| `name` (Anzeigename des Spielers) | **nein** | — | nein | Belegt in `test_limitless_api_scraper.py:37`. Verworfen. |
| `country` | **nein** | — | nein | Belegt ebd. Verworfen. |
| `placing` | **nein** | — | nein | Belegt in `docs/online-datenbasis-ausbau.md:90` (`placing: null`). Verworfen. |
| `drop` | **nein** | — | nein | Belegt ebd. (`drop: 4`). Verworfen. |
| weitere Felder | **NICHT GEPRÜFT** | — | — | |

---

## `/tournaments/{id}/pairings`

| Feld | Wird geholt? | Landet in | Auf der Seite? | Anmerkung |
|---|---|---|---|---|
| `player1` | ja | keine eigene Spalte | nein | `_partien()`, Z. 413-432. |
| `player2` | ja | keine eigene Spalte | nein | Leer = Freilos/Zeitstrafe: zählt in `…archetypes.csv`, nicht in die Matrix (Z. 581-582). |
| `winner` | ja | fließt in `wins`/`losses`/`ties` beider Dateien | nein | Drei Sonderwerte, live abgelesen (Z. 49-58): `0` = Unentschieden, `-1` = **Doppelniederlage für beide**, sonst Spieler-ID. |
| `round` | **nein** | — | nein | Belegt in `test_limitless_api_scraper.py:72-76`. Verworfen — damit ist keine Auswertung nach Runde möglich. |
| `phase` | **nein** | — | nein | Belegt ebd. Verworfen — Swiss und Top Cut sind in der Matrix nicht trennbar. |
| weitere Felder | **NICHT GEPRÜFT** | — | — | |

---

## Ausgabedateien und ihre Spalten

Belegt in `SPALTEN_*` (Z. 673-690) und gegen die tatsächlichen Kopfzeilen geprüft
— sie stimmen exakt mit `data/_consumers.md` überein.

| Datei | Spalten | Zeilen (ohne Kopf) | Größe |
|---|---|---|---|
| `data/online_api_tournaments.csv` | 15 | 396 | 64 KB |
| `data/online_api_archetypes.csv` | 16 | 17.398 | 2,3 MB |
| `data/online_api_cards_TEF-PBL.csv` | 13 | 257.116 | 26 MB |
| `data/online_api_matchups_TEF-PBL.csv` | 11 | 79.445 | 8,1 MB |
| `data/meta_prognose.json` (abgeleitet, `scripts/build_meta_prognose.py`) | — | 117 Prognosezeilen | 49 KB |

Karten und Matchups liegen je Formatfenster in eigenen Dateien
(`_chunkname()`, Z. 692-703). Aktuell existiert genau ein Fenster: `TEF-PBL`.
Für `TEF-CRI` und `TEF-POR` gibt es keine Chunkdatei, weil diese 210 Turniere
nur dünn geholt wurden.

---

## Nicht genutzt

Was die API laut Beleg im Repo liefert, das Projekt aber wegwirft.

| Verworfen | Absicht? |
|---|---|
| `deck.icons` (Standings) | **Vermutlich nicht.** Das Projekt führt `data/archetype_icons.json` und die Oberfläche zeigt Archetyp-Icons; die API liefert sie je Standings-Eintrag frei Haus. Weder Quelltext noch `docs/online-datenbasis-ausbau.md` nennen einen Grund für das Verwerfen. |
| `name`, `country` (Spieler, Standings) | **Ja, Absicht.** Personenbezogene Felder, für Feldschnitte und Matchups nicht nötig. |
| `placing` (Standings) | **Absicht, aber teuer.** `docs/online-datenbasis-ausbau.md:88-93` nennt das Feld ausdrücklich; die neue Datenbasis ist gerade deshalb wertvoll, weil sie *nicht* nur die vorderen Plätze führt. Ohne `placing` lässt sich aber auch keine Top-8-/Top-16-Auswertung mehr aus diesen Dateien bauen. |
| `drop` (Standings) | **Absicht.** Ebd. genannt; für Anteil und Bilanz ohne Belang. |
| `round`, `phase` (Pairings) | **Kein Beleg für Absicht.** Kein Kommentar erwähnt sie. Ohne sie ist die Matchup-Matrix nicht nach Swiss/Top Cut und nicht nach Rundenverlauf aufteilbar — beides ließe sich ohne eine einzige zusätzliche Anfrage haben. |
| `phases[].mode` (Details) | **Kein Beleg für Absicht.** Bo1 gegen Bo3 ist für jede Siegquote erheblich und wäre eine Spalte in `online_api_tournaments.csv`. |
| `phases[].phase`, Top-Cut-Runden (Details) | **Teilabsicht.** Z. 807-808 sucht gezielt die Swiss-Phase; die restlichen Phasen überleben nur als Zähler. |
| `record.wins/losses/ties` bei `--tiefe voll` | **Ja, Absicht.** Dann kommt die Bilanz aus `/pairings`; beide Wege wurden am 08.09.2026 gegeneinander geprüft (32-40-0, Z. 32-34). |
| `format` als **API-Parameter** | **Nein.** `turniere()` kann `format` an die API geben (Z. 369-370), `main()` reicht es nie durch (Z. 1023). Siehe Befund 6. |

---

## Erreicht keinen Nutzer

Gesucht wurde mit `grep -rn "online_api" js/` (**kein Treffer**),
`grep -rn "meta_prognose"` repo-weit und über die `data-quelle`-Angaben in
`index.html` (die fünf vorhandenen nennen `limitless_online_decks.csv`,
`tournament_cards_data_overview.csv`, `all_cards_database.csv`,
`city_league_archetypes.csv`, `city_league_analysis.csv` — keine API-Datei).

| Datei | Größe | Wer liest sie? |
|---|---|---|
| `data/online_api_matchups_TEF-PBL.csv` | **8,1 MB** (79.445 Zeilen) | **Niemand.** Kein `js/`, kein `backend/`, kein `scripts/`. Nur Größen-/Frischeprüfungen (`sanity_check_data.py` Glob, `build_data_stand.py`). |
| `data/online_api_cards_TEF-PBL.csv` | **26 MB** (257.116 Zeilen) | Kein Frontend. Zwei Backend-Leser, und beide lesen **nur `set` und `number`**: `backend/core/update_sets.py:443-467` und `limitless_api_scraper.py:252-268` (Rotationsanker). Die eigentliche Nutzlast — `card`, `copies_total`, `avg_count`, `inclusion_rate` — liest niemand. |
| `data/online_api_archetypes.csv` | **2,3 MB** (17.398 Zeilen) | Kein Frontend. Ein Leser: `scripts/build_meta_prognose.py:308`, und der nutzt genau **4 von 16 Spalten** (`meta`, `date`, `lists`, `archetype_id`). |
| `data/online_api_tournaments.csv` | **64 KB** (396 Zeilen) | Kein Frontend. Nur der Scraper selbst als Gedächtnis (`bekannte_turniere()`). |
| `data/meta_prognose.json` | **49 KB** (117 Prognosezeilen) | **Niemand.** Wird vom Workflow gebaut (`limitless-api-scrape.yml:231`) und committet (Z. 265). Kein `fetch`, kein Import, keine Erwähnung in `js/`, `index.html`, `prerender/`, `posts/` oder `bot/`. |

**Summe ohne Leser im Frontend: rund 36,5 MB in vier CSV-Dateien plus eine
49-KB-Prognose.** Alle fünf werden bei jedem Lauf nach `main` gepusht und
mit jedem Deploy ausgeliefert.

Der einzige Weg, auf dem etwas davon die Seite überhaupt erreichen *könnte*:
`data/data_stand.json` führt Einträge für alle vier CSV-Dateien (unter
`dateien` und `inhalt_bis`), und `js/ds-datenstand.js` liest diese Datei.
Es zeigt aber nur Chips für Dateien, die eine `data-quelle`-Angabe nennt —
keine tut es. Also auch dort: kein Nutzer.

---

## Befunde

1. **Vier Dateien, 36,5 MB, kein einziger Frontend-Leser.**
   `grep -rn "online_api" js/` liefert null Treffer. Der gesamte Rückbau auf
   die offizielle API ist gebaut, geprüft, in CI verankert und wird täglich
   gepusht — auf der Seite ist davon nichts zu sehen. Die Oberfläche zeigt
   weiterhin die alten HTML-Scrape-Dateien (`limitless_online_decks.csv`,
   `online_tournament_top8_decks.csv`), also genau die gedeckelte Stichprobe,
   die der neue Scraper laut seinem Kopfkommentar (Z. 8-12) ablösen sollte.

2. **`data/meta_prognose.json` hat keinen Leser.** Sie ist die einzige
   Ableitung, die *für* die Oberfläche gedacht aussieht (117 Archetypen mit
   `prognose`, `prognose_von`, `prognose_bis`, `bewegung`), wird bei jedem Lauf
   neu gebaut und committet — und von keiner Zeile JavaScript geladen.

3. **`data/_consumers.md` behauptet eine Durchsetzung, die es für diese Dateien
   nicht gibt.** Zeile 6-8 der Datei: „`scripts/data_guardian.py` enforces this
   list daily […] so this document cannot silently drift from reality." Das
   `CONSUMERS`-Dict in `scripts/data_guardian.py:52-90` enthält aber nur sechs
   Cardmarket-/Karten-Dateien. Keine der vier `online_api_*`-Dateien steht
   darin — ihr Spaltenvertrag wird von *niemandem* geprüft. (Zeilenzahl und
   Frische prüft `scripts/sanity_check_data.py`, Spaltennamen nicht.)

4. **`has_decklists` ist als Aussage falsch.** Turnier
   `6a8c23ae8302ae761e5fb0bc` („SEASAC League Challenge #24") trägt
   `has_decklists=False`, hat aber **816 Kartenzeilen** in
   `online_api_cards_TEF-PBL.csv` und 144 Matchupzeilen. Die Spalte kopiert
   `details.decklists` (Z. 853); ob Karten vorliegen, entscheidet in Wahrheit
   `standings[].decklist`. Wer die Spalte als Filter benutzt, verliert echte
   Daten.

5. **Leer und Null sind in `online_api_tournaments.csv` nicht unterscheidbar.**
   Bei `--tiefe archetypen` ist `details = {}` (Z. 1073), also schreibt
   Z. 852-854 für `is_online` und `has_decklists` den Leerstring und für
   `swiss_rounds`/`phases` eine **0**. Im Bestand: 210 von 396 Zeilen sehen so
   aus. „0 Swiss-Runden" und „nicht abgefragt" stehen damit als derselbe Wert
   in der Datei — genau die Sorte stiller Mehrdeutigkeit, die
   `data/_consumers.md` beim `price_status` ausdrücklich abschafft.

6. **Der `--format`-Filter läuft clientseitig, obwohl die API ihn kann.**
   `LimitlessApi.turniere()` nimmt `format_id` und hängt es an die Anfrage
   (Z. 366-371). `main()` ruft `api.turniere(spiel=a.game, limit=100,
   seite=seite)` (Z. 1023) — ohne Format. Gefiltert wird erst danach in
   `neue_turniere()` (Z. 638). Es werden also bis zu 40 Seiten × 100 Turniere
   aller Formate geholt, um die STANDARD-Turniere herauszusieben.

7. **Die Prognose führt nur Slugs, keine Namen.** Jede Zeile in
   `meta_prognose.json` trägt `archetyp_id` (`"dragapult-ex"`), aber kein
   `archetyp_name` — obwohl `online_api_archetypes.csv` die Spalte
   `archetype_name` hat und der Scraper in Z. 36-47 belegt, dass der Weg vom
   Slug zum Namen nur 26 von 62 Fällen trifft. Ein Frontend, das diese Datei
   anzeigen wollte, müsste genau den Weg gehen, den das Projekt an anderer
   Stelle als falsch nachgewiesen hat.

8. **12 von 16 Spalten in `online_api_archetypes.csv` liest niemand.**
   `build_meta_prognose.py` nutzt `meta`, `date`, `lists`, `archetype_id`.
   Ungelesen bleiben: `tournament_id`, `players`, `archetype_name`,
   `lists_total`, `share`, `wins`, `losses`, `ties`, `matches`, `win_rate`,
   `win_rate_convention`, `record_source`. Die Siegquoten des ganzen Feldes —
   der Hauptgrund für den API-Rückbau — werden geschrieben und nie gelesen.

9. **Die Kartendatei wird zu 26 MB geführt, damit zwei Funktionen zwei Spalten
   daraus lesen.** `update_sets.py:_gespielte_karten_je_set` und
   `limitless_api_scraper.py:fehlendes_fenster` lesen ausschließlich `set` und
   `number`, um zu zählen, wie viele verschiedene Karten eines Sets im Feld
   gespielt werden. `card`, `copies_total`, `lists_with_card`, `lists_total`,
   `avg_count`, `inclusion_rate` — die eigentliche Leistung des Scrapers — hat
   im ganzen Repo keinen Leser.

10. **`data_stand.json` kennt `meta_prognose.json` nicht.**
    `scripts/build_data_stand.py:115` führt die Datei in `DATEIEN`, die
    ausgelieferte `data/data_stand.json` (erzeugt 08.09.2026 11:49) hat aber
    weder unter `dateien` noch unter `inhalt_bis` einen Eintrag dafür, und sie
    steht auch nicht unter `ohne_stand` (dort steht nur `format_window.json`).
    Ein Chip auf die Prognose bliebe damit stumm — auch wenn ihn jemand baute.

11. **Toter Pfad im Workflow.** `.github/workflows/limitless-api-scrape.yml:268`
    macht `git add -u data/online_api_cards.csv data/online_api_matchups.csv`
    für die flachen Vorgängerdateien. Beide existieren nicht mehr (nur die
    `_TEF-PBL`-Chunks). Harmlos durch `|| true`, aber irreführend beim Lesen.

12. **Rundenzahl und Modus gehen verloren, obwohl sie schon geholt wurden.**
    `/pairings` liefert `round` und `phase`, `/details` liefert
    `phases[].mode` (alle drei belegt in den Testfixtures, Z. 72-76 bzw. 205).
    Keines der drei landet in einer Spalte. Damit lässt sich die Matchup-Matrix
    nicht nach Swiss/Top Cut trennen und keine Siegquote nach Bo1/Bo3
    unterscheiden — ohne dass eine einzige zusätzliche API-Anfrage nötig wäre.
