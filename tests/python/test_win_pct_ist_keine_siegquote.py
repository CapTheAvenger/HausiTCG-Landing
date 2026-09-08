"""Die Spalte, die heisst wie das eine und ist das andere.

Befund vom 08.09.2026: `win_pct` in den labs-Dateien fuehrt die
MATCHPUNKTE-Quote (3S + U) / (3 * Partien), nicht die Siegquote
S / (S + N + U). Die Feldbeschreibung sagte "Siegquote in Prozent".

Gekostet hat das einen falsch veroeffentlichten Gegentest: das
Kandidatenmodell (Online, Konvention mitUnentschieden) wurde gegen
`win_pct` (Matchpunkte) gestellt. Gemeldet wurde eine Verzerrung von
+1,94 Punkten; nach Umrechnung auf dieselbe Konvention sind es -1,62.
Vorzeichen und Betrag falsch, und niemand haette es gemerkt, weil beide
Spalten nach Prozent aussehen.

Anders als `online_api_archetypes.csv` traegt diese Datei keine Spalte
`win_rate_convention`. Die Beschreibung ist die einzige Warnung, die es
gibt — deshalb haelt dieser Test beides fest: die Rechnung IN den Daten,
und den Satz, der davor warnt.
"""

import csv
import os

import pytest

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATEN = os.path.join(WURZEL, "data")
BESCHREIBUNG = os.path.join(DATEN, "labs_tournament_decks.felder.md")


def _zeilen(name):
    pfad = os.path.join(DATEN, name)
    if not os.path.exists(pfad):
        pytest.skip(f"{name} fehlt")
    with open(pfad, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _bilanz(zeile, praefix=""):
    try:
        s = int(zeile[praefix + "wins"])
        n = int(zeile[praefix + "losses"])
        u = int(zeile[praefix + "ties"])
    except (KeyError, ValueError, TypeError):
        return None
    return (s, n, u) if s + n + u > 0 else None


@pytest.mark.parametrize("datei,mindestens", [
    ("labs_tournament_decks.csv", 500),
    # Das aktuelle Fenster fuehrt genau ein Praesenzturnier (Worlds, 46 Zeilen).
    ("labs_tournament_decks_TEF-PBL.csv", 30),
])
def test_win_pct_ist_die_matchpunkte_quote(datei, mindestens):
    """Nicht die Beschreibung glauben — nachrechnen."""
    treffer = abweichler = 0
    schlimmster = (0.0, None)
    for z in _zeilen(datei):
        b = _bilanz(z)
        if not b:
            continue
        s, n, u = b
        partien = s + n + u
        try:
            datei_wert = float(z["win_pct"])
        except (KeyError, ValueError, TypeError):
            continue
        matchpunkte = (3 * s + u) / (3 * partien) * 100
        abstand = abs(datei_wert - matchpunkte)
        if abstand > 0.01:
            abweichler += 1
            if abstand > schlimmster[0]:
                schlimmster = (abstand, z.get("deck_name"))
        treffer += 1
    assert treffer >= mindestens, f"{datei}: zu wenige pruefbare Zeilen ({treffer}, erwartet >= {mindestens})"
    assert abweichler == 0, (
        f"{datei}: {abweichler} von {treffer} Zeilen folgen NICHT der "
        f"Matchpunkte-Quote (schlimmste Abweichung {schlimmster[0]:.3f} bei "
        f"{schlimmster[1]!r}). Entweder hat sich die Konvention der Quelle "
        f"geaendert — dann gehoert das in die Feldbeschreibung und in "
        f"js/win-rate-konvention.js — oder die Datei ist kaputt."
    )


def test_die_beiden_konventionen_gehen_wirklich_auseinander():
    """Ohne diesen Abstand waere die Verwechslung folgenlos — und der
    Test oben liesse sich mit S/(S+N+U) genauso erfuellen."""
    groesster = 0.0
    for z in _zeilen("labs_tournament_decks_TEF-PBL.csv"):
        b = _bilanz(z)
        if not b:
            continue
        s, n, u = b
        partien = s + n + u
        if partien < 100:
            continue
        groesster = max(groesster, abs((3 * s + u) / (3 * partien) - s / partien) * 100)
    assert groesster > 2.0, (
        "Die beiden Konventionen liegen hier weniger als 2 Punkte auseinander "
        f"(groesster Abstand {groesster:.2f}) — dann traegt die Warnung nicht "
        "mehr, und dieser Test misst nichts."
    )


def test_beschreibung_warnt_vor_der_verwechslung():
    with open(BESCHREIBUNG, encoding="utf-8") as f:
        text = f.read()
    abschnitt = text.split("`win_pct`", 1)
    assert len(abschnitt) > 1, "Die Feldbeschreibung erwaehnt win_pct nicht mehr"
    umfeld = abschnitt[1][:1800]
    # Nicht nur das Wort: die Formel. Ein Leser, der wissen will, WAS die
    # Spalte rechnet, braucht sie — und ein Umformulierer kann sie nicht
    # versehentlich stehenlassen, waehrend er die Aussage dreht.
    assert "(3·S + U)" in umfeld or "(3S + U)" in umfeld, (
        "Die Beschreibung von win_pct nennt die Formel (3·S + U) / (3 · Partien) "
        "nicht — genau die Luecke, die den falschen Gegentest ermoeglicht hat"
    )
    assert "S / (S + N + U)" in umfeld, (
        "Die Beschreibung nennt die Siegquote nicht, gegen die abzugrenzen ist"
    )
    assert "KEINE Siegquote" in umfeld, (
        "Die Beschreibung sagt nicht mehr ausdruecklich, dass win_pct KEINE "
        "Siegquote ist. Ein Leser, der nur den Spaltennamen sieht, nimmt an, "
        "sie waere eine."
    )
    assert "win_rate_convention" in umfeld, (
        "Der Hinweis fehlt, dass diese Datei — anders als "
        "online_api_archetypes.csv — keine Konventionsspalte fuehrt"
    )
