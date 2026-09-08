"""Der Riegel gegen ein Sonderset als Rotationsanker.

BEFUND 08.09.2026
-----------------
`_pick_current_set()` in backend/core/update_sets.py nimmt schlicht das
Set mit dem juengsten Erscheinungsdatum. Es unterscheidet ein Hauptset
nicht von einem Sammler- oder Promoset.

Am **16.09.2026** erscheint "30th Celebration", laut zwei unabhaengigen
Quellen ein Special-Collection-Set; das naechste Hauptset ist Delta Reign
am 06.11.2026. Ohne Riegel haette der Wochenlauf am Freitag, 18.09.,
daraus einen Formatschluessel `TEF-30C` gemacht — den keine einzige
Chunkdatei traegt. Jede formatabhaengige Ansicht haette ins Leere
gegriffen, acht Tage vor dem Turnier in Frankfurt am 26.09.

DIE MESSUNG, AUF DER DIE SCHWELLE SITZT
---------------------------------------
data/online_api_cards_TEF-PBL.csv, 257.116 Zeilen aus 186 Turnieren:

  PBL, echtes Hauptset, am Tag NACH dem Erscheinen:  40 Karten
  kleinste vertretene Sets im ganzen Bestand:
    SVI 2 · MEP 3 · SVP 4 · MEE 8   (Promos, Mini-Sets)
    SFA 27 · PRE 31 · BLK 34        (echte Erweiterungen)

Zwischen 8 und 27 liegt der Graben; 25 sitzt darin. Keine geratene Zahl.
"""

import csv
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import backend.core.update_sets as update_sets  # noqa: E402
import backend.scrapers.limitless_api_scraper as api  # noqa: E402
from backend.core.update_sets import (  # noqa: E402
    ANKER_MIN_KARTEN, _pick_current_set, anker_belegt,
)

SPALTEN = ["tournament_id", "date", "meta", "archetype_id", "group", "set",
           "number", "card", "copies_total", "lists_with_card",
           "lists_total", "avg_count", "inclusion_rate"]


def _kartendatei(verzeichnis, sets):
    """sets: {Set-Code: Zahl verschiedener Karten}"""
    pfad = os.path.join(verzeichnis, "online_api_cards_TEF-PBL.csv")
    with open(pfad, "w", encoding="utf-8", newline="") as datei:
        w = csv.DictWriter(datei, fieldnames=SPALTEN, delimiter=";",
                           extrasaction="ignore")
        w.writeheader()
        for code, n in sets.items():
            for i in range(n):
                w.writerow({"tournament_id": "T", "date": "2026-09-01",
                            "meta": "TEF-PBL", "archetype_id": "a",
                            "group": "pokemon", "set": code, "number": str(i + 1),
                            "card": f"K{i}", "copies_total": 4,
                            "lists_with_card": 1, "lists_total": 1,
                            "avg_count": 4.0, "inclusion_rate": 1.0})
    return pfad


# ── Der Riegel selbst ────────────────────────────────────────────────

def test_echtes_hauptset_wird_als_anker_belegt(tmp_path):
    """PBL hatte am Tag nach dem Erscheinen 40 verschiedene Karten."""
    _kartendatei(str(tmp_path), {"PBL": 40})
    belegt, n, _ = anker_belegt(str(tmp_path), "PBL")
    assert belegt and n == 40


def test_sonderset_wird_abgelehnt(tmp_path):
    """Der Fall vom 16.09.2026. 30C spielt niemand — kein Anker."""
    _kartendatei(str(tmp_path), {"PBL": 40, "30C": 0})
    belegt, n, grund = anker_belegt(str(tmp_path), "30C")
    assert not belegt
    assert n == 0
    assert "25" in grund, "der Grund muss die noetige Zahl nennen"


def test_minisets_bleiben_unter_der_schwelle(tmp_path):
    """MEE 8 · MEP 3 · SVI 2 — die gemessenen kleinsten Sets.

    Sie werden GESPIELT, teils sogar viel (MEE traegt die Energie), sind
    aber keine Rotationsanker. Eine Schwelle auf 'wird ueberhaupt
    gespielt' haette sie durchgelassen.
    """
    _kartendatei(str(tmp_path), {"MEE": 8, "MEP": 3, "SVI": 2, "PBL": 40})
    for code in ("MEE", "MEP", "SVI"):
        belegt, _, _ = anker_belegt(str(tmp_path), code)
        assert not belegt, f"{code} darf kein Anker sein"


def test_ohne_kartendaten_wird_der_riegel_ausgesetzt(tmp_path):
    """Keine Auskunft ist keine Ablehnung.

    Laeuft das Projekt ohne die API-Kartendateien, soll sich das alte
    Verhalten nicht aendern — sonst haette der Riegel einen Lauf
    blockiert, der vorher funktionierte.
    """
    belegt, n, grund = anker_belegt(str(tmp_path), "IRGENDWAS")
    assert belegt and n == -1 and "ausgesetzt" in grund


