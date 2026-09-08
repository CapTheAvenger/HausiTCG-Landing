#!/usr/bin/env python3
"""Pflegt data/data_stand.json — wann welche Datendatei zuletzt neu geschrieben wurde.

WARUM ES DIESE DATEI GIBT

Bis zum 20.08.2026 zeigte jeder Frische-Chip der Seite den Tag des BESUCHS:

    localStorage.getItem('lastScraperUpdate') || new Date().toLocaleDateString()

Der linke Teil war immer leer — 'lastScraperUpdate' wird nirgends im Repo
geschrieben. Fuenf Reiter, deren Daten bis zu 19 Tage auseinanderliegen,
trugen dasselbe Datum, und das war das des Besuchers.

ZWEI WEGE, DIE NICHT TRAGEN

1. `Last-Modified` der Datei. GEMESSEN am 20.08.2026 gegen thedipidis.app:
   GitHub Pages setzt dort die DEPLOY-Zeit — fuer alle Dateien dieselbe
   (Thu, 20 Aug 2026 07:34), und bei city_league_archetypes.csv und
   city_league_analysis.csv gar keinen Kopf. Das haette das geratene Datum
   nur durch ein anderes ersetzt, das glaubwuerdiger aussieht.

2. `git log` im Deploy. Waere exakt, verlangt aber die volle Historie:
   .git ist 620 MB bei 2.962 Commits. Ein tiefer Clone bei jedem Deploy ist
   ein hoher Preis fuer ein Datum, und ein flacher Clone (die Vorgabe von
   actions/checkout) laesst `git log -1 -- datei` fuer JEDE Datei denselben
   Commit melden — derselbe Fehler in neuer Verpackung.

WIE ES STATTDESSEN LAEUFT

Der Stand wird dort festgehalten, wo er entsteht: im Wochenlauf, unmittelbar
bevor die neuen Daten committet werden. Geaenderte Dateien bekommen den
Zeitpunkt des Laufs, unveraenderte behalten ihren alten Eintrag. Damit
braucht es keine Historie — die Datei IST die Historie, fortgeschrieben.

Der Erstbestand wurde einmal aus dem vollen lokalen Verlauf erzeugt
(`--aus-git`), damit die Seite nicht bei null anfaengt.
"""

import argparse
import glob
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

