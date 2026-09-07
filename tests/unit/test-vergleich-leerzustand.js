/**
 * BEFUND A-F2.11 bis F2.13 / H1 (Reiter "City League", gemessen
 * 07.09.2026):
 *
 *   Unter der Kartenreihe folgt direkt die grosse Vergleichstabelle. Die
 *   Rubriken "Seltener gespielt", "Performance verbessert" und
 *   "Performance verschlechtert" fehlen ersatzlos, ebenso Aufsteiger,
 *   neue und verschwundene Archetypen.
 *
 * IM QUELLTEXT NACHVERFOLGT: js/app-city-league.js rendert diese
 * Tabellen nur bei `decreased.length > 0` usw. Ohne Vorzeitraum
 * (`keinVorzeitraum` in getCityLeagueSortedSections) sind alle Listen
 * leer — improvers und decliners werden dort sogar ausdruecklich auf []
 * gesetzt, damit aus old_count = 0 keine erfundene "Verschlechterung"
 * wird. Das ist richtig gerechnet. Falsch war nur, dass die Seite dazu
 * geschwiegen hat.
 *
 * Drei Rubriken hat die Seite ausserdem ueberhaupt nicht als Tabelle:
 * `increased`, `newArchetypes` und `disappeared` werden gerechnet und
 * nirgends gezeigt. Solange sie leer sind, faellt das unter denselben
 * Grund; sind sie es nicht, muss es dastehen.
 *
 * BEFUND B4 (Nachmessung 07.09.2026): zwei Zahlen des Leerzustands waren
 * ungebunden. `neu: newArchetypes.length` liess sich zu `0` mutieren und
 * `mindestListen: maxCount * 0.1` zu `* 0.5`, ohne dass etwas rot wurde —
 * der alte Test prueft die FUNKTION mit selbst gesetzten Zahlen und hat
 * die Aufrufstelle nie angefasst. Der Prozentsatz "10 %" stand ausserdem
 * als Literal im Satz, waehrend oben mit einer Konstante gefiltert wurde.
 *
 * Dagegen stehen jetzt zwei ausgefuehrte Pruefungen:
 *   (A) Das Objektliteral der Aufrufstelle wird geschnitten und mit
 *       Kennwerten AUSGEFUEHRT — steht dort ein Literal statt eines
 *       Namens, fehlt der Kennwert im Satz.
 *   (B) getCityLeagueSortedSections() wird auf gesetzten Zeilen
 *       ausgefuehrt: die Schwelle, die der Satz nennt, muss genau die
 *       Grenze sein, an der ein Archetyp in die Performance-Rubriken
 *       rutscht.
 *
 * Keine Live-Daten: alle Eingaben setzt der Test. Die Zeitraeume und
 * Zahlen unten sind TESTVORGABEN, nicht der gemessene Live-Zustand — der
 * Reiter zeigte am 07.09.2026 einen anderen.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { funktion, quelle, WURZEL } = require('./lib-uebersicht-sandkasten.js');

const SRC = quelle('app-city-league.js');

function hinweis(sprache, o) {
    const kasten = {
        Math, Number, String, Object, Array, JSON,
        getLang: () => sprache,
        escapeHtml: (x) => String(x)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    };
    vm.createContext(kasten);
    vm.runInContext(funktion(SRC, 'cityLeagueVergleichLeerHinweis'), kasten);
    return kasten.cityLeagueVergleichLeerHinweis(o);
}

/**
 * Die FORM des Befunds, mit gesetzten Zahlen: kein Vorzeitraum, alle
 * Archetypen NEU. Zeitraum und Anzahl sind frei gewaehlte Testvorgaben —
 * frueher stand hier "der gemessene Live-Zustand", und das war falsch.
 */
const OHNE_VORZEITRAUM = {
    keinVorzeitraum: true,
    archetypen: 11,
    neu: 11,
    zeitraum: '25.07.2026 – 31.07.2026',
    turniere: 1,
    mindestListen: 2.3,
    mindestAnteil: 0.1,
    leer: { seltener: true, haeufiger: true, verbessert: true, verschlechtert: true,
            aufsteiger: true, neuTabelle: false, verschwunden: true },
    vorhanden: { haeufiger: 0, neuTabelle: 11, verschwunden: 0 }
};

