/**
 * EINE SCHREIBWEISE FUER DAS DEUTSCHE DEZIMALKOMMA — UND SIE MUSS
 * ZEICHENGLEICH BLEIBEN.
 *
 * GEMESSENE LAGE (10.09.2026, vor der Umstellung):
 *
 *     grep -rn "toFixed(1).replace" js/ | wc -l   ->  29
 *
 * 29-mal derselbe Ausdruck in acht Dateien: app-city-league (2),
 * app-current-meta-analysis (4), app-deck-builder (6), app-meta-call (9),
 * app-past-meta (4), app-profile-deck-builder (1), current-meta-quickref
 * (2), ds-datenumfang (1). 27-mal mit fest verdrahtetem Komma, 2-mal mit
 * einem Trennzeichen aus der Sprachwahl.
 *
 * WARUM NICHT AUF DAS BESTEHENDE zahlLokal() UMGESTELLT WURDE
 * ------------------------------------------------------------
 * `js/app-utils.js` hatte bereits eine zentrale Zahlenformatierung —
 * `zahlLokal(wert, stellen)` ueber `toLocaleString`. Sie ist aber NICHT
 * dasselbe. Gemessen an 23 Proben durch beide Wege: 9 Abweichungen,
 * darunter der Tausenderpunkt (1000 -> "1.000,0" statt "1000,0"), ein
 * erfundenes Minus bei -0 und — am schwersten — eine ANDERE Rundung
 * (0.15 -> "0,2" statt "0,1"), weil Intl auf dem Dezimalwert rundet und
 * toFixed auf der Binaerdarstellung. Eine Umstellung auf zahlLokal
 * haette Prozentzahlen der Oberflaeche still veraendert. Deshalb gibt es
 * `zahlKomma()` als zeichengleiche Ablesung daneben, und dieser Test
 * haelt beide Aussagen fest: die Gleichheit mit dem ALTEN Ausdruck und
 * die Ungleichheit mit zahlLokal.
 *
 * WAS HIER NICHT GEPRUEFT WIRD: ob die Oberflaeche im Browser dieselben
 * Zeichen zeigt. Dafuer braeuchte es einen Seitenabruf; diese Datei
 * misst den Ausdruck, nicht die gerenderte Seite.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (...p) => fs.readFileSync(path.join(WURZEL, ...p), 'utf8');
const UTILS = lies('js', 'app-utils.js');

/* zahlKomma aus dem Quelltext ziehen — an der Klammer gezaehlt, damit
   der Test die AUSGELIEFERTE Fassung misst und keine Kopie davon. */
function funktion(quelle, kopf) {
    const a = quelle.indexOf(kopf);
    assert.ok(a >= 0, `nicht gefunden: ${kopf}`);
    let tiefe = 0;
    for (let j = quelle.indexOf('{', a); j < quelle.length; j++) {
        if (quelle[j] === '{') tiefe++;
        else if (quelle[j] === '}') { tiefe--; if (tiefe === 0) return quelle.slice(a, j + 1); }
    }
    throw new Error(`unbalancierte Klammern in ${kopf}`);
}

const sandkasten = { window: {} };
vm.createContext(sandkasten);
vm.runInContext(funktion(UTILS, 'function zahlKomma('), sandkasten);
vm.runInContext(funktion(UTILS, 'function zahlLokal('), sandkasten);
const zahlKomma = sandkasten.zahlKomma;
const zahlLokal = sandkasten.zahlLokal;

/* Der Ausdruck, der bis zum 10.09.2026 29-mal im Quelltext stand.
   Bewusst hier als Referenz wiederholt: der Test vergleicht gegen das,
   was WAR, nicht gegen eine Erwartung, die jemand aufgeschrieben hat. */
const ALT = (x, trenner) => x.toFixed(1).replace('.', trenner == null ? ',' : trenner);

/* Die vom Betreiber benannten Proben plus die Faelle, an denen sich die
   beiden Wege ueberhaupt erst unterscheiden. */
const PROBEN = [
    0, 0.05, 1, 12.34, 49.35, 100, -3.7,
    1000, 1234.56, 12345.6, 1234567.89, 1e21, Number.MAX_SAFE_INTEGER,
    999.94, 999.95, -0, 0.049999, 0.15, 0.25, 2.5, 3.5,
    NaN, Infinity, -Infinity,
];

