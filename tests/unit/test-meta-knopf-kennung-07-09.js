/**
 * B1 — Der Knopf "Meta-Analyse laden" im Reiter Deck-Analyse Global
 *      trug die Kennung nicht, die js/app-meta-cards.js sucht.
 *
 * LIVE GEMESSEN AM 07.09.2026 auf thedipidis.app (Fassung
 * 202609071741-5d9ab9a):
 *
 *   Reiter "Deck-Analyse Global" (#current-analysis), Ansicht auf
 *   "Cooking" umgestellt, Knopf "Meta-Analyse laden" geklickt
 *     -> die Analyse laedt (15 Karten, Fezandipiti ex 66,6 % usw.)
 *     -> der Knopf steht VOR, WAEHREND und NACH dem Laden unveraendert
 *        auf "Meta-Analyse laden", disabled=false            FALSCH
 *
 *   Dasselbe in City League (#cityLeagueMetaReloadBtn, index.html:935)
 *     -> der Knopf heisst nach dem Laden "Meta-Analyse neu laden"  RICHTIG
 *
 * URSACHE: js/app-meta-cards.js sucht in renderMetaCards() genau zwei
 * Kennungen (cityLeague -> 'cityLeagueMetaReloadBtn', sonst
 * 'currentMetaMetaReloadBtn'). Die zweite gab es im Markup nicht,
 * getElementById() lieferte null, und der Block stieg vor der
 * Umbeschriftung aus.
 *
 * WIE HIER GEPRUEFT WIRD
 * ----------------------
 * Die gesuchten Kennungen werden NICHT abgeschrieben, sondern aus
 * js/app-meta-cards.js gelesen. Wer den Namen im Motor aendert und das
 * Markup vergisst, faellt hier auf — sonst wandert der Fehler beim
 * naechsten Umbau nur weiter.
 *
 * Und der Block wird AUSGEFUEHRT, nicht gegriffen: ein winziges
 * document, dessen getElementById nur die Kennungen kennt, die im
 * echten index.html wirklich als id="..." stehen. Fehlt eine, bleibt
 * der Knopf unbeschriftet — genau der gemessene Zustand.
 *
 * KEIN jsdom: der CI-Schritt installiert nur papaparse.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const MOTOR = fs.readFileSync(path.join(WURZEL, 'js', 'app-meta-cards.js'), 'utf8');
const MARKUP = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

/**
 * Alle id="..."-Werte aus dem echten Markup. Kommentare fallen vorher
 * weg — index.html zitiert an mehreren Stellen eine Kennung im
 * Erklaertext, und eine daraus gelesene Kennung gaebe es zur Laufzeit
 * gar nicht. `[^-a-zA-Z]` haelt data-tab-id & Co. draussen.
 */
const MARKUP_KENNUNGEN = new Set(
    [...MARKUP.replace(/<!--[\s\S]*?-->/g, '').matchAll(/[^-a-zA-Z]id="([^"]+)"/g)]
        .map(m => m[1])
);

/**
 * Der Ausdruck, mit dem der Motor den Knopf sucht. Aus der Datei
 * gelesen, nicht abgeschrieben: die beiden Zeichenketten hinter
 * `source === 'cityLeague' ? … : …` im getElementById-Aufruf.
 */
function gesuchteKnopfKennungen() {
    const stelle = MOTOR.match(
        /getElementById\(\s*source === 'cityLeague' \? '([^']+)' : '([^']+)'\s*\)/);
    assert.ok(stelle,
        'js/app-meta-cards.js sucht den Ladeknopf nicht mehr ueber '
        + "getElementById(source === 'cityLeague' ? … : …). Diese Pruefung "
        + 'liest die Kennungen von dort; wenn sich der Weg aendert, muss sie mit.');
    return { cityLeague: stelle[1], currentMeta: stelle[2] };
}

/**
 * Den RUMPF des umbeschriftenden Blocks per Klammerzaehlung
 * herausschneiden — ohne die Huelle, damit die Aufrufform im Motor
 * (IIFE oder nicht) diese Pruefung nichts angeht.
 */
function knopfBlock() {
    const anker = MOTOR.indexOf('var knopf = document.getElementById(');
    assert.ok(anker > 0, 'Der Block, der den Ladeknopf umbeschriftet, ist fort.');
    const start = MOTOR.lastIndexOf('(function () {', anker);
    assert.ok(start >= 0, 'Der Block steht nicht mehr in einer eigenen Funktion.');
    const auf = MOTOR.indexOf('{', start);
    let tiefe = 0;
    for (let j = auf; j < MOTOR.length; j++) {
        if (MOTOR[j] === '{') tiefe++;
        else if (MOTOR[j] === '}') { tiefe--; if (tiefe === 0) return MOTOR.slice(auf + 1, j); }
    }
    assert.fail('Die Klammern des Blocks gehen nicht auf.');
}

