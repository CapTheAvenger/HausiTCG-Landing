"""data/_archive gehoert nicht in die Auslieferung — der Rest von data/ schon.

BEFUND (10.09.2026): `.github/workflows/deploy-pages.yml` kopierte den
kompletten Ordner `data` nach `_site/data` (`cp -r data _site/data`), und
`data/_archive/` haengt mit rein — GEMESSEN 21 MB, 14 Dateien
(`soft-delete-2026-03-31/`, siehe MOVED_FILES.txt darin). Der eigene Audit
(docs/audit/infrastructure/02-data-sources.md, 2.3.4) haelt fest, dass der
Ordner "bewusst archivierte Files" enthaelt und "fuer den Audit ignoriert"
wird — er ist Altbestand, kein aktiver Datensatz.

`grep -rn "_archive" js/ data/*.json data/*.md tests/` traf ausserhalb
dieses Ordners keine Datei, die daraus liest (die einzigen Treffer waren
ein unabhaengiges Wort "archive" in CSV-Dateinamen eines Rotationstests).
`scripts/generate-offline-manifest.py` schliesst den Ordner schon
ausdruecklich vom Offline-Prefetch aus, und `.gitignore` fuehrt
`_archive/` als ignoriert (AUDIT_GITHUB.md F-08) — die Absicht war also
immer, ihn nicht mit auszuliefern, nur der Deploy-Workflow tat es trotzdem.

Diese Datei fuehrt die im Workflow stehenden Kopierbefehle GEGEN EINE
NACHGEBAUTE Kopie der echten data/-Topologie aus (Dateinamen und -typen
wie im Arbeitsbaum, Inhalt leer) — nicht gegen eine Behauptung ueber den
Text, sondern gegen das tatsaechliche Verhalten der Zeilen. Zwei Dinge
werden geprueft, absichtlich beide: dass `_archive` NICHT mehr da ist
(der eigentliche Fund) UND dass der Rest von `data/` weiterhin da ist
(die Gegenprobe — ein `rm -rf _site/data` waere sonst technisch auch
gruen).
"""

import os
import re
import shutil
import subprocess
import tempfile

import pytest
import yaml

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, "..", ".."))
WORKFLOW = os.path.join(WURZEL, ".github", "workflows", "deploy-pages.yml")
DATEN = os.path.join(WURZEL, "data")


def _build_run_text():
    """Der `run:`-Text des Schritts 'Prepare deployment directory'."""
    with open(WORKFLOW, encoding="utf-8") as f:
        wf = yaml.safe_load(f)
    build = wf["jobs"]["build"]
    schritt = next(s for s in build["steps"]
                   if s.get("name") == "Prepare deployment directory")
    return schritt["run"]


def _daten_kopierzeilen(run_text: str) -> str:
    """Nur die Zeilen, die `data` nach `_site/data` kopieren bzw. dort
    danach etwas ausschliessen — beginnend bei `cp -r data _site/data`,
    bis zur ersten Zeile, die weder ein Kommentar noch ein Bezug auf
    `_site/data` ist (das ist die naechste, fachfremde Kopierzeile)."""
    zeilen = run_text.split("\n")
    start = next(i for i, z in enumerate(zeilen)
                 if re.search(r"cp\s+-r\s+data\s+_site/data\b", z))
    heraus = [zeilen[start]]
    for z in zeilen[start + 1:]:
        s = z.strip()
        if s == "" or s.startswith("#") or "_site/data" in z:
            heraus.append(z)
            continue
        break
    return "\n".join(heraus)


def test_der_workflow_hat_ueberhaupt_eine_kopierzeile_fuer_data():
    """Vorpruefung: bricht der Workflow-Text um, muss das hier auffallen,
    nicht erst als leerer Testlauf weiter unten."""
    run_text = _build_run_text()
    assert re.search(r"cp\s+-r\s+data\s+_site/data\b", run_text), (
        "kein `cp -r data _site/data` mehr im Deploy-Workflow gefunden — "
        "wurde die Kopierzeile umgeschrieben?")


def test_die_kopierzeilen_schliessen_archive_ausdruecklich_aus():
    """Steht ueberhaupt ein Ausschluss da, bevor er ausgefuehrt wird?"""
    block = _daten_kopierzeilen(_build_run_text())
    assert "_archive" in block, (
        "die Kopierzeilen fuer data/ erwaehnen _archive nicht — der "
        "Ordner wuerde wieder mitgeliefert:\n" + block)


@pytest.fixture()
def nachgebaute_daten_kopie():
    """Eine leere Kopie der ECHTEN data/-Topologie: dieselben Namen und
    Typen (Datei/Ordner), aber ohne Inhalt — schnell zu bauen, und die
    Probe laeuft trotzdem gegen die tatsaechliche Struktur von heute,
    nicht gegen eine erfundene."""
    tmp = tempfile.mkdtemp(prefix="deploy_archiv_probe_")
    try:
        quelle_data = os.path.join(tmp, "data")
        os.makedirs(quelle_data)
        echte_top_level = os.listdir(DATEN)
        assert echte_top_level, "data/ ist leer — die Probe waere ohne Aussage"
        for name in echte_top_level:
            pfad = os.path.join(DATEN, name)
            ziel = os.path.join(quelle_data, name)
            if os.path.isdir(pfad):
                os.makedirs(ziel, exist_ok=True)
            else:
                open(ziel, "w").close()
        yield tmp, echte_top_level
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def test_archive_fehlt_nach_dem_kopieren_der_rest_von_data_bleibt(nachgebaute_daten_kopie):
    tmp, echte_top_level = nachgebaute_daten_kopie
    block = _daten_kopierzeilen(_build_run_text())

    aus = subprocess.run(["bash", "-c", "mkdir -p _site && " + block], cwd=tmp,
                          capture_output=True, text=True)
    assert aus.returncode == 0, (
        f"die Kopierzeilen aus dem Workflow sind als Shell-Befehl "
        f"fehlgeschlagen:\n{aus.stdout}\n{aus.stderr}")

    site_data = os.path.join(tmp, "_site", "data")
    assert os.path.isdir(site_data), "cp -r data _site/data hat nichts erzeugt"

    # 1. Der eigentliche Fund: _archive ist NICHT dabei.
    assert not os.path.exists(os.path.join(site_data, "_archive")), (
        "data/_archive wurde trotz der neuen Zeilen mit ausgeliefert")

    # 2. Die Gegenprobe: alles andere ist weiterhin da. Ohne diese
    #    Zusicherung waere `rm -rf _site/data` (statt nur des Unterordners)
    #    ebenfalls gruen — genau der Fehler, den diese Probe ausschliessen
    #    soll.
    erwartet = sorted(n for n in echte_top_level if n != "_archive")
    tatsaechlich = sorted(os.listdir(site_data))
    fehlt = sorted(set(erwartet) - set(tatsaechlich))
    zuviel = sorted(set(tatsaechlich) - set(erwartet))
    assert not fehlt, f"diese Eintraege aus data/ fehlen nach dem Kopieren: {fehlt}"
    assert not zuviel, f"unerwartete Eintraege in _site/data: {zuviel}"
    assert len(tatsaechlich) >= 100, (
        f"nur {len(tatsaechlich)} Eintraege in _site/data — das waere ein "
        "verdaechtig kleiner Ausschnitt von data/ (heute 178 Eintraege)")
