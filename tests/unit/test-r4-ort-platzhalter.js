/**
 * BEFUND B5 (07.09.2026, Reiter "City League"):
 *
 *   Die Ortsangabe "Special Event" ist eine fest verdrahtete Konstante in
 *   backend/scrapers/city_league_past_archetype_scraper.py — sie stammt
 *   NICHT aus der Quelle. Der Listenweg des Scrapers
 *   (get_tournaments_in_date_range) liest die Praefektur aus der dritten
 *   Tabellenspalte; der Weg ueber eine einzelne Turnier-ID
 *   (get_tournament_by_id) hat nichts zu lesen und setzt den Wert selbst.
 *
 *   Auf der Seite stand er trotzdem wie ein Quellwert da:
 *   "… Ortsangabe „Special Event“, 26 erfasste Platzierungen …".
 *
 * DIE GEWAEHLTE LOESUNG
 *
 *   Aus der Quelle uebernehmen geht nicht — die Turnierseite fuehrt keine
 *   Praefektur, und geraten wird nichts. Die Dateien unter data/ bleiben
 *   ebenfalls unberuehrt. Also wird der Platzhalter in der Oberflaeche
 *   ALS Platzhalter ausgewiesen, genau wie es bei der Bezeichnung
 *   "Tournament <id>" schon geschieht.
 *
 *   Damit stehen zwei Dateien auf demselben Wortlaut. Dieser Test haelt
 *   sie zusammen: er liest den Wert aus dem Python-Quelltext und aus dem
 *   JS-Quelltext und vergleicht sie. Laufen sie auseinander, verliert die
 *   Oberflaeche die Kennzeichnung lautlos — sie wuerde den Platzhalter
 *   einfach nicht mehr erkennen.
 *
 * KEIN jsdom, KEINE Daten aus data/ — die Zeilen setzt der Test.
 * (Dass die HEUTIGEN Daten den Platzhalter wirklich tragen, prueft
 *  tests/unit/test-r4-leerzustand-echte-daten.js.)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WURZEL, QUELLE, nurFunktionen } = require('./lib-cityleague-sandkasten.js');

const SCRAPER = path.join(WURZEL, 'backend', 'scrapers', 'city_league_past_archetype_scraper.py');
const PY = fs.readFileSync(SCRAPER, 'utf8');

/** Der Wert der Python-Konstante. */
function pythonPlatzhalter() {
    const m = PY.match(/^ORT_PLATZHALTER_OHNE_QUELLE\s*=\s*'([^']*)'/m);
    assert.notEqual(m, null,
        'backend/scrapers/city_league_past_archetype_scraper.py fuehrt keine benannte '
        + 'Konstante ORT_PLATZHALTER_OHNE_QUELLE mehr');
    return m[1];
}

/** Die Werte der JS-Liste. */
function jsPlatzhalter() {
    const m = QUELLE.match(/const CL_ORT_PLATZHALTER = \[([^\]]*)\]/);
    assert.notEqual(m, null, 'js/app-city-league.js fuehrt keine Liste CL_ORT_PLATZHALTER mehr');
    return [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
}

/** Eine Turnierzeile, wie sie aus city_league_archetypes_past.csv kommt. */
function zeile(prefecture) {
    return { tournament_id: '568', prefecture, shop: 'Tournament 568', placement: '1' };
}

describe('B5 — die gesetzte Ortsangabe wird als gesetzt ausgewiesen', () => {

    it('der Scraper setzt sie nicht mehr als nackte Zeichenkette, sondern benannt', () => {
        const wert = pythonPlatzhalter();
        assert.equal(wert, 'Special Event');
        assert.match(PY, /'prefecture':\s*ORT_PLATZHALTER_OHNE_QUELLE/,
            'get_tournament_by_id schreibt wieder eine Zeichenkette direkt in das Feld');
        assert.doesNotMatch(PY, /'prefecture':\s*'Special Event'/,
            'die fest verdrahtete Zeichenkette steht noch im Rueckgabewert');
    });

    it('der Listenweg liest die Praefektur weiterhin aus der Quelle — der wird nicht angefasst', () => {
        assert.match(PY, /'prefecture':\s*cells\[2\]\.get_text\(strip=True\)/,
            'der Weg, der die Praefektur WIRKLICH aus der Quelle liest, ist verschwunden');
    });

    it('Oberflaeche und Scraper nennen denselben Wortlaut', () => {
        const py = pythonPlatzhalter();
        const js = jsPlatzhalter();
        assert.equal(js.includes(py), true,
            'CL_ORT_PLATZHALTER (' + JSON.stringify(js) + ') kennt den Scraper-Wert "'
            + py + '" nicht — die Kennzeichnung greift dann nie');
    });

    it('DER FALL DES BEFUNDS: der Platzhalter wird im Satz als gesetzt gekennzeichnet', () => {
        const k = nurFunktionen('de');
        const herkunft = k.cityLeagueTurnierHerkunft([zeile(pythonPlatzhalter())]);
        const satz = k.cityLeagueHerkunftSatz(herkunft, true);
        assert.match(satz, /Ortsangabe „Special Event“ \(vom Scraper gesetzt, nicht aus der Quelle\)/,
            'der Platzhalter steht wieder da wie ein Quellwert: ' + satz);
    });

    it('eine echte Praefektur bekommt den Zusatz NICHT', () => {
        const k = nurFunktionen('de');
        const herkunft = k.cityLeagueTurnierHerkunft([zeile('Tokyo')]);
        const satz = k.cityLeagueHerkunftSatz(herkunft, true);
        assert.match(satz, /Ortsangabe „Tokyo“,/);
        assert.doesNotMatch(satz, /Tokyo“ \(vom Scraper gesetzt/,
            'jede Ortsangabe wird als gesetzt gekennzeichnet — dann sagt der Zusatz nichts mehr');
    });

    it('englisch traegt denselben Vorbehalt', () => {
        const k = nurFunktionen('en');
        const herkunft = k.cityLeagueTurnierHerkunft([zeile(pythonPlatzhalter())]);
        const satz = k.cityLeagueHerkunftSatz(herkunft, false);
        assert.match(satz, /location “Special Event” \(set by the scraper, not taken from the source\)/);
    });
});
