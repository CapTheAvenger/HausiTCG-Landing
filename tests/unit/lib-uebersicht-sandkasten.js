/**
 * Ein Sandkasten fuer die Kartenuebersicht der City League.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Die Befunde A2 / A-F3.13b und A-F3.11 sind reine LAUFZEIT-Befunde:
 * der Quelltext von setOverviewRarityMode() sieht vollstaendig aus, und
 * ein `assert.match(SRC, ...)` haette beide nie gesehen. Was fehlt, ist
 * ein Aufruf NACH dem Neuaufbau des Gitters — sichtbar nur, wenn man
 * das Gitter wirklich neu aufbaut und danach nachsieht, welche Kacheln
 * stehen und was im Zaehler steht.
 *
 * KEIN jsdom
 * ----------
 * Der Testschritt in .github/workflows/deploy-pages.yml installiert nur
 * papaparse (`npm install --no-save papaparse`). Ein Test, der jsdom
 * braucht, faellt dort um. Der Ersatz unten ist deshalb absichtlich
 * winzig: er kann genau das, was die Uebersichtsfunktionen anfassen —
 * getElementById, classList, textContent, querySelectorAll('.card-item')
 * und getAttribute — und nichts weiter.
 *
 * Der echte Filter kommt aus js/deck-analysis-shared.js und wird MIT
 * geladen, nicht nachgebaut: der Zaehler wird ausschliesslich dort
 * geschrieben (Zeile 100), und genau dieser Schreibvorgang ist der
 * Gegenstand von Befund A-F3.11.
 *
 * Die Datei heisst bewusst NICHT test-*.js: scripts/run-js-unit-tests.sh
 * fuehrt nur `tests/unit/test-*.js` aus, und ein Sandkasten ohne
 * Zusicherungen soll nicht als bestandene Datei mitgezaehlt werden.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');

/** Quelltext einer Datei unter js/. */
function quelle(datei) {
    return fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');
}

/**
 * Eine Funktionsdeklaration per Klammerzaehlung herausschneiden.
 * Vorbild: tests/unit/test-ace-spec-conditional.js.
 */
function funktion(src, name) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(src);
    if (!m) throw new Error('Funktion nicht gefunden: ' + name);
    const start = src.indexOf('function', m.index);
    const auf = src.indexOf('{', start);
    let tiefe = 0;
    for (let i = auf; i < src.length; i++) {
        if (src[i] === '{') tiefe++;
        else if (src[i] === '}') {
            tiefe--;
            if (tiefe === 0) return src.slice(start, i + 1);
        }
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

/** Ein Element-Ersatz mit genau den Faehigkeiten, die der Code benutzt. */
function element(id, klassen) {
    const k = new Set(klassen || []);
    return {
        id: id,
        value: '',
        textContent: '',
        innerHTML: '',
        style: {},
        _attr: {},
        classList: {
            add: (...n) => n.forEach(x => k.add(x)),
            remove: (...n) => n.forEach(x => k.delete(x)),
            contains: n => k.has(n),
            toggle: (n, an) => { if (an === undefined) { k.has(n) ? k.delete(n) : k.add(n); } else if (an) { k.add(n); } else { k.delete(n); } },
            get _menge() { return k; }
        },
        klassen: k,
        getAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attr, n) ? this._attr[n] : null; },
        setAttribute(n, v) { this._attr[n] = String(v); },
        removeAttribute(n) { delete this._attr[n]; },
        hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this._attr, n); },
        querySelector() { return null; },
        querySelectorAll() { return []; }
    };
}

/**
 * Eine Kachel, wie renderCityLeagueDeckGrid sie baut: die fuenf
 * data-Attribute, die uebersichtKachelnFiltern() liest.
 */
function kachel(o) {
    const el = element(o.id || '', ['card-item']);
    el._attr['data-card-name'] = (o.name || '').toLowerCase();
    el._attr['data-card-name-de'] = (o.nameDe || '').toLowerCase();
    el._attr['data-card-type'] = o.typ || '';
    el._attr['data-card-set'] = o.set || '';
    el._attr['data-card-number'] = o.nummer || '';
    return el;
}

/**
 * Baut die Umgebung.
 *
 * @param {object} o
 * @param {function} o.neuAufbau  wird von applyCityLeagueFilter() gerufen und
 *                                soll das Gitter neu befuellen (wie der echte
 *                                Renderer: alle Kacheln sichtbar).
 */
