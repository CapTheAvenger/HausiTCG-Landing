"""Das Dokument verspricht eine Pruefung — gibt es sie auch?

BEFUND (10.09.2026)
-------------------
`data/_consumers.md` sagt woertlich:

    scripts/data_guardian.py verifies daily that EVERY file above
    exists and still has its required columns.

Gezaehlt: das Dokument beschrieb 17 Dateien, `CONSUMERS` im Waechter
fuehrte 10. **Sieben Zusicherungen gab es nur auf dem Papier** —
darunter `online_api_cards_<FORMAT>.csv`, die ueber
`backend/core/update_sets.py` den Riegel fuer `data/format_window.json`
traegt und damit den Formatschluessel der GANZEN Seite bestimmt.

Der Kommentar im Waechter sprach selbst von "diesen vier Dateien";
eingetragen waren zwei. Der Fehler ist also nicht Nachlaessigkeit,
sondern die Bauart: zwei Listen, die von Hand gleich gehalten werden
muessen, laufen auseinander, und niemand merkt es.

UND DIE GEGENRICHTUNG. `japanese_cards_database.csv` stand im
Waechtervertrag, aber in keinem Absatz des Dokuments — die Pruefung war
da, die Beschreibung fehlte.

WAS DIESER TEST HAELT
---------------------
Dass beide Listen deckungsgleich bleiben, in BEIDE Richtungen. Waechst
eine, faellt der Test, bis die andere nachzieht.

WAS ER NICHT HAELT
------------------
Ob der Waechter die Dateien inhaltlich richtig prueft. Mehrere Eintraege
stehen bewusst mit leerer `required`-Liste da (Semikolon-getrennte oder
JSON-Dateien, deren Spaltenpruefer hier das falsche Trennzeichen liest).
Geprueft wird dort Vorhandensein und Nicht-Leere — das steht so im
Waechter und ist eine bewusste Grenze, kein Versehen.
"""

import importlib.util
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOK = os.path.join(WURZEL, "data", "_consumers.md")
WAECHTER = os.path.join(WURZEL, "scripts", "data_guardian.py")


def _consumers():
    spec = importlib.util.spec_from_file_location("dg_vertrag", WAECHTER)
    m = importlib.util.module_from_spec(spec)
    sys.modules["dg_vertrag"] = m
    spec.loader.exec_module(m)
    return m.CONSUMERS


def _dokumentierte_dateien():
    """Die Dateinamen aus den `###`-Ueberschriften des Dokuments.

    Ueberschriften der Form ``### `name.csv``` — Platzhalter wie
    ``<FORMAT>`` werden auf den heutigen Formatschluessel gezogen, weil
    der Waechter die konkrete Datei fuehrt.
    """
    with open(DOK, encoding="utf-8") as f:
        text = f.read()
    namen = set()
    # BEIDE Ueberschriftenformen. Das Dokument fuehrt Dateien mal als
    # `### `name.json`` und mal als `## `name.json` — was sie tut`.
    # Beim ersten Anlauf las dieser Test nur die erste Form und meldete
    # fuenf Dateien als undokumentiert, die sehr wohl beschrieben sind
    # (champions_editionen, pokemon_go_liste, pokemon_go_shiny,
    # champions_resources). Ein Test, der die eigene Datei nicht lesen
    # kann, erzeugt Arbeit statt Sicherheit.
    for zeile in re.findall(r"^#{2,3}\s+`([^`]+)`", text, re.M):
        n = zeile.strip()
        if not re.search(r"\.(csv|json|md)$", n):
            continue
        namen.add(n)
    return namen


def _format_schluessel():
    """Der heutige Formatschluessel, aus den vorhandenen Dateien gelesen —
    nicht abgeschrieben."""
    for name in os.listdir(os.path.join(WURZEL, "data")):
        m = re.match(r"^online_api_cards_(.+)\.csv$", name)
        if m:
            return m.group(1)
    return None


def _entfalte(namen):
    """`<FORMAT>` durch den heutigen Schluessel ersetzen."""
    fs = _format_schluessel()
    out = set()
    for n in namen:
        out.add(n.replace("<FORMAT>", fs) if (fs and "<FORMAT>" in n) else n)
    return out


def test_das_dokument_beschreibt_ueberhaupt_dateien():
    """Vorpruefung gegen ein leeres Bestehen."""
    d = _dokumentierte_dateien()
    assert len(d) >= 10, f"nur {len(d)} Ueberschriften gefunden — Format geaendert?"


def test_jede_dokumentierte_datei_steht_im_waechter():
    dok = _entfalte(_dokumentierte_dateien())
    waechter = set(_consumers())
    fehlen = sorted(dok - waechter)
    assert not fehlen, (
        f"{len(fehlen)} Datei(en) stehen in data/_consumers.md, aber in "
        f"keinem Waechter — das Dokument sichert taegliche Pruefung zu, "
        f"die es fuer sie nicht gibt: {fehlen}")


def test_jede_geprueft_datei_steht_auch_im_dokument():
    """Die Gegenrichtung. Eine Datei, die geprueft wird, aber nirgends
    beschrieben ist, kann ein fremder Leser nicht benutzen."""
    dok = _entfalte(_dokumentierte_dateien())
    waechter = set(_consumers())
    fehlen = sorted(waechter - dok)
    assert not fehlen, (
        f"{len(fehlen)} Datei(en) stehen im Waechtervertrag, aber in "
        f"keinem Absatz von data/_consumers.md: {fehlen}")


def test_jede_vertragsdatei_existiert_wirklich():
    fehlen = [n for n in _consumers()
              if not os.path.exists(os.path.join(WURZEL, "data", n))]
    assert not fehlen, (
        f"Der Waechter fuehrt {len(fehlen)} Datei(en), die es nicht gibt: "
        f"{fehlen}. Bei den <FORMAT>-Dateien ist das der gewollte Fall nach "
        f"einer Rotation — dann gehoert der Eintrag nachgezogen, nicht "
        f"geloescht.")


def test_der_satz_im_dokument_steht_noch_da():
    """Faellt die Zusicherung weg, ist dieser Test gegenstandslos — dann
    soll er das sagen, statt still weiterzulaufen."""
    with open(DOK, encoding="utf-8") as f:
        text = f.read()
    assert re.search(r"data_guardian\.py.{0,120}(verifies|prueft)", text, re.S | re.I), (
        "Der Satz, dass data_guardian.py die Dateien taeglich prueft, steht "
        "nicht mehr in data/_consumers.md. Dann pruefen die Zusicherungen "
        "oben eine Zusage, die niemand mehr gibt.")
