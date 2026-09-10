"""Die Bilanz ueberlebt den Drop-Vermerk.

WAS AM 10.09.2026 GEMESSEN WURDE
--------------------------------
Nach dem ersten Wochenlauf mit Online-Zeilen standen 663 von 1.319
Online-Listen in data/tournament_decklists_per_player.csv auf 0-0-0.
`tests/python/test_bilanz_je_zeile.py` hat das gemeldet.

Die Ursache stand in der echten Seite, nicht in den Daten. Nachgesehen
am 10.09.2026 an
play.limitlesstcg.com/tournament/6a98f8efab080c8c957f87af/standings
(Amyverse PTCG Live Weekly #12, 155 Zeilen):

    <td class="secondary">6 - 2 - 0<span class="drop"
        data-tooltip="Dropped in round 8">drop</span></td>

`get_text(strip=True)` klebt daraus "6 - 2 - 0drop". Das anker-feste
Muster hat es abgelehnt und still (0, 0, 0) geliefert — den Notwert,
der eigentlich fuer "keine Bilanz vorhanden" gedacht war.

Am lebenden Dokument nachgezaehlt: 100 der 155 Spieler tragen den
Vermerk. Mit der neuen Logik sind es 0 ohne Bilanz.
"""

import os
import sys

sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "backend", "scrapers"))
sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "backend", "core"))

import pytest

sc = pytest.importorskip("limitless_online_decklist_scraper")


def test_zerlege_bilanz_nimmt_den_vermerk_hin():
    assert sc.zerlege_bilanz("6 - 2 - 0drop") == (6, 2, 0)
    assert sc.zerlege_bilanz("4 - 4 - 0DROP") == (4, 4, 0)
    assert sc.zerlege_bilanz("9 - 1 - 1") == (9, 1, 1)
    assert sc.zerlege_bilanz("7 - 3") == (7, 3, 0)


def test_was_keine_bilanz_ist_bleibt_keine():
    """Die Nachbarzellen duerfen nicht versehentlich passen."""
    for text in ("28", "60.68%", "", "Kusunoki98"):
        assert sc.zerlege_bilanz(text) == (0, 0, 0), text


def test_ein_datum_ist_keine_bilanz():
    """Die Suche laeuft ueber ALLE Zellen der Zeile. "2026-09-09" hat
    dieselbe Form wie "9 - 1 - 1" und ergab (2026, 9, 9). Heute steht
    kein Datum in der Zeile — was morgen dort steht, weiss der Scraper
    nicht, also haelt eine Plausibilitaetsgrenze dagegen."""
    assert sc.zerlege_bilanz("2026-09-09") == (0, 0, 0)
    assert sc.zerlege_bilanz("100 - 0 - 0") == (0, 0, 0)
    # Und was plausibel ist, bleibt es:
    assert sc.zerlege_bilanz("9 - 1 - 1") == (9, 1, 1)


# Die Form der echten Zeile, Zelle fuer Zelle wie am 10.09.2026 gemessen:
# Platz | Name | Flagge | Punkte | Bilanz(+Vermerk) | Opp% | OppOpp% | Deck | Liste
_ZEILE = (
    '<tr data-placing="{platz}" data-name="{name}" data-country="DE">'
    '<td>{platz}</td><td>{name}</td><td class="secondary"></td>'
    '<td class="secondary">{punkte}</td>'
    '<td class="secondary">{bilanz}</td>'
    '<td class="secondary">60.68%</td><td class="secondary">56.49%</td>'
    '<td><a href="/decks/list/12" data-tooltip="Dragapult Dusknoir">'
    '<span></span></a></td>'
    '<td><a href="/tournament/x/player/{name}/decklist">Liste</a></td>'
    "</tr>"
)


def _seite(zeilen):
    return "<html><body><table>" + "".join(zeilen) + "</table></body></html>"


def test_lies_standings_holt_die_bilanz_trotz_vermerk():
    html = _seite([
        _ZEILE.format(platz=1, name="Kusunoki98", punkte=28, bilanz="9 - 1 - 1"),
        _ZEILE.format(platz=11, name="Insidegod", punkte=18,
                      bilanz='6 - 2 - 0<span class="drop" '
                             'data-tooltip="Dropped in round 8">drop</span>'),
    ])
    zeilen = sc.lies_standings(html)
    nach_name = {z["spieler"]: z for z in zeilen}
    assert set(nach_name) == {"Kusunoki98", "Insidegod"}, nach_name
    assert (nach_name["Kusunoki98"]["wins"],
            nach_name["Kusunoki98"]["losses"],
            nach_name["Kusunoki98"]["ties"]) == (9, 1, 1)
    # Das ist der Kern: vor dem 10.09.2026 stand hier (0, 0, 0).
    assert (nach_name["Insidegod"]["wins"],
            nach_name["Insidegod"]["losses"],
            nach_name["Insidegod"]["ties"]) == (6, 2, 0), (
        "Der Drop-Vermerk frisst die Bilanz wieder.")


def test_die_punktezelle_wird_nicht_als_bilanz_gelesen():
    """Die Punktezahl steht VOR der Bilanz. Wuerde sie passen, stuende
    ueberall die falsche Zahl — deshalb die Form, nicht die Position."""
    html = _seite([_ZEILE.format(platz=3, name="mangonorrea", punkte=21,
                                 bilanz="7 - 3 - 0")])
    z = sc.lies_standings(html)[0]
    assert (z["wins"], z["losses"], z["ties"]) == (7, 3, 0)
