"""Die Belegspalten der Matchup-CSV: `tagesfilter_quelle` und `ist_spiegel`.

WORUM ES GEHT. Die Datei fuehrt eine Spalte `day_filter` mit den Werten
'overall', 'day1' und 'day2'. Das ist eine Aussage ueber die Herkunft
jeder Zeile — und fuer 'day1' stimmt sie nicht.

GEMESSEN AM 07.09.2026 ueber alle data/labs_tournament_matchups*.csv:
alle 6.811 Zeilen mit day_filter='day1' sind in vs_count, vs_win_pct,
vs_wins, vs_losses und vs_ties identisch mit der 'overall'-Zeile
derselben Paarung. In TEF-PBL 811 von 811, in TEF-CRI 2.528 von 2.528,
in TEF-POR 3.472 von 3.472.

WELCHE DER BEIDEN ANSICHTEN DIE ECHTE IST — das ist die Frage, an der
man sich vertun kann, und beide Lesarten erklaeren die Identitaet:

  (a) 'day1' ist eine Kopie von 'overall', oder
  (b) 'overall' enthaelt in Wahrheit nur Tag 1.

Es ist (a), und zwar aus dem Aufbau der Abfrage: 'overall' wird OHNE
Flag geholt, es ist die Standardansicht der Seite. Eine Ansicht, die
man nicht anfordert, kann nicht gefiltert sein. 'day1' haengt `&d1` an —
ein Flag, das geraten wurde und das die Quelle ignoriert.

Die Gegenprobe steht in den Daten: in TEF-PBL sind alle 244
day2-Paarungen auch in 'overall' enthalten (244 von 244). Waere
'overall' nur Tag 1, muesste mindestens eine Paarung, die es nur im
Top Cut gab, dort fehlen.

Deshalb wird hier NICHT umgerechnet. Aus day1 und day2 eine Summe zu
bilden waere eine Zahl, die die Quelle nie geliefert hat. Was passiert,
ist Benennung: `tagesfilter_quelle` sagt je Zeile, ob hinter dem
Tagesfilter eine eigene Abfrage steht.

Bewusst ohne PyYAML und ohne Netz — dieselbe Falle wie in
test_tagesfilter_kopie.py: die CI installiert nur pytest, bs4, requests
und lxml, und der Deploy haengt am Test-Job.
"""

import csv
import glob
import os
import sys

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
DATEN = os.path.join(WURZEL, "data")
SCRAPER = os.path.join(WURZEL, "backend", "scrapers", "labs_tournament_scraper.py")

sys.path.insert(0, os.path.join(WURZEL, "backend", "scrapers"))
sys.path.insert(0, os.path.join(WURZEL, "backend", "core"))

VERGLEICHSFELDER = ("vs_count", "vs_win_pct", "vs_wins", "vs_losses", "vs_ties")
BILANZFELDER = ("vs_wins", "vs_losses", "vs_ties")


def _dateien():
    pfade = sorted(glob.glob(os.path.join(DATEN, "labs_tournament_matchups*.csv")))
    if not pfade:
        pytest.skip("keine labs_tournament_matchups*.csv im Bestand")
    return pfade


def _lies(pfad):
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _schluessel(z):
    return (z.get("meta", ""), z.get("my_deck_slug", ""), z.get("opponent_deck_slug", ""))


def _ganz(wert):
    try:
        return int(wert)
    except (TypeError, ValueError):
        return None


# ── Die Datei muss die Belegspalten fuehren ───────────────────────────

def test_jede_zeile_fuehrt_die_belegspalten():
    """Ohne die Spalten ist die Falschbeschriftung aus der Datei nicht sichtbar."""
    for pfad in _dateien():
        zeilen = _lies(pfad)
        if not zeilen:
            continue
        fehlend = {"ist_spiegel", "tagesfilter_quelle"} - set(zeilen[0].keys())
        assert not fehlend, (
            f"{os.path.basename(pfad)}: die Spalte(n) {sorted(fehlend)} fehlen. "
            f"Nachzutragen mit: python3 backend/scrapers/labs_tournament_scraper.py "
            f"--nur-tagesfilter-belegen"
        )


# ── Der Kern: eine Kopie darf nicht unbenannt als 'day1' dastehen ─────

