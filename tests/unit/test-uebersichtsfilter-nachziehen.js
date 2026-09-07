/**
 * ZAEHLER UND RASTER MUESSEN DASSELBE SAGEN
 *
 * BEFUND (07.09.2026, QA-C FEHLER-3, live nachgemessen im Reiter
 * "Aktuelles Meta" mit Mega Excadrill):
 *
 *   Suchfeld "Ultra" getippt   -> 1 Kachel sichtbar, Zaehler "1 Karten".
 *   danach "Max Consistency"   -> 50 Kacheln sichtbar, Zaehler
 *                                 "50 Karten" — das Suchfeld trug
 *                                 weiterhin "Ultra".
 *
 * QA-C hat dieselbe Ursache von der anderen Seite gesehen: Zaehler
 * "0 Karten" bei 24 Kacheln im Raster, und ein nach dem Leeren des
 * Suchfelds haengengebliebener Wert.
 *
 * Zwei Schreiber, die nichts voneinander wissen:
 * `updateCurrentMetaCardCounts` schreibt die DATENzahl der gefilterten
 * Kartenliste, `uebersichtKachelnFiltern` die Zahl der SICHTBAREN
 * Kacheln. Jede Neuzeichnung durch den Deckbauer setzt den ersten Wert
 * und laesst Suche und Typfilter fallen.
 *
 * Behoben wird der Ausloeser, der dem Deckbauer gehoert:
 * `scheduleDeckDependentRefresh` zieht nach JEDER Neuzeichnung, die es
 * anstoesst, den Uebersichtsfilter nach.
 *
 * ZWEI DINGE WERDEN BEWACHT, und beide rechnen:
 *
 *  1. Die Neuzeichnung zieht den Filter ueberhaupt nach.
 *  2. Sie zieht ihn NICHT nach, solange das Raster noch waechst.
 *     Zwei der drei Raster haengen ihre Kacheln in Schueben von 12 je
 *     Frame ein; ein Filterlauf mitten im Schub zaehlt nur das erste
 *     Zwoelftel — genau die "0 Karten bei 24 Kacheln", die gemeldet
 *     wurden.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { describe, it } = require('node:test');

const WURZEL = path.join(__dirname, '..', '..');
const BAUER = fs.readFileSync(path.join(WURZEL, 'js', 'app-deck-builder.js'), 'utf8');

/* Rumpf einer Funktion, an der Klammer gezaehlt statt an der
   Einrueckung geraten. */
function rumpf(kopf) {
    const start = BAUER.indexOf(kopf);
    assert.ok(start >= 0, `Funktion nicht gefunden: ${kopf}`);
    const i = BAUER.indexOf('{', start);
    let tiefe = 0;
    for (let j = i; j < BAUER.length; j++) {
        if (BAUER[j] === '{') tiefe++;
        else if (BAUER[j] === '}') { tiefe--; if (tiefe === 0) return BAUER.slice(i + 1, j); }
    }
    throw new Error(`unbalancierte Klammern in ${kopf}`);
}

/* Die beiden Zuordnungstabellen stehen als Konstanten im Quelltext und
   werden hier mitgenommen, damit der Test keine zweite Wahrheit fuehrt. */
function tabellen() {
    const a = BAUER.indexOf('const UEBERSICHT_GITTER = {');
    assert.ok(a >= 0, 'UEBERSICHT_GITTER nicht gefunden');
    const b = BAUER.indexOf('function _uebersichtFilterNachziehen', a);
    assert.ok(b > a, 'Ende der Tabellen nicht gefunden');
    return BAUER.slice(a, b);
}

/* Eine kleine Welt: ein Raster, das auf Wunsch noch waechst, ein
   Uhrwerk, das von Hand weitergedreht wird, und ein Filter, der nur
   protokolliert, was er beim Aufruf gesehen haette. */
