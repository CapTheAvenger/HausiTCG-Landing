"""Die Online-Seite der Datengrundlage darf nicht still veralten.

BEFUND (07.09.2026). Die aktuellste Zahl der ganzen Seite hatte keinen
Waechter. data/limitless_online_fenster.csv traegt den einzigen Meta-Anteil,
der das LAUFENDE Fenster misst, und speist laut der Schwellentabelle in
scripts/sanity_check_data.py 12-30 % des prognostizierten Anteils im Meta
Call. Sie hatte:

  * keinen Eintrag in scripts/build_data_stand.py  -> kein Erhebungsdatum,
  * keinen Herzschlag                              -> "lief der Job" unklar,
  * `continue-on-error` auf ihrem Schritt           -> Ausfall unsichtbar.

Dasselbe galt fuer die drei Scraper daneben (limitless_online,
online_tournament, current_meta_analysis): der Herzschlag deckte vier Jobs
ab, und keiner davon war einer von ihnen.

Und die Luecke, die alle drei Tore gemeinsam offen liessen: eine Datei, die
byte-identisch BLEIBT. Das Sanity-Tor vergleicht Zeilenzahlen — eine
unveraenderte Datei hat exakt so viele wie vorher und passiert jede Schwelle.

Diese Zusicherungen rufen die Pruefungen auf, statt den Quelltext abzugrasen;
wo der Wochenlauf gemeint ist, wird sein `run`-Block wirklich ausgefuehrt.
"""
import datetime as dt
import importlib.util
import json
import os
import re
import subprocess

import pytest

HIER = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HIER, "..", ".."))
WOCHENLAUF = os.path.join(ROOT, ".github", "workflows", "weekly-full-update.yml")

# Die vier Jobs, die zusammen die Online-Seite der Datengrundlage schreiben.
ONLINE_JOBS = (
    "scrapers/limitless_online_scraper.py",
    "scrapers/online_tournament_scraper.py",
    "scrapers/current_meta_analysis_scraper.py",
    "scripts/build_online_fenster.py",
)

# Die Dateien, die bis heute in keinem Stand gefuehrt waren.
ONLINE_DATEIEN = (
    "limitless_online_fenster.csv",
    "current_meta_card_data.csv",
    "online_tournament_dated_cards.csv",
    "labs_tournament_matchups.csv",
)


def _laden(name, relpfad):
    pfad = os.path.join(ROOT, relpfad)
    spec = importlib.util.spec_from_file_location(name, pfad)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def _guardian():
    return _laden("guardian_online_wacht", "scripts/data_guardian.py")


def _datenstand():
    return _laden("build_data_stand_wacht", "scripts/build_data_stand.py")


def _quelle(relpfad):
    with open(os.path.join(ROOT, relpfad), encoding="utf-8") as f:
        return f.read()


# ── 1. Die Kadenz wird abgeleitet, nicht gesetzt ────────────────────────────

def test_die_schwelle_folgt_dem_cron_des_wochenlaufs():
    """Der groesste planmaessige Abstand kommt aus dem cron, nicht aus dem Kopf.

    '0 6 * * 2,5' heisst Dienstag und Freitag. Die beiden Abstaende sind
    Di->Fr 3 Tage und Fr->Di 4 Tage. Eine Schwelle unter 5 Tagen wuerde bei
    einem Job, der genau nach Plan laeuft, strukturell garantiert falsch
    feuern — dieselbe Lehre, die price_guide_6.json gekostet hat.
    """
    text = _quelle(".github/workflows/weekly-full-update.yml")
    treffer = re.search(r"cron:\s*'([^']+)'", text)
    assert treffer, "der Wochenlauf hat keinen cron mehr — Ableitung pruefen"
    felder = treffer.group(1).split()
    assert len(felder) == 5, f"unerwarteter cron: {treffer.group(1)!r}"
    tage = sorted(int(t) for t in felder[4].split(","))
    assert tage, "der cron nennt keine Wochentage"

    # Groesster Abstand zwischen zwei Laeufen, ueber die Wochengrenze hinweg.
    abstaende = [b - a for a, b in zip(tage, tage[1:])] + [tage[0] + 7 - tage[-1]]
    groesste_luecke = max(abstaende)

    g = _guardian()
    assert g.WOCHENLAUF_MAX_LUECKE == groesste_luecke, (
        f"der Waechter rechnet mit {g.WOCHENLAUF_MAX_LUECKE} Tagen Luecke, "
        f"der cron {treffer.group(1)!r} ergibt {groesste_luecke}")
    assert g.WOCHENLAUF_SCHWELLE == groesste_luecke + 1, (
        "die Schwelle soll genau einen Tag Luft ueber der groessten "
        "planmaessigen Luecke liegen")


