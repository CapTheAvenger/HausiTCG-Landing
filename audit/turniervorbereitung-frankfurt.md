# Turniervorbereitung Frankfurt — 26.09.2026, TEF–PBL, Mega Excadrill

Erstellt am 07.09.2026 · Agent SPIELERSICHT · kein Produktionscode geändert
Ziel des Spielers: Day 2, dafür 5–6 Siege an Tag 1 · Philosophie: Konsistenz zuerst

---

## Worauf du dich verlassen kannst

1. **Der Kartenkern steht.** 11 Karten stehen in allen 8 Worlds-Listen, 5 davon mit identischer Anzahl in jeder Liste (`tournament_decklists_per_player.csv`, Turnier 0071, 163 Kartenzeilen, 8 Listen à 60 Karten).
2. **Deine schlechten Paarungen sind gemessen, nicht geraten.** Alakazam Dudunsparce 24,87 % Win % auf 758 Partien, Slowking 37,16 % auf 821, Dragapult Blaziken 38,25 % auf 842 (`limitless_online_decks_matchups.csv`).
3. **Der Anteil des Feldes, der dir gefährlich ist, ist rechenbar:** 27,25 % des 15-Tage-Onlinefeldes fallen in Paarungen unter 45 % Win % (Rechnung in Teil 3).
4. **Das Deck fällt im Online-Feld.** 8,23 % vor dem Fenster → 5,98 % im Fenster, Trend −2,25 Punkte, Rang 2 → 4 (`limitless_online_fenster.csv`, 22.08.–06.09., 10.330 Decks).
5. **Präsenz-Bilanz Worlds:** 32 Antritte, 112–122–20, Win % 46,72, Day 2 8/32 = 25,0 %, 0 Top 8 (`labs_tournament_decks_TEF-PBL.csv`).

## Worauf nicht

1. **Auf die Day-2-Chance aus dem Meta Call.** Für dein Deck liefert die Day-2-Quelle *keine einzige* qualifizierte Paarung (max. 4 Partien, Schwelle 5). Die Zahl steht auf Day-1-Stichproben von 5 bis 52 Partien mit 63,6 % Gewicht — und diese Beimischung **verbessert vier deiner fünf schlechten Paarungen** (Teil 4.2).
2. **Auf Tech-Karten-Begründungen aus Kartentext.** Für **jede** Trainerkarte deines Decks ist das Feld `card_text` in `data/all_cards_database.json` leer — 1.175 von 1.175 Supportern, 992 von 994 Items, 334 von 334 Tools, 270 von 270 Stadien. Es gibt im Projekt keine Textgrundlage für „was die Karte tut".
3. **Auf ein Präsenz-Paarungsbild.** Von 27 Gegnern in `labs_tournament_matchups_TEF-PBL.csv` hat genau **einer** ≥ 30 Partien (Dragapult, n=52). Der Rest ist Rauschen.
4. **Auf „TEF–PBL am 26.09."** Die letzten drei englischen Hauptsets kamen im 56-Tage-Takt; +56 Tage auf PBL ergibt den 11.09., +14 Tage Vorlauf den 25.09. — **einen Tag vor Frankfurt**. Offene Frage, keine Tatsache (Teil 5).
5. **Auf 8 Listen als Aussage über 2.700 Spieler.** 8 Listen sind das, was von 32 Antritten Day 2 erreicht hat und veröffentlicht wurde. Sie beschreiben das obere Viertel, nicht das Feld.

---

## Quellen (Stand, Umfang)

| Datei | Zeilen | Stand (UTC) | Wofür benutzt |
|---|---|---|---|
| `data/tournament_decklists_per_player.csv` | 30.460 | 07.09. 15:22 | Kartenkern, 8 Listen Turnier 0071 |
| `data/current_meta_card_data.csv` | 4.485 | 06.09. 17:11 | zweite Erhebung, Spalte `meta` |
| `data/meta_play_decks_cache.json` | — | 01.09. 09:13 | Rohdecks hinter „Meta Play!" |
| `data/limitless_online_decks.csv` | 137 | 06.09. 17:29 | Online kumulativ, 39.694 Decks |
| `data/limitless_online_fenster.csv` | 138 | 06.09. 17:32 | Online 15 Tage, 10.330 Decks |
| `data/limitless_online_decks_matchups.csv` | 1.717 | 06.09. 17:54 | Paarungen online |
| `data/labs_tournament_decks_TEF-PBL.csv` | 47 | 06.09. 17:54 | Worlds SF, 797 Spieler, 46 Decks |
| `data/labs_tournament_matchups_TEF-PBL.csv` | 1.867 | 06.09. 17:54 | Paarungen Präsenz |
| `data/active_threats.json` | 458 | 06.09. 17:54 | Bedrohungskategorien + Gegenkarten |
| `data/all_cards_database.json` | 20.419 Karten | 06.09. 17:54 | Kartentexte (nur Pokémon belegt) |
| `js/app-meta-call.js` | 14.346 | 07.09. 13:33 | Day-2-Rechnung, Beurteilung |

Ein Hinweis vorweg, der überall gilt: **die Nenner der Anteilsangaben sind nicht identisch.** `limitless_online_decks.csv` gibt für Mega Excadrill 7,29 % bei 3.004 Decks an; 3.004/39.694 (Summe der Spalte `count` derselben Datei) sind 7,57 %. Limitless rechnet also gegen eine größere Grundgesamtheit als die Summe seiner eigenen gelisteten Decks (rechnerisch rund 41.200). `limitless_online_fenster.csv` benutzt 39.694 und kommt deshalb auf 7,57 %. Beide Zahlen sind richtig gerechnet, nur eben nicht dieselbe Frage.

---

# Teil 1 — Der Kartenkern aus den echten Listen

## 1.1 Die acht Listen

Turnier **0071**, „World Championships 2026 – Limitless", 28.08.2026, meta `TEF-PBL`.
Insgesamt 143 Decklisten im Turnier (= die 143 Day-2-Spieler von 797, `labs_tournament_decks_TEF-PBL.csv`, Summe `day2_players`). Davon Mega Excadrill: **8**.

| Platz | Spieler | Bilanz | Kartenzeilen | Kartensumme |
|---|---|---|---|---|
| 37 | Boming Wang | 8–3–1 | 20 | 60 |
| 39 | Emiliano Zapata | 8–3–1 | 18 | 60 |
| 41 | Guilherme Stroschon | 8–3–1 | 21 | 60 |
| 53 | Benjamin Pham | 8–3–1 | 19 | 60 |
| 95 | Rikutaro Itazu | 7–4–1 | 26 | 60 |
| 97 | Gabriel Pino Semedo | 7–4–1 | 21 | 60 |
| 119 | Junsong Hao | 6–4–2 | 18 | 60 |
| 122 | Tim Franklin | 6–4–2 | 20 | 60 |

**Kontrolle bestanden: alle acht Listen summieren auf exakt 60 Karten.**

Aufteilung je Liste (Pokémon / Supporter / Item / Tool / Stadion / Basis-Energie):

| Platz | Pkm | Sup | Item | Tool | Sta | Energie |
|---|---|---|---|---|---|---|
| 37 | 20 | 10 | 12 | 1 | 0 | 17 |
| 39 | 18 | 11 | 12 | 1 | 0 | 18 |
| 41 | 19 | 11 | 11 | 1 | 1 | 17 |
| 53 | 20 | 8 | 11 | 1 | 1 | 19 |
| 95 | 20 | 6 | 16 | 1 | 0 | 17 |
| 97 | 19 | 12 | 12 | 0 | 1 | 16 |
| 119 | 19 | 12 | 11 | 1 | 0 | 17 |
| 122 | 19 | 10 | 13 | 1 | 0 | 17 |

Platz 95 ist der Ausreißer: 6 Supporter statt 10–12, 16 Items statt 11–13, und 7 der 9 Einzelfall-Karten stehen allein in dieser Liste.

## 1.2 Kern (8/8 Listen, identische Anzahl)

| Karte | Set | Nr | Typ | in Listen | Anzahl je Liste | Median |
|---|---|---|---|---|---|---|
| Metang | TEF | 114 | Stufe 1 | 8/8 | 4·8 | 4 |
| Mega Excadrill ex | PBL | 65 | Stufe 1 | 8/8 | 2·8 | 2 |
| Genesect ex | BLK | 67 | Basis | 8/8 | 2·8 | 2 |
| Mega Skarmory ex | POR | 55 | Basis | 8/8 | 1·8 | 1 |