function welt(opts) {
    const o = opts || {};
    const w = {
        kacheln: o.kacheln == null ? 24 : o.kacheln,
        wachstum: o.wachstum || 0,     // wie oft das Raster noch waechst
        proSchub: o.proSchub || 12,
        filterAufrufe: [],
        uhr: [],                        // offene setTimeout-Rueckrufe
        protokoll: [],
    };
    w.document = {
        getElementById(id) {
            if (id !== 'currentMetaDeckGrid' && id !== 'cityLeagueDeckGrid'
                && id !== 'pastMetaDeckGrid') return null;
            return {
                querySelectorAll(sel) {
                    assert.strictEqual(sel, '.card-item');
                    return { length: w.kacheln };
                }
            };
        }
    };
    w.window = {
        filterCurrentMetaOverviewCards() { w.filterAufrufe.push(w.kacheln); },
        filterOverviewCards()            { w.filterAufrufe.push(w.kacheln); },
        filterPastMetaOverviewCards()    { w.filterAufrufe.push(w.kacheln); },
    };
    w.setTimeout = (cb) => { w.uhr.push(cb); return w.uhr.length; };
    /* Ein Tick: ein faelliger Rueckruf laeuft, und falls das Raster noch
       waechst, kommt vorher der naechste Schub. */
    w.tick = () => {
        const cb = w.uhr.shift();
        if (!cb) return false;
        if (w.wachstum > 0) { w.wachstum--; w.kacheln += w.proSchub; }
        cb();
        return true;
    };
    return w;
}

/* Die ganze Funktion samt Namen — sie ruft sich selbst auf, also muss
   der Name im Sandkasten gebunden sein. */
function ladeNachziehen(w) {
    const kopf = 'function _uebersichtFilterNachziehen(source, _versuche, _zuletzt) {';
    const a = BAUER.indexOf(kopf);
    assert.ok(a >= 0, '_uebersichtFilterNachziehen nicht gefunden');
    let tiefe = 0, ende = -1;
    for (let j = BAUER.indexOf('{', a); j < BAUER.length; j++) {
        if (BAUER[j] === '{') tiefe++;
        else if (BAUER[j] === '}') { tiefe--; if (tiefe === 0) { ende = j; break; } }
    }
    assert.ok(ende > 0, 'unbalancierte Klammern in _uebersichtFilterNachziehen');
    const code = tabellen() + '\n' + BAUER.slice(a, ende + 1)
        + '\nreturn _uebersichtFilterNachziehen;';
    const bauen = new Function('document', 'window', 'setTimeout', 'devLog', code);
    return bauen(w.document, w.window, w.setTimeout,
        (...args) => w.protokoll.push(args.join(' ')));
}

describe('Uebersichtsfilter wird nach einer Neuzeichnung nachgezogen', () => {

    it('ruht, solange das Raster noch waechst, und zaehlt erst danach', () => {
        // Das Raster startet mit 12 Kacheln und bekommt zwei weitere
        // Schuebe — wie der Schubrenderer es tut.
        const w = welt({ kacheln: 12, wachstum: 2, proSchub: 12 });
        const nachziehen = ladeNachziehen(w);
        nachziehen('currentMeta');
        assert.deepStrictEqual(w.filterAufrufe, [],
            'ein Filterlauf VOR dem letzten Schub zaehlt nur ein Zwoelftel');
        let sicherung = 0;
        while (w.tick() && w.filterAufrufe.length === 0 && sicherung++ < 50) { /* weiterdrehen */ }
        assert.strictEqual(w.filterAufrufe.length, 1, 'genau ein Filterlauf');
        assert.strictEqual(w.filterAufrufe[0], 36,
            'gefiltert wird erst, wenn alle 36 Kacheln haengen');
    });

    it('zieht bei einem stehenden Raster genau einmal nach', () => {
        const w = welt({ kacheln: 24 });
        const nachziehen = ladeNachziehen(w);
        nachziehen('currentMeta');
        let sicherung = 0;
        while (w.tick() && sicherung++ < 50) { /* weiterdrehen */ }
        assert.deepStrictEqual(w.filterAufrufe, [24]);
    });

    it('kennt alle drei Reiter', () => {
        ['cityLeague', 'currentMeta', 'pastMeta'].forEach(q => {
            const w = welt({ kacheln: 7 });
            ladeNachziehen(w)(q);
            let sicherung = 0;
            while (w.tick() && sicherung++ < 50) { /* weiterdrehen */ }
            assert.deepStrictEqual(w.filterAufrufe, [7], `Reiter ${q}`);
        });
    });

    it('gibt auf, statt ewig zu warten, wenn das Raster nie zur Ruhe kommt', () => {
        // Ein Raster, das nicht aufhoert zu wachsen, darf keine
        // Endlosschleife erzeugen — lieber einmal ungenau als nie.
        const w = welt({ kacheln: 1, wachstum: 9999, proSchub: 1 });
        const nachziehen = ladeNachziehen(w);
        nachziehen('currentMeta');
        let ticks = 0;
        while (w.tick() && w.filterAufrufe.length === 0 && ticks++ < 200) { /* weiterdrehen */ }
        assert.strictEqual(w.filterAufrufe.length, 1,
            'nach den vorgesehenen Versuchen wird trotzdem gefiltert');
        assert.ok(ticks <= 20, `Versuche begrenzt (gebraucht: ${ticks})`);
    });

    it('bleibt still, wenn es das Raster oder den Filter nicht gibt', () => {
        const w = welt({ kacheln: 5 });
        w.document.getElementById = () => null;
        ladeNachziehen(w)('currentMeta');
        assert.deepStrictEqual(w.filterAufrufe, []);
        assert.deepStrictEqual(w.uhr, [], 'kein offener Rueckruf ohne Raster');

        const w2 = welt({ kacheln: 5 });
        w2.window.filterCurrentMetaOverviewCards = undefined;
        ladeNachziehen(w2)('currentMeta');
        assert.deepStrictEqual(w2.filterAufrufe, []);
    });

    it('eine unbekannte Quelle fasst nichts an', () => {
        const w = welt({ kacheln: 5 });
        ladeNachziehen(w)('pocket');
        assert.deepStrictEqual(w.filterAufrufe, []);
        assert.deepStrictEqual(w.uhr, []);
    });

});