# Positivliste statt Glob ueber data/: 145 Zeitstempel auszuliefern, von denen
# ein Dutzend gelesen wird, waere Ballast — und ein Glob nimmt beim naechsten
# Scraper stillschweigend Dateien auf, die niemand anzeigt.
DATEIEN = [
    "limitless_online_decks.csv",
    "limitless_online_decks_matchups.csv",
    "online_tournament_top8_decks.csv",
    "limitless_meta_stats.json",
    "city_league_archetypes.csv",
    "city_league_analysis.csv",
    "city_league_analysis_past.csv",
    "city_league_archetypes_past.csv",
    "all_cards_database.csv",
    "price_data.csv",
    "labs_tournament_decks.csv",
    "champions_usage.json",
    # NACHTRAG (Abnahmerunde 30.08.2026): diese beiden werden von
    # js/app-city-league.js als aktuelle City-League-Quellen geladen
    # (Zeilen 566-568 und 1598-1600), standen aber nicht in dieser
    # Liste. Sie sind heute LEER — ohne Eintrag haette ein Chip, der
    # kuenftig auf sie zeigt, "hat Daten" gemeldet.
    "city_league_archetypes_comparison.csv",
    "city_league_archetypes_deck_stats.csv",
    # Die eigentliche Quelle des Reiters "Vergangene Turniere". Der
    # Frischechip dort zeigte bis heute auf city_league_analysis_past.csv
    # — eine Datei, die dieser Reiter gar nicht laedt.
    "tournament_cards_data_overview.csv",
    # NACHTRAG 07.09.2026: die ONLINE-Seite der Datengrundlage stand komplett
    # nicht in dieser Liste — vier Dateien ohne jedes Datum.
    #
    # limitless_online_fenster.csv traegt die AKTUELLSTE Zahl der ganzen Seite:
    # den Anteil im laufenden 14-Tage-Fenster (Differenz zweier gemessener
    # Kumulativstaende). Sie speist laut scripts/sanity_check_data.py 12-30 %
    # des prognostizierten Anteils im Meta Call. Ohne Eintrag hier hat
    # ausgerechnet die juengste Zahl der Seite kein Erhebungsdatum — und ein
    # Chip, der auf sie zeigte, muesste "unbekannt" sagen.
    #
    # Die drei uebrigen tragen die Kartenanalyse (Deck Analysis, Typical
    # Build) und die Matchup-Matrix des Meta Calls.
    "limitless_online_fenster.csv",
    "current_meta_card_data.csv",
    "online_tournament_dated_cards.csv",
    "labs_tournament_matchups.csv",
    # format_window.json entscheidet, WELCHES Format ueberhaupt gefiltert
    # wird. Sie aendert sich nur bei einer Rotation, bekommt hier also erst
    # dann einen Stand — bis dahin steht sie in "ohne_stand" (siehe unten),
    # damit die Luecke sichtbar ist statt still. Ihr genaues Alter nennt
    # scripts/data_guardian.py aus dem vollen Verlauf; dieser Lauf hier
    # arbeitet auf einem flachen Klon und koennte es nur raten.
    "format_window.json",
    # NACHTRAG 08.09.2026: die vier Dateien des Limitless-API-Laufs
    # (.github/workflows/limitless-api-scrape.yml). Sie tragen die erste
    # VOLLSTAENDIGE Online-Datenbasis dieses Projekts — jeden Spieler jedes
    # erfassten Turniers statt nur der erfolgreichen Listen. Genau deshalb
    # muessen sie hier stehen: eine Datei, aus der eine Prognose gerechnet
    # wird, ohne Erhebungsdatum, ist die teuerste Sorte Zahl.
    #
    # Alle vier fuehren ihr Turnierdatum je Zeile, also steht auch ihr
    # Inhaltsdatum unten in INHALT_BIS.
    # Karten und Matchups liegen je Formatfenster in eigenen Dateien
    # (online_api_cards_TEF-PBL.csv …). Ein Frischechip zeigt immer auf
    # ein Format, nie auf "alle" — deshalb werden sie unten per Glob
    # aufgenommen statt hier einzeln gefuehrt.
    "online_api_tournaments.csv",
    "online_api_archetypes.csv",
    # Die gerechnete Prognose. Sie traegt kein Turnierdatum je Zeile,
    # sondern ein Fenster in `_meta` — deshalb steht sie unten in
    # INHALT_AUS_NEBENDATEI und nicht in INHALT_BIS.
    "meta_prognose.json",
]

# Dateien, die je Formatfenster aufgeteilt sind: mit jeder Rotation kommt
# eine dazu. Sie einzeln zu fuehren waere eine Pflegeaufgabe, die niemand
# macht — also werden sie beim Lauf eingesammelt.
DATEIEN_GLOB = (
    "online_api_cards_*.csv",
    "online_api_matchups_*.csv",
)


def gefuehrte_dateien():
    """DATEIEN plus die aktuell vorhandenen Chunkdateien.

    Wird bei JEDEM Aufruf neu ausgewertet: nach einer Rotation gibt es
    eine Datei mehr, und niemand soll sie von Hand nachtragen muessen.
    """
    heraus = list(DATEIEN)
    daten = os.path.join(WURZEL, "data")
    for muster in DATEIEN_GLOB:
        for treffer in sorted(glob.glob(os.path.join(daten, muster))):
            name = os.path.basename(treffer)
            if name not in heraus:
                heraus.append(name)
    return heraus

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(WURZEL, "data", "data_stand.json")

