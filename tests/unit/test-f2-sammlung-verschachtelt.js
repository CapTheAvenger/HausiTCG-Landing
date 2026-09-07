/**
 * Verschachtelte Sammlungsklicks: was passiert, wenn zwei Schreibvorgaenge
 * GLEICHZEITIG unterwegs sind und einer oder beide abgelehnt werden.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * addToCollection (js/firebase-collection.js) schreibt zuerst oertlich und
 * schickt die Aenderung danach weg, ohne auf die Antwort zu warten. Die
 * Ruecknahme im .catch ist damit der einzige Ort, an dem die Menge
 * window.userCollection und die Zaehlkarte window.userCollectionCounts
 * wieder zueinander finden.
 *
 * Bis zum 07.09.2026 hing die Loeschung aus der Menge an einem je Tipper
 * gemerkten `hadBefore`. Zwei schnelle Tipper auf dem Telefon:
 *
 *   Eingabe:  zwei addToCollection('Iono|PAL|185') ohne Warten dazwischen,
 *             Karte vorher nicht besessen, beide Schreibvorgaenge abgelehnt
 *   vorher:   Zaehlkarte leer, Menge ENTHIELT die Karte
 *             -> in der Sammlungsansicht besessen, aber ohne Anzahl
 *   jetzt:    beides leer
 *
 * Die Reparatur leitet die Zugehoerigkeit zur Menge aus dem
 * zurueckgerechneten Zaehlerstand ab. DIE ZUSICHERUNG, die hier gefahren
 * wird, ist genau diese Verkopplung:
 *
 *   userCollection.has(id)  ==  (userCollectionCounts.get(id) || 0) > 0
 *
 * Sie muss nach JEDER Verschachtelung gelten. Ob der oertliche Stand
 * danach noch dem Server entspricht, ist eine andere (schwaechere) Frage:
 * das Entfernen nimmt seinen eigenen Schreibvorgang gar nicht zurueck, und
 * absolute Zaehlerstaende koennen sich ueberholen. Ein Ladevorgang raeumt
 * eine solche Abweichung auf — ein widerspruechlicher Zustand in der
 * Oberflaeche tut es nicht, deshalb steht die Zusicherung dort.
 *
 * KEIN Netz, KEINE echte Firebase-Verbindung, KEINE Livedaten: db, auth
 * und firebase sind unten Attrappen und protokollieren nur, was
 * geschrieben werden sollte.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'firebase-collection.js'), 'utf8');

/** Eine (auch async-) Funktionsdeklaration per Namen aus der Quelle schneiden. */
function funktion(name) {
    const m = new RegExp(`(^|\\n)\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(QUELLE);
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
 *   bestand    – Startbestand als {kartenId: anzahl}
 *   antworten  – je Schreibvorgang in Reihenfolge: true = angenommen,
 *                false = abgelehnt. Fehlt ein Eintrag, gilt "angenommen".
 */
function baue(opts = {}) {
    const bestand = opts.bestand || {};
    const antworten = opts.antworten || [];
    const protokoll = { schreibvorgaenge: [], meldungen: [] };
    let n = 0;

    const window = {
        userCollection: new Set(Object.keys(bestand)),
        userCollectionCounts: new Map(Object.entries(bestand)),
        userWishlist: new Set(),
        showAuthModal: () => { throw new Error('kein Anmeldefenster erwartet'); },
        filteredCardsData: null,
    };

    const kasten = {
        String, Number, Object, Array, Map, Set, Math, Promise, JSON,
        console: { log() {}, warn() {}, error() {} },
        window,
        auth: { currentUser: { uid: 'nutzer-1' } },
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
            collection: () => ({
                doc: () => ({
                    update: (...args) => {
                        const angenommen = antworten.length > n ? antworten[n] : true;
                        n++;
                        protokoll.schreibvorgaenge.push({ angenommen, args });
                        return angenommen
                            ? Promise.resolve()
                            : Promise.reject(new Error('permission-denied'));
                    },
                }),
            }),
        },
        getLang: () => 'de',
        t: (k) => k,
        showNotification: (text, art) => protokoll.meldungen.push({ text, art }),
        updateCardUI: () => {},
        filterCollection: () => {},
        updateCollectionUI: () => {},
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

/** Auf die im .catch nachgereichten Ruecknahmen warten (mehrere Runden). */
async function ruhe(runden = 4) {
    for (let i = 0; i < runden; i++) await new Promise(r => setImmediate(r));
}

/** Lesbarer Ist-Zustand fuer Fehlermeldungen. */
function stand(F, id) {
    const c = F._w.userCollectionCounts;
    return `Menge=${F._w.userCollection.has(id)} Zaehlkarte=${c.has(id) ? c.get(id) : '(kein Eintrag)'}`;
}

/**
 * DIE Zusicherung: Zugehoerigkeit und Zaehlerstand sagen dasselbe.
 * Ein Bruch hier ist genau der Zustand "besessen, aber ohne Anzahl".
 */
function einklang(F, id) {
    const zahl = F._w.userCollectionCounts.get(id) || 0;
    assert.equal(F._w.userCollection.has(id), zahl > 0,
        `Menge und Zaehlkarte widersprechen sich: ${stand(F, id)}`);
}

const ID = 'Iono|PAL|185';

// ══════════════════════════════════════════════════════════════════
describe('zwei GLEICHZEITIGE Erhoehungen — beide abgelehnt', () => {
    it('nimmt beide zurueck: Menge leer, Zaehlkarte leer', async () => {
        const F = baue({ antworten: [false, false] });
        const erster = F.addToCollection(ID);
        const zweiter = F.addToCollection(ID);
        await erster; await zweiter; await ruhe();

        assert.equal(F._protokoll.schreibvorgaenge.length, 2, 'zwei Schreibvorgaenge unterwegs');
        assert.equal(F._w.userCollectionCounts.has(ID), false, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), false,
            'genau der behobene Befund: besessen ohne Anzahl — ' + stand(F, ID));
        einklang(F, ID);
        assert.equal(F._protokoll.meldungen.filter(m => m.art === 'error').length, 2,
            'der Nutzer erfaehrt von jeder Ablehnung');
    });

    it('auch bei DREI gleichzeitigen Tippern bleibt nichts haengen', async () => {
        const F = baue({ antworten: [false, false, false] });
        await Promise.all([F.addToCollection(ID), F.addToCollection(ID), F.addToCollection(ID)]);
        await ruhe();
        assert.equal(F._w.userCollectionCounts.has(ID), false, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), false, stand(F, ID));
        einklang(F, ID);
    });
});

describe('zwei GLEICHZEITIGE Erhoehungen — erste abgelehnt, zweite angenommen', () => {
    it('haelt die Karte besessen und zaehlt auf 1 zurueck', async () => {
        const F = baue({ antworten: [false, true] });
        const erster = F.addToCollection(ID);
        const zweiter = F.addToCollection(ID);
        await erster; await zweiter; await ruhe();

        // Die abgelehnte Erhoehung zieht ihren eigenen Tipper ab (2 -> 1).
        // Die angenommene bleibt stehen, also bleibt die Karte besessen.
        assert.equal(F._w.userCollectionCounts.get(ID), 1, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true,
            'eine angenommene Erhoehung darf die abgelehnte nicht mitreissen — ' + stand(F, ID));
        einklang(F, ID);
    });

    it('und andersherum — erste angenommen, zweite abgelehnt — genauso', async () => {
        const F = baue({ antworten: [true, false] });
        const erster = F.addToCollection(ID);
        const zweiter = F.addToCollection(ID);
        await erster; await zweiter; await ruhe();
        assert.equal(F._w.userCollectionCounts.get(ID), 1, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true, stand(F, ID));
        einklang(F, ID);
    });
});

describe('abgelehnte Erhoehung auf eine BEREITS BESESSENE Karte', () => {
    it('darf den vorhandenen Bestand nicht abraeumen (Bestand 2)', async () => {
        const F = baue({ bestand: { [ID]: 2 }, antworten: [false] });
        await F.addToCollection(ID);
        await ruhe();
        assert.equal(F._w.userCollectionCounts.get(ID), 2,
            'die zwei besessenen Kopien bleiben — ' + stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true,
            'die Karte darf NICHT aus der Sammlung verschwinden — ' + stand(F, ID));
        einklang(F, ID);
    });

    it('auch bei der letzten verbliebenen Kopie nicht (Bestand 1)', async () => {
        // Der Grenzfall gegen ein "im Ruecknahmezweig einfach immer loeschen":
        // hier steht nach der Ruecknahme noch 1, der Zweig wird gar nicht
        // erreicht, und die Karte bleibt besessen.
        const F = baue({ bestand: { [ID]: 1 }, antworten: [false] });
        await F.addToCollection(ID);
        await ruhe();
        assert.equal(F._w.userCollectionCounts.get(ID), 1, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true,
            'die einzige besessene Kopie darf nicht verschwinden — ' + stand(F, ID));
        einklang(F, ID);
    });

    it('zwei GLEICHZEITIGE abgelehnte Erhoehungen auf Bestand 1 lassen die 1 stehen', async () => {
        const F = baue({ bestand: { [ID]: 1 }, antworten: [false, false] });
        const erster = F.addToCollection(ID);
        const zweiter = F.addToCollection(ID);
        await erster; await zweiter; await ruhe();
        assert.equal(F._w.userCollectionCounts.get(ID), 1, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true, stand(F, ID));
        einklang(F, ID);
    });
});

describe('gleichzeitiges Hinzufuegen und Entfernen', () => {
    it('Bestand 1, das + wird abgelehnt, das - angenommen: kein Besitz ohne Anzahl', async () => {
        // Gemessen vor der Reparatur: Menge=true, Zaehlkarte=(kein Eintrag)
        // — dieselbe Widerspruchslage wie beim doppelten Tipper.
        const F = baue({ bestand: { [ID]: 1 }, antworten: [false, true] });
        const rauf = F.addToCollection(ID);
        const runter = F.removeFromCollection(ID);
        await rauf; await runter; await ruhe();

        einklang(F, ID);
        assert.equal(F._w.userCollectionCounts.has(ID), false, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), false, stand(F, ID));
    });

    it('Bestand 2, BEIDE abgelehnt: der Rest bleibt widerspruchsfrei', async () => {
        const F = baue({ bestand: { [ID]: 2 }, antworten: [false, false] });
        const rauf = F.addToCollection(ID);
        const runter = F.removeFromCollection(ID);
        await rauf; await runter; await ruhe();
        einklang(F, ID);
        assert.equal(F._w.userCollectionCounts.get(ID), 1, stand(F, ID));
        assert.equal(F._w.userCollection.has(ID), true, stand(F, ID));
    });

    it('nicht besessen, + dann - , das + abgelehnt: die Karte bleibt draussen', async () => {
        const F = baue({ antworten: [false, true] });
        const rauf = F.addToCollection(ID);
        const runter = F.removeFromCollection(ID);
        await rauf; await runter; await ruhe();
        einklang(F, ID);
        assert.equal(F._w.userCollection.has(ID), false, stand(F, ID));
    });
});

describe('removeFromCollection — der Spiegelfall, geprueft und benannt', () => {
    it('nimmt einen abgelehnten Schreibvorgang GAR NICHT zurueck (bekannte Luecke)', async () => {
        // Nachgemessen am 07.09.2026: der .catch beim Entfernen protokolliert
        // nur (js/firebase-collection.js, "[collection] decrement failed").
        // Das Muster mit der je Klick gemerkten Momentaufnahme gibt es dort
        // also gar nicht — es ist kein zweiter Fall desselben Fehlers, sondern
        // eine eigene, schwaechere Zusicherung: oertlich widerspruchsfrei,
        // aber moeglicherweise vom Server abweichend, bis neu geladen wird.
        // Dieser Test haelt den Ist-Zustand fest, damit eine spaetere
        // Ruecknahme dort bewusst geschrieben und nicht nebenbei erfunden wird.
        const F = baue({ bestand: { [ID]: 2 }, antworten: [false] });
        await F.removeFromCollection(ID);
        await ruhe();
        assert.equal(F._w.userCollectionCounts.get(ID), 1,
            'oertlich heruntergezaehlt, obwohl der Server abgelehnt hat — ' + stand(F, ID));
        einklang(F, ID);
    });

    it('die letzte abgelehnte Entfernung laesst Menge und Zaehlkarte trotzdem im Einklang', async () => {
        const F = baue({ bestand: { [ID]: 1 }, antworten: [false] });
        await F.removeFromCollection(ID);
        await ruhe();
        einklang(F, ID);
        assert.equal(F._w.userCollection.has(ID), false, stand(F, ID));
    });
});
