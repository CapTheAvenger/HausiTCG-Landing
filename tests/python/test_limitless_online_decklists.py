# -*- coding: utf-8 -*-
"""EINZELLISTEN VON LIMITLESS ONLINE — DIE STELLEN, AN DENEN ES STILL
FALSCH WIRD

ANLASS (07.09.2026)
-------------------
`data/tournament_decklists_per_player.csv` fuehrt im Format TEF-PBL ein
einziges Turnier (Worlds 2026, 143 Listen; davon acht Mega Excadrill).
Darauf rechnet der Deckbauer. Der neue Scraper
`backend/scrapers/limitless_online_decklist_scraper.py` holt deshalb
Einzellisten von play.limitlesstcg.com, wo praktisch JEDER Spieler seine
Liste veroeffentlicht (253 von 253 bei "Rare Candy Club Showdown #43").

WARUM DIESE DATEI OHNE NETZ AUSKOMMT
------------------------------------
limitlesstcg.com ist aus dem Bausandkasten nicht erreichbar (Egress-
Proxy, 403). Ein Parser, den nur CI pruefen kann, wird in der Praxis
nicht geprueft — also liegen in tests/fixtures/ Ausschnitte der echten
Seiten (Turnierliste, Standings, Deckliste), und der Parser laeuft hier
dagegen.

WAS GEPRUEFT WIRD — und warum genau das
---------------------------------------
1. Der Formatfilter. Die Zahl in `data-format` ist eine Datenbank-ID von
   Limitless, keine Eigenschaft des Spiels. Faellt sie nach einer
   Rotation um, holt der Lauf null Turniere — und das darf nicht wie
   eine leere Quelle aussehen.
2. Die Feldgroesse. Ein 19er-Turnier traegt nichts zu einer
   Kartenempfehlung bei, verbraucht aber Abrufe.
3. Der Spieler OHNE Liste. Am Ende jedes Feldes stehen Zeilen mit leeren
   Deck- und Listenzellen. Sie sind der Normalfall, kein Fehler — wer
   hier eine Ausnahme wirft, verliert wegen eines Aussteigers das ganze
   Turnier.
4. Die Bilanz "10 - 0 - 1". Sie steht in einer von vier gleich
   aussehenden `secondary`-Zellen.
5. Die Deckliste: 60 Karten, drei Abschnitte, Set und Nummer JE Karte.
   Der Druck kommt aus der `href`, nicht aus dem Kartentext — CLAUDE.md,
   "Never join card data by name".
6. Die Herkunftsspalte. Ohne sie kann die Oberflaeche Papier und Online
   nicht einmal auseinanderhalten, wenn sie wollte.
7. Der Riegel gegen die geschrumpfte Quelle, samt Uebersteuerung.
8. Die fremde Kopfzeile. Am 06.09.2026 hat genau das die Datei
   beschaedigt: 21-Feld-Zeilen unter einer 20-Feld-Kopfzeile, `seite` in
   der Spalte `scraped_at`. Beim Schreiben faellt das nicht auf.
"""

import csv
import io
import os
import sys

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
FIXTUREN = os.path.join(WURZEL, "tests", "fixtures")