describe('zahlKomma() ist zeichengleich mit dem abgeloesten Ausdruck', () => {

    it('liefert an allen Proben Zeichen fuer Zeichen dasselbe', () => {
        for (const p of PROBEN) {
            assert.strictEqual(zahlKomma(p), ALT(p),
                `${p}: zahlKomma -> "${zahlKomma(p)}", alter Ausdruck -> "${ALT(p)}"`);
        }
    });

    it('die vom Betreiber genannten Eingaben ergeben genau diese Zeichen', () => {
        /* Woertlich festgehalten, damit ein Blick genuegt. Diese sieben
           Zeichenketten stehen so in der Oberflaeche. */
        assert.strictEqual(zahlKomma(0),      '0,0');
        assert.strictEqual(zahlKomma(0.05),   '0,1');
        assert.strictEqual(zahlKomma(1),      '1,0');
        assert.strictEqual(zahlKomma(12.34),  '12,3');
        assert.strictEqual(zahlKomma(49.35),  '49,4');
        assert.strictEqual(zahlKomma(100),    '100,0');
        assert.strictEqual(zahlKomma(-3.7),   '-3,7');
        /* Sehr grosse Zahlen: OHNE Tausenderpunkt, und ab 1e21 in der
           Exponentialschreibweise, die toFixed dort liefert. */
        assert.strictEqual(zahlKomma(12345.6), '12345,6');
        assert.strictEqual(zahlKomma(1e21),    '1e+21');
    });

    it('das Trennzeichen laesst sich setzen — die zwei sprachabhaengigen Stellen brauchen das', () => {
        assert.strictEqual(zahlKomma(49.35, 1, ','), '49,4');
        assert.strictEqual(zahlKomma(49.35, 1, '.'), '49.4');
        assert.strictEqual(zahlKomma(49.35, 1, '.'), ALT(49.35, '.'));
    });

    it('mehr Nachkommastellen als eine sind moeglich, Vorgabe bleibt eine', () => {
        assert.strictEqual(zahlKomma(1.2345),    '1,2');
        assert.strictEqual(zahlKomma(1.2345, 1), '1,2');
        assert.strictEqual(zahlKomma(1.2345, 2), '1,23');
        assert.strictEqual(zahlKomma(1.2345, 0), '1');
    });

    it('ein Nicht-Zahl-Wert stuerzt ab statt eine 0,0 zu erfinden', () => {
        /* CLAUDE.md: report, don't silently repair. `Number(null)` waere
           0 und wuerde als gemessene "0,0" in der Oberflaeche stehen.
           Der alte Ausdruck warf hier einen TypeError — das bleibt so. */
        /* Auf den Namen geprueft, nicht auf den Prototyp: die Funktion
           laeuft in einer vm-Sandbox mit eigenem TypeError. */
        for (const eingabe of [null, undefined, '49.35', {}, []]) {
            assert.throws(() => zahlKomma(eingabe),
                (e) => e && e.name === 'TypeError',
                `zahlKomma(${JSON.stringify(eingabe)}) haette werfen muessen, `
                + `lieferte stattdessen "${(() => { try { return zahlKomma(eingabe); } catch (_) { return '<Wurf>'; } })()}"`);
        }
    });
});

describe('zahlKomma() und zahlLokal() sind bewusst NICHT dasselbe', () => {

    it('an diesen Eingaben weichen sie messbar voneinander ab', () => {
        /* Wer die eine durch die andere ersetzt, aendert die Oberflaeche.
           Die Liste ist der Beleg dafuer, nicht eine Meinung. */
        const ABWEICHER = [
            [1000,       '1000,0',    '1.000,0'],
            [12345.6,    '12345,6',   '12.345,6'],
            [999.95,     '1000,0',    '1.000,0'],
            [-0,         '0,0',       '-0,0'],
            [0.15,       '0,1',       '0,2'],
        ];
        for (const [eingabe, komma, lokal] of ABWEICHER) {
            assert.strictEqual(zahlKomma(eingabe), komma, `zahlKomma(${eingabe})`);
            assert.strictEqual(zahlLokal(eingabe, 1), lokal, `zahlLokal(${eingabe}, 1)`);
            assert.notStrictEqual(zahlKomma(eingabe), zahlLokal(eingabe, 1));
        }
    });

    it('0,15 rundet in beiden Wegen verschieden — das ist der teuerste Fall', () => {
        /* Eine Prozentzahl, zwei Ergebnisse. Steht hier allein, weil die
           anderen Abweichungen optisch auffallen und diese nicht. */
        assert.strictEqual(zahlKomma(0.15),    '0,1');
        assert.strictEqual(zahlLokal(0.15, 1), '0,2');
    });
});

