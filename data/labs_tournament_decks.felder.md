# `labs_tournament_decks.csv` — was in den Spalten wirklich steht

Eine Zeile ist **ein Deck auf einem Turnier**, nicht ein Spieler und nicht eine
Karte. 4.713 Zeilen, 71 Turniere, 36 Spalten (gemessen am 07.09.2026).

Geschrieben von `backend/scrapers/labs_tournament_scraper.py` aus
`labs.limitlesstcg.com/<id>/decks` und den Nebenansichten `?conversion`,
`?day=1`, `?day=2` sowie `/standings`.

Dieses Blatt gibt es, weil zwei Spalten anders heissen, als sie gemeint sind,
und drei Spalten eine Null tragen, die keine Messung ist. Wer die Datei liest,
soll das hier finden, bevor er die falsche Zahl weiterreicht.

---

## Die beiden Fallen zuerst

### Falle 1 — `total_players` ist **nicht** die Teilnehmerzahl

Es ist die **Summe der Decktabelle**: wie viele Spieler mit einem Deck antraten,
das die Tabelle ueberhaupt auffuehrt. Die Anwesenheit auf dem Turnier liegt
darueber, weil nicht jede Liste in der Decktabelle landet (zurueckgezogene
Spieler, nicht eingereichte Listen, Sammelposten).

An der Quelle gemessen (07.09.2026):

| Turnier | Kopf der Quelle | Summe der Decktabelle | `total_players` hier |
|---|---|---|---|
| 0067 Special Event Lima | 499 players | 485 | 485 |
| 0068 Regional Indianapolis | 1974 players | 1970 | 1970 |
| 0069 Special Event Turin | 2033 players | 2032 | 2032 |
| 0070 IC New Orleans | 3752 players | 3743 | 3743 |

Nachgerechnet am ganzen Bestand: `total_players` ist in **allen 71 Turnieren**
exakt `Summe(player_count)`. Und die Quelle rechnet ihre Anteile auf dieselbe
Basis — 749/3743 = 20,01 %, was labs fuer Dragapult auf 0070 anzeigt;
749/3752 waeren 19,96 %.

**Die Zahl ist richtig, der Name ist irrefuehrend. Nicht austauschen.**
`share_pct`, `day1_share_pct` und `day2_share_pct` haengen an ihr; wer
`total_players` durch die Anwesenheit ersetzt, macht aus einer stimmigen
Datei eine, deren Anteile sich nicht mehr auf 100 % summieren.

**Wo die Anwesenheit steht:**

* `data/tournament_cards_data_overview.csv`, Spalte `players` — der Kopf der
  Turnierseite. Fuer 0070 stehen dort 3752.
* `data/player_continuity.csv` — je Spieler eine Zeile.

Ueber alle 69 zugeordneten Turniere gemessen: die Anwesenheit liegt in 66
Faellen ueber der Decksumme (Abstand 1 bis 40 Spieler), in 3 Faellen gleichauf,
**nie** darunter.

### Falle 2 — drei Spalten sind nicht befuellbar

`top8_conv_rate`, `top16_conv_rate` und `top32_conv_rate` sind aus dieser
Quelle **nicht befuellbar**. Sie stehen in **allen 4.713 Zeilen auf `0.0`**,
und das ist **keine gemessene Null**, sondern der Vorgabewert einer Spalte,
die nie gefuellt wird: die Quellansicht `?conversion` fuehrt nur
noch `Day 1`, `Day 2` und `Conversion`, keine Top-Cut-Konversion. Siehe
`_CONV_HEADER_KEYS` in `labs_tournament_scraper.py`.

Die Spalten bleiben im Schema, damit vorhandene Leser nicht brechen. Wer sie
auswertet, bekommt fuer jedes Deck dieselbe Null und damit kein Signal.
`js/app-meta-call.js` weiss das und weicht auf `day2_share_pct / day1_share_pct`
aus.

---

## Das Turnier

* `tournament_id` — vierstellige Labs-Kennung, `0001` bis `0071`. Der
  Schluessel, ueber den `player_continuity.csv` und
  `tournament_decklists_per_player.csv` an dieselbe Zeile anschliessen.