def test_die_online_jobs_stehen_im_herzschlag():
    g = _guardian()
    fehlend = [j for j in ONLINE_JOBS if j not in g.HERZSCHLAG]
    assert not fehlend, (
        f"ohne Herzschlag ist ihr Schweigen keine Aussage: {fehlend}")
    for job in ONLINE_JOBS:
        max_alter, kadenz = g.HERZSCHLAG[job]
        assert max_alter == g.WOCHENLAUF_SCHWELLE, (
            f"{job} traegt {max_alter} statt der aus dem cron abgeleiteten "
            f"{g.WOCHENLAUF_SCHWELLE} Tage")
        assert "Di+Fr" in kadenz, f"{job} nennt seine Kadenz nicht"


def test_jede_stillstandsdatei_hat_einen_bewachten_job():
    """Die Stillstandsmeldung nennt einen Job — der muss auch bewacht sein.

    Sonst zeigt die Meldung auf einen Herzschlag, den niemand prueft, und
    der Leser laeuft ins Leere.
    """
    g = _guardian()
    for datei, (_, job) in g.STILLSTAND.items():
        assert job in g.HERZSCHLAG, (
            f"data/{datei} verweist auf {job}, der nicht im Herzschlag steht")


# ── 2. Die Dateien bekommen ueberhaupt ein Datum ────────────────────────────

def test_die_online_dateien_stehen_in_der_standliste():
    d = _datenstand()
    fehlend = [f for f in ONLINE_DATEIEN if f not in d.DATEIEN]
    assert not fehlend, (
        f"ohne Eintrag in build_data_stand.py bekommen sie kein Datum, und "
        f"ein Chip auf sie muesste 'unbekannt' sagen: {fehlend}")


def test_das_formatfenster_steht_in_der_standliste():
    d = _datenstand()
    assert "format_window.json" in d.DATEIEN, (
        "die Datei entscheidet, welches Format gefiltert wird — ihr Alter "
        "gehoert in den Stand")


def test_fehlender_stand_faellt_nicht_still_aus_der_datei(tmp_path, monkeypatch):
    """Ein fehlender Schluessel und 'wir wissen noch nichts' sehen gleich aus.

    Deshalb fuehrt data_stand.json die Liste ohne_stand: eine gefuehrte
    Datei, die es gibt und fuer die noch kein Datum vorliegt, wird benannt
    statt weggelassen.
    """
    d = _datenstand()
    daten = tmp_path / "data"
    daten.mkdir()
    (daten / "limitless_online_fenster.csv").write_text(
        "deck_name;share_fenster\nA;1\n", encoding="utf-8")
    monkeypatch.setattr(d, "WURZEL", str(tmp_path))
    monkeypatch.setattr(d, "ZIEL", str(daten / "data_stand.json"))
    monkeypatch.setattr(d, "geaendert", lambda: set())
    monkeypatch.setattr(d, "bisher", lambda: {})
    monkeypatch.setattr("sys.argv", ["build_data_stand.py"])

    assert d.main() == 0
    geschrieben = json.loads((daten / "data_stand.json").read_text(encoding="utf-8"))
    assert "limitless_online_fenster.csv" in geschrieben["ohne_stand"], (
        "eine gefuehrte Datei ohne Datum verschwindet stillschweigend aus "
        "der Ausgabe")


def test_das_fenster_bekommt_sein_inhaltsdatum_aus_der_nebendatei(tmp_path, monkeypatch):
    """Das Fenster gilt fuer die ganze Datei, nicht je Zeile.

    Sein Ende steht maschinenlesbar als fenster_bis in
    data/limitless_online_fenster_meta.json. Ohne diese Ebene stuende am
    Chip nur, WANN geschrieben wurde — nicht, wie weit die Zahlen reichen.
    """
    d = _datenstand()
    daten = tmp_path / "data"
    daten.mkdir()
    (daten / "limitless_online_fenster.csv").write_text(
        "deck_name;share_fenster\nA;1\n", encoding="utf-8")
    (daten / "limitless_online_fenster_meta.json").write_text(
        json.dumps({"fenster_von": "2026-08-22", "fenster_bis": "2026-09-06"}),
        encoding="utf-8")
    monkeypatch.setattr(d, "WURZEL", str(tmp_path))
    monkeypatch.setattr(d, "ZIEL", str(daten / "data_stand.json"))
    monkeypatch.setattr(d, "geaendert", lambda: {"limitless_online_fenster.csv"})
    monkeypatch.setattr(d, "bisher", lambda: {})
    monkeypatch.setattr("sys.argv", ["build_data_stand.py"])

    assert d.main() == 0
    geschrieben = json.loads((daten / "data_stand.json").read_text(encoding="utf-8"))
    assert geschrieben["inhalt_bis"]["limitless_online_fenster.csv"] == "2026-09-06"


