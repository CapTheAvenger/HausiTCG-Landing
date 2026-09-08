"""Warum der Wochenlauf die Ace-Spec-Reparatur nur MELDEN laesst.

FRAGE (07.09.2026): `data/ace_specs.json` traegt `timestamp` =
2026-02-18 und ist seither unveraendert. Der Wochenlauf fuehrt
`scripts/repariere_ace_spec.py --melden`
(`.github/workflows/weekly-full-update.yml`) — er meldet also nur und
schreibt nie. Soll der Schalter fallen?

ANTWORT: nein. Trockenlauf am 07.09.2026, ueber 22 Dateien und
659.506 Zeilen:

    Gesamt: Yes 22961, No 635644, leer 901 — 0 Felder geaendert.
    is_ace_spec: keine Drift — 22 Dateien, 659506 Zeilen geprueft.

`--schreiben` haette also nichts zu schreiben. Der Schalter umzulegen
wuerde kein Feld reparieren und dafuer den Weg oeffnen, dass ein Lauf
ohne Aufsicht 659.506 Zeilen anfasst — genau das, was CLAUDE.md mit
„Report, don't silently repair" ausschliesst.

Der alte Zeitstempel ist auch kein Alarm. Die Liste ist fuer das
aktuelle Format vollstaendig: in
`tournament_cards_data_cards_TEF-PBL.csv` sind alle 879 Zeilen
entschieden (41 Yes, 838 No, **0 leer**). Unentschieden bleiben 901
Zeilen in aelteren Formaten; die 13 haeufigsten Namen darunter
(`Team Yell's Cheer` 348x, `Ruffian` 100x, `Roseanne's Backup` 91x,
`Justified Gloves` 64x …) fuehrt `all_cards_merged.csv` als Supporter,
Item oder Tool mit gewoehnlichen Seltenheiten — kein Hinweis auf einen
uebersehenen Ace Spec. Positiv belegen laesst sich das dort nicht: die
Kartendatenbank fuehrt ueberhaupt kein Ace-Spec-Kennzeichen
(`grep -ic "ace spec" data/all_cards_merged.csv` → 0). Genau deshalb
laesst der Reparaturlauf diese Felder leer, statt sie zu raten.

Geschrieben wird weiterhin von Hand ueber den Workflow „Daten
reparieren" (ace-spec-reparatur.yml) mit seinem `schreiben`-Eingang.
"""

import csv
import collections
import json
import os
import re

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
DATEN = os.path.join(WURZEL, "data")
WOCHENLAUF = os.path.join(WURZEL, ".github", "workflows", "weekly-full-update.yml")
REPARATUR = os.path.join(WURZEL, ".github", "workflows", "ace-spec-reparatur.yml")


def test_der_wochenlauf_meldet_und_schreibt_nicht():
    with open(WOCHENLAUF, encoding="utf-8") as f:
        w = f.read()
    ruf = re.search(r"^\s*python3 scripts/repariere_ace_spec\.py.*$", w, re.M)
    assert ruf, "der Wochenlauf ruft repariere_ace_spec.py nicht mehr"
    zeile = ruf.group(0)
    assert "--melden" in zeile, f"Schalter geaendert: {zeile.strip()}"
    assert "--schreiben" not in zeile, (
        "der Wochenlauf schreibt jetzt selbst — der Trockenlauf am 07.09.2026 "
        "fand 0 zu aendernde Felder, das gaebe keinen Gewinn und viel Risiko: "
        + zeile.strip())


def test_geschrieben_wird_von_hand_und_mit_schalter():
    """Der schreibende Weg muss existieren — sonst waere „nur melden"
    eine Sackgasse statt einer Arbeitsteilung."""
    assert os.path.exists(REPARATUR), "ace-spec-reparatur.yml fehlt"
    with open(REPARATUR, encoding="utf-8") as f:
        r = f.read()
    assert "workflow_dispatch" in r, "der Reparaturlauf ist nicht von Hand ausloesbar"
    assert "schreiben" in r, "der Reparaturlauf hat keinen Schreib-Eingang"
    assert "repariere_ace_spec" in r


def test_die_ace_spec_liste_deckt_das_aktuelle_format_vollstaendig_ab():
    """Der eigentliche Grund, warum der alte Zeitstempel kein Problem ist.

    Faellt dieser Test um, ist die Liste hinter der Rotation zurueck —
    dann ist `ace_specs.json` nachzuziehen, und erst DANN stellt sich die
    Schalterfrage neu.
    """
    pfad = os.path.join(DATEN, "tournament_cards_data_cards_TEF-PBL.csv")
    c = collections.Counter()
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            c[(r.get("is_ace_spec") or "").strip()] += 1
    assert c[""] == 0, (
        f"{c['']} Zeile(n) im aktuellen Format sind unentschieden — die "
        "Ace-Spec-Liste hinkt der Rotation hinterher")
    assert c["Yes"] > 0 and c["No"] > 0, dict(c)


def test_die_liste_ist_da_und_lesbar():
    with open(os.path.join(DATEN, "ace_specs.json"), encoding="utf-8") as f:
        d = json.load(f)
    assert d["total_count"] == len(d["ace_specs"]), (
        "total_count passt nicht zur Liste")
    assert d["total_count"] >= 39, (
        f"die Liste ist auf {d['total_count']} Eintraege geschrumpft")
    assert d.get("source", "").startswith("http")
