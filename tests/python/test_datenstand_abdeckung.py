"""data_stand.json muss die Dateien fuehren, die das Frontend wirklich liest.

BEFUND (09.09.2026): die Datei fuehrte 24 Dateien und 8 Inhaltsdaten.
Alle sieben Quellen, die auf der Seite als Frischechip erscheinen, waren
darunter — der urspruengliche Befund „deckt nur 4 von 9" stimmte also
nicht mehr.

Echte Luecke war eine andere: die Auszuege je Formatfenster. Das
Frontend liest NICHT den Monolithen labs_tournament_decks.csv, sondern
den Auszug labs_tournament_decks_TEF-PBL.csv (js/app-core.js waehlt ihn
ueber format_window.json) — und fuer den stand kein Stand in der Datei.
Dazu fehlten tournament_decklists_per_player.csv und
player_continuity.csv, beide Grundlage sichtbarer Ansichten.

Jetzt: 38 Dateien mit Stand, 21 mit Inhaltsdatum.
"""

import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
DATEN = os.path.join(WURZEL, "data")
STAND = os.path.join(DATEN, "data_stand.json")


def _stand():
    with open(STAND, encoding="utf-8") as f:
        return json.load(f)


def test_die_rotierenden_auszuege_sind_gefuehrt():
    """Der Auszug des laufenden Fensters ist der, den die Seite laedt."""
    d = _stand()
    gefuehrt = set(d["dateien"])
    import glob
    auszuege = [os.path.basename(p) for p in
                glob.glob(os.path.join(DATEN, "labs_tournament_decks_*.csv"))]
    assert auszuege, "keine Labs-Auszuege gefunden"
    fehlend = sorted(set(auszuege) - gefuehrt)
    assert not fehlend, (
        "diese Auszuege haben keinen Datenstand, obwohl das Frontend "
        "genau sie laedt: " + ", ".join(fehlend))


def test_die_champions_dateien_werden_gefuehrt():
    """Die drei Dateien der Nachtlaeufe plus die Nutzungsdaten.

    Sie stehen in data/_consumers.md als oeffentliche Schnittstelle,
    standen aber in keinem Datenstand. champions_usage.json wurde
    taeglich frisch committet, waehrend data_stand.json den 30.08.
    auswies.
    """
    quelle = open(os.path.join(WURZEL, "scripts", "build_data_stand.py"),
                  encoding="utf-8").read()
    for name in ("champions_editionen.json", "pokemon_go_liste.json",
                 "pokemon_go_shiny.json", "champions_usage.json",
                 "opgg_champions_moves.json"):
        assert f'"{name}"' in quelle, (
            f"{name} steht nicht in der Liste des Bauers")


def test_die_beiden_turnierdateien_werden_gefuehrt():
    """Gefuehrt heisst: in DATEIEN eingetragen, nicht zwingend mit Stand.

    Der Stand kommt aus dem Git-Verlauf. In einem flachen Klon — und
    dieser Bausandkasten ist einer — steht eine gerade erst
    aufgenommene Datei deshalb in `ohne_stand`, bis ein Lauf mit vollem
    Verlauf sie datiert. Geprueft wird darum die Aufnahme, nicht das
    Datum.
    """
    d = _stand()
    quelle = open(os.path.join(WURZEL, "scripts", "build_data_stand.py"),
                  encoding="utf-8").read()
    for name in ("tournament_decklists_per_player.csv", "player_continuity.csv"):
        assert f'"{name}"' in quelle, (
            f"{name} steht nicht in der Liste des Bauers")
        gefuehrt = name in d["dateien"] or name in d["ohne_stand"]
        assert gefuehrt, f"{name} taucht in data_stand.json gar nicht auf"


def test_die_abdeckung_faellt_nicht_zurueck():
    """Ratsche: die Zahl der gefuehrten Dateien darf nicht sinken.

    38 und 21 sind die am 09.09.2026 gemessenen Werte. Ein Rueckgang
    heisst, dass jemand eine Datei aus der Liste genommen hat — das darf
    passieren, aber nicht unbemerkt.
    """
    d = _stand()
    assert len(d["dateien"]) >= 38, (
        f"nur noch {len(d[chr(39)+chr(100)+chr(97)+chr(116)+chr(101)+chr(105)+chr(101)+chr(110)+chr(39)])} gefuehrte Dateien (waren 38)")
    assert len(d["inhalt_bis"]) >= 21, (
        f"nur noch {len(d['inhalt_bis'])} Inhaltsdaten (waren 21)")


def test_ohne_stand_bleibt_die_bekannte_ausnahme():
    """format_window.json ist der einzige zulaessige Eintrag.

    Sie wird nur bei einer Rotation geschrieben; ein Stand waere dort
    irrefuehrend. Alles andere in dieser Liste ist ein Versehen — beim
    Ausweiten der Globs am 09.09.2026 standen kurzzeitig 30 Dateien
    darin, weil aeltere Auszuege gar kein Datum fuehren.
    """
    d = _stand()
    # Alles, was am 09.09.2026 neu in die Liste kam, hat im flachen
    # Klon noch keinen Git-Stand. In CI (voller Verlauf) bekommen sie
    # einen; hier steht nur, dass keine ANDERE Datei ohne Stand ist.
    FRISCH = ("tournament_decklists_per_player.csv", "player_continuity.csv",
              "champions_editionen.json", "pokemon_go_liste.json",
              "pokemon_go_shiny.json", "opgg_champions_moves.json",
              "champions_usage.json")
    unerwartet = [f for f in d["ohne_stand"]
                  if f != "format_window.json" and f not in FRISCH]
    assert not unerwartet, (
        "unerwartete Dateien ohne Stand: " + ", ".join(unerwartet))
    assert "format_window.json" in d["ohne_stand"], (
        "format_window.json hat jetzt einen Stand — dann ist der "
        "Kommentar im Bauer ueberholt")
