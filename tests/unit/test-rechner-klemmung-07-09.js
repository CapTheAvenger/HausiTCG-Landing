/**
 * Der Wahrscheinlichkeitsrechner, AUSGEFUEHRT.
 *
 * ZWEI BEFUNDE, live gemessen am 07.09.2026 und hier nachgestellt.
 *
 *   B9 / F13.3b — DAS LEERE FELD RECHNETE STILL WEITER.
 *   Gemessen: "Karten im Deck" geleert, Kopien 4, gezogen 7.
 *
 *       Feld:      ""              (leer, ohne Titel, ohne Hinweis)
 *       Fusszeile: "4 von 60 Karten, 7 gezogen"
 *       Ergebnis:  "39,95 %"
 *
 *   Gerechnet wurde mit 60, obwohl nirgends 60 stand. Ursache:
 *   `String(el.value).trim() !== ''` in leseUndKlemme() schloss genau
 *   den Leerfall aus, und getInputNumber() lieferte den Vorgabewert
 *   stumm.
 *
 *   BEHOBEN WIRD DIE STILLE, NICHT DER ERSATZWERT. Ein leeres Feld ist
 *   der Normalzustand beim Tippen; wer 60 loescht, um 59 einzugeben,
 *   bekaeme die 60 im selben Tastendruck zurueck. Die Zusicherung vom
 *   20.08.2026 ("ein leeres Feld bleibt leer — dort tippt gerade
 *   jemand", tests/unit/test-rechenfehler.js) bleibt deshalb gueltig,
 *   und stattdessen sagen ein Titel und eine sichtbare Zeile, mit
 *   welcher Zahl gerechnet wurde.
 *
 *   B21 / F13.3c — DIE KLEMM-KASKADE ZERSTOERTE DREI EINGABEN.
 *   Gemessen: Deck 1, Kopien 4, gezogen 7, in der Hand 2 →
 *   alle vier Felder standen danach auf 1. Zurueck auf Deck 60:
 *   Kopien 1, gezogen 1, in der Hand 1 — die 4, die 7 und die 2 waren
 *   fort und kamen nicht wieder.
 *
 * KEIN jsdom (CI installiert nur papaparse): der Ersatz unten kann
 * genau das, was app-calculator.js an einem Eingabefeld anfasst.
 * KEINE LIVEDATEN.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(WURZEL, 'js', 'app-calculator.js'), 'utf8');

const KLASSE = 'calc-input-geklemmt';

function feld(wert) {
    return {
        value: String(wert),
        _klassen: new Set(),
        _attr: {},
        classList: {
            add(c) { this._s.add(c); },
            remove(c) { this._s.delete(c); },
            contains(c) { return this._s.has(c); }
        },
        setAttribute(k, v) { this._attr[k] = v; },
        removeAttribute(k) { delete this._attr[k]; },
        addEventListener() {}
    };
}

function anzeige() {
    return { textContent: '', className: '', classList: { add() {}, remove() {} } };
}

/**
 * app-calculator.js in der Ersatzumgebung starten.
 * `start` sind die vier Feldinhalte; das Modul rechnet beim Laden einmal.
 */
function starten(start, sprache) {
    const k = {
        'calc-deck-size': feld(start.deck),
        'calc-copies': feld(start.kopien),
        'calc-drawn': feld(start.gezogen),
        'calc-in-hand': feld(start.hand),
        'res-draw': anzeige(),
        'res-prize': anzeige(),
        'res-topdeck': anzeige(),
        'calc-fuss-draw': anzeige(),
        'calc-fuss-prize': anzeige(),
        'calc-fuss-topdeck': anzeige()
    };
    Object.keys(k).forEach(id => {
        if (k[id].classList) k[id].classList._s = k[id]._klassen || new Set();
    });
    /* Die Beschriftungen, wie index.html sie fuehrt — der Hinweis nennt
     * das Feld beim Namen, und der Name steht im <label for=...>. */
    const beschriftung = {
        'calc-deck-size': 'Karten im Deck',
        'calc-copies': 'Kopien im Deck',
        'calc-drawn': 'Gezogene Karten',
        'calc-in-hand': 'Bereits auf der Hand'
    };
    const params = { kinder: [], appendChild(el) { this.kinder.push(el); } };
    const dok = {
        readyState: 'complete',
        getElementById: (id) => k[id] || params.kinder.find(e => e.id === id) || null,
        querySelector: (sel) => {
            const m = sel.match(/^label\[for="([\w-]+)"\]$/);
            if (m) return beschriftung[m[1]] ? { textContent: beschriftung[m[1]] } : null;
            if (sel === '#calculator .calc-params') return params;
            return null;
        },
        querySelectorAll: () => [],
        createElement: () => ({ id: '', className: '', textContent: '',
                                setAttribute() {}, appendChild() {} }),
        addEventListener() {}
    };
    const sb = {
        console: { warn() {} },
        Math, Number, String, Array, Object, JSON, Boolean, Error,
        parseInt, parseFloat, isNaN, setTimeout, clearTimeout,
        document: dok,
        getLang: () => (sprache || 'de')
    };
    sb.window = sb;
    vm.createContext(sb);
    vm.runInContext(SRC, sb, { filename: 'app-calculator.js' });
    return {
        k, sb,
        rechne: () => sb.window.updateCalculations(),
        hinweis: () => params.kinder.find(e => e.id === 'calc-vorgabe-hinweis') || null
    };
}