for _p in (os.path.join(WURZEL, "backend", "core"),
           os.path.join(WURZEL, "backend", "scrapers")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import limitless_online_decklist_scraper as LO   # noqa: E402
import per_decklist_scraper as PD                # noqa: E402


def _lies(name):
    with io.open(os.path.join(FIXTUREN, name), encoding="utf-8") as f:
        return f.read()


@pytest.fixture(scope="module")
def turnierliste_html():
    return _lies("limitless_online_turnierliste.html")


@pytest.fixture(scope="module")
def standings_html():
    return _lies("limitless_online_standings.html")


@pytest.fixture(scope="module")
def decklist_html():
    return _lies("limitless_online_decklist.html")


# ── 1. Die Turnierliste ───────────────────────────────────────────────

def test_turnierliste_liest_alle_zeilen(turnierliste_html):
    t = LO.lies_turnierliste(turnierliste_html)
    assert len(t) == 5, [x["name"] for x in t]
    erstes = t[0]
    assert erstes["id"] == "6a978d0fab080c8c957f79ac"
    assert erstes["name"] == "Rare Candy Club Showdown #43 (50 CODES)"
    assert erstes["spieler"] == 254
    assert erstes["format"] == "4"
    # Das Datum kommt aus data-date (ISO), NICHT aus dem Zelltext. Der
    # Zelltext sagt bei allen fuenf Zeilen "07. September 2026" — auch
    # bei dem Turnier vom 01.08. Wer den Text liest, datiert vier von
    # fuenf Turnieren falsch.
    assert erstes["datum"] == "2026-09-07"
    assert t[4]["datum"] == "2026-08-01", "Datum aus dem Zelltext statt aus data-date?"
    assert erstes["url"].endswith("/tournament/6a978d0fab080c8c957f79ac/standings")


def test_filter_wirft_fremdes_format_weg(turnierliste_html):
    alle = LO.lies_turnierliste(turnierliste_html)
    behalten = LO.filtere_turniere(alle, "4", 0)
    assert [x["name"] for x in behalten] == [
        "Rare Candy Club Showdown #43 (50 CODES)",
        "Redacted Open Cup",
        "Monster Collectibles After Hours Season 2 #1",
        "Vault Of Games | Midnight Madness #1",
    ], "Alt-Format-Cup (data-format=1) haette wegfallen muessen"


def test_filter_wirft_kleines_feld_weg(turnierliste_html):
    alle = LO.lies_turnierliste(turnierliste_html)
    behalten = LO.filtere_turniere(alle, "4", 50)
    namen = [x["name"] for x in behalten]
    assert "Vault Of Games | Midnight Madness #1" not in namen, \
        "19 Spieler sind unter der Mindestgroesse von 50"
    assert len(behalten) == 3, namen


def test_filter_alle_schaltet_das_format_ab(turnierliste_html):
    alle = LO.lies_turnierliste(turnierliste_html)
    assert len(LO.filtere_turniere(alle, "alle", 50)) == 4, \
        "'alle' muss auch das 88er-Turnier im Alt-Format durchlassen"


# ── 2. Die Standings ──────────────────────────────────────────────────

def test_standings_zaehlt_nur_spieler_mit_liste(standings_html):
    zeilen = LO.lies_standings(standings_html)
    assert len(zeilen) == 4, [z["spieler"] for z in zeilen]
    assert "OhneListe" not in {z["spieler"] for z in zeilen}, \
        "der Spieler ohne Listen-Verweis gehoert heraus, nicht hinein"


def test_standings_traegt_platz_archetyp_und_slug(standings_html):
    zeilen = LO.lies_standings(standings_html)
    erster = zeilen[0]
    assert erster["platz"] == 1
    assert erster["spieler"] == "Telly37"
    assert erster["archetyp"] == "Rocket's Honchkrow"
    assert erster["slug"] == "rockets-honchkrow"
    assert erster["listen_url"].endswith("/player/telly37/decklist")


def test_archetyp_kommt_nicht_von_der_landesflagge(standings_html):
    """Die Flagge traegt ebenfalls ein data-tooltip. Wer das erste
    data-tooltip der ZEILE nimmt, schreibt in jede Zeile den
    Flaggentext statt des Decknamens."""
    for z in LO.lies_standings(standings_html):
        assert z["archetyp"] != "Land", z


def test_zwei_mega_excadrill_im_ausschnitt(standings_html):
    """Der Anlass des ganzen Vorhabens: acht Listen im Bestand. Schon
    dieser Fuenf-Zeilen-Ausschnitt bringt zwei."""
    slugs = [z["slug"] for z in LO.lies_standings(standings_html)]
    assert slugs.count("mega-excadrill") == 2, slugs


@pytest.mark.parametrize("text,erwartet", [
    ("10 - 0 - 1", (10, 0, 1)),
    ("9 - 2 - 0", (9, 2, 0)),
    ("8-3-0", (8, 3, 0)),
    ("7 - 1", (7, 1, 0)),
    ("", (0, 0, 0)),
    ("31", (0, 0, 0)),          # die Punktezelle, nicht die Bilanz
    ("Rocket's Honchkrow", (0, 0, 0)),
])
def test_bilanz_zerlegen(text, erwartet):
    assert LO.zerlege_bilanz(text) == erwartet


def test_bilanz_kommt_aus_der_richtigen_zelle(standings_html):
    """Punkte (31), Bilanz (10 - 0 - 1), Opp-% und OppOpp-% sind vier
    Zellen mit derselben Klasse. Gesucht wird nach der FORM."""
    zeilen = {z["spieler"]: z for z in LO.lies_standings(standings_html)}
    assert (zeilen["Telly37"]["wins"], zeilen["Telly37"]["losses"],
            zeilen["Telly37"]["ties"]) == (10, 0, 1)
    assert (zeilen["Kaiju"]["wins"], zeilen["Kaiju"]["losses"],
            zeilen["Kaiju"]["ties"]) == (8, 2, 0)


# ── 3. Die Deckliste ──────────────────────────────────────────────────

def test_deckliste_ergibt_sechzig_karten(decklist_html):
    karten = LO.lies_deckliste(decklist_html)
    assert sum(k["count"] for k in karten) == 60, \
        {k["abschnitt"]: k["count"] for k in karten}


def test_deckliste_hat_drei_abschnitte(decklist_html):
    karten = LO.lies_deckliste(decklist_html)
    nach_abschnitt = {}
    for k in karten:
        nach_abschnitt[k["abschnitt"]] = nach_abschnitt.get(k["abschnitt"], 0) + k["count"]
    assert nach_abschnitt == {"Pokémon": 12, "Trainer": 40, "Energy": 8}


def test_jede_karte_traegt_set_und_nummer(decklist_html):
    for k in LO.lies_deckliste(decklist_html):
        assert k["set_code"], k
        assert k["set_number"], k


def test_druck_kommt_aus_der_href_nicht_aus_dem_namen(decklist_html):
    nach_name = {k["name"]: k for k in LO.lies_deckliste(decklist_html)}
    # Der Fall, der den Papier-Scraper am 06.09.2026 47,6 % der
    # Trainer-/Energiezeilen gekostet hat: ueber den Namen aufgeloest
    # stand hier ASC 207.
    assert nach_name["Team Rocket's Petrel"]["set_code"] == "DRI"
    assert nach_name["Team Rocket's Petrel"]["set_number"] == "175"
    assert nach_name["Roto-Stick"]["set_code"] == "PBL"
    assert nach_name["Ignition Energy"]["set_number"] == "165"


def test_bei_widerspruch_gewinnt_die_href(decklist_html):
    """Der Text ist der Rueckfall, nicht die Quelle. Wenn beide etwas
    anderes sagen, gilt die `href`.

    Der Widerspruch ist nicht erfunden: genau diese Karte hat der
    Papier-Scraper am 06.09.2026 als ASC 207 gefuehrt, waehrend die
    Seite die ganze Zeit DRI 175 auswies (Boming Wangs
    Mega-Excadrill-Liste, Worlds, Platz 37). Acht von elf Trainer-/
    Energiezeilen dieser einen Liste waren so falsch.
    """
    gelogen = decklist_html.replace(
        "3 Team Rocket's Petrel (DRI-175)", "3 Team Rocket's Petrel (ASC-207)")
    nach_name = {k["name"]: k for k in LO.lies_deckliste(gelogen)}
    assert nach_name["Team Rocket's Petrel"]["set_code"] == "DRI"
    assert nach_name["Team Rocket's Petrel"]["set_number"] == "175"


def test_uebersetzungsparameter_verunreinigt_die_nummer_nicht(decklist_html):
    """Limitless haengt an japanische Drucke ein `?translate=en`. Bleibt
    es an der Nummer kleben, findet kein Kartenbild mehr seinen Druck —
    dieselbe Falle steckt schon in
    card_scraper_shared.extract_cards_from_decklist_soup."""
    mit_param = decklist_html.replace(
        "https://limitlesstcg.com/cards/PBL/160",
        "https://limitlesstcg.com/cards/M5/37?translate=en")
    nach_name = {k["name"]: k for k in LO.lies_deckliste(mit_param)}
    assert nach_name["Roto-Stick"]["set_code"] == "M5"
    assert nach_name["Roto-Stick"]["set_number"] == "37"


def test_kartenname_ohne_anzahl_und_ohne_druckklammer(decklist_html):
    namen = {k["name"] for k in LO.lies_deckliste(decklist_html)}
    assert "Team Rocket's Murkrow" in namen, sorted(namen)[:5]
    for n in namen:
        assert not n[:1].isdigit(), f"Anzahl klebt am Namen: {n!r}"
        assert not n.endswith(")"), f"Druckklammer klebt am Namen: {n!r}"


def test_abschnitt_der_nicht_aufgeht_bricht_ab(decklist_html):
    """Wenn die Ueberschrift 12 sagt und die Karten 11 ergeben, hat sich
    der Aufbau geaendert. Melden, nicht die Luecke ausliefern."""
    kaputt = decklist_html.replace("Pokémon (12)", "Pokémon (13)")
    with pytest.raises(LO.Teilausfall):
        LO.lies_deckliste(kaputt)


def test_druckklammer_im_text_ist_der_rueckfall(decklist_html):
    """Die `href` ist die Quelle, der Text der Rueckfall. Faellt die
    `href` weg, traegt die Klammer im Text die Karte noch."""
    kaputt = decklist_html.replace(
        'href="https://limitlesstcg.com/cards/DRI/127"', 'href="#"')
    nach_name = {k["name"]: k for k in LO.lies_deckliste(kaputt)}
    assert nach_name["Team Rocket's Murkrow"]["set_code"] == "DRI"
    assert nach_name["Team Rocket's Murkrow"]["set_number"] == "127"


def test_karte_ohne_jeden_druck_bricht_ab(decklist_html):
    """Weder `href` noch Klammer: dann wird nicht geraten, dann bricht
    der Lauf ab. CLAUDE.md, "Report, don't silently repair"."""
    kaputt = (decklist_html
              .replace('href="https://limitlesstcg.com/cards/DRI/127"', 'href="#"')
              .replace("4 Team Rocket's Murkrow (DRI-127)",
                       "4 Team Rocket's Murkrow"))
    with pytest.raises(LO.Teilausfall):
        LO.lies_deckliste(kaputt)


def test_fehlender_decklist_block_bricht_ab():
    with pytest.raises(LO.Teilausfall):
        LO.lies_deckliste("<html><body><p>4 Irgendwas</p></body></html>")


# ── 4. Die Zeilen ─────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def zeilen(turnierliste_html, standings_html, decklist_html):
    turnier = LO.lies_turnierliste(turnierliste_html)[0]
    standing = LO.lies_standings(standings_html)[1]      # Pablo1523, Mega Excadrill
    karten = LO.lies_deckliste(decklist_html)
    return LO.baue_zeilen(turnier, standing, karten, "2026-09-07T00:00:00+00:00")


def test_zeilen_tragen_die_herkunft_online(zeilen):
    assert zeilen, "keine Zeile gebaut"
    assert {z["quelle"] for z in zeilen} == {"online"}


def test_zeilen_halten_das_schema_des_papier_scrapers(zeilen):
    """Dieselbe Datei, dieselben Spalten — sonst liest kein einziger
    vorhandener Verbraucher weiter."""
    for z in zeilen:
        assert set(z) == set(PD.CSV_FIELDS), (
            set(z) ^ set(PD.CSV_FIELDS))


def test_quelle_steht_in_den_spalten_beider_scraper():
    assert "quelle" in PD.CSV_FIELDS, \
        ("Ohne die Spalte in CSV_FIELDS schreibt der naechste Papier-Lauf "
         "die Datei neu und wirft die Herkunft aller Online-Zeilen weg.")
    # Die veroeffentlichte Reihenfolge bleibt, wo sie war.
    assert PD.CSV_FIELDS[-1] == "scraped_at"
    assert PD.CSV_FIELDS[-2] == "druck_quelle"


def test_zeile_traegt_turnier_platz_und_bilanz(zeilen):
    z = zeilen[0]
    assert z["limitless_tournament_id"] == "6a978d0fab080c8c957f79ac"
    assert z["tournament_name"] == "Rare Candy Club Showdown #43 (50 CODES)"
    assert z["tournament_date"] == "2026-09-07"
    assert z["place"] == 2
    assert z["player_name"] == "Pablo1523"
    assert z["deck_archetype"] == "Mega Excadrill"
    assert z["deck_slug"] == "mega-excadrill"
    assert (z["wins"], z["losses"], z["ties"]) == (9, 2, 0)
    assert z["druck_quelle"] == "seite"


def test_labs_nummer_bleibt_leer(zeilen):
    """Online-Turniere stehen nicht in labs_tournaments.json. Eine
    Nummer zu erfinden waere die stille Reparatur, die CLAUDE.md
    verbietet."""
    assert {z["tournament_id"] for z in zeilen} == {""}


# ── 5. Der Schreibweg ─────────────────────────────────────────────────

def _csv_lesen(pfad):
    with io.open(pfad, newline="", encoding="utf-8") as f:
        rd = csv.DictReader(f)
        return list(rd.fieldnames or []), list(rd)


def _papierzeile(**kw):
    z = {k: "" for k in PD.CSV_FIELDS}
    z.update({
        "tournament_id": "0071", "limitless_tournament_id": "515",
        "tournament_name": "World Championships 2026", "tournament_date": "2026-08-28",
        "meta": "TEF-PBL", "place": "1", "player_name": "Andrew Hedrick",
        "deck_archetype": "Dragapult", "deck_slug": "28752",
        "wins": "14", "losses": "2", "ties": "0",
        "card_name": "Dreepy", "card_identifier": "TWM 128",
        "set_code": "TWM", "set_number": "128", "count": "4",
        "type": "Basic", "is_ace_spec": "No", "druck_quelle": "seite",
        "scraped_at": "2026-09-06T12:37:46+00:00",
    })
    z.update(kw)
    return z


def _alte_datei(pfad, zeilen, ohne=("quelle",)):
    """Eine Datei im Zustand VOR dem 07.09.2026 — ohne `quelle`."""
    kopf = [f for f in PD.CSV_FIELDS if f not in ohne]
    with io.open(pfad, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=kopf)
        w.writeheader()
        for z in zeilen:
            w.writerow({k: z.get(k, "") for k in kopf})


def test_bestand_bekommt_papier_nachgetragen(tmp_path, zeilen):
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(300)])
    LO.schreibe(zeilen, ziel)
    kopf, gelesen = _csv_lesen(ziel)
    assert "quelle" in kopf
    herkuenfte = {z["quelle"] for z in gelesen}
    assert herkuenfte == {"papier", "online"}, herkuenfte
    assert sum(1 for z in gelesen if z["quelle"] == "papier") == 300