function sandkasten(o) {
    o = o || {};
    const knoten = {};
    const merken = (el) => { knoten[el.id] = el; return el; };

    const suchfeld = merken(element('cityLeagueOverviewSearch'));
    const zaehler = merken(element('cityLeagueCardCount'));
    const gitter = merken(element('cityLeagueDeckGrid'));
    gitter._kacheln = [];
    gitter.querySelectorAll = function (sel) {
        return sel === '.card-item' ? this._kacheln.slice() : [];
    };

    // Die Seltenheits- und Typknoepfe, so wie index.html sie ausliefert.
    merken(element('overviewRarityMin', ['btn-toggle-item', 'btn-success']));
    merken(element('overviewRarityMax', ['btn-toggle-item']));
    merken(element('overviewRarityAll', ['btn-toggle-item']));
    [['overviewTypeAll', 'all'], ['overviewTypePokemon', 'Pokemon'],
     ['overviewTypeSupporter', 'Supporter'], ['overviewTypeItem', 'Item'],
     ['overviewTypeTool', 'Tool'], ['overviewTypeStadium', 'Stadium'],
     ['overviewTypeEnergy', 'Energy'],
     ['overviewTypeSpecialEnergy', 'Special Energy'],
     ['overviewTypeAceSpec', 'Ace Spec']].forEach(([id, _typ], i) => {
        merken(element(id, i === 0 ? ['city-league-type-btn', 'active'] : ['city-league-type-btn']));
    });

    const dok = {
        getElementById(id) { return knoten[id] || null; },
        querySelectorAll() { return []; }
    };

    const fenster = {
        document: dok,
        console: { info() {}, warn() {}, log() {}, error() {} },
        getLang: () => 'de',
        cityLeagueDeck: {},
        // setOverviewRarityMode() baut nur neu auf, wenn ein Deck geladen
        // ist — sonst merkt es sich den Modus fuer spaeter.
        currentCityLeagueDeckCards: o.karten || [{ card_name: 'Platzhalter' }],
        _rufe: []
    };
    fenster.window = fenster;

    const kasten = {
        window: fenster,
        document: dok,
        console: fenster.console,
        Math, Number, String, Array, Object, Set, Map, Boolean, JSON,
        getLang: fenster.getLang,
        t: (k) => (k === 'cl.cards' ? 'Karten' : k),
        devLog() {},
        debugVersionSelectionLog() {},
        globalRarityPreference: null,
        overviewRarityMode: 'min',
        overviewCardTypeFilter: 'all',
        updateDeckDisplay() { fenster._rufe.push('updateDeckDisplay'); }
    };
    kasten.globalThis = kasten;
    vm.createContext(kasten);

    // Der echte gemeinsame Filter — inklusive der Zeile, die den
    // Zaehler schreibt (js/deck-analysis-shared.js:100).
    vm.runInContext(quelle('deck-analysis-shared.js'), kasten);

    // applyCityLeagueFilter baut das Gitter neu auf. Der Ersatz hier tut
    // genau das, was der echte Renderer tut: er schreibt frische
    // Kacheln OHNE d-none in den Container. Alles andere daran
    // (Anteilsfilter, Tabellenansicht, Kachelinhalt) ist fuer die
    // beiden Befunde ohne Belang.
    kasten.applyCityLeagueFilter = function () {
        fenster._rufe.push('applyCityLeagueFilter');
        gitter._kacheln = (o.neuAufbau ? o.neuAufbau(kasten.overviewRarityMode) : []);
        // Der echte Zaehlerschreiber aus applyCityLeagueFilter():
        // die Zahl der EINDEUTIGEN Karten, nicht der Kacheln.
        zaehler.textContent = `${o.eindeutig != null ? o.eindeutig : gitter._kacheln.length} Karten`;
    };

    const src = quelle('app-city-league.js');
    ['filterOverviewCards', 'setOverviewCardTypeFilter', 'setOverviewRarityMode']
        .forEach(n => vm.runInContext(funktion(src, n), kasten));

    return { kasten, fenster, dok, knoten, gitter, zaehler, suchfeld, element, kachel };
}

module.exports = { sandkasten, funktion, quelle, element, kachel, WURZEL };
