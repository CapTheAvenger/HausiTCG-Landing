/**
 * Kein Vollbild ohne Sperre — und keine Sperre, die nur so aussieht.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Am 10.09.2026 meldete der Betreiber, dass sich die Seite hinter einem
 * geoeffneten Vollbild manchmal mitscrollen laesst. Die Ursache war nicht
 * eine fehlende Sperre, sondern eine, die es nur dem Namen nach gab:
 *
 *   * fuenf Stellen setzten `document.body.style.overflow = 'hidden'`
 *     bzw. eine Klasse mit genau dieser Regel,
 *   * `html` traegt in css/styles.css:225 ein eigenes
 *     `overflow-x: hidden`,
 *   * ein `overflow` am Body erreicht den Viewport aber nur, solange
 *     `html` auf `visible` steht (CSS Overflow, overflow propagation).
 *
 * Gemessen live: Klasse gesetzt, `body` rechnete auf `hidden`, die Seite
 * scrollte trotzdem von 200 auf 700.
 *
 * Diese Datei haelt beides fest: dass der alte, wirkungslose Griff nicht
 * zurueckkommt, und dass jedes Vollbild seinen Bildlauf bei sich behaelt.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (...t) => fs.readFileSync(path.join(WURZEL, ...t), 'utf8');

/** Die fuenf Stellen, die ein Vollbild oeffnen und die Seite anhalten. */
const STELLEN = [
    ['js/app-side-quest-pokedex.js', 'pokedex-detail'],
    ['js/app-archetype-card.js', 'archetyp-karte'],
    ['js/ds-pocket.js', 'pocket-vollbild'],
    ['js/app-side-quest.js', 'arten-waehler'],
    ['js/app-deck-builder.js', 'einzelkarte'],
    ['js/battle-journal.js', 'kampfjournal']
];

/** Alle Regeln einer CSS-Datei als {selektor, koerper, zeile}. */
function regeln(text) {
    const heraus = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        heraus.push({
            selektor: m[1].trim(),
            koerper: m[2],
            zeile: text.slice(0, m.index).split('\n').length
        });
    }
    return heraus;
}

/** Deckt die Regel den ganzen Bildschirm ab? */
function istVollbild(koerper) {
    if (!/position:\s*fixed/.test(koerper)) return false;
    if (/inset:\s*0/.test(koerper)) return true;
    return /top:\s*0/.test(koerper) && /left:\s*0/.test(koerper) &&
           (/right:\s*0/.test(koerper) || /width:\s*100(vw|%)/.test(koerper));
}

const CSS_DATEIEN = fs.readdirSync(path.join(WURZEL, 'css'))
    .filter(n => n.endsWith('.css'));

