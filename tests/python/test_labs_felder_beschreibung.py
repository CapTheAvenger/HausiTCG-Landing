"""Zwei Zahlen, ein Name — und drei Spalten, die keine Messung sind.

BEFUND A (07.09.2026): `total_players` heisst wie die Teilnehmerzahl,
ist aber die Summe der Decktabelle. An der Quelle gemessen:

    Turnier   Kopf der Quelle   Decksumme   labs_tournament_decks.csv
    0067          499 players        485        total_players = 485
    0068         1974 players       1970        total_players = 1970
    0069         2033 players       2032        total_players = 2032
    0070         3752 players       3743        total_players = 3743

Und nachgerechnet am ganzen Bestand: `total_players` ist in ALLEN 71
Turnieren exakt die Summe der Spalte `player_count`, und `share_pct` ist
in allen 4.713 Zeilen `player_count / total_players * 100`. Die Quelle
rechnet ihre Anteile genauso: 749/3743 = 20,01 %, was labs anzeigt —
749/3752 waeren 19,96 %.

Das ist kein Datenfehler. Es ist eine Namensfalle: wer `total_players`
fuer die Anwesenheit haelt, unterschaetzt sie um 1 bis 40 Spieler.
Die Anwesenheit steht woanders — in `tournament_cards_data_overview.csv`
(Spalte `players`) und in `player_continuity.csv`.

BEFUND B (07.09.2026): `top8_conv_rate`, `top16_conv_rate` und
`top32_conv_rate` stehen in allen 4.713 Zeilen auf 0.0. Das ist keine
gemessene Null — die Quelle fuehrt diese Spalte nicht mehr (siehe
`_CONV_HEADER_KEYS` in labs_tournament_scraper.py). Eine 0.0, die
"nicht erhebbar" bedeutet, sieht aus wie "gemessen: keine".

Keiner der beiden Befunde rechtfertigt es, Werte zu aendern. Beide
rechtfertigen, sie zu beschriften. Diese Suite haelt die Beschriftung
an den Daten fest.
"""

import csv
import collections
import os

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
DATEN = os.path.join(WURZEL, "data")
LABS = os.path.join(DATEN, "labs_tournament_decks.csv")
BESCHREIBUNG = os.path.join(DATEN, "labs_tournament_decks.felder.md")
OVERVIEW = os.path.join(DATEN, "tournament_cards_data_overview.csv")

NICHT_BEFUELLBAR = ("top8_conv_rate", "top16_conv_rate", "top32_conv_rate")