# ── 3. Stillstand ───────────────────────────────────────────────────────────

def _stillstand_vorbereiten(tmp_path, monkeypatch, g, alter_tage,
                            herzschlag=None, erlaubt_still=frozenset()):
    daten = tmp_path / "data"
    daten.mkdir(exist_ok=True)
    (daten / "testdatei.csv").write_text("a;b\n1;2\n", encoding="utf-8")
    if herzschlag is not None:
        (daten / g.HEARTBEAT_DATEI).write_text(json.dumps(herzschlag),
                                               encoding="utf-8")
    monkeypatch.setattr(g, "DATA", str(daten))
    monkeypatch.setattr(g, "STILLSTAND",
                        {"testdatei.csv": (5, "scrapers/testscraper.py")})
    monkeypatch.setattr(g, "_leer_erlaubt", lambda: set(erlaubt_still))
    if alter_tage is None:
        monkeypatch.setattr(g, "_last_commit_date", lambda p: None)
    else:
        tag = dt.date.today() - dt.timedelta(days=alter_tage)
        monkeypatch.setattr(g, "_last_commit_date", lambda p, _t=tag: _t)
    return daten


def test_eine_frisch_geschriebene_datei_meldet_nichts(tmp_path, monkeypatch):
    g = _guardian()
    _stillstand_vorbereiten(tmp_path, monkeypatch, g, 1)
    findings = []
    g.check_stillstand(findings)
    assert findings == [], f"eine frische Datei erzeugt Meldungen: {findings}"


def test_die_schwelle_gilt_genau(tmp_path, monkeypatch):
    """Auf der Schwelle still, einen Tag darueber laut."""
    g = _guardian()
    for tage, soll_melden in [(5, False), (6, True)]:
        findings = []
        _stillstand_vorbereiten(tmp_path, monkeypatch, g, tage)
        g.check_stillstand(findings)
        hat = bool(findings)
        assert hat is soll_melden, (
            f"bei {tage} Tagen Stillstand meldet der Waechter "
            f"{'etwas' if hat else 'nichts'} — erwartet war das Gegenteil")


def test_byte_identische_datei_ueber_mehrere_laeufe_wird_kritisch(tmp_path, monkeypatch):
    """Der Fall, den kein Tor sah: gross, vollstaendig, unveraendert.

    Die Meldung muss drei Dinge nennen, sonst hilft sie nicht weiter: das
    Alter, die erlaubte Schwelle und den Stand des zustaendigen Jobs.
    """
    g = _guardian()
    _stillstand_vorbereiten(
        tmp_path, monkeypatch, g, 11,
        herzschlag={"scrapers/testscraper.py": {
            "status": "OK", "zuletzt_erfolgreich": "2026-09-06T16:38:24Z"}})
    findings = []
    g.check_stillstand(findings)
    kritisch = [t for s, t in findings if s == "CRITICAL"]
    assert len(kritisch) == 1, f"erwartet genau ein CRITICAL: {findings}"
    text = kritisch[0]
    assert "11 Tagen" in text, f"das Alter fehlt: {text}"
    assert "5" in text, f"die erlaubte Schwelle fehlt: {text}"
    assert "scrapers/testscraper.py" in text, f"der Job fehlt: {text}"
    assert "2026-09-06T16:38:24Z" in text, (
        "der Herzschlag des Jobs fehlt — ohne ihn ist nicht zu unterscheiden, "
        "ob der Job tot ist oder laeuft und nichts liefert")