def test_day1_das_eine_kopie_von_overall_ist_wird_auch_so_benannt():
    """Die Zusicherung, die ohne die Reparatur rot wird.

    Verboten ist nicht die Identitaet selbst — die kommt aus der Quelle
    und laesst sich von hier aus nicht heilen, solange das richtige Flag
    unbekannt ist. Verboten ist die UNBENANNTE Identitaet: eine Zeile,
    die 'day1' behauptet, Tag-1-Daten zu sein, in Wahrheit die
    Gesamtansicht ist und der Datei nicht ansehen laesst, dass sie es
    ist.
    """
    geprueft = 0
    for pfad in _dateien():
        zeilen = _lies(pfad)
        if not zeilen or "day_filter" not in zeilen[0]:
            continue
        overall = {_schluessel(z): z for z in zeilen if z.get("day_filter") == "overall"}
        # Nur Dateien mit Day-2-Zeilen: dort ist der Tagesscrape
        # ueberhaupt gelaufen, und nur dort ist die Frage gestellt.
        if not any(z.get("day_filter") == "day2" for z in zeilen):
            continue
        for z in zeilen:
            if z.get("day_filter") != "day1":
                continue
            gegen = overall.get(_schluessel(z))
            if gegen is None:
                continue
            ist_kopie = all(z.get(f) == gegen.get(f) for f in VERGLEICHSFELDER)
            if not ist_kopie:
                continue
            geprueft += 1
            assert z.get("tagesfilter_quelle") == "kopie_overall", (
                f"{os.path.basename(pfad)}: {z.get('my_deck_slug')} vs "
                f"{z.get('opponent_deck_slug')} steht als day_filter='day1' in "
                f"der Datei, ist aber in {list(VERGLEICHSFELDER)} identisch mit "
                f"der overall-Zeile — und traegt "
                f"tagesfilter_quelle={z.get('tagesfilter_quelle')!r} statt "
                f"'kopie_overall'. Wer day1 mit 0,35 gewichtet und day2 mit "
                f"0,45, zaehlt die Tag-2-Partien damit zweimal."
            )
    assert geprueft > 0, (
        "keine einzige day1-Zeile mit overall-Gegenstueck gefunden — dann "
        "prueft diese Zusicherung nichts mehr, und das ist selbst ein Befund."
    )


def test_kein_tagesfilter_behauptet_eine_quelle_die_er_nicht_hat():
    """Umgekehrte Richtung: 'abfrage' muss verdient sein.

    Eine day1-Zeile darf nur dann als eigene Abfrage gelten, wenn sie
    sich von der overall-Zeile tatsaechlich unterscheidet. Faellt diese
    Zusicherung um, weil day1 ploetzlich abweicht, ist der Scraper
    repariert — dann gehoert der Verband _day1IstKopie in
    js/app-meta-call.js entfernt.
    """
    for pfad in _dateien():
        zeilen = _lies(pfad)
        if not zeilen or "tagesfilter_quelle" not in zeilen[0]:
            continue
        overall = {_schluessel(z): z for z in zeilen if z.get("day_filter") == "overall"}
        for z in zeilen:
            if z.get("day_filter") != "day1":
                continue
            if z.get("tagesfilter_quelle") != "abfrage":
                continue
            gegen = overall.get(_schluessel(z))
            if gegen is None:
                continue
            assert any(z.get(f) != gegen.get(f) for f in VERGLEICHSFELDER), (
                f"{os.path.basename(pfad)}: {z.get('my_deck_slug')} vs "
                f"{z.get('opponent_deck_slug')} gilt als eigene Abfrage, ist "
                f"aber Feld fuer Feld die overall-Zeile."
            )


def test_overall_und_day2_gelten_immer_als_eigene_abfrage():
    """'overall' hat kein Flag, `&d2` ist am 25.05.2026 bestaetigt worden."""
    for pfad in _dateien():
        zeilen = _lies(pfad)
        if not zeilen or "tagesfilter_quelle" not in zeilen[0]:
            continue
        for z in zeilen:
            if z.get("day_filter") in ("overall", "day2"):
                assert z.get("tagesfilter_quelle") == "abfrage", (
                    f"{os.path.basename(pfad)}: eine Zeile mit "
                    f"day_filter={z.get('day_filter')!r} traegt "
                    f"tagesfilter_quelle={z.get('tagesfilter_quelle')!r}"
                )


