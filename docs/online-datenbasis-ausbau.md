# Online-Datenbasis: Prüfung und Ausbau

**Stand 08.09.2026.** Diese Datei beantwortet die acht Punkte, die der
Betreiber am 08.09.2026 zur Bedingung gemacht hat, bevor eine
Einschränkung auf Kartenebene dokumentiert werden darf. Jede Zahl darin
ist live gemessen, nicht geschätzt; wo etwas nicht messbar war, steht
**NICHT GEPRÜFT**.

Anlass war meine Aussage, die Punkte 4 und 7 der „Meta Transition"
(Kartenlisten-Entwicklung, Prognose auf Kartenebene) seien „nicht
baubar". Der Betreiber hat das zurückgewiesen. **Die Zurückweisung war
berechtigt.** Die Prüfung hat nicht nur einen Weg gefunden, sondern einen
besseren als den, den ich vorher für den einzigen hielt.

---

## Der entscheidende Befund: es gibt eine offizielle API

`play.limitlesstcg.com/api`, dokumentiert unter
<https://docs.limitlesstcg.com/developer>. **Kein Schlüssel nötig** für
alles, was wir brauchen (nur `/games/decks` verlangt einen). Vier
Endpunkte:

| Endpunkt | liefert |
| --- | --- |
| `/tournaments` | Liste mit `id`, `name`, `date`, `format`, `players` |
| `/tournaments/{id}/details` | Phasen, Rundenzahl, `isOnline`, `decklists` |
| `/tournaments/{id}/standings` | **jeden** Spieler mit `deck` und vollständiger Deckliste |
| `/tournaments/{id}/pairings` | **jedes** Match mit Sieger |

Dazu ein **Webhook-System für beendete Turniere**.

### Gegengeprüft am Turnier „Pumpkaweekly" (`6a9db100ab080c8c957fc12b`)

| geprüft | Ergebnis |
| --- | --- |
| Vollständigkeit | **342 von 342** Spielern mit `deck` **und** `decklist` |
| Kartenschlüssel | `{count, set, number, name}` – z. B. `{4, "TEF", "114", "Metang"}` |
| Kartenschnitte, selbst gerechnet | Pokémon 19,31 · Trainer 24,69 · Energie 16,00 · Metang 3,77 · Petrel 3,62 · Drilbur 3,23 · Metall-Energie 15,92 |
| dieselben Werte auf der Limitless-Seite | 19,30 · 24,68 · 16,00 · 3,77 · 3,62 · 3,23 · 15,92 |
| Bilanz Mega Excadrill aus `/pairings` | **32 – 40 – 0** |
| dieselbe Bilanz aus den `record`-Feldern | **32 – 40 – 0** |
| dieselbe Bilanz auf der Limitless-Metagame-Seite | **32 – 40 – 0** |

Drei unabhängige Wege, ein Ergebnis. Damit ist belegt: **eine einzige
Anfrage je Turnier reproduziert die komplette Kartenstatistik für alle
62 Archetypen** – die Limitless-Oberfläche bräuchte dafür 62 Aufrufe.

### Was dabei über die Matchregeln herauskam

Diese drei Regeln stehen in keiner Dokumentation und waren nur durch
Nachrechnen zu finden:

* `winner == 0` → Unentschieden für beide.
* `winner == -1` → **Doppelniederlage**, Niederlage für *beide*.
* `player2` leer → Freilos oder Zeitstrafe; zählt in die Bilanz, aber
  **nicht** in die Matchup-Matrix.

Ohne die letzten beiden kam bei Mega Excadrill 32–33–0 heraus statt
32–40–0 (fünf Doppelniederlagen, zwei Partien ohne Gegner). Genau diese
sieben Partien sind der Unterschied zwischen einer Quote von 49,2 % und
einer von 44,4 %.

---

## Die acht Punkte

### 1. Bestehenden Scraper analysieren

Heute im Bestand:

| Datei | Ebene | Zustand |
| --- | --- | --- |
| `online_tournament_scraper.py` | Turnier + Platzierung | läuft (Mi/Fr), liest gerendertes HTML |
| `limitless_online_scraper.py` | Ladder-Anteile | läuft |
| `limitless_online_decklist_scraper.py` | Einzellisten | **noch nie gelaufen** – 0 Zeilen mit `quelle=online` |
| `per_decklist_scraper.py` | Papier-Einzellisten | läuft |

**Die drei tieferen Ebenen – Feld-Metagame, Matchups, Kartenschnitte –
werden heute überhaupt nicht geholt.** `online_tournament_dated_cards.csv`
sieht wie eine Kartenebene aus, ist aber eine gedeckelte Stichprobe
(`max_lists_per_deck: 20`, Median 3 Archetypen je Turnier) und **kein**
Feldschnitt. Wer daraus einen Kartenschnitt liest, liest den Schnitt der
erfolgreichen Listen und nennt ihn den Schnitt des Decks.

