/**
 * Der Deckbauer: Karten hineinlegen, Grenzen einhalten, auf 60 kommen.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross. Der Name behauptete Abdeckung
 * fuer den Kern des Deckbaus; `node --test` meldete darauf `# pass 1`,
 * und die Gesamtzahl der Suite war um genau diese Luecke zu hoch.
 * scripts/run-js-unit-tests.sh zaehlt leere Dateien seit dem 30.08.2026
 * nicht mehr mit und benennt sie namentlich — das hier ist die Antwort.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Alle vier geprueften Funktionen stehen unveraendert unter ihren alten
 * Namen in js/app-deck-builder.js (Stand 07.09.2026):
 *
 *   addCardToDeckBatch         js/app-deck-builder.js:578
 *   getDeckTotalCards          js/app-deck-builder.js:699
 *   isBasicEnergyName          js/app-deck-builder.js:703
 *   normalizeGeneratedDeckTo60 js/app-deck-builder.js:715
 *
 * ECHTE NACHBARN STATT ATTRAPPEN
 * ------------------------------
 * Die Grenzen des Deckbaus liegen NICHT im Deckbauer: getCanonicalDeckKey,
 * getTotalAceSpecCopiesInDeck, getTotalRadiantCopiesInDeck,
 * isRadiantPokemon und isBasicEnergy kommen aus js/app-utils.js, isAceSpec
 * aus js/app-core.js. Dieser Test schneidet sie ALLE aus ihren echten
 * Dateien und laesst sie zusammen laufen. Ein Test, der stattdessen
 * nachgebaute Grenzen prueft, prueft seine eigenen Nachbauten — genau der
 * Fehler, den die frueheren Fassungen dieser Datei hatten.
 *
 * Gesetzt wird nur, was echte Laufzeitdaten waeren: die Ace-Spec-Liste
 * (kommt sonst aus data/ace_specs.json) und der Kartenindex. Livedaten
 * liest diese Datei keine, jsdom braucht sie nicht.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');

/**
 * Eine Funktionsdeklaration per Namen aus `src` schneiden.
 * Die Parameterliste wird zuerst uebersprungen, damit ein Vorgabewert
 * wie `options = {}` die Klammerzaehlung nicht vorzeitig beendet.
 */
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

const BAUER = lies('app-deck-builder.js');
const UTILS = lies('app-utils.js');
const CORE  = lies('app-core.js');

const ALIASE = (() => {
    const m = /const LEGACY_CARD_NAME_ALIASES = Object\.freeze\(\{[\s\S]*?\}\);/m.exec(UTILS);
    assert.ok(m, 'LEGACY_CARD_NAME_ALIASES steht nicht mehr in js/app-utils.js');
    return m[0];
})();

const ACE_SPECS = ['prime catcher', 'master ball', "hero's cape", 'unfair stamp'];

/**
 * @param {object} opts
 *   index    – window.cardsBySetNumberMap fuer diesen Lauf
 *   aceSpecs – die Liste aus data/ace_specs.json (kleingeschrieben)
 */
