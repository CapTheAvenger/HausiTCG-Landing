#!/usr/bin/env python3
"""
Meta-Prognose: vom Online-Anteil zum erwarteten Praesenzfeld
============================================================

WAS HIER GEMESSEN WIRD
----------------------
Die Frage "was duerfte beim naechsten Praesenzturnier relevant sein" wurde
bis zum 08.09.2026 mit dem Online-Anteil beantwortet, als waeren beide
dasselbe. Sie sind es nicht, und der Unterschied ist messbar.

Gemessen an ALLEN ZEHN Praesenzturnieren der drei Formatfenster
TEF-POR, TEF-CRI und TEF-PBL (17.061 Spieler), jeweils gegen die
Online-Anteile der 14 Tage davor:

    Turnier                        Spieler     r    MAE   Top-5 online -> Praesenz
    Regional Prague                  1367  0,945   0,58    32,6 % -> 42,6 %  (+10,0)
    Regional Los Angeles             1844  0,938   0,50    28,1 % -> 38,8 %  (+10,7)
    Regional Campinas                1722  0,917   0,59    29,9 % -> 41,8 %  (+11,9)
    Regional Utrecht                 2143  0,954   0,34    29,9 % -> 33,2 %  ( +3,3)
    Special Event Lima                485  0,860   1,02    33,8 % -> 47,6 %  (+13,8)
    Regional Melbourne                958  0,951   0,44    33,8 % -> 36,8 %  ( +3,1)
    Regional Indianapolis            1970  0,909   0,58    36,1 % -> 44,7 %  ( +8,6)
    Special Event Turin              2032  0,865   0,70    34,8 % -> 38,8 %  ( +4,0)
    International New Orleans        3743  0,892   0,59    36,0 % -> 47,9 %  (+11,9)
    World Championship San Francisco  797  0,803   1,34    36,7 % -> 59,3 %  (+22,6)

Zwei Befunde, und beide halten ueber alle zehn:

1. **Online sagt Praesenz gut voraus.** Mittleres r = 0,903, mittlerer
   absoluter Fehler 0,67 Prozentpunkte.

2. **Das Praesenzfeld verdichtet sich auf die Spitze — bei ZEHN von ZEHN
   Ankern.** Die fuenf groessten Decks tragen auf Papier im Mittel
   10,0 Prozentpunkte mehr als online, Spanne +3,1 bis +22,6.

Das ist kein Zufall eines Turniers, sondern das Verhalten des Feldes:
online wird breit ausprobiert, auf Papier greifen die Leute zu dem, was
sie fuer sicher halten.

WARUM DIE TURNIERART ZAEHLT
---------------------------
Worlds ist der schlechteste Anker der zehn — hoechste Verdichtung
(+22,6), niedrigstes r (0,803), groesster Fehler (1,34 pp). Ein Feld mit
Einladungsschranke ist kein Regional. Die sieben Regionals liegen bei
r = 0,909 bis 0,954 und einem Fehler von 0,34 bis 0,59 pp.

Wer fuer ein Regional prognostiziert, nimmt deshalb die Regionals als
Grundlage, nicht Worlds. Das Modell rechnet je Turnierart getrennt.

WAS DAS SKRIPT NICHT TUT
------------------------
Es rechnet **nicht** ueber Formatgrenzen hinweg. Zwei Gruende, beide
gemessen:

* Der Kartenpool. Mega Excadrill ex ist PBL-65 und hat in TEF-CRI und
  TEF-POR **null** Zeilen. Nimmt man alle Fenster als Vorher-Nenner,
  wird aus 1.983/26.130 = 7,59 % ploetzlich 1.983/61.011 = 3,25 % — und
  aus einem Fall von 42 % ein Anstieg von 35 %. Gleiche Datei, gleiche
  Karte, umgekehrtes Vorzeichen.
* Das Erhebungsverfahren. `record_source` ist **vollstaendig** mit dem
  Fenster verwechselt: TEF-PBL traegt 8.101 Zeilen `pairings`,
  TEF-POR 4.868 und TEF-CRI 4.429 `records`. Keine einzige Zeile
  ueberlappt. Ein fensteruebergreifender Vergleich einer Siegquote
  vergleicht zwei Verfahren, nicht zwei Metas — und es gibt keine
  Stelle, an der man die Verfahrensdifferenz schaetzen koennte.

Die Verdichtung selbst ist davon unberuehrt: sie ist ein Verhalten von
Spielern, kein Kartenwert, und wiederholt sich in allen drei Fenstern.
Sie darf also fensteruebergreifend gelernt und im laufenden Fenster
angewendet werden. Anteile und Quoten duerfen es nicht.
"""

from __future__ import annotations

import argparse
import csv
import glob
import json
import math
import os
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SAMMELEIMER = "other"

