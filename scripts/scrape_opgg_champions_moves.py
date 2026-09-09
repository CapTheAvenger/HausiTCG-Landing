#!/usr/bin/env python3
"""Zweite Quelle fuer den Champions-Attackenpool: op.gg.

WARUM ES DIESE DATEI GIBT (09.09.2026)
--------------------------------------
Bis heute stuetzte sich das Nachschlagewerk auf genau eine Quelle,
otterlyclueless/pokemon-champions-data. Das hat zwei Loecher gerissen:

1. Der Schalter `inChampions` steht dort bei sechs nachweislich
   gespielten Attacken falsch. Der Nachtrag aus den Nutzungsdaten hing
   damit an einem einzigen Scraper — meldete der einmal einen falschen
   Namen, waere eine Nicht-Champions-Attacke ins Nachschlagewerk
   gerutscht.
2. 45 Attacken hatten keinen deutschen Beschreibungstext, weil PokéAPI
   fuer sie keinen fuehrt (nur englisch und franzoesisch).

op.gg fuehrt eine eigene, Champions-spezifische Attackenliste auf
Deutsch. Gemessen am 09.09.2026 im Browser gegen die ausgelieferte
data/champions_resources.json:

    op.gg fuehrt                          581 Attacken
    unsere Datei fuehrt                   500
    davon bei op.gg NICHT gefunden          0   <- echte Obermenge
    Staerke-Abweichungen                    0   <- bei allen 500
    AP-Abweichungen                         7
    Genauigkeits-Abweichungen               1
    unsere Attacken ohne de_effect         45
    davon von op.gg abgedeckt              45   <- Luecke schliessbar

Die Uebereinstimmung bei der Staerke ist vollstaendig, das macht op.gg
als Gegenprobe brauchbar. Die AP-Abweichungen sind KEIN Rauschen: fuenf
der sieben betreffen die sechs nachgetragenen Attacken, also genau die,
die otterlyclueless hinter dem falschen Schalter fuehrt und dort
offenbar mit Mainline-Werten stehen laesst (Goldrausch: wir 5 AP /
Genauigkeit 100, op.gg 8 AP / 95 — die Mainline-Werte sind 5/100).

WAS AUS DEM HTML KOMMT — UND WAS NICHT (gemessen im ersten CI-Lauf)
------------------------------------------------------------------
Der deutsche Beschreibungstext steht server-gerendert im HTML: 581 von
581 Eintraegen tragen ihn. **Staerke, Genauigkeit und AP nicht.** Im
Browser sind sie sichtbar, im ausgelieferten HTML stehen sie im Umkreis
der Attackenkarte nicht — sie werden clientseitig nachgerendert. Die
drei Felder bleiben deshalb `null`, und der Bauer traegt an dieser
Stelle NICHTS nach.

Das ist kein stiller Verlust: der Bauer setzt seine Herkunftsmarke
`stats_quelle` nur, wenn wirklich ein Wert uebernommen wurde. Wer die
Zahlen will, braucht einen Scraper, der die Seite ausfuehrt (Playwright)
— das ist ein eigener Schritt und keine Nebenbei-Aenderung. Der Nutzen
dieser Datei liegt ohnehin woanders: an den deutschen Texten und daran,
dass sie den Attackenpool ein zweites Mal belegt.

WAS DIESE DATEI NICHT TUT
-------------------------
Sie loest keinen Konflikt still auf. Der Bauer entscheidet, welche
Quelle bei welchem Feld gewinnt, und meldet jede Abweichung. Hier wird
nur geholt und abgelegt.

Lauf: python3 scripts/scrape_opgg_champions_moves.py
Aus dem Bausandkasten NICHT erreichbar (Proxy 403) — laeuft in CI.
"""

import json
import os
import re
import sys
import urllib.request

URL = "https://op.gg/de/pokemon-champions/moves"
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DATA = os.path.join(REPO, "data")
OUT = os.path.join(DATA, "opgg_champions_moves.json")

