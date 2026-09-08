'use strict';
/**
 * BEFUND B2 DER NACHPRUEFUNG (07.09.2026): TEILWISSEN, ALS VOLLES WISSEN
 * GESCHRIEBEN.
 *
 * `cmAeltesteQuelle()` hiess "die aelteste Quelle" und uebersprang jede
 * Quelle, fuer die data_stand.json kein Datum fuehrt. Fehlt der Eintrag
 * fuer eine der drei Dateien des Reiters, kam trotzdem eine Antwort
 * heraus — und die kann JUENGER sein als die uebergangene Datei. Der
 * Frische-Chip haette dann eine Frische behauptet, die fuer den Reiter
 * nicht gilt.
 *
 * Geprueft wird deshalb zweierlei:
 *   1. die Funktion gibt ihre Reichweite mit heraus (bekannt/gesamt und
 *      die Namen der uebergangenen Dateien),
 *   2. der Chip SCHREIBT diese Reichweite hin — "aelteste von 3 Quellen"
 *      bzw. "aelteste der 2 von 3 Quellen mit Stand", mit den Namen der
 *      uebergangenen Dateien im Titel.
 *
 * KEINE LIVE-DATEN. Alle Staende sind hier gesetzt; die Datei liest
 * nichts aus data/.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const CM = lies('js/app-current-meta-analysis.js');

function cmStueck(marke) {
    const start = CM.indexOf(marke);
    assert.notEqual(start, -1, 'nicht gefunden in js/app-current-meta-analysis.js: ' + marke);
    let tiefe = 0;
    for (let j = CM.indexOf('{', start); j < CM.length; j++) {
        if (CM[j] === '{') tiefe++;
        else if (CM[j] === '}') { tiefe--; if (tiefe === 0) return CM.slice(start, j + 1); }
    }
    assert.fail(marke + ': die Klammern gehen nicht auf');
    return '';
}

const QUELLEN = CM.match(/var CM_STAND_QUELLEN = (\[[\s\S]*?\]);/)[1]
    .match(/'([^']+)'/g).map(x => x.slice(1, -1));

/* ── Ein DOM, das genau so viel kann, wie der Chip braucht ──────────
 *
 * Kein jsdom im Testschritt (siehe lib-dom-sandkasten.js). innerHTML
 * wird hier NICHT allgemein geparst, sondern nur die eine Form, die der
 * Chip schreibt: eine Reihe von <span>-Elementen ohne Verschachtelung.
 * Das reicht, um `.js-data-freshness` und `.cm-stand-umfang` als ZWEI
 * VERSCHIEDENE Knoten wiederzufinden — ohne diese Trennung koennte der
 * Test nicht sehen, ob der richtige Knoten beschriftet wird. */
function knoten(tag) {
    const klassen = new Set();
    const k = {
        tag, _attr: {}, _kinder: [], textContent: '',
        classList: {
            add: (...c) => c.forEach(x => klassen.add(x)),
            remove: (...c) => c.forEach(x => klassen.delete(x)),
            contains: (c) => klassen.has(c),
        },
        setAttribute: (n, v) => { k._attr[n] = String(v); },
        getAttribute: (n) => (n in k._attr ? k._attr[n] : null),
        appendChild: (kind) => { k._kinder.push(kind); return kind; },
        querySelector: (sel) => {
            const gesucht = sel.replace(/^\./, '');
            return k._kinder.find(x => x.classList.contains(gesucht)) || null;
        },
    };
    Object.defineProperty(k, 'className', {
        get: () => [...klassen].join(' '),
        set: (v) => { klassen.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => klassen.add(x)); },
    });
    Object.defineProperty(k, 'innerHTML', {
        get: () => k._html || '',
        set: (v) => {
            k._html = String(v);
            k._kinder = [];
            const re = /<span\b([^>]*)>([^<]*)<\/span>/g;
            let m;
            while ((m = re.exec(k._html)) !== null) {
                const kind = knoten('span');
                const kl = /class="([^"]*)"/.exec(m[1]);
                if (kl) kind.className = kl[1];
                kind.textContent = m[2];
                k._kinder.push(kind);
            }
        },
    });
    return k;
}

function ladeChip(staende) {
    const h2 = knoten('h2');
    const dok = {
        readyState: 'complete',
        addEventListener() {}, removeEventListener() {},
        getElementById: () => null,
        querySelectorAll: () => [],
        querySelector: (sel) => (sel === '#current-analysis .header h2' ? h2 : null),
        createElement: (tag) => knoten(tag),
    };
    const gezeichnet = [];
    const kontext = { console, document: dok, getLang: () => 'de', setTimeout, clearTimeout, Promise };
    kontext.window = kontext;
    kontext.DsDatenstand = {
        stand: (datei) => Promise.resolve(staende[datei] ? new Date(staende[datei]) : null),
        zeichne: (w) => { gezeichnet.push(w); },
    };
    vm.createContext(kontext);
    vm.runInContext('var CM_STAND_QUELLEN = ' + JSON.stringify(QUELLEN) + ';', kontext);
    vm.runInContext(cmStueck('function cmAeltesteQuelle(staende)'), kontext);
    vm.runInContext(cmStueck('function cmDatenstandChipEinhaengen(wurzel)'), kontext);
    return { kontext, h2, gezeichnet };
}

const D = (s) => new Date(s);

/* ══════════════════════════════════════════════════════════════════ */