function baue(opts = {}) {
    const index = opts.index || {};
    const window = {
        cityLeagueDeck: {},   cityLeagueDeckOrder: [],
        currentMetaDeck: {},  currentMetaDeckOrder: [],
        pastMetaDeck: {},     pastMetaDeckOrder: [],
        currentCityLeagueDeckCards: opts.cityLeagueKarten || [],
        currentCurrentMetaDeckCards: [],
        cardsBySetNumberMap: index,
        cardsByNameMap: {},
    };
    const protokoll = { warnungen: [], druckwunsch: [] };

    const kasten = {
        String, Number, Object, Array, Map, Set, Math, JSON,
        parseInt, parseFloat, isNaN, RegExp,
        console: { warn: (...a) => protokoll.warnungen.push(a.join(' ')), log() {}, error() {} },
        window,
        // aus js/app-core.js: die Liste, gegen die isAceSpec prueft
        aceSpecsList: (opts.aceSpecs || ACE_SPECS).map(s => s.toLowerCase()),
        // Nachbarn, die NICHT zum Pruefgegenstand gehoeren
        devLog: () => {},
        setRarityPreference: (name, pref) => protokoll.druckwunsch.push([name, pref]),
        getRarityPreference: () => null,
        getIndexedCardBySetNumber: (s, n) => index[`${s}-${n}`] || null,
        getCanonicalCardRecord: () => null,
        getCardByNameFromIndex: () => null,
        getPreferredVersionForCard: (name, set, num) =>
            (set && num) ? { set: String(set).toUpperCase(), number: String(num) } : null,
        parseLocaleNumber: (v, ersatz) => {
            const n = parseFloat(String(v).replace(',', '.'));
            return Number.isFinite(n) ? n : (ersatz || 0);
        },
        isBasicEnergyCardEntry: (card) => {
            const n = String((card && (card.card_name || card.name)) || '').toLowerCase().trim();
            return /^(fire|water|grass|lightning|psychic|fighting|darkness|metal)\s+energy\b/.test(n);
        },
        pastMetaFilteredCards: [],
        LEGACY_CARD_NAME_ALIASES: null,   // wird gleich ueberschrieben
    };
    vm.createContext(kasten);

    // Die echten Nachbarn aus app-utils.js und app-core.js …
    vm.runInContext([
        ALIASE,
        funktion(UTILS, 'fixMojibake', 'app-utils.js'),
        funktion(UTILS, 'hasMojibake', 'app-utils.js'),
        funktion(UTILS, 'getLegacyCardNameAlias', 'app-utils.js'),
        funktion(UTILS, 'normalizeCardName', 'app-utils.js'),
        funktion(UTILS, 'getDisplayCardName', 'app-utils.js'),
        funktion(UTILS, 'getCanonicalDeckKey', 'app-utils.js'),
        funktion(UTILS, 'isRadiantPokemon', 'app-utils.js'),
        funktion(UTILS, 'isBasicEnergy', 'app-utils.js'),
        funktion(UTILS, 'getTotalAceSpecCopiesInDeck', 'app-utils.js'),
        funktion(UTILS, 'getTotalRadiantCopiesInDeck', 'app-utils.js'),
        funktion(CORE,  'isAceSpec', 'app-core.js'),
        // … und der Pruefgegenstand selbst.
        funktion(BAUER, 'addCardToDeckBatch', 'app-deck-builder.js'),
        funktion(BAUER, 'getDeckRefBySource', 'app-deck-builder.js'),
        funktion(BAUER, 'getDeckTotalCards', 'app-deck-builder.js'),
        funktion(BAUER, 'isBasicEnergyName', 'app-deck-builder.js'),
        funktion(BAUER, 'normalizeGeneratedDeckTo60', 'app-deck-builder.js'),
    ].join('\n\n'), kasten);

    kasten._w = window;
    kasten._protokoll = protokoll;
    return kasten;
}

// Wie oft passt `name` (ueber alle Drucke) ins Deck?
const summe = (deck) => Object.values(deck).reduce((a, b) => a + b, 0);

// ══════════════════════════════════════════════════════════════════
// getDeckTotalCards / isBasicEnergyName
// ══════════════════════════════════════════════════════════════════
describe('getDeckTotalCards — die Zahl unter dem Deck', () => {
    const F = baue();

    it('summiert alle Anzahlen', () => {
        assert.equal(F.getDeckTotalCards({ 'Iono (PAL 185)': 4, 'Ultra Ball (SVI 196)': 4 }), 8);
    });

    it('leeres Deck, null und undefined ergeben 0', () => {
        assert.equal(F.getDeckTotalCards({}), 0);
        assert.equal(F.getDeckTotalCards(null), 0);
        assert.equal(F.getDeckTotalCards(undefined), 0);
    });

    it('unlesbare Anzahlen zaehlen als 0 statt die Summe auf NaN zu reissen', () => {
        const t = F.getDeckTotalCards({ 'Iono': 'vier', 'Ultra Ball': 2 });
        assert.equal(t, 2);
        assert.equal(Number.isNaN(t), false);
    });

    it('Zahlentext wird gelesen', () => {
        assert.equal(F.getDeckTotalCards({ 'Iono': '4' }), 4);
    });
});