def test_ein_job_ohne_herzschlag_wird_in_der_meldung_benannt(tmp_path, monkeypatch):
    g = _guardian()
    _stillstand_vorbereiten(tmp_path, monkeypatch, g, 11, herzschlag={})
    findings = []
    g.check_stillstand(findings)
    kritisch = [t for s, t in findings if s == "CRITICAL"]
    assert len(kritisch) == 1
    assert "kein Herzschlag" in kritisch[0], (
        f"die Meldung verschweigt, dass der Job gar keinen Herzschlag "
        f"schreibt: {kritisch[0]}")


def test_saisonpause_loest_keinen_fehlalarm_aus(tmp_path, monkeypatch):
    """Vorbild sind die vier City-League-Dateien.

    Was das Sanity-Tor mit Schwelle 0 ausdruecklich als 'darf leer sein'
    fuehrt, steht sachlich still. Sichtbar bleibt es trotzdem — aber als
    WARN mit Begruendung. Ein Waechter, der viermal falschen Alarm schlaegt,
    wird beim fuenften Mal nicht mehr gelesen.
    """
    g = _guardian()
    _stillstand_vorbereiten(tmp_path, monkeypatch, g, 40,
                            erlaubt_still={"testdatei.csv"})
    findings = []
    g.check_stillstand(findings)
    assert findings, "der Stillstand wird gar nicht mehr gemeldet"
    assert all(s == "WARN" for s, _ in findings), (
        f"eine ausdruecklich als still erlaubte Datei eskaliert: {findings}")
    assert "Schwelle 0" in findings[0][1], (
        "die Meldung sagt nicht, WARUM sie keine Eskalation ist")


def test_die_ausnahmeliste_kommt_aus_dem_sanity_tor():
    """Zwei Listen waeren zwei Wahrheiten. Es gibt nur eine."""
    g = _guardian()
    erlaubt = g._leer_erlaubt()
    assert "city_league_analysis.csv" in erlaubt, (
        "der Waechter liest die Schwelle-0-Liste des Sanity-Tors nicht mehr")


def test_ohne_git_verlauf_ist_die_pruefung_blind_und_sagt_das(tmp_path, monkeypatch):
    """'Nichts gemessen' und 'alles in Ordnung' sind zwei Aussagen."""
    g = _guardian()
    _stillstand_vorbereiten(tmp_path, monkeypatch, g, None)
    findings = []
    g.check_stillstand(findings)
    assert [s for s, _ in findings] == ["WARN"], findings
    assert "blind" in findings[0][1]


def test_eine_fehlende_stillstandsdatei_ist_kritisch(tmp_path, monkeypatch):
    g = _guardian()
    daten = tmp_path / "data"
    daten.mkdir()
    monkeypatch.setattr(g, "DATA", str(daten))
    monkeypatch.setattr(g, "STILLSTAND",
                        {"weg.csv": (5, "scrapers/testscraper.py")})
    findings = []
    g.check_stillstand(findings)
    assert [s for s, _ in findings] == ["CRITICAL"], findings


def test_das_sanity_tor_kann_stillstand_gar_nicht_sehen(tmp_path):
    """Die Begruendung dafuer, dass die Pruefung im Waechter sitzt.

    Das Tor zaehlt Zeilen. Eine Datei, die sich nicht geaendert hat, hat
    exakt so viele Zeilen wie vorher — sie passiert jede Schwelle, egal wie
    lange sie schon steht. Hier gemessen statt behauptet.
    """
    s = _laden("sanity_wacht", "scripts/sanity_check_data.py")
    datei = tmp_path / "limitless_online_fenster.csv"
    kopf = "deck_name;share_fenster\n"
    zeilen = "".join(f"D{i};1.0\n" for i in range(200))
    datei.write_text(kopf + zeilen, encoding="utf-8")
    schwelle = s.THRESHOLDS["limitless_online_fenster.csv"]
    for _ in range(6):                     # sechs planmaessige Laeufe, nichts aendert sich
        assert s.count_csv_rows(str(datei)) >= schwelle, (
            "die Testdatei liegt unter der Schwelle — Aufbau pruefen")
    assert s.count_csv_rows(str(datei)) == 200


def test_labs_matchups_stehen_bewusst_nicht_im_stillstand():
    """Zwischen zwei Turnieren aendert sich eine Matchup-Matrix zu Recht nicht.

    Gemessen am Verlauf der echten Datei: eine Luecke von 31.07. bis
    01.09.2026, ohne dass ihr Scraper ausgefallen waere. Sie in den
    Stillstand aufzunehmen hiesse, jeden Sommer falschen Alarm zu schlagen —
    ihr Waechter ist der Herzschlag des Labs-Scrapers.
    """
    g = _guardian()
    assert "labs_tournament_matchups.csv" not in g.STILLSTAND
    assert "scrapers/labs_tournament_scraper.py" in g.HERZSCHLAG


