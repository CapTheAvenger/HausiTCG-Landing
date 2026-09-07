/**
 * ZWEI NORMALISIERER, EINE APOSTROPH-REGEL.
 *
 * WORUM ES GEHT
 * -------------
 * Deck-Namen kommen aus mehreren Quellen und werden verschieden
 * geschrieben — "N's Zoroark ex", "N’s Zoroark ex", "Ns Zoroark".
 * Zwei Module bauen daraus einen Vergleichsschluessel:
 *
 *   js/app-meta-cards.js   normalizeArchetypeForMatch(name)
 *       Der gemeinsame Schluessel zwischen current_meta_card_data.csv
 *       und limitless_online_decks.csv. Streicht zusaetzlich das
 *       freistehende "ex" und angehaengte Set-Kuerzel.
 *   js/app-tier-meta.js    _normArchName(name)
 *       Der Schluessel fuer die Bild- und Kartensuche der Kacheln.
 *       Macht zusaetzlich aus Bindestrichen Leerzeichen.
 *
 * BEFUND (07.09.2026), hier behoben
 * ---------------------------------
 * Die Apostroph-Zeichenklasse war in beiden Modulen verschieden:
 *
 *   js/app-tier-meta.js:602    [U+0027 U+0027 U+0060]
 *       — der gerade Apostroph ZWEIMAL, der typografische gar nicht.
 *   js/app-meta-cards.js:10    [U+0027 U+2019 U+2018 U+0060]
 *       — kennt den typografischen, aber nicht U+00B4.
 *
 *   Eingabe   "N’s Zoroark ex"  (U+2019)
 *   erwartet  der Genitiv faellt weg, wie bei "N's Zoroark ex"
 *   gemessen  _normArchName -> "n’s zoroark ex"   (Genitiv bleibt stehen)
 *             normalizeArchetypeForMatch -> "n zoroark"
 *
 * Wirkung heute: keine. data/limitless_online_decks.csv enthaelt kein
 * einziges U+2019. Das ist eine Eigenschaft der heutigen Daten, keine
 * des Codes — liefert eine Quelle Deck-Namen typografisch, laufen Bild-
 * und Kartensuche im Reiter "Laufendes Meta" ins Leere.
 *
 * WAS HIER GEPRUEFT WIRD — UND WAS NICHT
 * --------------------------------------
 * Die beiden Funktionen sind KEINE Abschriften voneinander. Sie teilen
 * die Apostroph-Regel, unterscheiden sich aber absichtlich in allem
 * anderen (nur eine streicht "ex" und Set-Kuerzel, nur die andere macht
 * aus Bindestrichen Leerzeichen). Bestehende Zusicherungen in
 * tests/unit/test-fuzzyArchetypeMatch.js halten beide Seiten fest.
 *
 * Gemeinsam sein MUSS die Apostroph-Regel. Diese Datei prueft das auf
 * zwei Wegen:
 *   (1) an der Quelle — die Zeichenklasse steht in beiden Dateien
 *       zeichengleich und deckt alle sieben Schreibweisen ab;
 *   (2) am Verhalten — jede Schreibweise desselben Namens ergibt in
 *       JEDER der beiden Funktionen denselben Schluessel, und wo die
 *       uebrigen Regeln nicht greifen, liefern beide dasselbe.
 *
 * KEINE LIVEDATEN: jeden Namen setzt der Test selbst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');

function funktion(src, name, datei) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(src);
    assert.ok(m, `Funktion nicht mehr in js/${datei}: ${name}`);
    const start = src.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = src.indexOf('{', start); i < src.length; i++) {
        if (src[i] === '{') tiefe++;
        else if (src[i] === '}' && --tiefe === 0) return src.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

const TIER = lies('app-tier-meta.js');
const KARTEN = lies('app-meta-cards.js');

// Beide Funktionen aus der echten Datei schneiden und ausfuehren.
const LAUF = (() => {
    const kasten = { String };
    vm.createContext(kasten);
    vm.runInContext(funktion(TIER, '_normArchName', 'app-tier-meta.js'), kasten);
    vm.runInContext(funktion(KARTEN, 'normalizeArchetypeForMatch', 'app-meta-cards.js'), kasten);
    return kasten;
})();
const normTier = LAUF._normArchName;
const normKarten = LAUF.normalizeArchetypeForMatch;

// Die sieben Schreibweisen, die in den Quellen vorkommen.
const APOSTROPHE = [
    ["U+0027 gerader Apostroph", "'"],
    ["U+2018 einfaches Anfuehrungszeichen links", '‘'],
    ["U+2019 typografischer Apostroph", '’'],
    ["U+201B umgekehrtes Anfuehrungszeichen", '‛'],
    ["U+0060 Gravis", '`'],
    ["U+00B4 Akut", '´'],
    ["U+02BC Modifikator-Apostroph", 'ʼ'],
];

// Kniffliger Namensbestand: Genitiv, Doppelgenitiv, Apostroph ohne
// Genitiv, Bindestrich, Set-Kuerzel, "ex" im Wort.
const NAMEN = [
    'N#s Zoroark ex',
    "Rocket#s Mewtwo ex",
    'Cynthia#s Garchomp',
    'Iono#s Bellibolt',
    'Hop#s Zacian',
    'Marnie#s Grimmsnarl ex',
    'Ethan#s Ho-Oh ex',
    'Steven#s Metagross',
    'Lillie#s Clefairy ex',
    'Team Rocket#s Great Ball',
    'Mega Excadrill',
    'Raging-Bolt Ogerpon',
    'Dragapult ex TEF',
    'N#s Castle',
    'Arven#s Mabosstiff#s Deck',
    '#Anfuehrung vorne',
    'Ende hinten#',
    'nur#ein#Apostroph',
];

const mit = (name, zeichen) => name.split('#').join(zeichen);

// ══════════════════════════════════════════════════════════════════
// (1) AN DER QUELLE — eine Zeichenklasse, zweimal zeichengleich
// ══════════════════════════════════════════════════════════════════

/** Alle Apostroph-Zeichenklassen einer Funktion woertlich einsammeln. */
function klassenAus(quelle, name, datei) {
    const rumpf = funktion(quelle, name, datei);
    return (rumpf.match(/\[(?:[^\]\\]|\\.)*\]/g) || [])
        .filter(k => /u2019|u2018|u201B|u00B4|u02BC|'|`/i.test(k));
}

