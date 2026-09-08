/**
 * Datenintegritaet: die Namenskette aus js/app-utils.js.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross. Der Name behauptete Abdeckung fuer die Kette,
 * die entscheidet, ob zwei Zeilen DIESELBE Karte meinen.
 *
 * WAS HIER GEPRUEFT WIRD (alles AUSGEFUEHRT, nicht gegriffen)
 * -----------------------------------------------------------
 *   js/app-utils.js:308  fixMojibake          — kaputte Zeichenfolgen heilen
 *   js/app-utils.js:534  normalizeCardName    — Vergleichsschluessel
 *   js/app-utils.js:730  getStrictBaseCardName— Anzeigename ohne Druckzusatz
 *   js/app-utils.js:562  isBasicEnergy        — Grundenergie oder nicht
 *   js/app-utils.js:440  getCanonicalDeckKey  — der Schluessel im Deck
 *   js/app-utils.js:453  normalizeDeckEntries — doppelte Schluessel zusammenlegen
 *
 * WARUM DAS ZUSAMMENGEHOERT
 * -------------------------
 * Dieselbe Karte kommt aus vier Quellen in vier Schreibweisen: mit und
 * ohne Druckzusatz, mit geradem und typografischem Apostroph, mit
 * heiler und mit zerschossener UTF-8-Kodierung. Laufen zwei Fassungen
 * auseinander, steht dieselbe Karte zweimal im Deck — und der
 * Vierfach-Grenzwert greift an keiner der beiden Zeilen.
 *
 * ZWEI DINGE SIND GESETZT, weil sie Eingaben sind und nicht Gegenstand
 * der Pruefung: getCanonicalCardRecord (Nachschlagen ueber Set+Nummer)
 * und getCardByNameFromIndex (Nachschlagen ueber den Namen). Beide
 * lesen in der Auslieferung die Kartendatenbank; hier liefert sie ein
 * gesetzter Bestand von drei Karten.
 *
 * KEINE LIVEDATEN, KEIN jsdom.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const UTILS = fs.readFileSync(path.join(WURZEL, 'js', 'app-utils.js'), 'utf8');

function funktion(name, quelle = UTILS) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(quelle);
    if (!m) throw new Error('Funktion nicht gefunden: ' + name);
    const start = quelle.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = quelle.indexOf('{', start); i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}') {
            tiefe--;
            if (tiefe === 0) return quelle.slice(start, i + 1);
        }
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

const ALIAS = UTILS.match(/const LEGACY_CARD_NAME_ALIASES = (Object\.freeze\(\{[\s\S]*?\}\));/);
if (!ALIAS) throw new Error('LEGACY_CARD_NAME_ALIASES nicht gefunden');

const NAMEN = [
    'fixMojibake', 'hasMojibake', 'getLegacyCardNameAlias', 'normalizeCardName',
    'getSafeCardIdentityName', 'getStrictBaseCardName', 'isBasicEnergy',
    'getDisplayCardName', 'getCanonicalDeckKey', 'normalizeDeckEntries',
];

const QUELLTEXT = [
    'const LEGACY_CARD_NAME_ALIASES = ' + ALIAS[1] + ';',
    ...NAMEN.map(n => funktion(n)),
    'function devLog() {}',
].join('\n\n');

// Der gesetzte Kartenbestand. In der Auslieferung kommt er aus
// data/all_cards_database.json.
const NACH_DRUCK = {
    'SVI-196': { name_en: 'Ultra Ball', set: 'SVI', number: '196' },
    'SVE-18': { name_en: 'Fire Energy', set: 'SVE', number: '18' },
    'PAL-172': { name_en: 'Boss’s Orders', set: 'PAL', number: '172' },
};
const NACH_NAME = {
    'ultra ball': { name_en: 'Ultra Ball' },
    'nest ball': { name_en: 'Nest Ball' },
    'fire energy': { name_en: 'Fire Energy' },
};

/** Eine frische Kette mit eigenem window-Ersatz. */
function baueKette(fenster = {}) {
    // eslint-disable-next-line no-new-func
    return new Function('window', 'getCanonicalCardRecord', 'getCardByNameFromIndex',
        QUELLTEXT + '\nreturn { ' + NAMEN.join(', ') + ' };')(
        fenster,
        (set, nummer) => NACH_DRUCK[`${set}-${nummer}`] || null,
        (name) => {
            const k = String(name || '').toLowerCase()
                .replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
            return NACH_NAME[k] || null;
        }
    );
}

const F = baueKette();

