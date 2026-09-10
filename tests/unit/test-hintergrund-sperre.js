/**
 * Die Seite hinter einem Vollbild anhalten — AUSGEFUEHRT, nicht gegriffen.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Der Nutzer meldete am 10.09.2026: „Wenn ich in der Ansicht bin, kann ich
 * manchmal die Seite dahinter scrollen." Gemeldet fuer das Detailfenster
 * der Pokedex-Ansicht, gemessen fuer die ganze Seite.
 *
 * Die Sperre GAB es — fuenf Stellen setzten
 * `document.body.style.overflow = 'hidden'` bzw. eine Klasse mit
 * derselben Regel. Sie hat nur nie gewirkt: `html` traegt in
 * css/styles.css:225 ein eigenes `overflow-x: hidden`, und ein
 * `overflow` am Body erreicht den Viewport nur, solange `html` auf
 * `visible` steht.
 *
 * GEMESSEN live am 10.09.2026 auf 202609100611-b527580, im Browser des
 * Betreibers:
 *
 *   document.body.classList.add('sqp-d-open')
 *     -> getComputedStyle(body).overflowY  === 'hidden'
 *     -> getComputedStyle(html).overflowY  === 'auto'
 *   window.scrollTo({top: 700, behavior: 'instant'})
 *     -> window.scrollY  200 -> 700
 *
 * Die Seite lief also weiter, obwohl die Sperre stand. Dass alle Tests
 * gruen waren, lag daran, dass keiner die Sperre AUSGEFUEHRT hat — sie
 * wurde gesetzt und geglaubt.
 *
 * Diese Datei laesst js/hintergrund-sperre.js deshalb wirklich laufen und
 * prueft, was am Dokument ankommt.
 *
 * KEIN jsdom — der Testschritt in deploy-pages.yml installiert nur
 * papaparse. Der Ersatz unten kann genau das, was das Modul anfasst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'hintergrund-sperre.js'), 'utf8');

/** Ein Dokument, das sich bewegen kann — sonst prueft der Test nichts. */
function umgebung(startStand) {
    const klassen = new Set();
    const body = {
        style: {},
        classList: {
            add(k) { klassen.add(k); },
            remove(k) { klassen.delete(k); },
            contains(k) { return klassen.has(k); }
        }
    };
    const wurzel = { style: {}, scrollTop: startStand || 0 };
    const dok = { body: body, documentElement: wurzel };
    const gerollt = [];
    const fenster = {
        document: dok,
        pageYOffset: startStand || 0,
        scrollTo(x, y) {
            gerollt.push({ x: x, y: y, verhalten: wurzel.style.scrollBehavior });
            fenster.pageYOffset = y;
            wurzel.scrollTop = y;
        }
    };
    fenster.window = fenster;
    new Function('window', 'document', QUELLE)(fenster, dok);
    return { sperre: fenster.HintergrundSperre, body, wurzel, fenster, gerollt, klassen };
}

describe('HintergrundSperre', () => {

    it('legt den Koerper fest und merkt sich den Stand', () => {
        const u = umgebung(340);
        u.sperre.sperren('pruefung');
        assert.equal(u.body.style.position, 'fixed',
            'ohne position:fixed bleibt das Dokument scrollbar — genau der '
            + 'gemeldete Fehler');
        assert.equal(u.body.style.top, '-340px',
            'ohne den negativen Versatz springt die Seite beim Oeffnen an '
            + 'ihren Anfang');
        assert.equal(u.body.style.width, '100%');
        assert.ok(u.klassen.has('hintergrund-gesperrt'));
        assert.equal(u.sperre.aktiv(), true);
    });

    it('gibt den Stand beim Freigeben exakt zurueck', () => {
        const u = umgebung(340);
        u.sperre.sperren('pruefung');
        u.sperre.freigeben('pruefung');
        assert.equal(u.body.style.position, '', 'der Koerper bleibt festgenagelt');
        assert.equal(u.body.style.top, '');
        assert.equal(u.klassen.has('hintergrund-gesperrt'), false);
        assert.deepEqual(u.gerollt, [{ x: 0, y: 340, verhalten: 'auto' }],
            'der Stand wird nicht wiederhergestellt — der Leser landet nach '
            + 'dem Schliessen woanders als vorher');
        assert.equal(u.sperre.aktiv(), false);
    });

    it('schaltet scroll-behavior fuer die Rueckkehr ab und wieder an', () => {
        // `html` traegt auf dieser Seite `scroll-behavior: smooth`. Ohne
        // die Klammer faehrt die Seite nach dem Schliessen sichtbar an
        // ihre alte Stelle zurueck.
        const u = umgebung(500);
        u.wurzel.style.scrollBehavior = '';
        u.sperre.sperren('a');
        u.sperre.freigeben('a');
        assert.equal(u.gerollt[0].verhalten, 'auto',
            'die Rueckkehr laeuft mit smooth — das sieht aus wie ein Ruckler');
        assert.equal(u.wurzel.style.scrollBehavior, '',
            'scroll-behavior bleibt auf auto stehen und nimmt der ganzen '
            + 'Seite das weiche Scrollen');
    });

    it('zaehlt Halter: erst der letzte gibt die Seite frei', () => {
        const u = umgebung(120);
        u.sperre.sperren('erstes');
        u.sperre.sperren('zweites');
        u.sperre.freigeben('erstes');
        assert.equal(u.body.style.position, 'fixed',
            'das zweite Overlay steht noch offen, die Seite darf nicht laufen');
        assert.equal(u.sperre.aktiv(), true);
        u.sperre.freigeben('zweites');
        assert.equal(u.body.style.position, '');
        assert.equal(u.sperre.aktiv(), false);
    });

    it('zweimal derselbe Name zaehlt einmal', () => {
        // Ein Overlay, das sich neu zeichnet, sperrt erneut. Wuerde das
        // hochzaehlen, gaebe ein einzelnes Schliessen die Seite nie frei.
        const u = umgebung(80);
        u.sperre.sperren('detail');
        u.sperre.sperren('detail');
        u.sperre.sperren('detail');
        assert.deepEqual(u.sperre.halter(), ['detail']);
        u.sperre.freigeben('detail');
        assert.equal(u.body.style.position, '',
            'die Seite bleibt gesperrt, obwohl das Fenster zu ist');
    });

    it('ein Freigeben ohne Sperre tut nichts', () => {
        const u = umgebung(60);
        u.sperre.freigeben('gibtesnicht');
        assert.equal(u.sperre.aktiv(), false);
        assert.deepEqual(u.gerollt, [],
            'ein unbeteiligtes Freigeben rollt die Seite irgendwohin');
    });

    it('erhaelt vorhandene Stilwerte des Koerpers', () => {
        const u = umgebung(0);
        u.body.style.position = 'relative';
        u.body.style.width = '90%';
        u.sperre.sperren('x');
        u.sperre.freigeben('x');
        assert.equal(u.body.style.position, 'relative',
            'die Sperre wirft fremde Stilwerte weg');
        assert.equal(u.body.style.width, '90%');
    });
});