# 14 Tage Online-Vorlauf. Kuerzer wird duenn (Lima hatte 3.386 Listen),
# laenger vermischt zwei Meta-Zustaende.
VORLAUF_TAGE = 14

# Unter so vielen Online-Listen im Vorlauf ist ein Anker nicht auswertbar.
MIN_VORLAUF_LISTEN = 300

# Wie viele Decks die "Spitze" ausmachen, auf die sich das Praesenzfeld
# verdichtet. Fuenf, weil die Messung oben mit fuenf gemacht wurde;
# andere Werte ergaeben andere Verdichtungszahlen.
SPITZE = 5


def _lies(pfad: str, trenner: str = ";") -> List[dict]:
    if not os.path.exists(pfad):
        return []
    with open(pfad, encoding="utf-8", newline="") as datei:
        return list(csv.DictReader(datei, delimiter=trenner))


def _minus_tage(tag: str, n: int) -> str:
    y, m, d = map(int, tag.split("-"))
    return (date(y, m, d) - timedelta(days=n)).isoformat()


def online_anteile(zeilen: List[dict], meta: str, von: str, bis: str
                   ) -> Tuple[Dict[str, float], int, Dict[str, int]]:
    """Anteile je Archetyp aus SUMMEN, nie aus Mitteln der share-Spalte.

    Ueber Turniere von 104 bis 3.000 Spielern ist der Mittelwert der
    Turnieranteile eine andere Zahl als Summe(lists)/Summe(lists_total).

    DER SAMMELEIMER STEHT IM NENNER, ABER NICHT IN DEN ZEILEN.
    `other` ist kein Deck, sondern zwanzig — er bekommt keine eigene
    Zeile. Aber die Spieler darin haben gespielt und gehoeren in die
    Feldgroesse. Nimmt man sie heraus, ist jeder Anteil zu hoch: Mega
    Excadrill vor Worlds steigt von 7,59 % auf 7,87 %, und dieselbe
    Verschiebung trifft jede andere Zeile. Limitless rechnet ebenso —
    3,80 % von 342 bei Pumpkaweekly, mit `other` in den 342.
    """
    roh: Dict[str, int] = defaultdict(int)
    gesamt = 0
    for zeile in zeilen:
        if zeile.get("meta") != meta:
            continue
        if not (von <= zeile.get("date", "") <= bis):
            continue
        n = int(zeile.get("lists") or 0)
        gesamt += n
        if zeile.get("archetype_id") == SAMMELEIMER:
            continue
        roh[zeile["archetype_id"]] += n
        name = (zeile.get("archetype_name") or "").strip()
        if name:
            NAMEN.setdefault(zeile["archetype_id"], name)
    if not gesamt:
        return {}, 0, {}
    return ({k: v / gesamt * 100 for k, v in roh.items()}, gesamt, dict(roh))


# archetyp_id -> Anzeigename, aus der Spalte `archetype_name` derselben
# Datei eingesammelt.
#
# WARUM DAS NOETIG IST (09.09.2026): die Prognose fuehrte nur die Kennung
# ("n-zoroark"). Wer daraus einen Namen ableitet, trifft 26 von 62 —
# "n-zoroark" wuerde still zu "Zoroark" verschmolzen, und beide Decks
# existieren getrennt. Ohne diese Tabelle ist die Datei fuer eine Anzeige
# nicht brauchbar, ohne dass man Namen raet.
NAMEN: Dict[str, str] = {}


def praesenz_anker(datenverzeichnis: str) -> List[dict]:
    """Alle Praesenzturniere aus den labs-Chunkdateien.

    Achtung: diese Dateien sind KOMMA-getrennt, die API-Dateien
    semikolongetrennt. Ein einziger falscher Trenner liefert eine
    Datei mit genau einer Spalte und keinen Fehler.
    """
    heraus = []
    muster = os.path.join(datenverzeichnis, "labs_tournament_decks_*.csv")
    for pfad in sorted(glob.glob(muster)):
        treffer = re.search(r"decks_(.+)\.csv$", pfad)
        if not treffer:
            continue
        meta = treffer.group(1)
        if meta.startswith("_"):
            continue
        proturnier: Dict[Tuple[str, str], Dict[str, float]] = defaultdict(dict)
        groesse: Dict[Tuple[str, str], int] = {}
        art: Dict[Tuple[str, str], str] = {}
        for zeile in _lies(pfad, ","):
            schluessel = (zeile.get("tournament_date", ""), zeile.get("tournament_name", ""))
            if not schluessel[0]:
                continue
            groesse[schluessel] = int(zeile.get("total_players") or 0)
            art[schluessel] = zeile.get("tournament_type") or ""
            slug = zeile.get("deck_slug") or ""
            if slug and slug != SAMMELEIMER:
                anteil = zeile.get("day1_share_pct") or zeile.get("share_pct") or 0
                proturnier[schluessel][slug] = float(anteil or 0)
        for schluessel, anteile in proturnier.items():
            heraus.append({
                "datum": schluessel[0], "name": schluessel[1], "meta": meta,
                "art": art.get(schluessel, ""), "spieler": groesse.get(schluessel, 0),
                "anteile": anteile,
            })
    heraus.sort(key=lambda x: x["datum"])
    return heraus