describe('fixMojibake — zerschossene UTF-8-Bytes heilen', () => {
    it('repariert die haeufigen Folgen', () => {
        assert.equal(F.fixMojibake('PokÃ©mon'), 'Pokémon');
        assert.equal(F.fixMojibake('Ã¼ber'), 'über');
        assert.equal(F.fixMojibake('Câ€™s Orders'), 'C’s Orders');
        assert.equal(F.fixMojibake('Bossâ€™s Orders'), 'Boss’s Orders');
    });

    it('laesst heilen Text unangetastet — auch fernab von Latein', () => {
        assert.equal(F.fixMojibake('Pokémon Center'), 'Pokémon Center');
        assert.equal(F.fixMojibake('日本のカード'), '日本のカード');
        assert.equal(F.fixMojibake('N’s Zoroark ex'), 'N’s Zoroark ex');
        assert.equal(F.fixMojibake('Ultra Ball'), 'Ultra Ball');
    });

    it('leere und fehlende Eingaben ergeben IMMER die leere Zeichenkette', () => {
        // Anders als fixCardNameEncoding in app-core.js, das null
        // durchreicht. Der Unterschied ist gemessen, nicht vermutet.
        for (const leer of [null, undefined, '', '   ', '\t\n']) {
            assert.equal(F.fixMojibake(leer), '', JSON.stringify(leer));
        }
    });

    it('eine Zahl oder ein Wahrheitswert wird zur Zeichenkette, nicht zu ""', () => {
        // GEMESSEN: nur null und undefined werden abgefangen, alles
        // andere laeuft durch String(). Wer 0 hineingibt, bekommt "0".
        assert.equal(F.fixMojibake(0), '0');
        assert.equal(F.fixMojibake(false), 'false');
        assert.equal(F.fixMojibake(NaN), 'NaN');
    });

    it('Randleerzeichen werden abgeschnitten', () => {
        assert.equal(F.fixMojibake('  Ultra Ball  '), 'Ultra Ball');
    });

    it('die schnelle Ausfahrt greift nur ohne verdaechtige Zeichen', () => {
        // Nur bei Ã, Â oder â wird ueberhaupt umgewandelt. Ein Name mit
        // Â bleibt sonst mit dem Fuellzeichen stehen.
        assert.equal(F.hasMojibake('Pokémon'), false);
        assert.equal(F.hasMojibake('PokÃ©mon'), true);
        // 'Â' + U+00A0 sind die Bytes C2 A0 — die Umwandlung stellt
        // daraus EIN geschuetztes Leerzeichen her, sie loescht es nicht.
        assert.equal(F.fixMojibake('A\u00C2\u00A0B'), 'A\u00A0B');
        assert.notEqual(F.fixMojibake('A\u00C2\u00A0B'), 'AB');
    });
});

describe('normalizeCardName — der Vergleichsschluessel', () => {
    it('Klammerzusaetze und eckige Klammern fallen weg', () => {
        assert.equal(F.normalizeCardName('Ultra Ball (SVI 196)'), 'ultra ball');
        assert.equal(F.normalizeCardName('Iono [PAL]'), 'iono');
        assert.equal(F.normalizeCardName('Durant ex (Ghetsis)'), 'durant ex');
    });

    it('typografische Apostrophe werden zu geraden', () => {
        assert.equal(F.normalizeCardName('N’s Zoroark ex'), "n's zoroark ex");
        assert.equal(F.normalizeCardName('N‘s Zoroark ex'), "n's zoroark ex");
        assert.equal(F.normalizeCardName('N`s Zoroark ex'), "n's zoroark ex");
        assert.equal(F.normalizeCardName('N’s Zoroark ex'), F.normalizeCardName("N's Zoroark ex"));
    });

    it('Mehrfachleerzeichen werden zusammengezogen und alles klein geschrieben', () => {
        assert.equal(F.normalizeCardName('  Ultra   BALL  '), 'ultra ball');
    });

    it('kaputte Kodierung wird VOR dem Vergleich geheilt', () => {
        assert.equal(F.normalizeCardName('PokÃ©mon Center'), 'pokémon center');
        assert.equal(F.normalizeCardName('PokÃ©mon Center'), F.normalizeCardName('Pokémon Center'));
    });

    it('der hinterlegte Altname wird ersetzt', () => {
        // LEGACY_CARD_NAME_ALIASES: die Karte hiess frueher anders.
        assert.equal(F.normalizeCardName('Rock Fighting Energy'), 'rocky fighting energy');
        assert.equal(F.normalizeCardName('Rock Fighting Energy (SVI 1)'), 'rocky fighting energy');
    });

    it('leere Eingaben ergeben leeren Text', () => {
        for (const leer of [null, undefined, '', 0, false]) {
            assert.equal(F.normalizeCardName(leer), '', JSON.stringify(leer));
        }
    });
});

