/**
 * DIE RUNDENZAHL: VORGABE 8, AENDERBAR, UND ALLES RECHNET MIT.
 *
 * Angeordnet vom Betreiber am 08.09.2026, woertlich: „ich hab doch
 * gesagt es sind immer 8 Runden, gib mir die Option Rundenzahlen zu
 * aendern und dann wird entsprechend alles gerechnet aber Standard ist
 * immer 8!"
 *
 * Vorgeschichte, damit niemand das noch einmal aufmacht: ein Agent hatte
 * aus einer Sekundaerquelle geschlossen, ein Feld dieser Groesse laufe
 * ueber neun Runden, und daraus einen Befund gebaut. Das war weder
 * belegt noch gefragt. Die Rundenzahl wird hier NICHT aus der
 * Spielerzahl abgeleitet — anders als bei Challenge und Cup, wo
 * _suggestSwissRounds() genau das tut.
 *
 * Diese Datei nagelt drei Dinge fest:
 *
 *   1. STANDARD_RUNDEN ist 8, und die drei grossen Turniertypen starten
 *      mit 8 Runden und 16 Punkten.
 *   2. Die Rundenzahl wird fuer grosse Turniere NICHT aus der
 *      Spielerzahl nachgezogen (waehrend sie es fuer die lokalen Typen
 *      weiterhin tut — beides zusammen, sonst ist die Zusicherung
 *      halb).
 *   3. Das Punkteziel folgt der gewaehlten Rundenzahl (8 → 16, 9 → 19),
 *      und das Abzeichen in der Kopfzeile zeigt an, worauf gerade
 *      gerechnet wird.
 *
 * Live gemessen am 08.09.2026 auf 202609080216-87e21e5: 8 → 9 zog das
 * Punkteziel von 16 auf 19, die erwarteten Siege von 4,80 auf 5,40 und
 * die Day-2-Chance von 47,2 % auf 38,7 % nach; zurueck auf 8 kamen exakt
 * dieselben Zahlen wieder. Das ist der Zustand, den diese Datei haelt.
 *
 * Kein jsdom, kein Netz: die Rumpfteile werden aus js/app-meta-call.js
 * geschnitten und in node:vm ausgefuehrt.
 */
'use strict';

const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies   = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

const MC  = lies('js/app-meta-call.js');
const CSS = lies('css/meta-call.css');

/** Schneidet eine Funktion samt Rumpf per Klammerzaehlung heraus. */
function schneideFunktion(quelle, name) {
    const start = quelle.indexOf('function ' + name + '(');
    assert.ok(start >= 0, `Funktion ${name} nicht in js/app-meta-call.js gefunden`);
    let i = quelle.indexOf('{', start), tiefe = 0;
    for (; i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}') { tiefe--; if (tiefe === 0) return quelle.slice(start, i + 1); }
    }
    throw new Error(`Rumpf von ${name} nicht geschlossen`);
}

/** Baut einen Kasten mit den Abzeichen-Helfern und gesetzten Einstellungen. */
function abzeichenKasten(einstellungen, sprache = 'de') {
    const kontext = vm.createContext({ console });
    const quelle = [
        'var _settings = ' + JSON.stringify(einstellungen) + ';',
        "var zahlLokal = (n) => String(n);",
        "var t = (k) => (k === 'mc.labelRounds' ? (SPRACHE === 'de' ? 'Runden' : 'rounds') : k);",
        'var SPRACHE = ' + JSON.stringify(sprache) + ';',
        'function _mcIstDeutsch() { return SPRACHE === "de"; }',
        // STANDARD_RUNDEN aus der Datei lesen, nicht abschreiben.
        (MC.match(/const STANDARD_RUNDEN = \d+;/) || [''])[0],
        schneideFunktion(MC, '_rundenAbzeichenText'),
        schneideFunktion(MC, '_rundenAbzeichenTitel'),
        schneideFunktion(MC, '_rundenAbzeichenKlassen'),
        'globalThis.__text = _rundenAbzeichenText;',
        'globalThis.__titel = _rundenAbzeichenTitel;',
        'globalThis.__klassen = _rundenAbzeichenKlassen;',
        'globalThis.__standard = STANDARD_RUNDEN;',
    ].join('\n');
    vm.runInContext(quelle, kontext);
    return kontext;
}

