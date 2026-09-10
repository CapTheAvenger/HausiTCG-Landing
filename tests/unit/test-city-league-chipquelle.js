/* Der Frischechip nennt die Datei, die WIRKLICH angezeigt wird.
 *
 * BEFUND (10.09.2026, live an thedipidis.app/#city-league): der Reiter
 * stand auf "Vergangenes Meta" und zeigte 26 Listen aus 11 Archetypen —
 * daneben schrieb der Chip "Daten: keine Daten".
 *
 * Beides stimmte fuer sich. Die Zahlen kamen aus
 * city_league_archetypes_past.csv; der Chip war in index.html fest auf
 * city_league_archetypes.csv verdrahtet, und DIE Datei hat nur eine
 * Kopfzeile. Fuer den Leser stand damit eine Auskunft neben Zahlen, die
 * sie widerlegt.
 *
 * ds-datenstand.js schreibt die Regel selbst auf: "Jeder Chip nennt den
 * Stand SEINER Ansicht, nicht einen globalen." Ein fest verdrahteter
 * Dateiname kann das nicht, sobald die Ansicht zwischen zwei Dateien
 * umschaltet.
 *
 * Nach der Korrektur zeigt der Chip 06.06.2026 — das Datum des juengsten
 * Turniers in der angezeigten Datei. Gemessen mit Playwright gegen den
 * lokalen Stand.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'app-city-league.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const STAND = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'data_stand.json'), 'utf8'));

/* Kommentare raus, bevor eine Zusicherung nach Code sucht — sonst
   bestaetigt die Erklaerung des Fehlers den Test. */
function ohneKommentare(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
const CODE = ohneKommentare(SRC);

describe('City League: Frischechip und angezeigte Datei', () => {

    it('die Umschaltung zieht die Chipquelle mit', () => {
        assert.match(CODE, /function chipQuelleNachziehen\s*\(/,
            'die Umschaltung der Chipquelle fehlt — dann nennt der Chip '
            + 'wieder eine Datei, die gar nicht angezeigt wird');
        // Beide Ladewege muessen sie rufen. Der Reiter hat zwei:
        // die Uebersicht und die Deck-Analyse.
        const rufe = (CODE.match(/(?<!function )chipQuelleNachziehen\(isPast\)/g) || []).length;
        assert.equal(rufe, 2,
            `chipQuelleNachziehen wird ${rufe}-mal gerufen, erwartet 2 — `
            + 'einer der beiden Ladewege zieht die Quelle nicht mit');
    });

    it('jede Paarung nennt zwei Dateien, die es gibt', () => {
        // Die Zuordnung steht ausgeschrieben statt als Namensregel.
        // Diese Zusicherung ist der Grund dafuer: eine Regel wuerde auch
        // fuer Dateien gelten, die es nicht gibt.
        const block = CODE.match(/const CHIP_PAARE = \[([\s\S]*?)\];/);
        assert.ok(block, 'CHIP_PAARE fehlt');
        const namen = block[1].match(/'([a-z0-9_]+\.csv)'/g).map(s => s.slice(1, -1));
        // Gleichheit, nicht "mindestens": zwei Paare, vier Namen. Kaeme
        // ein drittes Paar dazu, gelten die Zusicherungen unten nur noch
        // fuer einen Teil — dann soll das hier auffallen.
        assert.equal(namen.length, 4,
            `CHIP_PAARE fuehrt ${namen.length} Dateinamen, erwartet 4 `
            + '(zwei Paare: Archetypen und Analyse)');
        for (const n of namen) {
            assert.ok(fs.existsSync(path.join(ROOT, 'data', n)),
                `CHIP_PAARE nennt data/${n} — die Datei gibt es nicht`);
        }
    });

    it('die Ausgangsangabe in index.html ist eine der Paarungen', () => {
        // Ohne das greift die Umschaltung ins Leere: sie erkennt den
        // Ausgangswert nicht wieder und laesst ihn stehen.
        const block = CODE.match(/const CHIP_PAARE = \[([\s\S]*?)\];/)[1];
        for (const datei of ['city_league_archetypes.csv', 'city_league_analysis.csv']) {
            assert.ok(HTML.includes(`data-quelle="${datei}"`),
                `index.html nennt ${datei} nicht mehr als Chipquelle`);
            assert.ok(block.includes(`'${datei}'`),
                `${datei} steht in index.html, aber nicht in CHIP_PAARE`);
        }
    });

    it('die vergangenen Dateien tragen ein Inhaltsdatum', () => {
        /* Sonst waere die Korrektur nur eine andere Halbwahrheit: der Chip
           zeigte dann das SCHREIBdatum (22.08.2026) einer Datei, deren
           juengstes Turnier vom 06.06.2026 ist. */
        const inhalt = STAND.inhalt_bis || {};
        for (const datei of ['city_league_archetypes_past.csv',
                             'city_league_analysis_past.csv']) {
            assert.ok(inhalt[datei],
                `${datei} hat kein Inhaltsdatum in data_stand.json — dann `
                + 'zeigt ihr Chip das Schreibdatum statt des Turniertags');
        }
    });

    it('die leeren Dateien sind als leer gefuehrt', () => {
        // Damit "keine Daten" dort weiterhin richtig ist, wenn jemand
        // wieder auf "Aktuelles Meta" umschaltet.
        const leer = STAND.leer || [];
        assert.ok(leer.includes('city_league_archetypes.csv'),
            'city_league_archetypes.csv ist nicht mehr als leer gefuehrt — '
            + 'entweder hat sie Daten bekommen (dann gehoert diese '
            + 'Zusicherung ueberdacht) oder der Leerbefund ist ausgefallen');
    });

    it('die Saison-Meldung nennt ihre Quelle', () => {
        /* Sie war wortgleich die Meldung von limitlesstcg.com/jp — aber
           ohne Absender, also als eigene Behauptung der Seite. Am
           10.09.2026 stand dort "starten im September", und es WAR
           September. Wessen Aussage das ist, gehoert sichtbar dazu. */
        const i18n = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
        const zeilen = i18n.split('\n').filter(z => z.includes("'cl.seasonClosed':"));
        assert.equal(zeilen.length, 2,
            `cl.seasonClosed steht ${zeilen.length}-mal, erwartet 2 (de + en)`);
        for (const z of zeilen) {
            assert.ok(/limitlesstcg\.com/.test(z),
                'die Saison-Meldung nennt ihre Quelle nicht: ' + z.trim());
        }
    });
});