describe('Vollbild-Sperre — Verdrahtung', () => {

    it('jede Vollbild-Stelle ruft die gemeinsame Sperre auf', () => {
        STELLEN.forEach(([datei, name]) => {
            const q = lies(datei);
            assert.ok(q.includes(`HintergrundSperre.sperren('${name}')`),
                `${datei} sperrt die Seite nicht mehr unter '${name}' — `
                + 'dann laeuft der Hintergrund beim Oeffnen weiter');
            assert.ok(q.includes(`HintergrundSperre.freigeben('${name}')`),
                `${datei} gibt '${name}' nicht frei — die Seite bliebe nach `
                + 'dem Schliessen festgenagelt, und das faellt sofort auf');
        });
    });

    it('der alte, wirkungslose Griff kommt nicht zurueck', () => {
        // `body.style.overflow = 'hidden'` war der Griff, der auf dieser
        // Seite nie gewirkt hat. Wer ihn wieder einsetzt, baut denselben
        // Fehler noch einmal — deshalb faellt er hier auf.
        const treffer = [];
        fs.readdirSync(path.join(WURZEL, 'js'))
            .filter(n => n.endsWith('.js'))
            // Die Sperre selbst zitiert den alten Griff in ihrer
            // Begruendung. Ohne diese Ausnahme prueft der Test seinen
            // eigenen Kommentar.
            .filter(n => n !== 'hintergrund-sperre.js')
            .forEach(n => {
                const q = lies('js', n);
                const re = /(document\.)?body\.style\.overflow\s*=\s*['"]hidden['"]/g;
                if (re.test(q)) treffer.push('js/' + n);
            });
        assert.deepEqual(treffer, [],
            'Diese Dateien sperren wieder ueber body.style.overflow. Das '
            + 'wirkt hier nicht, weil html ein eigenes overflow traegt '
            + '(css/styles.css). Stattdessen window.HintergrundSperre '
            + 'benutzen: ' + treffer.join(', '));
    });

    it('keine CSS-Regel gibt vor, ueber den Koerper zu sperren', () => {
        const treffer = [];
        CSS_DATEIEN.forEach(n => {
            regeln(lies('css', n)).forEach(r => {
                if (!/^body\.[\w-]+$/.test(r.selektor)) return;
                if (!/overflow(-y)?:\s*hidden/.test(r.koerper)) return;
                treffer.push(`css/${n}:${r.zeile} ${r.selektor}`);
            });
        });
        assert.deepEqual(treffer, [],
            'Eine Klasse am Koerper mit overflow:hidden sieht aus wie eine '
            + 'Sperre und ist hier keine: ' + treffer.join(', '));
    });

    it('html traegt ein eigenes overflow — deshalb geht es nicht anders', () => {
        // Faellt diese Zusicherung eines Tages um, weil jemand das
        // overflow-x am html entfernt hat, dann WAERE eine Body-Sperre
        // wieder moeglich — und dieser Test soll dann gelesen werden,
        // nicht stumm gruen bleiben.
        const q = lies('css', 'styles.css');
        assert.match(q, /html\s*\{[^}]*overflow-x:\s*hidden/,
            'css/styles.css setzt kein overflow am html mehr. Dann bitte '
            + 'die Begruendung in js/hintergrund-sperre.js nachziehen — '
            + 'sie stimmt so nicht mehr.');
    });

    it('jedes Vollbild-Overlay behaelt seinen Bildlauf bei sich', () => {
        const ohne = [];
        CSS_DATEIEN.forEach(n => {
            regeln(lies('css', n)).forEach(r => {
                if (!istVollbild(r.koerper)) return;
                if (/overscroll-behavior/.test(r.koerper)) return;
                ohne.push(`css/${n}:${r.zeile} ${r.selektor.split('\n').pop().trim()}`);
            });
        });
        assert.deepEqual(ohne, [],
            'Diesen bildschirmfuellenden Fenstern fehlt '
            + '`overscroll-behavior: contain`. Ohne das reicht eine Geste '
            + 'ueber das Ende des Inhalts hinaus an die Seite dahinter '
            + 'weiter: ' + ohne.join(', '));
    });

    it('die Sperre wird geladen, bevor jemand sie braucht', () => {
        const html = lies('index.html');
        const pos = html.indexOf('js/hintergrund-sperre.js');
        assert.ok(pos > 0, 'index.html laedt js/hintergrund-sperre.js nicht — '
            + 'dann ist window.HintergrundSperre nirgends da');
        STELLEN.forEach(([datei]) => {
            const p = html.indexOf(datei);
            if (p < 0) return;   // nicht jede Datei steht als eigenes script
            assert.ok(pos < p,
                `${datei} wird vor der Sperre geladen. Beide tragen defer, `
                + 'also entscheidet die Reihenfolge im Dokument.');
        });
    });

    it('der Offline-Bestand kennt die Sperre', () => {
        assert.match(lies('service-worker.js'), /hintergrund-sperre\.js/,
            'ohne Eintrag fehlt die Sperre beim naechsten Offline-Start, '
            + 'und jedes Vollbild laesst den Hintergrund wieder laufen');
    });
});
