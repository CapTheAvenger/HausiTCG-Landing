/**
 * DIE KARTEN-KLASSIFIZIERER UND DER LEERE EINTRAG.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Am 07.09.2026 wurde gemessen:
 *
 *   isAceSpec(null)      → TypeError: Cannot read properties of null (reading 'card_name')
 *   isAceSpec(undefined) → TypeError: Cannot read properties of undefined (reading 'card_name')
 *
 * `typeof null === 'object'`, also fuehrte der Ternaer in
 * js/app-core.js in den Objektzweig. Die drei Nachbarn in
 * js/app-utils.js — isBasicEnergy, isRadiantPokemon, isPrismStarCard —
 * lieferten bei derselben Eingabe anstandslos false. Die Uneinheitlich-
 * keit war der Befund: window.isAceSpec haengt an jedem Modul, und
 * js/app-deck-builder.js:5344 filtert `deckCards.filter(card => isAceSpec(card))`
 * — ein leerer Eintrag im Deck brach damit das automatische
 * Vervollstaendigen ab.
 *
 * Die Zusicherung fuer den nackten Fall steht in
 * tests/unit/test-isAceSpec-removeCard.js (ehemals test.skip). HIER
 * stehen die Faelle daneben: die anderen leeren Werte, das Objekt mit
 * leeren Feldern, der Gleichstand mit den drei Nachbarn und die
 * Aufrufstelle getLegalMaxCopies, die vier Klassifizierer hintereinander
 * haengt und deshalb als erste umgefallen waere.
 *
 * ALLE VIER FUNKTIONEN LAUFEN ECHT, aus js/ geschnitten.
 * KEINE LIVEDATEN, KEIN jsdom.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');
const CORE = lies('app-core.js');
const UTILS = lies('app-utils.js');
const CITY = lies('app-city-league.js');

function funktion(src, name, datei) {
    const re = new RegExp(`(^|\\n)\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const m = re.exec(src);
    assert.ok(m, `Funktion nicht mehr in js/${datei}: ${name}`);
    const start = m.index + m[1].length;
    let runde = 0, nachParam = -1;
    for (let i = src.indexOf('(', start); i < src.length; i++) {
        if (src[i] === '(') runde++;
        else if (src[i] === ')' && --runde === 0) { nachParam = i + 1; break; }
    }
    assert.ok(nachParam > 0, name + ': die Parameterliste geht nicht auf');
    let tiefe = 0;
    for (let i = src.indexOf('{', nachParam); i < src.length; i++) {
        if (src[i] === '{') tiefe++;
        else if (src[i] === '}' && --tiefe === 0) return src.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

const ALIAS = UTILS.match(/const LEGACY_CARD_NAME_ALIASES = (Object\.freeze\(\{[\s\S]*?\}\));/);
assert.ok(ALIAS, 'LEGACY_CARD_NAME_ALIASES nicht gefunden');

/** Alle vier Klassifizierer plus getLegalMaxCopies in EINEM Kasten. */
function bauKasten(liste = ['prime catcher', 'master ball']) {
    const kasten = { aceSpecsList: liste, window: {}, String, Array, Object, isNaN, parseInt };
    vm.createContext(kasten);
    vm.runInContext([
        'const LEGACY_CARD_NAME_ALIASES = ' + ALIAS[1] + ';',
        funktion(UTILS, 'fixMojibake', 'app-utils.js'),
        funktion(UTILS, 'getLegacyCardNameAlias', 'app-utils.js'),
        funktion(UTILS, 'normalizeCardName', 'app-utils.js'),
        funktion(UTILS, 'isBasicEnergy', 'app-utils.js'),
        funktion(UTILS, 'isRadiantPokemon', 'app-utils.js'),
        funktion(UTILS, 'isPrismStarCard', 'app-utils.js'),
        funktion(CITY, 'isBasicEnergyCardEntry', 'app-city-league.js'),
        funktion(CORE, 'isAceSpec', 'app-core.js'),
        funktion(UTILS, 'getLegalMaxCopies', 'app-utils.js'),
    ].join('\n\n'), kasten);
    return kasten;
}