describe('Die Neuzeichnung des Deckbauers stoesst das Nachziehen an', () => {

    /* `scheduleDeckDependentRefresh` selbst, aus dem Quelltext. Die
       Entprellung darin haengt an setTimeout und requestAnimationFrame;
       beide werden hier sofort ausgefuehrt, damit die Reihenfolge
       sichtbar wird. */
    function fahreNeuzeichnung(quelle) {
        const koerper = rumpf('function scheduleDeckDependentRefresh(source) {');
        const protokoll = [];
        const f = new Function(
            'source', 'pendingDeckRefreshBySource', 'pendingDeckRefreshTimeoutBySource',
            'cancelAnimationFrame', 'clearTimeout', 'setTimeout', 'requestAnimationFrame',
            'applyCityLeagueFilter', 'applyCurrentMetaFilter', 'renderPastMetaCards',
            '_uebersichtFilterNachziehen', 'updateOpeningHandStats', 'window',
            koerper);
        f(quelle, {}, {},
          () => {}, () => {},
          (cb) => { cb(); return 1; },
          (cb) => { cb(); return 1; },
          () => protokoll.push('neuzeichnen:cityLeague'),
          () => protokoll.push('neuzeichnen:currentMeta'),
          () => protokoll.push('neuzeichnen:pastMeta'),
          (q) => protokoll.push('nachziehen:' + q),
          () => protokoll.push('starthand'),
          { scrollY: 0, scrollTo: () => {} });
        return protokoll;
    }

    it('zieht den Filter NACH der Neuzeichnung nach — currentMeta', () => {
        const p = fahreNeuzeichnung('currentMeta');
        assert.ok(p.includes('nachziehen:currentMeta'),
            'ohne diesen Aufruf faellt die Suche des Nutzers still weg');
        assert.ok(p.indexOf('neuzeichnen:currentMeta') < p.indexOf('nachziehen:currentMeta'),
            'erst zeichnen, dann filtern — umgekehrt filtert man das alte Raster');
    });

    it('zieht den Filter NACH der Neuzeichnung nach — cityLeague und pastMeta', () => {
        ['cityLeague', 'pastMeta'].forEach(q => {
            const p = fahreNeuzeichnung(q);
            assert.ok(p.includes('nachziehen:' + q), `Reiter ${q}`);
            assert.ok(p.indexOf('neuzeichnen:' + q) < p.indexOf('nachziehen:' + q),
                `Reihenfolge im Reiter ${q}`);
        });
    });

    it('die Starthand-Statistik laeuft weiterhin mit', () => {
        assert.ok(fahreNeuzeichnung('currentMeta').includes('starthand'));
    });

});
