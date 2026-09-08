"""Ein Waechter, den niemand ruft, waecht nicht.

BEFUND (07.09.2026):

    $ grep -rn "datenluecken" .github/
    (0 Treffer)

`scripts/datenluecken.py` schreibt `data/datenluecken.json`, und der
Admin-Bereich der Seite liest genau diese Datei und meldet daraus
„0 Luecken". Aufgerufen wurde das Skript von keinem Arbeitsablauf. Der
ausgelieferte Stand trug `_meta.erzeugt = 2026-08-31T13:00:53Z` — sieben
Tage alt, waehrend die Dateien, ueber die er urteilt, taeglich neu
geschrieben werden (`champions_usage.json`: 07.09., `champions_speed_corpus.json`:
07.09.).

Die gemeldete Null war zufaellig noch richtig: nachgerechnet am 07.09.
findet der Lauf ebenfalls 0 Luecken. Das aendert nichts am Problem —
eine Zahl, die niemand nachrechnet, ist keine Messung mehr, sondern eine
Erinnerung. Beim naechsten Mal muss sie nicht stimmen.

ENTSCHEIDUNG: in den Wochenlauf aufnehmen, nicht die Anzeige entschaerfen.
Begruendung:

  * Der Lauf braucht kein Netz, keine Zugangsdaten und keine Vorstufe —
    er liest ausschliesslich Dateien aus data/ und ist in Sekunden fertig.
  * Er gehoert vor den Commit, weil er ueber Dateien urteilt, die der
    Wochenlauf selbst gerade erneuert hat.
  * Er meldet nur und schreibt eine Datei; er kann den Lauf nicht
    abbrechen und nichts verschlechtern.

Die Anzeige ehrlicher zu machen, waere die teurere und schwaechere
Loesung gewesen: sie haette den Aufwand ins Frontend verschoben und die
Zahl trotzdem alt gelassen.
"""

import json
import os
import re

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
WOCHENLAUF = os.path.join(WURZEL, ".github", "workflows", "weekly-full-update.yml")
BERICHT = os.path.join(WURZEL, "data", "datenluecken.json")
SKRIPT = os.path.join(WURZEL, "scripts", "datenluecken.py")


@pytest.fixture(scope="module")
def wochenlauf():
    with open(WOCHENLAUF, encoding="utf-8") as f:
        return f.read()


def test_der_wochenlauf_ruft_den_waechter(wochenlauf):
    assert "scripts/datenluecken.py" in wochenlauf, (
        "kein Arbeitsablauf ruft scripts/datenluecken.py — data/datenluecken.json "
        "altert still, und der Admin-Bereich meldet eine Zahl von damals")


def _ruf_zeile(wochenlauf):
    """Die `run:`-Zeile, die den Waechter wirklich startet — nicht seine
    Erwaehnung im Kommentar darueber."""
    m = re.search(r"^\s*python3 scripts/datenluecken\.py.*$", wochenlauf, re.M)
    assert m, "keine Aufrufzeile fuer scripts/datenluecken.py im Wochenlauf"
    return m


def test_er_laeuft_vor_dem_commit(wochenlauf):
    """Nach dem Commit gemessen, landet das Ergebnis erst eine Woche
    spaeter auf der Seite."""
    ruf = _ruf_zeile(wochenlauf).start()
    commit = re.search(r"^\s*-\s*name:\s*Commit\b", wochenlauf, re.M)
    assert commit, "kein Commit-Schritt im Wochenlauf gefunden"
    assert ruf < commit.start(), (
        "datenluecken.py laeuft nach dem Commit — das Ergebnis wuerde erst "
        "im naechsten Lauf ausgeliefert")


def test_der_waechter_darf_den_lauf_nicht_abbrechen(wochenlauf):
    """Ein Hinweisgeber, der den Wochenlauf killt, kostet mehr als er
    einbringt — dieselbe Regel wie beim ace-spec-Schritt darueber."""
    zeile = _ruf_zeile(wochenlauf).group(0)
    assert "|| true" in zeile or "continue-on-error" in wochenlauf[
        _ruf_zeile(wochenlauf).start() - 1200:_ruf_zeile(wochenlauf).start()], (
        "der Schritt kann den Wochenlauf abbrechen — er soll nur melden: "
        + zeile.strip())


def test_der_ausgelieferte_bericht_ist_in_sich_stimmig():
    """`anzahl` muss zu `luecken` passen, sonst zeigt der Admin-Bereich
    eine Zahl, die nicht zur Liste darunter gehoert."""
    with open(BERICHT, encoding="utf-8") as f:
        d = json.load(f)
    assert d["_meta"]["anzahl"] == len(d["luecken"]), (
        f"_meta.anzahl={d['_meta']['anzahl']}, aber {len(d['luecken'])} Luecken "
        "in der Liste")
    je_klasse = d["_meta"].get("jeKlasse") or {}
    assert sum(je_klasse.values()) == d["_meta"]["anzahl"], (
        "die Summe ueber jeKlasse passt nicht zu _meta.anzahl")
    assert d["_meta"]["erzeuger"] == "scripts/datenluecken.py"


def test_der_waechter_kommt_ohne_netz_aus():
    """Deshalb darf er ueberhaupt in den Wochenlauf: er liest Dateien,
    er holt nichts."""
    with open(SKRIPT, encoding="utf-8") as f:
        quelle = f.read()
    for verboten in ("import requests", "urllib.request", "cloudscraper",
                     "httpx", "aiohttp"):
        assert verboten not in quelle, (
            f"datenluecken.py benutzt {verboten} — dann ist es kein reiner "
            "Dateilauf mehr und gehoert nicht ungebremst in den Wochenlauf")