**Beldum** ist die fünfte Karte dieser Gruppe: 4 Stück in allen 8 Listen. Auf Druck-Ebene sind es 7× `TEF 113` und 1× `CRI 59` (Platz 39). Gleiche Karte, anderer Druck.

## 1.3 Fast Kern (8/8, aber Anzahl schwankt)

Reihenfolge: Plätze 37 / 39 / 41 / 53 / 95 / 97 / 119 / 122.

| Karte | Set | Nr | Typ | Anzahl je Liste | Median | Spanne |
|---|---|---|---|---|---|---|
| Metal Energy | MEE | 8 | Basis-Energie | 17,18,17,19,17,16,17,17 | 17 | 16–19 |
| Drilbur | PBL | 46 | Basis | 4,4,4,4,2,3,4,4 | 4 | 2–4 |
| Team Rocket's Petrel | DRI | 176 | Supporter | 4,4,4,4,4,2,4,4 | 4 | 2–4 |
| Buddy-Buddy Poffin | TEF | 144 | Item | 4,4,4,4,1,4,4,4 | 4 | 1–4 |
| Jumbo Ice Cream | PFL | 91 | Item | 4,4,3,3,2,2,4,2 | 3 | 2–4 |
| Metagross | CRI | 61 | Stufe 2 | 1,1,1,1,1,2,1,1 | 1 | 1–2 |

## 1.4 Fast Kern (6–7 von 8)

| Karte | Set | Nr | Typ | Listen | Anzahl je Liste | Median |
|---|---|---|---|---|---|---|
| Beldum (nur Druck TEF 113) | TEF | 113 | Basis | 7/8 | 4,0,4,4,4,4,4,4 | 4 |
| Pokégear 3.0 | SVI | 186 | Item | 6/8 | 2,2,2,0,0,2,2,4 | 2 |
| Kieran | TWM | 154 | Supporter | 6/8 | 1,1,2,0,0,2,2,1 | 1,5 |
| Switch | MEG | 130 | Item | 6/8 | 1,1,1,1,1,0,0,1 | 1 |
| Boss's Orders | MEG | 114 | Supporter | 6/8 | 1,2,1,0,1,2,0,1 | 1 |
| Hero's Cape (ACE SPEC) | TEF | 152 | Tool | 6/8 | 1,1,1,1,0,0,1,1 | 1 |

## 1.5 Umstritten (2–5 von 8)

| Karte | Set | Nr | Typ | Listen | Anzahl je Liste | Median (nur gespielt) |
|---|---|---|---|---|---|---|
| Lillie's Determination | MEG | 119 | Supporter | 5/8 | 4,4,2,0,0,4,4,0 | 4 |
| Brock's Scouting | JTG | 146 | Supporter | 5/8 | 0,0,2,4,0,2,2,4 | 2 |
| Fezandipiti ex | ASC | 142 | Basis | 5/8 | 1,0,0,1,1,1,0,1 | 1 |
| Shaymin | DRI | 10 | Basis | 5/8 | 1,0,1,1,1,0,1,0 | 1 |
| Ultra Ball | MEG | 131 | Item | 5/8 | 1,1,0,1,3,2,0,0 | 1 |
| Tool Scrapper | ASC | 212 | Item | 4/8 | 0,0,1,0,1,0,1,1 | 1 |
| Energy Recycler | DRI | 164 | Item | 3/8 | 0,0,0,0,1,1,0,1 | 1 |
| Team Rocket's Transceiver | DRI | 178 | Item | 2/8 | 0,0,0,2,4,0,0,0 | 3 |
| Gravity Mountain | SSP | 177 | Stadion | 2/8 | 0,0,1,1,0,0,0,0 | 1 |

## 1.6 Einzelfall (1 von 8)

| Karte | Set | Nr | Typ | steht in Liste | Anzahl |
|---|---|---|---|---|---|
| Regigigas | PRE | 86 | Basis | Platz 95 | 1 |
| Meowth ex | POR | 62 | Basis | Platz 95 | 1 |
| Iron Defender | MEG | 118 | Item | Platz 95 | 1 |
| Precious Trolley (ACE SPEC) | SSP | 185 | Item | Platz 95 | 1 |
| Special Red Card | CRI | 82 | Item | Platz 95 | 1 |
| Brave Bangle | WHT | 80 | Tool | Platz 95 | 1 |
| Philippe | CRI | 79 | Supporter | Platz 95 | 1 |
| Unfair Stamp (ACE SPEC) | TWM | 165 | Item | Platz 97 | 1 |
| Jamming Tower | TWM | 153 | Stadion | Platz 97 | 1 |

Sieben der neun Einzelfälle stehen in **einer** Liste (Platz 95, 7–4–1, schlechteste Bilanz der acht zusammen mit 119/122). ACE-SPEC-Regel: die drei ACE-SPEC-Karten schließen einander aus; in den acht Listen ist es 6× Hero's Cape, 1× Precious Trolley (95), 1× Unfair Stamp (97) — **8/8, kein Platz ohne ACE SPEC**.

## 1.7 Zweite Quelle: `current_meta_card_data.csv`

Die Spalte `meta` trägt zwei getrennte Erhebungen mit zwei getrennten Nennern:

| Erhebung | Nenner `total_decks_in_archetype` | Kartenzeilen | Herkunft |
|---|---|---|---|
| **Meta Live** | **20 Decks** | 45 | Limitless-Online-Ladder, Stichprobe von 20 Listen pro Archetyp (53 der 60 Archetypen haben n=20) |
| **Meta Play!** | **10 Decks** | 37 | Präsenz, aus `meta_play_decks_cache.json`; die Datei enthält genau ein Turnier: 0071 |

Sie dürfen **nicht** zusammengezählt werden. Gegenüberstellung (Anteil der Listen mit der Karte):

| Karte | 8 Worlds-Listen | Meta Play! (n=10) | Meta Live (n=20) |
|---|---|---|---|
| Metal Energy | 8/8 (Median 17) | 10/10 (Ø 17,0) | 20/20 (Ø 16,05) |
| Beldum / Metang | 8/8 à 4 | 10/10 à 4,0 | 20/20 à 4,0 |
| Drilbur | 8/8 (Median 4) | 10/10 (Ø 3,5) | 20/20 (Ø 3,45) |
| Team Rocket's Petrel | 8/8 (Median 4) | 10/10 (Ø 3,8) | 20/20 (Ø 3,85) |
| Buddy-Buddy Poffin | 8/8 (Median 4) | 10/10 (Ø 3,4) | 20/20 (Ø 3,10) |
| Mega Excadrill ex | 8/8 à 2 | 10/10 à 2,0 | 20/20 à 2,0 |
| Genesect ex | 8/8 à 2 | 10/10 à 2,0 | 20/20 à 2,0 |
| Metagross | 8/8 (Median 1) | 10/10 (Ø 1,1) | 20/20 (Ø 1,35) |
| Jumbo Ice Cream | 8/8 (Median 3) | 10/10 (Ø 2,8) | 19/20 (Ø 2,68) |
| Mega Skarmory ex | 8/8 à 1 | 9/10 | **10/20 (50 %)** |
| Boss's Orders | 6/8 | 8/10 | **18/20 (90 %)** |
| Kieran | 6/8 | 7/10 | 18/20 (90 %) |
| Pokégear 3.0 | 6/8 | 8/10 | 13/20 (65 %) |
| Switch | 6/8 | 7/10 | **8/20 (40 %)** |
| Hero's Cape | 6/8 | 6/10 | 11/20 (55 %) |
| Lillie's Determination | 5/8 | 5/10 | 16/20 (80 %) |
| Brock's Scouting | 5/8 | 7/10 | **2/20 (10 %)** |
| Fezandipiti ex | 5/8 | 7/10 | 13/20 (65 %) |
| Shaymin | 5/8 | 7/10 | **3/20 (15 %)** |
| Ultra Ball | 5/8 | 5/10 | 18/20 (90 %) |
| Tool Scrapper | 4/8 | 5/10 | **0/20 (fehlt)** |
| Energy Recycler | 3/8 | 4/10 | 16/20 (80 %) |
| Team Rocket's Transceiver | 2/8 | 3/10 | 8/20 (40 %) |
| Special Red Card | 1/8 | 2/10 | **12/20 (60 %)** |
| Air Balloon | **0/8** | 1/10 | **12/20 (60 %)** |
| Team Rocket's Factory | 0/8 | 0/10 | 4/20 (20 %) |
| Community Center | 0/8 | 0/10 | 4/20 (20 %) |

### Wo die Quellen sich widersprechen

