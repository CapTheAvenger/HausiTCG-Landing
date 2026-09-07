/**
 * Das ✨-Abzeichen: "du besitzt diese Karte, nur als anderer Druck".
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross — ein Name, der Abdeckung
 * behauptet, und `# pass 1` darunter. scripts/run-js-unit-tests.sh
 * zaehlt leere Dateien seit dem 30.08.2026 nicht mehr mit und benennt
 * sie; das hier ist die Antwort darauf.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Beide geprueften Funktionen stehen unveraendert unter ihren alten
 * Namen in js/app-utils.js (Stand 07.09.2026):
 *
 *   getInternationalPrintsForCard        js/app-utils.js:153
 *   getOtherInternationalPrintOwnedCount js/app-utils.js:270
 *
 * WAS AUF DEM SPIEL STEHT
 * -----------------------
 * Das Abzeichen darf NUR Drucke zaehlen, die zur international_prints-
 * Familie der angezeigten Karte gehoeren — nicht jede Karte gleichen
 * Namens. "Ralts ZZZ 99" ist derselbe Name und eine andere Karte; wer
 * ueber den Namen zaehlt, meldet dem Nutzer Besitz, den er nicht hat.
 * Genau dafuer gibt es die Familie in den Daten.
 *
 * Die zweite Haelfte ist die HUELLE: getInternationalPrintsForCard baut
 * die Familie transitiv auf, weil die Verweise in den Daten einseitig
 * sind (MEP-33 nennt ASC-113, ASC-113 nennt MEP-33 nicht). Faellt die
 * Huelle, faellt das Abzeichen still auf die halbe Familie zurueck.
 *
 * KEIN jsdom, KEINE Livedaten: der Kartenindex unten ist gesetzt.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-utils.js'), 'utf8');

/** Eine Funktionsdeklaration per Namen herausschneiden (Klammerzaehlung). */
function funktion(name) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(QUELLE);
    assert.ok(m, `Funktion nicht mehr in js/app-utils.js: ${name}`);
    const start = QUELLE.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = QUELLE.indexOf('{', start); i < QUELLE.length; i++) {
        if (QUELLE[i] === '{') tiefe++;
        else if (QUELLE[i] === '}' && --tiefe === 0) return QUELLE.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

/**
 * Ein Kartenindex, wie ihn die Seite zur Laufzeit haelt.
 * Drei Drucke einer Familie, ein vierter mit demselben NAMEN, der
 * ausdruecklich NICHT dazugehoert, und ein Nachbar fuer die Huelle.
 */
function index() {
    return {
        'AAA-1':  { set: 'AAA', number: '1',  name: 'Ralts', image_url: 'a.png', international_prints: 'AAA-1,BBB-2,CCC-3' },
        'BBB-2':  { set: 'BBB', number: '2',  name: 'Ralts', image_url: 'b.png', international_prints: 'AAA-1,BBB-2,CCC-3' },
        'CCC-3':  { set: 'CCC', number: '3',  name: 'Ralts', image_url: 'c.png', international_prints: 'AAA-1,BBB-2,CCC-3' },
        // Gleicher Name, eigene Familie — darf nie mitgezaehlt werden.
        'ZZZ-99': { set: 'ZZZ', number: '99', name: 'Ralts', image_url: 'z.png', international_prints: 'ZZZ-99' },
        // Einseitiger Verweis: DDD-4 nennt AAA-1, AAA-1 nennt DDD-4 nicht.
        'DDD-4':  { set: 'DDD', number: '4',  name: 'Ralts', image_url: 'd.png', international_prints: 'AAA-1,DDD-4' },
        // Eine ganz andere Karte, ohne Familienangabe.
        'EEE-5':  { set: 'EEE', number: '5',  name: 'Kirlia', image_url: 'e.png' },
    };
}

function baue(opts = {}) {
    const karten = opts.index || index();
    const nachName = {};
    Object.values(karten).forEach(c => {
        (nachName[c.name] = nachName[c.name] || []).push(c);
    });

    const kasten = {
        String, Number, Object, Array, Map, Set, parseInt,
        console: { log() {}, warn() {} },
        INTL_PRINTS_CACHE_MAX: 500,
        internationalPrintsCache: new Map(),
        cardsBySetNumberMap: karten,
        debugVersionSelectionLog: () => {},
        hasMojibake: (v) => /[ÃÂâ]/.test(String(v || '')),
        normalizeSetCode: (s) => (s ? String(s).toUpperCase().trim() : ''),
        normalizeCardNumber: (n) => (n ? String(n).trim() : ''),
        getIndexedCardBySetNumber: (s, n) => karten[`${s}-${n}`] || null,
        window: {
            cardsByNameMap: opts.hulleAn === false ? null : nachName,
            userCollectionCounts: opts.globaleSammlung || null,
        },
    };
    vm.createContext(kasten);
    vm.runInContext([
        funktion('_intlCacheSet'),
        funktion('getInternationalPrintsForCard'),
        funktion('getOtherInternationalPrintOwnedCount'),
    ].join('\n'), kasten);
    return kasten;
}

// Die Felder kommen aus dem vm-Realm; deepEqual vergleicht auch den
// Prototyp. Deshalb hier in ein Feld DIESES Realms umkopieren.
const schluessel = (drucke) =>
    Array.from(drucke, c => `${c.set}-${c.number}`).sort();

// ══════════════════════════════════════════════════════════════════
// getInternationalPrintsForCard — die Familie
// ══════════════════════════════════════════════════════════════════
describe('getInternationalPrintsForCard — die Druckfamilie einer Karte', () => {
    it('loest die Liste "AAA-1,BBB-2,CCC-3" in echte Kartensaetze auf', () => {
        const F = baue();
        const drucke = F.getInternationalPrintsForCard('AAA', '1');
        // DDD-4 kommt ueber die Huelle dazu (es nennt AAA-1).
        assert.deepEqual(schluessel(drucke), ['AAA-1', 'BBB-2', 'CCC-3', 'DDD-4']);
    });

    it('die Huelle holt den einseitigen Verweis herein', () => {
        // Ohne cardsByNameMap gibt es keine Huelle ueber gleiche Namen —
        // dann fehlt DDD-4. Das ist die Gegenprobe zur Zeile darueber.
        const F = baue({ hulleAn: false });
        assert.deepEqual(schluessel(F.getInternationalPrintsForCard('AAA', '1')),
            ['AAA-1', 'BBB-2', 'CCC-3']);
    });

    it('gleicher Name, andere Familie: ZZZ-99 kommt nie mit', () => {
        const F = baue();
        const drucke = F.getInternationalPrintsForCard('AAA', '1');
        assert.equal(drucke.some(c => c.set === 'ZZZ'), false);
        // Und umgekehrt bleibt ZZZ-99 fuer sich.
        assert.deepEqual(schluessel(F.getInternationalPrintsForCard('ZZZ', '99')), ['ZZZ-99']);
    });

    it('eine Karte ohne Familienangabe liefert sich selbst', () => {
        const F = baue();
        assert.deepEqual(schluessel(F.getInternationalPrintsForCard('EEE', '5')), ['EEE-5']);
    });

    it('unbekannte Karte, leeres Set und leere Nummer ergeben eine leere Liste', () => {
        const F = baue();
        assert.equal(F.getInternationalPrintsForCard('QQQ', '404').length, 0);
        assert.equal(F.getInternationalPrintsForCard('', '1').length, 0);
        assert.equal(F.getInternationalPrintsForCard('AAA', '').length, 0);
        assert.equal(F.getInternationalPrintsForCard(null, null).length, 0);
    });

    it('ohne geladenen Kartenindex kommt eine leere Liste, kein Absturz', () => {
        const F = baue({ index: {} });
        assert.equal(F.getInternationalPrintsForCard('AAA', '1').length, 0);
    });

    it('die Schreibweise des Setkuerzels ist egal', () => {
        const F = baue();
        assert.deepEqual(
            schluessel(F.getInternationalPrintsForCard('aaa', ' 1 ')),
            schluessel(F.getInternationalPrintsForCard('AAA', '1'))
        );
    });

    it('der zweite Aufruf kommt aus dem Zwischenspeicher — dasselbe Feld', () => {
        const F = baue();
        const a = F.getInternationalPrintsForCard('AAA', '1');
        const b = F.getInternationalPrintsForCard('AAA', '1');
        assert.equal(a === b, true, 'der Zwischenspeicher gibt dieselbe Liste zurueck');
        assert.equal(F.internationalPrintsCache.has('AAA-1'), true);
    });
});

// ══════════════════════════════════════════════════════════════════
// getOtherInternationalPrintOwnedCount — das Abzeichen
// ══════════════════════════════════════════════════════════════════
describe('getOtherInternationalPrintOwnedCount — was das ✨-Abzeichen zaehlt', () => {
    it('zaehlt nur die ANDEREN Drucke der eigenen Familie', () => {
        const F = baue();
        const sammlung = new Map([
            ['Ralts|AAA|1', 4],    // der angezeigte Druck selbst — zaehlt nicht
            ['Ralts|BBB|2', 2],
            ['Ralts|CCC|3', 1],
            ['Ralts|ZZZ|99', 12],  // gleicher Name, fremde Familie — zaehlt nicht
        ]);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', sammlung), 3);
    });

    it('der Name im Schluessel wird NICHT gelesen — nur Set und Nummer', () => {
        // Belegt, dass ueber die Druckidentitaet gezaehlt wird und nicht
        // ueber den Namen: derselbe Druck unter falschem Namen zaehlt mit.
        const F = baue();
        const sammlung = new Map([['Kirlia|BBB|2', 5]]);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', sammlung), 5);
    });

    it('besitzt man nur den angezeigten Druck, ist es 0', () => {
        const F = baue();
        assert.equal(
            F.getOtherInternationalPrintOwnedCount('AAA', '1', new Map([['Ralts|AAA|1', 4]])),
            0
        );
    });

    it('leere Sammlung, fehlende Sammlung und leere Angaben ergeben 0', () => {
        const F = baue();
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', new Map()), 0);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', null), 0);
        assert.equal(F.getOtherInternationalPrintOwnedCount('', '1', new Map([['Ralts|BBB|2', 2]])), 0);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '', new Map([['Ralts|BBB|2', 2]])), 0);
        assert.equal(F.getOtherInternationalPrintOwnedCount(null, null, new Map([['Ralts|BBB|2', 2]])), 0);
    });

    it('eine Karte ohne weitere Drucke ergibt 0, auch wenn sie besessen wird', () => {
        const F = baue();
        assert.equal(
            F.getOtherInternationalPrintOwnedCount('EEE', '5', new Map([['Kirlia|EEE|5', 3]])),
            0
        );
    });

    it('Anzahl 0, negative Anzahl und Unsinn zaehlen nicht mit', () => {
        const F = baue();
        const sammlung = new Map([
            ['Ralts|BBB|2', 0],
            ['Ralts|CCC|3', -4],
            ['Ralts|DDD|4', 'zwei'],
        ]);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', sammlung), 0);
    });

    it('Zahlentext wird gelesen, die Schreibweise im Schluessel ist egal', () => {
        const F = baue();
        const sammlung = new Map([['Ralts|bbb|2', '3']]);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', sammlung), 3);
    });

    it('kaputte Schluessel ohne zwei Trennstriche werden uebersprungen', () => {
        const F = baue();
        const sammlung = new Map([['Ralts', 9], ['Ralts|BBB', 9], ['Ralts|BBB|2', 1]]);
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', sammlung), 1);
    });

    it('ohne uebergebene Sammlung wird die globale genommen', () => {
        const global = new Map([['Ralts|CCC|3', 7]]);
        const F = baue({ globaleSammlung: global });
        assert.equal(F.getOtherInternationalPrintOwnedCount('AAA', '1', undefined), 7);
    });
});
