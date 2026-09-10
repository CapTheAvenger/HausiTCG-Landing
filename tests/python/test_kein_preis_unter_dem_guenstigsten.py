"""Kein ausgelieferter Preis liegt unter dem guenstigsten Angebot.

NACHGEPRUEFT am 10.09.2026, weil eine Datenpruefung "60 Zeilen mit
eur_low > eur_price" als Befund meldete. Der Befund stimmt fuer die
ROHDATEI und ist dort richtig so: price_data.csv behaelt Cardmarkets
echte Zahlen, egal wie unplausibel sie sind, und markiert die Zeilen mit
price_status = trend_below_low. Gemessen: 59 Zeilen, zusammen 5.878,91 €
Trendpreis gegen 17.753,10 € guenstigste Angebote — 11.874,19 €
Unterschied. Zwei Treecko-Promos stehen dort auf 182,73 €, waehrend das
billigste reale Angebot 2.999,00 € kostet.

backend/core/prepare_card_data.py setzt beim Aufbereiten den
guenstigsten Preis an die Anzeigestelle, und in all_cards_merged.json
stimmt das auch: 59 von 59 korrigiert, 0 uebrig. Es war also kein
Fehler, sondern eine Kette, die funktioniert.

NUR: nichts hat das festgehalten. Die Korrektur haengt an einer
Bedingung mitten in einem 900-Zeilen-Aufbereiter, und ein Grund, sie
umzubauen, findet sich schnell. Diese Datei prueft die EIGENSCHAFT,
nicht die Zeilenzahl: was die Seite anzeigt, darf nicht unter dem
guenstigsten Angebot derselben Karte liegen. Welche Karten das diese
Woche betrifft und wie viele, ist ihr egal.

Ein Trend von 0,00 € faellt unter dieselbe Regel — Cardmarket meint
damit "kein Trend berechenbar", nicht "wertlos". Der Aufbereiter
schreibt das selbst auf (RCL 200 Boss's Orders: Trend 0, guenstigstes
Angebot 85 €).
"""

import json
import os

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUSGELIEFERT = os.path.join(WURZEL, "data", "all_cards_merged.json")
AUFBEREITER = os.path.join(WURZEL, "backend", "core", "prepare_card_data.py")

with open(AUSGELIEFERT, encoding="utf-8") as f:
    _roh = json.load(f)
KARTEN = _roh if isinstance(_roh, list) else (_roh.get("cards") or [])


def _eur(v):
    """'2.999,00€' -> 2999.0. None, wenn da keine Zahl steht."""
    s = str(v or "").replace("€", "").replace("EUR", "").strip()
    if not s:
        return None
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _mit_beiden():
    for k in KARTEN:
        preis = _eur(k.get("eur_price"))
        billig = _eur(k.get("eur_low"))
        if preis is not None and billig is not None:
            yield k, preis, billig


def test_es_gibt_ueberhaupt_karten_mit_beiden_preisen():
    """Vorpruefung gegen ein leeres Bestehen: ohne Karten, die BEIDE
    Zahlen fuehren, bestuende die Zusicherung unten stillschweigend."""
    anzahl = sum(1 for _ in _mit_beiden())
    assert anzahl > 1000, (
        f"nur {anzahl} Karten fuehren Preis UND guenstigstes Angebot — "
        f"dann prueft diese Datei nichts mehr"
    )


def test_kein_angezeigter_preis_liegt_unter_dem_guenstigsten_angebot():
    """DIE Eigenschaft. Ein Preis unter dem billigsten realen Angebot ist
    kein Preis, den jemand zahlen kann."""
    schlecht = []
    for k, preis, billig in _mit_beiden():
        # Ein Cent Rundungsluft: beide Zahlen kommen mit zwei
        # Nachkommastellen aus derselben Quelle, echte Verstoesse liegen
        # um Groessenordnungen daneben.
        if preis + 0.01 < billig:
            schlecht.append(
                f"{k.get('name', '?')} {k.get('set', '?')} #{k.get('number', '?')}: "
                f"angezeigt {preis:.2f} EUR, guenstigstes Angebot {billig:.2f} EUR"
            )
    assert not schlecht, (
        f"{len(schlecht)} Karten zeigen einen Preis unter ihrem eigenen "
        f"guenstigsten Angebot. Die Korrektur in prepare_card_data.py "
        f"greift nicht mehr. Die ersten drei: {schlecht[:3]}"
    )


def test_kein_angezeigter_preis_ist_null_wo_es_ein_angebot_gibt():
    """Cardmarket schreibt Trend 0 fuer 'kein Trend berechenbar'. Wer das
    als 0,00 EUR anzeigt, behauptet Wertlosigkeit."""
    schlecht = []
    for k, preis, billig in _mit_beiden():
        if preis == 0.0 and billig > 0:
            schlecht.append(f"{k.get('name', '?')} {k.get('set', '?')} "
                            f"#{k.get('number', '?')} (Angebot {billig:.2f} EUR)")
    assert not schlecht, (
        f"{len(schlecht)} Karten stehen auf 0,00 EUR, obwohl es ein "
        f"Angebot gibt: {schlecht[:3]}"
    )


def test_die_markierung_erreicht_das_frontend():
    """Ohne sie kann keine Oberflaeche sagen, welche Zahl sie zeigt."""
    markiert = [k for k in KARTEN if k.get("price_status") == "trend_below_low"]
    assert markiert, (
        "keine einzige Karte traegt price_status = trend_below_low. "
        "Entweder gibt es die Faelle nicht mehr (dann gehoert diese Datei "
        "ueberdacht) oder die Markierung geht beim Aufbereiten verloren"
    )
    # Und bei genau diesen muss die Anzeige der guenstigste Preis sein.
    daneben = [f"{k.get('name')} {k.get('set')} #{k.get('number')}"
               for k in markiert
               if _eur(k.get("eur_price")) is not None
               and _eur(k.get("eur_low")) is not None
               and abs(_eur(k["eur_price"]) - _eur(k["eur_low"])) > 0.01]
    assert not daneben, (
        f"{len(daneben)} markierte Karten zeigen NICHT den guenstigsten "
        f"Preis: {daneben[:3]}"
    )


def test_der_aufbereiter_korrigiert_weiterhin():
    with open(AUFBEREITER, encoding="utf-8") as f:
        quelle = f.read()
    assert "'trend_below_low'" in quelle, (
        "prepare_card_data.py kennt den Fall nicht mehr"
    )
    assert "price = low" in quelle, (
        "die Ersetzung durch den guenstigsten Preis ist verschwunden"
    )