# ── Spiegelpaarungen: richtige Zaehlweise, aber sie muss dastehen ─────

def test_abweichende_bilanz_kommt_ausschliesslich_von_spiegelpaarungen():
    """vs_count != W+L+T ist kein Zaehlfehler — aber nur im Spiegel.

    Gemessen am 07.09.2026: 80 von 80 solchen Zeilen sind
    Spiegelpaarungen. Taucht die Abweichung woanders auf, ist sie ein
    echter Befund und keine Zaehlweise.
    """
    for pfad in _dateien():
        for i, z in enumerate(_lies(pfad), start=2):
            c = _ganz(z.get("vs_count"))
            bilanz = [_ganz(z.get(f)) for f in BILANZFELDER]
            if c is None or any(b is None for b in bilanz):
                continue
            if c == sum(bilanz):
                continue
            assert z.get("my_deck_slug") == z.get("opponent_deck_slug"), (
                f"{os.path.basename(pfad)} Zeile {i}: vs_count={c}, aber "
                f"W+L+T={sum(bilanz)} — und es ist KEINE Spiegelpaarung "
                f"({z.get('my_deck_slug')} vs {z.get('opponent_deck_slug')}). "
                f"Das ist dann ein echter Zaehlfehler."
            )
            assert z.get("ist_spiegel") == "ja", (
                f"{os.path.basename(pfad)} Zeile {i}: Spiegelpaarung ohne "
                f"Kennzeichnung. Ohne sie sieht die doppelte Verbuchung wie "
                f"ein Fehler aus, und der naechste 'korrigiert' sie kaputt."
            )


def test_im_spiegel_zaehlt_jede_partie_fuer_beide_seiten():
    """W+L+T == 2 * vs_count — der Archetyp sitzt auf beiden Seiten.

    Das ist die inhaltliche Begruendung dafuer, dass die Abweichung
    richtig ist: eine Spiegelpartie liefert dem Archetyp genau einen
    Sieg UND eine Niederlage (oder zwei Unentschieden).
    """
    geprueft = 0
    for pfad in _dateien():
        for i, z in enumerate(_lies(pfad), start=2):
            if z.get("my_deck_slug") != z.get("opponent_deck_slug"):
                continue
            c = _ganz(z.get("vs_count"))
            bilanz = [_ganz(z.get(f)) for f in BILANZFELDER]
            if c is None or any(b is None for b in bilanz):
                continue  # Bilanzspalten leer — dort gibt es nichts zu pruefen
            geprueft += 1
            assert sum(bilanz) == 2 * c, (
                f"{os.path.basename(pfad)} Zeile {i}: Spiegel "
                f"{z.get('my_deck_slug')} mit vs_count={c}, aber "
                f"W+L+T={sum(bilanz)} statt {2 * c}."
            )
    assert geprueft > 0, "keine Spiegelpaarung mit Bilanz gefunden"


def test_ist_spiegel_stimmt_mit_den_deckspalten_ueberein():
    """Die Kennzeichnung darf nicht von den Slugs abweichen."""
    for pfad in _dateien():
        for i, z in enumerate(_lies(pfad), start=2):
            if "ist_spiegel" not in z:
                continue
            soll = "ja" if (z.get("my_deck_slug")
                            and z.get("my_deck_slug") == z.get("opponent_deck_slug")) else "nein"
            assert z.get("ist_spiegel") == soll, (
                f"{os.path.basename(pfad)} Zeile {i}: ist_spiegel="
                f"{z.get('ist_spiegel')!r}, erwartet {soll!r}"
            )


# ── Der Scraper selbst ────────────────────────────────────────────────

