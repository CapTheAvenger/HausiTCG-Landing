/**
 * DIE SCHRIFT AM ZAEHLER IST DER AUSLOESER, NICHT NUR EINE ANZEIGE
 *
 * BEFUND (Mutationslauf 07.09.2026). Streicht man in
 * `updateDeckDisplay` (js/app-deck-builder.js) die Zeile
 *
 *     countEl.textContent = total;
 *
 * ersatzlos, bleibt die gesamte JS-Suite gruen. Keine einzige
 * Zusicherung faellt um.
 *
 * Das ist keine Kleinigkeit. An genau dieser Schrift haengt die
 * Sichtbarkeit des gebauten Decks: der MutationObserver in
 * index.html beobachtet den Text von `#<quelle>DeckCount` und nimmt
 * erst dann `d-none` von "Dein Deck" und der Kennzahlenleiste. Ohne
 * die Schrift meldet der Toast "60/60 Karten", der Autospeicher hat
 * sie, `window.cityLeagueDeck` traegt sie — und der Nutzer sieht
 * nichts. Genau dieser Zustand wurde am 07.09.2026 live gemessen
 * (QA-A F3.28/F4.51) und in tests/unit/test-bau-anzeige-ohne-frame.js
 * am AUFRUF festgemacht: die dortigen Zusicherungen stubben
 * `updateDeckDisplay` und pruefen nur, DASS es gerufen wird. Was es
 * schreibt, hat bis heute niemand nachgemessen.
 *
 * Hier laeuft deshalb die ECHTE Funktion, aus dem Quelltext gezogen
 * und an der Klammer abgezaehlt. Alles, was sie von aussen anfasst,
 * wird hereingereicht und protokolliert nur. Gemessen wird, was in
 * den Zaehler geschrieben wird.
 *
 * KEINE DATEI AUS data/ WIRD GELESEN. Die Decks hier sind erfunden;
 * gemessen wird die Rechnung der Oberflaeche, nicht ein Kartenbestand.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { describe, it } = require('node:test');

const WURZEL = path.join(__dirname, '..', '..');
const BAUER = fs.readFileSync(path.join(WURZEL, 'js', 'app-deck-builder.js'), 'utf8');

/* Zieht eine benannte Funktion samt Kopf aus dem Quelltext, an der
   geschweiften Klammer gezaehlt. */
function funktion(kopf) {
    const a = BAUER.indexOf(kopf);
    assert.ok(a >= 0, `nicht gefunden: ${kopf}`);
    let tiefe = 0;
    for (let j = BAUER.indexOf('{', a); j < BAUER.length; j++) {
        if (BAUER[j] === '{') tiefe++;
        else if (BAUER[j] === '}') { tiefe--; if (tiefe === 0) return BAUER.slice(a, j + 1); }
    }
    throw new Error(`unbalancierte Klammern in ${kopf}`);
}

/* Ein Element, das jede Schrift mitschreibt — auch die Reihenfolge,
   damit "zuletzt geschrieben" pruefbar bleibt. */
function element(id) {
    const el = {
        id,
        _text: null,
        klassen: new Set(),
        classList: {
            add: (...c) => c.forEach(x => el.klassen.add(x)),
            remove: (...c) => c.forEach(x => el.klassen.delete(x)),
            contains: (c) => el.klassen.has(c)
        },
        parentElement: null
    };
    el.parentElement = {
        klassen: new Set(),
        classList: {
            add: (...c) => c.forEach(x => el.parentElement.klassen.add(x)),
            remove: (...c) => c.forEach(x => el.parentElement.klassen.delete(x))
        }
    };
    Object.defineProperty(el, 'textContent', {
        get() { return el._text; },
        set(v) { el._text = v; }
    });
    return el;
}

/* Fuehrt das ECHTE updateDeckDisplay fuer eine Quelle aus und gibt
   zurueck, was in der Oberflaeche gelandet ist. */
function fahre(quelle, deck, ids) {
    const knoten = {};
    Object.values(ids).forEach(id => { knoten[id] = element(id); });

    const welt = {
        cityLeagueDeck: {}, currentMetaDeck: {}, pastMetaDeck: {},
        cityLeagueDeckOrder: [], currentMetaDeckOrder: [], pastMetaDeckOrder: [],
        currentCityLeagueArchetype: null, currentMetaArchetype: null,
        pastMetaCurrentArchetype: null
    };
    welt[quelle + 'Deck'] = deck;

    const gespeichert = [];
    const gitter = [];
    const nachgezogen = [];
    const speicher = {};

    const code = funktion('        function updateDeckDisplay(source) {')
        + '\nreturn updateDeckDisplay(source);';

    new Function(
        'source', 'window', 'document', 't',
        'normalizeDeckEntries', 'saveCityLeagueDeck', 'saveCurrentMetaDeck', 'savePastMetaDeck',
        'getIndexedCardBySetNumber', 'cardsBySetNumberMap', 'cardIndexMap',
        'parseLocaleNumber', 'zahlLokal', 'renderMyDeckGrid',
        'scheduleDeckDependentRefresh', 'localStorage',
        code
    )(
        quelle, welt,
        { getElementById: (id) => knoten[id] || null },
        (k) => k,
        () => false,
        () => gespeichert.push('cityLeague'),
        () => gespeichert.push('currentMeta'),
        () => gespeichert.push('pastMeta'),
        () => null, null, null,
        (s) => parseFloat(String(s).replace(',', '.')) || 0,
        (n, k) => n.toFixed(k).replace('.', ','),
        (s) => gitter.push(s),
        (s) => nachgezogen.push(s),
        {
            setItem: (k, v) => { speicher[k] = v; },
            removeItem: (k) => { delete speicher[k]; }
        }
    );

    return { knoten, gespeichert, gitter, nachgezogen, speicher };
}