def test_fremde_kopfzeile_verschiebt_die_spalten_nicht(tmp_path, zeilen):
    """Der Vorfall vom 06.09.2026: neue Zeilen mit einem Feld mehr unter
    eine alte Kopfzeile geschrieben — `seite` landete in `scraped_at`."""
    ziel = str(tmp_path / "bestand.csv")
    alt = _papierzeile(card_name="Dreepy")
    _alte_datei(ziel, [alt] + [_papierzeile(card_name=f"K{i}") for i in range(300)])
    LO.schreibe(zeilen, ziel)
    _kopf, gelesen = _csv_lesen(ziel)
    wieder = [z for z in gelesen if z["card_name"] == "Dreepy"][0]
    assert wieder["scraped_at"] == "2026-09-06T12:37:46+00:00", \
        f"Spalten verrutscht: scraped_at = {wieder['scraped_at']!r}"
    assert wieder["set_code"] == "TWM"
    assert wieder["druck_quelle"] == "seite"


def test_kopfzeile_folgt_der_veroeffentlichten_reihenfolge(tmp_path, zeilen):
    """Beide Schreiber muessen dieselbe Reihenfolge waehlen.

    `per_decklist_scraper.write_rows` schreibt die Datei bei
    abweichender Kopfzeile in der Reihenfolge von CSV_FIELDS neu. Waehlte
    dieser Scraper eine andere, sortierte jeder zweite Lauf die Datei um
    und der Verlauf bestuende aus Umsortierungen.
    """
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(300)])
    LO.schreibe(zeilen, ziel)
    neu_kopf, _ = _csv_lesen(ziel)
    assert neu_kopf == list(PD.CSV_FIELDS), neu_kopf