# Dateien, die ihr eigenes Datum im INHALT tragen: {Datei: Spaltenname}.
#
# Warum das noetig ist — gemessen am 29.08.2026:
# labs_tournament_decks.csv wurde am 25.08. neu geschrieben, das juengste
# Turnier darin ist aber vom 12.06. — 74 Tage Abstand. Der Betreiber hat
# bestaetigt: Sommerpause, die Daten stimmen.
#
# Kein Chip zeigt diese Datei heute an, es war also kein sichtbarer Fehler.
# Aber ein Schreibdatum, das 74 Tage vor dem Inhalt liegt, ist genau die
# Sorte Zahl, die spaeter jemand fuer bare Muenze nimmt.
#
# Beides ist wahr und beides gehoert hin: wann zuletzt geschaut wurde, und
# wie weit der Inhalt reicht. Bei 78 Tagen Abstand ist die zweite Zahl die,
# nach der ein Head Judge fragt.
INHALT_BIS = {
    "labs_tournament_decks.csv": "tournament_date",
    "city_league_archetypes.csv": "date",
    "city_league_archetypes_past.csv": "date",
    # Dieselbe Frage fuer die Online-Turnierkarten: die Datei fuehrt je Zeile
    # das Turnierdatum, also laesst sich sagen, wie weit ihr Inhalt reicht.
    "online_tournament_dated_cards.csv": "tournament_date",
    # Der Limitless-API-Lauf schreibt inkrementell an: die Datei kann heute
    # geschrieben worden sein und trotzdem nur Turniere von letzter Woche
    # enthalten, wenn seither keines die Schwelle erreicht hat. Beide Zahlen
    # gehoeren hin.
    "online_api_tournaments.csv": "date",
    "online_api_archetypes.csv": "date",
}


def inhalt_bis_tabelle():
    """INHALT_BIS plus die Chunkdateien — die fuehren dieselbe Spalte."""
    heraus = dict(INHALT_BIS)
    for name in gefuehrte_dateien():
        if name.startswith(("online_api_cards_", "online_api_matchups_")):
            heraus[name] = "date"
    return heraus

# Dateien, deren Inhaltsdatum in einer NEBENDATEI steht statt in einer Spalte:
# {Datei: (Nebendatei, Feld)}.
#
# limitless_online_fenster.csv hat kein Datum je Zeile — das Fenster gilt fuer
# die ganze Datei und steht in ihrer Kopfzeile ("# Fenster 2026-08-22 bis
# 2026-09-06") sowie, maschinenlesbar, als "fenster_bis" in
# data/limitless_online_fenster_meta.json. Gelesen wird die JSON-Datei: eine
# Kommentarzeile zu zerlegen waere ein Parser mehr, der beim naechsten
# Textwechsel still falsch liegt.
INHALT_AUS_NEBENDATEI = {
    "limitless_online_fenster.csv": ("limitless_online_fenster_meta.json",
                                     "fenster_bis"),
}

# Dateien, deren Inhaltsdatum in einem VERSCHACHTELTEN Feld der Datei
# selbst steht: {Datei: (Schluesselkette,)}.
#
# meta_prognose.json hat kein Datum je Zeile — die Prognose gilt fuer ein
# Fenster, und dessen Ende steht in `_meta.online_bis`. Ohne diesen
# Eintrag traegt ausgerechnet die gerechnete Zahl kein Inhaltsdatum, und
# ein Leser koennte eine drei Wochen alte Prognose fuer aktuell halten.
INHALT_AUS_FELD = {
    "meta_prognose.json": ("_meta", "online_bis"),
}


def inhalt_aus_feld(datei, kette):
    """Liest ein verschachteltes Feld aus einer JSON-Datei."""
    pfad = os.path.join(WURZEL, "data", datei)
    try:
        with open(pfad, encoding="utf-8") as fh:
            wert = json.load(fh)
    except (OSError, ValueError):
        return ""
    for schluessel in kette:
        if not isinstance(wert, dict):
            return ""
        wert = wert.get(schluessel)
    return str(wert)[:10] if wert else ""


def inhalt_aus_nebendatei(nebendatei, feld):
    """ISO-Tag aus einem Feld einer JSON-Nebendatei. None, wenn nicht lesbar."""
    pfad = os.path.join(WURZEL, "data", nebendatei)
    try:
        with open(pfad, encoding="utf-8") as fh:
            wert = (json.load(fh) or {}).get(feld)
    except (OSError, ValueError):
        return None
    wert = str(wert or "").strip()[:10]
    if len(wert) == 10 and wert[4] == "-" and wert[7] == "-":
        return wert
    return None