/** Ein gesunder Zeitraum: alle Rubriken gefuellt. */
const VOLLSTAENDIG = {
    keinVorzeitraum: false,
    archetypen: 304,
    neu: 12,
    zeitraum: '01.08.2026 – 31.08.2026',
    turniere: 42,
    mindestListen: 31.5,
    mindestAnteil: 0.1,
    leer: { seltener: false, haeufiger: false, verbessert: false, verschlechtert: false,
            aufsteiger: false, neuTabelle: false, verschwunden: false },
    vorhanden: { haeufiger: 40, neuTabelle: 12, verschwunden: 5 }
};

describe('Erklaerter Leerzustand der Vergleichsrubriken (A-F2.11 bis F2.13 / H1)', () => {

    it('ohne Vorzeitraum nennt die Seite jede fehlende Rubrik beim Namen', () => {
        const h = hinweis('de', OHNE_VORZEITRAUM);
        ['Seltener gespielt', 'Häufiger gespielt', 'Performance verbessert',
         'Performance verschlechtert', 'Auf- und Absteiger der Top 10',
         'verschwundene Archetypen'].forEach(n => {
            assert.ok(h.includes(n), 'Rubrik nicht genannt: ' + n + '\n' + h);
        });
    });

    it('sie nennt den Grund — und der ist "kein Vorzeitraum", nicht "keine Daten"', () => {
        const h = hinweis('de', OHNE_VORZEITRAUM);
        assert.match(h, /keinen Vorzeitraum in den Daten/);
        assert.match(h, /alle 11 Archetypen tragen eine alte Listenzahl von 0/);
        assert.match(h, /11 ausdrücklich als NEU verzeichnet/);
    });

    it('sie nennt den Zeitraum, den die Seite TATSAECHLICH hat', () => {
        // Der Wert ist eine Testvorgabe; geprueft wird, dass er DURCHGEREICHT
        // und nicht ersetzt wird.
        const h = hinweis('de', OHNE_VORZEITRAUM);
        assert.ok(h.includes('25.07.2026 – 31.07.2026'),
            'ohne den gemessenen Zeitraum ist "kein Vorzeitraum" eine Behauptung ohne Bezug');
        assert.match(h, /1 Turnier,/, 'Einzahl bei einem Turnier');
        assert.match(h, /11 Archetypen/);
    });

    it('fehlt die Zeitraumangabe, wird sie nicht erfunden', () => {
        const h = hinweis('de', Object.assign({}, OHNE_VORZEITRAUM, { zeitraum: '' }));
        assert.match(h, /Zeitraum im Datensatz nicht angegeben/);
        assert.ok(!/undefined|null|N\/A/.test(h), h);
    });

    it('Rubriken, die es gar nicht als Tabelle gibt, werden mit ihrer Zahl genannt', () => {
        // newArchetypes ist im gemessenen Zustand mit 11 Zeilen gefuellt und
        // wird nirgends gezeigt — genau das darf nicht verschwiegen werden.
        const h = hinweis('de', OHNE_VORZEITRAUM);
        assert.match(h, /Ohne Tabelle auf dieser Seite, obwohl Daten vorliegen: neue Archetypen \(11\)/);
    });

    it('ist alles gefuellt, aber ohne Tabelle, sagt sie genau das und nichts ueber Fehlendes', () => {
        const h = hinweis('de', VOLLSTAENDIG);
        assert.ok(!h.includes('Hier fehlen'), h);
        assert.match(h, /Ohne Tabelle auf dieser Seite/);
        assert.match(h, /„Häufiger gespielt“ \(40\)/);
        assert.match(h, /neue Archetypen \(12\)/);
        assert.match(h, /verschwundene Archetypen \(5\)/);
    });

    it('ist nichts zu melden, bleibt der Block leer statt eine Ueberschrift ohne Inhalt zu setzen', () => {
        const still = Object.assign({}, VOLLSTAENDIG, {
            vorhanden: { haeufiger: 0, neuTabelle: 0, verschwunden: 0 }
        });
        assert.equal(hinweis('de', still), '');
    });

    it('mit Vorzeitraum, aber leeren Listen, nennt sie die Schwelle statt "kein Vorzeitraum"', () => {
        const h = hinweis('de', Object.assign({}, VOLLSTAENDIG, {
            leer: { seltener: true, haeufiger: true, verbessert: true, verschlechtert: true,
                    aufsteiger: true, neuTabelle: true, verschwunden: true },
            vorhanden: { haeufiger: 0, neuTabelle: 0, verschwunden: 0 }
        }));
        assert.ok(!h.includes('keinen Vorzeitraum'), 'der Grund muss zum Zustand passen');
        assert.match(h, /mindestens 32 Listen \(10 % des größten Archetyps\)/);
    });

    it('B4: der Prozentsatz im Satz ist der uebergebene, kein Literal', () => {
        const leer = { seltener: true, haeufiger: true, verbessert: true, verschlechtert: true,
                       aufsteiger: true, neuTabelle: true, verschwunden: true };
        const nichts = { haeufiger: 0, neuTabelle: 0, verschwunden: 0 };
        const h = hinweis('de', Object.assign({}, VOLLSTAENDIG, {
            leer, vorhanden: nichts, mindestAnteil: 0.25, mindestListen: 76
        }));
        assert.match(h, /mindestens 76 Listen \(25 % des größten Archetyps\)/,
            'vorher stand hier fest "10 %": ' + h);
        const gebrochen = hinweis('de', Object.assign({}, VOLLSTAENDIG, {
            leer, vorhanden: nichts, mindestAnteil: 0.125, mindestListen: 38
        }));
        assert.match(gebrochen, /\(12,5 % des größten Archetyps\)/,
            'gebrochene Anteile duerfen nicht zu "12" oder "13" gerundet werden');
        const en = hinweis('en', Object.assign({}, VOLLSTAENDIG, {
            leer, vorhanden: nichts, mindestAnteil: 0.25, mindestListen: 76
        }));
        assert.match(en, /76 lists \(25 % of the largest archetype\)/);
    });

    it('englisch sagt dasselbe', () => {
        const h = hinweis('en', OHNE_VORZEITRAUM);
        assert.match(h, /Missing here:/);
        assert.match(h, /no prior window in the data/);
        assert.ok(h.includes('25.07.2026 – 31.07.2026'));
        assert.match(h, /Why no comparison tables are shown/);
    });

    // ───────────────────────────────────────────────────────────
    // (A) B4: die Aufrufstelle, ausgefuehrt statt gelesen.
    // ───────────────────────────────────────────────────────────

    const MARKE = 'html += cityLeagueVergleichLeerHinweis({';

    /** Das Objekt, das renderCityLeagueTable wirklich baut. */
    function aufrufObjekt(umgebung) {
        const ab = SRC.indexOf(MARKE);
        assert.ok(ab >= 0, 'die Aufrufstelle steht nicht mehr in der Datei');
        const auf = SRC.indexOf('{', ab + MARKE.length - 1);
        const zu = SRC.indexOf('});', auf);
        assert.ok(zu > auf, 'das Objektliteral ist nicht abgeschlossen');
        const kasten = Object.assign({ Math, Object, Number, String }, umgebung);
        vm.createContext(kasten);
        return vm.runInContext('(' + SRC.slice(auf, zu + 1) + ')', kasten);
    }

    /** Eine Liste bekannter Laenge — mehr braucht die Aufrufstelle nicht. */
    const liste = (n) => new Array(n).fill(0);

    it('B4: jede Zahl des Leerzustands kommt aus der Umgebung, keine ist an der Aufrufstelle abgeschrieben', () => {
        // Kennwerte statt echter Werte. Steht rechts vom Doppelpunkt ein
        // Literal oder eine zweite Rechnung, taucht der Kennwert nicht auf.
        const o = aufrufObjekt({
            keinVorzeitraum: true,
            totalArchetypes: 141,
            newArchetypes: liste(142),
            dateRange: '01.01.2099 – 02.01.2099',
            tournamentCount: 143,
            countThreshold: 144,
            CL_MINDEST_ANTEIL_GROESSTER: 1.45,      // * 100 = 145
            decreased: [], increased: [], improvers: [], decliners: [],
            entries: [], exits: [], disappeared: []
        });
        assert.equal(o.archetypen, 141, 'archetypen');
        assert.equal(o.neu, 142, 'neu: newArchetypes.length wurde nicht durchgereicht');
        assert.equal(o.turniere, 143, 'turniere');
        assert.equal(o.mindestListen, 144,
            'mindestListen muss die Schwelle sein, mit der WIRKLICH gefiltert wurde — '
            + 'nicht eine zweite Rechnung an dieser Stelle');
        assert.equal(o.mindestAnteil, 1.45, 'mindestAnteil');
        assert.equal(o.zeitraum, '01.01.2099 – 02.01.2099', 'zeitraum');

        const h = hinweis('de', o);
        assert.ok(h.includes('alle 141 Archetypen'), h);
        assert.ok(h.includes('141 Archetypen.'), h);
        assert.ok(h.includes('142 ausdrücklich als NEU verzeichnet'),
            'BEFUND B4 war genau das: neu liess sich auf 0 setzen, ohne dass etwas rot wurde\n' + h);
        assert.ok(h.includes('143 Turniere'), h);
        assert.ok(h.includes('01.01.2099 – 02.01.2099'), h);
    });

    it('B4: an der Aufrufstelle steht rechts vom Doppelpunkt keine nackte Zahl mehr', () => {
        const ab = SRC.indexOf(MARKE);
        const block = SRC.slice(ab, SRC.indexOf('});', ab));
        const literale = block.split('\n').slice(1)
            .filter(z => /:\s*[^,\n]*\b\d/.test(z) && !/\|\|\s*0\b/.test(z)
                      && !/length === 0/.test(z))
            .map(z => z.trim());
        assert.deepEqual(literale, [],
            'wieder abgeschrieben statt durchgereicht: ' + literale.join(' | '));
    });

    // ───────────────────────────────────────────────────────────
    // (B) B4: die genannte Schwelle ist die, an der wirklich gefiltert wird.
    // ───────────────────────────────────────────────────────────

    /** getCityLeagueSortedSections() auf gesetzten Zeilen ausfuehren. */
    function stufen(zeilen) {
        const kasten = {
            Math, Number, String, Object, Array, JSON, parseInt, parseFloat,
            console: { warn() {}, log() {}, info() {} },
            parseLocaleNumber: (v, s) => {
                const n = parseFloat(String(v).replace(',', '.'));
                return Number.isFinite(n) ? n : (s || 0);
            }
        };
        vm.createContext(kasten);
        // Die Konstante wird AUSGEFUEHRT, nicht abgeschrieben.
        const konstZeile = /const CL_MINDEST_ANTEIL_GROESSTER\s*=\s*[^;]+;/.exec(SRC);
        assert.ok(konstZeile, 'CL_MINDEST_ANTEIL_GROESSTER steht nicht mehr in der Datei');
        vm.runInContext(
            'let _cityLeagueSortCache = null; let _cityLeagueSortDataRef = null;\n'
            + konstZeile[0] + '\n'
            + funktion(SRC, 'getCityLeagueSortedSections')
            + '\n;globalThis.CL_ANTEIL = CL_MINDEST_ANTEIL_GROESSTER;', kasten);
        return { erg: kasten.getCityLeagueSortedSections(zeilen), anteil: kasten.CL_ANTEIL };
    }

    it('B4: die im Satz genannte Schwelle ist genau die Grenze der Performance-Rubriken', () => {
        // Groesster Archetyp: 200 Listen. Zwei Kandidaten mit verbesserter
        // Platzierung liegen knapp unter und knapp auf der Schwelle.
        const schwelleSoll = 20;   // 200 * 0,1 — die Rechnung macht der Code
        const zeilen = [
            { archetype: 'Gross',  status: 'BESTEHEND', new_count: '200', old_count: '150',
              count_change: '50', avg_placement_change: '0,0', new_avg_placement: '5,0' },
            { archetype: 'Knapp drunter', status: 'BESTEHEND', new_count: String(schwelleSoll - 1),
              old_count: '10', count_change: '9', avg_placement_change: '-2,0', new_avg_placement: '4,0' },
            { archetype: 'Genau drauf', status: 'BESTEHEND', new_count: String(schwelleSoll),
              old_count: '10', count_change: '10', avg_placement_change: '-3,0', new_avg_placement: '3,0' }
        ];
        const { erg, anteil } = stufen(zeilen);
        assert.equal(erg.countThreshold, 200 * anteil,
            'die Schwelle im Zwischenspeicher muss die gefilterte sein');
        const drin = erg.improvers.map(d => d.archetype);
        assert.deepEqual(drin, ['Genau drauf'],
            'genau die Zeile AUF der Schwelle zaehlt, die darunter nicht — '
            + 'sonst nennt der Satz eine Schwelle, nach der nicht gefiltert wird');

        // Und derselbe Wert steht im Satz.
        const h = hinweis('de', Object.assign({}, VOLLSTAENDIG, {
            mindestListen: erg.countThreshold,
            mindestAnteil: anteil,
            leer: { seltener: true, haeufiger: true, verbessert: true, verschlechtert: true,
                    aufsteiger: true, neuTabelle: true, verschwunden: true },
            vorhanden: { haeufiger: 0, neuTabelle: 0, verschwunden: 0 }
        }));
        assert.ok(h.includes('mindestens ' + schwelleSoll + ' Listen'),
            'der Satz nennt eine andere Zahl als die Filterung: ' + h);
    });

    it('der Block wird wirklich gerendert, an der Stelle der fehlenden Tabellen', () => {
        assert.match(SRC, /html \+= cityLeagueVergleichLeerHinweis\(\{/,
            'der Aufruf steht in renderCityLeagueTable');
        const ab = SRC.indexOf('html += cityLeagueVergleichLeerHinweis({');
        const bis = SRC.indexOf('// Add conditional tables', ab);
        assert.ok(bis > ab && bis - ab < 1800,
            'er steht direkt vor den bedingten Tabellen, nicht irgendwo');
        const block = SRC.slice(ab, bis);
        ['keinVorzeitraum: keinVorzeitraum', 'zeitraum: dateRange',
         'turniere: tournamentCount', 'archetypen: totalArchetypes',
         'neu: newArchetypes.length',
         'mindestListen: countThreshold',
         'mindestAnteil: CL_MINDEST_ANTEIL_GROESSTER',
         'seltener:       decreased.length === 0',
         'verbessert:     improvers.length === 0',
         'verschlechtert: decliners.length === 0'].forEach(p => {
            assert.ok(block.includes(p), 'nicht durchgereicht: ' + p);
        });
        // countThreshold muss aus getCityLeagueSortedSections kommen, sonst
        // ist es wieder eine zweite Rechnung.
        assert.match(SRC, /countThreshold \} = getCityLeagueSortedSections\(cityLeagueData\)/,
            'die Schwelle muss aus der Sortierfunktion herausgereicht werden');
    });

    it('benutzt nur Klassen, die es schon gibt — kein neues CSS noetig', () => {
        const h = hinweis('de', OHNE_VORZEITRAUM);
        const ui = fs.readFileSync(path.join(WURZEL, 'css', 'ui-components.css'), 'utf8');
        ['city-league-info-table-block', 'city-league-info-table-title',
         'city-league-info-combined-explanation'].forEach(k => {
            assert.ok(h.includes(k), 'Klasse nicht benutzt: ' + k);
            assert.ok(ui.includes('.' + k), 'Klasse nicht gestylt: ' + k);
        });
    });
});
