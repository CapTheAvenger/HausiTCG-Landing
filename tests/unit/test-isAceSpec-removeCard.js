/**
 * Zwei Stellen, an denen ein Deck ungueltig werden kann:
 * die Ace-Spec-Erkennung und das Entfernen einer Karte.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross und meldete `# pass 1`.
 * scripts/run-js-unit-tests.sh zaehlt leere Dateien seit dem 30.08.2026
 * nicht mehr mit und benennt sie — das hier ist die Antwort darauf.
 *
 * Die frueheren Fassungen dieser Datei hatten ein zweites Problem: sie
 * pruefte isAceSpec an einer NACHGEBAUTEN Liste im Testkasten, nicht an
 * der Funktion aus js/app-core.js. Ein solcher Test besteht auch dann,
 * wenn die echte Funktion kaputt ist. Hier laeuft die echte.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Beide Funktionen stehen unveraendert unter ihren alten Namen
 * (Stand 07.09.2026):
 *
 *   isAceSpec          js/app-core.js:2818        (auch als window.isAceSpec)
 *   removeCardFromDeck js/app-deck-builder.js:1020
 *
 * WAS AUF DEM SPIEL STEHT
 * -----------------------
 * isAceSpec liest AUSSCHLIESSLICH data/ace_specs.json (der Test setzt
 * diese Liste selbst). Ein uebersehenes Ace Spec heisst: vier Kopien
 * einer Ein-Kopie-Karte kommen ins Deck, die Liste ist ungueltig. Ein
 * faelschlich erkanntes heisst: eine gewoehnliche Karte laesst sich nur
 * einmal einlegen.
 *
 * removeCardFromDeck bekommt vom Knopf oft nur den BLOSSEN Namen,
 * waehrend im Deck der Schluessel mit Druckangabe liegt. Ohne den
 * Rueckfallweg tut der Minusknopf schlicht nichts.
 *
 * KEIN jsdom, KEINE Livedaten.
 */

