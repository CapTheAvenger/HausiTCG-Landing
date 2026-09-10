"""Wachhund gegen eingefrorene Datenwerte in Python-Tests. (10.09.2026)

WARUM ES DIESE DATEI GIBT

Am 10.09.2026 wurde `main` zweimal rot, ohne dass etwas kaputt war:

  * test_meta_prognose.py fror den ANTEIL des offenen Nachher-Fensters
    ein (4,38 %, gemessen am 08.09.2026). Der Auto-Lauf der
    Limitless-API liess das Fenster planmaessig wachsen (4,30 % am
    10.09.), die Gleichheit fiel um, der Deploy hing. Behoben in
    Commit 048f4bb6: der Wochenwert wurde durch eine GLEICHUNG gegen
    dieselbe Datei ersetzt (Fenster summieren sich zur Gesamtdatei).
  * test_cent_regel_zuordnung.py entschied die MEP-4-Zuordnung an
    EINER Tageskennzahl (`trend`, 15,47 gegen 15,51 — vier Cent). Die
    uebrigen Kennzahlen desselben Tages lagen 1-7 EUR auseinander.
    Behoben in Commit 504a4fc3: die Regel verlangt jetzt Naehe in
    MEHREREN Kennzahlen.

Fuer JS gibt es genau diesen Wachhund seit Wochen
(tests/unit/test-testdaten-wachhund.js). Er zaehlt aber ausdruecklich
nur UNGLEICHUNGEN (`assert.ok(... [<>]=? zahl ...)`) — sein eigener
Kommentar vom 04.09.2026 haelt fest, dass eine harte Gleichheit gegen
Live-Daten genau diese Bauart einmal durchgelassen hat, "weil er
Ungleichungen zaehlt, und eine Gleichheit ist strenger als jede
Ungleichung". Diese Datei schliesst die Luecke fuer Python: sie zaehlt
GLEICHHEITEN (`== zahl`, `pytest.approx(zahl)`) gegen einen Wert, der
aus einer echten Datei unter data/ stammt.

WAS GEMESSEN WURDE, BEVOR HIER IRGENDETWAS GEBAUT WURDE

  1. Ein blindes Regex ("liest irgendwo data/, hat irgendwo == Zahl")
     ueber alle 143 Dateien in tests/python/ traf 317 Stellen in 49
     Dateien. Stichprobe: weit ueber 90 % waren Ruecklaufcodes
     (`.returncode == 0`), Laengen selbst gebauter Fixtures
     (`tmp_path`-Verzeichnisse mit erfundenen Zeilen) oder Zaehlungen
     im eigenen Quelltext (`CODE.count(...) == 1`). Als Wachhund
     unbrauchbar — der Fehlalarm waere die Regel, nicht die Ausnahme.
  2. Verengt auf Funktionsebene (unten beschrieben: nur Funktionen,
     deren EIGENER Code oder deren Fixture einen echten data/-Pfad
     traegt, und die kein tmp_path/monkeypatch/isolated_data_dir
     verwenden) sinkt das auf 11 Treffer in 4 Dateien. Von diesen 11
     sind, nachgeprueft, ZWEI ein Fehlalarm (test_druck_von_der_seite.py
     haengt nur `get_data_dir()` auf das echte data/-Verzeichnis um,
     liest in den betroffenen Tests aber nichts daraus — die Zahlen
     kommen aus `karte()`-Aufrufen im Testcode selbst) und NEUN
     legitime, aber erklaerungsbeduerftige Faelle (feste Kennungen wie
     Pokedex-Nummern, abgeschlossene Kurationsrunden, das bereits
     behobene Meta-Prognose-Fenster). Keiner davon ist ein aktueller
     Fehler — das Register unten haelt trotzdem fest, WARUM.

DIE HEURISTIK — UND IHRE GRENZEN

Eine Funktion gilt als "liest echte Daten", wenn ihr eigener
Quelltext ODER eine Fixture, von der sie abhaengt, ein
`os.path.join(..., "data")`-Muster enthaelt (egal ob ueber eine
Konstante wie `DATEN`/`WURZEL`/`ROOT` oder inline) — UND weder die
Funktion noch ihre Fixture `tmp_path`, `monkeypatch`,
`isolated_data_dir` oder `welt` referenzieren (das sind die Namen, an
denen dieses Projekt seine selbst gebauten Test-Fixtures erkennbar
macht). Darin wird jede Gleichheit gegen eine nackte Zahl (ausser
0/1/-1, die meist boolesch oder strukturell sind) und jedes
`pytest.approx(zahl)` gezaehlt, mit Ausnahme von `.returncode == n`.

Bekannte blinde Flecken, offen benannt statt verschwiegen:
  * Eine Funktion, die echte Daten ueber eine Hilfsfunktion in einer
    DRITTEN Datei laedt (nicht als Fixture in derselben Datei), wird
    nicht erkannt.
  * Ein data/-Pfad, der nicht ueber `os.path.join(..., "data")`
    gebaut wird (String-Verkettung, f-Strings), wird nicht erkannt.
  * `tmp_path`/`monkeypatch` schliesst eine Funktion GANZ aus, auch
    wenn sie daneben echte Daten liest — bewusst so gewaehlt: lieber
    einen echten Fall uebersehen als test_druck_von_der_seite.py zur
    Regel statt zur Ausnahme machen.
Der Zaehler unten sieht also nicht jede Gleichheit an Live-Daten,
genau wie sein JS-Vorbild nur ein Viertel der Ungleichungen sieht
(siehe dessen eigener Kommentar vom 03.09.2026). Er ist trotzdem
besser als nichts: beide bisherigen roten Laeufe waeren als
unregistrierter Fund aufgefallen, bevor sie main erreichten.
"""

