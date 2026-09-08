/**
 * calculateCombinedVariantStats() aus js/app-utils.js (Zeile 767).
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross und wurde vom Testlauf als bestanden gezaehlt.
 *
 * WAS DIE FUNKTION TUT
 * --------------------
 * Dieselbe Karte erscheint in den Turnierdaten einmal pro DRUCK
 * ("Ultra Ball (SVI 196)", "Ultra Ball (BRS 186)"). Diese Funktion
 * fasst die Zeilen zu einem Eintrag zusammen und liefert die drei
 * Zahlen, die die Deckliste anzeigt und der Auto-Deckbauer benutzt:
 * Anteil der Decks, Durchschnittszahl der Kopien und die empfohlene
 * ganze Kopienzahl.
 *
 * Die heiklen Stellen sind alle Nenner und Grenzen:
 *   - Der Nenner ist max(1, uebergebener Nenner, Summe der deck_count).
 *     Ohne den dritten Term kann ein Formatfilter mehr Decks zaehlen,
 *     als der Nenner kennt, und der Anteil laeuft ueber 100 %.
 *   - Als Zaehler dient max(deck_count), nicht die Summe: dieselben
 *     Decks spielen oft mehrere Drucke, die Summe wuerde sie doppelt
 *     zaehlen.
 *   - Der Schnitt wird bei der legalen Hoechstzahl gekappt (4, bei
 *     ACE SPEC 1, bei Basis-Energie 59).
 *
 * AUSGEFUEHRT, NICHT GEGRIFFEN: die ganze Kette bis getLegalMaxCopies
 * wird aus js/ herausgeschnitten und wirklich aufgerufen. Ein
 * Quelltext-Grep saehe die Grenzen, aber nicht ihr Ergebnis.
 *
 * KEINE LIVEDATEN, KEIN jsdom: jede Variantenzeile setzt der Test.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const UTILS = lies('js/app-utils.js');
const CORE = lies('js/app-core.js');
const CITY = lies('js/app-city-league.js');

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

const ALIASBLOCK = UTILS.match(/const LEGACY_CARD_NAME_ALIASES = (Object\.freeze\(\{[\s\S]*?\}\));/);
if (!ALIASBLOCK) throw new Error('LEGACY_CARD_NAME_ALIASES nicht gefunden');

// Die echte Kette, so wie sie in der Auslieferung aufeinander aufbaut.
const KETTE = [
    'const LEGACY_CARD_NAME_ALIASES = ' + ALIASBLOCK[1] + ';',
    funktion('fixMojibake', UTILS),
    funktion('getLegacyCardNameAlias', UTILS),
    funktion('normalizeCardName', UTILS),
    funktion('isBasicEnergy', UTILS),
    funktion('isRadiantPokemon', UTILS),
    funktion('isPrismStarCard', UTILS),
    funktion('getStrictBaseCardName', UTILS),
    funktion('isBasicEnergyCardEntry', CITY),
    funktion('isAceSpec', CORE),
    funktion('getLegalMaxCopies', UTILS),
    funktion('calculateCombinedVariantStats', UTILS),
].join('\n\n');

// Die ACE-SPEC-Liste kommt in der Auslieferung aus data/ace_specs.json.
// Hier wird sie GESETZT — der Test soll die Rechnung pruefen, nicht den
// Bestand der Woche.
// eslint-disable-next-line no-new-func
const modul = new Function('aceSpecsList', 'window', KETTE
    + '\nreturn { calculateCombinedVariantStats, getLegalMaxCopies };')(
    ['prime catcher', 'maximum belt'], {});

const rechne = modul.calculateCombinedVariantStats;
const legalMax = modul.getLegalMaxCopies;

describe('calculateCombinedVariantStats — leere und fehlende Eingaben', () => {
    it('gibt fuer leere Varianten das Nullobjekt zurueck, ohne zu werfen', () => {
        const soll = { combinedShare: 0, combinedAvgWhenUsed: 0, recommendedCount: 0, baseName: '', legalMax: 4 };
        assert.deepEqual(rechne([], 100), soll);
        assert.deepEqual(rechne(null, 100), soll);
        assert.deepEqual(rechne(undefined, undefined), soll);
        assert.deepEqual(rechne('keine Liste', 100), soll);
        assert.deepEqual(rechne({}, 100), soll);
    });

    it('nur im Leerfall ist recommendedCount 0 — sonst mindestens 1', () => {
        // GEMESSEN, weil man es anders erwarten wuerde: bei einer
        // Variante mit deck_count 0 und Nenner 0 kommt trotzdem
        // recommendedCount 1 heraus (Math.max(1, ...) im Quelltext).
        // Der Auto-Deckbauer legt also nie "0 Kopien" an, sobald die
        // Karte ueberhaupt eine Zeile hat.
        assert.equal(rechne([], 100).recommendedCount, 0);
        const leerZeile = rechne([{ card_name: 'Ultra Ball', deck_count: 0, total_count: 0 }], 0);
        assert.equal(leerZeile.combinedShare, 0);
        assert.equal(leerZeile.combinedAvgWhenUsed, 0);
        assert.equal(leerZeile.recommendedCount, 1);
    });

    it('eine Variante ohne jede Zahl stuerzt nicht ab', () => {
        const erg = rechne([{ card_name: 'Ultra Ball' }], 100);
        assert.equal(erg.combinedShare, 0);
        assert.equal(erg.baseName, 'Ultra Ball');
        assert.equal(Number.isNaN(erg.combinedAvgWhenUsed), false);
    });
});

describe('calculateCombinedVariantStats — die Rechnung an einem gesetzten Feld', () => {
    it('ein einzelner Druck: 80 von 100 Decks, 280 Kopien → 80 % und 3,5', () => {
        const erg = rechne([{ card_name: 'Ultra Ball', deck_count: 80, total_count: 280 }], 100);
        assert.equal(erg.combinedShare, 80);           // 80/100
        assert.equal(erg.combinedAvgWhenUsed, 3.5);    // 280/80
        assert.equal(erg.recommendedCount, 4);         // gerundet, gekappt bei 4
        assert.equal(erg.baseName, 'Ultra Ball');
        assert.equal(erg.legalMax, 4);
    });

    it('zwei Drucke: der Zaehler ist max(deck_count), nicht die Summe', () => {
        // 60 + 40 Decks. Waere die Summe der Zaehler, kaeme 100 % heraus
        // — jedes Deck der Liste haette die Karte. Die Funktion nimmt
        // bewusst nur den groessten Einzelwert als Schaetzung der
        // Vereinigungsmenge, weil dieselben Decks beide Drucke spielen.
        const erg = rechne([
            { card_name: 'Ultra Ball (SVI 196)', deck_count: 60, total_count: 180 },
            { card_name: 'Ultra Ball (BRS 186)', deck_count: 40, total_count: 100 },
        ], 100);
        assert.equal(erg.combinedShare, 60);
        assert.notEqual(erg.combinedShare, 100, 'die Summe der deck_count darf kein Zaehler sein');
        assert.equal(erg.baseName, 'Ultra Ball',
            'der Satzzusatz "(SVI 196)" wird fuer den Anzeigenamen abgestreift');
    });

    it('die Kopien werden ueber ALLE Drucke summiert', () => {
        // 180 + 100 = 280 Kopien auf 60 geschaetzte Decks = 4,67 —
        // gekappt bei der legalen Hoechstzahl 4.
        const erg = rechne([
            { card_name: 'Ultra Ball (SVI 196)', deck_count: 60, total_count: 180 },
            { card_name: 'Ultra Ball (BRS 186)', deck_count: 40, total_count: 100 },
        ], 100);
        assert.equal(erg.combinedAvgWhenUsed, 4);
        assert.ok(280 / 60 > 4, 'Vorpruefung: der Rohwert liegt wirklich ueber der Grenze');
    });
});

describe('calculateCombinedVariantStats — der sichere Nenner', () => {
    it('mehr gezaehlte Decks als der Nenner kennt: der Nenner waechst mit', () => {
        // Der Fall, den der Quelltext als CRITICAL markiert: ein
        // Formatfilter hat den uebergebenen Nenner (100) verkleinert,
        // die Variantenzeilen zaehlen aber zusammen 120 Decks. Ohne den
        // dritten Term im Math.max stuende hier 60 %.
        const erg = rechne([
            { card_name: 'Ultra Ball (SVI 196)', deck_count: 60, total_count: 180 },
            { card_name: 'Ultra Ball (BRS 186)', deck_count: 60, total_count: 150 },
        ], 100);
        assert.equal(erg.combinedShare, 50, '60 von 120, nicht 60 von 100');
    });

    it('der Anteil geht nie ueber 100 %', () => {
        const erg = rechne([{ card_name: 'Ultra Ball', deck_count: 150, total_count: 600 }], 100);
        assert.equal(erg.combinedShare, 100);
        assert.ok(erg.combinedShare <= 100);
    });

    it('ein Nenner von 0, null oder undefined fuehrt nicht zu Division durch null', () => {
        for (const nenner of [0, null, undefined, NaN, -5]) {
            const erg = rechne([{ card_name: 'Ultra Ball', deck_count: 20, total_count: 60 }], nenner);
            assert.equal(Number.isFinite(erg.combinedShare), true,
                `Nenner ${JSON.stringify(nenner)} → ${erg.combinedShare}`);
            assert.equal(erg.combinedShare, 100,
                'ohne brauchbaren Nenner ist die Summe der deck_count der Nenner');
            assert.equal(erg.combinedAvgWhenUsed, 3);
        }
    });
});

describe('calculateCombinedVariantStats — Spaltennamen und Zahlenformate', () => {
    it('liest die drei Schreibweisen jeder Spalte', () => {
        const a = rechne([{ card_name: 'Ultra Ball', deck_count: 50, total_count: 200 }], 100);
        const b = rechne([{ name: 'Ultra Ball', deckCount: 50, totalCount: 200 }], 100);
        const c = rechne([{ card_name: 'Ultra Ball', deck_inclusion_count: 50, total_copies: 200 }], 100);
        assert.deepEqual(a, b);
        assert.deepEqual(a, c);
        assert.equal(a.combinedShare, 50);
        assert.equal(a.combinedAvgWhenUsed, 4);
    });

    it('ein Dezimalkomma wird als Dezimalpunkt gelesen', () => {
        // Die deutschen Exporte schreiben "3,5". parseFloat('3,5') waere 3.
        const erg = rechne([{ card_name: 'Ultra Ball', deck_count: '50', avgCountWhenUsed: '3,5' }], 100);
        assert.equal(erg.combinedAvgWhenUsed, 3.5);
        assert.notEqual(erg.combinedAvgWhenUsed, 3);
    });

    it('fehlt total_count, wird es aus Schnitt mal Deckzahl rekonstruiert', () => {
        const mitSchnitt = rechne([{ card_name: 'Ultra Ball', deck_count: 50, average_count: 2 }], 100);
        const mitSumme   = rechne([{ card_name: 'Ultra Ball', deck_count: 50, total_count: 100 }], 100);
        assert.equal(mitSchnitt.combinedAvgWhenUsed, 2);
        assert.deepEqual(mitSchnitt, mitSumme);
    });

    it('unlesbare Zahlen werden 0 statt NaN', () => {
        const erg = rechne([{ card_name: 'Ultra Ball', deck_count: 'viele', total_count: '—' }], 100);
        assert.equal(erg.combinedShare, 0);
        assert.equal(erg.combinedAvgWhenUsed, 0);
        assert.equal(Number.isNaN(erg.combinedShare), false);
    });

    it('die Ausgabe ist gerundet: ein Nachkommastellen-Anteil, zwei beim Schnitt', () => {
        const erg = rechne([{ card_name: 'Ultra Ball', deck_count: 1, total_count: 3 }], 7);
        assert.equal(erg.combinedShare, 14.3);          // 1/7 = 14,2857…
        const schnitt = rechne([{ card_name: 'Ultra Ball', deck_count: 3, total_count: 4 }], 100);
        assert.equal(schnitt.combinedAvgWhenUsed, 1.33); // 4/3 = 1,3333…
    });
});

describe('calculateCombinedVariantStats — die legale Hoechstzahl', () => {
    it('ACE SPEC wird bei einer Kopie gekappt', () => {
        assert.equal(legalMax('Prime Catcher'), 1, 'Vorpruefung: die gesetzte Liste greift');
        const erg = rechne([{ card_name: 'Prime Catcher', deck_count: 50, total_count: 150 }], 100);
        assert.equal(erg.legalMax, 1);
        assert.equal(erg.combinedAvgWhenUsed, 1, 'roh waeren es 3');
        assert.equal(erg.recommendedCount, 1);
    });

    it('Basis-Energie darf bis 59 — sie wird NICHT bei 4 gekappt', () => {
        const erg = rechne([{ card_name: 'Fire Energy', deck_count: 50, total_count: 500 }], 100);
        assert.equal(erg.legalMax, 59);
        assert.equal(erg.combinedAvgWhenUsed, 10);
        assert.equal(erg.recommendedCount, 10);
    });

    it('eine Radiant-Karte ist ebenfalls auf eine Kopie begrenzt', () => {
        const erg = rechne([{ card_name: 'Radiant Greninja', deck_count: 40, total_count: 40 }], 100);
        assert.equal(erg.legalMax, 1);
        assert.equal(erg.recommendedCount, 1);
    });

    it('die Empfehlung liegt immer zwischen 1 und der legalen Hoechstzahl', () => {
        const faelle = [
            ['Ultra Ball', 4], ['Prime Catcher', 1], ['Fire Energy', 59], ['Radiant Greninja', 1],
        ];
        for (const [name, max] of faelle) {
            for (const kopien of [1, 10, 400]) {
                const erg = rechne([{ card_name: name, deck_count: 50, total_count: kopien }], 100);
                assert.ok(erg.recommendedCount >= 1,
                    `${name}/${kopien}: ${erg.recommendedCount} < 1`);
                assert.ok(erg.recommendedCount <= max,
                    `${name}/${kopien}: ${erg.recommendedCount} > ${max}`);
                assert.equal(Number.isInteger(erg.recommendedCount), true,
                    'die Empfehlung ist eine ganze Kopienzahl');
            }
        }
    });
});
