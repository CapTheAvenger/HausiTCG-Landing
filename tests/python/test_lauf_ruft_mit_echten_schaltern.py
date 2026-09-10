"""Der Lauf ruft die Scraper nur mit Schaltern auf, die es wirklich gibt.

WARUM ES DIESE DATEI GIBT
-------------------------
Am 10.09.2026 habe ich den Online-Einzellisten-Scraper in den Di/Fr-Lauf
aufgenommen — und ihn mit `--resume` aufgerufen. Den Schalter gibt es
dort nicht. Lauf #134 endete mit

    limitless_online_decklist_scraper exited with 2

Das ist argparse mit "unrecognized argument". Der Schritt war als nicht
blockierend gebaut, der Lauf lief also durch und meldete den Ausfall nur
in der Bilanz — anderthalb Zeilen unter 26 Schritten. Ohne die
Frischepruefung, die im selben Lauf "1 Erzeuger stumm" schrieb, waere es
niemandem aufgefallen.

Ein falscher Schalter ist der billigste Fehler dieser Art und der
aergerlichste: er kostet einen ganzen Lauf und sieht nach nichts aus.
Diese Datei liest die Aufrufe aus dem Ablauf und haelt sie gegen die
`add_argument`-Zeilen des jeweiligen Skripts.
"""

import ast
import os
import re

import pytest

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ABLAUF = os.path.join(WURZEL, ".github", "workflows", "weekly-full-update.yml")

# Ein Aufruf im Ablauf: python[3] <pfad.py> [schalter ...]
AUFRUF = re.compile(
    r"^\s*python3?\s+((?:backend|scripts|tools)/[\w/]+\.py)([^\n|]*)", re.M)


def _erlaubte_schalter(pfad):
    """Alle langen Schalter, die das Skript kennt — aus dem Quelltext,
    nicht aus einem Lauf. `--help` und `-h` kennt argparse immer."""
    with open(pfad, encoding="utf-8-sig") as fh:
        quelle = fh.read()
    erlaubt = {"--help"}
    for m in re.finditer(r"add_argument\(\s*([^)]*)", quelle, re.S):
        for name in re.findall(r"[\"'](--[\w\-]+)[\"']", m.group(1)):
            erlaubt.add(name)
    return erlaubt


def _aufrufe():
    with open(ABLAUF, encoding="utf-8") as fh:
        text = fh.read()
    heraus = []
    for m in AUFRUF.finditer(text):
        pfad, rest = m.group(1), m.group(2)
        # Shell-Variablen ($args, ${{ ... }}) sind zur Laufzeit belegt und
        # hier nicht aufloesbar — solche Aufrufe bleiben draussen.
        if "$" in rest:
            continue
        schalter = re.findall(r"(?<!\w)(--[\w\-]+)", rest)
        heraus.append((pfad, schalter))
    return heraus


def test_es_gibt_ueberhaupt_aufrufe_zu_pruefen():
    aufrufe = _aufrufe()
    assert len(aufrufe) >= 5, (
        f"nur {len(aufrufe)} pruefbare Aufrufe im Ablauf gefunden — dann "
        "greift dieser Test ins Leere und das Muster passt nicht mehr")


@pytest.mark.parametrize("pfad,schalter", _aufrufe(),
                         ids=[f"{p}{' '.join(s)}" for p, s in _aufrufe()])
def test_jeder_schalter_existiert(pfad, schalter):
    voll = os.path.join(WURZEL, pfad)
    if not os.path.exists(voll):
        pytest.fail(f"der Ablauf ruft {pfad} auf — die Datei gibt es nicht")
    try:
        ast.parse(open(voll, encoding="utf-8-sig").read())
    except SyntaxError as e:
        pytest.fail(f"{pfad} laesst sich nicht lesen: {e}")
    if not schalter:
        return
    erlaubt = _erlaubte_schalter(voll)
    if not erlaubt - {"--help"}:
        pytest.skip(f"{pfad} nimmt keine benannten Schalter entgegen")
    unbekannt = sorted(s for s in schalter if s not in erlaubt)
    assert not unbekannt, (
        f"{pfad} kennt {', '.join(unbekannt)} nicht. argparse endet dann "
        f"mit Rueckgabewert 2, und der Schritt liefert keine Zeile Daten. "
        f"Bekannt sind: {', '.join(sorted(erlaubt))}")