import ast
import os
import re

HIER = os.path.dirname(os.path.abspath(__file__))

REDIRECT_HINWEISE = ("tmp_path", "isolated_data_dir", "monkeypatch", "welt")

# Eine Konstante, die auf den echten data/-Ordner zeigt, egal wie sie heisst
# (DATEN, WURZEL, ROOT, ...) — Zeile fuer Zeile am Modulanfang.
DATENVAR_DEF = re.compile(r'^\s*(\w+)\s*=\s*os\.path\.join\([^)]*["\']data["\']\)\s*$', re.M)
# ...oder direkt inline in einer Funktion/Fixture aufgebaut.
INLINE_DATENPFAD = re.compile(r'os\.path\.join\([^)]*["\']data["\']')

GLEICHHEIT = re.compile(r"==\s*(-?\d+(?:\.\d+)?)\b")
APPROX = re.compile(r"pytest\.approx\(\s*(-?\d+(?:\.\d+)?)")


def _ist_fixture_dekoriert(func: ast.FunctionDef) -> bool:
    for d in func.decorator_list:
        if isinstance(d, ast.Attribute) and d.attr == "fixture":
            return True
        if isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) and d.func.attr == "fixture":
            return True
        if isinstance(d, ast.Name) and d.id == "fixture":
            return True
    return False


def _leitet_um(text: str, params: set) -> bool:
    if params & set(REDIRECT_HINWEISE):
        return True
    return any(h in text for h in REDIRECT_HINWEISE)


def _funde_in_datei(pfad: str):
    """Liste von (funktionsname, zeile, quelltext) mit eingefrorenen
    Gleichheiten gegen echte data/-Werte in EINER Testdatei."""
    with open(pfad, encoding="utf-8") as f:
        quelle = f.read()

    datenvars = set(DATENVAR_DEF.findall(quelle))
    if not datenvars and not INLINE_DATENPFAD.search(quelle):
        return []

    try:
        baum = ast.parse(quelle, filename=pfad)
    except SyntaxError:
        return []

    def liest_echte_daten(segment: str) -> bool:
        if INLINE_DATENPFAD.search(segment):
            return True
        return any(re.search(r"\b" + re.escape(v) + r"\b", segment) for v in datenvars)

    # Fixtures im selben Modul, die selbst (ohne Umleitung) echte Daten lesen.
    echte_fixtures = set()
    for node in ast.walk(baum):
        if isinstance(node, ast.FunctionDef) and _ist_fixture_dekoriert(node):
            params = {a.arg for a in node.args.args}
            segment = ast.get_source_segment(quelle, node) or ""
            if _leitet_um(segment, params):
                continue
            if liest_echte_daten(segment):
                echte_fixtures.add(node.name)

    funde = []
    for node in ast.walk(baum):
        if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
            continue
        params = {a.arg for a in node.args.args}
        segment = ast.get_source_segment(quelle, node) or ""
        if _leitet_um(segment, params):
            continue
        if not (liest_echte_daten(segment) or (params & echte_fixtures)):
            continue
        start = node.lineno
        for i, zeile in enumerate(segment.split("\n"), start=start):
            s = zeile.strip()
            if s.startswith("#"):
                continue
            if re.search(r"\.returncode\s*==", zeile):
                continue
            treffer = GLEICHHEIT.search(zeile) or APPROX.search(zeile)
            if not treffer:
                continue
            wert = treffer.group(1)
            if wert in ("0", "1", "-1"):
                continue
            funde.append((node.name, i, s[:160]))
    return funde


def alle_testdateien():
    return sorted(
        f for f in os.listdir(HIER)
        if f.startswith("test_") and f.endswith(".py") and f != os.path.basename(__file__)
    )


def funde_je_datei():
    ergebnis = {}
    for fn in alle_testdateien():
        treffer = _funde_in_datei(os.path.join(HIER, fn))
        if treffer:
            ergebnis[fn] = treffer
    return ergebnis