def test_fremde_spalte_wird_mitgenommen_statt_geloescht(tmp_path, zeilen):
    """Eine Spalte, die dieser Scraper nicht kennt, gehoert ihm nicht —
    er darf sie nicht wegschreiben. `data/_consumers.md`: die Datei ist
    eine veroeffentlichte Schnittstelle, andere Projekte lesen sie."""
    ziel = str(tmp_path / "bestand.csv")
    kopf = list(PD.CSV_FIELDS) + ["fremde_spalte"]
    with io.open(ziel, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=kopf)
        w.writeheader()
        for i in range(300):
            z = _papierzeile(card_name=f"K{i}")
            z["fremde_spalte"] = f"wert{i}"
            w.writerow(z)
    LO.schreibe(zeilen, ziel)
    neu_kopf, gelesen = _csv_lesen(ziel)
    assert "fremde_spalte" in neu_kopf, neu_kopf
    alt = [z for z in gelesen if z["card_name"] == "K7"][0]
    assert alt["fremde_spalte"] == "wert7"


def test_zweiter_lauf_verdoppelt_die_liste_nicht(tmp_path, zeilen):
    ziel = str(tmp_path / "bestand.csv")
    LO.schreibe(zeilen, ziel)
    _kopf, einmal = _csv_lesen(ziel)
    LO.schreibe(zeilen, ziel)
    _kopf, zweimal = _csv_lesen(ziel)
    assert len(zweimal) == len(einmal), \
        "dieselbe Liste zweimal geholt darf sie nicht zweimal ablegen"