def test_die_schwelle_liegt_im_gemessenen_graben():
    """Zwischen dem groessten Mini-Set (8) und der kleinsten echten
    Erweiterung (27) liegt der Graben. Wandert die Schwelle heraus,
    trennt sie nicht mehr."""
    assert 8 < ANKER_MIN_KARTEN < 27


# ── Warum der Riegel ueberhaupt noetig ist ───────────────────────────

def test_die_setauswahl_allein_wuerde_das_sonderset_nehmen(monkeypatch):
    """Der Beleg fuer den Befund: ohne Riegel gewinnt das juengste Datum.

    `_pick_current_set` beruecksichtigt nur Sets, die bereits erschienen
    sind — deshalb wird hier der Tag NACH dem 16.09.2026 gestellt, dem
    Erscheinungstag von "30th Celebration". Genau in diesem Zustand
    liefe der Wochenlauf am Freitag, 18.09.

    Faellt diese Zusicherung, ist `_pick_current_set` klueger geworden
    und der Riegel womoeglich ueberfluessig — dann gehoert er geprueft,
    nicht blind behalten.
    """
    import datetime as _dt

    class _Tag(_dt.date):
        @classmethod
        def today(cls):
            return cls(2026, 9, 18)

    monkeypatch.setattr(update_sets.datetime, "date", _Tag)
    assert _pick_current_set({"PBL": "2026-07-17", "30C": "2026-09-16"}) == "30C", (
        "ohne Riegel wuerde am 18.09.2026 das Sonderset zum Formatanker")


def test_kuenftige_sets_werden_noch_nicht_gezogen():
    """Heute (vor dem 16.09.) ist der Fall noch nicht eingetreten — der
    Riegel wird gebraucht, BEVOR er greifen muss."""
    assert _pick_current_set({"PBL": "2026-07-17", "30C": "2026-09-16"}) == "PBL"


# ── Die andere Richtung: ein Hauptset fehlt in ROTATIONEN ────────────

def test_ein_echtes_neues_hauptset_ohne_rotationseintrag_wird_gemeldet(tmp_path, monkeypatch):
    """Der stillere Weg: das Set ist echt, ROTATIONEN kennt es nicht.

    Dann ordnet formatschluessel() alle Turniere danach weiter dem alten
    Fenster zu, und die Kartenzeilen zweier Formate landen in derselben
    Datei — genau das, was die Aufteilung je Format verhindern soll.
    """
    import json
    meta = {"PBL": {"order": 158, "release_date": "2026-07-17"},
            "DRI2": {"order": 159, "release_date": "2026-11-06"}}
    (tmp_path / "sets_metadata.json").write_text(json.dumps(meta), encoding="utf-8")
    _kartendatei(str(tmp_path), {"DRI2": 60})
    monkeypatch.setattr(api, "ROTATIONEN", (("TEF-PBL", "PBL"),))
    monkeypatch.setattr(api, "_fenster_zwischenspeicher", None)
    treffer = api.fehlendes_fenster(str(tmp_path))
    assert treffer is not None, "ein gespieltes neues Hauptset muss auffallen"
    assert treffer[0] == "DRI2" and treffer[2] == 60


def test_ein_ungespieltes_neues_set_wird_nicht_gemeldet(tmp_path, monkeypatch):
    """Sonst meldete der Lauf bei jedem Sammlerset eine Warnung, und
    nach der dritten liest sie niemand mehr."""
    import json
    meta = {"PBL": {"order": 158, "release_date": "2026-07-17"},
            "30C": {"order": 159, "release_date": "2026-09-16"}}
    (tmp_path / "sets_metadata.json").write_text(json.dumps(meta), encoding="utf-8")
    _kartendatei(str(tmp_path), {"PBL": 40})
    monkeypatch.setattr(api, "ROTATIONEN", (("TEF-PBL", "PBL"),))
    monkeypatch.setattr(api, "_fenster_zwischenspeicher", None)
    assert api.fehlendes_fenster(str(tmp_path)) is None


def test_beide_schwellen_sind_dieselbe_zahl():
    """Zwei Orte, eine Messung. Laufen sie auseinander, trennt der eine
    Riegel anders als der andere und niemand merkt es."""
    assert api.ANKER_MIN_KARTEN == update_sets.ANKER_MIN_KARTEN


# ── Der Bestand von heute ────────────────────────────────────────────

def test_der_heutige_bestand_belegt_pbl_und_lehnt_die_minisets_ab():
    """An den echten Daten, nicht an gebauten. Strukturpruefung an
    Live-Daten ist zulaessig (tests/unit/test-testdaten-wachhund.js);
    eine enge Zahl waere es nicht — deshalb nur belegt/nicht belegt."""
    if not os.path.exists(os.path.join("data", "online_api_cards_TEF-PBL.csv")):
        pytest.skip("online_api_cards_TEF-PBL.csv nicht vorhanden")
    assert anker_belegt("data", "PBL")[0]
    assert not anker_belegt("data", "MEE")[0]
    assert not anker_belegt("data", "30C")[0]


# ── Der Riegel im Schreibweg, nicht nur die Prueffunktion ────────────