describe('der 29-fach kopierte Ausdruck kommt nicht zurueck', () => {

    const JS_WURZEL = path.join(WURZEL, 'js');
    const dateien = fs.readdirSync(JS_WURZEL).filter((f) => f.endsWith('.js'));

    it('kein js/ traegt den Ausdruck noch woertlich', () => {
        const treffer = [];
        for (const f of dateien) {
            const text = fs.readFileSync(path.join(JS_WURZEL, f), 'utf8');
            text.split('\n').forEach((zeile, i) => {
                if (zeile.includes('toFixed(1).replace')) treffer.push(`js/${f}:${i + 1}`);
            });
        }
        assert.deepStrictEqual(treffer, [],
            'der zentrale Weg ist da — diese Stellen gehen wieder am ihm vorbei:\n  '
            + treffer.join('\n  '));
    });

    it('die acht umgestellten Dateien rufen zahlKomma auch wirklich', () => {
        /* GEGEN EINEN GRUNDSTAND, nicht gegen eine absolute Schwelle: die
           Zahl je Datei ist die am 10.09.2026 gezaehlte. Wird eine Stelle
           entfernt oder kommt eine dazu, faellt das hier auf und jemand
           entscheidet bewusst — statt dass die Umstellung still zerfaellt. */
        const GRUNDSTAND = {
            'app-city-league.js': 2,
            'app-current-meta-analysis.js': 4,
            'app-deck-builder.js': 6,
            'app-meta-call.js': 9,
            'app-past-meta.js': 4,
            'app-profile-deck-builder.js': 1,
            'current-meta-quickref.js': 2,
            'ds-datenumfang.js': 1,
        };
        const ist = {};
        for (const f of Object.keys(GRUNDSTAND)) {
            const text = fs.readFileSync(path.join(JS_WURZEL, f), 'utf8');
            ist[f] = (text.match(/zahlKomma\(/g) || []).length;
        }
        assert.deepStrictEqual(ist, GRUNDSTAND,
            'die Zahl der Aufrufstellen hat sich gegen den Grundstand vom 10.09.2026 verschoben');
        const summe = Object.values(ist).reduce((a, b) => a + b, 0);
        assert.strictEqual(summe, 29, 'insgesamt 29 abgeloeste Stellen');
    });

    it('zahlKomma haengt am window, sonst sieht keine der acht Dateien sie', () => {
        assert.ok(/window\.zahlKomma\s*=\s*zahlKomma\s*;/.test(UTILS),
            'ohne den Export ist zahlKomma in jeder anderen Datei ein ReferenceError');
    });

    it('index.html laedt app-utils.js VOR jeder Datei, die zahlKomma ruft', () => {
        /* Alle Skripte tragen `defer`, laufen also in Dokumentreihenfolge.
           Stuende app-utils.js dahinter, waere der erste Aufruf ein
           ReferenceError — und zwar erst im Browser, nicht hier. */
        const HTML = lies('index.html');
        const skripte = [...HTML.matchAll(/<script\s+src="js\/([^"?]+)/g)].map((m) => m[1]);
        const utilsPos = skripte.indexOf('app-utils.js');
        assert.ok(utilsPos >= 0, 'index.html laedt js/app-utils.js gar nicht');
        for (const f of ['app-city-league.js', 'app-current-meta-analysis.js',
                         'app-deck-builder.js', 'app-meta-call.js', 'app-past-meta.js',
                         'app-profile-deck-builder.js', 'current-meta-quickref.js',
                         'ds-datenumfang.js']) {
            const pos = skripte.indexOf(f);
            assert.ok(pos >= 0, `index.html laedt js/${f} nicht`);
            assert.ok(pos > utilsPos,
                `js/${f} steht an Position ${pos}, app-utils.js erst an ${utilsPos} — `
                + 'zahlKomma waere beim ersten Aufruf noch nicht da');
        }
    });
});
