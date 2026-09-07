# Datenflusskarte — von der Quelle bis zur Zahl auf dem Schirm

**Stand der Erhebung:** 2026-09-07 · **Grundlage:** `main` = `5ec1e742`

**Regel dieser Datei.** Jede Formel ist im Quelltext nachgelesen und mit
`Datei:Zeile` belegt. Jede Stichprobengröße ist mit `python3`/`csv` an der
echten Datei unter `data/` gemessen, nicht aus einem Kommentar abgeschrieben.
Wo eine Formel nicht auffindbar war, steht das ausdrücklich als
*nicht gefunden — <Datei:Zeile> geprüft* statt einer Vermutung.

---

## Inhalt

1. [Die Zulieferer: Quelle → Scraper → Ablauf → Ablage](#1-die-zulieferer)
2. [Zeitpläne und letzter Lauf](#2-zeitplaene)
3. [Kennzahl **Win %**](#3-win-)
4. [Kennzahl **Meta-Anteil**](#4-meta-anteil)
5. [Kennzahl **Max Consistency**](#5-max-consistency)
6. [Kennzahl **Tech-Cut-Empfehlungen**](#6-tech-cut)
7. [**Archetyp-Erkennung** (inkl. Mega Excadrill)](#7-archetyp-erkennung)
8. [Weitere Kennzahlen: Platzierungen, Preise, Kartentrends, Stichprobe, Datenstand](#8-weitere)
9. [Verwaiste Daten](#9-verwaiste-daten)
10. [Leere Rechnungen](#10-leere-rechnungen)
11. [Zwei Wege zur selben Zahl](#11-zwei-wege)

---

<a id="1-die-zulieferer"></a>
## 1. Die Zulieferer: Quelle → Scraper → Ablauf → Ablage

| Originalquelle (Adresse) | Scraper (Datei:Funktion) | Ablauf | Ablage unter `data/` | Zeilen (gemessen 07.09.) |
|---|---|---|---|---|
| `play.limitlesstcg.com/decks` (Tabelle „N tournaments, M players, K matches") | `backend/scrapers/limitless_online_scraper.py:100 scrape_deck_statistics` | `weekly-full-update.yml:267` | `limitless_online_decks.csv`, `limitless_online_decks_comparison.csv`, `limitless_meta_stats.json` | 136 Decks; Kopf 569 Turniere / 41.193 Spieler / 93.297 Matches |
| `play.limitlesstcg.com/decks/<deck>/matchups/` | derselbe (`:720` schreibt `_matchups.csv`) | dito | `limitless_online_decks_matchups.csv` | 1.716 Paarungen |
| `labs.limitlesstcg.com/decks/` + `/standings` | `backend/scrapers/labs_tournament_scraper.py` (`:1981` Decks, `:1937` Matchups, `:738` Turnierliste) | `weekly-full-update.yml:387` (`--matchups --matchup-days overall day1 day2`) | `labs_tournament_decks.csv`, `labs_tournament_matchups.csv`, je Format `…_<META>.csv`, `labs_tournaments.json` | 4.713 Deck-Zeilen; 47.986 Matchup-Zeilen |
| `limitlesstcg.com/tournaments/<id>` + `/decks/list/<id>` | `backend/scrapers/per_decklist_scraper.py:600 scrape_tournament` (Titel aus `.decklist-title`, `:245`) | `weekly-full-update.yml:462` und `per-decklist-scrape.yml` (Di 12:00 UTC) | `tournament_decklists_per_player.csv` | 30.459 Zeilen · 3 Turniere · 53 Archetypen |
| `labs.limitlesstcg.com` (Spieler-Historie) | `backend/scrapers/player_continuity_scraper.py:63` | `weekly-full-update.yml:432`, `player-continuity-scrape.yml` (nur Hand) | `player_continuity.csv` | 2,2 MB |
| `play.limitlesstcg.com` (Turnier-Standings, Top-8) | `backend/scrapers/online_tournament_scraper.py:361 _tournament_weight`, `:461` Quoten | `weekly-full-update.yml:267` | `online_tournament_top8_decks.csv`, `online_tournament_winners.csv` | 121 Decks / 97 Sieger |
| `play.limitlesstcg.com/decks` **und** `labs.limitlesstcg.com` (Kartenlisten je Archetyp) | `backend/scrapers/current_meta_analysis_scraper.py` (`:245`, `:931`, `:942`) | `weekly-full-update.yml:267` | `current_meta_card_data.csv`, `online_tournament_dated_cards.csv`, `online_best_decklists.json` | 4.484 / 28.756 Kartenzeilen |
| `limitlesstcg.com/tournaments` (City League JP, laufend) | `backend/scrapers/city_league_analysis_scraper.py:106` / `city_league_archetype_scraper.py:97` | `weekly-full-update.yml:267` | `city_league_analysis.csv`, `city_league_archetypes*.csv` | **0 Datenzeilen** (nur Kopf) → §10 |
| dieselbe Quelle, Vorformat | `city_league_past_analysis_scraper.py:118` / `city_league_past_archetype_scraper.py:100` | dito | `city_league_analysis_past.csv`, `city_league_archetypes_past*.csv` | 315 / 26 Zeilen, **ein** Turnier (568) |
| `limitlesstcg.com/cards` (EN) | `backend/scrapers/all_cards_scraper.py:707` | `weekly-full-update.yml:267` | `all_cards_database.csv/.json` | 9,9 MB |
| `limitlesstcg.com/cards/jp` | `backend/scrapers/japanese_cards_scraper.py:85` | dito | `japanese_cards_database.csv` | 103 KB |
| `limitlesstcg.com/cards/<set>/<nr>` (Kartentext) | `pokemon_card_text_scraper.py:64`, `pokemon_card_effects_scraper.py:82` | dito | `pokemon_card_text.json`, `pokemon_card_effects.json` | 0,6 / 12 MB |
| `downloads.s3.cardmarket.com/productCatalog/…` (`products_singles_6.json`, `products_nonsingles_6.json`, `price_guide_6.json`) | `daily-price-refresh.yml:124–126` (curl) → `cardmarket_id_mapper.py:581` → `cardmarket_price_merger.py` | `daily-price-refresh.yml` (täglich 08:00 UTC) | `cardmarket_id_mapping.csv`, `price_data.csv` | 20.419 Preiszeilen |
| `cardmarket.com` Produktseiten (Live-Prüfung) | `scripts/verify_cardmarket_mapping.py` | `verify-cardmarket-mapping.yml` (Mi 04:20 UTC) | `cardmarket_mapping_verified.csv` | 970 KB |
| `play.pokemon.com` CloudFront (Prize-Pack-Galerie) | `scripts/build_prizepack_official_images.py` | `prizepack-official-images.yml` (So 07:45 UTC) | `prizepack_official_images.csv/.json` | 58 KB |
| `r2.limitlesstcg.net/pokemon/gen9/` + `play.limitlesstcg.com/decks` | `backend/scrapers/archetype_icons_scraper.py:58` | `weekly-full-update.yml:267` + `:358` Nachprüfung | `archetype_icons.json` | **542 Archetypen** |
| `championsbattledata.com` | `scripts/scrape_champions_usage.py` | `champions-usage-refresh.yml` (tgl. 05:00 UTC), `champions-replica-scrape.yml` (tgl. 04:00 UTC) | `champions_usage.json` | 954 KB |
| `docs.google.com/spreadsheets/…` + `pokepast.es` | `backend/scrapers/champions_replica_scraper.py:170` | `champions-replica-scrape.yml` | `champions_replica_teams.json`, `champions_speed_corpus.json` | 285 / 113 KB |
| `raw.githubusercontent.com/otterlyclueless/pokemon-champions-data`, `raw.githubusercontent.com/PokeAPI/pokeapi` | `scripts/build_champions_pokedex.py`, `scripts/build_champions_resources.py` | `champions-replica-scrape.yml` | `champions_pokedex.json`, `champions_resources.json`, `champions_*_reference.json` | 300 / 496 KB |
| `serebii.net/pokemonchampions/items.shtml` | `scripts/scrape_champions_items.py` | dito | `champions_available_items.json` | 3,7 KB |
| `pokebase.app/pokemon-champions/pokemon` | `scripts/scrape_champions_roster.py` | dito | `champions_roster_extra.json`, `pokemon_battle_data.json` | 2,4 KB |
| `pokewiki.de/api.php`, `pokemonexperte.de/items/` | `scripts/scrape_de_names.py` | dito | `champions_names_de.json`, `de_name_overrides.json` | 119 / 44 KB |
| `game8.co/games/Pokemon-TCG-Pocket/archives/477754` | `scripts/scrape_pocket_tierlist.py:87` | `pocket-tierlist.yml` — **nur `workflow_dispatch`, kein Zeitplan** | `pocket_tierlist.json` | 59 KB |
| `pokemonproxies.com` | `backend/scrapers/scrape_pokemonproxies_urls.py:91` / `scripts/scrape_pokemonproxies.py` | `weekly-full-update.yml:267` bzw. `champions-replica-scrape.yml` | `pokemonproxies_url_map.json`, `pokemonproxies_index.json` | 6,7 / 3,7 KB |
| **keine** — Spielregeln, von Hand gepflegt | — | — | `champions_type_chart.json`, `deck_families.json`, `archetype_aliases.json`, `card_capability_*.json`, `labs_tournament_id_overrides.json`, `cardmarket_mapping_manual.csv` | s. §10 |

**Zusammenführungen ohne eigene Quelle** (rechnen nur aus dem Obigen):

| Skript | liest | schreibt | Ablauf |
|---|---|---|---|
| `backend/core/prepare_card_data.py:801–911` | `all_cards_database`, `price_data.csv`, City-League-Dateien | `all_cards_merged.csv/.json`, `cards_chunk_{standard,extended,legacy}.json`, `cards_manifest.json` | `weekly-full-update`, `daily-price-refresh` |
| `backend/tools/build_threat_intel.py:341 build()` | `pokemon_card_effects.json`, `current_meta_card_data.csv`, `limitless_online_decks.csv`, `format_window.json`, `sets.json` | `active_threats.json` | `weekly-full-update.yml:274` |
| `scripts/build_online_fenster.py:145 baue()` | `data/online_share_history/*.csv` (68 Stände) | `limitless_online_fenster.csv`, `limitless_online_fenster_meta.json` | `weekly-full-update.yml:383` |
| `scripts/build_deckempfehlung.py:178 bewerte()` | `labs_tournament_decks.csv` | `deckempfehlung.json` | `weekly-full-update.yml:717` |
| `scripts/build_data_stand.py` | Git-Verlauf | `data_stand.json` | `weekly-full-update.yml:720` |
| `scripts/data_guardian.py` | fast alles unter `data/` | `_guardian_baseline.json`, `_job_heartbeats.json`, GitHub-Issue | `data-guardian.yml` |
| `scripts/datenluecken.py` | Champions-Dateien | `datenluecken.json` | **kein Ablauf** → §9 |

---

<a id="2-zeitplaene"></a>
## 2. Zeitpläne und letzter Lauf

Alle Zeiten UTC. `data/_job_heartbeats.json` führt nur die *nicht blockierenden*
Einzelschritte, nicht die Abläufe selbst.

| Ablauf | Zeitplan (`cron`) | Schreibt vor allem | Herzschlag / Dateistand |
|---|---|---|---|
| `weekly-full-update.yml` | `0 6 * * 2,5` — Di + Fr 06:00 | 20 Scraper + Labs + per-Decklist + Nachrechnungen | `labs_tournament_scraper.py` OK **2026-09-06 16:38 UTC**; `per_decklist_scraper.py` OK 2026-09-06 16:38; `player_continuity_scraper.py` OK 2026-09-06 16:38 |
| `daily-price-refresh.yml` | `0 8 * * *` | `price_data.csv`, `cardmarket_id_mapping.csv` | `price_data.csv` mtime **2026-09-07 09:08** |
| `champions-replica-scrape.yml` | `0 4 * * *` | Champions-Bestand | 5 Herzschläge OK **2026-09-07 04:05 UTC** |
| `champions-usage-refresh.yml` | `0 5 * * *` | `champions_usage.json` | `scrape_champions_usage.py` OK 2026-09-07 04:05 |
| `data-guardian.yml` | `30 9 * * *` | Baseline + Herzschläge + Befund-Issue | `_job_heartbeats.json` mtime 2026-09-07 09:08 |
| `per-decklist-scrape.yml` | `0 12 * * 2` — Di 12:00 | `tournament_decklists_per_player.csv` | s. o. |
| `verify-cardmarket-mapping.yml` | `20 4 * * 3` — Mi | `cardmarket_mapping_verified.csv` | mtime 2026-09-02 06:19 |
| `cardmarket-card-images.yml` | `30 7 * * 0` — So | `cardmarket_card_images.csv`, `cm_expansions.csv` | mtime 2026-09-06 09:06 |
| `prizepack-official-images.yml` | `45 7 * * 0` — So | `prizepack_official_images.csv` | CSV mtime **2026-08-17** (JSON 2026-09-07) |
| `bot-keepalive.yml` | `*/5 * * * *` | nichts unter `data/` | — |
| `deploy-pages.yml` | `push` auf `main` + Hand | Test → Build → Pages | — |
| `data-consistency.yml`, `sprachreinheit.yml`, `visual-nonmeta.yml` | `push`/`pull_request` | nichts unter `data/` | — |
| **ohne Zeitplan** (nur `workflow_dispatch`): `pocket-tierlist`, `ace-spec-reparatur`, `champions-sprites`, `pokepricelab-index`, `pokepricelab-verify`, `probe-cardmarket-expansions`, `probe-pokepricelab`, `tutorial-screenshots`, `visual-fullpage`, `player-continuity-scrape` | — | — | `pocket_tierlist.json` zuletzt 2026-09-07 08:38 (von Hand) |

---

<a id="3-win-"></a>
## 3. Kennzahl **Win %**

### 3.1 Die Steckbriefe

| Feld | Inhalt |
|---|---|
| **Name in der Oberfläche** | „Win %" (Turnierseite), „Siege je Match" (Online-Decks), „Siege je entschiedenem Match" (Matchups). Alle drei Bezeichner kommen aus `js/win-rate-konvention.js:88 / :105 / :119` (`kurzDe`). |
| **Originalquelle** | `labs.limitlesstcg.com` (Präsenzturniere) und `play.limitlesstcg.com/decks` (Online-Turniere). **Es gibt keine Ladder** — `js/win-rate-konvention.js:135–151` hält fest, dass das Wort am 03.09.2026 überall entfernt wurde. |
| **Scraper** | `labs_tournament_scraper.py:1981` bzw. `limitless_online_scraper.py:180–235` |
| **Ablauf** | `weekly-full-update.yml` (Di + Fr 06:00 UTC) |
| **Ablage** | `labs_tournament_decks.csv` (`wins,losses,ties,win_pct`), `limitless_online_decks.csv` (`wins;losses;ties;win_rate_numeric`), `limitless_online_decks_matchups.csv` (`record;win_rate;total_games`) |
| **Anzeige** | s. Tabelle 3.4 |

### 3.2 Die drei Konventionen, mit der echten Formel

`js/win-rate-konvention.js:69–129` führt genau drei; eine vierte ist dort
ausdrücklich als erfunden markiert (`:34–38`).

| Bezeichner | Formel (Quelltext) | Zeile |
|---|---|---|
| `matchpunkte` → **angezeigt als „Win %"** | `((3·S + U) / (3·(S+N+U))) · 100` | Formel `js/win-rate-konvention.js:72`, Code `:97–100` |
| `mitUnentschieden` → „Siege je Match" | `(S / (S+N+U)) · 100` | Formel `js/win-rate-konvention.js:104`, Code `:111–114` |
| `ohneUnentschieden` → „Siege je entschiedenem Match" | `(S / (S+N)) · 100` | Formel `js/win-rate-konvention.js:118`, Code `:124–127` |
| *verworfen* | `(S + 0,5·U) / Partien` | `js/win-rate-konvention.js:34–38` |

**Zähler und Nenner je Quelldatei — heute nachgemessen:**

| Datei / Spalte | Zeilen | Konvention | Messergebnis |
|---|---|---|---|
| `labs_tournament_decks.csv` · `win_pct` | 4.713 | **Matchpunkte** | max. Abweichung **0,005 pp** von `(3S+U)/(3n)`; gegen `S/(S+N+U)` bis **25,0 pp** |
| `limitless_online_decks.csv` · `win_rate_numeric` | 136 | **mitUnentschieden** | 135 von 136 Zeilen < 0,05 pp; **1 Ausreißer**, max. 0,118 pp |
| `limitless_online_decks_matchups.csv` · `win_rate` | 1.716 | **ohneUnentschieden** | **0 Abweichungen**, max. 0,005 pp |

Die Werte werden **nicht** im Haus gerechnet: `limitless_online_scraper.py:186–213`
liest `share` und `win_rate` als Text aus der Limitless-Tabelle ab. Nur beim
Zusammenlegen doppelt gelisteter Decks (`:245–260`) rechnet der Scraper die
Quote aus der summierten Bilanz neu.

### 3.3 Unentschieden

* Matchpunkte: ein Unentschieden zählt **1 statt 3** — bei Unentschieden liegt der Gleichstand deshalb **unter 50 %** (`js/win-rate-konvention.js:91–95`).
* mitUnentschieden: Unentschieden stehen **im Nenner, nicht als halber Sieg**.
* ohneUnentschieden: Unentschieden fallen **ganz heraus**.
* Der Unterschied ist keine Feinheit: `js/app-archetype-card.js:68–73` beziffert **10,98 %** Unentschieden am Major gegen **1,26 %** online — auf derselben Skala kostet das die Major-Spalte rund fünf Punkte ohne jede Leistungsänderung.

### 3.4 Wo welche Konvention steht, und ab welcher Stichprobe

| Anzeigestelle | Reiter | Gerechnet in | Konvention | Glättung | Mindest-Stichprobe |
|---|---|---|---|---|---|
| Win Rate auf der Deck-Kachel der Tierliste | `current-meta` (Startseite) | `js/app-tier-meta.js:69–75` (`adjWR`), Anzeige `:2380` | `mitUnentschieden` | Beta-Prior **k = 50** auf 50 %: `adjWR = (wins + 50·0,5)/(games + 50)·100` | wird **immer** gezeigt; unter `ROGUE_MIN_LISTEN = CONV_MIN_N = 20` (`js/app-tier-meta.js:2389`) als dünn markiert |
| Heatmap-Zelle, Zeile „online" | `current-meta` | `js/app-current-meta.js:644–647` (`majorDuenn`) über `js/matchup-glaettung.js:82–89` | `ohneUnentschieden` | `quote = ((S + k/2)/(S+N+k))·100`, **k = 20** (`js/matchup-glaettung.js:59`) | unter **10** Matches kursiv (`js/app-current-meta.js:644`) |
| Matchup-Tabelle der Archetyp-Karte | `current-meta` (Kartenansicht) | `js/app-archetype-card.js` | `ohneUnentschieden`, geglättet k = 20 | dito | `THIN_GAMES = 20` (`js/app-archetype-card.js:87`) markiert, blendet nicht aus |
| Major-Win-Rate auf der Archetyp-Karte | `current-meta` | `js/app-archetype-card.js:56–66` | **`mitUnentschieden`, neu gerechnet aus `wins/losses/ties`** — `win_pct` der Labs-Datei wird **bewusst nicht gelesen** | keine | wird ab der ersten Partie gezeigt; unter `MAJOR_DUENN_PARTIEN = 100` (`js/app-archetype-card.js:118`) gedämpft |
| „Cumulative Win %" | `past-meta` | `js/app-past-meta.js:1901`, Hinweis `:1926` | **`matchpunkte`** (`WK.hinweis('matchpunkte')`) | keine | — |
| Labs-Beitrag zum Tier-Score | `current-meta` | `js/app-tier-meta.js:82–96` | `win_pct` = Matchpunkte | keine | **`ent.games >= 15`** (`js/app-tier-meta.js:86`), sonst `labsComp = 0` |
| Matchup-Mischung im Meta Call | `meta-call` | `js/app-meta-call.js:81–89` | Day-2 0,45 / Day-1 0,35 / Online 0,20 | `matchup-glaettung.js` | — |

### 3.5 Welche Turniere einfließen, welches Zeitfenster

* **Online-Win-Rate**: alles, was `play.limitlesstcg.com/decks` unter
  `game=PTCG&format=STANDARD&rotation=2026&set=PBL` (`config/scraper_settings.json`,
  Abschnitt `limitless_online`) kumulativ seit Formatbeginn führt — heute
  569 Turniere, 41.193 Spieler, 93.297 Matches (`data/limitless_meta_stats.json`).
  **Kein gleitendes Fenster.**
* **Major-Win-Rate**: `labs_tournament_decks.csv`, gefiltert auf den
  Meta-Schlüssel des laufenden Formats (`TEF-PBL`). Das sind heute
  **46 Zeilen aus genau einem Turnier** (Worlds 2026, 28.08.). Die
  Datei insgesamt trägt 4.713 Zeilen über alle Formate.
* **Matchup-Win-Rate**: dieselbe kumulative Online-Erhebung, je Paarung.
  Median 16 Partien; 36 % der Paarungen unter 10 Partien
  (`js/matchup-glaettung.js:5–14`).

---

<a id="4-meta-anteil"></a>
## 4. Kennzahl **Meta-Anteil**

**Es gibt vier verschiedene Nenner für „Anteil", und sie messen Verschiedenes.**
Das ist der Kern dieses Abschnitts.

### 4.1 Online-Anteil, kumulativ (`share_numeric`)

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Anteil", „Share online" |
| Originalquelle | `play.limitlesstcg.com/decks`, Spalte `Share` — **von Limitless gerechnet, nicht von uns** |
| Scraper | `limitless_online_scraper.py:186` (`share = texts[name_idx + 2]`), `:207–213` Zahlwandlung |
| Ablauf | `weekly-full-update.yml` |
| Ablage | `limitless_online_decks.csv`, Spalten `count;share;share_numeric` |
| Berechnung | **Nenner = Zahl der Decklisten**, die Limitless im Zeitraum gezählt hat, **einschließlich der Zeile „Other"**, die der Scraper wegwirft (`limitless_online_scraper.py:166`). Heute gemessen: Summe `share_numeric` = **96,19 %**, Summe `count` = **39.694** → implizites Feld ≈ **41.266 Listen**, also ~1.572 Listen „Other". |
| Anzeige | Kachel und Tabelle in `js/app-tier-meta.js:1251`, Archetyp-Karte `js/app-archetype-card.js:345` |

**Der Donut rechnet mit einem rekonstruierten Nenner.**
`js/app-current-meta-analysis.js:600–615` ruft
`window.feldGroesseAusAnteilen()` (`js/app-utils.js:1629–1671`) auf. Die
Funktion schätzt die wahre Feldgröße aus der Rundung: je Zeile das Intervall
`[ c/((s+0,005)/100) , c/((s-0,005)/100) ]`, dann der Punkt mit der größten
Überdeckung, akzeptiert nur wenn ≥ 80 % der Intervalle überlappen und die
Anteilssumme zwischen 50 % und 99,5 % liegt. **Ohne** diesen Schritt zeigte
der Donut für Mega Excadrill 8,1 %, die Tabelle daneben 7,75 %
(`js/app-current-meta-analysis.js:602–605`).

### 4.2 Online-Anteil im 14/15-Tage-Fenster (`share_fenster`)

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Fenster", Trend-Spalte im Meta Call |
| Originalquelle | dieselbe Tabelle, aber **als Differenz zweier Tagesstände** |
| Scraper | keiner — `scripts/build_online_fenster.py:145 baue()` liest `data/online_share_history/YYYY-MM-DD.csv` (68 Stände seit 29.04.2026) |
| Ablauf | `weekly-full-update.yml:383` (`--apply`) |
| Ablage | `limitless_online_fenster.csv` + `limitless_online_fenster_meta.json` |
| Berechnung | `count_fenster = count(heute) − count(vor N Tagen)` (`build_online_fenster.py:340`), dann `share_fenster = count_fenster / Σ count_fenster · 100` (`:423`); daneben `share_kumulativ = count_kumulativ / Σ count(heute) · 100` (`:395`); `trend_fenster = share_fenster − share_vorfenster` (`:483`) |
| Anzeige | `js/app-meta-call.js:5940–5968` |
| Stichprobe | heute Fenster **2026-08-22 … 2026-09-06 (15 Tage), 10.330 Decks** gegen 39.694 kumulativ. Summe `share_fenster` = 100,06 % (Rundung, `build_online_fenster.py:430–438`) |

**Der Nenner ist hier ein anderer als in 4.1**: `share_fenster` normiert auf die
Summe der *Fensterzuwächse*, `share_kumulativ` auf die Summe der *gelisteten*
Stände — beide ohne „Other".

### 4.3 Anteil bei Präsenzturnieren (`share_pct`)

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Anteil Major", „Field Share" |
| Originalquelle | `labs.limitlesstcg.com` Standings |
| Scraper | `labs_tournament_scraper.py:1981` |
| Ablage | `labs_tournament_decks.csv`: `player_count, share_pct, day1_players, day1_share_pct, day2_players, day2_share_pct` |
| Berechnung | **Nenner = Zahl der SPIELER** eines Turniers (`total_players`), nicht der Listen. `share_pct = player_count / total_players · 100` — der Scraper übernimmt die Spalte von Labs. |
| Anzeige | `js/app-archetype-card.js` (Kachel „Anteil Major"), `js/app-meta-call.js:6648`, `:6920` |

### 4.4 Antritte in Online-Turnieren (`total_brought`)

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Antritte", „gebracht" |
| Scraper | `online_tournament_scraper.py:390–436` |
| Berechnung | **Zwei Spaltenpaare in derselben Datei.** `total_brought_weighted` zählt jedes Turnier mit `_tournament_weight` (`:361–370`): ≤ 7 Tage → **1,0**, älter oder ohne Datum → **0,5**. `total_brought` zählt schlicht Köpfe. Heute gemessen: gezählt 12.287 Antritte / 754 Top-8; gewichtet 7.501,5 / 464,5. |
| Tor | `js/app-utils.js:1530–1552 gezaehlteZeilen()` — **alles oder nichts, je Zeile**: nur wenn *jede* Zeile ganzzahlige `total_brought`/`top8_count` mit `top8 ≤ brought` trägt, schalten alle Ansichten auf die gezählten Spalten; sonst alle auf die gewichteten. |

### 4.5 Prognostizierter Anteil („Prognose %", „Final %")

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Prognose", „Final %" im Meta Call |
| Reiter | `meta-call` |
| Datenbasis | `_majorSharesByDeck` aus `labs_tournament_decks.csv` (Day-1-Anteil, Day-1-Win-%, Day-1-Spieler) |
| Berechnung | `js/app-meta-call.js:3559 _prognoseKern()`, drei Bausteine: |

```
1. Rezenzgewichteter Anker  (js/app-meta-call.js:3565–3573)
     g(rang) = (1 − λ)^rang           λ = PROGNOSE_LAMBDA = 0,40   (:3530)
     basis(d) = Σ_t g(rang_t) · anteil(d,t)  /  Σ_t g(rang_t)
   Gewichtet nach TURNIERRANG, nicht nach Datum.

2. Leistungsfaktor  (js/app-meta-call.js:3577–3600)
     eigen(d)   = Σ (winrate · koepfe) / Σ koepfe   über die letzten
                  PROGNOSE_NT = 2 Turniere          (:3536)
     feldMittel = dasselbe über alle Decks
     faktor(d)  = max(0,85 , 1 + 0,04 · (eigen − feldMittel))
                  PROGNOSE_DELTA = 0,04, PROGNOSE_UNTEN = 0,85  (:3534/:3535)

3. Mittelwertrueckkehr  (js/app-meta-call.js:3602)
     aus(d) = (basis(d) · faktor(d)) ^ 0,92          γ = 0,92     (:3531)
```

Normiert wird erst beim Aufrufer; die Feldliste entsteht in
`js/app-meta-call.js:8631–8641` (`finalShare = alloc[deck.name]`), die
Spielerzahl **folgt aus dem Anteil** (`:8639`, ausdrücklich, weil zwei
Rechenwege in einer Zeile 469 statt 468 Spieler ergaben — `:8681–8687`).

**Rückfall**, wenn der Kern ein Deck nicht kennt (`js/app-meta-call.js:4227–4232`,
Modus B ohne City-League-Schalter):

```
predicted = 0,40 · labsPct · labsT8Boost
          + 0,20 · broughtPct
          + 0,15 · ladderPctDamped
          + 0,15 · postMajorSignal
          + 0,10 · weeklySignal
          + metaDynBoostPp
```

Mit City-League-Schaltern verschieben sich die Gewichte auf 0,32/0,35
(`js/app-meta-call.js:4197 / :4208 / :4218`); Modus A ohne Labs auf
0,20/0,45/0,10/0,10/0,15 (`:4249 ff.`).
Vorher greift Phase β (`js/app-meta-call.js:3906–3908`):
`ladderPct = majorMedian · 0,70 + rawLadderPct · 0,30`, wenn ein Major-Median
vorliegt.

**Gemessene Güte** (`js/app-meta-call.js:3486–3529`, Strecke
`tools/prognose_strecke.py`, 54 Turniere): Kern **1,256 pp** mittlerer
absoluter Fehler; Grundlinie „Mittel der letzten zwei Turniere" 1,376 pp;
der frühere 46-stufige Motor 1,714 pp; Orakel-Untergrenze 1,020 pp.

---

<a id="5-max-consistency"></a>
## 5. Kennzahl **Max Consistency**

| Feld | Inhalt |
|---|---|
| **Name in der Oberfläche** | „Max Consistency" (`js/i18n.js:692`, `:3285`, Schlüssel `cl.genConsistency`), im Warum-Dialog „Consistency Generate" |
| **Originalquelle** | `limitlesstcg.com/tournaments/<id>` + `/decks/list/<id>` — die **veröffentlichten Decklisten von Präsenzturnieren** |
| **Scraper** | `backend/scrapers/per_decklist_scraper.py:600` (Karten aus der Listenseite, Archetypname aus `.decklist-title`, `:245–264`) |
| **Ablauf** | `weekly-full-update.yml:462` (Di+Fr) und `per-decklist-scrape.yml` (Di 12:00 UTC) |
| **Ablage** | `data/tournament_decklists_per_player.csv` — 21 Spalten, u. a. `tournament_id, tournament_date, meta, place, player_name, deck_archetype, wins, losses, ties, card_name, set_code, set_number, count, is_ace_spec`. **30.459 Zeilen.** Turniergrößen kommen aus `labs_tournament_decks.csv` (`total_players`, `js/deck-builder-consistency.js:305–318`) |
| **Anzeige** | Knopf „Max Consistency" in den Deck-Buildern der Reiter `current-analysis`, `city-league-analysis`, `past-meta`; gezeichnet von `js/app-deck-builder.js` (Warum-Dialog `:7585 ff.`) |

### 5.1 Der Konsistenzbegriff — es ist eine **gewichtete Häufigkeit**, kein Modell

Kein Wahrscheinlichkeitsmodell, keine Simulation. Die Zahl ist der
**erfolgsgewichtete Anteil der Listen, die eine Karte spielen**:

```
js/deck-builder-consistency.js:645–651

  weightedShare(Karte)    = Σ w(Liste, die Karte spielt) / Σ w(alle Listen)
  weightedAvgCount(Karte) = Σ (w · Anzahl im Deck) / Σ w(Listen mit Karte)
  topCutFreq(Karte)       = Σ w(Top-8-Listen mit Karte) / Σ w(Top-8-Listen)
```

Das Listengewicht (`js/deck-builder-consistency.js:246–251`):

```
  w(Liste) = Platzgewicht(platz, feldgroesse) · Groessengewicht(feldgroesse)
```

**Platzgewicht** (`:215–235`) ist das **Maximum aus absoluter und
feldrelativer Skala** — nie ein Ersatz, damit ein Gewicht nur steigen kann:

| absolut (`:62–68`) | | feldrelativ (`:135–142`) | |
|---|---|---|---|
| Platz ≤ 4 | 1,0 | Quantil ≤ 0,01 | 1,0 |
| ≤ 8 | 0,7 | ≤ 0,02 | 0,8 |
| ≤ 16 | 0,5 | ≤ 0,05 | 0,6 |
| ≤ 32 | 0,3 | ≤ 0,10 | 0,4 |
| sonst | 0,1 | ≤ 0,25 | 0,2 |
| | | sonst | 0,1 |

Ist die Feldgröße 0 **oder** der Platz ungültig, bleibt es beim absoluten Band
(`:229–232`) — ein Quantil aus einem geratenen Zähler wäre eine erfundene Zahl.

**Größengewicht** (`:237–241`): `min(1,0 ; ln(n)/ln(2000))`, Boden **0,5** für
unbekannte Feldgröße (`SIZE_WEIGHT_FLOOR`, `:146`).

### 5.2 Welche Listen einfließen

* **Turniere:** alles, was in `tournament_decklists_per_player.csv` steht.
  Heute sind das **genau drei**: Worlds 2026 (0071, 28.08., TEF-PBL, 3.699 Zeilen),
  NAIC 2026 (0070, 10.06., TEF-CRI, 16.960), Special Event Turin (0069, 06.06.,
  TEF-CRI, 9.800).
* **Platzierungen:** alle veröffentlichten, nicht nur der Cut. Die Turniere
  veröffentlichen rund 18–19 % ihres Feldes (`js/deck-builder-consistency.js:79–85`:
  Worlds 143 von 774, NAIC 675 von 3.743, Turin 383 von 2.032).
* **Zeitraum / Formattor:** `opts.minDate` aus
  `format_window.json:in_person_legal_date` = **2026-07-31**
  (`js/app-deck-builder.js:7423–7427`, Filter in
  `js/deck-builder-consistency.js:1357–1385`). Zeilen ohne ISO-Datum werden
  **behalten**, nicht verworfen (`:1363`).
  Das Tor gilt für `currentMeta` **und** `cityLeague`, **nicht** für
  `past-meta` (`js/app-deck-builder.js:7422`).
* **Wirkung heute gemessen:** ohne Tor 53 Archetypen mit Listen; **mit** Tor
  bleiben **27 Archetypen aus einem einzigen Turnier** (Worlds). Mega Excadrill
  hat in beiden Fällen **8 Listen** (Plätze 37–122).

### 5.3 Mindest-Stichprobe und Rückfall

* `MIN_WEIGHTED_LISTS = 3` (`js/deck-builder-consistency.js:161`) — darunter
  liefert `_assessDataQuality` (`:1294`) `sufficient: false` und `build()`
  gibt ein **leeres Deck** zurück (`:1394`).
* **Heute gemessen: 15 der 27 Archetypen im Formatfenster haben < 3 Listen.**
  Für sie fällt `js/app-deck-builder.js:8367` auf den **Alt-Pfad** zurück
  (Stufen 0/0c/1/2/LRM/EnergyFloor/FinalFill), der mit aggregierten
  Anteilen aus `current_meta_card_data.csv` rechnet.
* Der Datenqualitätsblock nennt seit 05.09.2026 auch Turnierzahl, Namen,
  jüngstes Datum und Platzspanne (`js/deck-builder-consistency.js:1272–1302`),
  weil „8 decklists analyzed" für Mega Excadrill acht Listen **eines einzigen
  Turniers** meinte.

### 5.4 Die sechs Phasen, mit Schwellen

| Phase | Was | Schwelle / Formel | Zeile |
|---|---|---|---|
| 0 | Kartenbewertung | s. 5.1 | `:536–670` |
| 1 | ACE SPEC | höchster `weightedShare`; liegen Erster und Zweiter innerhalb **`ACE_SPEC_TIEBREAK_WINDOW = 0,10`** (10 pp), entscheidet `topCutFreq` | `:155`, `:678–740` |
| 2 | Core | `weightedShare ≥ thr`, `thr` aus **`[0,90 ; 0,85 ; 0,80]`** der Reihe nach, bis ≥ **`CORE_MIN_DISTINCT_CARDS = 12`** Karten übrig sind; sonst der Boden 0,80. Kopien = `round(weightedAvgCount)`, gedeckelt auf 4 (Basis-Energie 59) | `:151–152`, `:822–870` |
| 3 | Tech-Pakete | zwei Karten gelten als Paket, wenn sie in **≥ 70 %** der Listen gemeinsam auftreten, in denen eine von beiden vorkommt (`TECH_PACKAGE_COOCCURRENCE`) | `:158` |
| 4 | Tech-Auffüllung | Restplätze nach `weightedShare`, Gruppenwert = `max(weightedShare)` der Gruppe | `:1038–1072` |
| 4.5 | Alternativvorschlag (nur Diagnose) | feuert bei `round`-Rest 0,30–0,70 **und** Mehrheit ≥ 50 % **und** ≥ 5 Listen **und** ≥ 50 Plätze Medianabstand | `:178–184` |
| 5 | Trimm auf 60 | niedrigster `weightedShare` fliegt zuerst | `:1235–1240` |
| 6 | Datenqualität | s. 5.3 | `:1260–1310` |

### 5.5 Der zweite, ältere Rechenweg — er läuft weiter

`js/app-deck-builder.js:9120–9192` (Alt-Pfad) rechnet einen **anderen**
`consistencyScore`:

```
  sharePercent   = percentage_in_archetype aus current_meta_card_data.csv  (0..100)
  metaShare      = Metaanteil des Archetyps                                (0..100)
  metaBoost      = (metaShare / 100) · 0,15                    max +15 %   (:9137)
  weightedShare  = Zeitzerfallsanteil, wenn vorhanden          (:8655–8668)
  scoreShare     = weightedShare ?? sharePercent                           (:9180)
  consistencyScore = clamp(scoreShare · (1 + metaBoost), 0, 120)           (:9186)
  wenn Karte auf dem jüngsten Major fehlt:  min(score, 24)                 (:9191)
  Tech-Audit: gewählter Konter +18, redundanter Konter −20                 (:9212 / :9220)
```

Stufenschwellen des Alt-Pfads: Core `≥ 75`, Extended `≥ 40`, Tech-Tor
`_techGate`, gewählter Konter `≥ 25`
(`js/app-deck-builder.js:10128 / :10149 / :10209`).

---

<a id="6-tech-cut"></a>
## 6. Kennzahl **Tech-Cut-Empfehlungen**

**Antwort auf die Kernfrage: Es gibt drei getrennte Bausteine, und keiner davon
ist eine eigene „Cut"-Rechnung.** Zwei leiten aus Kartenhäufigkeit ab, einer
aus Kartentext. Eine Empfehlung, eine Karte zu *streichen*, gibt es als eigene
Rechnung nicht — der Trimmschritt in Phase 5 des Bauers
(`js/deck-builder-consistency.js:1235`) wirft schlicht den niedrigsten
`weightedShare` heraus.

### 6.1 Baustein A — Bedrohungslage (`active_threats.json`)

| Feld | Inhalt |
|---|---|
| Originalquelle | keine eigene: abgeleitet aus `pokemon_card_effects.json` (Kartentext von `limitlesstcg.com`) + `current_meta_card_data.csv` + `limitless_online_decks.csv` |
| Erzeuger | `backend/tools/build_threat_intel.py:341 build()`; Klassifizierer `backend/core/threat_classifier.py:219 classify_card` |
| Ablauf | `weekly-full-update.yml:274` (`tools/build_threat_intel.py`, Arbeitsverzeichnis `backend`) |
| Ablage | `data/active_threats.json` — `tuning`, `threats.<kategorie>.weighted_meta_share`, `threats.<kategorie>.cards[]`, `counters.<kategorie>[]` |
| Schwellen | `META_SHARE_FLOOR = 0,005` (`:114`), `INCLUSION_FLOOR = 0,25` (`:119`), `CATEGORY_FLOOR = 0,02` (`:123`) |

**Die Formel** (`backend/tools/build_threat_intel.py:472–496`):

```
  share_in_archetype = deck_inclusion_count / total_decks_in_archetype   (:394)
      verworfen, wenn < INCLUSION_FLOOR = 0,25
      verworfen, wenn Archetyp-Metaanteil ms < META_SHARE_FLOOR = 0,005

  je Archetyp nur das MAXIMUM über alle Karten der Kategorie (:410–413)
      — damit ein Deck mit zwei Retreat-Lock-Angreifern nicht doppelt zählt

  weighted_meta_share(kat) = Σ_Archetyp  max(share_in_archetype) · ms     (:492–494)
      Kategorie fällt weg, wenn < CATEGORY_FLOOR = 0,02 und kein Konter bekannt
```

Zusätzlich ein Legalitätstor gegen `sets.json` (`:376–379`) und eine
Stapel-Sperrliste `COUNTER_BLOCKLIST_BY_NAME` (`:434–439`).
Heute: `hand_disruption` mit `weighted_meta_share = 0,2678`.

### 6.2 Baustein B — Tech-Audit im Bauer (die eigentliche Empfehlung)

`js/app-deck-builder.js:9024–9118`. **Datenbasis ist Kartenhäufigkeit im
Archetyp**, nicht der Kartentext:

```
  Zahl der Konter je Kategorie  (js/app-deck-builder.js:9040–9044)
      weighted_meta_share < 0,30  →  1 Konter
                          < 0,60  →  2 Konter
                          sonst   →  3 Konter
  + Aggressionszuschlag (js/app-deck-builder.js:9051–9054)
      "heavy" +2, "standard" +1, "mild" +0     — gedeckelt auf 4  (:9057)

  Archetyp-Anteilsboden  (js/app-deck-builder.js:9070)
      TECH_AUDIT_MIN_ARCHETYPE_SHARE = 15,0 %   (5,0 % bei "heavy")
      Ist der beste Kandidat darunter, fällt die ganze Kategorie aus.

  Auswahl: nach percentage_in_archetype absteigend, ACE-SPEC nachrangig (:9077–9088)
  Menge je Karte: max(1, round(avgCountWhenUsed)), gedeckelt aufs Restbudget (:9100)

  Wirkung auf den Score (js/app-deck-builder.js:9212 / :9220)
      gewählter Konter    consistencyScore + 18   (auf 120 gedeckelt)
      redundanter Konter  consistencyScore − 20   (auf 0 gebodet)
```

### 6.3 Baustein C — Tech-Ideen (Ableitung aus Kartentext, ohne Beleg)

`js/tech-ideen.js`. Ausdrücklich **getrennt** vom Beleg-Block gehalten
(`js/tech-ideen.js:16–36`): kein Anteil, keine Platzierung, keine Siegquote
daneben, „weil es keine gibt".

| Feld | Inhalt |
|---|---|
| Datenbasis | `current_meta_card_data.csv` (Formatpool, `:175`), `limitless_online_decks_matchups.csv` (schlechte Matchups, `:176`), `card_capability_patterns.json` + `card_capability_interactions.json` über `js/card-capability-engine.js`, `pokemon_card_effects.json` |
| Schwellen | `SCHLECHT_AB = 47,0 %` Siegquote (`:76`), `MIN_PARTIEN = 30` (`:82`), `PRO_GEGNER = 3` (`:71`), `MAX_GEGNER = 3` (`:148`) |
| Verbindung der Namen | `window.normalizeArchetypeForMatch` (`js/app-meta-cards.js:8–15`); ohne sie Rückfall auf Rohnamen-Vergleich (`js/tech-ideen.js:120–128`) |
| **Grenze** | `data/card_capability_interactions.json` trägt **Version 0.1 vom 15.05.2026 und genau 5 Paarungen** (gemessen). „Keine Idee gefunden" heißt: keine, die diese fünf Regeln kennen (`js/tech-ideen.js:44–52`). |

### 6.4 Anti-Tech-Dialog („Build vs …")

`js/app-anti-tech.js`. Wählt Zieldecks und schreibt die gewählten Konter in
`techSlots[source]` (Deckel `TECH_SLOTS_HARD_CAP = 10`, `:44`), dann läuft
`autoCompleteConsistency`. Farbschwellen der Matchup-Pillen: ≥ 60 / ≥ 53 /
≥ 47 / ≥ 40 (`js/app-anti-tech.js:83–89`). Quelle der Quoten:
`window.currentMetaMatchupData` = `limitless_online_decks_matchups.csv`.

---

<a id="7-archetyp-erkennung"></a>
## 7. **Archetyp-Erkennung**

### 7.1 Die Zuordnung passiert nicht bei uns

**Es gibt keinen Klassifikator, der eine Deckliste liest und einen Archetyp
bestimmt.** Der Name kommt in jeder Quelle fertig von der Quelle:

| Quelle | Wo der Name herkommt | Beleg |
|---|---|---|
| Online-Decks | Linktext `<a href="/decks/…">` der Limitless-Tabelle | `limitless_online_scraper.py:165` |
| Präsenzturniere (Labs) | Spalte `deck_name` der Labs-Standings | `labs_tournament_scraper.py:1981` |
| Einzel-Decklisten | Element **`.decklist-title`** der Listenseite | `per_decklist_scraper.py:266–269`; Rückfall auf den Zellentext der Standings-Tabelle (`:614–619`), der meist „View" ist |
| City League (JP) | HTML-Icons `<img class="pokemon">` → Slugs | `city_league_archetype_scraper.py` |

Der einzige Ort, an dem tatsächlich *erkannt* wird, ist die City League: dort
liegt kein Name vor, nur Pokémon-Symbole.

### 7.2 Die Zuordnungstabelle: `data/archetype_icons.json`

* **542 Archetypen**, jeder auf eine Liste von Pokémon-Slugs abgebildet.
  `_meta.urlPrefix = https://r2.limitlesstcg.net/pokemon/gen9/`,
  `lastScrapedAt = 2026-09-06T16:33:30`, `lastScrapedCount = 138`.
* Geschrieben von `backend/scrapers/archetype_icons_scraper.py:58`,
  nachgeprüft von `scripts/pruefe_archetyp_icons.py` (`weekly-full-update.yml:358`).
* **Achtung Auslieferung:** `js/archetype-icons.js` holt die Datei mit dem
  eigenen Versionsstempel als Parameter — ohne `./bump-version.sh` erreicht
  eine Datenänderung niemanden (`CLAUDE.md`, Abschnitt „Shipping frontend changes", Punkt 4).

**Der Abgleich über Symbole** (`backend/core/archetype_matcher.py`):

```
  normalize_slug(s) = s.strip().lower().replace(" ", "-")          (:53–54)
  signature(slugs)  = tuple(sorted(normalize_slug(s)))             (:57–60)
  canonicalize_by_slugs(slugs) → Name mit gleicher Signatur        (:106–112)
  canonicalize_by_name(name)   → über normalize_name():
        lowercase + Streichen von Leerzeichen, Bindestrichen und
        ALLEN Apostroph-Varianten                                  (:41–46)
  Bei Signaturkollision gewinnt der zuerst gelesene Eintrag        (:94)
```

### 7.3 Der Abgleich im Frontend

`js/app-meta-cards.js:8–15` — `normalizeArchetypeForMatch()`:

```
  lowercase
  → "'s" und alle Apostrophe streichen        (Rocket's → Rocket)
  → Possessiv ohne Apostroph für 17 Namen     (Rockets → Rocket)
  → freistehendes "ex" streichen
  → 30 Set-Kürzel streichen (asc|blk|cri|dri|m3|…|pbl|pfl|por|…)
  → Mehrfach-Leerzeichen zusammenziehen
```

Darauf setzt `buildFuzzyArchetypeMap` (`js/app-meta-cards.js:35–63`) auf:
exakte Normalform gewinnt (Score 100); sonst müssen **alle** Wörter der
kürzeren Seite in der längeren als Präfix wiederkehren, Score
`kurz/lang · 100`.

**Die gepflegte Brücke** `data/archetype_aliases.json` steht darüber:
4 Paare in `turnier_zu_ladder`, 3 ausdrücklich **nicht** verbundene in
`bewusst_nicht_verbunden`. Gelesen von `js/app-tier-meta.js:1782` und
`js/app-meta-call.js:1679`. Regel im `_meta` der Datei: *„Niemals über
Namensähnlichkeit automatisieren"* — ein naives Streichen von „Mega"
verschmelzt Mega Greninja mit Greninja, Mega Gengar mit Gengar und
Mega Feraligatr mit Feraligatr.

**Varianten-Rollup** im Meta Call: `data/deck_families.json` überschreibt die
Erst-Wort-Heuristik `extractMainPokemon` (`js/app-meta-call.js:8668–8672`).

### 7.4 Speziell **Mega Excadrill**

| Quelle | Schreibweise | gemessen |
|---|---|---|
| `data/archetype_icons.json` | `"Mega Excadrill": ["excadrill-mega"]` | ein einziger Slug |
| `limitless_online_decks.csv` | `Mega Excadrill` | 1 Zeile |
| `labs_tournament_decks.csv` | `Mega Excadrill` | 1 Zeile |
| `online_tournament_top8_decks.csv` | `Mega Excadrill` | 1 Zeile |
| `tournament_decklists_per_player.csv` | `Mega Excadrill` | 163 Kartenzeilen = **8 Listen** |
| `current_meta_card_data.csv` | `Mega Excadrill` | vorhanden |

**Ergebnis: Mega Excadrill wird über den Namen erkannt, weil alle sechs
Quellen ihn identisch schreiben.** Es gibt weder einen Alias-Eintrag noch
eine Sonderregel. Normalisiert ergibt der Name `mega excadrill` — das
Set-Kürzel-Streichen greift nicht, „Mega" bleibt stehen (und muss es, s. o.).
Die City-League-Erkennung würde die Signatur `("excadrill-mega",)` verwenden.

Die 8 Listen liegen **alle** in Worlds 2026, Plätze 37–122
(`js/deck-builder-consistency.js:86–90`). Vor der feldrelativen Skala trugen
alle acht dasselbe Gewicht 0,1, `weightedShare` war exakt `n/8`, und die
Regel „Erfolg zählt mehr" trug null bei.

---

<a id="8-weitere"></a>
## 8. Weitere Kennzahlen

### 8.1 Platzierungen / Top-8-Konversion

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „Top-8 vs. Erwartung" (`js/app-tier-meta.js:1667–1672` — bewusst nicht „Conversion Performance") |
| Quelle → Ablage | `play.limitlesstcg.com` → `online_tournament_scraper.py:461–463` → `online_tournament_top8_decks.csv` |
| Berechnung | `js/app-utils.js:1551–1578`: <br>`expected = Σ top8_count_weighted / Σ total_brought_weighted`<br>`smoothed = (top8 + CONV_PRIOR·expected) / (brought + CONV_PRIOR)`<br>`rawPct = ((top8/brought)/expected − 1)·100` |
| Konstanten | `CONV_PRIOR = 50`, `CONV_THIN_N = 50`, `CONV_MIN_N = 20` (`js/app-utils.js:1493–1495`) |
| Mindest-Stichprobe | unter `CONV_MIN_N = 20` Antritten fliegt ein Deck aus der **Liste**, nicht aus dem Feldmittel (`js/app-tier-meta.js:1673–1679`) |
| Anzeige | `js/app-tier-meta.js:1667 ff.`, Archetyp-Karte `js/app-archetype-card.js` (rechnet **nicht** neu, `:12–15`) |
| Feldwert heute | gezählt `754/12.287 = 6,14 %`; gewichtet `464,5/7.501,5 = 6,19 %` |

### 8.2 Deckempfehlung („Was bringe ich mit?")

`scripts/build_deckempfehlung.py:178–187`:

```
  Score(d) = ( D2(d) + k · p0 ) / ( D1(d) + k ) · 100
      D1(d) = Σ day1_players des Decks über die Ankerturniere
      D2(d) = Σ day1_players · day1_to_day2_conv
      p0    = Feldkonversion des gesamten Ankers
      k     = 30 (Betriebsart A: Format hat Präsenzturniere)
              60 (Betriebsart B: Kaltstart, Anker = 2 Vorepochen)
```

Schwellen: `MIN_ZIELSPIELER = 8` (`:103`), `MIN_ANZEIGE = 30` Ankerspieler,
Top 10 (`:106`, `:357`). Gemessener Vorsprung gegen den Feldschnitt:
A **+9,9 pp** (44 Turniere), B **+7,1 pp** (22 Turniere).
Ablage `data/deckempfehlung.json`, Anzeige `js/app-deckempfehlung.js`.

### 8.3 Preise

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | „€"-Angabe auf der Kartenkachel, Kartendatenbank |
| Originalquelle | `downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json` + `productList/products_singles_6.json` |
| Scraper | `daily-price-refresh.yml:124–126` (curl) → `cardmarket_id_mapper.py:581` (Zuordnung `(set,number) → idProduct`) → `cardmarket_price_merger.py` |
| Ablauf | `daily-price-refresh.yml`, täglich **08:00 UTC** |
| Ablage | `price_data.csv`: `name, set, number, eur_price, eur_low, cardmarket_url, last_updated, price_status, mapping_status` |
| Berechnung im Merger | `eur_price = trend` roh übernommen; `price_status` (`:213–216`): `no_trend`, wenn `trend ∈ {None,'',0}`; `trend_below_low`, wenn `low > trend`; sonst `unverified_mapping`, wenn `match_method` mit `priced-by` beginnt; sonst `ok`. `mapping_status` (`:148–159`) unabhängig davon: `unmapped` / `collision` / `unverified` / `ok`. |
| Ersetzung für die **Anzeige** | `backend/core/prepare_card_data.py:499–502`: ist `eur_low` da **und** (`status ∈ {no_trend, trend_below_low}` **oder** `eur_price == 0` **oder** `eur_low > eur_price`), wird `eur_price := eur_low`. Die CSV behält Cardmarkets echte Zahlen. |
| Anzeige | über `all_cards_merged.json` / `cards_chunk_*.json` in `js/app-cards-db.js` (Reiter `cards`) und `js/app-meta-cards.js:896–912` |
| Stichprobe heute | 20.419 Zeilen. `price_status`: ok 16.141 · stale 3.026 · unverified_mapping 1.161 · trend_below_low 60 · no_trend 24 · no_data 7. `mapping_status`: ok 16.010 · unmapped 3.033 · unverified 1.188 · **collision 188** |

`js/app-price.js` ist ein **Live-Preis-Proxy gegen `localhost:8001`** und in der
ausgelieferten Seite ohne Wirkung (`checkProxyServer` schlägt fehl, `:14–26`).

### 8.4 Kartentrends (▲/▼ auf der Kartenkachel)

`js/app-tier-meta.js:296–321 getTrendIndicator()`:

```
  Vergleicht STRIKT die letzten zwei Zeitpunkte der Historie.
  diff = share(letzter) − share(vorletzter)
  Staple-Schutz: current > 95 % und diff > −10  →  kein Pfeil       (:317)
  diff >  2  →  ▲ +x %      (:319)
  diff < −2  →  ▼  x %      (:320)
```

Die Historie kommt aus `getCityLeagueCardShareHistory`
(`js/app-tier-meta.js:326–…`), gruppiert `window.cityLeagueAnalysisData` nach
ISO-Wochen (`:342–358`). Aufgerufen **nur für `source === 'cityLeague'`**
(`js/app-meta-cards.js:881–882`) → im Reiter `current-analysis` gibt es keine
Pfeile, und im City-League-Reiter „aktuell" auch nicht (§10).

### 8.5 Stichprobengrößen („Gemeldete Listen / Turniere / Spieler")

| Feld | Inhalt |
|---|---|
| Name in der Oberfläche | Block „Quellen & Methodik" im Reiter `meta-analysis-hub` |
| Berechnung | **Bewusst nur an einer Stelle:** `js/app-tier-meta.js:2184–2201` rechnet, `js/ds-datenumfang.js` nimmt entgegen, `js/app-quellen.js` liest ab. `totalEntries = Σ new_count`; die wahre Feldgröße über `feldGroesseAusAnteilen` (`:2199`) |
| Haltbarkeit | `HOECHSTALTER_MS = 24 h` (`js/ds-datenumfang.js:41`), gespeichert in `sessionStorage` unter `ds_datenumfang_v1` |
| Herkunftszeile | `limitless_meta_stats.json` — wird ausgeblendet, wenn `generated_at` fehlt oder älter als 14 Tage ist (`limitless_online_scraper.py:133–140`) |

### 8.6 Datenstand („Daten: …")

| Feld | Inhalt |
|---|---|
| Erzeuger | `scripts/build_data_stand.py` — liest den **Git-Verlauf**, nicht `Last-Modified` (Begründung `js/ds-datenstand.js:20–29`: GitHub Pages liefert dort die Deploy-Zeit) |
| Ablauf | `weekly-full-update.yml:720` |
| Ablage | `data/data_stand.json` mit `dateien`, `inhalt_bis`, **`leer`** |
| Anzeige | `js/ds-datenstand.js` — je Reiter der Stand **seiner** Ansicht; unbekannt heißt „unbekannt", nie das heutige Datum (`:39–42`) |

### 8.7 Pocket-Tierliste

Quelle `game8.co/games/Pokemon-TCG-Pocket/archives/477754`
(`scripts/scrape_pocket_tierlist.py:87`) → `data/pocket_tierlist.json` →
`js/ds-pocket.js:52`. Keine eigene Rechnung: die Stufen werden von Game8
übernommen; unbekannte Stufen werden ausgewiesen statt einsortiert
(`js/ds-pocket.js:213–243`). **Ohne Zeitplan** — `pocket-tierlist.yml` hat nur
`workflow_dispatch`.

---

<a id="9-verwaiste-daten"></a>
## 9. Verwaiste Daten

Methode: für jede der 232 Dateien unter `data/` (ohne `_archive/`) wurde der
Dateiname in `js/`, `index.html`, `service-worker.js`, `prerender/`, `posts/`,
`bot/`, `scripts/`, `backend/`, `tools/`, `tests/`, `docs/`, `.github/`
gesucht. Dynamisch adressierte Familien (`labs_tournament_*_<META>.csv`,
`tournament_cards_data_cards_<META>.csv`, `online_share_history/*.csv`) wurden
gegen ihre Verzeichnis-Dateien geprüft und sind **erreichbar**.

### 9.1 Von gar nichts gelesen

| Datei | Größe | Befund |
|---|---|---|
| `data/labs_tournament_scraper.log` | 0 B | Protokoll, versehentlich unter `data/` |
| `data/online_tournament_scraper.log` | 0 B | dito |
| `data/per_decklist_scraper.log` | 0 B | dito |
| `data/tournament_scraper.log` | 139 B | dito |
| `data/city_league_archetypes_comparison.html` | 21 KB | fertiges HTML aus dem Scraper; einziger Treffer ist `docs/audit/infrastructure/01-feature-inventory.md` |

### 9.2 Kein einziges Feature liest sie — nur Erzeuger, Prüfskripte oder Tests

| Datei | wird nur berührt von |
|---|---|
| `data/datenluecken.json` | `js/app-admin.js:49` liest sie — **aber kein Ablauf erzeugt sie.** `scripts/datenluecken.py` steht in **keinem** Workflow. Stand `2026-08-31T13:00:53Z`, `anzahl: 0`, `luecken: []` |
| `data/pokepricelab_worklist.csv` (83 KB) | nur `scripts/triage_pokepricelab_report.py` |
| `data/pokepricelab_verification.csv` (103 KB) | nur `verify_via_pokepricelab.py` + `triage_…`; Ablauf nur `workflow_dispatch` |
| `data/pokepricelab_catalog_index.csv` (4,7 MB) | nur `build_pokepricelab_index.py` + `verify_via_pokepricelab.py`; Ablauf nur `workflow_dispatch`, Dateistand **2026-08-17** |
| `data/calibration/indy_2026_actuals.json` | nur `tools/calibrate_meta_call_indy.py` — das Skript steht in keinem Workflow |
| `data/_archetype_mapping_gaps.json` | nur `backend/scrapers/archetype_mapping_audit.py` — dieser Scraper steht in **keiner** Workflow-Liste (`weekly-full-update.yml:267–275` führt ihn nicht) |
| `data/all_cards_database.json` (16 MB) | nur `all_cards_scraper.py` + `prepare_card_data.py` — das Frontend liest `all_cards_merged`/`cards_chunk_*` |
| `data/all_cards_merged.csv` (7 MB) | nur Erzeuger + Wächter; das Frontend liest die `.json`-Fassung |
| `data/city_league_archetypes_comparison_M3.csv`, `data/city_league_analysis_M3.csv` (31 MB) | `scripts/generate-bot-deck-index.py:1142`, `scripts/repariere_set_nummern.py` — im Frontend nur als **Kommentar** (`js/app-city-league.js:268`, `js/app-tier-meta.js:702`, `:811`) |
| `data/meta_play_decks_cache.json` (534 KB) | nur Scraper-Zwischenspeicher |
| `data/price_guide_6.json` (15 MB), `products_singles_6.json` (13 MB), `products_nonsingles_6.json` | Zwischenstufen der Preiskette; die Seite liest nur `price_data.csv` (über `cards_chunk_*`) |
| `data/testing_group_bootstrap.json` | nur über `index.html` erreichbar — Frontend-Referenz vorhanden, aber kein Ablauf pflegt sie (Stand 2026-08-17) |
| `data/offline-images-manifest.json` (377 KB), `data/offline-manifest.json` | `scripts/generate-offline-manifest.py` + `js/offline-prefetch.js`; Dateistand **2026-08-17**, während der Kartenbestand täglich neu gebaut wird |

### 9.3 Erreichbar, aber praktisch tot

* `data/labs_tournament_decks_TEF-PBL.csv` und `…_matchups_TEF-PBL.csv` sind
  im Verzeichnis gelistet und werden geladen — sie tragen aber **ein einziges
  Turnier**.
* `data/city_league_images.json` (38 KB) steht seit **2026-08-17** und gehört
  zum leeren City-League-Zweig (§10).

---

<a id="10-leere-rechnungen"></a>
## 10. Leere Rechnungen

### 10.1 City League „aktuell" — vier Dateien nur mit Kopfzeile

`data/data_stand.json` benennt sie selbst unter `leer`:

| Datei | Zeilen | wird gelesen von |
|---|---|---|
| `city_league_analysis.csv` | **0** (nur 22-Spalten-Kopf) | `js/app-city-league.js:574`, `:1574`, `:1606` |
| `city_league_archetypes.csv` | **0** | `js/app-city-league.js:575`, `:1607` |
| `city_league_archetypes_comparison.csv` | **0** | `js/app-city-league.js:576`, `:1608` |
| `city_league_archetypes_deck_stats.csv` | **0** | `prepare_card_data.py`, `build_data_stand.py` |

Stand laut `data_stand.json`: **2026-07-31**. Betroffen sind damit:

* Reiter `city-league` und `city-league-analysis` im „aktuell"-Modus,
* die **Kartentrend-Pfeile** (§8.4) — `getCityLeagueCardShareHistory` bekommt
  eine leere `cityLeagueAnalysisData` und liefert `[]`, `getTrendIndicator`
  gibt bei `< 2` Punkten `''` zurück (`js/app-tier-meta.js:297`),
* die City-League-Zweige des Deck-Builders (`getCityLeagueDeckCountFallback`,
  `js/app-deck-builder.js:4934`).

Der „Vergangenes"-Zweig läuft, ist aber ebenfalls dünn:
`city_league_analysis_past.csv` = **315 Zeilen aus einem Turnier (568,
06.06.2026)**, `city_league_archetypes_past.csv` = 26 Zeilen.

### 10.2 Drei Konversionsspalten sind in **allen** 4.713 Zeilen 0

Gemessen an `data/labs_tournament_decks.csv`:

| Spalte | leer | `= 0` |
|---|---|---|
| `top8_conv_rate` | 0 | **4.713** |
| `top16_conv_rate` | 0 | **4.713** |
| `top32_conv_rate` | 0 | **4.713** |
| `top1_count` | **4.072** (86 %) | 631 |
| `top4_count` | **4.072** | 605 |
| `top8_count` | **4.072** | 579 |

Der Meta Call hält das an drei Stellen ausdrücklich fest
(`js/app-meta-call.js:3519`, `:4064`, `:6947`) und schaltet auf einen
Day-2-Ersatz um (`js/app-meta-call.js:4052–4068`, `:9247`). Der
`labsT8Boost`-Term `clip(top8_conv_rate/0,25 ; 0,5 ; 2,0)`
(`js/app-meta-call.js:7271`) rechnet damit strukturell auf **0**, wo der
Ersatz nicht greift.

### 10.3 Fünf Regeln als „Formatabdeckung"

`data/card_capability_interactions.json`: `version 0.1`,
`generated_at 2026-05-15`, **5 Paarungen**. Darauf ruht der ganze
Tech-Ideen-Baustein (§6.3). Der Kandidatenkreis ist zusätzlich auf die im
Format gespielten Karten aus `current_meta_card_data.csv` beschränkt
(`js/tech-ideen.js:55–61`).

### 10.4 Weitere

* `data/datenluecken.json` — `anzahl: 0`, aber kein Ablauf erzeugt sie (§9.2).
  Der Admin-Bereich zeigt „keine Lücken", weil niemand nachgeschaut hat.
* `data/ace_specs.json` — `timestamp` = 2026-02-18, 39 Namen. Gelesen von
  `js/deck-builder-consistency.js:291` (Phase-1-ACE-SPEC-Wahl) und
  `backend/core/ace_spec_regel.py:39`. Ohne die Datei baut der Bauer
  **jedes** Deck ohne ACE SPEC (`js/deck-builder-consistency.js:694–700`).
* **Max Consistency im laufenden Format**: 15 von 27 Archetypen fallen unter
  `MIN_WEIGHTED_LISTS = 3` und liefern ein leeres Deck; die Oberfläche fällt
  still auf den Alt-Pfad zurück (§5.3).
* `data/prizepack_official_images.csv` — Dateistand **2026-08-17**, obwohl der
  Ablauf sonntags läuft; die `.json`-Fassung daneben ist von 2026-09-07.

---

<a id="11-zwei-wege"></a>
## 11. Zwei Wege zur selben Zahl

| # | Kennzahl | Weg A | Weg B | Warum das zählt |
|---|---|---|---|---|
| 1 | **Win Rate desselben Decks am Major** | `js/app-past-meta.js:1901` liest `win_pct` = **Matchpunkte** `(3S+U)/(3n)` | `js/app-archetype-card.js:56–66` rechnet aus **denselben** `wins/losses/ties` **`S/(S+N+U)`** und liest `win_pct` ausdrücklich nicht | Eine Datei, eine Zeile, zwei Zahlen. Bei 10,98 % Unentschieden am Major liegen sie rund **5 Punkte** auseinander. Beide Stellen sagen, welche sie sind — aber sie sagen es in verschiedenen Reitern. |
| 2 | **Meta-Anteil** | `share_numeric` aus `limitless_online_decks.csv`, Nenner = Limitless-Feld **inkl. „Other"** (Summe 96,19 %) | Donut über `feldGroesseAusAnteilen` (`js/app-utils.js:1629`), Nenner = rekonstruierte Feldgröße ≈ 41.266 | Ohne den zweiten Weg zeigte der Donut für Mega Excadrill 8,1 %, die Tabelle 7,75 % (`js/app-current-meta-analysis.js:602–605`). Der zweite Weg ist die Reparatur — es bleiben **zwei** Rechenwege nebeneinander. |
| 3 | **Meta-Anteil, dritte Fassung** | `share_kumulativ` in `limitless_online_fenster.csv` = `count/Σcount(heute)` (`build_online_fenster.py:395`) | `share_numeric` derselben Decks | Der Kopf der Fenster-Datei nennt den Unterschied selbst: „Kumulativ … mit einem anderen Nenner — 38.398 statt 39.826" (`scripts/build_online_fenster.py:18–20`). |
| 4 | **Top-8-Quote** | gewichtete Spalten `top8_count_weighted / total_brought_weighted` → 6,19 % | gezählte Spalten `top8_count / total_brought` → 6,14 % | Vier Ansichten nahmen bis zum 02.09.2026 verschiedene (`js/app-utils.js:1504–1528`). Heute regelt `gezaehlteZeilen()` das zentral — **aber** `js/app-meta-call.js:6133` liest weiter `top8_conv_rate` aus der Labs-Datei, die in allen Zeilen 0 ist (§10.2). |
| 5 | **`consistency_score` im Warum-Dialog** | Neuer Bauer: `Math.round(weightedShare · 100)` — Anteil der erfolgsgewichteten Listen, Skala 0–100 (`js/app-deck-builder.js:7610`, `:7686`) | Alt-Pfad: `clamp(scoreShare · (1 + metaBoost), 0, 120)` mit Tech-Boni ±18/−20 — Skala 0–**120** (`js/app-deck-builder.js:9186–9222`) | **Gleiches Feld, gleicher Dialog, zwei Definitionen und zwei Skalen.** Welche gilt, entscheidet allein, ob der Archetyp ≥ 3 Listen im Formatfenster hat. Für 15 von 27 Archetypen ist das heute der Alt-Pfad. |
| 6 | **Max-Consistency-Bau selbst** | `MostConsistencyBuilder` (`js/deck-builder-consistency.js`), 6 Phasen, Core-Schwelle 90/85/80 % | Alt-Pfad Stufen 0/0c/1/2/LRM (`js/app-deck-builder.js:8380 ff.`), Core `score ≥ 75`, Extended `≥ 40` | Zwei vollständige Bau-Algorithmen für einen Knopf. Der Umschaltpunkt (`js/app-deck-builder.js:8314–8367`) ist für den Nutzer unsichtbar; nur die Konsole schreibt „Phase Y.2 declined". |
| 7 | **Win-Rate-Glättung** | Deck-Ebene: `k = 50` Pseudo-Partien auf 50 % (`js/app-tier-meta.js:71–75`) | Matchup-Ebene: `k = 20` (`js/matchup-glaettung.js:59`) | Zwei Prioren, beide begründet (`js/matchup-glaettung.js:52–57`). Auf einem Bildschirm stehen sie nebeneinander, ohne dass die Kachel den Unterschied nennt. |
| 8 | **Zähler der Deck-Glättung** | `computeTierScore` behandelt `deck.new_count` als **`games`** und rechnet `wins = games · rawWR/100` (`js/app-tier-meta.js:69–70`) | `new_count` kommt aus `limitless_online_decks_comparison.csv` und zählt **Decklisten**, nicht Partien (`js/app-tier-meta.js:1257`); `win_rate_numeric` ist dagegen über **Matches** gebildet | Für Dragapult: 3.138 Listen gegen 14.861 Partien. Die Glättung wirkt damit rund 4,7-mal stärker als der Variablenname behauptet. Der Tooltip schreibt korrekt „aus N **Listen**" (`js/app-tier-meta.js:2399`) — die Formel darunter heißt weiter `games`. |
| 9 | **Archetyp-Zuordnung** | Python: Icon-Signatur `sorted(slugs)` (`backend/core/archetype_matcher.py:57`) | JavaScript: Regex-Normalisierung + Wort-Präfix-Score (`js/app-meta-cards.js:8–63`) | Zwei unabhängige Normalisierungen; nur die JS-Fassung streicht Set-Kürzel und „ex", nur die Python-Fassung kennt Symbole. Die gepflegte Brücke `archetype_aliases.json` steht über beiden — mit heute **4** Paaren. |
| 10 | **Formattor für Decklisten** | `currentMeta` und `cityLeague`: `minDate = in_person_legal_date` (`js/app-deck-builder.js:7422–7427`) | `past-meta`: **kein** Tor | Absichtlich (`js/app-deck-builder.js:7404–7421`), aber es heißt: dieselbe Schaltfläche baut in zwei Reitern aus verschiedenen Grundmengen. Gemessen 05.09.2026: Alakazam Dudunsparce im Past Meta zog 61 von 75 Listen (81 %) aus dem Vorformat. |

---

## Anhang — was nicht auffindbar war

* **Eine eigene Rechnung für „Tech-Cut"** (eine Empfehlung, eine Karte zu
  streichen): *nicht gefunden* — geprüft `js/tech-ideen.js`,
  `js/app-anti-tech.js`, `js/app-deck-builder.js:8990–9250` und `:10101–10230`,
  `js/deck-builder-consistency.js:1200–1260`. Was es gibt, ist der
  Trimmschritt in Phase 5 und die −20-Strafe für redundante Konter.
* **Ein Klassifikator, der eine Deckliste einem Archetyp zuordnet**:
  *nicht gefunden* — geprüft `backend/scrapers/per_decklist_scraper.py:245–269`
  und `:600–640`, `backend/core/archetype_matcher.py`,
  `backend/scrapers/city_league_archetype_scraper.py`. Der Name kommt in allen
  EN-Quellen fertig von Limitless; nur die City League leitet ihn aus
  Pokémon-Symbolen ab.
* **`data/tournament_cards_data_overview.csv` · Spalte `players`**: sie zählt
  anders als `total_players` in `labs_tournament_decks.csv` und wird von
  `_loadTournamentSizes` ausdrücklich **nicht** gelesen
  (`js/deck-builder-consistency.js:83–85`). Woher der Unterschied kommt:
  *nicht gefunden* — geprüft `backend/scrapers/tournament_scraper_JH.py:1114–1115`.