# ── 4. format_window.json ───────────────────────────────────────────────────

def _fenster_schreiben(tmp_path, monkeypatch, g, inhalt, alter_tage=29):
    daten = tmp_path / "data"
    daten.mkdir(exist_ok=True)
    (daten / "format_window.json").write_text(json.dumps(inhalt), encoding="utf-8")
    monkeypatch.setattr(g, "DATA", str(daten))
    tag = dt.date.today() - dt.timedelta(days=alter_tage)
    monkeypatch.setattr(g, "_last_commit_date", lambda p, _t=tag: _t)
    return daten


def test_das_alter_des_formatfensters_wird_genannt(tmp_path, monkeypatch):
    """29 Tage unveraendert waren bis heute nirgends zu sehen."""
    g = _guardian()
    _fenster_schreiben(tmp_path, monkeypatch, g, {
        "current_set": "PBL", "oldest_legal_set": "TEF",
        "previous_format_key": "TEF-CRI", "set_addition_only": True})
    monkeypatch.setattr(g, "_meta_zeitraeume", lambda: {})
    findings = []
    g.check_formatfenster_alter(findings)
    texte = [t for _, t in findings]
    assert texte, "das Alter des Formatfensters wird nirgends genannt"
    assert any("29 Tage" in t for t in texte), texte
    assert any("previous_format_key" in t and "von Hand" in t for t in texte), (
        "die von Hand gepflegten Felder werden nicht als solche benannt")


def test_ein_widersprochenes_vorformat_meldet_sich(tmp_path, monkeypatch):
    """Das Handfeld gegen die gemessenen Turnierdaten.

    Bei einer Rotation wird current_set automatisch nachgezogen und
    previous_format_key vergessen — dann gatet der Predictor gegen das
    falsche Vorformat.
    """
    g = _guardian()
    _fenster_schreiben(tmp_path, monkeypatch, g, {
        "current_set": "PBL", "oldest_legal_set": "TEF",
        "previous_format_key": "TEF-POR", "set_addition_only": True})
    monkeypatch.setattr(g, "_meta_zeitraeume", lambda: {
        "TEF-PBL": ("2026-08-28", "2026-08-28"),
        "TEF-CRI": ("2026-06-06", "2026-06-12"),
        "TEF-POR": ("2026-04-25", "2026-05-30"),
    })
    findings = []
    g.check_formatfenster_alter(findings)
    warn = [t for s, t in findings if s == "WARN"]
    assert len(warn) == 1, f"der Widerspruch bleibt unbemerkt: {findings}"
    assert "TEF-CRI" in warn[0] and "TEF-POR" in warn[0], warn[0]


def test_ein_stimmiges_vorformat_meldet_sich_nicht(tmp_path, monkeypatch):
    g = _guardian()
    _fenster_schreiben(tmp_path, monkeypatch, g, {
        "current_set": "PBL", "oldest_legal_set": "TEF",
        "previous_format_key": "TEF-CRI", "set_addition_only": True})
    monkeypatch.setattr(g, "_meta_zeitraeume", lambda: {
        "TEF-PBL": ("2026-08-28", "2026-08-28"),
        "TEF-CRI": ("2026-06-06", "2026-06-12"),
        "TEF-POR": ("2026-04-25", "2026-05-30"),
    })
    findings = []
    g.check_formatfenster_alter(findings)
    assert not [t for s, t in findings if s == "WARN"], findings


def test_die_zeitraeume_kommen_aus_den_echten_auszuegen():
    """Der Leser der Meldung muss sie nachrechnen koennen."""
    g = _guardian()
    raeume = g._meta_zeitraeume()
    if not raeume:
        pytest.skip("keine Labs-Auszuege in diesem Baum")
    for kuerzel, (von, bis) in raeume.items():
        assert not kuerzel.startswith("_"), (
            f"__unsorted ist kein Format, steht aber als {kuerzel!r} drin")
        assert von <= bis, f"{kuerzel}: {von} liegt nach {bis}"


# ── 5. Hat jede gefuehrte Datei einen Stand? ────────────────────────────────