/** Alles, was statt einer Karte durchrutschen kann. */
const LEERE = [
    ['null', null],
    ['undefined', undefined],
    ['0', 0],
    ['NaN', NaN],
    ['false', false],
    ['leerer String', ''],
    ['leeres Objekt', {}],
    ['leeres Feld', []],
    ['{card_name: null}', { card_name: null }],
    ['{card_name: undefined, name: null}', { card_name: undefined, name: null }],
];

describe('isAceSpec vertraegt jeden leeren Wert', () => {
    const ist = bauKasten().isAceSpec;

    for (const [wie, wert] of LEERE) {
        it(`${wie} → false, ohne Wurf`, () => {
            assert.equal(ist(wert), false);
        });
    }

    it('und erkennt daneben weiter, was auf der Liste steht', () => {
        // Gegenprobe: die Behebung darf die Erkennung nicht abstumpfen.
        assert.equal(ist('Prime Catcher'), true);
        assert.equal(ist({ card_name: 'Master Ball' }), true);
        assert.equal(ist({ card_name: null, name: 'Master Ball' }), true,
            'ein leeres card_name faellt weiter auf name durch');
    });
});

describe('die vier Klassifizierer verhalten sich bei leeren Werten GLEICH', () => {
    // Das war der Kern des Befunds: drei vertrugen null, einer warf.
    const k = bauKasten();
    const NAMEN = ['isAceSpec', 'isBasicEnergy', 'isRadiantPokemon', 'isPrismStarCard'];

    for (const [wie, wert] of LEERE) {
        it(`${wie}: alle vier liefern false`, () => {
            for (const n of NAMEN) {
                let ergebnis;
                assert.doesNotThrow(() => { ergebnis = k[n](wert); }, `${n}(${wie}) hat geworfen`);
                assert.equal(ergebnis, false, `${n}(${wie}) → ${ergebnis}`);
            }
        });
    }
});

describe('getLegalMaxCopies — die Aufrufstelle, die vier davon hintereinander haengt', () => {
    const k = bauKasten();

    it('ein leerer Eintrag ergibt 4 statt eines Wurfs', () => {
        // js/app-utils.js reicht cardLike an isAceSpec weiter. Vor der
        // Behebung war das der kuerzeste Weg zum TypeError.
        for (const [wie, wert] of [['null', null], ['undefined', undefined], ['leerer String', '']]) {
            let ergebnis;
            assert.doesNotThrow(() => { ergebnis = k.getLegalMaxCopies(wert); }, wie);
            assert.equal(ergebnis, 4, wie);
        }
    });

    it('die Obergrenzen selbst stehen unveraendert', () => {
        assert.equal(k.getLegalMaxCopies('Prime Catcher'), 1, 'Ace Spec: eine Kopie');
        assert.equal(k.getLegalMaxCopies('Radiant Greninja'), 1, 'Radiant: eine Kopie');
        assert.equal(k.getLegalMaxCopies('Fighting Energy'), 59, 'Basis-Energie: unbegrenzt');
        assert.equal(k.getLegalMaxCopies('Iono'), 4, 'alles andere: vier');
    });
});

describe('ein leerer Eintrag im Deck bricht das Zaehlen nicht mehr ab', () => {
    it('deckCards.filter(card => isAceSpec(card)) laeuft ueber eine Luecke hinweg', () => {
        // Nachbau der Gefahrenstelle js/app-deck-builder.js:5344 mit der
        // echten Funktion. Vorher flog hier der TypeError und das
        // automatische Vervollstaendigen brach ab.
        const ist = bauKasten().isAceSpec;
        const deckCards = [
            { card_name: 'Iono' },
            null,
            { card_name: 'Prime Catcher' },
            undefined,
            { card_name: 'Master Ball' },
        ];
        let gefunden;
        assert.doesNotThrow(() => { gefunden = deckCards.filter(card => ist(card)); });
        assert.equal(gefunden.length, 2);
        assert.deepEqual(gefunden.map(c => c.card_name), ['Prime Catcher', 'Master Ball']);
    });
});