def test_riegel_haelt_die_geschrumpfte_quelle_auf(tmp_path, zeilen):
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(5000)])
    # Ein Lauf, der den Bestand ersetzen WUERDE: derselbe Schluessel wie
    # jede vorhandene Zeile, aber nur eine Handvoll Zeilen.
    einbruch = [dict(z, limitless_tournament_id="515",
                     player_name="Andrew Hedrick", deck_slug="28752")
                for z in zeilen[:3]]
    with pytest.raises(LO.Teilausfall) as e:
        LO.schreibe(einbruch, ziel)
    assert "Einbruch" in str(e.value)
    _kopf, unberuehrt = _csv_lesen(ziel)
    assert len(unberuehrt) == 5000, "die vorhandene Datei haette stehen bleiben muessen"
    assert "quelle" not in _kopf, "bei einem Abbruch wird gar nichts geschrieben"


def test_riegel_laesst_sich_uebersteuern(tmp_path, zeilen, capsys):
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(5000)])
    einbruch = [dict(z, limitless_tournament_id="515",
                     player_name="Andrew Hedrick", deck_slug="28752")
                for z in zeilen[:3]]
    LO.schreibe(einbruch, ziel, schrumpfen_erlauben=True)
    assert "::warning::" in capsys.readouterr().out
    _kopf, gelesen = _csv_lesen(ziel)
    assert len(gelesen) == 3


