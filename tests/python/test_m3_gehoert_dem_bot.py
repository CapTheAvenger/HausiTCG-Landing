"""Der groesste Datenblock der Seite — und wer ihn wirklich braucht.

BEFUND (07.09.2026): `data/city_league_analysis_M3.csv` hat 133.437
Zeilen und 29,8 MB, und keine einzige Datei unter `js/` liest sie. Der
einzige Treffer dort ist ein Kommentar in `js/app-tier-meta.js`, der sie
als abgeloest bezeichnet — der Vergangenheits-Schnappschuss zog am
23.05.2026 auf `city_league_analysis_past.csv` um.

Naheliegender Schluss waere: vergessener Rest, weg damit. Der Schluss
ist falsch.

NACHGEMESSEN: `scripts/generate-bot-deck-index.py` liest sie in
`_build_city_league()` und baut daraus den City-League-Teil des
Telegram-Bot-Index. Der Lauf am 07.09.2026 meldete:

    city-league:   71 decks
    ✓ wrote ./data/bot-deck-index.json (2703.0 KB, 124 decks)

Aufgerufen wird das Skript in `deploy-pages.yml` bei jedem Deploy und in
`data-consistency.yml` als PR-Gatter. Die Datei ist also **aktiv
genutzt** — nur eben serverseitig beim Deploy, nicht im Browser. Ein
grep ueber `js/` konnte das nicht sehen.

WAS TATSAECHLICH FALSCH WAR: sie stand im Offline-Manifest. `js/offline-
prefetch.js` waermt bei jedem Seitenaufruf jede dort gelistete Datei in
den Service-Worker-Cache — 29,8 MB fuer eine Datei, die das Frontend nie
anfasst, gut ein Zehntel des gesamten Prefetch-Gewichts.

ENTSCHEIDUNG: Datei behalten (sie hat einen Leser), aus dem
Offline-Manifest nehmen (der Leser sitzt nicht im Browser). Geloescht
wird nichts: sie ist der einzige Traeger der Perioden 2026-W03 bis
2026-W09, und `city_league_analysis_past.csv` fuehrt heute nur 315
Zeilen.
"""

import json
import os
import re

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
DATEN = os.path.join(WURZEL, "data")
M3 = os.path.join(DATEN, "city_league_analysis_M3.csv")
MANIFEST = os.path.join(DATEN, "offline-manifest.json")
ERZEUGER = os.path.join(WURZEL, "scripts", "generate-offline-manifest.py")
BOT_INDEX = os.path.join(WURZEL, "scripts", "generate-bot-deck-index.py")

DATEINAME = "city_league_analysis_M3.csv"


def test_die_datei_ist_noch_da():
    """Nicht loeschen — sie ist der einzige Traeger ihrer Perioden."""
    assert os.path.exists(M3), (
        "city_league_analysis_M3.csv wurde entfernt — damit verliert der "
        "Bot-Deck-Index seinen City-League-Teil (71 Decks)")
    assert os.path.getsize(M3) > 10_000_000


def test_der_bot_index_liest_sie():
    """Der Leser, den ein grep ueber js/ nicht findet."""
    with open(BOT_INDEX, encoding="utf-8") as f:
        quelle = f.read()
    assert DATEINAME in quelle, (
        "scripts/generate-bot-deck-index.py liest die Datei nicht mehr — dann "
        "ist sie tatsaechlich ein Rest, und diese Suite gehoert neu bewertet")


def test_das_frontend_liest_sie_nicht():
    """Die Voraussetzung dafuer, sie aus dem Prefetch zu nehmen. Faengt
    eine js-Datei an, sie zu holen, muss sie zurueck ins Manifest."""
    treffer = []
    js_dir = os.path.join(WURZEL, "js")
    kandidaten = [os.path.join(js_dir, n) for n in os.listdir(js_dir)
                  if n.endswith(".js")]
    kandidaten.append(os.path.join(WURZEL, "index.html"))
    for pfad in kandidaten:
        if not os.path.isfile(pfad):
            continue
        with open(pfad, encoding="utf-8", errors="replace") as f:
            for nr, zeile in enumerate(f, 1):
                if DATEINAME not in zeile:
                    continue
                # Ein Kommentar ist kein Abruf.
                nackt = zeile.strip()
                if nackt.startswith("//") or nackt.startswith("*") or nackt.startswith("/*"):
                    continue
                treffer.append(f"{os.path.relpath(pfad, WURZEL)}:{nr}")
    assert not treffer, (
        "das Frontend holt die Datei doch — sie gehoert zurueck ins "
        "Offline-Manifest: " + ", ".join(treffer))


def test_sie_steht_nicht_mehr_im_offline_manifest():
    with open(MANIFEST, encoding="utf-8") as f:
        m = json.load(f)
    pfade = {e["path"] for e in m["files"]}
    assert DATEINAME not in pfade, (
        f"{DATEINAME} steht im Offline-Manifest — js/offline-prefetch.js "
        "waermt damit 29,8 MB in den Cache jedes Besuchers, fuer eine Datei, "
        "die das Frontend nie liest")


def test_der_erzeuger_schliesst_sie_begruendet_aus():
    """Sonst steht sie beim naechsten Deploy wieder drin — das Manifest
    wird bei jedem Deploy neu gebaut."""
    with open(ERZEUGER, encoding="utf-8") as f:
        quelle = f.read()
    assert DATEINAME in quelle, (
        "scripts/generate-offline-manifest.py kennt die Ausnahme nicht — der "
        "naechste Deploy nimmt die Datei wieder auf")
    assert re.search(r"bot[- ]deck[- ]index", quelle, re.I), (
        "der Ausschluss ist nicht begruendet — ohne den Hinweis auf den "
        "Bot-Index sieht er wie ein Versehen aus")


def test_die_uebrigen_eintraege_bleiben_unangetastet():
    """Ein Ausschluss, der mehr mitnimmt als gemeint, faellt hier auf."""
    with open(MANIFEST, encoding="utf-8") as f:
        m = json.load(f)
    pfade = {e["path"] for e in m["files"]}
    for muss_bleiben in ("city_league_analysis.csv",
                         "city_league_analysis_past.csv",
                         "city_league_archetypes_comparison_M3.csv"):
        assert muss_bleiben in pfade, (
            f"{muss_bleiben} ist mit ausgeschlossen worden — der Ausschluss "
            "greift zu weit")
    assert len(pfade) >= 95, f"nur noch {len(pfade)} Eintraege im Manifest"