test('STANDARD_RUNDEN ist 8 — und steht als Konstante da, nicht als Rechnung', () => {
    const m = MC.match(/const STANDARD_RUNDEN = (\d+);/);
    assert.ok(m, 'STANDARD_RUNDEN fehlt in js/app-meta-call.js');
    assert.strictEqual(Number(m[1]), 8);
    // Keine Ableitung aus der Spielerzahl an dieser Stelle.
    assert.ok(!/const STANDARD_RUNDEN\s*=\s*[^;]*(?:totalPlayers|players|Spieler)/i.test(MC),
        'STANDARD_RUNDEN haengt an der Spielerzahl — genau das war die Anordnung nicht');
});

test('die drei grossen Turniertypen starten mit 8 Runden und 16 Punkten', () => {
    const block = MC.slice(MC.indexOf('let _settingsByType'), MC.indexOf('let _settingsByType') + 700);
    for (const typ of ['worlds', 'regional', 'international']) {
        const zeile = block.match(new RegExp(typ + '\\s*:\\s*\\{[^}]*\\}'));
        assert.ok(zeile, `Vorgabe fuer ${typ} nicht gefunden`);
        const runden = zeile[0].match(/rounds\s*:\s*(\d+)/);
        const punkte = zeile[0].match(/day2Points\s*:\s*(\d+)/);
        assert.strictEqual(Number(runden[1]), 8, `${typ} startet nicht mit 8 Runden`);
        assert.strictEqual(Number(punkte[1]), 16, `${typ} startet nicht mit 16 Punkten`);
    }
});

test('grosse Turniere ziehen die Runden NICHT aus der Spielerzahl nach', () => {
    /* Die Stelle, die es fuer die lokalen Typen tut, muss weiterhin da
       sein — sonst haelt der Test nur, weil das Nachziehen ueberhaupt
       verschwunden ist. */
    /* Der Aufruf traegt seit dem 08.09.2026 einen zweiten Parameter
       (den Turniertyp), weil das Handbuch fuer Liga-Herausforderung und
       Liga-Cup ZWEI verschiedene Rundenleitern fuehrt. Das Muster laesst
       ihn zu, verlangt aber weiter die Abfrage davor — bewacht wird die
       Begrenzung auf die lokalen Typen, nicht die Signatur. */
    assert.match(MC, /if \(!MAJOR_TYPES\.includes\(_settings\.tournamentType\)\) \{[\s\S]{0,260}_settings\.rounds = _suggestSwissRounds\(val[^)]*\);/,
        'das Nachziehen fuer Challenge/Cup ist weg oder nicht mehr auf die '
        + 'lokalen Typen begrenzt');
    /* Und es darf keine zweite, unbedingte Zuweisung geben. */
    const treffer = [...MC.matchAll(/_settings\.rounds = _suggestSwissRounds\(/g)];
    assert.strictEqual(treffer.length, 1,
        `_suggestSwissRounds() weist an ${treffer.length} Stellen zu — erwartet `
        + 'wird genau eine, und die steht hinter der Abfrage auf lokale Typen');
});

test('das Punkteziel folgt der Rundenzahl: 8 → 16, 9 → 19', () => {
    const m = MC.match(/const MAJOR_DAY2_POINTS = \{([^}]*)\}/);
    assert.ok(m, 'MAJOR_DAY2_POINTS fehlt');
    const tab = {};
    for (const [, k, v] of m[1].matchAll(/(\d+)\s*:\s*(\d+)/g)) tab[k] = Number(v);
    assert.strictEqual(tab['8'], 16);
    assert.strictEqual(tab['9'], 19);
});

