"""Regeln des Limitless-API-Scrapers, an einem von Hand gerechneten Feld.

WARUM EIN ERFUNDENES TURNIER UND KEIN ECHTES
--------------------------------------------
Ein zufaellig mitgeschnittenes Turnier enthaelt die teuren Sonderfaelle
meistens NICHT: Doppelniederlage, Partie ohne Gegner, Spieler ohne
Deckzuordnung, Sammeleimer "Other". Genau an diesen vier Stellen ist der
Scraper am 08.09.2026 beim Gegenrechnen gegen die echte Limitless-Seite
zuerst falsch gewesen (32-33-0 statt 32-40-0). Das Feld hier ist so klein,
dass jede Zahl von Hand nachrechenbar ist, und enthaelt alle vier.

Die Uebereinstimmung mit der Wirklichkeit prueft nicht diese Datei,
sondern der Live-Lauf in CI (`limitless-api-scrape.yml --verify`), der
gegen das Turnier `6a9db100ab080c8c957fc12b` rechnet.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.scrapers.limitless_api_scraper import (  # noqa: E402
    archetyp_bilanz, deck_namen, karten_schnitt, matchup_matrix,
    neue_turniere, parse_api_datum, zeilen_fuer_turnier,
)

A = "mega-excadrill-ex"
B = "dragapult-ex"


def _spieler(name, deck_id, deck_name, liste=None):
    eintrag = {"player": name, "name": name.upper(), "country": "DE",
               "record": {"wins": 0, "losses": 0, "ties": 0}}
    eintrag["deck"] = ({"id": deck_id, "name": deck_name, "icons": []}
                       if deck_id else None)
    eintrag["decklist"] = liste
    return eintrag


@pytest.fixture
def standings():
    return [
        _spieler("p1", A, "Mega Excadrill", {
            "pokemon": [{"count": 4, "set": "TEF", "number": "114", "name": "Metang"}],
            "trainer": [{"count": 2, "set": "DRI", "number": "176",
                         "name": "Team Rocket's Petrel"}],
            "energy": []}),
        _spieler("p2", A, "Mega Excadrill", {
            "pokemon": [{"count": 2, "set": "TEF", "number": "114", "name": "Metang"}],
            "trainer": [], "energy": []}),
        _spieler("p3", B, "Dragapult", {
            "pokemon": [{"count": 3, "set": "TEF", "number": "1", "name": "Dragapult"}],
            "trainer": [], "energy": []}),
        _spieler("p4", B, "Dragapult", {
            "pokemon": [{"count": 3, "set": "TEF", "number": "1", "name": "Dragapult"}],
            "trainer": [], "energy": []}),
        _spieler("p5", "other", "Other", {
            "pokemon": [{"count": 1, "set": "TEF", "number": "9", "name": "Substitute"}],
            "trainer": [], "energy": []}),
        _spieler("p6", None, None, None),   # gemeldet, ohne Deckzuordnung
    ]


@pytest.fixture
def pairings():
    return [
        {"round": 1, "phase": 1, "player1": "p1", "player2": "p3", "winner": "p1"},
        {"round": 2, "phase": 1, "player1": "p2", "player2": "p4", "winner": 0},
        {"round": 3, "phase": 1, "player1": "p1", "player2": "p4", "winner": -1},
        {"round": 4, "phase": 1, "player1": "p2", "player2": "",   "winner": "p2"},
        {"round": 5, "phase": 1, "player1": "p3", "player2": "p5", "winner": "p5"},
    ]


# --- Namen -----------------------------------------------------------------

def test_namen_kommen_aus_der_api_nicht_aus_dem_slug(standings):
    """Der Slug `mega-excadrill-ex` darf NIE zu "Mega Excadrill Ex" werden.

    Gegen die 62 Archetypen des Testturniers trifft der Slug-Weg nur 26;
    der mitgelieferte Name trifft 61. Deshalb liest der Scraper `deck.name`.
    """
    namen = deck_namen(standings)
    assert namen[A] == "Mega Excadrill"
    assert namen[B] == "Dragapult"
    assert "Ex" not in namen[A].split()


# --- Bilanz ----------------------------------------------------------------

def test_doppelniederlage_zaehlt_fuer_beide_als_niederlage(standings, pairings):
    b = archetyp_bilanz(standings, pairings)
    # A: p1 S(R1) N(R3) · p2 U(R2) S(R4)  ->  2-1-1
    assert (b[A]["siege"], b[A]["niederlagen"], b[A]["unentschieden"]) == (2, 1, 1)
    # B: p3 N(R1) N(R5) · p4 U(R2) N(R3)  ->  0-3-1
    assert (b[B]["siege"], b[B]["niederlagen"], b[B]["unentschieden"]) == (0, 3, 1)


def test_partie_ohne_gegner_zaehlt_in_die_bilanz(standings, pairings):
    """Runde 4 ist ein Freilos fuer p2. Limitless zaehlt es mit — wir auch."""
    b = archetyp_bilanz(standings, pairings)
    assert b[A]["partien"] == 4


def test_anteil_traegt_seinen_nenner(standings, pairings):
    b = archetyp_bilanz(standings, pairings)
    # 5 zugeordnete Listen (p6 hat kein Deck), davon 2 mit A.
    assert b[A]["listen"] == 2
    assert b[A]["listen_gesamt"] == 5
    assert b[A]["anteil"] == pytest.approx(0.4)


def test_spieler_ohne_deck_faellt_aus_dem_nenner(standings, pairings):
    b = archetyp_bilanz(standings, pairings)
    assert sum(w["listen"] for w in b.values()) == 5


def test_quote_folgt_der_hausvereinbarung(standings, pairings):
    """S / (S + N + U) — die Konvention `mitUnentschieden`."""
    b = archetyp_bilanz(standings, pairings)
    assert b[A]["quote"] == pytest.approx(2 / 4)
    assert b[A]["quoten_konvention"] == "mitUnentschieden"


# --- Karten ----------------------------------------------------------------

def test_schnitt_teilt_durch_alle_listen_nicht_nur_durch_die_mit_karte(standings):
    """Der Unterschied zwischen "3 Kopien ueberall" und "3 Kopien bei einem Drittel".

    Petrel steckt in 1 von 2 A-Listen, mit 2 Kopien. Schnitt 1,0 —
    Aufnahmequote 0,5. Wer durch `listen_mit_karte` teilte, bekaeme 2,0
    und behauptete damit ein Standardteil, das es nicht ist.
    """
    k = karten_schnitt(standings)
    petrel = k[(A, "trainer", "DRI", "176")]
    assert petrel["kopien_gesamt"] == 2
    assert petrel["listen_mit_karte"] == 1
    assert petrel["listen_gesamt"] == 2
    assert petrel["schnitt"] == pytest.approx(1.0)
    assert petrel["aufnahmequote"] == pytest.approx(0.5)

    metang = k[(A, "pokemon", "TEF", "114")]
    assert metang["kopien_gesamt"] == 6
    assert metang["schnitt"] == pytest.approx(3.0)
    assert metang["aufnahmequote"] == pytest.approx(1.0)


def test_karten_werden_ueber_set_und_nummer_geschluesselt(standings):
    """CLAUDE.md: niemals ueber den Namen verbinden."""
    k = karten_schnitt(standings)
    assert (A, "pokemon", "TEF", "114") in k
    assert all(len(s) == 4 for s in k)


# --- Matchups --------------------------------------------------------------

def test_matchups_lassen_freilose_und_den_sammeleimer_draussen(standings, pairings):
    m = matchup_matrix(standings, pairings)
    assert ("other", B) not in m and (B, "other") not in m
    # R1 S, R2 U, R3 N  ->  1-1-1 aus Sicht von A
    assert (m[(A, B)]["siege"], m[(A, B)]["niederlagen"],
            m[(A, B)]["unentschieden"]) == (1, 1, 1)


def test_matchup_ist_wegen_doppelniederlagen_nicht_spiegelsymmetrisch(standings, pairings):
    """R3 endet -1: beide verlieren. A gegen B ist 1-1-1, B gegen A 0-2-1."""
    m = matchup_matrix(standings, pairings)
    assert (m[(B, A)]["siege"], m[(B, A)]["niederlagen"],
            m[(B, A)]["unentschieden"]) == (0, 2, 1)


# --- Inkrementell ----------------------------------------------------------

def _t(tid, players=200, fmt="STANDARD", datum="2026-09-07T12:00:00.000Z"):
    return {"id": tid, "players": players, "format": fmt, "date": datum,
            "name": tid, "game": "PTCG"}


def test_bekanntes_turnier_wird_nicht_erneut_geholt():
    liste = [_t("alt"), _t("neu")]
    assert [x["id"] for x in neue_turniere(liste, ["alt"])] == ["neu"]


def test_schwelle_und_format_filtern():
    liste = [_t("klein", players=40), _t("glc", fmt="GLC"), _t("gross", players=300)]
    assert [x["id"] for x in neue_turniere(liste, [])] == ["gross"]


def test_datum_der_api_wird_gelesen():
    assert parse_api_datum("2026-09-08T02:00:00.000Z").year == 2026
    assert parse_api_datum(None) is None
    assert parse_api_datum("kein datum") is None


# --- Ausgabe ---------------------------------------------------------------

def test_zeilen_fuer_turnier_liefert_alle_vier_ebenen(standings, pairings):
    turnier = _t("6a9db100ab080c8c957fc12b", players=6)
    details = {"isOnline": True, "decklists": True,
               "phases": [{"phase": 1, "type": "SWISS", "rounds": 5, "mode": "BO3"}]}
    teile = zeilen_fuer_turnier(turnier, details, standings, pairings)

    assert teile["turniere"][0]["swiss_rounds"] == 5
    assert teile["turniere"][0]["standings_rows"] == 6
    assert {z["archetype_id"] for z in teile["archetypen"]} == {A, B, "other"}
    # Der Sammeleimer liefert keine Kartenzeilen.
    assert all(z["archetype_id"] != "other" for z in teile["karten"])
    assert {(z["archetype_id"], z["opponent_id"]) for z in teile["matchups"]} == {(A, B), (B, A)}
    assert teile["archetypen"][0]["win_rate_convention"] == "mitUnentschieden"


# --- Selbstheilung nach einem Abbruch --------------------------------------

def test_halbfertige_zeilen_eines_abgebrochenen_laufs_fallen_weg():
    """Der Index wird zuletzt geschrieben; bricht der Lauf davor ab,
    stehen Kartenzeilen ohne Turniereintrag da. Beim naechsten Lauf wird
    dasselbe Turnier erneut geholt — ohne Aufraeumen zaehlte es doppelt,
    und ein Kartenschnitt waere nicht falsch, sondern still doppelt
    gewichtet."""
    from backend.scrapers.limitless_api_scraper import verwaiste_zeilen
    zeilen = [
        {"tournament_id": "fertig", "card": "Metang"},
        {"tournament_id": "abgebrochen", "card": "Metang"},
        {"tournament_id": "", "card": "Metang"},
    ]
    behalten = verwaiste_zeilen(zeilen, ["fertig"])
    assert [z["tournament_id"] for z in behalten] == ["fertig"]