const IDS = {
    cityLeague: {
        count:  'cityLeagueDeckCount',
        unique: 'cityLeagueDeckCountUnique',
        price:  'cityLeagueDeckPrice',
        visual: 'cityLeagueMyDeckVisual'
    },
    currentMeta: {
        count:  'currentMetaDeckCount',
        unique: 'currentMetaDeckCountUnique',
        price:  'currentMetaDeckPrice',
        visual: 'currentMetaMyDeckVisual'
    },
    pastMeta: {
        count:  'pastMetaDeckCount',
        unique: 'pastMetaDeckCountUnique',
        price:  'pastMetaDeckPrice',
        visual: 'pastMetaMyDeckVisual'
    }
};

describe('updateDeckDisplay schreibt den Zaehler wirklich', () => {

    it('60 Karten in drei Zeilen ergeben die Schrift "60" im Zaehler', () => {
        const deck = { 'Excadrill (PBL 12)': 4, 'Basis-Kampf-Energie (SVE 8)': 12, 'Arven (PAF 235)': 44 };
        const { knoten } = fahre('cityLeague', deck, IDS.cityLeague);
        assert.strictEqual(String(knoten.cityLeagueDeckCount.textContent), '60',
            'ohne diese Schrift feuert der MutationObserver in index.html nicht, '
            + 'und das fertige Deck bleibt unsichtbar');
    });

    it('ein leeres Deck schreibt "0" — nicht gar nichts', () => {
        const { knoten } = fahre('currentMeta', {}, IDS.currentMeta);
        assert.strictEqual(String(knoten.currentMetaDeckCount.textContent), '0',
            'auch die Null ist eine Schrift; ein nie beschriebener Zaehler '
            + 'laesst die Leiste fuer immer verborgen');
    });

    it('die Zahl ist die Summe der Anzahlen, nicht die Zahl der Zeilen', () => {
        const deck = { 'A (X 1)': 4, 'B (X 2)': 3 };
        const { knoten } = fahre('pastMeta', deck, IDS.pastMeta);
        assert.strictEqual(String(knoten.pastMetaDeckCount.textContent), '7');
        assert.strictEqual(knoten.pastMetaDeckCountUnique.textContent, '(2 deck.uniqueLabel)',
            'daneben steht die Zahl der verschiedenen Karten');
    });

    it('ueber 60 Karten faerbt der Zaehler rot — und traegt trotzdem die Zahl', () => {
        const deck = { 'A (X 1)': 61 };
        const { knoten } = fahre('currentMeta', deck, IDS.currentMeta);
        assert.strictEqual(String(knoten.currentMetaDeckCount.textContent), '61');
        assert.ok(knoten.currentMetaDeckCount.klassen.has('color-red'),
            'ein Deck ueber 60 muss sichtbar auffallen');
        assert.ok(knoten.currentMetaMyDeckVisual.klassen.has('border-3-red'));
    });

    it('unter 60 Karten wird die rote Warnung wieder abgeraeumt', () => {
        const deck = { 'A (X 1)': 4 };
        const { knoten } = fahre('currentMeta', deck, IDS.currentMeta);
        assert.ok(!knoten.currentMetaDeckCount.klassen.has('color-red'));
        assert.ok(!knoten.currentMetaMyDeckVisual.klassen.has('border-3-red'));
    });

    /* Die Kette dahinter: Zaehler schreiben, Gitter zeichnen,
       nachziehen. Faellt eines davon weg, sieht der Nutzer ein halb
       gezeichnetes Deck. */
    it('nach dem Zaehler wird das Deckgitter gezeichnet und nachgezogen', () => {
        const { gitter, nachgezogen } = fahre('cityLeague', { 'A (X 1)': 4 }, IDS.cityLeague);
        assert.deepStrictEqual(gitter, ['cityLeague']);
        assert.deepStrictEqual(nachgezogen, ['cityLeague']);
    });

    it('eine fremde Quelle wird gar nicht erst gezeichnet', () => {
        const knoten = {};
        Object.values(IDS.cityLeague).forEach(id => { knoten[id] = element(id); });
        const code = funktion('        function updateDeckDisplay(source) {')
            + '\nreturn updateDeckDisplay(source);';
        const f = new Function('source', 'window', 'document', code);
        f('unsinn', {}, { getElementById: (id) => knoten[id] || null });
        assert.strictEqual(knoten.cityLeagueDeckCount.textContent, null,
            'ohne bekannte Quelle darf nichts geschrieben werden');
    });

});