1. **Der Nenner „Meta Play! = 10" ist nicht 8.** Für dasselbe Turnier 0071 hält `meta_play_decks_cache.json` **10** Mega-Excadrill-Listen, `tournament_decklists_per_player.csv` nur **8**. Insgesamt: 253 Decks im Cache gegen 143 in der Per-Spieler-Datei. Die 8 sind eine echte Teilmenge der 10 — jede Einschlusszahl der Meta-Play!-Spalte lässt sich als „8er-Zahl + 0/1/2" nachrechnen (geprüft für alle 34 Karten). **Die Per-Spieler-Datei ist für dieses Turnier unvollständig.**
2. **Air Balloon.** In keiner der 8 Listen, aber 12/20 online. Wenn diese Karte online in 60 % der Listen steht und auf Papier in 0 von 8, ist entweder die Online-Stichprobe eine andere Bauweise — oder die 8 sind zu wenige, um „0 von 8" von „selten" zu unterscheiden. **Bei n=8 ist 0/8 mit einer wahren Quote von bis zu 31 % vereinbar (einseitig, 95 %).**
3. **Brock's Scouting und Shaymin drehen die Richtung.** Auf Papier 5/8 bzw. 5/8, online 2/20 bzw. 3/20. **Tool Scrapper** kommt online gar nicht vor (0/20), auf Papier in 4/8. Umgekehrt **Special Red Card**: online 12/20, auf Papier 1/8.
4. **Set-Nummern weichen ab, Karte ist dieselbe.** Meta Play! führt Team Rocket's Petrel als `ASC 207`, die Per-Spieler-Datei als `DRI 176`; Buddy-Buddy Poffin `ASC 184` gegen `TEF 144`; Transceiver `ASC 209` gegen `DRI 178`. Nachdruck, keine andere Karte — aber jeder Vergleich, der auf `set_code|set_number` schlüsselt, verfehlt sie.
5. **Mega Skarmory ex:** 8/8 auf Papier, 9/10 im Cache, aber nur 10/20 online. Der deutlichste Unterschied zwischen Turnier- und Ladderbau im ganzen Deck.

---

# Teil 2 — Die Tech-Entscheidungen

## 2.0 Der Rahmen, in dem diese Entscheidungen hier belegbar sind

**Es gibt im Projekt keinen Kartentext für Trainerkarten.** Geprüft über `data/all_cards_database.json` (20.419 Karten): Feld `card_text` ist leer bei 1.175/1.175 Supportern, 992/994 Items, 334/334 Tools, 270/270 Stadien, 218/218 Basis-Energien, 211/211 Spezial-Energien. Belegt ist der Text nur bei Pokémon (z. B. 9.575/9.694 Basis-Pokémon).

Damit gilt für Teil 2: Bei jeder Trainerkarte kann ich sagen, **wie oft sie gespielt wird** und **in welchen Listen**. Ich kann nicht sagen, was sie tut — nicht aus diesen Daten. Das steht bei jeder Zeile als „keine Daten (Kartentext)".

Die einzige belegte Verbindung zwischen Karte und Bedrohung liefert `data/active_threats.json` (erzeugt von `backend/tools/build_threat_intel.py`). Dort wird `share_in_archetype = deck_inclusion_count / total_decks_in_archetype` aus den **Meta-Live-Zeilen** gerechnet, also aus **20 Listen je Archetyp**. Die Datei nennt außerdem eine kurze Gegenkarten-Liste je Bedrohungskategorie.

## 2.1 Umstritten — Karte für Karte

| Karte | Dafür (belegt) | Dagegen (belegt) | Kartentext-Argument |
|---|---|---|---|
| **Lillie's Determination** (MEG 119) | In 5/8 Listen, dort **immer 4 oder 2** — kein Einzelstück. Online 16/20 (80 %), Ø 3,62. In 3 der 4 besten Listen (37, 39, 41) mit 4 Stück. | 3 Listen spielen sie gar nicht, darunter Platz 53 (8–3–1, gleiche Bilanz wie 37/39/41). Der Erfolg hängt also nicht an ihr. | keine Daten (Kartentext) |
| **Brock's Scouting** (JTG 146) | 5/8 Listen (2,4,2,2,4), Meta Play! 7/10 mit Ø 2,71. Die beiden Listen mit 4 Stück sind Platz 53 und 122. | **Online 2/20 (10 %)** — der schärfste Widerspruch zwischen Papier und Ladder im ganzen Deck. Steht in keiner der drei besten Listen (37, 39, 41). | keine Daten (Kartentext) |
| **Fezandipiti ex** (ASC 142) | 5/8 Listen à 1. Online 13/20 (65 %). Kartentext **belegt**: „if any of your Pokémon were Knocked Out during your opponent's last turn, you may draw 3 cards" — also eine Karte, die auf erlittene Knockouts reagiert. | Belegt ein Bankplatz und ein Deckslot; 3 Listen verzichten, darunter Platz 39 und 41 (beide 8–3–1). | belegt (`all_cards_database.json`, ASC 142) |
| **Shaymin** (DRI 10) | 5/8 Listen à 1. Kartentext **belegt**: „Prevent all damage done to your Benched Pokémon that don't have a Rule Box by attacks from your opponent's Pokémon." `active_threats.json` führt Shaymin **namentlich als Gegenkarte zur Kategorie `bench_damage`** (gewichteter Meta-Anteil 0,1374). | **Online nur 3/20 (15 %).** Und: Deine Bank besteht überwiegend aus Karten **mit** Rule Box (Mega Excadrill ex, Genesect ex, Mega Skarmory ex, Fezandipiti ex) — die schützt Shaymin nach eigenem Text **nicht**. Geschützt sind Beldum/Metang/Metagross/Drilbur. | belegt |
| **Ultra Ball** (MEG 131) | Online 18/20 (90 %), Ø 1,22. Auf Papier 5/8. | Auf Papier sehr uneinheitlich: 1,1,0,1,3,2,0,0 — die 3 steht in der Ausreißerliste 95. Zwei der vier besten Listen (41, und 119/122) spielen 0. | keine Daten (Kartentext) |
| **Tool Scrapper** (ASC 212) | 4/8 Listen à 1, Meta Play! 5/10. | **Online 0/20.** Die Karte existiert im Ladder-Bau dieses Decks nicht. Auf Papier ebenfalls nicht in den Top-Listen 37 und 39. | keine Daten (Kartentext) |
| **Energy Recycler** (DRI 164) | Online 16/20 (80 %). | Auf Papier nur 3/8 — und zwar in den Listen 95, 97, 122, also den **drei schwächsten Bilanzen** der acht (7–4–1, 7–4–1, 6–4–2). Keine der vier 8–3–1-Listen spielt sie. | keine Daten (Kartentext) |
| **Team Rocket's Transceiver** (DRI 178) | Wenn gespielt, dann in Menge: 2 (Platz 53) und 4 (Platz 95). Online 8/20 (40 %) mit Ø 3,25 — ebenfalls nie als Einzelstück. | Nur 2/8 Listen. Die 4er-Version steht in der Ausreißerliste. | keine Daten (Kartentext) |
| **Gravity Mountain** (SSP 177) | 2/8 (Plätze 41 und 53, beide 8–3–1). Online 5/20 (25 %). | Nur 2 von 8; eine der beiden Listen mit Stadion (97) spielt stattdessen Jamming Tower. Ein Stadion, das gegen dein eigenes HP-Profil wirkt, ist aus diesen Daten **nicht** prüfbar — Kartentext fehlt. | keine Daten (Kartentext) |

## 2.2 Einzelfall — Karte für Karte