### 2. Nicht nur die besten Listen sammeln

Erledigt und geprüft: `/standings` liefert das **ganze** Feld, samt
Spielern, die nach Runde 4 ausgestiegen sind (`drop: 4`) und Spielern
ohne Platzierung (`placing: null`). Die Oberfläche darf weiter nur die
erfolgreichen Listen zeigen – die Datenbasis darunter ist ab jetzt
vollständig. Genau das war die Forderung.

### 3. Einzelne Turnierseiten als zusätzliche Quelle

Nicht mehr nötig, und das ist die bessere Nachricht: die API ersetzt sie
vollständig. Der HTML-Weg über
`/tournament/<id>/metagame/<slug>/cards` hätte je Archetyp einen Aufruf
gekostet – **806 bis 3.250 Anfragen pro Woche**. Über `/standings` sind
es **zwei je Turnier**.

### 4. Scraping-Frequenz

Gemessen am 08.09.2026 über `/tournaments`:

| | Turniere | Spieler |
| --- | ---: | ---: |
| letzte 7 Tage, alle Formate | 86 | 5.622 |
| davon ≥ 100 Spieler | **26** | **4.457 (79 %)** |
| davon ≥ 32 Spieler | 36 | 4.926 |

Zwischen 64 und 100 Spielern liegt kein einziges Turnier – die Schwelle
ist in diesem Bereich also unkritisch. 26 Turniere × 2 Anfragen + 2
Listenabrufe = **54 Anfragen pro Woche**. Täglich zu laufen kostet
dasselbe, verteilt es nur besser: rund 8 Anfragen pro Tag.

### 5. Inkrementelle Logik

Ein abgeschlossenes Limitless-Turnier ändert sich nicht mehr. Deshalb:

* `data/online_api_tournaments.csv` ist das Gedächtnis – eine Zeile je
  geholtem Turnier.
* `neue_turniere()` vergleicht die API-Liste dagegen und liefert nur,
  was fehlt. **Bekanntes Turnier → übersprungen, ausnahmslos.**
* Zusätzlich filtert dieselbe Funktion auf Format, Mindestspielerzahl
  und Startdatum, bevor überhaupt eine Detailanfrage rausgeht.
* **Selbstheilung:** je Turnier werden vier Dateien geschrieben, der
  Index zuletzt. Bricht der Lauf dazwischen ab, stehen Karten- oder
  Matchupzeilen ohne Turniereintrag da; der nächste Lauf holt das
  Turnier erneut und hinge dieselben Zeilen ein zweites Mal an. Das wäre
  nicht auffällig falsch, sondern **still doppelt gewichtet** – der
  gefährlichere Fehler. `_raeume_auf()` entfernt solche Waisen, bevor
  etwas Neues geschrieben wird.

Der Webhook für beendete Turniere ist der nächste Schritt; er macht auch
das Listenabfragen überflüssig. **NICHT GEPRÜFT** – er verlangt einen
öffentlich erreichbaren Endpunkt, den dieses Projekt heute nicht hat.

### 6. Datenbasis für die spätere Deck-Optimierung

Vier neue Dateien, drei Ebenen:

| Datei | Ebene | Schlüssel |
| --- | --- | --- |
| `online_api_tournaments.csv` | Gedächtnis | `tournament_id` |
| `online_api_archetypes.csv` | Archetyp | + `archetype_id` |
| `online_api_cards.csv` | **Karte** | + `group`, `set`, `number` |
| `online_api_matchups.csv` | **Matchup** | + `opponent_id` |

Zwei Entscheidungen darin, die den Unterschied machen:

* **Jede Anteilszahl trägt ihren Nenner.** `share` steht nie allein,
  sondern immer neben `lists` und `lists_total`. Das ist die Antwort auf
  Befund A auf der Datenebene.
* **`avg_count` und `inclusion_rate` stehen nebeneinander.** Petrel
  steckt in einer von zwei Mega-Excadrill-Listen, mit zwei Kopien:
  Schnitt 1,0, Aufnahmequote 0,5. Wer nur durch die Listen *mit* der
  Karte teilte, bekäme 2,0 und behauptete damit ein Standardteil, das
  keines ist. Genau dieser Unterschied ist es, der „2 → 3 Kopien" von
  „das halbe Feld hat es aufgenommen" trennt.

Der Sammeleimer `other` liefert **keine** Kartenzeilen und **keine**
Matchupzeilen: er ist kein Deck, sondern zwanzig verschiedene.