const werte = (k) => ({
    deck: k['calc-deck-size'].value,
    kopien: k['calc-copies'].value,
    gezogen: k['calc-drawn'].value,
    hand: k['calc-in-hand'].value
});

/* ══════════════════════════════════════════════════════════════════ */

describe('B9/F13.3b — ein leeres Feld rechnet nicht heimlich weiter', () => {
    it('das leere Feld wird NICHT ueberschrieben — dort tippt gerade jemand', () => {
        const { k } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 });
        assert.equal(k['calc-deck-size'].value, '',
            'wer 60 loescht, um 59 zu tippen, bekaeme die 60 im selben Tastendruck zurueck. '
            + 'Der Ausfall ist die Stille, nicht der Ersatzwert.');
        assert.ok(!k['calc-deck-size'].classList.contains(KLASSE),
            'eine Klemm-Markierung waehrend des Tippens ist Laerm');
    });

    it('aber das Feld sagt, mit welcher Zahl gerechnet wurde', () => {
        const { k } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 });
        const titel = String(k['calc-deck-size']._attr.title || '');
        assert.match(titel, /60/, 'der Titel nennt die verwendete Zahl nicht: ' + JSON.stringify(titel));
        assert.match(titel, /leer/i);
    });

    it('und eine sichtbare Zeile nennt das Feld beim Namen', () => {
        const { k, hinweis } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 });
        assert.ok(hinweis(), 'es gibt gar keine Hinweiszeile — ein title-Attribut allein '
            + 'erreicht niemanden, der nicht mit der Maus darueber faehrt');
        assert.match(hinweis().textContent, /Karten im Deck = 60/,
            'Zeile: ' + JSON.stringify(hinweis().textContent));
        assert.equal(k['calc-deck-size'].value, '');
    });

    it('mehrere leere Felder werden alle genannt', () => {
        const { hinweis } = starten({ deck: '', kopien: '', gezogen: 7, hand: 0 });
        const txt = hinweis().textContent;
        assert.match(txt, /Karten im Deck = 60/, txt);
        assert.match(txt, /Kopien im Deck = 1/, txt);
    });

    it('sobald wieder etwas dasteht, verschwindet die Zeile', () => {
        const { k, rechne, hinweis } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 });
        assert.ok(hinweis().textContent.length > 0);
        k['calc-deck-size'].value = '59';
        rechne();
        assert.equal(hinweis().textContent, '', 'ein Hinweis ohne Anlass');
        assert.equal(k['calc-deck-size']._attr.title, undefined, 'der Titel klebt');
    });

    it('ein ausgefuelltes Feld wird nicht angefasst', () => {
        const { k, hinweis } = starten({ deck: 60, kopien: 4, gezogen: 7, hand: 0 });
        assert.deepEqual(werte(k), { deck: '60', kopien: '4', gezogen: '7', hand: '0' });
        assert.ok(!k['calc-deck-size'].classList.contains(KLASSE), 'grundlos markiert');
        assert.equal(k['calc-deck-size']._attr.title, undefined);
        assert.equal(hinweis(), null, 'eine Zeile ohne Anlass wird gar nicht erst angelegt');
    });

    it('das Ergebnis passt zu dem, was die Hinweiszeile sagt', () => {
        const { k } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 });
        assert.match(k['calc-fuss-draw'].textContent, /^4 von 60 Karten, 7 gezogen$/,
            'Fusszeile: ' + JSON.stringify(k['calc-fuss-draw'].textContent));
    });

    it('auf Englisch sagt die Zeile dasselbe', () => {
        const { hinweis } = starten({ deck: '', kopien: 4, gezogen: 7, hand: 0 }, 'en');
        assert.match(hinweis().textContent, /Empty field/);
        assert.ok(!/Leeres Feld/.test(hinweis().textContent), 'deutscher Satz im englischen Modus');
    });
});