| Karte | Beleg | Bewertung nach „Konsistenz zuerst" |
|---|---|---|
| **Regigigas** (PRE 86) | 1/8 (Platz 95), Meta Play! 1/10, online 0/20. Kartentext belegt: „Jewel Breaker 100+ · If your opponent's Active Pokémon is a Tera Pokémon, this attack does 230 more damage." | Reine Anti-Tera-Karte. **Wie viel Tera im Feld steht, steht in keiner Datei dieses Projekts** — `active_threats.json` kennt die Kategorie nicht. Ohne diese Zahl ist die Karte unbelegt. |
| **Meowth ex** (POR 62) | 1/8 (Platz 95), 1/10, online 1/20. Kartentext belegt: „when you play this Pokémon from your hand onto your Bench … Search your deck for a Supporter card". | Ein Supporter-Sucher in einer Liste, die nur **6** Supporter spielt (siehe 1.1). Genau eine Liste tut das, und sie ist nicht die beste. |
| **Iron Defender** (MEG 118) | 1/8 (95), 1/10, online 0/20 | keine Daten (Kartentext). Unbelegt. |
| **Precious Trolley** (SSP 185, ACE SPEC) | 1/8 (95), 3/10, online 6/20 (30 %) | keine Daten (Kartentext). Konkurriert direkt mit Hero's Cape (6/8). |
| **Special Red Card** (CRI 82) | 1/8 (95), 2/10, **online 12/20 (60 %)** | keine Daten (Kartentext). Der Widerspruch Papier↔Ladder ist hier am größten nach Air Balloon. |
| **Brave Bangle** (WHT 80) | 1/8 (95), 2/10, online 6/20 (30 %) | keine Daten (Kartentext). |
| **Philippe** (CRI 79) | 1/8 (95), 1/10, online 1/20 | keine Daten (Kartentext). Unbelegt. |
| **Unfair Stamp** (TWM 165, ACE SPEC) | 1/8 (97), 1/10, online 0/20. `active_threats.json` führt Unfair Stamp als **Bedrohungskarte** der Kategorie `hand_disruption` — also als etwas, das *dir* passiert, wenn Gegner es spielen. | keine Daten (Kartentext). Als eigener ACE SPEC verdrängt sie Hero's Cape. |
| **Jamming Tower** (TWM 153) | 1/8 (97), 2/10, online 0/20 | keine Daten (Kartentext). |

## 2.3 Zuordnung: welche Karte gegen welche schlechte Paarung?

Deine fünf schwersten Paarungen und was die Daten dazu hergeben:

| Gegner | Win % (n) | Anteil im Feld (15 T) | Belegte Bedrohung, die dieser Gegner mitbringt | Belegte Gegenkarte im Bestand | Trägt Partiendaten? |
|---|---|---|---|---|---|
| Alakazam Dudunsparce | **24,87 %** (758) | 7,59 % | **keine** der vier Kategorien in `active_threats.json` nennt diesen Archetyp | — | **nein** |
| Slowking | 37,16 % (821) | 5,89 % | `bench_damage`, `share_in_archetype` 0,65 (13 von 20 Listen) | **Shaymin** (DRI 10) — in `active_threats.json` als Gegenkarte zu `bench_damage` geführt | **nein** — die Zuordnung ist Kategorie-Logik, keine Partienmessung. Es gibt keine Zeile „Excadrill mit Shaymin vs. Slowking". |
| Dragapult Blaziken | 38,25 % (842) | 5,07 % | `hand_disruption` 1,0 (20/20) **und** `ability_lock` 0,35 (7/20) | Gegen `hand_disruption` nennt die Datei Atticus / Drasna / Lacey — **keine davon** steht in einer der 8 Listen. Gegen `ability_lock` nennt sie **nichts**. | **nein** |
| Mega Lucario | 34,54 % (307) | 2,41 % | `hand_disruption` 0,40 (8/20) | dito — keine der genannten Gegenkarten im Bestand | **nein** |
| Rocket's Honchkrow | 33,94 % (166) | 1,05 % | `hand_disruption` 1,0 (18/18) | dito | **nein** |

**Klartext: für keine einzige deiner fünf schlechten Paarungen gibt es in diesen Daten eine Karte, deren Wirkung gegen genau diese Paarung gemessen wäre.** Was es gibt: (a) eine gemessene Häufigkeit, mit der der Gegner eine Bedrohungskategorie mitbringt (Nenner 18–20 Listen), und (b) eine namentliche Gegenkarten-Liste je Kategorie. Die Verbindung dazwischen ist eine Ableitung, keine Messung.

Zwei weitere belegte Zuordnungen, außerhalb deiner fünf:

- **`ability_lock`** (gewichteter Meta-Anteil 0,1130) trifft dich strukturell, weil **Genesect ex** (8/8, 2 Stück) eine Fähigkeit ist. Träger: Toxtricity Box 0,90 · Dragapult Dusknoir 0,80 · Dragapult 0,35 · Dragapult Blaziken 0,35 · N's Zoroark 0,30. Von diesen sind Dragapult Dusknoir (56,98 %, n=805) und N's Zoroark (56,39 %, n=685) deine **guten** Paarungen — die Kategorie erklärt deine schlechten also gerade nicht.
- **`retreat_lock`** (0,2061): **Switch** (6/8) und **Kieran** (6/8) stehen in der Gegenkarten-Liste (dort mit den Drucken `PFL 123` bzw. `PRE 113` — gleiche Namen, andere Drucke als deine `MEG 130`/`TWM 154`). Träger unter deinen Gegnern: Mega Chandelure 0,50 (35,92 %, n=142). Die großen `retreat_lock`-Träger — Dragapult Dusknoir 1,0, N's Zoroark 0,85, Grimmsnarl Froslass 0,85 — sind allesamt Paarungen, die du **gewinnst**.

## 2.4 Was daraus folgt, wenn „Konsistenz zuerst" gilt

Unbelegt heißt hier nicht „schlecht" — es heißt: diese Daten rechtfertigen sie nicht.

- **Belegt konsistent, bleibt drin:** die 11 Karten aus 1.2/1.3 plus die 6 aus 1.4. Das sind bereits 17 Karteneinträge; über die vier 8–3–1-Listen gerechnet decken sie 50–54 der 60 Slots ab.
- **Belegt umstritten, mit erkennbarer Richtung:** Energy Recycler steht ausschließlich in den drei schwächsten Listen (0/4 der 8–3–1-Listen, 3/4 der schwächeren) — das ist ein schwaches, aber gerichtetes Signal gegen sie. Brock's Scouting und Tool Scrapper stehen ebenfalls in keiner der beiden besten Listen, tauchen online aber praktisch nicht auf (2/20 bzw. 0/20).
- **Unbelegt:** alle neun Einzelfälle. Sieben davon stammen aus einer einzigen Liste mit 7–4–1.
- **Nicht entscheidbar aus diesen Daten:** jede Frage der Form „hilft Karte X gegen Alakazam Dudunsparce?". **NICHT GEPRÜFT** — es gibt keine kartenaufgelöste Paarungsstatistik im Projekt.

---

# Teil 3 — Das Feld in Frankfurt

## 3.1 Welche Grundgesamtheit — und warum

**Ich benutze `limitless_online_fenster.csv` (22.08.–06.09.2026, 15 Tage, 10.330 Decks) als Leitbild** und stelle die beiden anderen daneben.

Begründung, in dieser Reihenfolge:

1. **Aktualität.** Das Fenster liegt zwischen Worlds (28.08.) und heute; Frankfurt ist 20 Tage nach Fensterende. Die kumulative Datei mischt das gesamte Format seit Beginn (39.694 Decks) — darin steckt auch die Vor-Worlds-Phase.
2. **Das Präsenzbild ist ein *eingeladenes* Feld.** Worlds San Francisco hatte 797 Spieler, alle qualifiziert. Frankfurt hat rund 2.700 Spieler ohne Einladungsschranke. Die Anteile dort sind nachweislich anders geformt: Dragapult 22,33 % gegen 9,49 % online, Basic Box 9,28 % gegen 2,38 %.
3. **Größe der Stichprobe.** 10.330 Decks im Fenster gegen 797 Spieler auf Papier.
4. **Der Preis dafür**, und er ist real: online ≠ Papier. Die Ladder belohnt anderes als ein 9-Runden-Turniertag. Das ist unten in Teil 4 als Verzerrung benannt, nicht wegdiskutiert.

## 3.2 Die drei Bilder nebeneinander — nicht gemittelt