# Das Register. Jede Datei, die eine Gleichheit gegen einen aus data/
# gelesenen Wert fuehrt, steht hier mit einem Satz dazu, WARUM das kein
# Wochenwert ist (oder ein belegter Fehlalarm dieser Heuristik). Eine
# neue, unregistrierte Datei laesst den Test unten fallen.
REGISTER = {
    "test_datenluecken.py": (
        "Vier Gleichheiten. Zwei betreffen den ABGESCHLOSSENEN Kurations-"
        "stand '16 Mega-Faehigkeiten belegt' (Stand 31.08.2026, siehe "
        "Kommentar im Test) — waechst die Zahl, ist eine Form dazugekommen "
        "oder eine Uebernahme zurueckgenommen, und genau das SOLL rot "
        "werden. 'erste == 63' ist die abgeschlossene ERSTE Kurationsrunde "
        "vom 03.09.2026; spaetere Ergaenzungen zaehlen in 'zweite'/'dritte'/"
        "'vierte', nie in 'erste' hinein. Die vierte zaehlt Anfuehrungs-"
        "zeichen in einem festen Beispielsatz derselben Datei."
    ),
    "test_dex_nummern.py": (
        "Drei Gleichheiten gegen die nationale Pokedex-Nummer (Thievul "
        "828, Nidoran-w 29, Nidoran-m 32). Amtliche, seit Jahren fixierte "
        "Kennungen — kein Wert, den ein Scraper-Lauf neu zieht."
    ),
    "test_druck_von_der_seite.py": (
        "FEHLALARM dieser Heuristik, gemessen am 10.09.2026: die "
        "'css'-Fixture haengt get_data_dir() auf das echte data/-"
        "Verzeichnis um, liest in den beiden betroffenen Tests daraus "
        "aber nichts — Db() ist eine handgeschriebene Kartenliste, und "
        "len(k)==4 sowie die Summe 29 folgen aus den karte()-Aufrufen im "
        "selben Testcode. Steht trotzdem hier, weil der Wachhund den "
        "Unterschied zwischen 'Pfad zeigt auf data/' und 'liest wirklich "
        "daraus' nicht sehen kann (siehe Docstring, 'blinde Flecken')."
    ),
    "test_meta_prognose.py": (
        "Der Regressionsriegel gegen den Vorher-Nenner (7,59 % bei "
        "26.130 Listen). Bezieht sich auf das ABGESCHLOSSENE Zeitfenster "
        "bis 27.08.2026 — das waechst mit keinem weiteren Lauf mehr. "
        "Korrigiert in Commit 048f4bb6 vom 10.09.2026, NACHDEM der "
        "damalige NACHHER-Wert (4,38 %, ein echter Wochenwert) main "
        "genau auf die hier beschriebene Art rot gemacht hatte."
    ),
}

# Stand 10.09.2026: 11 Gleichheiten in den vier obigen Dateien (4 + 3 + 2 + 2).
# Wer eine neue Gleichheit gegen einen data/-Wert hinzufuegt, muss diese
# Zahl bewusst hochsetzen und die Datei im Register begruenden. Faustregel
# wie beim JS-Vorbild: ein FESTER, sich nie mehr aendernder Wert (amtliche
# Kennung, abgeschlossenes Fenster) darf als Zahl dastehen; ein Wert, der
# mit dem naechsten Scrape wandert (Prozentsatz eines offenen Fensters,
# Zeilenzahl einer wachsenden Datei), gehoert als GLEICHUNG gegen dieselbe
# Datei geschrieben, nicht als Literal.
OBERGRENZE = 11


def test_jede_datei_mit_eingefrorenem_datenwert_steht_im_register():
    gefunden = funde_je_datei()
    unbekannt = sorted(set(gefunden) - set(REGISTER))
    assert unbekannt == [], (
        "Diese Testdateien vergleichen einen aus data/ gelesenen Wert per "
        "== oder pytest.approx() gegen eine feste Zahl, stehen aber nicht "
        "im Register:\n"
        + "\n".join(f"  {f}: {gefunden[f]}" for f in unbekannt)
        + "\n\nEintragen und in einem Satz begruenden, warum die Zahl auch "
        "nach dem naechsten Scrape noch stimmt. Wandert sie mit den Daten "
        "(Anteil eines offenen Fensters, Zeilenzahl einer wachsenden "
        "Datei), gehoert sie als Gleichung gegen dieselbe Datei geschrieben "
        "statt als Literal — siehe Commit 048f4bb6."
    )


def test_register_zeigt_auf_keine_geloeschte_datei():
    vorhanden = set(alle_testdateien())
    tot = sorted(f for f in REGISTER if f not in vorhanden)
    assert tot == [], f"Register zeigt auf geloeschte Dateien: {tot}"


def test_die_zahl_der_eingefrorenen_datenwerte_steigt_nicht():
    gefunden = funde_je_datei()
    gesamt = sum(len(v) for v in gefunden.values())
    assert gesamt <= OBERGRENZE, (
        f"Eingefrorene Gleichheiten gegen data/-Werte: {gesamt} "
        f"(erlaubt: {OBERGRENZE})\n"
        + "\n".join(f"  {len(v):>2}  {f}" for f, v in
                     sorted(gefunden.items(), key=lambda kv: -len(kv[1])))
        + "\n\nEine neue Gleichheit gegen einen data/-Wert ist die Bauart, "
        "die main am 10.09.2026 zweimal rot gemacht hat. Wenn sie wirklich "
        "noetig ist: OBERGRENZE hier hochsetzen und im Register begruenden, "
        "warum die Zahl auch in vier Wochen noch stimmt."
    )