def test_eine_gefuehrte_datei_ohne_stand_meldet_sich(tmp_path, monkeypatch):
    g = _guardian()
    daten = tmp_path / "data"
    daten.mkdir()
    (daten / "limitless_online_fenster.csv").write_text("a;b\n1;2\n", encoding="utf-8")
    (daten / "data_stand.json").write_text(json.dumps({"dateien": {}}),
                                           encoding="utf-8")
    monkeypatch.setattr(g, "DATA", str(daten))
    monkeypatch.setattr(g, "_gefuehrte_dateien",
                        lambda: ["limitless_online_fenster.csv"])
    findings = []
    g.check_datenstand(findings)
    assert [s for s, _ in findings] == ["WARN"], findings
    assert "unbekannt" in findings[0][1], (
        "die Meldung sagt nicht, was ein Chip auf diese Datei zeigen wuerde")


def test_eine_gefuehrte_datei_mit_stand_meldet_sich_nicht(tmp_path, monkeypatch):
    g = _guardian()
    daten = tmp_path / "data"
    daten.mkdir()
    (daten / "limitless_online_fenster.csv").write_text("a;b\n1;2\n", encoding="utf-8")
    (daten / "data_stand.json").write_text(json.dumps(
        {"dateien": {"limitless_online_fenster.csv": "2026-09-06T16:39:09+00:00"}}),
        encoding="utf-8")
    monkeypatch.setattr(g, "DATA", str(daten))
    monkeypatch.setattr(g, "_gefuehrte_dateien",
                        lambda: ["limitless_online_fenster.csv"])
    findings = []
    g.check_datenstand(findings)
    assert findings == [], findings


def test_eine_fehlende_standdatei_ist_eine_meldung(tmp_path, monkeypatch):
    """Ohne data_stand.json steht jeder Chip der Seite auf 'unbekannt'."""
    g = _guardian()
    daten = tmp_path / "data"
    daten.mkdir()
    monkeypatch.setattr(g, "DATA", str(daten))
    monkeypatch.setattr(g, "_gefuehrte_dateien", lambda: ["irgendwas.csv"])
    findings = []
    g.check_datenstand(findings)
    assert [s for s, _ in findings] == ["WARN"], findings


def test_die_standliste_wird_gelesen_statt_wiederholt():
    """Zwei Listen waeren zwei Wahrheiten."""
    g = _guardian()
    gefuehrt = g._gefuehrte_dateien()
    d = _datenstand()
    assert gefuehrt == list(d.DATEIEN), (
        "der Waechter fuehrt eine eigene Kopie der Standliste")


# ── 6. Die Pruefungen haengen wirklich im Lauf ──────────────────────────────

@pytest.mark.parametrize("aufruf", [
    "check_stillstand(findings)",
    "check_formatfenster_alter(findings)",
    "check_datenstand(findings)",
])
def test_jede_neue_pruefung_haengt_in_main(aufruf):
    quelle = _quelle("scripts/data_guardian.py")
    ab_main = quelle[quelle.index("def main("):]
    assert aufruf in ab_main, f"{aufruf} steht nicht in main() — die Pruefung laeuft nie"


# ── 7. Der Wochenlauf: kein stiller Fehlschlag mehr ─────────────────────────

def _schritte_lesen(pfad):
    """Die Schritte eines Workflows als [{name, run, if, continue_on_error}].

    Bewusst ohne PyYAML — die CI installiert es nicht, und ein `import yaml`
    bricht pytest schon in der Sammlung ab (siehe test_wochenlauf_bilanz.py).
    """
    import textwrap
    with open(pfad, encoding="utf-8") as f:
        zeilen = f.read().splitlines()

    schritte, aktuell, run_einzug = [], None, None
    for zeile in zeilen:
        nackt = zeile.strip()
        treffer_name = re.match(r"^(\s*)-\s+name:\s*(.+?)\s*$", zeile)
        if treffer_name:
            if aktuell:
                schritte.append(aktuell)
            aktuell = {"name": treffer_name.group(2).strip().strip("'\""),
                       "run": "", "if": None, "continue_on_error": False}
            run_einzug = None
            continue
        if aktuell is None:
            continue
        if run_einzug is not None:
            if nackt == "" or (len(zeile) - len(zeile.lstrip())) > run_einzug:
                aktuell["run"] += zeile + "\n"
                continue
            run_einzug = None
        treffer_run = re.match(r"^(\s*)run:\s*\|\s*$", zeile)
        if treffer_run:
            run_einzug = len(treffer_run.group(1))
            continue
        treffer_run_kurz = re.match(r"^\s*run:\s*(\S.*?)\s*$", zeile)
        if treffer_run_kurz:
            aktuell["run"] += treffer_run_kurz.group(1) + "\n"
            continue
        if re.match(r"^\s*continue-on-error:\s*true\s*$", zeile):
            aktuell["continue_on_error"] = True
            continue
        treffer_if = re.match(r"^\s*if:\s*(.+?)\s*$", zeile)
        if treffer_if:
            aktuell["if"] = treffer_if.group(1).strip()
    if aktuell:
        schritte.append(aktuell)
    for s in schritte:
        s["run"] = textwrap.dedent(s["run"])
    return schritte