describe('B2 — der Datenstand sagt, worueber er gilt', () => {

    it('cmAeltesteQuelle gibt seine Reichweite mit heraus', () => {
        const s = ladeChip({});
        const f = s.kontext.cmAeltesteQuelle;

        const alle = f([
            { datei: 'a', stand: D('2026-09-06T00:00:00Z') },
            { datei: 'b', stand: D('2026-09-01T00:00:00Z') },
            { datei: 'c', stand: D('2026-09-04T00:00:00Z') },
        ]);
        assert.equal(alle.datei, 'b', 'nicht die aelteste der bekannten Quellen');
        assert.equal(alle.bekannt, 3);
        assert.equal(alle.gesamt, 3);
        assert.deepEqual(Array.from(alle.ohneStand), []);

        /* DER FALL, UM DEN ES GEHT: 'c' hat keinen Stand. Die Antwort ist
           dann NICHT "die aelteste Quelle", sondern "die aelteste der
           beiden bekannten" — und 'c' kann aelter sein. */
        const teil = f([
            { datei: 'a', stand: D('2026-09-06T00:00:00Z') },
            { datei: 'b', stand: D('2026-09-01T00:00:00Z') },
            { datei: 'c', stand: null },
        ]);
        assert.equal(teil.datei, 'b');
        assert.equal(teil.bekannt, 2, 'die Zahl der beruecksichtigten Quellen fehlt');
        assert.equal(teil.gesamt, 3, 'die Zahl der gefragten Quellen fehlt');
        assert.deepEqual(Array.from(teil.ohneStand), ['c'],
            'die uebergangene Quelle wird nicht benannt — dann kann der Chip '
            + 'seine Reichweite nicht hinschreiben');

        assert.equal(f([]), null);
        assert.equal(f([{ datei: 'a', stand: null }]), null,
            'ohne bekannten Stand darf keine Quelle gewaehlt werden');
    });

    it('sind alle Quellen bekannt, nennt der Chip ihre Zahl', async () => {
        const staende = {};
        QUELLEN.forEach((f, i) => { staende[f] = '2026-09-0' + (i + 1) + 'T00:00:00Z'; });
        const s = ladeChip(staende);
        const chip = s.kontext.cmDatenstandChipEinhaengen();
        await new Promise(r => setTimeout(r, 0));

        const umfang = chip.querySelector('.cm-stand-umfang');
        assert.ok(umfang, 'der Chip hat kein Feld fuer seine Reichweite');
        assert.equal(umfang.textContent, ' (älteste von ' + QUELLEN.length + ' Quellen)',
            'der Chip sagt nicht, ueber wie viele Quellen seine Zahl gilt');
        assert.equal(chip.getAttribute('data-cm-bekannt'), String(QUELLEN.length));
        assert.equal(chip.getAttribute('data-cm-gesamt'), String(QUELLEN.length));
        assert.equal(chip.getAttribute('data-cm-quelle'), QUELLEN[0],
            'der Chip nennt nicht die aelteste Quelle');
        assert.equal(s.gezeichnet.length, 1, 'ds-datenstand.js wurde nicht gebeten zu zeichnen');
    });

    it('fehlt fuer eine Quelle der Stand, steht die Einschraenkung DA', async () => {
        const staende = {};
        QUELLEN.forEach((f, i) => { staende[f] = i === 0 ? null : ('2026-09-0' + (i + 1) + 'T00:00:00Z'); });
        const s = ladeChip(staende);
        const chip = s.kontext.cmDatenstandChipEinhaengen();
        await new Promise(r => setTimeout(r, 0));

        const umfang = chip.querySelector('.cm-stand-umfang');
        assert.ok(umfang, 'der Chip hat kein Feld fuer seine Reichweite');
        assert.equal(umfang.textContent,
            ' (älteste der ' + (QUELLEN.length - 1) + ' von ' + QUELLEN.length + ' Quellen mit Stand)',
            'der Chip verschweigt, dass er nur einen Teil der Quellen kennt');
        assert.ok(String(umfang.getAttribute('title')).includes(QUELLEN[0]),
            'die uebergangene Datei wird nicht benannt');
        assert.equal(chip.getAttribute('data-cm-bekannt'), String(QUELLEN.length - 1));
        assert.equal(chip.getAttribute('data-cm-gesamt'), String(QUELLEN.length));
        assert.equal(chip.getAttribute('data-cm-quelle'), QUELLEN[1],
            'gewaehlt wurde nicht die aelteste der Quellen MIT Stand');
    });

    it('ohne jeden Stand bleibt es bei "unbekannt" — und ohne Reichweitensatz', async () => {
        const staende = {};
        QUELLEN.forEach((f) => { staende[f] = null; });
        const s = ladeChip(staende);
        const chip = s.kontext.cmDatenstandChipEinhaengen();
        await new Promise(r => setTimeout(r, 0));
        assert.equal(chip.getAttribute('data-cm-quelle'), null,
            'ohne Stand wird trotzdem eine Quelle behauptet');
        assert.equal(chip.querySelector('.cm-stand-umfang').textContent, '',
            'der Chip behauptet eine Reichweite, obwohl er nichts kennt');
        assert.ok(chip.classList.contains('is-unbekannt'));
        assert.equal(s.gezeichnet.length, 0, 'gezeichnet wird nur mit einer echten Quelle');
    });
});