### 7. Bestehende Pipeline nicht vorschnell verändern

Kein bestehender Scraper wurde angefasst, keine bestehende Datei
geändert. Der neue Lauf schreibt ausschließlich in vier **neue**
Dateien. Die Wächter (`data_guardian.py`, `sanity_check_data.py`,
`build_data_stand.py`) bekommen ihre Einträge erst, **nachdem** der
erste CI-Lauf echte Zeilenzahlen geliefert hat – eine Schwelle gegen
eine Datei, die es noch nicht gibt, ist ein garantiert roter Deploy.

### 8. Endziel

Die drei Ebenen des Deck Builders, die der Betreiber für Punkt 8
verlangt hat, sind ab jetzt aus Daten belegbar statt geschätzt:

* **historisch** – das letzte Präsenzturnier als Ausgangspunkt;
* **Entwicklung** – jedes Online-Turnier seither ist ein eigener
  Zeitpunkt, mit Anteil, Bilanz, Kartenschnitten und Matchups;
* **Prognose** – aus der Reihe dieser Zeitpunkte, nicht aus zwei
  Momentaufnahmen.

---

## Was der Slug-Normalisierer angeht

Ich hatte einen gebraucht und dafür gehalten, dass er gebaut werden
muss. **Er wird nicht gebaut, er ist überflüssig** – und das war nur
durch Messen zu sehen.

Gegen die 62 Archetypen des Testturniers:

| Weg zum Namen | Treffer |
| --- | ---: |
| über den Slug (`slug_to_archetype` + `normalize_archetype_name`) | **26 / 62** |
| über den von der API mitgelieferten `deck.name` | **61 / 62** |

Der 62. ist „Other" – bewusst kein Archetyp.

Beispiele für das Scheitern des Slug-Wegs:

| Slug | Slug-Weg ergibt | richtig ist |
| --- | --- | --- |
| `dragapult-ex` | Dragapult Ex | Dragapult |
| `n-zoroark` | Zoroark | N's Zoroark |
| `basic-box-m` | Basic Box M | Basic Box |
| `mega-manectric-ex-meg` | Mega Manectric Ex Meg | Mega Manectric |
| `seaking-pre` | Seaking Pre | Seaking Festival Lead |

`n-zoroark` ist der teuerste Fall: `normalize_archetype_name`
(`card_scraper_shared.py:466`) streift ein führendes „N " ab und macht
daraus „Zoroark". **Beide Namen existieren getrennt in
`archetype_icons.json`** – das ist keine Normalisierung, das ist eine
stille Verschmelzung zweier Decks. „Basic Box M" wiederum existiert dort
gar nicht, „Basic Box" schon.

Deshalb liest der neue Scraper **ausschließlich `deck.name`**, und
`tests/python/test_limitless_api_scraper.py` hält das mit einer eigenen
Zusicherung fest.

---

## Prüfstand

* `tests/python/test_limitless_api_scraper.py` – 15 Zusicherungen an
  einem von Hand gerechneten Feld, das alle vier teuren Sonderfälle
  enthält (Doppelniederlage, Partie ohne Gegner, Spieler ohne
  Deckzuordnung, Sammeleimer). **10 von 10 Mutationssonden gefangen.**
* `.github/workflows/limitless-api-scrape.yml` – fährt vor **jedem**
  Schreiblauf die Gegenprobe gegen die oben abgelesenen Live-Werte. Ändert
  Limitless seine Semantik, bricht der Lauf ab, statt falsche Bilanzen in
  vier Dateien zu schreiben.

**Warum die Live-Probe in CI liegen muss:** `play.limitlesstcg.com` ist
weder aus dem Bausandkasten (Egress-Proxy, 403) noch vom Rechner des
Betreibers aus erreichbar. Der Rechenteil des Scrapers ist deshalb
netzfrei gebaut und vollständig ohne Netz prüfbar.

**NICHT GEPRÜFT:** ob der GitHub-Läufer bei `play.limitlesstcg.com`
durchkommt. Der Sandkasten kann es nicht messen. Deshalb hat der Ablauf
vorerst **keinen Zeitplan** – erst ein grüner Lauf von Hand, dann ein
cron. Dieselbe Regel wie bei `online-decklists.yml`.

**NICHT GEPRÜFT:** die Rate-Limit-Header. Aus dem Browser sind sie wegen
CORS nicht lesbar. Der Scraper wertet `x-ratelimit-remaining` und
`Retry-After` serverseitig aus und bremst von selbst, statt in ein 429 zu
laufen – ob die Header wirklich so heißen, zeigt der erste CI-Lauf.