@pytest.fixture(scope="module")
def schritte():
    gelesen = _schritte_lesen(WOCHENLAUF)
    assert len(gelesen) > 5, f"nur {len(gelesen)} Schritte gelesen — Parser pruefen"
    return gelesen


def _fensterschritt(schritte):
    treffer = [s for s in schritte
               if "scripts/build_online_fenster.py" in (s.get("run") or "")]
    assert treffer, "der Fensterschritt kommt im Wochenlauf nicht vor"
    return treffer[0]


def test_der_fensterschritt_darf_nicht_mehr_still_scheitern(schritte):
    """`continue-on-error: true` heisst: gescheitert UND gruen UND unprotokolliert.

    Genau dieser Schritt schreibt die aktuellste Zahl der Seite. Nicht
    blockierend soll er bleiben — aber nach dem Muster der drei Schritte
    daneben: rc sichern, in die Bilanz schreiben, mit 0 enden.
    """
    schritt = _fensterschritt(schritte)
    assert not schritt["continue_on_error"], (
        "der Fensterschritt traegt wieder continue-on-error — ein Ausfall "
        "waere damit an keiner Stelle sichtbar")
    lauf = schritt["run"]
    assert "rc=$?" in lauf, "der Rueckgabewert wird nicht gesichert"
    assert "rc_extra.txt" in lauf, "der Rueckgabewert landet in keiner Bilanz"
    assert "FAIL scripts/build_online_fenster.py" in lauf
    assert "OK   scripts/build_online_fenster.py" in lauf, (
        "ohne OK-Eintrag sieht 'lief nie' aus wie 'lief gut'")
    assert lauf.rstrip().endswith("exit 0"), (
        "der Schritt soll nicht blockieren — aber durch ein bewusstes "
        "exit 0, nicht durch continue-on-error")


def test_die_scraperschleife_hinterlaesst_einen_herzschlag(schritte):
    """Drei der vier Online-Jobs laufen in der Schleife 'Run scrapers'.

    Ohne rc-Protokoll je Scraper bleibt ihr Herzschlag leer, und ein
    stehengebliebener Job ist nur noch an einem unveraenderten Dateidatum
    zu erkennen — also gar nicht.
    """
    schleife = [s for s in schritte
                if "scrapers/limitless_online_scraper.py" in (s.get("run") or "")]
    assert schleife, "die Scraper-Schleife wurde nicht gefunden"
    lauf = schleife[0]["run"]
    assert "rc_batch.txt" in lauf, (
        "die Schleife schreibt keinen Herzschlag — die Online-Scraper bleiben "
        "unbewacht")
    assert 'echo "OK   $step" >> "$RUNNER_TEMP/rc_batch.txt"' in lauf
    assert 'echo "FAIL $step (rc=$rc)" >> "$RUNNER_TEMP/rc_batch.txt"' in lauf


def _bilanzschritt(schritte):
    treffer = [s for s in schritte if "rc_extra.txt" in (s.get("run") or "")
               and "GITHUB_STEP_SUMMARY" in (s.get("run") or "")]
    assert treffer, "kein Schritt wertet die Bilanz aus"
    return treffer[0]