* `tournament_name` — Anzeigename bei labs, z. B. `Regional Championship
  Indianapolis`. 53 verschiedene bei 71 Turnieren: derselbe Ort kommt
  mehrfach vor, der Name allein ist **kein** Schluessel.
* `tournament_date` — ISO `YYYY-MM-DD`. **Ein Tag, kein Zeitraum** — die
  Konvention steht unten in einem eigenen Abschnitt. Leer in 96 Zeilen
  (Turniere 0019 und 0042, fuer die keine Datumsquelle greift).
* `tournament_type` — `regional` (4.479 Zeilen), `special` (106),
  `international` (82), `worlds` (46). Aus dem Turnier-Icon der Uebersicht
  abgeleitet und bei einigen aelteren Eintraegen ungenau: 0009, 0020, 0034,
  0046 und 0054 tragen `regional`, sind dem Namen nach aber International
  Championships. Im Zweifel dem Namen glauben, nicht der Spalte.
* `country` — Laenderkuerzel, leer in 4.178 von 4.713 Zeilen (89 %). Nur fuer
  die neueren Turniere erhoben.
* `total_players` — siehe **Falle 1**.
* `meta` — Formatfenster, z. B. `TEF-CRI`. Leer in denselben 96 Zeilen wie
  `tournament_date`, weil es aus dem Datum abgeleitet wird.
* `scraped_at` — Zeitstempel des Laufs, der die Zeile schrieb.

### Konvention fuer `tournament_date`

Mehrtaegige Turniere bekommen **einen** Tag. Welchen, haengt an der Quelle,
aus der der Wert kommt — und das ist ueberpruefbar am Wochentag:

| Turnierart | eingetragener Tag | gemessen |
|---|---|---|
| Regionals und Special Events | **Samstag** = der Masters-Tag, Tag 2 von Fr–So | 60 von 61 |
| International Championships und Worlds | **Freitag** = Tag 1 | 7 von 7 |

Beispiele, an der Quelle geprueft (07.09.2026):

* 0068 Regional Indianapolis — Quelle: „May 29–31, 2026"; hier: **2026-05-30**
  (Samstag). Das ist die Konvention, keine Abweichung.
* 0070 IC New Orleans — Quelle: „June 12–14, 2026"; hier: **2026-06-12**
  (Freitag).

Warum der Unterschied: der Wert kommt vorrangig aus dem Abgleich mit
`tournament_cards_data_cards_<META>.csv` (den Daten von limitlesstcg.com), und
dort steht fuer US-Regionals der Masters-Tag, fuer ICs der erste Tag. Nur wo
dieser Abgleich nichts findet, greift der Kopf der labs-Seite, aus dem
`_parse_date()` die zweite Haelfte des Zeitraums abschneidet — also Tag 1.

