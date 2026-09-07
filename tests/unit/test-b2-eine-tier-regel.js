/**
 * BEFUND B2 (07.09.2026, js/app-tier-meta.js):
 *
 *   Im selben Modul standen ZWEI Tier-Regeln. Angewendet wird der
 *   Punktwert aus computeTierScore() mit Deckeln, Mindestlistenzahl und
 *   Win-%-Tor. Daneben stand getDeckTier() — reine Anteilsschwellen
 *   (8 / 4 / 1,5 %) — ohne eine einzige Aufrufstelle im ganzen Repo.
 *
 *   Toter Code ist hier nicht bloss Ballast: die beiden Regeln sagen
 *   VERSCHIEDENES. Wer die kurze, gut lesbare Schwellenfunktion findet,
 *   haelt sie fuer die Regel der Seite und liegt falsch.
 *
 * DIESER TEST FUEHRT DEN WIDERSPRUCH VOR, statt ihn zu behaupten:
 *   (A) Die gelebte Regel wird aus der Datei geschnitten und
 *       AUSGEFUEHRT — mit Decks, die der Test setzt.
 *   (B) Die geloeschte Regel steht hier als Kopie, damit man sieht,
 *       worueber geredet wird, und wird auf dieselben Decks angewendet.
 *   (C) Sie muessen auseinanderfallen. Taeten sie es nicht, waere die
 *       Loeschung eine Geschmacksfrage gewesen.
 *   (D) Und getDeckTier() darf nicht zurueckkommen.
 *
 * Keine Live-Daten: alle Decks setzt der Test.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { QUELLE, funktion, schnitt } = require('./lib-tier-sandkasten.js');

// ── (A) Die gelebte Regel, ausgefuehrt ──────────────────────────────
/**
 * Der Einteilungsblock des laufenden Metas am Stueck: Schwelle,
 * Deckel, Win-%-Tor und die Zuweisung in die vier Stufen.
 */
function stufen(decks) {
    const block = schnitt(
        'const MINDEST_ANTEIL_GROESSTER = 0.10;',
        'normalizedDecks.forEach((deck) => {'
    );
    const kasten = {
        Math, Number, String, Object, Array, JSON, parseInt, parseFloat,
        normalizedDecks: decks,
        labsByName: null,
        tierGroups: { 'tier-1': [], 'tier-2': [], 'tier-3': [], 'tier-trending': [] }
    };
    vm.createContext(kasten);
    vm.runInContext(block + '\n;globalThis._raus = tierGroups;', kasten);
    const raus = {};
    Object.keys(kasten._raus).forEach(k => {
        raus[k] = Array.from(kasten._raus[k]).map(d => d.archetype);
    });
    return raus;
}

/** Die Stufe eines Decks nach der gelebten Regel. */
function gelebt(decks, name) {
    const g = stufen(decks);
    return Object.keys(g).find(k => g[k].includes(name)) || null;
}

// ── (B) Die geloeschte Regel, wortgetreu ────────────────────────────
/**
 * Kopie von getDeckTier() in dem Zustand, in dem sie am 07.09.2026 aus
 * js/app-tier-meta.js entfernt wurde. Sie steht NUR hier, damit der
 * Vergleich unten ueberhaupt etwas vergleicht.
 */
function geloeschteRegel(deck) {
    const share = Number(deck.share) || 0;
    const winRate = Number(deck.winrate);
    const countChange = parseInt(deck.count_change || 0, 10);
    if (share >= 8) return 'tier-1';
    if (share >= 4 && share < 8) return 'tier-2';
    if (share >= 1.5 && share < 4) return 'tier-3';
    if (share < 1.5) {
        if (winRate && winRate > 52) return 'tier-trending';
        if (countChange > 0) return 'tier-trending';
        return 'tier-rogue';
    }
    return null;
}

/** Ein Feld, in dem der Unterschied sichtbar wird. Alle Zahlen gesetzt. */
function feld() {
    const d = (archetype, share, winrate, new_count) => ({
        archetype, share, winrate, new_count,
        _tierScore: null
    });
    return [
        // Viel gespielt, verliert: nach Anteil Tier 1, nach dem
        // Win-%-Tor der gelebten Regel nicht.
        d('Vielgespielt Schwach', 9.0, 44.0, 3000),
        d('Solide A', 6.0, 55.0, 2000),
        d('Solide B', 5.0, 54.0, 1800),
        d('Solide C', 4.5, 53.0, 1600),
        d('Duenn Stark', 0.6, 60.0, 40)
    ];
}

/** computeTierScore() an die Decks haengen — die Einteilung liest sie. */
function mitPunktwert(decks) {
    const kasten = { Math, Number, String, Object, Array, JSON };
    vm.createContext(kasten);
    vm.runInContext(
        schnitt('const TIER_SCORE = Object.freeze({', 'const TIER_SCORE = Object.freeze({')
        + '\n' + funktion('computeTierScore'), kasten);
    decks.forEach(d => { d._tierScore = kasten.computeTierScore(d, null); });
    decks.sort((a, b) => b._tierScore.score - a._tierScore.score);
    return decks;
}

describe('B2 — im Modul gilt genau eine Tier-Regel', () => {

    it('die gelebte Regel laesst sich ausfuehren und teilt das gesetzte Feld ein', () => {
        const g = stufen(mitPunktwert(feld()));
        const alle = [].concat(g['tier-1'], g['tier-2'], g['tier-3'], g['tier-trending']);
        assert.deepEqual(alle.slice().sort(), feld().map(d => d.archetype).sort(),
            'jedes Deck muss in genau einer Stufe landen');
    });

    it('die geloeschte Schwellenregel widerspricht der gelebten — sie war kein Duplikat', () => {
        const decks = mitPunktwert(feld());
        const nachSchwelle = {};
        feld().forEach(d => { nachSchwelle[d.archetype] = geloeschteRegel(d); });

        const streit = feld()
            .map(d => d.archetype)
            .filter(n => gelebt(decks, n) !== nachSchwelle[n])
            .map(n => n + ': gelebt ' + gelebt(decks, n) + ', Schwellenregel ' + nachSchwelle[n]);

        assert.notEqual(streit.length, 0,
            'beide Regeln sagen dasselbe — dann war die Loeschung Geschmackssache');

        // Der Fall, um den es geht, ausdruecklich benannt: viel gespielt,
        // verliert. Die Schwellenregel macht daraus Tier 1; die gelebte
        // Regel haelt das Win-%-Tor dagegen.
        assert.equal(nachSchwelle['Vielgespielt Schwach'], 'tier-1');
        assert.notEqual(gelebt(decks, 'Vielgespielt Schwach'), 'tier-1',
            'das Win-%-Tor T1_MIN_WR greift nicht mehr — dann waeren beide Regeln gleich');
    });

    it('getDeckTier() ist nicht zurueck', () => {
        assert.throws(() => funktion('getDeckTier'),
            /Funktion nicht gefunden/,
            'die zweite Tier-Regel steht wieder in js/app-tier-meta.js');
        // Auch keine Aufrufstelle, die auf eine Wiedereinfuehrung wartet.
        assert.equal(/getDeckTier\s*\(/.test(QUELLE.replace(/getDeckTier\(\)/g, '')), false,
            'irgendwo wird getDeckTier wieder aufgerufen');
    });
});