def _fenster_schreiben(verzeichnis, current_set, release):
    import json
    pfad = os.path.join(verzeichnis, "format_window.json")
    with open(pfad, "w", encoding="utf-8") as datei:
        json.dump({"current_set": current_set, "oldest_legal_set": "TEF",
                   "set_release_date": release,
                   "in_person_legal_date": "2026-07-31", "lag_days": 14,
                   "current_set_jp": "M6", "jp_release_date": "2026-07-31",
                   "previous_format_key": "TEF-CRI",
                   "set_addition_only": True}, datei)
    return pfad


def _heute(monkeypatch, jahr, monat, tag):
    import datetime as _dt

    class _Tag(_dt.date):
        @classmethod
        def today(cls):
            return cls(jahr, monat, tag)

    monkeypatch.setattr(update_sets.datetime, "date", _Tag)


def test_schreibweg_laesst_das_sonderset_nicht_durch(tmp_path, monkeypatch):
    """Der eigentliche Riegel — die Prueffunktion allein genuegt nicht.

    Ohne diese Zusicherung ueberlebt die Mutation "if not belegt" ->
    "if False" gruen: `anker_belegt()` waere weiter richtig und der
    Schreibweg wuerde sie trotzdem ignorieren. Genau das ist am
    08.09.2026 bei der ersten Sondenrunde passiert.
    """
    import json
    verzeichnis = str(tmp_path)
    _fenster_schreiben(verzeichnis, "PBL", "2026-07-17")
    _kartendatei(verzeichnis, {"PBL": 40})          # 30C spielt niemand
    (tmp_path / "sets_metadata.json").write_text("{}", encoding="utf-8")
    monkeypatch.setattr(update_sets, "data_dir", verzeichnis)
    _heute(monkeypatch, 2026, 9, 18)                # Wochenlauf nach dem 16.09.

    ergebnis = update_sets.write_format_window(
        os.path.join(verzeichnis, "sets_metadata.json"),
        en_release_dates={"PBL": "2026-07-17", "30C": "2026-09-16"},
        jp_release_dates={"M6": "2026-07-31"})

    assert ergebnis == "", "der Lauf haette abbrechen muessen"
    with open(os.path.join(verzeichnis, "format_window.json"), encoding="utf-8") as f:
        gespeichert = json.load(f)
    assert gespeichert["current_set"] == "PBL", (
        "das Formatfenster ist auf ein Sonderset gesprungen — jeder "
        "formatabhaengige Chunk-Dateiname griffe danach ins Leere")
    assert gespeichert["previous_format_key"] == "TEF-CRI", (
        "die manuellen Felder muessen unberuehrt bleiben")


def test_schreibweg_laesst_ein_echtes_hauptset_durch(tmp_path, monkeypatch):
    """Der Riegel darf keine echte Rotation aufhalten — sonst friert das
    Format ein und niemand merkt es, bis die Daten nicht mehr passen."""
    import json
    verzeichnis = str(tmp_path)
    _fenster_schreiben(verzeichnis, "PBL", "2026-07-17")
    _kartendatei(verzeichnis, {"PBL": 40, "DRI2": 60})   # wird gespielt
    (tmp_path / "sets_metadata.json").write_text("{}", encoding="utf-8")
    monkeypatch.setattr(update_sets, "data_dir", verzeichnis)
    _heute(monkeypatch, 2026, 11, 10)

    update_sets.write_format_window(
        os.path.join(verzeichnis, "sets_metadata.json"),
        en_release_dates={"PBL": "2026-07-17", "DRI2": "2026-11-06"},
        jp_release_dates={"M6": "2026-07-31"})

    with open(os.path.join(verzeichnis, "format_window.json"), encoding="utf-8") as f:
        gespeichert = json.load(f)
    assert gespeichert["current_set"] == "DRI2", (
        "ein belegtes Hauptset muss das Fenster weiterdrehen")


# ── Der Zugangsschluessel darf nicht ins Protokoll ───────────────────

def test_der_schluessel_steht_nie_in_einer_url():
    """Limitless erlaubt `?key=` UND den Header `X-Access-Key`.

    Der Header ist der einzig vertretbare Weg: eine URL landet im
    Protokoll des Laufs, in Fehlermeldungen und in jedem
    Zwischenspeicher. Diese Zusicherung haelt fest, dass niemand aus
    Bequemlichkeit auf den Query-Parameter zurueckfaellt.
    """
    verbindung = api.LimitlessApi(schluessel="GEHEIM")
    for pfad, params in (("tournaments", {"game": "PTCG"}),
                         ("tournaments/abc/standings", None),
                         ("tournaments", {"limit": 100, "page": 2})):
        url = verbindung._url(pfad, params)
        assert "GEHEIM" not in url, f"Schluessel steht in der URL: {url}"
        assert "key=" not in url


def test_ohne_schluessel_bleibt_alles_wie_bisher():
    ohne = api.LimitlessApi()
    assert ohne.schluessel is None
    assert ohne._url("tournaments", {"game": "PTCG"}).endswith("?game=PTCG")
