"""Zwei Spalten heissen `deck_slug` und meinen nicht dasselbe.

BEFUND (10.09.2026). Beide Dateien fuehren eine Spalte dieses Namens:

    tournament_decklists_per_player.csv   24442, 25592, 26263  (Kennung)
    labs_tournament_decks.csv             alakazam-dudunsparce (Namensschluessel)

Ein Verbund darueber ergibt 0 Treffer — 934 verschiedene Werte gegen 267,
Schnittmenge leer. Und genau das ist die Falle: eine leere Ergebnismenge
sieht aus wie "diese Woche gab es keine Uebereinstimmung" und nicht wie
"diese beiden Spalten sind nicht dasselbe Ding".

Der Verbund, der traegt, laeuft ueber die Namen:

    decklists.deck_archetype  ==  labs.deck_name        52 von 53

Ein Umbenennen waere sauberer und ist genau das, was data/_consumers.md
verbietet: die Spaltennamen sind veroeffentlicht, ein anderes Projekt
liest sie. Also steht die Warnung dort, und diese Datei haelt sie fest.

WAS HIER NICHT GEPRUEFT WIRD: welche Archetypen es diese Woche sind und
wie viele. Geprueft werden zwei Eigenschaften — dass die
gleichnamigen Spalten sich weiterhin NICHT ueberschneiden, und dass der
Namensverbund weiterhin die grosse Mehrheit trifft. Faellt die erste,
hat sich eine Quelle geaendert und die Warnung gehoert ueberdacht statt
repariert; das steht so im Fehlertext.
"""

import csv
import io
import os

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOK = os.path.join(WURZEL, "data", "_consumers.md")


def _lies(name):
    pfad = os.path.join(WURZEL, "data", name)
    with io.open(pfad, encoding="utf-8-sig", newline="") as fh:
        kopf = fh.readline()
        trenn = ";" if kopf.count(";") > kopf.count(",") else ","
        fh.seek(0)
        return list(csv.DictReader(fh, delimiter=trenn))


DECKLISTEN = _lies("tournament_decklists_per_player.csv")
LABS = _lies("labs_tournament_decks.csv")


def _menge(zeilen, spalte):
    return {(z.get(spalte) or "").strip() for z in zeilen} - {""}


def test_beide_dateien_haben_ueberhaupt_zeilen():
    """Vorpruefung gegen ein leeres Bestehen."""
    assert len(DECKLISTEN) > 100, f"nur {len(DECKLISTEN)} Decklisten-Zeilen"
    assert len(LABS) > 100, f"nur {len(LABS)} Labs-Zeilen"


def test_die_gleichnamigen_spalten_ueberschneiden_sich_nicht():
    a = _menge(DECKLISTEN, "deck_slug")
    b = _menge(LABS, "deck_slug")
    assert a and b, "eine der beiden deck_slug-Spalten ist leer"
    gemeinsam = a & b
    assert not gemeinsam, (
        f"die beiden deck_slug-Spalten ueberschneiden sich jetzt in "
        f"{len(gemeinsam)} Werten. Das ist KEIN Fehler, den man repariert: "
        f"eine der Quellen hat ihre Schreibweise geaendert. Die Warnung in "
        f"data/_consumers.md gehoert dann ueberdacht — und moeglicherweise "
        f"ist der Verbund ueber deck_slug jetzt der richtige. "
        f"Beispiele: {sorted(gemeinsam)[:3]}"
    )


def test_der_namensverbund_traegt():
    archetypen = _menge(DECKLISTEN, "deck_archetype")
    namen = _menge(LABS, "deck_name")
    assert archetypen, "deck_archetype ist leer"
    treffer = archetypen & namen
    # Eine Gleichung gegen die Dateien selbst, kein Wochenwert: der
    # Verbund muss die grosse Mehrheit treffen, sonst ist er auch keiner.
    # Welche Archetypen das sind, ist der Pruefung egal.
    anteil = len(treffer) / len(archetypen)
    assert anteil >= 0.9, (
        f"der Namensverbund trifft nur {len(treffer)} von {len(archetypen)} "
        f"Archetypen ({anteil:.0%}) — dann ist er als empfohlener Weg nicht "
        f"mehr haltbar. Ohne Gegenstueck: "
        f"{sorted(archetypen - namen)[:5]}"
    )


def test_die_warnung_steht_in_der_schnittstellenbeschreibung():
    """data/_consumers.md ist die veroeffentlichte Schnittstelle. Wer die
    Dateien von aussen liest, sieht nur sie."""
    with io.open(DOK, encoding="utf-8") as f:
        text = f.read()
    assert "deck_slug" in text, (
        "_consumers.md warnt nicht mehr vor den zwei gleichnamigen Spalten"
    )
    assert "deck_archetype" in text and "deck_name" in text, (
        "_consumers.md nennt den Verbund nicht, der stattdessen traegt"
    )