describe('getStrictBaseCardName — der Anzeigename ohne Druckzusatz', () => {
    it('schneidet den Druckzusatz in beiden Schreibweisen ab', () => {
        assert.equal(F.getStrictBaseCardName('Lucario ex (PAL 123)'), 'Lucario ex');
        assert.equal(F.getStrictBaseCardName('N’s Zoroark ex SVI 96'), "N's Zoroark ex");
        assert.equal(F.getStrictBaseCardName('Fire Energy SVE 18'), 'Fire Energy');
    });

    it('behaelt die Grossschreibung — anders als normalizeCardName', () => {
        assert.equal(F.getStrictBaseCardName('Ultra Ball'), 'Ultra Ball');
        assert.notEqual(F.getStrictBaseCardName('Ultra Ball'), F.normalizeCardName('Ultra Ball'));
    });

    it('vereinheitlicht Apostrophe auf das gerade Zeichen', () => {
        assert.equal(F.getStrictBaseCardName('Boss’s Orders (PAL 172)'), "Boss's Orders");
        assert.equal(F.getStrictBaseCardName('Boss‘s Orders'), "Boss's Orders");
    });

    it('behaelt die Spielendungen ex, V, GX und VMAX', () => {
        // Sie unterscheiden verschiedene Karten und duerfen nie fallen.
        assert.equal(F.getStrictBaseCardName('Lucario ex'), 'Lucario ex');
        assert.equal(F.getStrictBaseCardName('Charizard VMAX'), 'Charizard VMAX');
        assert.equal(F.getStrictBaseCardName('Zoroark GX'), 'Zoroark GX');
    });

    it('leere Eingaben ergeben leeren Text', () => {
        for (const leer of [null, undefined, '', '   ']) {
            assert.equal(F.getStrictBaseCardName(leer), '', JSON.stringify(leer));
        }
    });
});

describe('isBasicEnergy — Grundenergie oder Spezialenergie', () => {
    it('erkennt alle elf Grundenergienamen', () => {
        const namen = ['Fire Energy', 'Water Energy', 'Grass Energy', 'Lightning Energy',
            'Psychic Energy', 'Fighting Energy', 'Darkness Energy', 'Metal Energy',
            'Fairy Energy', 'Dragon Energy', 'Colorless Energy'];
        for (const n of namen) {
            assert.equal(F.isBasicEnergy(n), true, n);
        }
    });

    it('Schreibung, Druckzusatz und Klammerform aendern nichts', () => {
        assert.equal(F.isBasicEnergy('fire energy'), true);
        assert.equal(F.isBasicEnergy('FIRE ENERGY'), true);
        assert.equal(F.isBasicEnergy('Fighting Energy SVE 22'), true);
        assert.equal(F.isBasicEnergy('Grass Energy (SVE 17)'), true);
        assert.equal(F.isBasicEnergy('Basic {G} Energy'), true);
        assert.equal(F.isBasicEnergy('Basic Energy'), true);
    });

    it('Spezialenergien sind KEINE Grundenergien', () => {
        // Der Unterschied entscheidet ueber 59 gegen 4 erlaubte Kopien.
        for (const n of ['Jet Energy', 'Double Turbo Energy', 'Luminous Energy',
            'Reversal Energy', 'Neo Upper Energy']) {
            assert.equal(F.isBasicEnergy(n), false, n);
        }
    });

    it('Nicht-Energien und leere Eingaben ergeben false', () => {
        for (const n of ['Ultra Ball', 'Pikachu', '', null, undefined, 0]) {
            assert.equal(F.isBasicEnergy(n), false, JSON.stringify(n));
        }
    });
});

describe('getCanonicalDeckKey — der eine Schluessel je Karte', () => {
    it('setzt Name, Set und Nummer zu einem Schluessel zusammen', () => {
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', 'svi', '196'), 'Ultra Ball (SVI 196)');
    });

    it('ohne Set oder Nummer bleibt der blosse Name stehen', () => {
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', '', ''), 'Ultra Ball');
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', 'SVI', ''), 'Ultra Ball');
    });

    it('ein Name mit kaputter Kodierung bekommt den Namen aus der Datenbank', () => {
        assert.equal(F.getCanonicalDeckKey('Ultra BÃ¤ll', 'svi', '196'), 'Ultra Ball (SVI 196)');
    });

    it('unterschiedliche Schreibweisen desselben Drucks fallen zusammen', () => {
        const a = F.getCanonicalDeckKey('ultra ball', 'SVI', '196');
        const b = F.getCanonicalDeckKey('Ultra BÃ¤ll', 'SVI', '196');
        assert.equal(a, b);
        assert.equal(a, 'Ultra Ball (SVI 196)');
    });
});

