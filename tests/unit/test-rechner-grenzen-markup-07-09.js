/**
 * B4 — Markup und Rechnung nannten verschiedene Grenzen.
 *
 * GEMESSEN am 07.09.2026 in js/app-calculator.js (updateCalculations,
 * die vier leseUndKlemme-Aufrufe):
 *
 *   calc-deck-size   1 .. 99
 *   calc-copies      1 .. deckSize
 *   calc-drawn       1 .. deckSize
 *   calc-in-hand     0 .. copies
 *
 * Im Markup stand dagegen max="60" auf Kopien und gezogenen Karten und
 * max="4" auf "schon in der Hand". Da die Deckgroesse bis 99 geht, sind
 * 99 die groesste Zahl, die die Rechnung je verwendet: das Feld sperrte
 * Eingaben, mit denen gerechnet worden waere.
 *
 * WIE HIER GEPRUEFT WIRD
 * ----------------------
 * Die Grenzen werden aus js/app-calculator.js GELESEN, nicht
 * abgeschrieben. Namen als Obergrenze (`deckSize`, `copies`) werden auf
 * die Obergrenze des Feldes zurueckgefuehrt, das sie benennen — die
 * groesste Zahl, die dort ueberhaupt herauskommen kann. Wer die Klemmen
 * im Motor aendert und das Markup vergisst, faellt hier auf.
 *
 * Die Rechnung selbst ist NICHT Gegenstand dieser Aenderung und wurde
 * nicht angefasst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const MARKUP = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const RECHNER = fs.readFileSync(path.join(WURZEL, 'js', 'app-calculator.js'), 'utf8');

/**
 * Die vier Klemmen aus dem Motor. Die Aufrufform ist
 * leseUndKlemme(kennung, vorgabe, min, max, …) — die Vorgabe steht VOR
 * der Untergrenze, das ist beim Lesen leicht zu verwechseln.
 */
function klemmen() {
    const gefunden = new Map();
    for (const m of RECHNER.matchAll(
        /leseUndKlemme\('([a-z-]+)',\s*(-?\d+),\s*(-?\d+),\s*([A-Za-z0-9]+)\s*,/g)) {
        gefunden.set(m[1], { vorgabe: Number(m[2]), min: Number(m[3]), max: m[4] });
    }
    assert.ok(gefunden.size >= 4,
        `Nur ${gefunden.size} leseUndKlemme-Aufrufe in js/app-calculator.js gefunden — `
        + 'diese Pruefung liest die Grenzen von dort und muesste neu gedacht werden.');
    return gefunden;
}

/**
 * Welche Variable steht fuer welches Feld? Aus der Zuweisung im Motor
 * gelesen: `const deckSize = leseUndKlemme('calc-deck-size', …)`.
 */
function variableZuFeld() {
    const zuordnung = new Map();
    for (const m of RECHNER.matchAll(
        /const\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*leseUndKlemme\('([a-z-]+)'/g)) {
        zuordnung.set(m[1], m[2]);
    }
    return zuordnung;
}

/**
 * Eine Obergrenze zu einer Zahl aufloesen. Eine Zahl bleibt, wie sie
 * ist; ein Name wird zur Obergrenze des Feldes, das er benennt. Ein
 * Ring (a haengt an b haengt an a) wird gemeldet, nicht geraten.
 */
function groessterWert(feld, alleKlemmen, zuordnung, gesehen = new Set()) {
    assert.ok(!gesehen.has(feld), `Ringschluss bei den Obergrenzen ueber ${feld}.`);
    gesehen.add(feld);
    const k = alleKlemmen.get(feld);
    assert.ok(k, `Feld ${feld} hat keine Klemme im Motor.`);
    if (/^\d+$/.test(k.max)) return Number(k.max);
    const anderesFeld = zuordnung.get(k.max);
    assert.ok(anderesFeld,
        `Die Obergrenze "${k.max}" von ${feld} laesst sich keinem Feld zuordnen.`);
    return groessterWert(anderesFeld, alleKlemmen, zuordnung, gesehen);
}

/** min/max eines Zahlenfeldes aus dem Markup. */
function feldImMarkup(id) {
    const m = MARKUP.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
    assert.ok(m, `<input id="${id}"> steht nicht (mehr) in index.html.`);
    const min = m[0].match(/\bmin="(-?\d+)"/);
    const max = m[0].match(/\bmax="(-?\d+)"/);
    return { min: min && Number(min[1]), max: max && Number(max[1]), roh: m[0] };
}

describe('B4 — Grenzen im Rechner-Markup und in der Rechnung', () => {

    const alleKlemmen = klemmen();
    const zuordnung = variableZuFeld();

    it('jedes geklemmte Feld hat ein Zahlenfeld im Markup', () => {
        for (const id of alleKlemmen.keys()) {
            const feld = feldImMarkup(id);
            assert.ok(feld.roh.includes('type="number"'),
                `${id} ist kein Zahlenfeld — dann greifen min/max gar nicht.`);
        }
    });

    it('die Untergrenze im Markup ist die der Rechnung', () => {
        for (const [id, k] of alleKlemmen) {
            assert.equal(feldImMarkup(id).min, k.min,
                `${id}: das Markup erlaubt ab ${feldImMarkup(id).min}, `
                + `js/app-calculator.js klemmt ab ${k.min}.`);
        }
    });

    it('die Obergrenze im Markup sperrt nichts, womit gerechnet wuerde', () => {
        for (const id of alleKlemmen.keys()) {
            const hoechstens = groessterWert(id, alleKlemmen, zuordnung);
            const imMarkup = feldImMarkup(id).max;
            assert.equal(imMarkup, hoechstens,
                `${id}: das Markup deckelt bei ${imMarkup}, die Rechnung verwendet `
                + `Werte bis ${hoechstens} (Klemme "${alleKlemmen.get(id).max}"). `
                + 'Ein Deckel unter dem, was gerechnet wird, sperrt gueltige '
                + 'Eingaben; einer darueber verspricht mehr, als je benutzt wird.');
        }
    });

    it('die Vorgabe im Feld ist die, mit der bei leerem Feld gerechnet wird', () => {
        /* leseUndKlemme() rechnet mit seiner eigenen Vorgabe, sobald das Feld
           leer ist, und schreibt das in den Titel des Feldes. Steht im Markup
           eine andere Zahl, sagt das Feld beim Laden etwas anderes als die
           Rechnung tut, sobald man es leert. */
        for (const [id, k] of alleKlemmen) {
            const m = MARKUP.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
            const wert = Number((m[0].match(/\bvalue="(-?\d+)"/) || [])[1]);
            assert.ok(Number.isFinite(wert), `${id} hat keinen Vorgabewert.`);
            assert.equal(wert, k.vorgabe,
                `${id}: das Feld startet mit ${wert}, die Rechnung nimmt bei leerem `
                + `Feld ${k.vorgabe}.`);
            assert.ok(wert >= k.min && wert <= groessterWert(id, alleKlemmen, zuordnung),
                `${id}: Vorgabe ${wert} liegt ausserhalb der Grenzen der Rechnung.`);
        }
    });
});