def test_der_bilanzschritt_schreibt_die_online_jobs_in_den_herzschlag(
        schritte, tmp_path):
    """Ausgefuehrt, nicht behauptet: beide Bilanzquellen landen in der Datei."""
    bilanz = _bilanzschritt(schritte)
    skript = tmp_path / "bilanz.sh"
    skript.write_text(bilanz["run"], encoding="utf-8")
    (tmp_path / "tmp").mkdir()
    (tmp_path / "data").mkdir()
    (tmp_path / "tmp" / "rc_extra.txt").write_text(
        "OK   scripts/build_online_fenster.py\n", encoding="utf-8")
    (tmp_path / "tmp" / "rc_batch.txt").write_text(
        "OK   scrapers/limitless_online_scraper.py\n"
        "OK   scrapers/online_tournament_scraper.py\n"
        "FAIL scrapers/current_meta_analysis_scraper.py (rc=1)\n",
        encoding="utf-8")
    umgebung = dict(os.environ,
                    RUNNER_TEMP=str(tmp_path / "tmp"),
                    GITHUB_STEP_SUMMARY=str(tmp_path / "summary.md"))
    ergebnis = subprocess.run(["bash", str(skript)], cwd=tmp_path,
                              capture_output=True, text=True, env=umgebung)
    assert ergebnis.returncode == 0, ergebnis.stderr
    stand = json.loads((tmp_path / "data" / "_job_heartbeats.json")
                       .read_text(encoding="utf-8"))
    for job in ONLINE_JOBS:
        assert job in stand, f"{job} bekommt keinen Herzschlag: {sorted(stand)}"
    assert stand["scrapers/current_meta_analysis_scraper.py"]["status"] == "FAIL"
    assert "zuletzt_erfolgreich" not in \
        stand["scrapers/current_meta_analysis_scraper.py"]
    assert stand["scripts/build_online_fenster.py"]["status"] == "OK"


def test_ein_ausfall_in_der_schleife_faerbt_die_bilanz_nicht_rot(schritte, tmp_path):
    """Die Schleife wertet ihre eigenen Ausfaelle aus (fail_count / critical_failed).

    rc_batch.txt ist nur die Herzschlagquelle. Wuerde sie mitgezaehlt, waere
    jeder einzelne Scraperausfall doppelt gemeldet — und die Schwelle
    "ab zwei nicht blockierenden Ausfaellen wird der Lauf rot" verloere ihre
    Bedeutung.
    """
    bilanz = _bilanzschritt(schritte)
    skript = tmp_path / "bilanz.sh"
    skript.write_text(bilanz["run"], encoding="utf-8")
    (tmp_path / "tmp").mkdir()
    (tmp_path / "data").mkdir()
    (tmp_path / "tmp" / "rc_extra.txt").write_text(
        "OK   scripts/build_online_fenster.py\n", encoding="utf-8")
    (tmp_path / "tmp" / "rc_batch.txt").write_text(
        "FAIL scrapers/limitless_online_scraper.py (rc=1)\n"
        "FAIL scrapers/online_tournament_scraper.py (rc=1)\n", encoding="utf-8")
    umgebung = dict(os.environ,
                    RUNNER_TEMP=str(tmp_path / "tmp"),
                    GITHUB_STEP_SUMMARY=str(tmp_path / "summary.md"))
    ergebnis = subprocess.run(["bash", str(skript)], cwd=tmp_path,
                              capture_output=True, text=True, env=umgebung)
    assert ergebnis.returncode == 0, ergebnis.stderr
    assert "::error::" not in ergebnis.stdout, ergebnis.stdout
    stand = json.loads((tmp_path / "data" / "_job_heartbeats.json")
                       .read_text(encoding="utf-8"))
    assert stand["scrapers/limitless_online_scraper.py"]["status"] == "FAIL"


def test_die_bilanz_laeuft_auch_ohne_schleifenprotokoll(schritte, tmp_path):
    """Faellt die Schleife komplett aus, darf der Bilanzschritt nicht mitfallen."""
    bilanz = _bilanzschritt(schritte)
    skript = tmp_path / "bilanz.sh"
    skript.write_text(bilanz["run"], encoding="utf-8")
    (tmp_path / "tmp").mkdir()
    (tmp_path / "data").mkdir()
    (tmp_path / "tmp" / "rc_extra.txt").write_text(
        "OK   scrapers/labs_tournament_scraper.py\n", encoding="utf-8")
    umgebung = dict(os.environ,
                    RUNNER_TEMP=str(tmp_path / "tmp"),
                    GITHUB_STEP_SUMMARY=str(tmp_path / "summary.md"))
    ergebnis = subprocess.run(["bash", str(skript)], cwd=tmp_path,
                              capture_output=True, text=True, env=umgebung)
    assert ergebnis.returncode == 0, ergebnis.stderr
    stand = json.loads((tmp_path / "data" / "_job_heartbeats.json")
                       .read_text(encoding="utf-8"))
    assert stand["scrapers/labs_tournament_scraper.py"]["status"] == "OK"