@pytest.fixture(scope="module")
def zeilen():
    with open(LABS, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


@pytest.fixture(scope="module")
def kopf(zeilen):
    return list(zeilen[0].keys())


@pytest.fixture(scope="module")
def beschreibung():
    assert os.path.exists(BESCHREIBUNG), (
        "data/labs_tournament_decks.felder.md fehlt — ohne sie steht "
        "total_players unbeschriftet neben einer gleichnamigen, anderen Zahl")
    with open(BESCHREIBUNG, encoding="utf-8") as f:
        return f.read()


# ── Befund A: was total_players wirklich ist ─────────────────────────────────

def test_total_players_ist_die_decksumme(zeilen):
    """Die Invariante, die den Namen widerlegt. Gilt sie nicht mehr, hat
    die Spalte ihre Bedeutung gewechselt — und die Beschreibung luegt."""
    summe = collections.defaultdict(int)
    gefuehrt = {}
    for r in zeilen:
        t = r["tournament_id"]
        summe[t] += int(r["player_count"] or 0)
        gefuehrt[t] = int(r["total_players"] or 0)
    abweichend = {t: (gefuehrt[t], summe[t])
                  for t in gefuehrt if gefuehrt[t] != summe[t]}
    assert not abweichend, (
        "total_players ist nicht mehr die Summe von player_count: " + str(abweichend))
    assert len(gefuehrt) >= 71, f"nur {len(gefuehrt)} Turniere — Bestand geschrumpft?"


def test_share_pct_rechnet_auf_die_decksumme(zeilen):
    """Der zweite Beleg: die Anteile haengen an total_players, nicht an
    der Anwesenheit. Genau deshalb darf man die Zahl nicht austauschen."""
    daneben = []
    for r in zeilen:
        n = int(r["total_players"] or 0)
        if not n:
            continue
        erwartet = round(int(r["player_count"] or 0) / n * 100, 2)
        if abs(float(r["share_pct"]) - erwartet) > 0.02:
            daneben.append((r["tournament_id"], r["deck_slug"], r["share_pct"], erwartet))
    assert not daneben, f"{len(daneben)} Zeile(n) mit anderer Anteilsbasis: {daneben[:5]}"


def test_die_anwesenheit_liegt_hoeher_und_steht_woanders():
    """Waeren beide Zahlen gleich, gaebe es die Falle nicht. Sie sind es
    nicht: gemessen ueber alle zugeordneten Turniere liegt die
    Anwesenheit fast immer ueber der Decksumme."""
    anwesend = {}
    with open(OVERVIEW, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            lt = (r.get("labs_tournament_id") or "").strip()
            if lt and (r.get("players") or "").strip().isdigit():
                anwesend[lt] = int(r["players"])
    decksumme = {}
    with open(LABS, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            decksumme[r["tournament_id"]] = int(r["total_players"] or 0)

    gemeinsam = sorted(set(anwesend) & set(decksumme))
    assert len(gemeinsam) >= 60, f"nur {len(gemeinsam)} Turniere zugeordnet"
    kleiner = [t for t in gemeinsam if decksumme[t] < anwesend[t]]
    groesser = [t for t in gemeinsam if decksumme[t] > anwesend[t]]
    assert not groesser, (
        "die Decksumme liegt ueber der Anwesenheit — das kann nicht sein: "
        + str(groesser))
    assert len(kleiner) >= 50, (
        "die beiden Zahlen sind fast ueberall gleich geworden — dann ist "
        "diese Beschreibung erklaerungsbeduerftig, nicht der Bestand")
    # Die vier vom Nutzer an der Quelle gemessenen Paare.
    for tid, kopf_der_quelle, deck in (("0067", 499, 485), ("0068", 1974, 1970),
                                       ("0069", 2033, 2032), ("0070", 3752, 3743)):
        assert anwesend[tid] == kopf_der_quelle, (tid, anwesend[tid])
        assert decksumme[tid] == deck, (tid, decksumme[tid])


# ── Befund B: die Spalten, die keine Messung sind ────────────────────────────

def test_die_conv_rate_spalten_sind_ueberall_null(zeilen):
    """Solange das gilt, ist die 0.0 kein Messwert. Faengt die Quelle an
    zu liefern, faellt dieser Test um — und die Beschriftung gehoert
    zurueckgenommen."""
    for spalte in NICHT_BEFUELLBAR:
        werte = {r[spalte].strip() for r in zeilen}
        assert werte <= {"0.0", "0", ""}, (
            f"{spalte} traegt jetzt Werte ({sorted(werte)[:5]}) — die Quelle "
            "liefert wieder etwas, die Kennzeichnung als nicht befuellbar "
            "muss weg")


def test_die_platzierungszaehler_sind_erst_ab_0062_erhoben(zeilen):
    """Leer heisst hier "nicht erhoben" und ist damit ehrlich — anders
    als die 0.0 daneben. Der Schnitt liegt sauber zwischen zwei
    Turnieren, nicht mitten in einem."""
    gefuellt, leer = set(), set()
    for r in zeilen:
        (leer if r["top1_count"].strip() == "" else gefuellt).add(r["tournament_id"])
    assert not (gefuellt & leer), (
        "ein Turnier ist halb gefuellt: " + str(sorted(gefuellt & leer)))
    assert min(gefuellt) == "0062", f"Schnitt liegt bei {min(gefuellt)}"
    assert max(leer) == "0061", f"Schnitt liegt bei {max(leer)}"


# ── Die Beschriftung ─────────────────────────────────────────────────────────

def test_jede_spalte_ist_beschrieben(beschreibung, kopf):
    fehlend = [s for s in kopf if f"`{s}`" not in beschreibung]
    assert not fehlend, f"unbeschriebene Spalte(n): {fehlend}"


def test_total_players_ist_als_decksumme_beschrieben(beschreibung):
    absatz = beschreibung.split("`total_players`", 1)[1][:1400]
    assert "player_count" in absatz, (
        "die Beschreibung von total_players nennt nicht, dass es die Summe "
        "von player_count ist")
    assert "3743" in absatz and "3752" in absatz, (
        "die Beschreibung nennt das gemessene Zahlenpaar nicht — ohne Beleg "
        "ist sie eine Behauptung")
    for quelle in ("tournament_cards_data_overview.csv", "player_continuity.csv"):
        assert quelle in beschreibung, (
            f"die Beschreibung sagt nicht, wo die Anwesenheit steht ({quelle})")


def test_die_nicht_befuellbaren_spalten_sind_so_gekennzeichnet(beschreibung):
    for spalte in NICHT_BEFUELLBAR:
        absatz = beschreibung.split(f"`{spalte}`", 1)[1][:600]
        assert "nicht befuellbar" in absatz.lower() or "nicht befüllbar" in absatz.lower(), (
            f"{spalte} ist nicht als nicht befuellbar gekennzeichnet")


def test_der_scraper_verweist_auf_die_beschreibung():
    """Wer die Spaltenliste aendert, soll ueber die Beschreibung stolpern."""
    quelle = os.path.join(WURZEL, "backend", "scrapers", "labs_tournament_scraper.py")
    with open(quelle, encoding="utf-8-sig") as f:
        text = f.read()
    assert "labs_tournament_decks.felder.md" in text, (
        "labs_tournament_scraper.py verweist nicht auf die Feldbeschreibung")