def _ohne_datenzeilen(datei):
    """True, wenn die CSV ausser der Kopfzeile nichts enthaelt.

    Nur CSVs: eine JSON-Datei steht oft in einer einzigen Zeile, und die
    waere nach dieser Rechnung "nur eine Kopfzeile". Beim ersten Lauf hat
    das champions_usage.json faelschlich als leer gemeldet — die Datei
    ist 1,4 MB gross und fuehrt 168 Pokemon.
    """
    if not datei.lower().endswith(".csv"):
        return False
    pfad = os.path.join(WURZEL, "data", datei)
    try:
        with open(pfad, encoding="utf-8-sig", errors="replace", newline="") as fh:
            fh.readline()                      # Kopfzeile
            for zeile in fh:
                if zeile.strip():
                    return False
        return True
    except OSError:
        return False


def inhalt_bis(datei, spalte):
    """Juengstes Datum IM Inhalt, als ISO-Tag. None, wenn nicht lesbar.

    Bewusst tolerant: findet die Spalte nicht statt, gibt es eben keine
    Angabe. Ein geratenes Inhaltsdatum waere derselbe Fehler wie das
    geratene Dateidatum, nur eine Ebene tiefer."""
    pfad = os.path.join(WURZEL, "data", datei)
    if not os.path.exists(pfad):
        return None
    try:
        import csv as _csv
        with open(pfad, newline="", encoding="utf-8-sig") as fh:
            kopf = fh.readline()
            trenn = ";" if kopf.count(";") > kopf.count(",") else ","
            fh.seek(0)
            werte = set()
            for r in _csv.DictReader(fh, delimiter=trenn):
                v = (r.get(spalte) or "").strip()[:10]
                if len(v) == 10 and v[4] == "-" and v[7] == "-":
                    werte.add(v)
        return max(werte) if werte else None
    except (OSError, ValueError, UnicodeDecodeError):
        return None