describe('normalizeDeckEntries — doppelte Schluessel zusammenlegen', () => {
    it('eine unbekannte Quelle wird abgelehnt', () => {
        assert.equal(baueKette({}).normalizeDeckEntries('gibtEsNicht'), false);
        assert.equal(baueKette({}).normalizeDeckEntries(''), false);
        assert.equal(baueKette({}).normalizeDeckEntries(undefined), false);
    });

    it('drei Schreibweisen desselben Drucks werden zu EINEM Eintrag addiert', () => {
        const fenster = {
            currentMetaDeck: {
                'Ultra Ball (SVI 196)': 2,
                'ultra ball (SVI 196)': 1,
                'Ultra BÃ¤ll (SVI 196)': 1,
            },
            currentMetaDeckOrder: ['ultra ball (SVI 196)', 'Ultra Ball (SVI 196)'],
        };
        const geaendert = baueKette(fenster).normalizeDeckEntries('currentMeta');
        assert.equal(geaendert, true);
        assert.deepEqual(fenster.currentMetaDeck, { 'Ultra Ball (SVI 196)': 4 },
            'die Anzahlen werden addiert, nicht ueberschrieben');
        assert.deepEqual(fenster.currentMetaDeckOrder, ['Ultra Ball (SVI 196)'],
            'die Reihenfolge behaelt genau einen Eintrag');
    });

    it('Eintraege mit Anzahl 0 oder unlesbarer Anzahl fallen heraus', () => {
        const fenster = {
            cityLeagueDeck: { 'Nest Ball': 2, Weg: 0, Auchweg: 'keine Zahl', Negativ: -3 },
            cityLeagueDeckOrder: ['Nest Ball', 'Weg'],
        };
        assert.equal(baueKette(fenster).normalizeDeckEntries('cityLeague'), true);
        assert.deepEqual(fenster.cityLeagueDeck, { 'Nest Ball': 2 });
        assert.deepEqual(fenster.cityLeagueDeckOrder, ['Nest Ball']);
    });

    it('ein bereits sauberes Deck wird nicht angefasst', () => {
        const fenster = { pastMetaDeck: { 'Nest Ball': 1 }, pastMetaDeckOrder: ['Nest Ball'] };
        assert.equal(baueKette(fenster).normalizeDeckEntries('pastMeta'), false,
            'ohne Aenderung darf die Funktion nicht true melden');
        assert.deepEqual(fenster.pastMetaDeck, { 'Nest Ball': 1 });
    });

    it('ein leeres oder fehlendes Deck ergibt false statt eines Wurfs', () => {
        assert.equal(baueKette({}).normalizeDeckEntries('currentMeta'), false);
        assert.equal(baueKette({ cityLeagueDeck: {} }).normalizeDeckEntries('cityLeague'), false);
    });

    it('alle drei Quellen werden bedient und schreiben in ihr eigenes Fach', () => {
        for (const [quelle, deckFach, ordnungFach] of [
            ['cityLeague', 'cityLeagueDeck', 'cityLeagueDeckOrder'],
            ['currentMeta', 'currentMetaDeck', 'currentMetaDeckOrder'],
            ['pastMeta', 'pastMetaDeck', 'pastMetaDeckOrder'],
        ]) {
            const fenster = { [deckFach]: { 'Nest Ball': 1, Weg: 0 }, [ordnungFach]: ['Weg', 'Nest Ball'] };
            assert.equal(baueKette(fenster).normalizeDeckEntries(quelle), true, quelle);
            assert.deepEqual(fenster[deckFach], { 'Nest Ball': 1 }, quelle);
            assert.deepEqual(fenster[ordnungFach], ['Nest Ball'], quelle);
        }
    });

    it('die bestehende Reihenfolge wird bewahrt, neue Karten kommen hinten an', () => {
        const fenster = {
            currentMetaDeck: { 'Nest Ball': 1, 'Ultra B\u00C3\u00A4ll (SVI 196)': 2, 'Fire Energy (SVE 18)': 4 },
            currentMetaDeckOrder: ['Ultra B\u00C3\u00A4ll (SVI 196)', 'Nest Ball'],
        };
        assert.equal(baueKette(fenster).normalizeDeckEntries('currentMeta'), true);
        assert.deepEqual(fenster.currentMetaDeckOrder,
            ['Ultra Ball (SVI 196)', 'Nest Ball', 'Fire Energy (SVE 18)'],
            'die beiden bekannten behalten ihre Stellung, die dritte kommt ans Ende');
    });
});