describe('B21/F13.3c — eine Grenze aus einem anderen Feld loescht keine Eingabe', () => {
    it('Deck 1 laesst Kopien, Zuege und Handkarten stehen', () => {
        const { k } = starten({ deck: 1, kopien: 4, gezogen: 7, hand: 2 });
        assert.deepEqual(werte(k), { deck: '1', kopien: '4', gezogen: '7', hand: '2' },
            'die Kaskade hat wieder alle vier Felder auf 1 gesetzt');
    });

    it('und sie gelten wieder, sobald die Deckgroesse es zulaesst', () => {
        const { k, rechne } = starten({ deck: 1, kopien: 4, gezogen: 7, hand: 2 });
        k['calc-deck-size'].value = '60';
        rechne();
        assert.deepEqual(werte(k), { deck: '60', kopien: '4', gezogen: '7', hand: '2' },
            'genau das war der Befund: die eingegebenen Zahlen kamen nicht wieder');
    });

    it('gerechnet wird trotzdem mit dem geklemmten Wert, und er steht daneben', () => {
        const { k } = starten({ deck: 1, kopien: 4, gezogen: 7, hand: 2 });
        assert.match(k['calc-fuss-draw'].textContent, /^1 von 1 Karten, 1 gezogen$/,
            'die Fusszeile muss die WIRKLICH verwendeten Zahlen nennen — sonst waere das '
            + 'Stehenlassen der Eingabe nur eine zweite Art zu schweigen. Fusszeile: '
            + JSON.stringify(k['calc-fuss-draw'].textContent));
        assert.ok(k['calc-copies'].classList.contains(KLASSE), 'das Feld ist nicht markiert');
        assert.match(String(k['calc-copies']._attr.title || ''), /4/,
            'der Titel nennt die Eingabe nicht: ' + JSON.stringify(k['calc-copies']._attr.title));
        assert.match(String(k['calc-copies']._attr.title || ''), /gerechnet wird mit 1/);
    });

    it('eine eigene Untergrenze wird weiterhin ins Feld geschrieben', () => {
        // 0 Kopien sind keine Frage der Deckgroesse, sondern schlicht keine
        // gueltige Eingabe. Die 20.08.2026er Zusage gilt dort unveraendert.
        const { k } = starten({ deck: 60, kopien: 0, gezogen: 7, hand: 0 });
        assert.equal(k['calc-copies'].value, '1',
            'eine absolute Untergrenze gehoert ins Feld: mit 0 wird nie gerechnet');
        assert.ok(k['calc-copies'].classList.contains(KLASSE));
    });

    it('und die eigene Obergrenze der Deckgroesse ebenfalls', () => {
        const { k } = starten({ deck: 400, kopien: 4, gezogen: 7, hand: 0 });
        assert.equal(k['calc-deck-size'].value, '99',
            '99 ist die eigene Grenze des Feldes, nicht die eines anderen');
    });

    it('die Markierung verschwindet wieder, sobald die Eingabe passt', () => {
        const { k, rechne } = starten({ deck: 60, kopien: 0, gezogen: 7, hand: 0 });
        k['calc-copies'].value = '4';
        rechne();
        assert.ok(!k['calc-copies'].classList.contains(KLASSE), 'Markierung klebt');
        assert.equal(k['calc-copies']._attr.title, undefined, 'Titel klebt');
    });

    it('auf Englisch sagt der Titel dasselbe', () => {
        const { k } = starten({ deck: 1, kopien: 4, gezogen: 7, hand: 2 }, 'en');
        const titel = String(k['calc-copies']._attr.title || '');
        assert.match(titel, /the calculation uses 1/, 'Titel: ' + JSON.stringify(titel));
        assert.ok(!/gerechnet/.test(titel), 'deutscher Satz im englischen Modus');
    });
});

/* ══ B25/F13.3d — die Nachkommastelle verschwand lautlos ═══════════ */