describe('isBasicEnergyName — die acht Basis-Energien', () => {
    const F = baue();

    it('kennt alle acht', () => {
        ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal']
            .forEach(art => assert.equal(F.isBasicEnergyName(`${art} Energy`), true, art));
    });

    it('die Schreibweise und Randleerzeichen sind egal', () => {
        assert.equal(F.isBasicEnergyName('  fire energy  '), true);
        assert.equal(F.isBasicEnergyName('FIRE ENERGY'), true);
    });

    it('Spezialenergien sind KEINE Basis-Energie', () => {
        assert.equal(F.isBasicEnergyName('Double Turbo Energy'), false);
        assert.equal(F.isBasicEnergyName('Neo Upper Energy'), false);
        assert.equal(F.isBasicEnergyName('Legacy Energy'), false);
    });

    it('ein Druckzusatz zaehlt hier nicht mehr als Basis-Energie', () => {
        // Dokumentierte Grenze: diese Fassung vergleicht exakt, anders als
        // isBasicEnergy() in js/app-utils.js, die Zusaetze zulaesst.
        assert.equal(F.isBasicEnergyName('Fire Energy SVE 10'), false);
        assert.equal(F.isBasicEnergy('Fire Energy SVE 10'), true);
    });

    it('leere Eingabe, null und undefined sind falsch', () => {
        assert.equal(F.isBasicEnergyName(''), false);
        assert.equal(F.isBasicEnergyName(null), false);
        assert.equal(F.isBasicEnergyName(undefined), false);
    });
});

// ══════════════════════════════════════════════════════════════════
// addCardToDeckBatch
// ══════════════════════════════════════════════════════════════════
describe('addCardToDeckBatch — Karten in eines der drei Decks legen', () => {
    it('legt eine Karte an und zaehlt beim zweiten Mal hoch', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), true);
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 1);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), true);
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
    });

    it('eine unbekannte Quelle wird abgelehnt und veraendert nichts', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('quatsch', 'Iono', 'PAL', '185'), false);
        assert.equal(summe(F._w.cityLeagueDeck), 0);
        assert.equal(summe(F._w.currentMetaDeck), 0);
        assert.equal(summe(F._w.pastMetaDeck), 0);
    });

    it('die drei Quellen haben getrennte Decks', () => {
        const F = baue();
        F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185');
        F.addCardToDeckBatch('currentMeta', 'Iono', 'PAL', '185');
        F.addCardToDeckBatch('pastMeta', 'Iono', 'PAL', '185');
        assert.equal(summe(F._w.cityLeagueDeck), 1);
        assert.equal(summe(F._w.currentMetaDeck), 1);
        assert.equal(summe(F._w.pastMetaDeck), 1);
    });

    it('die Einlegereihenfolge wird gefuehrt, ohne Doppeleintraege', () => {
        const F = baue();
        F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185');
        F.addCardToDeckBatch('cityLeague', 'Ultra Ball', 'SVI', '196');
        F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185');
        assert.deepEqual(Array.from(F._w.cityLeagueDeckOrder),
            ['Iono (PAL 185)', 'Ultra Ball (SVI 196)']);
    });

    it('die fuenfte Kopie einer gewoehnlichen Karte wird abgelehnt', () => {
        const F = baue();
        for (let i = 0; i < 4; i++) {
            assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), true, `Kopie ${i + 1}`);
        }
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), false);
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 4);
    });

    it('Basis-Energie darf ueber vier hinaus', () => {
        const F = baue();
        for (let i = 0; i < 8; i++) {
            assert.equal(F.addCardToDeckBatch('cityLeague', 'Fire Energy', 'SVE', '10'), true);
        }
        assert.equal(F._w.cityLeagueDeck['Fire Energy (SVE 10)'], 8);
    });

    it('von einem Ace Spec passt genau eines ins Deck', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Prime Catcher', 'TEF', '157'), true);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Prime Catcher', 'TEF', '157'), false);
        assert.equal(F._w.cityLeagueDeck['Prime Catcher (TEF 157)'], 1);
    });

    it('und ein ZWEITES, anderes Ace Spec ebenfalls nicht — die Grenze gilt deckweit', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Prime Catcher', 'TEF', '157'), true);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Master Ball', 'TWM', '145'), false);
        assert.equal(summe(F._w.cityLeagueDeck), 1);
    });

    it('dasselbe gilt fuer Radiant-Pokemon', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Radiant Greninja', 'ASR', '46'), true);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Radiant Greninja', 'ASR', '46'), false);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Radiant Charizard', 'CRZ', '20'), false);
        assert.equal(summe(F._w.cityLeagueDeck), 1);
    });

    it('bei 70 Karten ist Schluss, egal welche Karte kommt', () => {
        const F = baue();
        // 70 Karten aus lauter Basis-Energie — die hat keine Vierergrenze.
        for (let i = 0; i < 70; i++) F.addCardToDeckBatch('cityLeague', 'Fire Energy', 'SVE', '10');
        assert.equal(summe(F._w.cityLeagueDeck), 70);
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), false);
        assert.equal(summe(F._w.cityLeagueDeck), 70);
    });

    it('ein alter Schluessel OHNE Druckangabe wird auf den neuen umgezogen', () => {
        const F = baue();
        F._w.cityLeagueDeck['Iono'] = 2;
        F._w.cityLeagueDeckOrder.push('Iono');
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185'), true);
        assert.equal('Iono' in F._w.cityLeagueDeck, false, 'der alte Schluessel ist weg');
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 3, 'die zwei Kopien sind mitgezogen');
        assert.deepEqual(Array.from(F._w.cityLeagueDeckOrder), ['Iono (PAL 185)'],
            'die Reihenfolge zeigt auf den neuen Schluessel');
    });

    it('der Umzug greift auch von einem ANDEREN Druck aus', () => {
        const F = baue();
        F._w.cityLeagueDeck['Iono (PAF 237)'] = 1;
        F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185');
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
        assert.equal(Object.keys(F._w.cityLeagueDeck).length, 1);
    });

    it('ohne Set und Nummer wird der blosse Name zum Schluessel — und kein Druckwunsch gemerkt', () => {
        const F = baue();
        assert.equal(F.addCardToDeckBatch('cityLeague', 'Iono', '', ''), true);
        assert.equal(F._w.cityLeagueDeck['Iono'], 1);
        assert.equal(F._protokoll.druckwunsch.length, 0);
    });

    it('mit Set und Nummer wird der Druckwunsch gemerkt', () => {
        const F = baue();
        F.addCardToDeckBatch('cityLeague', 'Iono', 'PAL', '185');
        // Das Wunschobjekt stammt aus dem vm-Realm; deepEqual vergleicht
        // auch den Prototyp. Also Feld fuer Feld.
        const [name, wunsch] = F._protokoll.druckwunsch[0];
        assert.equal(name, 'Iono');
        assert.equal(wunsch.mode, 'specific');
        assert.equal(wunsch.set, 'PAL');
        assert.equal(wunsch.number, '185');
    });

    it('die Energiegrenze folgt dem KARTENSATZ, nicht dem Namen allein', () => {
        // Der Kartenindex sagt, dass "Mystery Energy" eine Basis-Energie
        // ist; ohne diesen Nachschlag wuerde bei vier Kopien Schluss sein.
        const F = baue({ index: { 'SVE-99': { card_name: 'Fire Energy', name: 'Fire Energy' } } });
        for (let i = 0; i < 6; i++) {
            assert.equal(F.addCardToDeckBatch('cityLeague', 'Mystery Energy', 'SVE', '99'), true);
        }
        assert.equal(F._w.cityLeagueDeck['Mystery Energy (SVE 99)'], 6);
    });
});

