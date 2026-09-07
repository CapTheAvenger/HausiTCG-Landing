/**
 * getRarityPriority() aus js/app-utils.js (Zeile 1142).
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross und wurde als bestandener Test mitgezaehlt.
 *
 * WAS DIE FUNKTION TUT UND WARUM SIE HEIKEL IST
 * ---------------------------------------------
 * Sie ordnet einer Seltenheitsbezeichnung eine Zahl zu. Aus dieser Zahl
 * waehlt getPreferredVersionForCard() den Druck, den der Nutzer sieht
 * und als Proxy druckt: bei "min" den kleinsten, bei "max" den
 * groessten. Die Reihenfolge der Vergleiche IST die Fachlogik — jede
 * Bezeichnung wird mit includes() geprueft, und weil "Ultra Rare" das
 * Wort "rare" enthaelt, wuerde ein zu frueh stehender Rare-Zweig sie
 * verschlucken. Der Quelltext sagt das an zwei Stellen ausdruecklich
 * ("check BEFORE plain rare"); geprueft wurde es bisher nirgends.
 *
 * KEINE LIVEDATEN, KEIN jsdom: alle Eingaben setzt der Test.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const UTILS = fs.readFileSync(path.join(WURZEL, 'js', 'app-utils.js'), 'utf8');

function funktion(name, quelle) {
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

// eslint-disable-next-line no-new-func
const getRarityPriority = new Function(
    funktion('getRarityPriority', UTILS) + '\nreturn getRarityPriority;'
)();

describe('getRarityPriority — die Rangfolge der Stufen', () => {
    it('haelt die Kette Common < Uncommon < Rare < Holo < Double < Triple', () => {
        const kette = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Double Rare', 'Triple Rare'];
        const werte = kette.map(r => getRarityPriority(r));
        assert.deepEqual(werte, [1, 2, 3, 5, 6, 7]);
        for (let i = 1; i < werte.length; i++) {
            assert.ok(werte[i] > werte[i - 1],
                `${kette[i]} (${werte[i]}) muss ueber ${kette[i - 1]} (${werte[i - 1]}) liegen`);
        }
    });

    it('haelt die Kette der Spitzenseltenheiten bis Secret Rare', () => {
        const kette = ['Radiant Rare', 'Amazing Rare', 'Illustration Rare',
            'Character Super Rare', 'Shiny Rare', 'Ultra Rare',
            'Special Illustration Rare', 'Rainbow Rare', 'Secret Rare'];
        const werte = kette.map(r => getRarityPriority(r));
        assert.deepEqual(werte, [8, 9, 10, 11, 12, 13, 14, 15, 16]);
        for (let i = 1; i < werte.length; i++) {
            assert.ok(werte[i] > werte[i - 1],
                `${kette[i]} (${werte[i]}) muss ueber ${kette[i - 1]} (${werte[i - 1]}) liegen`);
        }
    });

    it('"Ultra Rare" faellt NICHT in den einfachen Rare-Zweig', () => {
        // Der Kern der Reihenfolge. Steht der Rare-Zweig zu weit vorn,
        // sind Ultra Rare, Secret Rare, Rainbow Rare, Special
        // Illustration Rare und Shiny Rare allesamt 3 — und "max"
        // waehlt dann irgendeine Karte statt der teuersten.
        for (const [bez, soll] of [
            ['Ultra Rare', 13], ['Secret Rare', 16], ['Rainbow Rare', 15],
            ['Special Illustration Rare', 14], ['Shiny Rare', 12],
            ['Amazing Rare', 9], ['Double Rare', 6], ['Holo Rare', 5],
        ]) {
            assert.equal(getRarityPriority(bez), soll,
                `${bez} muss ${soll} ergeben, nicht den Sammelwert 3`);
            assert.notEqual(getRarityPriority(bez), 3);
        }
    });

    it('"Uncommon" wird nicht als "Common" gelesen', () => {
        // Dieselbe Falle eine Etage tiefer: 'uncommon'.includes('common')
        // ist wahr. Nur die Reihenfolge trennt die beiden.
        assert.equal(getRarityPriority('Uncommon'), 2);
        assert.equal(getRarityPriority('Common'), 1);
        assert.notEqual(getRarityPriority('Uncommon'), getRarityPriority('Common'));
    });

    it('Gross- und Kleinschreibung sowie Randleerzeichen sind egal', () => {
        assert.equal(getRarityPriority('ULTRA RARE'), 13);
        assert.equal(getRarityPriority('ultra rare'), 13);
        assert.equal(getRarityPriority('Ultra RARE'), 13);
        assert.equal(getRarityPriority('  Common  '), 1);
    });
});

describe('getRarityPriority — fehlende Seltenheit', () => {
    it('ohne Seltenheit und ohne Promo-Set kommt 999 heraus', () => {
        // 999 heisst "in min-Modus meiden": getPreferredVersionForCard
        // filtert genau diese Eintraege vor der Auswahl heraus.
        for (const leer of [null, undefined, '', 0, false, NaN]) {
            assert.equal(getRarityPriority(leer), 999,
                `${JSON.stringify(leer)} ohne Set haette 999 ergeben muessen`);
            assert.equal(getRarityPriority(leer, 'SVI'), 999,
                'SVI ist kein Promo-Set');
        }
    });

    it('ohne Seltenheit, aber aus einem Promo-Set: 8', () => {
        // Alle zehn Promo-Kuerzel aus der Liste im Quelltext.
        for (const set of ['MEP', 'SVP', 'SP', 'SMP', 'XYP', 'BWP', 'HSP', 'DPP', 'NP', 'WP']) {
            assert.equal(getRarityPriority(null, set), 8, `${set} ist ein Promo-Set`);
            assert.equal(getRarityPriority('', set), 8);
        }
        // Der Vergleich wird ohne Umwandlung gefuehrt: Kleinschreibung
        // trifft die Liste nicht. Gemessen, nicht vermutet.
        assert.equal(getRarityPriority(null, 'svp'), 999);
    });

    it('die Promo-Einordnung liegt zwischen Double Rare und Amazing Rare', () => {
        // Genau das behauptet der Kommentar im Quelltext. Er ist der
        // Grund, warum ein normales Double Rare (6) im min-Modus vor
        // einem Promo (8) gewaehlt wird.
        const promo = getRarityPriority(null, 'SVP');
        assert.ok(promo > getRarityPriority('Double Rare'),
            `Promo (${promo}) muss ueber Double Rare (6) liegen`);
        assert.ok(promo < getRarityPriority('Amazing Rare'),
            `Promo (${promo}) muss unter Amazing Rare (9) liegen`);
        assert.equal(promo, getRarityPriority('Promo'),
            'ein ausgeschriebenes "Promo" muss dieselbe Stufe ergeben wie ein Promo-Set ohne Angabe');
    });
});

describe('getRarityPriority — was der includes()-Weg nicht kann', () => {
    it('eine unbekannte Bezeichnung landet auf 0, also UNTER Common', () => {
        // GEMESSEN, nicht vermutet: 'xyz' trifft keinen Zweig und faellt
        // auf den Rueckgabewert 0 am Ende. Das ist eine Eigenschaft mit
        // Folgen — 0 ist kleiner als Common (1), im min-Modus wuerde ein
        // Druck mit unverstandener Seltenheit also VOR einer Common
        // gewaehlt. Anders als eine fehlende Angabe (999) wird er auch
        // nicht vom 999-Filter aussortiert.
        assert.equal(getRarityPriority('xyz'), 0);
        assert.equal(getRarityPriority('Kartenglanz'), 0);
        assert.ok(getRarityPriority('xyz') < getRarityPriority('Common'));
        assert.notEqual(getRarityPriority('xyz'), 999);
    });

    it('die Wortreihenfolge zaehlt: "Rare Secret" ist nicht "Secret Rare"', () => {
        // includes('secret rare') trifft "rare secret" nicht, also
        // greift der Sammelzweig fuer "rare" und es kommt 3 heraus.
        // In data/ kommt diese Schreibweise nicht vor (geprueft am
        // 07.09.2026); die Zusicherung haelt die Eigenschaft fest,
        // damit ein Quellenwechsel auf pokemontcg.io-Schreibweisen
        // nicht lautlos alle Secret Rares zu Rares macht.
        assert.equal(getRarityPriority('Rare Secret'), 3);
        assert.equal(getRarityPriority('Secret Rare'), 16);
    });

    it('zusammengesetzte Bezeichnungen nehmen den zuerst gefundenen Zweig', () => {
        // "Shiny Ultra Rare" trifft 'ultra rare' (13), bevor 'shiny
        // rare' (12) geprueft wird — der hoehere Wert gewinnt hier also
        // nicht durch Vergleich, sondern durch Stellung im Code.
        assert.equal(getRarityPriority('Shiny Ultra Rare'), 13);
        // "Special Art Rare" und "Special Illustration Rare" sind
        // dieselbe Stufe (SAR) und muessen gleich bewertet werden.
        assert.equal(getRarityPriority('Special Art Rare'),
            getRarityPriority('Special Illustration Rare'));
    });
});

describe('getRarityPriority — im Einsatz: die Sortierung', () => {
    it('min waehlt die guenstigste, max die teuerste Fassung', () => {
        // Der Auszug aus getPreferredVersionForCard: sortieren, die
        // Eintraege ohne Seltenheit (999) verwerfen, dann erstes bzw.
        // letztes Element nehmen.
        const drucke = [
            { set: 'SSP', number: '181', rarity: 'Special Illustration Rare' },
            { set: 'SVI', number: '196', rarity: 'Ultra Rare' },
            { set: 'PAL', number: '073', rarity: 'Double Rare' },
            { set: 'TEF', number: '012', rarity: 'Common' },
            { set: 'MEG', number: '999', rarity: '' },
        ];
        const sortiert = drucke.slice()
            .sort((a, b) => getRarityPriority(a.rarity, a.set) - getRarityPriority(b.rarity, b.set))
            .filter(v => getRarityPriority(v.rarity, v.set) < 999);

        assert.equal(sortiert.length, 4, 'der Druck ohne Seltenheit muss herausfallen');
        assert.equal(sortiert[0].set, 'TEF', 'min: die Common');
        assert.equal(sortiert[sortiert.length - 1].set, 'SSP', 'max: die SAR');
        assert.deepEqual(sortiert.map(v => v.rarity),
            ['Common', 'Double Rare', 'Ultra Rare', 'Special Illustration Rare']);
    });
});
