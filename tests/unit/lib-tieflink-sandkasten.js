/**
 * Ein Sandkasten fuer die Tieflink-Wegfindung aus js/inline-init.js.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Die unabhaengige Abnahme am 07.09.2026 hat gemessen, dass die
 * Tieflink-Tests bis dahin fast ausschliesslich den QUELLTEXT gegriffen
 * haben (`assert.match(SRC, ...)`). Drei Mutationen ueberlebten deshalb
 * beide vollen Suiten:
 *
 *   M5   `if (false && typeof window.Quellen.ids === 'function')`
 *        — die Zeichenkette steht weiter im Quelltext, der Test bleibt
 *          gruen, die Laufzeitabfrage ist tot.
 *   M17  die Selbstbezugs-Wache `PROFILE_SUBTAB_FOR_HASH[k] !== k`
 *   M18  die `routetGerade`-Sperre in schreibeProfilHash()
 *
 * Gegen alle drei hilft nur: den Code AUSFUEHREN und das Ergebnis
 * ansehen. Dieser Sandkasten tut genau das.
 *
 * KEIN jsdom
 * ----------
 * Der Testschritt in .github/workflows/deploy-pages.yml installiert nur
 * papaparse (`npm install --no-save papaparse`). Ein Test, der jsdom
 * braucht, faellt dort um. Der Ersatz unten ist deshalb absichtlich
 * winzig — er kann genau das, was der Tieflink-Block anfasst, und
 * nichts weiter. Vorbild: tests/unit/test-pocket-verhalten.js.
 *
 * Die Datei heisst bewusst NICHT test-*.js: scripts/run-js-unit-tests.sh
 * fuehrt nur `tests/unit/test-*.js` aus, und ein Sandkasten ohne
 * Zusicherungen soll nicht als bestandene Datei mitgezaehlt werden.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'inline-init.js'), 'utf8');
const MARKUP = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

/** Die Reiter, die es im echten Markup wirklich gibt — nicht abgeschrieben. */
const REITER_IDS = [...MARKUP.matchAll(/id="([a-z-]+)"\s+class="tab-content[^"]*"/g)]
    .map(m => m[1]);

/** Die Profil-Untertabs aus dem echten Markup, ohne den Praefix. */
const UNTERTAB_IDS = [...MARKUP.matchAll(/id="profile-([a-z-]+)"\s+class="profile-tab-content[^"]*"/g)]
    .map(m => m[1]);

/** Quelltext eines benannten Blocks per Klammerzaehlung herausschneiden. */
function ausschnitt(marke) {
    const start = QUELLE.indexOf(marke);
    assert.ok(start >= 0, 'nicht gefunden in js/inline-init.js: ' + marke);
    let tiefe = 0;
    for (let j = QUELLE.indexOf('{', start); j < QUELLE.length; j++) {
        if (QUELLE[j] === '{') tiefe++;
        else if (QUELLE[j] === '}') {
            tiefe--;
            if (tiefe === 0) return QUELLE.slice(start, j + 1);
        }
    }
    assert.fail(marke + ': die Klammern gehen nicht auf');
}

function element(id) {
    const klassen = new Set(id === 'profile' || REITER_IDS.includes(id) ? ['tab-content'] : []);
    return {
        id: id,
        style: {},
        innerText: '',
        textContent: '',
        classList: {
            add: k => klassen.add(k),
            remove: k => klassen.delete(k),
            contains: k => klassen.has(k)
        },
        querySelector: () => null,
        querySelectorAll: () => []
    };
}

/**
 * Baut den Sandkasten.
 *
 * @param {object} [wahl]
 * @param {string} [wahl.hash]     Anfangsadresse, z. B. '#wishlist'
 * @param {object} [wahl.quellen]  Ersatz fuer window.Quellen
 * @param {boolean} [wahl.ohneMeldung] showNotification nicht bereitstellen
 */
function sandkasten(wahl) {
    wahl = wahl || {};
    const protokoll = {
        reiter: [],          // Argumente von switchTab()
        menue: [],           // Argumente von switchTabAndUpdateMenu()
        untertab: [],        // Argumente von switchProfileTab()
        quellenOffen: [],    // Argumente von Quellen.open()
        verlauf: [],         // ['push'|'replace', url]
        warnungen: [],
        meldungen: []
    };

    const knoten = {};
    const dok = {
        documentElement: { classList: { add() {}, remove() {} } },
        body: { appendChild() {} },
        readyState: 'complete',
        getElementById(id) {
            if (knoten[id]) return knoten[id];
            // Nur echte Reiter (und die Kopfzeilen-Knoten) existieren —
            // sonst liefe die Wache "kein Element fuer diesen Reiter" leer.
            if (REITER_IDS.includes(id) ||
                id === 'current-tab-title' || id === 'mainMenuDropdown' ||
                id === 'mainMenuTrigger' || id.indexOf('menu-btn-') === 0) {
                knoten[id] = element(id);
                return knoten[id];
            }
            return null;
        },
        querySelector(sel) {
            if (sel === '.tab-content.active') return dok.getElementById(fenster.__aktiverReiter || 'current-meta');
            return null;
        },
        querySelectorAll() { return []; },
        addEventListener() {}
    };

    const hoerer = {};
    const fenster = {
        document: dok,
        __appResourcesSettled: false,
        __aktiverReiter: 'current-meta',
        location: {
            hash: wahl.hash || '',
            pathname: '/',
            search: ''
        },
        addEventListener(art, f) { (hoerer[art] = hoerer[art] || []).push(f); },
        requestAnimationFrame() { /* der Untertab-Wechsel wird hier nicht geprueft */ }
    };
    fenster.window = fenster;

    function uebernimm(url) {
        const i = String(url).indexOf('#');
        fenster.location.hash = i >= 0 ? String(url).slice(i) : '';
    }
    fenster.history = {
        get length() { return protokoll.verlauf.filter(e => e[0] === 'push').length + 1; },
        pushState(_z, _t, url) { protokoll.verlauf.push(['push', url]); uebernimm(url); },
        replaceState(_z, _t, url) { protokoll.verlauf.push(['replace', url]); uebernimm(url); }
    };

    if (wahl.quellen) fenster.Quellen = wahl.quellen;
    fenster.switchProfileTab = t => protokoll.untertab.push(t);

    const kontext = {
        window: fenster,
        document: dok,
        URLSearchParams: URLSearchParams,
        setTimeout: (f) => { try { f(); } catch (_e) {} },
        requestAnimationFrame: fenster.requestAnimationFrame,
        console: {
            warn: (...a) => protokoll.warnungen.push(a.join(' ')),
            error: (...a) => protokoll.warnungen.push(a.join(' ')),
            log() {}
        },
        // Bare Globals, die der Block anfasst.
        switchTab: t => { protokoll.reiter.push(t); fenster.__aktiverReiter = t; },
        syncMenuClustersForTab() {},
        getLang: () => 'de'
    };
    if (!wahl.ohneMeldung) {
        kontext.showNotification = (text, art) => protokoll.meldungen.push([text, art]);
        fenster.showNotification = kontext.showNotification;
    }
    fenster.switchTab = kontext.switchTab;

    vm.createContext(kontext);
    // Reihenfolge wie in der Datei: erst die Funktionen, dann der Block,
    // der sie benutzt.
    vm.runInContext(
        ausschnitt('function switchTabAndUpdateMenu(tabId)') + '\n' +
        ausschnitt('function openProfileSection(subTab)') + '\n' +
        '(' + ausschnitt('function setupHashDeepLink()') + ')();',
        kontext, { filename: 'inline-init-tieflink.js' });

    // switchTabAndUpdateMenu ueber window erreichbar machen und
    // mitprotokollieren, ohne das Original zu ersetzen.
    const echtesMenue = kontext.switchTabAndUpdateMenu;
    kontext.switchTabAndUpdateMenu = function (t) {
        protokoll.menue.push(t);
        return echtesMenue.apply(null, arguments);
    };
    fenster.switchTabAndUpdateMenu = kontext.switchTabAndUpdateMenu;

    return {
        protokoll,
        kontext,
        fenster,
        /** Adresse setzen und den hashchange-Zuhoerer ausloesen. */
        gehZu(hash) {
            fenster.location.hash = hash;
            (hoerer.hashchange || []).forEach(f => f());
        },
        /** Den Startlauf ausloesen (app:ui-ready). */
        start() {
            (hoerer['app:ui-ready'] || []).forEach(f => f());
        },
        /** Zurueck-Knopf nachstellen. */
        zurueck() {
            (hoerer.popstate || []).forEach(f => f());
        },
        hash() { return fenster.location.hash; }
    };
}

module.exports = { sandkasten, ausschnitt, QUELLE, REITER_IDS, UNTERTAB_IDS };