def _pearson(xs: List[float], ys: List[float]) -> Optional[float]:
    n = len(xs)
    if n < 3:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    if sxx <= 0 or syy <= 0:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / math.sqrt(sxx * syy)


def messe_verdichtung(archetypen: List[dict], anker: List[dict]) -> List[dict]:
    """Je Anker: wie stark verdichtet sich das Feld gegenueber online?"""
    heraus = []
    for a in anker:
        vor, listen, _ = online_anteile(
            archetypen, a["meta"],
            _minus_tage(a["datum"], VORLAUF_TAGE), _minus_tage(a["datum"], 1))
        if listen < MIN_VORLAUF_LISTEN:
            heraus.append({**{k: a[k] for k in ("datum", "name", "meta", "art", "spieler")},
                           "auswertbar": False, "vorlauf_listen": listen,
                           "grund": f"nur {listen} Online-Listen im Vorlauf "
                                    f"(noetig: {MIN_VORLAUF_LISTEN})"})
            continue
        paare = [(vor.get(k, 0.0), v) for k, v in a["anteile"].items()]
        xs = [p[0] for p in paare]
        ys = [p[1] for p in paare]
        spitze_online = sum(sorted(vor.values(), reverse=True)[:SPITZE])
        spitze_papier = sum(sorted(a["anteile"].values(), reverse=True)[:SPITZE])
        heraus.append({
            **{k: a[k] for k in ("datum", "name", "meta", "art", "spieler")},
            "auswertbar": True,
            "vorlauf_listen": listen,
            "archetypen": len(paare),
            "r": round(_pearson(xs, ys) or 0.0, 4),
            "mae": round(sum(abs(x - y) for x, y in zip(xs, ys)) / len(paare), 4),
            "spitze_online": round(spitze_online, 4),
            "spitze_praesenz": round(spitze_papier, 4),
            "verdichtung": round(spitze_papier - spitze_online, 4),
        })
    return heraus