def test_riegel_greift_beim_ersten_lauf_nicht(tmp_path, zeilen):
    """Er soll einen Bestand schuetzen, den es gibt — nicht den ersten
    Lauf verhindern."""
    ziel = str(tmp_path / "neu.csv")
    assert LO.schreibe(zeilen[:3], ziel) == 3


def test_geschrieben_wird_atomar(tmp_path, zeilen, monkeypatch):
    """`open(pfad, "w")` kuerzt die Zieldatei, BEVOR geschrieben wird.
    Bricht der Lauf mitten im Schreiben ab (der Ablauf hat ein
    Zeitlimit), stuende danach eine halbe CSV da — und der Commit-Schritt
    committet sie."""
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(300)])
    vorher = io.open(ziel, encoding="utf-8").read()

    echtes_replace = os.replace

    def platzt(src, dst):
        raise OSError("Abbruch genau beim Umbenennen")

    monkeypatch.setattr(LO.os, "replace", platzt)
    with pytest.raises(OSError):
        LO.schreibe(zeilen, ziel)
    assert io.open(ziel, encoding="utf-8").read() == vorher, \
        "die Zieldatei wurde angefasst, bevor der Inhalt vollstaendig war"
    monkeypatch.setattr(LO.os, "replace", echtes_replace)