# Unter dieser Zahl gilt der Lauf als kaputt und schreibt nichts. Die
# Seite fuehrte am 09.09.2026 581 Attacken; 400 laesst Raum fuer echte
# Aenderungen und faengt trotzdem eine halb geladene Seite.
MINDEST_ATTACKEN = 400

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/152.0 Safari/537.36")


def hole(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Language": "de-DE,de;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode("utf-8", "replace")


def parse(html):
    """slug -> {de, text, power, accuracy, pp, ziel, kategorie, typ}.

    Die Seite rendert je Attacke eine Karte:
        <a href="/de/pokemon-champions/moves/<slug>"> … <h3>Name</h3>
           <p>deutscher Text</p> … <span>Staerke: 120</span>
           <span>Gen: 95%</span> <span>AP: 8</span>
           <span>Ziel:</span><span>alle gegner</span> …
    Geparst wird ueber BeautifulSoup, nicht per Regex ueber das ganze
    Dokument — die Karte ist der Anker, und ein Wert ohne Karte wird
    gar nicht erst gelesen.
    """
    from bs4 import BeautifulSoup
    suppe = BeautifulSoup(html, "lxml")
    aus = {}
    for a in suppe.select('a[href*="/pokemon-champions/moves/"]'):
        h3 = a.find("h3")
        if not h3:
            continue
        slug = (a.get("href") or "").rstrip("/").split("/")[-1]
        if not slug or slug in aus:
            continue
        text = " ".join(a.get_text(" ", strip=True).split())
        p = a.find("p")

        def zahl(muster):
            m = re.search(muster, text)
            return int(m.group(1)) if m else None

        aus[slug] = {
            "de": h3.get_text(strip=True),
            "text": " ".join(p.get_text(" ", strip=True).split()) if p else "",
            "power": zahl(r"Stärke:\s*(\d+)"),
            "accuracy": zahl(r"Gen:\s*(\d+)\s*%"),
            "pp": zahl(r"AP:\s*(\d+)"),
        }
        m = re.search(r"Ziel:\s*([^:]+?)(?:\s+(?:HP|Atk|Def|SpA|SpD|Spe)\b|$)", text)
        if m:
            aus[slug]["ziel"] = m.group(1).strip()
    return aus


def main():
    print(f"Hole {URL} …")
    html = hole(URL)
    print(f"  {len(html)} Zeichen")
    eintraege = parse(html)
    print(f"  {len(eintraege)} Attacken geparst")

    if len(eintraege) < MINDEST_ATTACKEN:
        print(f"  ! nur {len(eintraege)} Attacken (Mindestzahl "
              f"{MINDEST_ATTACKEN}) — die Seite hat sich geaendert oder "
              f"nicht vollstaendig geladen. Es wird NICHTS geschrieben.")
        return 1

    mit_text = sum(1 for v in eintraege.values() if v["text"])
    aus = {
        "_meta": {
            "quelle": URL,
            "beschreibung": (
                "Champions-Attackenliste von op.gg — zweite Quelle neben "
                "otterlyclueless/pokemon-champions-data. Liefert die "
                "deutschen Beschreibungstexte, die PokéAPI fuer neuere "
                "Attacken nicht fuehrt, und belegt unabhaengig, welche "
                "Attacken zum Champions-Pool gehoeren."
            ),
            "attacken": len(eintraege),
            "mit_deutschem_text": mit_text,
            "hinweis": (
                "Der Schluessel ist der englische Slug aus der URL "
                "(make-it-rain). Er laesst sich ueber norm() gegen den "
                "englischen Attackennamen halten."
            ),
        },
        "attacken": dict(sorted(eintraege.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"Wrote {OUT}")
    print(f"  {len(eintraege)} Attacken, {mit_text} mit deutschem Text")
    return 0


if __name__ == "__main__":
    sys.exit(main())