def modell(verdichtungen: List[dict], art: Optional[str] = None) -> Optional[dict]:
    """Das gelernte Verdichtungsmass, wahlweise je Turnierart.

    Worlds ist der schlechteste Anker der zehn (hoechste Verdichtung,
    niedrigstes r, groesster Fehler). Ein Feld mit Einladungsschranke ist
    kein Regional — deshalb ist die Turnierart ein Filter und kein
    Beiwerk.
    """
    passend = [v for v in verdichtungen if v.get("auswertbar")]
    if art:
        passend = [v for v in passend if v["art"] == art]
    if not passend:
        return None
    werte = sorted(v["verdichtung"] for v in passend)
    n = len(werte)
    median = werte[n // 2] if n % 2 else (werte[n // 2 - 1] + werte[n // 2]) / 2
    return {
        "art": art or "alle",
        "anker": n,
        "verdichtung_median": round(median, 4),
        "verdichtung_min": round(werte[0], 4),
        "verdichtung_max": round(werte[-1], 4),
        "r_mittel": round(sum(v["r"] for v in passend) / n, 4),
        "mae_mittel": round(sum(v["mae"] for v in passend) / n, 4),
        "grundlage": [v["name"] for v in passend],
    }


def prognose(aktuell: Dict[str, float], roh: Dict[str, int], gesamt: int,
             m: Optional[dict]) -> List[dict]:
    """Erwarteter Praesenzanteil je Archetyp.

    Die Verdichtung wird auf die Spitze verteilt und dem Rest anteilig
    abgezogen — die Summe bleibt 100 %. Jede Zeile traegt ihren Nenner
    und die Bandbreite aus min/max der Anker; ohne Modell gibt es keine
    Prognose, sondern nur den Online-Anteil und einen Hinweis.
    """
    rang = sorted(aktuell.items(), key=lambda x: -x[1])
    spitze = {k for k, _ in rang[:SPITZE]}
    spitze_summe = sum(v for k, v in aktuell.items() if k in spitze)
    rest_summe = 100.0 - spitze_summe

    def verteile(delta: float) -> Dict[str, float]:
        aus = {}
        for k, v in aktuell.items():
            if k in spitze:
                aus[k] = v + (delta * v / spitze_summe if spitze_summe > 0 else 0.0)
            else:
                aus[k] = v - (delta * v / rest_summe if rest_summe > 0 else 0.0)
        return aus

    heraus = []
    for k, v in rang:
        zeile = {
            "archetyp_id": k,
            "archetyp_name": NAMEN.get(k, ""),
            "online_anteil": round(v, 4),
            "online_listen": roh.get(k, 0),
            "online_listen_gesamt": gesamt,
            "in_der_spitze": k in spitze,
        }
        if m:
            mitte = verteile(m["verdichtung_median"])[k]
            unten = verteile(m["verdichtung_min"])[k]
            oben = verteile(m["verdichtung_max"])[k]
            zeile.update({
                "prognose": round(max(0.0, mitte), 4),
                "prognose_von": round(max(0.0, min(unten, oben)), 4),
                "prognose_bis": round(max(0.0, max(unten, oben)), 4),
                "bewegung": round(mitte - v, 4),
            })
        heraus.append(zeile)
    return heraus


def baue(datenverzeichnis: str, fenster: Optional[str] = None,
         art: str = "regional") -> dict:
    archetypen = _lies(os.path.join(datenverzeichnis, "online_api_archetypes.csv"))
    if not archetypen:
        raise SystemExit("::error::online_api_archetypes.csv fehlt oder ist leer")

    if not fenster:
        pfad = os.path.join(datenverzeichnis, "format_window.json")
        with open(pfad, encoding="utf-8") as datei:
            fw = json.load(datei)
        fenster = f"{fw.get('oldest_legal_set')}-{fw.get('current_set')}"

    anker = praesenz_anker(datenverzeichnis)
    verdichtungen = messe_verdichtung(archetypen, anker)
    m_art = modell(verdichtungen, art)
    m_alle = modell(verdichtungen, None)
    genommen = m_art or m_alle

    tage = sorted({z["date"] for z in archetypen if z.get("meta") == fenster})
    if not tage:
        raise SystemExit(f"::error::keine Online-Daten fuer das Fenster {fenster}")
    aktuell, gesamt, roh = online_anteile(
        archetypen, fenster, _minus_tage(tage[-1], VORLAUF_TAGE), tage[-1])

    return {
        "_meta": {
            "erzeugt_am": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "fenster": fenster,
            "vorlauf_tage": VORLAUF_TAGE,
            "spitze": SPITZE,
            "online_von": _minus_tage(tage[-1], VORLAUF_TAGE),
            "online_bis": tage[-1],
            "online_listen": gesamt,
            "turnierart": art,
            "hinweis": (
                "Anteile aus Summen, nicht aus Mitteln der share-Spalte. "
                "Der Sammeleimer 'other' steht im Nenner, bekommt aber keine "
                "eigene Zeile — er ist kein Deck, sondern zwanzig. Es wird NICHT "
                "ueber Formatgrenzen gerechnet: der Kartenpool wechselt, und "
                "record_source ist vollstaendig mit dem Fenster verwechselt "
                "(TEF-PBL pairings, TEF-CRI/POR records)."
            ),
        },
        "modell": genommen,
        "modell_alle_arten": m_alle,
        "anker": verdichtungen,
        "prognose": prognose(aktuell, roh, gesamt, genommen),
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    p.add_argument("--data-dir", default=os.path.join(WURZEL, "data"))
    p.add_argument("--fenster", default="")
    p.add_argument("--art", default="regional",
                   help="Turnierart, fuer die prognostiziert wird "
                        "(regional, international, special, worlds).")
    p.add_argument("--out", default="")
    a = p.parse_args(argv)

    ergebnis = baue(a.data_dir, a.fenster or None, a.art)
    ziel = a.out or os.path.join(a.data_dir, "meta_prognose.json")
    with open(ziel, "w", encoding="utf-8") as datei:
        json.dump(ergebnis, datei, ensure_ascii=False, indent=1)
        datei.write("\n")

    m = ergebnis["modell"]
    auswertbar = [x for x in ergebnis["anker"] if x.get("auswertbar")]
    print(f"{os.path.basename(ziel)}: {len(ergebnis['prognose'])} Archetypen · "
          f"{len(auswertbar)} von {len(ergebnis['anker'])} Ankern auswertbar · "
          f"{os.path.getsize(ziel) / 1024:.0f} KB")
    if m:
        print(f"  Modell '{m['art']}' aus {m['anker']} Ankern: "
              f"Verdichtung {m['verdichtung_median']:+.1f} pp "
              f"({m['verdichtung_min']:+.1f} bis {m['verdichtung_max']:+.1f}) · "
              f"r {m['r_mittel']:.3f} · Fehler {m['mae_mittel']:.2f} pp")
    else:
        print("  ::warning::kein Modell — keine auswertbaren Anker")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