def test_nachtrag_ist_wiederholbar(tmp_path):
    ziel = str(tmp_path / "bestand.csv")
    _alte_datei(ziel, [_papierzeile(card_name=f"K{i}") for i in range(10)])
    assert LO._lauf_herkunft(ziel) == 0
    _kopf, erst = _csv_lesen(ziel)
    assert {z["quelle"] for z in erst} == {"papier"}
    assert LO._lauf_herkunft(ziel) == 0
    _kopf, nochmal = _csv_lesen(ziel)
    assert nochmal == erst, "ein zweiter Nachtrag darf nichts mehr aendern"


def test_nachtrag_ueberschreibt_online_nicht(tmp_path, zeilen):
    ziel = str(tmp_path / "bestand.csv")
    LO.schreibe(zeilen, ziel)
    LO._lauf_herkunft(ziel)
    _kopf, gelesen = _csv_lesen(ziel)
    assert {z["quelle"] for z in gelesen} == {"online"}


# ── 6. Der Lauf als Ganzes ────────────────────────────────────────────

def test_lauf_gegen_die_ausschnitte(tmp_path):
    ziel = str(tmp_path / "aus_ausschnitten.csv")
    rc = LO.main(["--aus-datei", os.path.join(FIXTUREN, "limitless_online_turnierliste.html"),
                  "--ausgabe", ziel, "--pause", "0"])
    assert rc == 0
    kopf, gelesen = _csv_lesen(ziel)
    assert kopf == list(PD.CSV_FIELDS)
    # drei Turniere ueber der Mindestgroesse, je vier Listen mit Liste,
    # je 60 Karten (der Ausschnitt liefert fuer jeden dieselbe Liste).
    assert len(gelesen) == 3 * 4 * len(LO.lies_deckliste(_lies("limitless_online_decklist.html")))
    assert {z["quelle"] for z in gelesen} == {"online"}


def test_probelauf_schreibt_nicht(tmp_path):
    ziel = str(tmp_path / "darf_nicht_entstehen.csv")
    rc = LO.main(["--aus-datei", os.path.join(FIXTUREN, "limitless_online_turnierliste.html"),
                  "--ausgabe", ziel, "--pause", "0", "--nur", "2"])
    assert rc == 0
    assert not os.path.exists(ziel), "--nur ist ein Probelauf und schreibt nichts"