// ══════════════════════════════════════════════════════════════════
// normalizeGeneratedDeckTo60
// ══════════════════════════════════════════════════════════════════
describe('normalizeGeneratedDeckTo60 — auf genau 60 auffuellen', () => {
    // Zwoelf gewoehnliche Karten -> 48 Kopien; die Basis-Energie muss
    // die restlichen zwoelf tragen.
    const geplant = () => {
        const karten = [];
        for (let i = 0; i < 12; i++) {
            karten.push({ card_name: `Karte ${i}`, set_code: 'AAA', set_number: String(i), sharePercent: 90 - i });
        }
        karten.push({ card_name: 'Fire Energy', set_code: 'SVE', set_number: '10', sharePercent: 1 });
        return karten;
    };

    it('fuellt ein leeres Deck auf genau 60 auf', () => {
        const F = baue();
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', geplant(), []), 60);
        assert.equal(summe(F._w.cityLeagueDeck), 60);
    });

    it('eine unbekannte Quelle ergibt 0 und ruehrt kein Deck an', () => {
        const F = baue();
        assert.equal(F.normalizeGeneratedDeckTo60('quatsch', geplant(), []), 0);
        assert.equal(summe(F._w.cityLeagueDeck), 0);
    });

    it('ein Deck mit 60 oder mehr Karten wird nicht mehr angefasst', () => {
        const F = baue();
        F._w.cityLeagueDeck['Fire Energy (SVE 10)'] = 61;
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', geplant(), []), 61);
        assert.equal(F._w.cityLeagueDeck['Fire Energy (SVE 10)'], 61);
    });

    it('haeufigere Karten kommen zuerst — die Reihenfolge folgt dem Anteil', () => {
        const F = baue();
        F.normalizeGeneratedDeckTo60('cityLeague', geplant(), []);
        const reihenfolge = Array.from(F._w.cityLeagueDeckOrder);
        assert.equal(reihenfolge[0], 'Karte 0 (AAA 0)', 'die Karte mit 90 % zuerst');
        assert.equal(reihenfolge[1], 'Karte 1 (AAA 1)');
        assert.equal(reihenfolge[reihenfolge.length - 1], 'Fire Energy (SVE 10)',
            'die Energie mit 1 % zuletzt');
    });

    it('die Ersatzliste kommt zum Zuge, wenn die geplante nicht reicht', () => {
        const F = baue();
        const wenig = [{ card_name: 'Karte A', set_code: 'AAA', set_number: '1', sharePercent: 50 }];
        const ersatz = [{ card_name: 'Fire Energy', set_code: 'SVE', set_number: '10', sharePercent: 1 }];
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', wenig, ersatz), 60);
        assert.equal(F._w.cityLeagueDeck['Karte A (AAA 1)'], 4);
        assert.equal(F._w.cityLeagueDeck['Fire Energy (SVE 10)'], 56);
    });

    it('doppelte Namen in der Liste werden zu EINEM Kandidaten', () => {
        const F = baue();
        const doppelt = [
            { card_name: 'Karte A', set_code: 'AAA', set_number: '1', sharePercent: 50 },
            { card_name: 'karte a', set_code: 'BBB', set_number: '2', sharePercent: 40 },
            { card_name: 'Fire Energy', set_code: 'SVE', set_number: '10', sharePercent: 1 },
        ];
        F.normalizeGeneratedDeckTo60('cityLeague', doppelt, []);
        assert.equal('Karte A (BBB 2)' in F._w.cityLeagueDeck, false,
            'der zweite Eintrag desselben Namens wird verworfen');
        assert.equal(F._w.cityLeagueDeck['Karte A (AAA 1)'], 4);
    });

    it('ohne auffuellbare Karten bricht es ab, meldet es und laeuft nicht endlos', () => {
        const F = baue();
        // Vier Kopien einer einzigen Karte, keine Energie als Ausweg.
        const knapp = [{ card_name: 'Karte A', set_code: 'AAA', set_number: '1', sharePercent: 50 }];
        const gesamt = F.normalizeGeneratedDeckTo60('cityLeague', knapp, []);
        assert.equal(gesamt, 4);
        assert.equal(F._protokoll.warnungen.length, 1);
        assert.ok(F._protokoll.warnungen[0].includes('Could not normalize deck to 60'),
            'die Meldung sagt, dass es nicht gereicht hat: ' + F._protokoll.warnungen[0]);
    });

    it('leere Listen, null und undefined werfen nicht', () => {
        const F = baue();
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', [], []), 0);
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', null, null), 0);
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', undefined, undefined), 0);
    });

    it('Eintraege ohne card_name werden uebersprungen', () => {
        const F = baue();
        const schmutz = [
            null, { }, { card_name: '   ' },
            { card_name: 'Fire Energy', set_code: 'SVE', set_number: '10', sharePercent: 1 },
        ];
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', schmutz, []), 60);
        assert.equal(Object.keys(F._w.cityLeagueDeck).length, 1);
    });

    it('das Ace Spec des Bauplans landet genau einmal im Deck', () => {
        const F = baue();
        const plan = [
            { card_name: 'Prime Catcher', set_code: 'TEF', set_number: '157', sharePercent: 99 },
            { card_name: 'Fire Energy', set_code: 'SVE', set_number: '10', sharePercent: 1 },
        ];
        assert.equal(F.normalizeGeneratedDeckTo60('cityLeague', plan, []), 60);
        assert.equal(F._w.cityLeagueDeck['Prime Catcher (TEF 157)'], 1);
        assert.equal(F._w.cityLeagueDeck['Fire Energy (SVE 10)'], 59);
    });
});