| Deck | Fenster % (15 T) | Kumulativ % | Worlds % | Trend Fenster (Punkte) | dein Win % online (n) |
|---|---|---|---|---|---|
| Dragapult | 9,49 | 7,62 | **22,33** | +0,77 | 52,33 (1.088) |
| Alakazam Dudunsparce | 7,59 | 5,82 | 6,78 | **+1,92** | **24,87 (758)** |
| Dragapult Dusknoir | 6,54 | 5,60 | 10,41 | +1,31 | 56,98 (805) |
| **Mega Excadrill** | **5,98** | 7,29 | 4,02 | **−2,25** | 50,00 (1.032, Spiegel) |
| Slowking | 5,89 | 5,49 | 5,90 | −0,62 | **37,16 (821)** |
| N's Zoroark | 5,57 | 5,21 | 7,53 | +0,51 | 56,39 (685) |
| Dragapult Blaziken | 5,07 | 5,70 | 9,79 | −1,19 | **38,25 (842)** |
| Festival Lead | 4,05 | 5,81 | 2,89 | **−2,14** | 54,33 (852) |
| Dhelmise | 3,82 | 3,95 | 1,00 | +0,43 | 56,32 (576) |
| Grimmsnarl Froslass | 2,96 | 4,11 | 0,88 | **−1,97** | 58,82 (564) |
| Raging Bolt Ogerpon | 2,81 | 2,18 | 3,14 | −0,17 | 47,56 (330) |
| Mega Lucario | 2,41 | 2,03 | 0,75 | −0,60 | **34,54 (307)** |
| Basic Box | 2,38 | 1,71 | **9,28** | +0,56 | 50,43 (230) |
| Lucario Hariyama | 2,03 | 1,78 | 0,38 | +0,16 | 42,81 (286) |
| Lopunny Dusknoir | 1,93 | 0,70 | 0,38 | **+1,32** | keine Quote |
| Crustle | 1,61 | 0,96 | 2,51 | +0,85 | keine Quote |
| Ogerpon Meganium Hydrapple | 1,50 | 1,38 | 1,51 | +0,30 | 39,38 (194) |
| Cynthia's Garchomp | 1,41 | 1,23 | 0,50 | +0,25 | 47,59 (146) |
| Rocket's Mewtwo | 1,39 | 0,90 | — | +0,80 | keine Quote |
| Mega Greninja | 1,16 | 1,55 | — | −0,30 | 66,29 (179) |
| Rocket's Honchkrow | 1,05 | 1,29 | — | −0,15 | **33,94 (166)** |
| Mega Chandelure | 0,94 | — | — | — | **35,92 (142)** |

**Was steigt:** Alakazam Dudunsparce (+1,92) — dein schlechtestes Matchup. Lopunny Dusknoir (+1,32, kumulativ Rang 32 → Fenster Rang 15). Dragapult Dusknoir (+1,31). Crustle (+0,85). Rocket's Mewtwo (+0,80). Dragapult (+0,77).
**Was fällt:** Mega Excadrill (−2,25, Rang 2 → 4). Festival Lead (−2,14). Grimmsnarl Froslass (−1,97) — dein bestes Matchup unter den großen Decks. Dragapult Blaziken (−1,19).

**Die Bewegung ist für dich in Summe ungünstig:** dein schlechtester Gegner wächst am stärksten, dein bester großer Gegner schrumpft am zweitstärksten.

**Was das Präsenzbild anders sagt:** Dragapult 22,33 % statt 9,49 % (Faktor 2,4) und Basic Box 9,28 % statt 2,38 % (Faktor 3,9). Beides sind für dich neutrale bis leicht positive Paarungen (52,33 % / 50,43 %). Umgekehrt sind Dhelmise, Grimmsnarl Froslass, Mega Lucario und Lucario Hariyama auf Papier deutlich seltener als online. **Wenn Frankfurt sich wie ein Papierfeld verhält, verschiebt sich dein Feld eher zu neutralen Paarungen** — das ist eine Richtung, keine Zahl, weil das einzige Papierfeld ein eingeladenes 797er-Feld ist.

## 3.3 Die Rechnung: welcher Anteil des Feldes ist gefährlich?

Grundlage: `limitless_online_fenster.csv`, Spalte `share_fenster` × Win % aus `limitless_online_decks_matchups.csv` (Zeilen mit `deck_name = Mega Excadrill`, 20 Gegner, 10.361 Partien).

**Schlechte Paarungen (Win % < 45):**

| Gegner | Win % | Partien | Anteil Fenster | Beitrag (Anteil × Win %) |
|---|---|---|---|---|
| Alakazam Dudunsparce | 24,87 | 758 | 7,59 % | 1,888 |
| Rocket's Honchkrow | 33,94 | 166 | 1,05 % | 0,356 |
| Mega Lucario | 34,54 | 307 | 2,41 % | 0,832 |
| Mega Chandelure | 35,92 | 142 | 0,94 % | 0,338 |
| Slowking | 37,16 | 821 | 5,89 % | 2,189 |
| Toucannon | 38,03 | 358 | 0,77 % | 0,293 |
| Dragapult Blaziken | 38,25 | 842 | 5,07 % | 1,939 |
| Ogerpon Meganium Hydrapple | 39,38 | 194 | 1,50 % | 0,591 |
| Lucario Hariyama | 42,81 | 286 | 2,03 % | 0,869 |
| **Summe** | | **3.874** | **27,25 %** | **9,295** |

**Anteil des erwarteten Feldes in schlechten Paarungen: 27,25 %.**
Gewichtete Win % innerhalb dieses Blocks: 9,295 / 27,25 = **34,11 %**.
Bei 2.700 Spielern entspricht das rund **736 Gegnern**; bei 9 Runden Tag 1 im Erwartungswert **2,45 Runden** gegen diesen Block (bei 8 Runden: 2,18).