def test_ausschnitte_ohne_eigenes_ziel_werden_verweigert(capsys):
    """Ausschnittsdaten sind eine Probe des Zusammenbaus, keine Daten.
    Ohne eigenes --ausgabe zielten sie auf die echte Datei."""
    rc = LO.main(["--aus-datei", os.path.join(FIXTUREN, "limitless_online_turnierliste.html"),
                  "--pause", "0"])
    assert rc == 1
    assert "::error::" in capsys.readouterr().out


def test_leerer_formatfilter_nennt_die_vorgefundenen_zahlen(tmp_path, capsys):
    """Nach einer Rotation aendert Limitless die Zahl in data-format.
    Dann sieht ein veralteter Filter aus wie eine leere Quelle — und man
    sucht an der falschen Stelle."""
    rc = LO.main(["--aus-datei", os.path.join(FIXTUREN, "limitless_online_turnierliste.html"),
                  "--ausgabe", str(tmp_path / "x.csv"), "--pause", "0",
                  "--format", "99"])
    assert rc == 1
    ausgabe = capsys.readouterr().out
    assert "::error::" in ausgabe
    assert "1, 4" in ausgabe, ausgabe


def test_turnierdeckel_begrenzt_die_abrufe(tmp_path):
    ziel = str(tmp_path / "eins.csv")
    assert LO.main(["--aus-datei", os.path.join(FIXTUREN, "limitless_online_turnierliste.html"),
                    "--ausgabe", ziel, "--pause", "0", "--turniere", "1"]) == 0
    _kopf, gelesen = _csv_lesen(ziel)
    assert {z["limitless_tournament_id"] for z in gelesen} == {"6a978d0fab080c8c957f79ac"}


def test_duenne_ausbeute_wird_gemeldet(capsys):
    """Ob play.limitlesstcg.com die Standings blaettert, konnte im
    Bausandkasten niemand messen. Statt eine Blaetter-Angabe zu
    erfinden, misst der Lauf die Ausbeute gegen die Feldgroesse und
    meldet sie."""
    LO._pruefe_ausbeute({"name": "Testturnier", "spieler": 254},
                        [{"platz": i} for i in range(20)])
    ausgabe = capsys.readouterr().out
    assert "::warning::" in ausgabe
    assert "254" in ausgabe and "blaettert" in ausgabe


def test_volle_ausbeute_meldet_nichts(capsys):
    LO._pruefe_ausbeute({"name": "Testturnier", "spieler": 253},
                        [{"platz": i} for i in range(253)])
    assert capsys.readouterr().out == "", \
        "eine Warnung bei 253 von 253 waere Laerm"


def test_ausbeute_ohne_feldgroesse_meldet_nichts(capsys):
    LO._pruefe_ausbeute({"name": "Testturnier", "spieler": 0}, [])
    assert capsys.readouterr().out == ""


def test_pause_zwischen_den_abrufen_ist_vorgesehen():
    """Limitless schuldet uns nichts. Die Pause haengt an derselben
    Konstante wie im Papier-Scraper, damit sie nicht auseinanderlaufen."""
    assert LO.DEFAULT_DELAY is PD.DEFAULT_DELAY
    assert LO.DEFAULT_DELAY >= 1.0


def test_pause_wird_wirklich_gewartet(monkeypatch):
    gewartet = []
    monkeypatch.setattr(LO.time, "sleep", lambda s: gewartet.append(s))
    monkeypatch.setattr(LO, "safe_fetch_html", lambda url: "<html></html>")
    LO.hole("https://example.invalid/x", 1.25)
    assert gewartet == [1.25]


def test_unerreichbare_seite_bricht_ab(monkeypatch):
    monkeypatch.setattr(LO.time, "sleep", lambda s: None)
    monkeypatch.setattr(LO, "safe_fetch_html", lambda url: "")
    with pytest.raises(LO.Teilausfall):
        LO.hole("https://example.invalid/x", 0)
