/**
 * Die Sammlung: hinzufuegen, entfernen — und was passiert, wenn der
 * Server das Schreiben ablehnt.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross und meldete `# pass 1`.
 * scripts/run-js-unit-tests.sh zaehlt leere Dateien seit dem 30.08.2026
 * nicht mehr mit und benennt sie — das hier ist die Antwort darauf.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Die geprueften Funktionen stehen unveraendert unter ihren alten Namen
 * in js/firebase-collection.js (Stand 07.09.2026):
 *
 *   countFieldRef        js/firebase-collection.js:197
 *   fcText               js/firebase-collection.js:249
 *   requireSignIn        js/firebase-collection.js:257
 *   addToCollection      js/firebase-collection.js:273
 *   removeFromCollection js/firebase-collection.js:359
 *
 * WAS AUF DEM SPIEL STEHT
 * -----------------------
 * addToCollection schreibt ZUERST oertlich und schickt die Aenderung
 * DANACH weg, ohne auf die Antwort zu warten. Das ist so gewollt (offline
 * bewegte sich das Abzeichen sonst nie), verlagert aber die ganze Last
 * auf den Ruecknahmeweg im .catch: dort muessen die Menge
 * window.userCollection und die Zaehlkarte window.userCollectionCounts
 * nach JEDER Ruecknahme noch zueinander passen — auch wenn zwei Klicks
 * gleichzeitig unterwegs sind und BEIDE abgelehnt werden. Der Kommentar
 * im Quelltext beschreibt genau diesen Fall; hier wird er gefahren.
 *
 * KEIN jsdom, KEIN Netz, KEINE Livedaten: Firestore ist unten nachgebaut
 * und protokolliert nur, was geschrieben werden sollte.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'firebase-collection.js'), 'utf8');

/** Eine (auch async-) Funktionsdeklaration per Namen schneiden. */
function funktion(name) {
    const re = new RegExp(`(^|\\n)\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const m = re.exec(QUELLE);
    assert.ok(m, `Funktion nicht mehr in js/firebase-collection.js: ${name}`);
    const start = m.index + m[1].length;
    let runde = 0, nachParam = -1;
    for (let i = QUELLE.indexOf('(', start); i < QUELLE.length; i++) {
        if (QUELLE[i] === '(') runde++;
        else if (QUELLE[i] === ')' && --runde === 0) { nachParam = i + 1; break; }
    }
    assert.ok(nachParam > 0, name + ': die Parameterliste geht nicht auf');
    let tiefe = 0;
    for (let i = QUELLE.indexOf('{', nachParam); i < QUELLE.length; i++) {
        if (QUELLE[i] === '{') tiefe++;
        else if (QUELLE[i] === '}' && --tiefe === 0) return QUELLE.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

/**
 * @param {object} opts
 *   angemeldet   – false lässt auth.currentUser leer
 *   bestand      – Startbestand als {kartenId: anzahl}
 *   schreibfehler– true: jedes update() wird abgelehnt
 */
function baue(opts = {}) {
    const protokoll = { schreibvorgaenge: [], meldungen: [], oberflaeche: [], authFenster: 0 };

    const bestand = opts.bestand || {};
    const window = {
        userCollection: new Set(Object.keys(bestand)),
        userCollectionCounts: new Map(Object.entries(bestand)),
        userWishlist: new Set(opts.wunschliste || []),
        showAuthModal: () => { protokoll.authFenster++; },
        filteredCardsData: null,
    };

    const kasten = {
        String, Number, Object, Array, Map, Set, Math, Promise, JSON,
        console: { log() {}, warn() {}, error() {} },
        window,
        auth: { currentUser: opts.angemeldet === false ? null : { uid: 'nutzer-1' } },
        firebase: {
            firestore: {
                FieldPath: function (...seg) { this.pfad = seg.join('/'); },
                FieldValue: {
                    arrayUnion: (v) => ({ _art: 'arrayUnion', wert: v }),
                    arrayRemove: (v) => ({ _art: 'arrayRemove', wert: v }),
                    delete: () => ({ _art: 'delete' }),
                },
            },
        },
        db: {
            collection: (c) => ({
                doc: (id) => ({
                    update: (...args) => {
                        protokoll.schreibvorgaenge.push({ sammlung: c, dok: id, args });
                        return opts.schreibfehler
                            ? Promise.reject(new Error('permission-denied'))
                            : Promise.resolve();
                    },
                }),
            }),
        },
        getLang: () => 'de',
        t: (k) => k,
        showNotification: (text, art) => protokoll.meldungen.push({ text, art }),
        updateCardUI: (id) => protokoll.oberflaeche.push(['updateCardUI', id]),
        filterCollection: () => protokoll.oberflaeche.push(['filterCollection']),
        updateCollectionUI: () => protokoll.oberflaeche.push(['updateCollectionUI']),
        removeFromWishlist: async (id) => { window.userWishlist.delete(id); },
    };
    vm.createContext(kasten);
    vm.runInContext([
        funktion('countFieldRef'),
        funktion('fcText'),
        funktion('requireSignIn'),
        funktion('addToCollection'),
        funktion('removeFromCollection'),
    ].join('\n'), kasten);

    kasten._w = window;
    kasten._protokoll = protokoll;
    return kasten;
}

/** Auf die im .catch nachgereichte Ruecknahme warten. */
const ruhe = () => new Promise(r => setImmediate(r));

// ══════════════════════════════════════════════════════════════════
describe('countFieldRef — der Feldpfad zur Zaehlkarte', () => {
    it('baut einen FieldPath, wenn Firebase da ist — ohne Punkt-Verkettung', () => {
        // Wichtig, weil Kartenschluessel selbst Punkte enthalten koennen:
        // "collectionCounts.Mr. Mime|SVI|1" waere sonst ein Unterobjekt.
        const F = baue();
        const p = F.countFieldRef('collectionCounts', 'Mr. Mime|SVI|1');
        assert.equal(typeof p, 'object');
        assert.equal(p.pfad, 'collectionCounts/Mr. Mime|SVI|1');
    });
});

describe('fcText — Uebersetzung mit Rueckfalltext', () => {
    it('faellt auf den mitgegebenen Text zurueck, wenn t() den Schluessel spiegelt', () => {
        const F = baue();
        assert.equal(F.fcText('notif.maxCopiesPlayset', 'Maximum 4 copies'), 'Maximum 4 copies');
    });
});

describe('requireSignIn — das Tor vor jedem Schreibvorgang', () => {
    it('angemeldet: ja, und kein Anmeldefenster', () => {
        const F = baue();
        assert.equal(F.requireSignIn(), true);
        assert.equal(F._protokoll.authFenster, 0);
    });

    it('nicht angemeldet: nein, und das Anmeldefenster geht auf', () => {
        const F = baue({ angemeldet: false });
        assert.equal(F.requireSignIn(), false);
        assert.equal(F._protokoll.authFenster, 1);
    });
});

// ══════════════════════════════════════════════════════════════════
describe('addToCollection — eine Karte in die Sammlung legen', () => {
    it('legt sie oertlich an und zaehlt auf 1', async () => {
        const F = baue();
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 1);
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), true);
    });

    it('zaehlt beim naechsten Mal hoch', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 2 } });
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 3);
    });

    it('bei vier Kopien ist Schluss — kein Schreibvorgang, aber eine Meldung', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 4 } });
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 4);
        assert.equal(F._protokoll.schreibvorgaenge.length, 0);
        assert.equal(F._protokoll.meldungen.length, 1);
        assert.equal(F._protokoll.meldungen[0].art, 'info');
    });

    it('ohne Anmeldung passiert gar nichts', async () => {
        const F = baue({ angemeldet: false });
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.size, 0);
        assert.equal(F._protokoll.schreibvorgaenge.length, 0);
        assert.equal(F._protokoll.authFenster, 1);
    });

    it('geschrieben wird in das eigene Nutzerdokument, mit arrayUnion und der neuen Zahl', async () => {
        const F = baue();
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._protokoll.schreibvorgaenge.length, 1);
        const s = F._protokoll.schreibvorgaenge[0];
        assert.equal(s.sammlung, 'users');
        assert.equal(s.dok, 'nutzer-1');
        assert.equal(s.args[0], 'collection');
        assert.equal(s.args[1]._art, 'arrayUnion');
        assert.equal(s.args[1].wert, 'Iono|PAL|185');
        assert.equal(s.args[2].pfad, 'collectionCounts/Iono|PAL|185');
        assert.equal(s.args[3], 1, 'die NEUE Zahl, nicht die alte');
    });

    it('steht die Karte auf der Wunschliste, verschwindet sie dort', async () => {
        const F = baue({ wunschliste: ['Iono|PAL|185'] });
        await F.addToCollection('Iono|PAL|185');
        assert.equal(F._w.userWishlist.has('Iono|PAL|185'), false);
    });

    it('lehnt der Server ab, wird die oertliche Aenderung zurueckgenommen', async () => {
        const F = baue({ schreibfehler: true });
        await F.addToCollection('Iono|PAL|185');
        await ruhe();
        assert.equal(F._w.userCollectionCounts.has('Iono|PAL|185'), false,
            'die Zaehlkarte ist wieder leer');
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), false,
            'die Menge ebenfalls');
        assert.equal(F._protokoll.meldungen.some(m => m.art === 'error'), true,
            'der Nutzer erfaehrt davon');
    });

    it('die Ruecknahme nimmt nur DIESEN Klick zurueck, nicht den vorhandenen Bestand', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 2 }, schreibfehler: true });
        await F.addToCollection('Iono|PAL|185');
        await ruhe();
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 2,
            'die zwei vorher besessenen Kopien bleiben');
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), true);
    });

    it('zwei abgelehnte Klicks NACHEINANDER lassen Menge und Zaehlkarte im Einklang', async () => {
        // Der einfache Fall: die erste Ruecknahme ist durch, bevor der
        // zweite Klick liest. Wuerde jede Ruecknahme ihren eigenen
        // Ausgangswert zurueckspielen, saehe die Menge "nicht vorhanden"
        // und die Zaehlkarte gleichzeitig "1".
        const F = baue({ schreibfehler: true });
        await F.addToCollection('Iono|PAL|185');
        await ruhe();
        await F.addToCollection('Iono|PAL|185');
        await ruhe();
        const zahl = F._w.userCollectionCounts.get('Iono|PAL|185');
        assert.equal(zahl, undefined, `Zaehlkarte sagt ${zahl}`);
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), false,
            'Menge und Zaehlkarte sagen dasselbe: nicht besessen');
    });

    /*
     * BEHOBEN am 07.09.2026 — vorher ein offener, uebersprungener Befund.
     *
     * Der Ruecknahmeweg haengte die Loeschung aus der Menge an einem je
     * Tipper gemerkten `hadBefore`. Der zweite von zwei GLEICHZEITIGEN
     * Tippern sah die Karte durch die optimistische Aenderung des ersten
     * schon in der Menge, merkte sich hadBefore = true, und seine
     * Ruecknahme loeschte nichts.
     *
     *   Eingabe:  zwei addToCollection('Iono|PAL|185') auf eine nicht
     *             besessene Karte, ohne dazwischen auf die Ablehnung zu
     *             warten; beide Schreibvorgaenge werden abgelehnt
     *   vorher:   userCollectionCounts: kein Eintrag  /  userCollection:
     *             ENTHAELT die Karte  -> besessen ohne Anzahl
     *   jetzt:    beide leer
     *
     * Die Reparatur steht in js/firebase-collection.js: die Zugehoerigkeit
     * zur Menge wird aus dem zurueckgerechneten Zaehlerstand abgeleitet
     * (>0 besessen, 0 nicht besessen) statt aus einer Momentaufnahme.
     * Weitere verschachtelte Faelle: tests/unit/test-f2-sammlung-*.js
     */
    it('zwei GLEICHZEITIG abgelehnte Klicks — Menge und Zaehlkarte bleiben im Einklang', async () => {
        const F = baue({ schreibfehler: true });
        const erster  = F.addToCollection('Iono|PAL|185');
        const zweiter = F.addToCollection('Iono|PAL|185');
        await erster; await zweiter; await ruhe(); await ruhe();
        assert.equal(F._w.userCollectionCounts.has('Iono|PAL|185'), false,
            'die Zaehlkarte ist wieder leer');
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), false,
            'die Menge behauptet sonst Besitz ohne Anzahl');
    });
});

// ══════════════════════════════════════════════════════════════════
describe('removeFromCollection — eine Karte wieder herausnehmen', () => {
    it('zaehlt von 3 auf 2 herunter und schreibt nur die Zahl', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 3 } });
        await F.removeFromCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 2);
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), true);
        const s = F._protokoll.schreibvorgaenge[0];
        assert.equal(s.args.length, 2, 'nur Feldpfad und Zahl, kein arrayRemove');
        assert.equal(s.args[1], 2);
    });

    it('bei der letzten Kopie fliegt sie ganz raus — Menge, Zaehlkarte und Server', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 1 } });
        await F.removeFromCollection('Iono|PAL|185');
        assert.equal(F._w.userCollection.has('Iono|PAL|185'), false);
        assert.equal(F._w.userCollectionCounts.has('Iono|PAL|185'), false);
        const s = F._protokoll.schreibvorgaenge[0];
        assert.equal(s.args[1]._art, 'arrayRemove');
        assert.equal(s.args[3]._art, 'delete');
    });

    it('eine gar nicht besessene Karte laesst den Bestand in Ruhe', async () => {
        const F = baue({ bestand: { 'Ultra Ball|SVI|196': 2 } });
        await F.removeFromCollection('Iono|PAL|185');
        assert.equal(F._w.userCollectionCounts.has('Iono|PAL|185'), false);
        assert.equal(F._w.userCollectionCounts.get('Ultra Ball|SVI|196'), 2);
    });

    it('ohne Anmeldung passiert nichts — und es geht KEIN Anmeldefenster auf', () => {
        // Anders als beim Hinzufuegen: das Entfernen laeuft nur ueber die
        // Sammlungsansicht, die es ohne Anmeldung gar nicht gibt.
        const F = baue({ angemeldet: false, bestand: { 'Iono|PAL|185': 2 } });
        F.removeFromCollection('Iono|PAL|185');
        assert.equal(F._protokoll.schreibvorgaenge.length, 0);
        assert.equal(F._protokoll.authFenster, 0);
    });

    it('ein abgelehnter Schreibvorgang bleibt beim Entfernen ohne Absturz', async () => {
        const F = baue({ bestand: { 'Iono|PAL|185': 2 }, schreibfehler: true });
        await F.removeFromCollection('Iono|PAL|185');
        await ruhe();
        assert.equal(F._w.userCollectionCounts.get('Iono|PAL|185'), 1);
        assert.equal(F._protokoll.meldungen.some(m => m.art === 'success'), true);
    });

    it('die Meldung nennt die verbleibende Zahl bzw. sagt "entfernt"', async () => {
        const F1 = baue({ bestand: { 'Iono|PAL|185': 3 } });
        await F1.removeFromCollection('Iono|PAL|185');
        assert.ok(/2\/4/.test(F1._protokoll.meldungen[0].text),
            'erwartet "2/4", bekommen: ' + F1._protokoll.meldungen[0].text);

        const F2 = baue({ bestand: { 'Iono|PAL|185': 1 } });
        await F2.removeFromCollection('Iono|PAL|185');
        assert.equal(F2._protokoll.meldungen[0].text, 'Aus Sammlung entfernt');
    });

    it('hinzufuegen und wieder entfernen fuehrt auf den Ausgangszustand zurueck', async () => {
        const F = baue();
        await F.addToCollection('Iono|PAL|185');
        await F.removeFromCollection('Iono|PAL|185');
        assert.equal(F._w.userCollection.size, 0);
        assert.equal(F._w.userCollectionCounts.size, 0);
    });
});