describe('B25/F13.3d — was im Feld steht, ist auch das, womit gerechnet wird', () => {
    /* BEFUND 07.09.2026: getInputNumber() liest mit parseInt. Feld "6.5"
     * ergab 6, und weil 6 im gueltigen Bereich liegt, war roh === wert —
     * der Zweig am Ende von leseUndKlemme() nahm den Titel WEG. Auf dem
     * Bildschirm stand 6.5, gerechnet wurde mit 6, und nichts sagte es. */

    it('gerechnet wird mit der ganzen Zahl — das war nie der Streitpunkt', () => {
        const { k } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 });
        assert.equal(k['calc-drawn'].value, '6.5',
            'die Eingabe wird nicht ueberschrieben — dort tippt gerade jemand');
    });

    it('das Feld sagt im Titel, mit welcher Zahl gerechnet wurde', () => {
        const { k } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 });
        const titel = String(k['calc-drawn']._attr.title || '');
        assert.notEqual(titel, '',
            'ohne Titel steht 6.5 im Feld und 6 in der Rechnung, und nichts sagt es');
        assert.match(titel, /6\.5/, 'Titel: ' + JSON.stringify(titel));
        assert.match(titel, /gerechnet wird mit 6\b/, 'Titel: ' + JSON.stringify(titel));
    });

    it('und das Feld wird sichtbar markiert, wie beim Klemmen', () => {
        const { k } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 });
        assert.ok(k['calc-drawn'].classList.contains(KLASSE),
            'ein Titel allein faellt niemandem auf, der nicht mit der Maus darauf zeigt');
    });

    it('die Hinweiszeile unter den Feldern nennt Feld, Eingabe und Ergebnis', () => {
        const { hinweis } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 });
        const z = hinweis();
        assert.ok(z, 'es gibt gar keine Hinweiszeile');
        assert.match(z.textContent, /Keine ganze Zahl/, z.textContent);
        assert.match(z.textContent, /Gezogene Karten 6\.5 → 6/,
            'die Zeile nennt beide Zahlen nicht: ' + JSON.stringify(z.textContent));
    });

    it('auf Englisch derselbe Satz auf Englisch', () => {
        const { k, hinweis } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 }, 'en');
        assert.match(String(k['calc-drawn']._attr.title || ''), /the calculation uses 6\b/);
        assert.match(hinweis().textContent, /Not a whole number/);
        assert.ok(!/Keine ganze Zahl/.test(hinweis().textContent), hinweis().textContent);
    });

    it('eine ganze Zahl loest nichts davon aus', () => {
        const { k, hinweis } = starten({ deck: 60, kopien: 4, gezogen: '7', hand: 0 });
        assert.equal(k['calc-drawn']._attr.title, undefined,
            'ein Hinweis ohne Anlass: ' + JSON.stringify(k['calc-drawn']._attr.title));
        assert.ok(!k['calc-drawn'].classList.contains(KLASSE));
        const z = hinweis();
        assert.ok(!z || z.textContent === '', 'Zeile ohne Anlass: ' + (z && z.textContent));
    });

    it('ein Komma als Dezimaltrenner wird genauso erkannt', () => {
        // Ein deutsches Zahlenfeld bekommt "6,5" getippt. parseInt macht
        // daraus ebenfalls 6 — der Fall darf nicht durchrutschen, nur weil
        // das Trennzeichen ein anderes ist.
        const { k } = starten({ deck: 60, kopien: 4, gezogen: '6,5', hand: 0 });
        assert.match(String(k['calc-drawn']._attr.title || ''), /gerechnet wird mit 6\b/,
            'Titel: ' + JSON.stringify(k['calc-drawn']._attr.title));
    });

    it('die Markierung verschwindet, sobald eine ganze Zahl dasteht', () => {
        const { k, rechne } = starten({ deck: 60, kopien: 4, gezogen: '6.5', hand: 0 });
        k['calc-drawn'].value = '7';
        rechne();
        assert.ok(!k['calc-drawn'].classList.contains(KLASSE), 'Markierung klebt');
        assert.equal(k['calc-drawn']._attr.title, undefined, 'Titel klebt');
    });

    it('leeres Feld und abgeschnittenes Feld stehen beide in der Zeile', () => {
        const { hinweis } = starten({ deck: '', kopien: 4, gezogen: '6.5', hand: 0 });
        const t = hinweis().textContent;
        assert.match(t, /Leeres Feld/, t);
        assert.match(t, /Keine ganze Zahl/,
            'der zweite Grund faellt unter den Tisch: ' + JSON.stringify(t));
    });
});
