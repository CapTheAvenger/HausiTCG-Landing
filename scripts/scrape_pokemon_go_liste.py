#!/usr/bin/env python3
"""data/pokemon_go_liste.json — welche Arten in Pokemon GO verfuegbar sind.

QUELLE: https://www.pokewiki.de/Liste_der_Pokémon_in_Pokémon_GO
Vom Betreiber am 09.09.2026 ausdruecklich als Quelle benannt. Dieselbe
Domain, aus der schon die Champions-Icons kommen (data/champions_sprites.json).

DIE QUELLE WARNT VOR SICH SELBST. Oben auf der Seite steht ein Kasten:

    "Dieser Artikel ist seit Anfang 2026 veraltet. [...] Es fehlen nicht
     nur Aktualisierungen, es befinden sich auch einige Fehler innerhalb
     der Liste."

Dieser Kasten wird mitgelesen und in _meta.warnung abgelegt, und die
Oberflaeche zeigt ihn an. Solange er dasteht, gilt fuer die Anzeige:

  * Ein Treffer heisst "war Anfang 2026 in GO verfuegbar" — das haelt,
    weil GO Arten praktisch nie wieder entfernt.
  * KEIN Treffer heisst "steht nicht in dieser Liste (Stand Anfang
    2026)", NICHT "gibt es in GO nicht". Alles ab 2026 fehlt hier
    systematisch.

Ein hartes Nein waere aus dieser Datei nicht belegbar, und deshalb darf
die Oberflaeche keines anzeigen. Der Test
tests/unit/test-champions-raster.js haelt genau das fest.

Netz: pokewiki blockt allgemeine Bots; hier laeuft es wie beim
Sprite-Scraper mit Browser-Kennung in CI. Fail-soft — schlaegt der Lauf
fehl, bleibt die eingecheckte Datei stehen.
"""

import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUS = os.path.join(ROOT, "data", "pokemon_go_liste.json")

URL = ("https://www.pokewiki.de/"
       "Liste_der_Pok%C3%A9mon_in_Pok%C3%A9mon_GO")
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124 Safari/537.36"}

# Die Regionalformen, die im Champions-Roster vorkommen. Andere Formen
# der Seite (Rotom-Varianten, Wetterformen, Umhaenge) sind fuer das
# Raster ohne Belang und werden nicht gefuehrt.
REGIONEN = {
    "Alola-Form": "alola",
    "Galar-Form": "galar",
    "Hisui-Form": "hisui",
    "Paldea-Form": "paldea",
    "Gefechtvariante": "paldea",
    "Flammenvariante": "paldea",
    "Flutenvariante": "paldea",
}

MINDESTZEILEN = 800  # gemessen 09.09.2026: 1068


def _hole(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def _entkerne(html):
    """Grobe Textfassung einer Tabellenzelle."""
    t = re.sub(r"<[^>]+>", "\n", html)
    t = (t.replace("&nbsp;", " ").replace("&amp;", "&")
          .replace("&#160;", " ").replace("&quot;", '"'))
    return re.sub(r"\s+", " ", t).strip()


def zerlege(html):
    """Die eine grosse sortierbare Tabelle der Seite auslesen."""
    warnung = ""
    m = re.search(r'<table[^>]*class="[^"]*veraltet[^"]*"[^>]*>(.*?)</table>',
                  html, re.S)
    if m:
        warnung = _entkerne(m.group(1))

    tabellen = re.findall(r"<table[^>]*>(.*?)</table>", html, re.S)
    beste, meiste = None, 0
    for t in tabellen:
        n = t.count("<tr")
        if n > meiste:
            beste, meiste = t, n
    if not beste:
        raise ValueError("keine Tabelle auf der Seite gefunden")

    basis, formen = set(), {}
    for zeile in re.findall(r"<tr[^>]*>(.*?)</tr>", beste, re.S):
        zellen = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", zeile, re.S)
        if len(zellen) < 3:
            continue
        nr = _entkerne(zellen[0])
        if not re.fullmatch(r"\d{1,4}", nr):
            continue
        dex = int(nr)
        roh = _entkerne(zellen[2])
        klammer = re.search(r"\(([^)]+)\)", roh)
        form = klammer.group(1).strip() if klammer else ""
        if not form:
            basis.add(dex)
        elif form in REGIONEN:
            formen.setdefault(REGIONEN[form], set()).add(dex)
    return basis, formen, warnung


def baue():
    basis, formen, warnung = zerlege(_hole(URL))
    if len(basis) < MINDESTZEILEN:
        raise ValueError(
            f"nur {len(basis)} Grundformen gelesen, erwartet mindestens "
            f"{MINDESTZEILEN} — die Seite hat sich geaendert oder der Abruf "
            f"war unvollstaendig")
    return {
        "_meta": {
            "zweck": "Arten, die laut PokeWiki in Pokemon GO verfuegbar sind.",
            "quelle": URL,
            "warnung": warnung,
            "lesart_treffer": "war zum Stand der Quelle in GO verfuegbar",
            "lesart_kein_treffer": "steht NICHT in dieser Liste — das ist kein "
                                   "Beleg dafuer, dass es die Art in GO nicht "
                                   "gibt. Die Quelle ist selbst als veraltet "
                                   "markiert; alles ab 2026 fehlt hier.",
            "grundformen": len(basis),
            "regionalformen": {k: len(v) for k, v in sorted(formen.items())},
        },
        "basis": sorted(basis),
        "regional": {k: sorted(v) for k, v in sorted(formen.items())},
    }


def main():
    try:
        daten = baue()
    except Exception as e:
        print(f"::warning::GO-Liste nicht geholt ({e}) — bestehende "
              f"{os.path.basename(AUS)} bleibt unveraendert")
        return 1
    with open(AUS, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write("\n")
    m = daten["_meta"]
    print(f"pokemon_go_liste.json: {m['grundformen']} Grundformen, "
          f"Regionalformen {m['regionalformen']}, "
          f"Warnung der Quelle: {'ja' if m['warnung'] else 'nein'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
