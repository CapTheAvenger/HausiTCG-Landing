#!/usr/bin/env python3
"""data/pokemon_go_shiny.json — fuer welche Arten und Formen in Pokemon GO
ein Shiny VEROEFFENTLICHT ist.

QUELLE: https://leekduck.com/shiny/pms.json — die Datei, aus der die
LeekDuck-Shiny-Checkliste ihre Seite baut. Vom Betreiber am 09.09.2026
benannt. Maschinenlesbar, kein HTML-Zerlegen noetig; jeder Eintrag traegt
`dex`, `family`, `aa_fn` (formqualifizierte Kennung) und `released_date`.

WARUM DAS DATUM DER KERN IST: die Datei fuehrt auch ANGEKUENDIGTE
Veroeffentlichungen. Gemessen am 09.09.2026: 1.475 Eintraege, davon
**12 mit einem Datum in der Zukunft** (bis 2027/02/13) — Kostuem-Pikachu
und -Glumanda aus geplanten Events. Wer ungefiltert liest, behauptet, ein
Shiny sei fangbar, das es noch nicht gibt.

Gefiltert wird deshalb auf `released_date <= heute`. Die Zahl der
uebersprungenen Eintraege steht in _meta.angekuendigt_uebersprungen —
faellt sie auf 0 und bleibt dort, hat die Quelle das Feld vermutlich
geaendert, und das gehoert nachgesehen.

ANDERS ALS pokemon_go_liste.json IST DIESE QUELLE BELASTBAR. Die
Artenliste (PokeWiki) markiert sich selbst als veraltet; hier steht je
Eintrag ein Datum, und die Datei wird laufend gepflegt. Ein fehlender
Eintrag heisst hier tatsaechlich "kein Shiny veroeffentlicht".

NEBENWIRKUNG, DIE ZAEHLT: ein veroeffentlichtes Shiny BEWEIST, dass es
die Art in GO gibt. Damit schliesst diese Datei Luecken der Artenliste.
Gemessen: drei Roster-Eintraege (Arktilas (Hisui), Schlurm, Psiaugon)
fehlen dort, haben aber ein Shiny — sie sind also sehr wohl in GO.

Fail-soft: schlaegt der Lauf fehl, bleibt die eingecheckte Datei stehen.
"""

import datetime
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUS = os.path.join(ROOT, "data", "pokemon_go_shiny.json")

URL = "https://leekduck.com/shiny/pms.json"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124 Safari/537.36"}

# Die Formkennungen aus `aa_fn`, die im Champions-Roster vorkommen.
# Kostuem-, Wetter- und Unown-Formen sind fuer diese Seite ohne Belang.
REGION_AUS_FN = {
    "ALOLA": "alola",
    "GALARIAN": "galar",
    "HISUIAN": "hisui",
    "PALDEA": "paldea",
    "PALDEA_AQUA": "paldea",
    "PALDEA_BLAZE": "paldea",
    "PALDEA_COMBAT": "paldea",
}
MEGA_FN = ("MEGA", "MEGA_X", "MEGA_Y")

MINDESTEINTRAEGE = 1000  # gemessen 09.09.2026: 1.463 veroeffentlicht


def _hole(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def _formkennung(aa_fn):
    m = re.search(r"\.f([A-Z0-9_]+)", str(aa_fn or ""))
    return m.group(1) if m else ""


def baue(heute=None):
    heute = heute or datetime.date.today().strftime("%Y/%m/%d")
    roh = _hole(URL)
    if not isinstance(roh, list) or not roh:
        raise ValueError("pms.json ist keine nichtleere Liste — Format geaendert?")

    basis, mega, regional = set(), set(), {}
    kuenftig = 0
    for o in roh:
        datum = str(o.get("released_date") or "")
        if not datum:
            continue
        if datum > heute:          # Zeichenkettenvergleich traegt bei YYYY/MM/DD
            kuenftig += 1
            continue
        try:
            dex = int(o.get("dex"))
        except (TypeError, ValueError):
            continue
        fn = _formkennung(o.get("aa_fn"))
        if not fn:
            basis.add(dex)
        elif fn in MEGA_FN:
            mega.add(dex)
        elif fn in REGION_AUS_FN:
            regional.setdefault(REGION_AUS_FN[fn], set()).add(dex)
        # alles andere (Kostueme, Wetterformen, Unown) faellt bewusst weg

    if len(basis) < MINDESTEINTRAEGE // 2:
        raise ValueError(
            f"nur {len(basis)} Grundformen mit veroeffentlichtem Shiny — "
            f"das ist zu wenig, die Quelle hat sich vermutlich geaendert")

    return {
        "_meta": {
            "zweck": "Arten und Formen, fuer die in Pokemon GO ein Shiny "
                     "veroeffentlicht ist.",
            "quelle": URL,
            "quelle_name": "LeekDuck Shiny Checklist",
            "vom_betreiber_benannt": "2026-09-09",
            "stand": heute,
            "lesart_treffer": "Shiny ist veroeffentlicht und damit fangbar",
            "lesart_kein_treffer": "kein veroeffentlichtes Shiny zum Stand der "
                                   "Quelle — anders als bei der Artenliste ist "
                                   "das hier belastbar: jeder Eintrag traegt ein "
                                   "Datum, und die Datei wird gepflegt.",
            "angekuendigt_uebersprungen": kuenftig,
            "angekuendigt_hinweis": "Eintraege mit einem Veroeffentlichungsdatum "
                                    "in der Zukunft. Sie stehen in der Quelle, "
                                    "sind aber noch nicht fangbar.",
            "eintraege_quelle": len(roh),
            "grundformen": len(basis),
            "megaformen": len(mega),
            "regionalformen": {k: len(v) for k, v in sorted(regional.items())},
        },
        "basis": sorted(basis),
        "mega": sorted(mega),
        "regional": {k: sorted(v) for k, v in sorted(regional.items())},
    }


def main():
    try:
        daten = baue()
    except Exception as e:
        print(f"::warning::Shiny-Liste nicht geholt ({e}) — bestehende "
              f"{os.path.basename(AUS)} bleibt unveraendert")
        return 1
    with open(AUS, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write("\n")
    m = daten["_meta"]
    print(f"pokemon_go_shiny.json: {m['grundformen']} Grundformen, "
          f"{m['megaformen']} Mega, regional {m['regionalformen']}, "
          f"{m['angekuendigt_uebersprungen']} angekuendigte uebersprungen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