**Verschärft man auf Win % < 40:** 25,22 % des Feldes.
**Gute Paarungen (Win % > 55):** 20,05 % des Feldes (Dragapult Dusknoir, N's Zoroark, Dhelmise, Grimmsnarl Froslass, Mega Greninja).

**Erwartungswert über den messbaren Teil:**
73,42 % des Fensterfeldes haben überhaupt eine gemessene Online-Quote. Die anteilsgewichtete Win % über genau diesen Teil ist **46,56 %**.
Zum Vergleich: die gemessene Präsenz-Win-% bei Worlds war **46,72 %** (112–122–20). Die beiden Zahlen liegen 0,16 Punkte auseinander — das ist ein Zufallstreffer über zwei völlig verschiedene Grundgesamtheiten, und die beiden Zahlen sind zudem **nicht nach derselben Formel gebildet** (siehe 4.5: die Paarungsdatei rechnet S/(S+N), die Präsenzdatei Matchpunkte). **Kein Beleg** dafür, dass das Modell stimmt.

**Der blinde Fleck:** 100,06 − 73,42 = **26,64 Prozentpunkte des Feldes haben keine gemessene Paarung**. Die größten davon: Lopunny Dusknoir 1,93 %, Crustle 1,61 %, Rocket's Mewtwo 1,39 %, Lopunny Dudunsparce 1,19 %, Starmie Froslass 0,89 %, Ogerpon Meganium Arboliva 0,89 %, Sharpedo Toxtricity 0,88 %, Beedrill 0,88 %. **Für jeden vierten Gegner in Frankfurt existiert keine Zahl.** NICHT GEPRÜFT.

Dieselbe Rechnung mit den beiden anderen Grundgesamtheiten, zur Kontrolle:

| Grundgesamtheit | abgedeckt | Anteil < 45 % | Anteil < 40 % | Anteil > 55 % |
|---|---|---|---|---|
| Fenster 15 Tage | 73,42 % | **27,25 %** | 25,22 % | 20,05 % |
| Kumulativ | 73,27 % | 27,06 % | 25,28 % | 20,37 % |
| Worlds (Papier, eingeladen) | 87,85 % | 25,74 % | 25,36 % | 19,95 % |

Die drei Bilder streiten sich hier **nicht**: der gefährliche Feldanteil liegt in allen drei zwischen 25,7 % und 27,3 %. Das ist das robusteste Ergebnis dieses Dokuments.

## 3.4 Glättung — bewegt deine Online-Zahlen nicht, deine Präsenzzahlen stark

`js/matchup-glaettung.js` glättet Paarungsquoten mit einem Beta-Binomial-Prior k=20 (10 Pseudo-Siege, 10 Pseudo-Niederlagen). Nachgerechnet für alle 20 deiner **Online**-Paarungen: die größte Verschiebung ist **+1,74 Punkte** (Rocket's Honchkrow, n=166), die kleinste 0,00. Alakazam Dudunsparce geht von 24,87 auf 25,52. **Deine Online-Paarungsdaten sind dick genug, dass Glättung sie nicht bewegt** — jede hat ≥ 142 Partien.

Genau das ist der Kontrast zu den Präsenzdaten: dieselbe Glättung verschiebt die Worlds-Zahl für Alakazam Dudunsparce (2–17–1) von 10,53 auf **30,77** — um 20 Punkte. Siehe Teil 4.2.

---

# Teil 4 — Der ehrliche Befund zu Day 2

## 4.1 Worauf die Zahl beruht

`js/app-meta-call.js`:

- **`buildField()`** (Zeile 8610). Nimmt `_shareList` (Online-Anteile, nach dem Predictor als `predictedShare` überschrieben), normiert auf 100, behält die **Top 25** (`TOP_N = 25`, Zeile 1047) und wirft alles darunter in einen Sammelposten `_junk`. Persönliche Schätzungen und eigene Decks werden gegen `_junk` verrechnet. Feldgröße kommt aus `_settings.totalPlayers`.
- **`getBaseMatchup(deckA, deckB)`** (Zeile 8301). Mischt bis zu drei Quellen: Day 2 (Gewicht 0,45), Day 1 (0,35), Online (0,20) — Konstanten Zeile 81–83. Mindeststichproben: Day 2 ≥ 5, Day 1 ≥ 5, Overall ≥ 10 (Zeile 94–96). Fehlt eine Quelle, werden die übrigen Gewichte auf 1 hochnormiert. Danach schiebt „Predictor 5.3" eine deckweite Korrektur `(adjA − adjB)/100` auf `pWin`, wobei `adj` = Win % beim letzten Major minus kumulative Online-Win % ist.
- **`calcDay2(field, deckOverride)`** (Zeile 8799). Markow-Kette über Matchpunkte: `rounds` Runden, in jeder Runde wird der Gegner **unabhängig nach Feldanteil gezogen**, drei Ausgänge (3/1/0 Punkte). Am Ende Summe der Wahrscheinlichkeitsmasse ab `day2Points`. Voreinstellungen: 8 Runden, 16 Punkte (Zeile 988–990; Voreinstellung „worlds" 800/8/16, „international" 3000/8/16, Zeile 1005–1007).
- **Unentschieden.** Seit dem 06.09. wird jede Paarung vor der Kette auf die **gemessene Präsenz-Unentschieden-Quote** umgestellt, unter Beibehaltung des Sieg-zu-Niederlage-Verhältnisses. Ich habe die Quote nachgerechnet: `labs_tournament_matchups_TEF-PBL.csv`, `day_filter='overall'`, 811 Zeilen: 2.754 S / 2.754 N / 684 U = **11,05 % über 6.192 Partienergebnisse**. Der Quellkommentar (Zeile ~7566) nennt 10,95 % über 6.121 Partien — die Datei ist seither neu gezogen worden. Differenz 0,10 Punkte, ohne Belang, aber es ist eine Abweichung zwischen Code-Kommentar und Datei.

## 4.2 Was die Zahl für **dein** Deck wert ist

**Befund 1: die Day-2-Quelle, die mit 0,45 das höchste Gewicht trägt, feuert für Mega Excadrill in diesem Format kein einziges Mal.**

`labs_tournament_matchups_TEF-PBL.csv`, `my_deck_name = Mega Excadrill`, `day_filter = day2`: 14 Gegner, zusammen **30 Partien**, größte Einzelpaarung **n=4** (Dragapult, Alakazam Dudunsparce). Die Schwelle ist 5. **Keine Paarung erreicht sie.**

Damit reduziert sich die Mischung für dein Deck auf Day 1 (0,35) + Online (0,20), hochnormiert auf **63,64 % / 36,36 %**.

**Befund 2: bevor die Day-1-Zahl in die Mischung geht, wird sie geglättet — und bei 5 bis 27 Partien verschiebt das sie um 10 bis 30 Punkte.**

`_collapseAgg` (Zeile 7694) rechnet aus der Bilanz `vs_wins/vs_losses` die Quote S/(S+N) und glättet sie mit demselben Beta-Binomial-Prior k=20 wie die Heatmap (`js/matchup-glaettung.js`, `K = 20`, Zeile 56). Die Spalte `vs_win_pct` der CSV wird dabei **nicht** benutzt, solange eine Bilanz vorliegt — das ist richtig so, denn `vs_win_pct` ist eine Matchpunktquote, keine Siegquote (siehe 4.5).

Nachgerechnet, alle 13 Paarungen, die die Day-1-Schwelle von 5 Partien erreichen:

| Gegner | Day-1-Bilanz | roh S/(S+N) | geglättet k=20 | Online geglättet (n) | Mischung → Quote |
|---|---|---|---|---|---|
| Dragapult | 21–23–8 | 47,73 | 48,44 | 52,29 (1.088) | 50,24 |
| Dragapult Dusknoir | 16–11–0 | 59,26 | 55,32 | 56,81 (805) | 56,30 |
| N's Zoroark | 19–7–1 | 73,08 | **63,04** | 56,21 (685) | **60,79** |
| Basic Box | 9–13–2 | 40,91 | 45,24 | 50,40 (230) | 47,11 |
| Alakazam Dudunsparce | 2–17–1 | **10,53** | **30,77** | 25,52 (758) | **29,02** |
| Dragapult Blaziken | 4–10–1 | 28,57 | 41,18 | 38,52 (842) | 40,46 |
| Raging Bolt Ogerpon | 6–7–0 | 46,15 | 48,48 | 47,70 (330) | 48,39 |
| Slowking | 2–8–1 | **20,00** | **40,00** | 37,47 (821) | **39,43** |
| Crustle | 8–1–0 | 88,89 | 62,07 | **keine Messung** | 58,86 |
| Mega Excadrill (Spiegel)¹ | 7–7–0 | 50,00 | 50,00 | 50,00 (1.032) | 50,25 |
| Mega Lucario | 2–4–0 | 33,33 | **46,15** | 35,49 (307) | **42,57** |
| Festival Lead | 3–1–1 | 75,00 | 54,17 | 54,23 (852) | 54,56 |
| Rocket's Mewtwo | 4–0–1 | 100,00 | 58,33 | **keine Messung** | 56,43 |

¹ Die Spiegelzeile erreicht die Kette nie: `calcDay2` ersetzt sie durch den fest verdrahteten Wert 0,45/0,10/0,45 (Zeile 8840 und 8858) — siehe 4.3, Punkt 2.

Die Glättung tut hier genau, wofür sie gebaut wurde: aus 2–17–1 wird nicht 10,5 %, sondern 30,8 %. **Nur zieht sie damit die dünne Präsenzzahl weit näher an 50 % heran als die dicke Online-Zahl — und die dünne bekommt anschließend 63,6 % des Gewichts.**

**Befund 3: netto macht die Beimischung deine schlechten Paarungen besser.**

Gegenüberstellung derselben Paarungen mit und ohne Day-1-Beimischung, über das 15-Tage-Feld gewichtet:

| Gegner | Anteil Fenster | nur Online | mit Day-1-Blend | Differenz |
|---|---|---|---|---|
| Dragapult | 9,49 % | 52,29 | 50,24 | **−2,05** |
| **Alakazam Dudunsparce** | 7,59 % | 25,52 | 29,02 | **+3,50** |
| Dragapult Dusknoir | 6,54 % | 56,81 | 56,30 | −0,51 |
| Mega Excadrill | 5,98 % | 50,00 | 50,25 | +0,25 |
| **Slowking** | 5,89 % | 37,47 | 39,43 | **+1,96** |
| N's Zoroark | 5,57 % | 56,21 | 60,79 | +4,59 |
| **Dragapult Blaziken** | 5,07 % | 38,52 | 40,46 | **+1,94** |
| Festival Lead | 4,05 % | 54,23 | 54,56 | +0,33 |
| Raging Bolt Ogerpon | 2,81 % | 47,70 | 48,39 | +0,69 |
| **Mega Lucario** | 2,41 % | 35,49 | 42,57 | **+7,07** |
| Basic Box | 2,38 % | 50,40 | 47,11 | −3,29 |

**Vier deiner fünf schlechten Paarungen werden durch die Beimischung besser, keine schlechter.** Über den abgedeckten Teil des Fensters (73,42 %) steigt die feldgewichtete Quote von **46,71 % auf 47,59 %**, also **+0,88 Punkte**. In einer Kette über 8 bis 9 Runden ist das kein Rundungsrest.

Das ist keine Manipulation und kein Fehler im Code — es ist die zwangsläufige Folge davon, dass ein Prior, der auf 50 % zieht, auf eine 20-Partien-Stichprobe trifft und diese dann zwei Drittel des Gewichts bekommt. Die Gewichtung ist im Quellcode ausdrücklich als Urteil deklariert, nicht als Statistik: *„a quality-weighted judgment — not a games-weighted one"* (Zeile 76–80). Das ist ehrlich dokumentiert. Für **dein** Deck heißt es: die Day-2-Chance des Meta Call ist gegenüber der bestgemessenen Datenlage **systematisch freundlich**.

**Befund 4: zwei Paarungen mischen einen Platzhalter mit ein.**
Crustle (Day 1: 9 Partien) und Rocket's Mewtwo (5 Partien) haben online **keine** Zeile. Der Code setzt in diesem Fall trotzdem einen Online-Anteil ein — den Platzhalter `pWin = 0,50` (Zeile 8368). Bei Crustle liegen damit 36,4 % des Gewichts auf einer Nicht-Messung. Crustle steht im Fenster bei 1,61 % und **steigt** (+0,85).

## 4.3 Weitere Einschränkungen, die die Zahl betreffen

1. **Keine Swiss-Paarung.** `calcDay2` zieht in jeder Runde unabhängig aus dem Feld. Ein echtes Turnier paart nach Punktestand — nach 4 Siegen triffst du nicht mehr das Durchschnittsfeld. Die Kette bildet das nicht ab. **NICHT GEPRÜFT**, wie groß der Fehler ist; das Projekt hat dazu keine Messung.
2. **Der Spiegel ist gesetzt, nicht gemessen.** Zeile 8840 und 8858: `{ pWin: 0.45, pTie: 0.10, pLoss: 0.45 }` — fest verdrahtet. Gemessen sind online **50,00 % über 1.032 Partien** und auf Papier 7 Paarungen. Der Spiegel ist bei 5,98 % Feldanteil dein vierthäufigster Gegner.
3. **8 Runden / 16 Punkte als Voreinstellung.** Bei Worlds SF wurden im Mittel **7,05 Partien je Spieler an Tag 1** gespielt (5.622 Partienergebnisse / 797 Spieler, `labs_tournament_decks_TEF-PBL.csv`, Spalten `day1_wins/losses/ties`). **Wie viele Runden Frankfurt bei ~2.700 Spielern spielt, steht in keiner Datei dieses Projekts — NICHT GEPRÜFT.** Die Zahl ist der empfindlichste Eingabewert der ganzen Kette; setze sie selbst, sobald der Veranstalter sie nennt.
4. **`_junk`.** Alles unterhalb Platz 25 der Anteilsliste wird zu einem Klumpen mit einer Sammelquote. Nach 3.3 sind das genau die Decks, für die ohnehin keine Paarung existiert.
5. **Die Lücke, die der Code selbst benennt.** Zeile 7570 f.: Die Umstellung auf die Präsenz-Unentschieden-Quote hebt eine Beispielrechnung von 12,9 % auf 14,0 % — **und die bei Worlds gemessene Konversion von 25,0 % bleibt damit unerklärt.** Das steht so im Quelltext und ist nicht wegdiskutiert.

## 4.4 Was 8 Listen und 32 Antritte über 2.700 Spieler aussagen

**Trägt eine Aussage:**

- **Der Kartenkern.** Wenn 8 von 8 unabhängig gebauten Turnierlisten dieselben 11 Karten führen und 4 davon in identischer Anzahl, ist das eine belastbare Aussage über die Bauweise des Decks. Diese Aussage hängt nicht an der Feldgröße.
- **Die Bilanz 112–122–20 über 254 Partienergebnisse.** 112 Siege gegen 122 Niederlagen; das 95-%-Intervall der Siegquote liegt bei rund ±6,4 Punkten um 47,9 %. Das reicht, um zu sagen: das Deck lag bei Worlds **nicht** über 50 % — mehr nicht, aber das ist die Aussage, die zählt.
- **Der Day-1/Day-2-Bruch.** Tag 1: 94–110–18 = 45,05 %. Tag 2: 18–12–2 = 58,33 %. Die acht, die durchkamen, spielten danach gut — und landeten trotzdem **0-mal in den Top 8**, beste Platzierung 37.

**Trägt keine Aussage:**

- **Jede Paarungsquote aus dem Präsenzturnier.** 27 Gegner, 246 Partien, genau einer mit ≥ 30. „Alakazam Dudunsparce 11,67 %" steht auf 2–17–1. Ein einziger anderer Ausgang bewegt die Zahl um 5 Punkte.
- **Die Day-2-Konversion 25,0 %.** 8 von 32. Das 95-%-Intervall reicht von etwa 11 % bis 43 %. Als Zielgröße für Frankfurt unbrauchbar.
- **„0 Top 8" als Deckurteil.** Bei 32 Antritten und einem Erwartungswert von 32/797 × 8 = 0,32 Top-8-Plätzen ist null das wahrscheinlichste Einzelergebnis, auch für ein völlig durchschnittliches Deck. **Diese Null ist kein Befund.**
- **Jede Übertragung des Worlds-Feldes auf Frankfurt.** 797 eingeladene gegen ~2.700 offene Spieler.

**Ein Datenfehler, der beim Nachrechnen aufgefallen ist:** In `labs_tournament_matchups_TEF-PBL.csv` sind die Zeilen mit `day_filter='overall'` **byte-identisch mit denen für `day1`** — für alle 811 Zeilen, nicht nur für Mega Excadrill. „Overall" summiert 2.754–2.754–684; Day 2 steuert zusätzlich 266–266–54 bei, die dort nicht enthalten sind. Praktische Folge für dich: gering, weil `getBaseMatchup` „overall" nur als Rückfall benutzt, wenn weder Day 1 noch Day 2 greift. Aber die Spalte heißt, was sie nicht ist. Für die Kopfzeile derselben Datei steht `my_deck_total_wins = 112`, während die Summe der overall-Zeilen 111 ergibt (Spiegelrundung).

## 4.5 „Win %" heißt in drei Dateien drei verschiedene Dinge

Beim Nachrechnen der Kette ist aufgefallen, dass die Spalte, die überall „Win %" heißt, nach drei verschiedenen Formeln gebildet wird. Geprüft über alle Zeilen der jeweiligen Datei:

| Datei | Spalte | Formel | Treffer |
|---|---|---|---|
| `limitless_online_decks.csv` | `win_rate` | **S / (S+N+U)** | 135 von 136 Zeilen |
| `limitless_online_decks_matchups.csv` | `win_rate` | **S / (S+N)** | 1.716 von 1.716 |
| `labs_tournament_decks_TEF-PBL.csv` | `win_pct` | **Matchpunkte (3S+U) / 3(S+N+U)** | 46 von 46 |
| `labs_tournament_matchups_TEF-PBL.csv` | `vs_win_pct` | **Matchpunkte** | 1.866 von 1.866 |

Beispiel an deinem Deck: kumulativ online 6732–6978–117 → 6732/13827 = **48,69 %** (so steht es in der Datei). Dieselbe Bilanz als S/(S+N) wäre 49,10 %, als Matchpunkte 48,97 %. Worlds 112–122–20 → Matchpunkte 356/762 = **46,72 %** (so steht es in der Datei); als S/(S+N) wären es 47,86 %.

**Praktische Folgen:**
- Der Vergleich „online 48,69 % gegen Papier 46,72 %" — auf dem der Predictor-5.3-Aufschlag beruht — vergleicht zwei verschiedene Größen. Die Differenz von −1,97 Punkten enthält einen Definitionsanteil.
- Für die Kette selbst ist es entschärft: `_collapseAgg` rechnet aus der Bilanz neu und benutzt `vs_win_pct` nur, wenn keine Bilanz vorliegt.
- **Für dich beim Lesen der CSVs:** Zahlen aus zwei dieser Dateien sind nicht ohne Umrechnung vergleichbar. In diesem Dokument ist deshalb bei jeder Zahl die Datei genannt.

---

# Teil 5 — Was bis zum 26.09. noch passiert

Heute ist der 07.09.2026. Bis Frankfurt sind es **19 Tage**.

## 5.1 Der Datenlauf

`.github/workflows/weekly-full-update.yml`, Zeile 31: `cron: '0 6 * * 2,5'` — **Dienstag und Freitag, 06:00 UTC**.
`.github/workflows/per-decklist-scrape.yml`, Zeile 48: `cron: '0 12 * * 2'` — zusätzlich Dienstag 12:00 UTC.

Verbleibende Läufe: **Di 08.09., Fr 11.09., Di 15.09., Fr 18.09., Di 22.09., Fr 25.09.** = 6 volle Läufe, davon 3 mit zusätzlichem Einzellisten-Durchgang.
Letzter erfolgreicher Lauf laut `data/_job_heartbeats.json`: **06.09.2026, 16:38 UTC** (labs, per-decklist, player-continuity, alle „OK").

## 5.2 Was dazukommen kann — und was nicht

| Datei | Kommt dazu? | Woran du es merkst |
|---|---|---|
| `limitless_online_decks.csv` (kumulativ) | **Ja, jeder Lauf.** Aktuell 39.694 Decks. | Summe der Spalte `count` steigt. |
| `limitless_online_fenster.csv` | **Ja.** Das Fenster schiebt sich mit; am 25.09. deckt es rund den 10.–25.09. ab. | Kopfzeile Zeile 1 nennt „Fenster VON bis BIS" und die Deckzahl. Wenn dort noch „2026-08-22 bis 2026-09-06" steht, ist der Lauf nicht durchgekommen. |
| `limitless_online_decks_matchups.csv` | **Ja.** Aktuell 10.361 Partien für dein Deck. | `total_games` je Gegner steigt; neue Gegner erscheinen (heute 20). |
| `current_meta_card_data.csv`, `meta = Meta Live` | **Ja**, aber der Nenner bleibt bei **20 Decks je Archetyp** — die Stichprobe wird neu gezogen, nicht größer. | `total_decks_in_archetype` bleibt 20. Eine wachsende Zahl wäre die Ausnahme, nicht die Regel. |
| `labs_tournament_decks_TEF-PBL.csv` / `..._matchups_...` | **Nur wenn ein neues Präsenzturnier stattfindet und veröffentlicht wird.** Ob zwischen dem 07. und 26.09. eines im Format TEF–PBL liegt, steht in keiner Datei dieses Projekts — `data/labs_tournaments.json` endet bei Turnier 0071 (28.08.). **NICHT GEPRÜFT.** | Neue `tournament_id` (0072+) in `labs_tournaments.json`; `tournament_count` in der Matchup-Datei springt von 1 auf 2. |
| `tournament_decklists_per_player.csv` | **Nur bei neuem Präsenzturnier.** Heute: 1 Turnier im Format, 143 Listen, davon 8 Mega Excadrill. | Neue `tournament_id` in Spalte 1. |
| `current_meta_card_data.csv`, `meta = Meta Play!` | **Nur bei neuem Präsenzturnier.** Der Nenner 10 wächst dann. `data/current_meta_scraped_tournaments.json` steht auf `["0071"]`, Stand 01.09. | `total_decks_in_archetype` steigt über 10. |
| **Online-Einzellisten** (`.github/workflows/online-decklists.yml`) | **Nein, nicht automatisch.** Der Ablauf hat **keinen `schedule`-Block**; der Kopfkommentar sagt ausdrücklich: „Erst ein gruener Lauf von Hand, dann ein Zeitplan." | Passiert nur, wenn jemand ihn von Hand startet. |

**Der Kern davon: dein Präsenzbild bleibt mit hoher Wahrscheinlichkeit bei 32 Antritten und 8 Listen stehen. Dein Online-Bild wird bis zum 25.09. um rund zwei weitere Fensterlängen wachsen.** Anders gesagt: die Zahlen, die sich noch bewegen, sind genau die, deren Übertragbarkeit auf Papier ungeklärt ist — und die, die du für Frankfurt am liebsten hättest, bewegen sich nicht.

**Ein Hebel, der in deiner Hand liegt:** Der Kopfkommentar von `online-decklists.yml` beziffert, was ein manueller Lauf brächte — „253 von 253" Einzellisten bei einem einzigen Online-Turnier, gegen 143 im gesamten Präsenzbestand des Formats. Ein von Hand gestarteter grüner Lauf würde deine Listenbasis mehr als verdoppeln. Ob er aus GitHub Actions durchkommt, ist ungetestet.

## 5.3 Offene Frage: Ist TEF–PBL am 26.09. noch das legale Format?

**Das kann ich nicht klären. Hier ist die Rechnung, nicht die Antwort.**

`data/format_window.json`: `current_set: "PBL"`, `oldest_legal_set: "TEF"`, `set_release_date: "2026-07-17"`, `lag_days: 14`, `in_person_legal_date: "2026-07-31"`.

`data/sets_metadata.json`, englische Hauptsets (Set-Codes, die in `data/pokemon_sets_mapping.csv` mit englischem Namen stehen):

| Set | Erscheinung | Abstand zum Vorgänger |
|---|---|---|
| PFL | 2025-11-14 | — |
| ASC | 2026-01-30 | 77 Tage |
| POR | 2026-03-27 | 56 Tage |
| CRI | 2026-05-22 | 56 Tage |
| PBL | 2026-07-17 | 56 Tage |

Drei Abstände in Folge à 56 Tage. Fortgeschrieben:

```
2026-07-17  + 56 Tage  =  2026-09-11   (hypothetisches nächstes Hauptset)
2026-09-11  + 14 Tage  =  2026-09-25   (in_person_legal_date nach lag_days)
Turnier                =  2026-09-26   →  einen Tag danach
```

**Ergebnis: Wenn der 56-Tage-Takt hält und der 14-Tage-Vorlauf gilt, wäre TEF–PBL am 26.09. nicht mehr das Format — um einen Tag.**

Warum das eine **offene Frage** bleibt und keine Tatsache:

- In `sets_metadata.json` steht **kein** englisches Hauptset mit Datum nach dem 17.07.2026. Die 2026-07-31-Einträge (M6, MEM, MEZ) sind nicht in `pokemon_sets_mapping.csv` mit englischem Namen geführt; M6 ist laut Kommentar in `format_window.json` japanisch.
- Der Takt ist nicht konstant: der Abstand davor war 77 Tage.
- `in_person_legal_date` steht in `format_window.json` fest auf **2026-07-31** und wird laut `_note` beim nächsten Set automatisch fortgeschrieben. Solange dort noch der 31.07. steht, kennt das Projekt kein neues Set.
- Limitless ist aus dieser Umgebung gesperrt; ich kann den echten Kalender nicht abfragen.

**Was du tun solltest:** Den echten Erscheinungstermin des nächsten Sets außerhalb dieses Projekts nachsehen. Falls er auf dem 11.09. liegt, ändert sich für Frankfurt alles — dann sind die 8 Listen, die Paarungen und die Feldprognose in diesem Dokument die Beschreibung eines Formats, das am Turniertag nicht mehr gilt. Innerhalb des Projekts merkst du es daran, dass `format_window.json` nach einem Dienstags- oder Freitagslauf ein anderes `current_set` als `PBL` trägt.

---

## Anhang: Alle 20 gemessenen Paarungen

`data/limitless_online_decks_matchups.csv`, `deck_name = Mega Excadrill`, 20 Gegner, 10.361 Partien. „Geglättet" = Beta-Binomial k=20 nach `js/matchup-glaettung.js`.

| Gegner | Win % | Bilanz | Partien | geglättet | Anteil Fenster |
|---|---|---|---|---|---|
| Alakazam Dudunsparce | 24,87 | 187–565–6 | 758 | 25,52 | 7,59 % |
| Rocket's Honchkrow | 33,94 | 56–109–1 | 166 | 35,68 | 1,05 % |
| Mega Lucario | 34,54 | 105–199–3 | 307 | 35,49 | 2,41 % |
| Mega Chandelure | 35,92 | 51–91–0 | 142 | 37,65 | 0,94 % |
| Slowking | 37,16 | 301–509–11 | 821 | 37,47 | 5,89 % |
| Toucannon | 38,03 | 135–220–3 | 358 | 38,67 | 0,77 % |
| Dragapult Blaziken | 38,25 | 319–515–8 | 842 | 38,52 | 5,07 % |
| Ogerpon Meganium Hydrapple | 39,38 | 76–117–1 | 194 | 40,38 | 1,50 % |
| Lucario Hariyama | 42,81 | 122–163–1 | 286 | 43,28 | 2,03 % |
| Raging Bolt Ogerpon | 47,56 | 156–172–2 | 330 | 47,70 | 2,81 % |
| Cynthia's Garchomp | 47,59 | 69–76–1 | 146 | 47,88 | 1,41 % |
| Mega Excadrill (Spiegel) | 50,00 | 512–512–8 | 1.032 | 50,00 | 5,98 % |
| Basic Box | 50,43 | 116–114–0 | 230 | 50,40 | 2,38 % |
| Dragapult | 52,33 | 562–512–14 | 1.088 | 52,29 | 9,49 % |
| Festival Lead | 54,33 | 458–385–9 | 852 | 54,23 | 4,05 % |
| Dhelmise | 56,32 | 321–249–6 | 576 | 56,10 | 3,82 % |
| N's Zoroark | 56,39 | 384–297–4 | 685 | 56,21 | 5,57 % |
| Dragapult Dusknoir | 56,98 | 453–342–10 | 805 | 56,81 | 6,54 % |
| Grimmsnarl Froslass | 58,82 | 330–231–3 | 564 | 58,52 | 2,96 % |
| Mega Greninja | 66,29 | 118–60–1 | 179 | 64,65 | 1,16 % |