test('das Abzeichen nennt die Rundenzahl, auf der gerechnet wird', () => {
    const k8 = abzeichenKasten({ rounds: 8, day2Points: 16 });
    assert.strictEqual(k8.__text(), '8 Runden');
    const k9 = abzeichenKasten({ rounds: 9, day2Points: 19 });
    assert.strictEqual(k9.__text(), '9 Runden');
    const kEn = abzeichenKasten({ rounds: 8, day2Points: 16 }, 'en');
    assert.strictEqual(kEn.__text(), '8 rounds');
});

test('bei 8 Runden ist das Abzeichen ruhig, bei jeder anderen Zahl markiert', () => {
    const k8 = abzeichenKasten({ rounds: 8, day2Points: 16 });
    assert.ok(!/is-abweichend/.test(k8.__klassen()),
        'die Vorgabe wird als Abweichung markiert — das waere Daueralarm');
    for (const r of [9, 7, 10]) {
        const k = abzeichenKasten({ rounds: r, day2Points: r === 9 ? 19 : 3 * r - 8 });
        assert.match(k.__klassen(), /is-abweichend/,
            `${r} Runden werden nicht als Abweichung markiert`);
    }
});

test('der Hinweis nennt bei Abweichung die Vorgabe UND das gerechnete Ziel', () => {
    const k9 = abzeichenKasten({ rounds: 9, day2Points: 19 });
    const titel = k9.__titel();
    assert.match(titel, /ABWEICHEND/);
    assert.match(titel, /\b8 Runden\b/, 'die Vorgabe 8 wird nicht genannt');
    assert.match(titel, /\b9 Runden\b/, 'die gerechnete Zahl wird nicht genannt');
    assert.match(titel, /\b19\b/,       'das Punkteziel wird nicht genannt');

    const k8 = abzeichenKasten({ rounds: 8, day2Points: 16 });
    const ruhig = k8.__titel();
    assert.ok(!/ABWEICHEND/.test(ruhig));
    assert.match(ruhig, /Vorgabe/);
    assert.match(ruhig, /\b16\b/);
});

test('die Markierung haengt nicht allein an der Farbe', () => {
    /* Ein Abzeichen, das sich nur durch seine Faerbung unterscheidet,
       kommt bei Rot-Gruen-Schwaeche und im Ausdruck nicht an. Deshalb
       traegt es zusaetzlich eine Umrandung und ein Vorzeichen. */
    const block = CSS.slice(CSS.indexOf('.metacall-panel-title .mc-runden-badge.is-abweichend'));
    assert.ok(block.length > 0, 'die Regel fuer das abweichende Abzeichen fehlt');
    const regel = block.slice(0, 600);
    assert.match(regel, /border:\s*1px solid/, 'keine Umrandung als zweites Merkmal');
    assert.match(regel, /::before[\s\S]{0,120}content:\s*"≠/, 'kein Vorzeichen als drittes Merkmal');
});

test('das Abzeichen wird beim Nachziehen mitgefuehrt, nicht nur beim Neubau', () => {
    /* Bliebe es beim Neubau haengen, zeigte die Kopfzeile eine andere
       Rundenzahl als die Tabelle darunter rechnet — schlimmer als gar
       kein Abzeichen. */
    const i = MC.indexOf("container.querySelector('#mc-rounds-badge')");
    assert.ok(i > 0, 'das Abzeichen wird beim chirurgischen Nachziehen nicht aktualisiert');
    const block = MC.slice(i, i + 700);
    assert.match(block, /textContent\s*=\s*_rundenAbzeichenText\(\)/);
    assert.match(block, /className\s*=\s*_rundenAbzeichenKlassen\(\)/);
    assert.match(block, /title\s*=\s*_rundenAbzeichenTitel\(\)/);
});

test('das Abzeichen steht wirklich im Markup der Kopfzeile', () => {
    const i = MC.indexOf('id="mc-players-badge"');
    assert.ok(i > 0);
    const block = MC.slice(i, i + 500);
    assert.match(block, /id="mc-rounds-badge"/,
        'das Rundenabzeichen steht nicht neben dem Spielerabzeichen');
    assert.match(block, /_rundenAbzeichenKlassen\(\)/);
    assert.match(block, /_rundenAbzeichenText\(\)/);
});