describe('die Apostroph-Zeichenklasse steht in beiden Modulen gleich', () => {
    const klassenTier = klassenAus(TIER, '_normArchName', 'app-tier-meta.js');
    const klassenKarten = klassenAus(KARTEN, 'normalizeArchetypeForMatch', 'app-meta-cards.js');

    it('jede Funktion benutzt genau EINE Schreibweise der Klasse', () => {
        assert.ok(klassenTier.length >= 2, 'Genitiv- und Rest-Regel erwartet');
        assert.ok(klassenKarten.length >= 2);
        assert.equal(new Set(klassenTier).size, 1,
            '_normArchName benutzt zwei verschiedene Klassen: ' + JSON.stringify(klassenTier));
        assert.equal(new Set(klassenKarten).size, 1,
            'normalizeArchetypeForMatch benutzt zwei verschiedene Klassen: ' + JSON.stringify(klassenKarten));
    });

    it('die Klasse ist in beiden Dateien Zeichen fuer Zeichen dieselbe', () => {
        // Genau der Befund: hier standen [U+0027 U+0027 U+0060] gegen
        // [U+0027 U+2019 U+2018 U+0060]. Weicht eine Abschrift wieder
        // ab, faellt diese Zusicherung.
        assert.equal(klassenTier[0], klassenKarten[0],
            'js/app-tier-meta.js: ' + klassenTier[0]
            + '\njs/app-meta-cards.js: ' + klassenKarten[0]);
    });

    it('die Klasse fuehrt kein Zeichen doppelt', () => {
        // Der eigentliche Tippfehler von damals: derselbe gerade
        // Apostroph stand zweimal drin, und deshalb sah niemand, dass
        // der typografische fehlte.
        const inhalt = klassenTier[0].slice(1, -1).split(/(\\u[0-9A-Fa-f]{4}|\\.|.)/).filter(Boolean);
        assert.equal(new Set(inhalt).size, inhalt.length,
            'ein Zeichen steht doppelt in der Klasse: ' + klassenTier[0]);
    });

    it('alle sieben Schreibweisen stehen drin', () => {
        for (const [wie, zeichen] of APOSTROPHE) {
            const re = new RegExp(klassenTier[0].replace(/^\[|\]$/g, (s) => s), '');
            assert.equal(re.test(zeichen), true, `${wie} fehlt in der Klasse`);
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// (2) AM VERHALTEN — die Schreibweise darf keinen Unterschied machen
// ══════════════════════════════════════════════════════════════════

describe('jede Apostroph-Schreibweise ergibt denselben Schluessel', () => {
    for (const name of NAMEN) {
        it(`_normArchName — ${JSON.stringify(mit(name, "'"))}`, () => {
            const soll = normTier(mit(name, "'"));
            for (const [wie, zeichen] of APOSTROPHE) {
                assert.equal(normTier(mit(name, zeichen)), soll,
                    `${wie}: ${JSON.stringify(normTier(mit(name, zeichen)))} statt ${JSON.stringify(soll)}`);
            }
            assert.equal(soll.includes('’'), false, 'ein Apostroph blieb stehen');
        });

        it(`normalizeArchetypeForMatch — ${JSON.stringify(mit(name, "'"))}`, () => {
            const soll = normKarten(mit(name, "'"));
            for (const [wie, zeichen] of APOSTROPHE) {
                assert.equal(normKarten(mit(name, zeichen)), soll,
                    `${wie}: ${JSON.stringify(normKarten(mit(name, zeichen)))} statt ${JSON.stringify(soll)}`);
            }
            assert.equal(soll.includes('’'), false, 'ein Apostroph blieb stehen');
        });
    }
});

describe('der Befund selbst — die Eingabe aus dem Bericht', () => {
    it('"N’s Zoroark ex" verliert den Genitiv jetzt in BEIDEN Modulen', () => {
        // Vor der Reparatur: _normArchName -> "n’s zoroark ex".
        assert.equal(normTier('N’s Zoroark ex'), 'n zoroark ex');
        assert.equal(normKarten('N’s Zoroark ex'), 'n zoroark');
        // Und die typografische Schreibweise faellt jetzt genau so aus
        // wie die gerade — darum ging es.
        assert.equal(normTier('N’s Zoroark ex'), normTier("N's Zoroark ex"));
        assert.equal(normKarten('N’s Zoroark ex'), normKarten("N's Zoroark ex"));
    });

    it('"Rocket’s Mewtwo" ebenso', () => {
        assert.equal(normTier('Rocket’s Mewtwo'), 'rocket mewtwo');
        assert.equal(normTier('Rocket’s Mewtwo'), normTier("Rocket's Mewtwo"));
        assert.equal(normKarten('Rocket’s Mewtwo'), normKarten("Rocket's Mewtwo"));
    });

    it('U+00B4 — die Luecke, die auch das Schwestermodul hatte', () => {
        // js/app-meta-cards.js kannte U+2019 und U+2018, aber nicht den
        // Akut. "Iono´s Bellibolt" ging dort unveraendert durch.
        assert.equal(normKarten('Iono´s Bellibolt'), 'iono bellibolt');
        assert.equal(normTier('Iono´s Bellibolt'), 'iono bellibolt');
    });
});

describe('beide Funktionen gegeneinander', () => {
    /*
     * Wo die uebrigen Regeln nicht greifen — kein freistehendes "ex",
     * kein Set-Kuerzel, kein Bindestrich — muessen beide Funktionen
     * dasselbe liefern. Genau dort war der Unterschied vorher sichtbar.
     */
    const GLEICH = [
        'Rocket#s Mewtwo',
        'Cynthia#s Garchomp',
        'Iono#s Bellibolt',
        'Hop#s Zacian',
        'Steven#s Metagross',
        'N#s Castle',
        'Team Rocket#s Great Ball',
        'Marnie#s Grimmsnarl',
        'Ethan#s Ho#Oh',
        'ohne apostroph',
    ];

    for (const name of GLEICH) {
        it(`gleiches Ergebnis: ${JSON.stringify(mit(name, "'"))}`, () => {
            for (const [wie, zeichen] of APOSTROPHE) {
                const e = mit(name, zeichen);
                assert.equal(normTier(e), normKarten(e),
                    `${wie}: _normArchName ${JSON.stringify(normTier(e))} `
                    + `!= normalizeArchetypeForMatch ${JSON.stringify(normKarten(e))}`);
            }
        });
    }

    it('die uebrigen Regeln bleiben absichtlich verschieden', () => {
        // Damit niemand die beiden spaeter "aufraeumt" und dabei
        // bestehende Zusicherungen bricht: das hier ist gewollt.
        // Nur normalizeArchetypeForMatch streicht "ex" und Set-Kuerzel.
        assert.equal(normKarten('Gardevoir ex'), 'gardevoir');
        assert.equal(normTier('Gardevoir ex'), 'gardevoir ex');
        assert.equal(normKarten('Dragapult ex TEF'), 'dragapult');
        assert.equal(normTier('Dragapult ex TEF'), 'dragapult ex tef');
        // Nur _normArchName macht aus Bindestrichen Leerzeichen.
        assert.equal(normTier('Raging-Bolt Ogerpon'), 'raging bolt ogerpon');
        assert.equal(normKarten('Raging-Bolt Ogerpon'), 'raging-bolt ogerpon');
    });

    it('leere und fehlende Eingaben ergeben in beiden eine leere Zeichenkette', () => {
        for (const leer of ['', null, undefined, 0, false, NaN]) {
            assert.equal(normTier(leer), '', `_normArchName(${JSON.stringify(leer)})`);
            assert.equal(normKarten(leer), '', `normalizeArchetypeForMatch(${JSON.stringify(leer)})`);
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// (3) WEITERE ABSCHRIFTEN IM HAUS
// ══════════════════════════════════════════════════════════════════

describe('der dritte Normalisierer im Haus', () => {
    it('js/app-city-league.js:_normalizeArchetypeForMatch kennt alle Schreibweisen', () => {
        /*
         * Der dritte hat eine ANDERE Aufgabe: er streicht Apostrophe
         * nicht, er vereinheitlicht sie auf U+0027 (dropdown-Namen gegen
         * CSV-Namen aufloesen). Deshalb bleibt er, wie er ist — aber die
         * Menge der erkannten Zeichen muss dieselbe sein, sonst faellt
         * hier eine Schreibweise durch, die die anderen beiden fangen.
         */
        const CITY = lies('app-city-league.js');
        const kasten = { String };
        vm.createContext(kasten);
        vm.runInContext(funktion(CITY, '_normalizeArchetypeForMatch', 'app-city-league.js'), kasten);
        const norm = kasten._normalizeArchetypeForMatch;

        const soll = norm("Rocket's Mewtwo");
        assert.equal(soll, "rocket's mewtwo", 'er vereinheitlicht, statt zu streichen');
        for (const [wie, zeichen] of APOSTROPHE) {
            assert.equal(norm(mit('Rocket#s Mewtwo', zeichen)), soll, `${wie} nicht erkannt`);
        }
    });
});