def _git(*args):
    try:
        out = subprocess.run(["git"] + list(args), cwd=WURZEL,
                             capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def bisher():
    if not os.path.exists(ZIEL):
        return {}
    try:
        with open(ZIEL, encoding="utf-8") as fh:
            return (json.load(fh) or {}).get("dateien", {}) or {}
    except (OSError, ValueError):
        return {}


def geaendert():
    """Welche der gefuehrten Dateien hat dieser Lauf angefasst?"""
    out = _git("status", "--porcelain", "--", "data/")
    if out is None:
        return set()
    treffer = set()
    for zeile in out.splitlines():
        pfad = zeile[3:].strip().strip('"')
        # Umbenennungen: "alt -> neu"
        if " -> " in pfad:
            pfad = pfad.split(" -> ", 1)[1]
        name = os.path.basename(pfad)
        if name in gefuehrte_dateien():
            treffer.add(name)
    return treffer


def aus_git():
    """Erstbestand aus dem vollen Verlauf. Braucht einen tiefen Clone."""
    stand = {}
    for f in gefuehrte_dateien():
        out = _git("log", "-1", "--format=%cI", "--", "data/" + f)
        if out and out.strip():
            stand[f] = out.strip()
    return stand


def main():
    p = argparse.ArgumentParser(description="Pflegt data/data_stand.json")
    p.add_argument("--aus-git", dest="aus_git_flag", action="store_true",
                   help="Erstbestand aus dem vollen Git-Verlauf erzeugen (tiefer Clone noetig)")
    args = p.parse_args()

    alt = bisher()
    jetzt = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if args.aus_git_flag:
        neu = aus_git()
        if not neu:
            print("kein Git-Verlauf lesbar — nichts geschrieben", file=sys.stderr)
            return 1
        stand = dict(alt)
        stand.update(neu)
        quelle = "git log -1 --format=%cI je Datei (Erstbestand)"
    else:
        frisch = geaendert()
        stand = dict(alt)
        for f in frisch:
            stand[f] = jetzt
        quelle = "Zeitpunkt des Laufs fuer geaenderte Dateien, sonst fortgeschrieben"
        print("in diesem Lauf geaendert: "
              + (", ".join(sorted(frisch)) if frisch else "keine"))

    # Eintraege fuer Dateien, die es nicht mehr gibt, fallen weg — ein Stand
    # ohne Datei waere eine Angabe ueber nichts.
    stand = {f: d for f, d in stand.items()
             if f in gefuehrte_dateien()
             and os.path.exists(os.path.join(WURZEL, "data", f))}

    # Zweite Ebene: wie weit reicht der INHALT? Nur fuer die Dateien, die
    # ein eigenes Datum fuehren, und nur wenn es sich lesen laesst.
    inhalt = {}
    for f, kette in INHALT_AUS_FELD.items():
        if f not in stand:
            continue
        bis = inhalt_aus_feld(f, kette)
        if bis:
            inhalt[f] = bis

    for f, spalte in inhalt_bis_tabelle().items():
        if f not in stand:
            continue
        bis = inhalt_bis(f, spalte)
        if bis:
            inhalt[f] = bis
    for f, (nebendatei, feld) in INHALT_AUS_NEBENDATEI.items():
        if f not in stand or f in inhalt:
            continue
        bis = inhalt_aus_nebendatei(nebendatei, feld)
        if bis:
            inhalt[f] = bis

    # Dritte Ebene: hat die Datei ueberhaupt Zeilen?
    #
    # BEFUND (Schlussabnahme 30.08.2026): der Frische-Chip der City League
    # zeigte "Daten: 31.7.2026" — den Schreibzeitpunkt von
    # city_league_analysis.csv. Diese Datei hat aber 0 Datenzeilen (nur
    # die Kopfzeile), und die gezeigten Zahlen stammen aus
    # city_league_archetypes_past.csv vom 6. Juni. Daneben stand
    # "Verfuegbar: 6.6.2026" — zwei Daten, acht Wochen auseinander.
    #
    # Ein Datum an einer leeren Datei ist kein Stand, sondern der
    # Zeitpunkt, an dem zuletzt nichts hineingeschrieben wurde. Der Chip
    # soll das sagen koennen, also muss er es wissen.
    leer = sorted(f for f in stand if _ohne_datenzeilen(f))

    # Vierte Ebene: welche gefuehrte Datei hat GAR KEINEN Stand?
    #
    # Der Stand wird nur fortgeschrieben, wenn ein Lauf die Datei anfasst. Eine
    # neu in DATEIEN aufgenommene Datei hat also so lange keinen Eintrag, bis
    # sie sich das erste Mal aendert — und ohne diese Liste faellt sie einfach
    # aus der JSON heraus. Ein fehlender Schluessel und "diese Datei fuehren
    # wir, wissen aber noch nichts ueber sie" sehen fuer jeden Leser gleich
    # aus; das ist genau die Art stiller Luecke, gegen die diese Datei
    # geschrieben wurde. scripts/data_guardian.py (check_datenstand) meldet
    # daraus einen Befund, wenn die Datei bei jedem Lauf neu geschrieben wird.
    ohne_stand = sorted(f for f in gefuehrte_dateien()
                        if f not in stand
                        and os.path.exists(os.path.join(WURZEL, "data", f)))

    with open(ZIEL, "w", encoding="utf-8") as fh:
        json.dump({"erzeugt_am": jetzt, "quelle": quelle,
                   "dateien": stand, "inhalt_bis": inhalt, "leer": leer,
                   "ohne_stand": ohne_stand},
                  fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    if leer:
        print("ohne Datenzeilen: " + ", ".join(leer))
    if ohne_stand:
        print("noch ohne Stand (bekommen eins beim naechsten Lauf, der sie "
              "aendert): " + ", ".join(ohne_stand))

    print("data/data_stand.json: %d Staende" % len(stand))
    for f, d in sorted(stand.items()):
        zusatz = ("   Inhalt bis " + inhalt[f]) if f in inhalt else ""
        print("  %-38s %s%s" % (f, d, zusatz))
    return 0


if __name__ == "__main__":
    sys.exit(main())
