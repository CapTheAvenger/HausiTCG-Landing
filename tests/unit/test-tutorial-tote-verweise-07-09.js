/**
 * N5 — neun tote Verweise in der Anleitung warfen den Leser hinaus.
 *
 * GEMESSEN AM 07.09.2026, im Browser (Chromium, playwright, lokal
 * ausgeliefertes index.html):
 *
 *   #tutorial -> alle <a> im Reiter gezaehlt: 9 mit href="#" und ohne
 *   onclick (8x "🛒 Cardmarket", 1x "@TheDipidisBot").
 *   Klick auf den ersten -> location.hash == "" und die Anwendung
 *   sprang auf current-meta. Der Leser verliert seine Stelle in einem
 *   89.000 Zeichen langen Dokument.
 *
 * ENTSCHEIDUNG, BEGRUENDET (die lange Fassung steht im Kommentar ueber
 * tutorialToterVerweis in js/inline-init.js):
 *
 *   • "@TheDipidisBot" ist eindeutig — dieselbe Datei verlinkt den Bot
 *     23 Zeilen weiter oben schon auf https://t.me/TheDipidisBot, und
 *     README.md wie js/i18n.js nennen dieselbe Adresse. Ziel eintragen.
 *   • Die acht "🛒 Cardmarket" stehen in einem NACHBAU einer
 *     Telegram-Nachricht mit erfundenen Beispielkarten. Den echten Link
 *     baut der Bot aus Set und Nummer der Wunschliste des Nutzers. Ein
 *     Ziel waere geraten. Also: Klick unschaedlich machen und dem Leser
 *     SAGEN, warum nichts passiert.
 *
 * Gepruef wird der echte Rumpf des Abfangers in einer Sandbox, mit
 * beiden Sorten Verweis.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'inline-init.js'), 'utf8');

function funktion(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.ok(start >= 0, name + '() gibt es nicht mehr');
    let tiefe = 0;
    for (let j = src.indexOf('{', start); j < src.length; j++) {
        if (src[j] === '{') tiefe++;
        else if (src[j] === '}') { tiefe--; if (tiefe === 0) return src.slice(start, j + 1); }
    }
    assert.fail(name + '(): Klammern gehen nicht auf');
}

/* Ein Verweis, wie er im Anleitungstext steht: href="#", kein onclick.
 * `treffer` sagt, ob closest('#tutorial a[href="#"]') ihn findet. */
function verweis(text, treffer = true) {
    const attribute = { href: '#' };
    const a = {
        textContent: text,
        style: {},
        setAttribute: (k, v) => { attribute[k] = v; },
        getAttribute: (k) => (k in attribute ? attribute[k] : null),
        closest: () => (treffer ? a : null),
        attribute,
    };
    return a;
}

function laufen(a, sprache = 'de') {
    const notiz = [];
    const geoeffnet = [];
    let verhindert = 0;
    const sandbox = { console, String, RegExp };
    sandbox.window = { open: (u) => geoeffnet.push(u) };
    sandbox.getLang = () => sprache;
    sandbox.showNotification = (t, art) => notiz.push([art, t]);
    sandbox.document = { addEventListener: () => {} };
    vm.createContext(sandbox);
    vm.runInContext(funktion(SRC, 'tutorialToterVerweis'), sandbox,
        { filename: 'tutorialToterVerweis.js' });
    sandbox.tutorialToterVerweis({ target: a, preventDefault: () => { verhindert++; } });
    return { notiz, geoeffnet, verhindert, a };
}

describe('N5 — kein Klick setzt den Hash mehr auf leer', () => {
    it('der Cardmarket-Verweis im Beispielbild springt nirgendwohin', () => {
        const r = laufen(verweis('Cardmarket'));
        assert.strictEqual(r.verhindert, 1,
            'ohne preventDefault setzt href="#" den Hash auf leer, und die '
            + 'Anwendung springt auf die Startseite');
        assert.deepStrictEqual(r.geoeffnet, [],
            'ein geratenes Ziel ist schlechter als keines');
        assert.strictEqual(r.a.getAttribute('href'), '#',
            'der Verweis darf kein erfundenes Ziel bekommen');
    });

    it('und er sagt dem Leser, warum nichts passiert', () => {
        const r = laufen(verweis('Cardmarket'));
        assert.strictEqual(r.notiz.length, 1, 'stillschweigend ist keine Antwort');
        assert.match(r.notiz[0][1], /Beispielbild/);
        assert.match(r.notiz[0][1], /Cardmarket/);
        assert.match(r.a.getAttribute('title'), /Beispielbild/,
            'die zweite Begegnung soll schon vor dem Klick sprechen');
    });

    it('auf Englisch ebenso', () => {
        const r = laufen(verweis('Cardmarket'), 'en');
        assert.strictEqual(r.notiz.length, 1);
        assert.match(r.notiz[0][1], /example screenshot/i);
        assert.ok(!/Beispielbild/.test(r.notiz[0][1]));
    });

    it('der Bot-Verweis bekommt sein echtes Ziel', () => {
        const r = laufen(verweis('@TheDipidisBot'));
        assert.strictEqual(r.verhindert, 1);
        assert.strictEqual(r.a.getAttribute('href'), 'https://t.me/TheDipidisBot');
        assert.strictEqual(r.a.getAttribute('target'), '_blank');
        assert.strictEqual(r.a.getAttribute('rel'), 'noopener');
        assert.deepStrictEqual(r.geoeffnet, ['https://t.me/TheDipidisBot']);
        assert.deepStrictEqual(r.notiz, [],
            'ein Verweis, der funktioniert, braucht keine Entschuldigung');
    });

    it('Verweise ausserhalb der Anleitung bleiben unangetastet', () => {
        const r = laufen(verweis('Cardmarket', false));
        assert.strictEqual(r.verhindert, 0,
            'der Abfaenger greift nur innerhalb von #tutorial');
        assert.deepStrictEqual(r.notiz, []);
    });

    it('der Abfaenger haengt in der Fangphase am Dokument', () => {
        assert.match(SRC,
            /document\.addEventListener\('click', tutorialToterVerweis, true\)/,
            'ohne Fangphase kann ein anderer Zuhoerer den Verweis vorher '
            + 'weiterreichen');
        assert.match(funktion(SRC, 'tutorialToterVerweis'),
            /closest\('#tutorial a\[href="#"\]'\)/);
    });
});

describe('N5 — die neun Verweise sind noch da, der Abfang ist noetig', () => {
    it('der Anleitungstext enthaelt sie unveraendert', () => {
        // index.html und die Anleitungsdateien werden nicht angefasst; wenn
        // sie eines Tages doch repariert werden, faellt der Abfang nicht auf
        // die Fuesse — er greift dann einfach nicht mehr.
        for (const datei of ['tutorial/tutorial.de.html', 'tutorial/tutorial.en.html']) {
            const txt = fs.readFileSync(path.join(ROOT, datei), 'utf8');
            const tote = [...txt.matchAll(/<a href="#">([^<]*)<\/a>/g)].map(m => m[1]);
            const cm = tote.filter(t => /Cardmarket/.test(t)).length;
            const bot = tote.filter(t => /TheDipidisBot/.test(t)).length;
            assert.strictEqual(cm + bot, tote.length,
                datei + ': ein toter Verweis einer dritten Sorte ist dazugekommen — '
                + 'der Abfaenger behandelt ihn wie einen Beispielbild-Verweis, '
                + 'ohne dass jemand entschieden haette, ob das stimmt: '
                + JSON.stringify(tote));
        }
    });
});
