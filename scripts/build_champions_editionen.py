#!/usr/bin/env python3
"""data/champions_editionen.json — in welchen Hauptreihen-Editionen ein
Champions-Pokemon vorkommt.

QUELLE: der PokeAPI-CSV-Abzug auf GitHub, denselben, den
scripts/build_champions_resources.py schon fuer die deutschen Namen
benutzt. Gelesen werden pokemon_game_indices.csv (welcher Eintrag steht
in welcher Edition), versions.csv und version_names.csv (Anzeigename je
Sprache).

WAS DIE DATEI *NICHT* SAGT: sie sagt "kommt vor", nicht "ist dort
fangbar". Ein Pokemon kann in einer Edition im Dex stehen und nur ueber
Tausch oder Entwicklung erreichbar sein. Die Oberflaeche muss das so
benennen — "kommt vor in", nicht "zu fangen in".

ZWEI EDITIONEN SIND AUSGESCHLOSSEN, mit Messung:

    Nachgezaehlt am 09.09.2026 ueber den Abzug:
      scarlet         733 Eintraege
      legends-za      733 Eintraege   <- Menge IDENTISCH mit scarlet
      mega-dimension  733 Eintraege   <- Menge IDENTISCH mit scarlet
      Differenz in beide Richtungen: 0

    Legends Z-A hat real einen deutlich kleineren Bestand als Karmesin/
    Purpur. Zwei Editionen mit exakt derselben Menge sind keine Messung,
    sondern eine kopierte Vorbelegung. Zum Vergleich, wo die Quelle
    traegt: sword 664 gegen scarlet 733, legends-arceus 664 gegen
    scarlet 733 — beide unterscheiden sich sauber.

    Waeren sie drin, stuende bei jedem Pokemon "auch in Legends Z-A",
    und das waere fuer den Leser nicht von einer echten Angabe zu
    unterscheiden. Sie stehen deshalb in AUSGESCHLOSSEN und werden in
    _meta genannt, statt still zu fehlen. Der Test
    tests/python/test_champions_editionen.py haelt beides fest: dass sie
    draussen sind, UND dass die Begruendung noch stimmt — sobald die
    Quelle echte Mengen liefert, wird er rot und die Sperre gehoert weg.

'champions' selbst fuehrt der Abzug mit 0 Eintraegen; die Edition ist
angelegt, aber nicht befuellt. Sie ist ohnehin nicht interessant: dass
ein Champions-Pokemon in Champions vorkommt, weiss der Leser.
"""

import json
import os
import sys
import urllib.request
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATEN = os.path.join(ROOT, "data")
POKEDEX = os.path.join(DATEN, "champions_pokedex.json")
AUS = os.path.join(DATEN, "champions_editionen.json")

CSV_BASIS = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv"

# Sprach-ID 6 = Deutsch, 9 = Englisch (language.csv des Abzugs).
DE, EN = "6", "9"

AUSGESCHLOSSEN = {
    "legends-za": "Menge identisch mit Karmesin — kopierte Vorbelegung, keine Messung",
    "mega-dimension": "Menge identisch mit Karmesin — kopierte Vorbelegung, keine Messung",
    "champions": "im Abzug angelegt, aber leer — und fuer diese Seite ohne Aussage",
    # Die japanischen Erstausgaben tragen im Deutschen DIESELBEN Namen wie
    # die internationalen ("Rot", "Blau"). Ohne diese Sperre stuende in der
    # Liste zweimal "Rot" nebeneinander, und der Leser haelt das fuer einen
    # Fehler — zu Recht, denn es ist dasselbe Spiel.
    "red-japan": "gleicher deutscher Name wie die internationale Ausgabe",
    "green-japan": "japanische Erstausgabe ohne eigene deutsche Fassung",
    "blue-japan": "gleicher deutscher Name wie die internationale Ausgabe",
}


def _hole(name):
    url = f"{CSV_BASIS}/{name}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read().decode("utf-8")


def _csv(text):
    import csv
    import io
    return list(csv.DictReader(io.StringIO(text)))


def _regionsschluessel(en_name):
    """'Hisuian Goodra' -> 'hisui'. Die Regionalformen des Rosters."""
    n = (en_name or "").lower()
    for wort, schluessel in (("alolan", "alola"), ("galarian", "galar"),
                             ("hisuian", "hisui"), ("paldean", "paldea")):
        if n.startswith(wort + " "):
            return schluessel
    return ""


def baue(datenverzeichnis=DATEN):
    versionen = {r["id"]: r["identifier"] for r in _csv(_hole("versions.csv"))}
    namen = defaultdict(dict)
    for r in _csv(_hole("version_names.csv")):
        namen[r["version_id"]][r["local_language_id"]] = r["name"]

    index = defaultdict(set)
    for r in _csv(_hole("pokemon_game_indices.csv")):
        kennung = versionen.get(r["version_id"])
        if not kennung or kennung in AUSGESCHLOSSEN:
            continue
        index[int(r["pokemon_id"])].add(r["version_id"])

    with open(POKEDEX, encoding="utf-8") as f:
        eintraege = json.load(f)["entries"]

    # Der Abzug schluesselt nach pokemon_id, und die ist fuer die
    # Grundform gleich der Pokedex-Nummer. Regional- und Mega-Formen
    # haben eigene, hoehere IDs — die interessieren hier nicht: gefragt
    # ist, in welchen Editionen die ART vorkommt.
    raus = {}
    for e in eintraege:
        dex = e["dex"]
        vids = sorted(index.get(dex, set()), key=lambda v: int(v))
        raus[str(dex)] = [{
            "schluessel": versionen[v],
            "de": namen[v].get(DE) or namen[v].get(EN) or versionen[v],
            "en": namen[v].get(EN) or versionen[v],
        } for v in vids]

    ohne = [d for d, v in raus.items() if not v]
    return {
        "_meta": {
            "zweck": "In welchen Hauptreihen-Editionen die Art vorkommt. "
                     "NICHT: wo sie fangbar ist — ein Eintrag kann auch nur "
                     "ueber Tausch oder Entwicklung erreichbar sein.",
            "quelle": CSV_BASIS + "/pokemon_game_indices.csv",
            "quelle_name": "PokeAPI-CSV-Abzug (dieselbe Quelle wie die "
                           "deutschen Namen in build_champions_resources.py)",
            "schluessel": "Pokedex-Nummer der Art, nicht der Form",
            "ausgeschlossen": AUSGESCHLOSSEN,
            "arten": len(raus),
            "ohne_eintrag": ohne,
        },
        "editionen": raus,
    }


def main():
    try:
        daten = baue()
    except Exception as e:  # fail-soft: die vorhandene Datei bleibt stehen
        print(f"::warning::Editionsaufbau fehlgeschlagen ({e}) — "
              f"bestehende {os.path.basename(AUS)} bleibt unveraendert")
        return 1
    leer = len(daten["_meta"]["ohne_eintrag"])
    gesamt = daten["_meta"]["arten"]
    if leer > gesamt * 0.1:
        print(f"::error::{leer} von {gesamt} Arten ohne Editionseintrag — "
              f"das riecht nach einem kaputten Abzug, nicht nach Datenlage. "
              f"Datei NICHT geschrieben.")
        return 1
    with open(AUS, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"champions_editionen.json: {gesamt} Arten, {leer} ohne Eintrag, "
          f"{os.path.getsize(AUS)//1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