def test_scraper_fuehrt_die_belegspalten_in_der_kopfzeile():
    labs = pytest.importorskip("labs_tournament_scraper")
    for spalte in ("ist_spiegel", "tagesfilter_quelle"):
        assert spalte in labs.MATCHUP_CSV_HEADER, (
            f"{spalte} fehlt in MATCHUP_CSV_HEADER — dann schreibt der "
            f"naechste Lauf die Spalte wieder aus der Datei heraus."
        )
    # Hinten angehaengt: die Reihenfolge der bestehenden Spalten darf
    # sich nicht verschieben, sonst liest jeder positionsbasierte Leser
    # ab hier Unsinn.
    assert labs.MATCHUP_CSV_HEADER[-2:] == ["ist_spiegel", "tagesfilter_quelle"]
    assert labs.MATCHUP_CSV_HEADER[:18][-1] == "day_filter"


def test_markierfunktion_benennt_kopie_und_echte_abfrage_verschieden():
    """Der Kern der Reparatur, an einem gebauten Fall statt an Daten.

    Zwei day1-Zeilen: eine ist die overall-Zeile, die andere nicht. Sie
    muessen unterschiedlich benannt werden — sonst waere die Markierung
    nur ein Etikett fuer alles, was 'day1' heisst, und wuerde nicht
    messen.
    """
    labs = pytest.importorskip("labs_tournament_scraper")

    def zeile(eigen, gegner, tag, count, wins):
        return {
            "meta": "TEF-PBL", "my_deck_slug": eigen, "opponent_deck_slug": gegner,
            "day_filter": tag, "vs_count": str(count), "vs_win_pct": "50.0",
            "vs_wins": str(wins), "vs_losses": "1", "vs_ties": "0",
        }

    zeilen = [
        zeile("a", "b", "overall", 10, 5),
        zeile("a", "b", "day1", 10, 5),      # Feld fuer Feld die overall-Zeile
        zeile("a", "c", "overall", 10, 5),
        zeile("a", "c", "day1", 4, 2),       # weicht ab -> echte Abfrage
        zeile("a", "d", "day1", 3, 1),       # kein overall-Gegenstueck
        zeile("a", "a", "overall", 6, 6),    # Spiegel
        zeile("a", "b", "day2", 2, 1),
    ]
    zaehler = labs.markiere_matchup_zeilen(zeilen)

    nach_quelle = [z["tagesfilter_quelle"] for z in zeilen]
    assert nach_quelle[1] == "kopie_overall", "die Kopie wurde nicht erkannt"
    assert nach_quelle[3] == "abfrage", "eine abweichende day1-Zeile ist keine Kopie"
    assert nach_quelle[4] == "ungeprueft", (
        "ohne overall-Gegenstueck darf nichts behauptet werden"
    )
    assert nach_quelle[0] == nach_quelle[2] == nach_quelle[6] == "abfrage"
    assert [z["ist_spiegel"] for z in zeilen] == [
        "nein", "nein", "nein", "nein", "nein", "ja", "nein"
    ]
    assert zaehler["kopie_overall"] == 1
    assert zaehler["ungeprueft"] == 1
    assert zaehler["spiegel"] == 1


def test_markieren_veraendert_keine_bestehende_spalte():
    """Der Nachtrag ist Benennung, nicht Umrechnung."""
    labs = pytest.importorskip("labs_tournament_scraper")
    vorher = [{
        "meta": "TEF-PBL", "my_deck_slug": "a", "opponent_deck_slug": "b",
        "day_filter": "day1", "vs_count": "10", "vs_win_pct": "50.0",
        "vs_wins": "5", "vs_losses": "1", "vs_ties": "0",
    }]
    kopie = [dict(z) for z in vorher]
    labs.markiere_matchup_zeilen(kopie)
    for alt, neu in zip(vorher, kopie):
        for spalte, wert in alt.items():
            assert neu[spalte] == wert, f"{spalte} wurde veraendert: {wert!r} -> {neu[spalte]!r}"


def test_der_schalter_fuer_den_offline_nachtrag_ist_da():
    """Ohne den Schalter laesst sich der Bestand nicht nachziehen."""
    with open(SCRAPER, encoding="utf-8") as f:
        quelle = f.read()
    assert "--nur-tagesfilter-belegen" in quelle
    assert "def _lauf_tagesfilter_belegen" in quelle
    # Atomar: eine halbe CSV waere schlimmer als eine unbenannte.
    assert "def _schreibe_csv_atomar" in quelle
    assert "os.replace(vorlaeufig, pfad)" in quelle