/**
 * Den Block laufen lassen. `nurDieseKennungen` sagt, welche Kennungen
 * das gefaelschte Dokument kennt — im Regelfall die aus index.html.
 */
function laufeBlock(quelle, nurDieseKennungen, daten) {
    const knoepfe = new Map();
    const doc = {
        getElementById(id) {
            if (!nurDieseKennungen.has(id)) return null;
            if (!knoepfe.has(id)) {
                knoepfe.set(id, {
                    attribute: {},
                    textContent: 'Load Meta Analysis',
                    setAttribute(n, w) { this.attribute[n] = w; }
                });
            }
            return knoepfe.get(id);
        }
    };
    const sandkasten = {
        document: doc,
        metaCardData: daten,
        // Uebersetzer, der den Schluessel unveraendert zurueckgibt: so
        // steht am Ende der SCHLUESSEL im Text, und der Test behauptet
        // keine Uebersetzung, die er nicht gemessen hat.
        t: (s) => s,
        console
    };
    vm.createContext(sandkasten);
    for (const quelleFuer of ['cityLeague', 'currentMeta']) {
        vm.runInContext('(function (source) {' + quelle + '}(' + JSON.stringify(quelleFuer) + '));',
            sandkasten);
    }
    return knoepfe;
}

describe('B1 — Kennung des Meta-Analyse-Ladeknopfs', () => {

    it('beide vom Motor gesuchten Kennungen stehen im Markup', () => {
        const gesucht = gesuchteKnopfKennungen();
        for (const [quelle, id] of Object.entries(gesucht)) {
            assert.ok(MARKUP_KENNUNGEN.has(id),
                `js/app-meta-cards.js sucht fuer die Quelle "${quelle}" den Knopf `
                + `ueber id="${id}". Diese Kennung gibt es in index.html nicht — `
                + 'getElementById() liefert null und der Ladezustand wird nie gesetzt.');
        }
    });

    it('beide Kennungen sitzen auf einem Knopf, der genau diese Quelle laedt', () => {
        const gesucht = gesuchteKnopfKennungen();
        for (const [quelle, id] of Object.entries(gesucht)) {
            const knopf = MARKUP.match(
                new RegExp('<button[^>]*\\bid="' + id + '"[^>]*>'));
            assert.ok(knopf, `Kein <button> mit id="${id}" in index.html.`);
            assert.ok(knopf[0].includes(`loadMetaCardAnalysis('${quelle}')`),
                `Der Knopf id="${id}" laedt nicht loadMetaCardAnalysis('${quelle}') — `
                + `gefunden: ${knopf[0]}`);
        }
    });

    it('ausgefuehrt: mit dem echten Markup wird BEIDE Male umbeschriftet', () => {
        const block = knopfBlock();
        const gesucht = gesuchteKnopfKennungen();
        const knoepfe = laufeBlock(block, MARKUP_KENNUNGEN, {
            cityLeague: [{}, {}],
            currentMeta: [{}, {}]
        });
        for (const [quelle, id] of Object.entries(gesucht)) {
            const knopf = knoepfe.get(id);
            assert.ok(knopf,
                `Der Block hat fuer die Quelle "${quelle}" keinen Knopf gefunden `
                + `(id="${id}" fehlt im Markup) — der Ladezustand bleibt stehen.`);
            assert.equal(knopf.attribute['data-i18n'], 'btn.reloadMetaAnalysis',
                `Der Knopf fuer "${quelle}" traegt nach dem Laden nicht die `
                + 'Aufschrift "neu laden".');
            assert.equal(knopf.textContent, 'btn.reloadMetaAnalysis');
        }
    });

    it('Gegenprobe: fehlt eine Kennung im Markup, bleibt der Knopf stehen', () => {
        const block = knopfBlock();
        const gesucht = gesuchteKnopfKennungen();
        const ohne = new Set(MARKUP_KENNUNGEN);
        ohne.delete(gesucht.currentMeta);
        const knoepfe = laufeBlock(block, ohne, {
            cityLeague: [{}],
            currentMeta: [{}]
        });
        assert.equal(knoepfe.get(gesucht.currentMeta), undefined,
            'Ohne die Kennung darf gar kein Knopf gefunden werden — sonst misst '
            + 'dieser Test nicht, was er zu messen behauptet.');
        assert.ok(knoepfe.get(gesucht.cityLeague),
            'Die andere Quelle muss davon unberuehrt bleiben.');
    });

    it('ohne geladene Karten heisst der Knopf weiter "laden"', () => {
        const block = knopfBlock();
        const gesucht = gesuchteKnopfKennungen();
        const knoepfe = laufeBlock(block, MARKUP_KENNUNGEN, {
            cityLeague: [], currentMeta: []
        });
        for (const id of Object.values(gesucht)) {
            assert.equal(knoepfe.get(id).attribute['data-i18n'], 'btn.loadMetaAnalysis');
        }
    });
});