const { describe, it, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');

/** Eine Funktionsdeklaration per Namen schneiden (Parameterliste zuerst). */
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

// ══════════════════════════════════════════════════════════════════
// isAceSpec — js/app-core.js
// ══════════════════════════════════════════════════════════════════

// So sieht die Liste aus, die loadAceSpecs() aus data/ace_specs.json
// baut: durchgehend kleingeschrieben. Hier gesetzt, nicht gelesen.
const LISTE = [
    'prime catcher', 'master ball', "hero's cape", 'unfair stamp',
    'secret box', 'neo upper energy', 'legacy energy', 'maximum belt',
];

function aceSpec(liste = LISTE) {
    const kasten = { aceSpecsList: liste, window: {}, String };
    vm.createContext(kasten);
    vm.runInContext(funktion(lies('app-core.js'), 'isAceSpec', 'app-core.js'), kasten);
    return kasten.isAceSpec;
}

describe('isAceSpec — die Ein-Kopie-Erkennung', () => {
    const ist = aceSpec();

    it('erkennt jeden Namen der geladenen Liste', () => {
        LISTE.forEach(n => assert.equal(ist(n), true, n));
    });

    it('die Schreibweise und Randleerzeichen des Aufrufers sind egal', () => {
        assert.equal(ist('Prime Catcher'), true);
        assert.equal(ist('PRIME CATCHER'), true);
        assert.equal(ist('  prime catcher  '), true);
    });

    it('gewoehnliche Karten sind kein Ace Spec', () => {
        ['Iono', 'Ultra Ball', "Boss's Orders", 'Charizard ex', 'Rare Candy']
            .forEach(n => assert.equal(ist(n), false, n));
    });

    it('ein Ace-Spec-Name MIT Druckangabe wird nicht erkannt', () => {
        // Dokumentierte Grenze: die Liste wird exakt verglichen, ohne
        // Normalisierung. Deshalb ruft der Deckbauer sie mit dem blossen
        // Namen auf und nicht mit dem Deckschluessel.
        assert.equal(ist('Prime Catcher (TEF 157)'), false);
    });

    it('nimmt auch ein Kartenobjekt — card_name, full_card_name oder name', () => {
        assert.equal(ist({ card_name: 'Master Ball' }), true);
        assert.equal(ist({ full_card_name: 'Master Ball' }), true);
        assert.equal(ist({ name: 'Master Ball' }), true);
        assert.equal(ist({ card_name: 'Iono' }), false);
    });

    it('card_name schlaegt name, wenn beide dastehen', () => {
        assert.equal(ist({ card_name: 'Master Ball', name: 'Iono' }), true);
        assert.equal(ist({ card_name: 'Iono', name: 'Master Ball' }), false);
    });

    it('leerer Name und ein Objekt ohne Namensfeld sind falsch', () => {
        assert.equal(ist(''), false);
        assert.equal(ist({}), false);
        assert.equal(ist({ card_name: '' }), false);
    });

    it('ist die Liste noch nicht geladen, ist NICHTS ein Ace Spec', () => {
        // Das ist der gefaehrliche Zustand: vor dem Laden von
        // data/ace_specs.json liesse sich jedes Ace Spec viermal
        // einlegen. Hier festgehalten, damit es niemand fuer "in Ordnung"
        // haelt — die Reihenfolge beim Seitenaufbau muss das verhindern.
        assert.equal(aceSpec([])('Prime Catcher'), false);
    });
});

/*
 * BEFUND vom 07.09.2026 — BEHOBEN am 07.09.2026.
 *
 *   js/app-core.js (isAceSpec), vorher:
 *   const cardName = (typeof cardNameOrCard === 'string')
 *       ? cardNameOrCard
 *       : (cardNameOrCard.card_name || … );
 *
 * `typeof null === 'object'`, also landete null im zweiten Zweig und der
 * Zugriff .card_name warf.
 *
 *   Eingabe (gemessen):  isAceSpec(null) bzw. isAceSpec(undefined)
 *   vorher:              TypeError: Cannot read properties of null (reading 'card_name')
 *   jetzt:               false
 *
 * Warum das zaehlt: die Funktion haengt als window.isAceSpec an jedem
 * Modul, und die drei Nachbarklassifizierer in js/app-utils.js —
 * isRadiantPokemon, isPrismStarCard, isBasicEnergy — vertragen null
 * anstandslos. Die naechstliegende Gefahrenstelle ist
 * js/app-deck-builder.js:5344  deckCards.filter(card => isAceSpec(card)),
 * die auf einem leeren Eintrag fiel und das automatische
 * Vervollstaendigen abbrach.
 *
 * BEHEBUNG: optionale Verkettung (cardNameOrCard?.card_name || …).
 */
test('isAceSpec(null) und isAceSpec(undefined) sind false statt zu werfen', () => {
    const ist = aceSpec();
    assert.equal(ist(null), false);
    assert.equal(ist(undefined), false);
});

// ══════════════════════════════════════════════════════════════════
// removeCardFromDeck — js/app-deck-builder.js
// ══════════════════════════════════════════════════════════════════

function bauEntferner(decks = {}) {
    const protokoll = { gespeichert: [], angezeigt: [] };
    const window = {
        cityLeagueDeck: decks.cityLeague || {},
        cityLeagueDeckOrder: Object.keys(decks.cityLeague || {}),
        currentMetaDeck: decks.currentMeta || {},
        currentMetaDeckOrder: Object.keys(decks.currentMeta || {}),
        pastMetaDeck: decks.pastMeta || {},
        pastMetaDeckOrder: Object.keys(decks.pastMeta || {}),
    };
    const kasten = {
        String, Object, Array, window,
        console: { log() {}, warn() {} },
        saveCityLeagueDeck: () => protokoll.gespeichert.push('cityLeague'),
        saveCurrentMetaDeck: () => protokoll.gespeichert.push('currentMeta'),
        savePastMetaDeck: () => protokoll.gespeichert.push('pastMeta'),
        updateDeckDisplay: (q) => protokoll.angezeigt.push(q),
    };
    vm.createContext(kasten);
    vm.runInContext(
        funktion(lies('app-deck-builder.js'), 'removeCardFromDeck', 'app-deck-builder.js'),
        kasten);
    kasten._w = window;
    kasten._protokoll = protokoll;
    return kasten;
}

describe('removeCardFromDeck — der Minusknopf an einer Deckkarte', () => {
    it('zaehlt die Karte um eins herunter', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 3 } });
        F.removeCardFromDeck('cityLeague', 'Iono (PAL 185)');
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
    });

    it('bei der letzten Kopie verschwindet der Schluessel UND die Reihenfolge', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 1, 'Ultra Ball (SVI 196)': 2 } });
        F.removeCardFromDeck('cityLeague', 'Iono (PAL 185)');
        assert.equal('Iono (PAL 185)' in F._w.cityLeagueDeck, false);
        assert.deepEqual(Array.from(F._w.cityLeagueDeckOrder), ['Ultra Ball (SVI 196)']);
    });

    it('mit dem blossen Namen wird der Schluessel MIT Druckangabe gefunden', () => {
        // Das ist der Weg, den die Knoepfe in der Uebersicht nehmen.
        const F = bauEntferner({ cityLeague: { 'Charizard ex (MEW 006)': 2 } });
        F.removeCardFromDeck('cityLeague', 'Charizard ex');
        assert.equal(F._w.cityLeagueDeck['Charizard ex (MEW 006)'], 1);
    });

    it('der Rueckfallweg trifft nur den PRAEFIX mit Klammer, nicht jeden Namensanfang', () => {
        // "Charizard" darf nicht "Charizard ex (MEW 006)" treffen —
        // sonst entfernt der Knopf an einer Karte eine andere.
        const F = bauEntferner({ cityLeague: { 'Charizard ex (MEW 006)': 2 } });
        F.removeCardFromDeck('cityLeague', 'Charizard');
        assert.equal(F._w.cityLeagueDeck['Charizard ex (MEW 006)'], 2, 'unveraendert');
    });

    it('ein Schluessel mit 0 Kopien wird uebersprungen, der naechste greift', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 0, 'Iono (PAF 237)': 2 } });
        F.removeCardFromDeck('cityLeague', 'Iono');
        assert.equal(F._w.cityLeagueDeck['Iono (PAF 237)'], 1);
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 0, 'der leere Eintrag bleibt, wie er war');
    });

    it('eine nicht vorhandene Karte veraendert nichts und speichert nicht', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 2 } });
        F.removeCardFromDeck('cityLeague', 'Rare Candy');
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
        assert.equal(F._protokoll.gespeichert.length, 0);
        assert.equal(F._protokoll.angezeigt.length, 0);
    });

    it('eine unbekannte Quelle wird abgelehnt, bevor irgendetwas passiert', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 2 } });
        F.removeCardFromDeck('quatsch', 'Iono (PAL 185)');
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
        assert.equal(F._protokoll.gespeichert.length, 0);
    });

    it('jede der drei Quellen speichert in ihren eigenen Topf', () => {
        [['cityLeague', 'cityLeagueDeck'], ['currentMeta', 'currentMetaDeck'], ['pastMeta', 'pastMetaDeck']]
            .forEach(([quelle]) => {
                const F = bauEntferner({ [quelle]: { 'Iono (PAL 185)': 1 } });
                F.removeCardFromDeck(quelle, 'Iono (PAL 185)');
                assert.deepEqual(Array.from(F._protokoll.gespeichert), [quelle]);
                assert.deepEqual(Array.from(F._protokoll.angezeigt), [quelle]);
            });
    });

    it('leerer Schluessel und null aendern nichts', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 2 } });
        F.removeCardFromDeck('cityLeague', '');
        F.removeCardFromDeck('cityLeague', null);
        assert.equal(F._w.cityLeagueDeck['Iono (PAL 185)'], 2);
        assert.equal(F._protokoll.gespeichert.length, 0);
    });

    it('zweimal die letzte Kopie entfernen ist nicht schlimmer als einmal', () => {
        const F = bauEntferner({ cityLeague: { 'Iono (PAL 185)': 1 } });
        F.removeCardFromDeck('cityLeague', 'Iono (PAL 185)');
        F.removeCardFromDeck('cityLeague', 'Iono (PAL 185)');
        assert.equal(Object.keys(F._w.cityLeagueDeck).length, 0);
        assert.equal(F._protokoll.gespeichert.length, 1, 'der zweite Klick speichert nicht noch einmal');
    });
});