Ein Einzelfall: 0014 Regional Toronto steht auf **2024-12-12**, einem
Donnerstag. So liefert es die Cards-Quelle („12th December 2024"); der Wert ist
uebernommen, nicht gerechnet.

Wo Limitless nachweislich falsch liegt, steht die Korrektur in
`data/labs_tournament_id_overrides.json` — mit Begruendung, und nicht als
stille Handkorrektur in der CSV. Bisher ein Fall: Turnier 518 / 0070.

## Das Deck

* `deck_name` — Anzeigename des Archetyps, z. B. `Dragapult Dusknoir`.
* `deck_slug` — die maschinenlesbare Form, z. B. `dragapult-dusknoir`. **Der
  Schluessel innerhalb eines Turniers**, nicht `deck_name`: 267 verschiedene
  Slugs stehen 266 Namen gegenueber.
* `pokemon` — die namensgebenden Pokemon, kommagetrennt.

## Die Zahlen ueber das ganze Turnier

* `player_count` — Spieler, die mit diesem Deck antraten. Aufsummiert ergibt
  das `total_players`.
* `share_pct` — Anteil in Prozent, `player_count / total_players * 100`,
  gerundet auf zwei Stellen. In allen 4.713 Zeilen nachgerechnet. Je Turnier
  summieren sich die Anteile auf 100 % (± 0,07 Rundung).
* `wins`, `losses`, `ties` — Partien aller Spieler dieses Decks zusammen, nicht
  je Spieler.
* `win_pct` — **KEINE Siegquote.** Die Spalte fuehrt die
  **Matchpunkte-Quote** `(3·S + U) / (3 · Partien)` in Prozent — also das,
  was ueber die Platzierung entscheidet, mit einem Unentschieden als einem
  Punkt statt dreien. Nachgemessen ueber alle 4.713 Zeilen: maximale
  Abweichung 0,005 Punkte. Die Siegquote `S / (S + N + U)` liegt bis zu
  **4,1 Punkte darunter** (Dragapult bei Worlds: 46,12 gegen 42,02).

  Wer beide Zahlen nebeneinanderstellt, misst eine Differenz, die reine
  Einheitenumrechnung ist. Genau das ist am 08.09.2026 passiert: ein
  Gegentest des Kandidatenmodells stellte `win_pct` gegen die
  Online-Siegquote aus `data/online_api_archetypes.csv` (Spalte
  `win_rate`, Konvention `mitUnentschieden`) und meldete eine Verzerrung
  von +1,94 Punkten. Nach Umrechnung auf dieselbe Konvention dreht sie
  sich auf **−1,62** — Vorzeichen und Betrag falsch.

  **Die Regel:** aus `wins`/`losses`/`ties` selbst rechnen und die
  Konvention hinschreiben. `js/win-rate-konvention.js` fuehrt alle drei
  und ist die Referenz. Anders als `online_api_archetypes.csv` hat diese
  Datei **keine** Spalte `win_rate_convention`, die es verraten wuerde.

## Tag 1 und Tag 2

`day1_*` und `day2_*` spiegeln die Spalten oben, getrennt nach Turniertag; die
Werte stammen aus den Reitern `?day=1` und `?day=2`. Erhoben fuer alle 71
Turniere.

* `day1_players`, `day1_share_pct`, `day1_wins`, `day1_losses`, `day1_ties`,
  `day1_win_pct`
* `day2_players`, `day2_share_pct`, `day2_wins`, `day2_losses`, `day2_ties`,
  `day2_win_pct`

`day1_win_pct` und `day2_win_pct` sind ebenfalls **Matchpunkte-Quoten**, nicht
Siegquoten — dieselbe Falle wie oben, eine Ebene tiefer.
* `day1_to_day2_conv` — Anteil der Tag-1-Spieler dieses Decks, die Tag 2
  erreichten, **als Bruch von 0 bis 1** (nicht in Prozent). In 2.009 Zeilen
  groesser als 0; die uebrigen 2.704 gehoeren zu Decks, die es nicht in Tag 2
  schafften.

Das ist die Spaltengruppe, die heute das Signal traegt, das `top8_conv_rate`
tragen sollte.

## Konversion und Platzierungen

* `top8_conv_rate` — **nicht befuellbar** aus dieser Quelle.
* `top16_conv_rate` — **nicht befuellbar** aus dieser Quelle.
* `top32_conv_rate` — **nicht befuellbar** aus dieser Quelle.

  Alle drei: siehe **Falle 2**. Die `0.0` bedeutet „nicht erhebbar", nicht
  „gemessen: keine".
* `top1_count`, `top4_count`, `top8_count` — wie oft dieses Deck Platz 1, die
  Top 4, die Top 8 belegte. Aus `/standings` gezaehlt.

  **Leer heisst hier „nicht erhoben"** — und das ist ehrlich, anders als die
  `0.0` daneben. Gefuellt sind ausschliesslich die Turniere **0062 bis 0071**
  (641 Zeilen); **0001 bis 0061** sind leer (4.072 Zeilen, 86 %), weil der
  Standings-Zaehler erst spaeter dazukam und nicht rueckwirkend nachgetragen
  wurde. Kein Turnier ist halb gefuellt — der Schnitt liegt sauber zwischen
  0061 und 0062.

  Werte groesser 0 gibt es in 10 (`top1_count`), 36 (`top4_count`) und 62
  (`top8_count`) Zeilen. Das ist erwartbar: je Turnier gibt es genau einen
  Sieger.

---

Festgehalten wird das alles von `tests/python/test_labs_felder_beschreibung.py`.
Wer eine Spalte hinzufuegt, umbenennt oder ihre Bedeutung aendert, bekommt dort
einen roten Test — und dieses Blatt gehoert dann mit geaendert.
