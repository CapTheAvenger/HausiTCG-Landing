/**
 * Das Wartetor des Seltenheits-Wechslers (★).
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross. Der Name behauptete Abdeckung
 * fuer genau die Stelle, an der der ★-Knopf entscheidet, ob er ueberhaupt
 * etwas anzeigen kann; `node --test` meldete darauf `# pass 1`.
 * scripts/run-js-unit-tests.sh zaehlt leere Dateien seit dem 30.08.2026
 * nicht mehr mit und benennt sie — das hier ist die Antwort darauf.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Beide Funktionen stehen unveraendert unter ihren alten Namen in
 * js/app-cards-db.js (Stand 07.09.2026):
 *
 *   hasLoadedCardDatabaseForRaritySwitcher   js/app-cards-db.js:4008
 *   ensureCardDatabaseReadyForRaritySwitcher js/app-cards-db.js:4012
 *
 * WAS AUF DEM SPIEL STEHT
 * -----------------------
 * Die Kartendatenbank wird verzoegert geladen. Wer den ★-Knopf drueckt,
 * bevor sie da ist, bekommt ohne dieses Tor eine leere Druckliste
 * praesentiert — es sieht aus, als gaebe es keine anderen Drucke.
 * Das Tor hat drei Wege: schon da, gerade nachgeladen, und aufgegeben.
 * Alle drei muessen ein SAUBERES ja/nein zurueckgeben; besonders der
 * Fehlerweg, denn ein geworfener Fehler wuerde den Klick verschlucken.
 *
 * KEIN jsdom: der Rumpf wird per Klammerzaehlung geschnitten und in
 * einem vm-Kontext ausgefuehrt. Livedaten liest die Datei keine.
 * Die Wartezeiten sind bewusst klein (10–200 ms) — die Funktion misst
 * mit Date.now(), also ist der Test in Millisekunden durch.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-cards-db.js'), 'utf8');

/**
 * Eine (auch async-) Funktionsdeklaration per Namen schneiden.
 *
 * Die Parameterliste wird BEWUSST zuerst uebersprungen: die gesuchte
 * Funktion heisst `ensureCardDatabaseReadyForRaritySwitcher(options = {})`,
 * und wer die Klammern ab dem ersten `{` zaehlt, hoert beim Vorgabewert
 * wieder auf und schneidet einen Rumpf ab, der nicht laeuft.
 */
function funktion(name) {
    const re = new RegExp(`(^|\\n)\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const m = re.exec(QUELLE);
    assert.ok(m, `Funktion nicht mehr in js/app-cards-db.js: ${name}`);
    const start = m.index + m[1].length;

    // Ueber die Parameterliste hinweg bis zur zugehoerigen `)`.
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
 *   datenbankSofort  – Inhalt von window.allCardsDatabase beim Start
 *   nachladen        – die Fassung von loadAllCardsDatabase fuer diesen Lauf
 */
function baue(opts = {}) {
    const protokoll = { warnungen: [], ladeAufrufe: 0 };
    const kasten = {
        Array, Number, Date, Promise, setTimeout, clearTimeout,
        console: { warn() {}, error() {} },
        devWarn: (...a) => { protokoll.warnungen.push(a.join(' ')); },
        window: { allCardsDatabase: opts.datenbankSofort },
        loadAllCardsDatabase: opts.nachladen
            ? (...a) => { protokoll.ladeAufrufe++; return opts.nachladen(kasten, ...a); }
            : undefined,
    };
    vm.createContext(kasten);
    vm.runInContext(
        funktion('hasLoadedCardDatabaseForRaritySwitcher') + '\n'
        + funktion('ensureCardDatabaseReadyForRaritySwitcher'),
        kasten);
    kasten._protokoll = protokoll;
    return kasten;
}

// ══════════════════════════════════════════════════════════════════
describe('hasLoadedCardDatabaseForRaritySwitcher — "sind Karten da?"', () => {
    it('ein gefuelltes Feld heisst ja', () => {
        assert.equal(baue({ datenbankSofort: [{ name: 'Iono' }] })
            .hasLoadedCardDatabaseForRaritySwitcher(), true);
    });

    it('ein LEERES Feld heisst nein — nicht "geladen, aber leer"', () => {
        // Genau hier lag der Sinn der Pruefung: ein leeres Feld ist ein
        // Ladezustand, kein Ergebnis. Wer nur auf Array.isArray prueft,
        // zeigt dem Nutzer eine leere Druckliste als Antwort.
        assert.equal(baue({ datenbankSofort: [] })
            .hasLoadedCardDatabaseForRaritySwitcher(), false);
    });

    it('undefined, null und ein Objekt heissen ebenfalls nein', () => {
        assert.equal(baue({}).hasLoadedCardDatabaseForRaritySwitcher(), false);
        assert.equal(baue({ datenbankSofort: null })
            .hasLoadedCardDatabaseForRaritySwitcher(), false);
        assert.equal(baue({ datenbankSofort: { laenge: 3 } })
            .hasLoadedCardDatabaseForRaritySwitcher(), false);
    });
});

describe('ensureCardDatabaseReadyForRaritySwitcher — die drei Wege', () => {
    it('sind die Karten schon da, wird gar nicht erst nachgeladen', async () => {
        const F = baue({
            datenbankSofort: [{ name: 'Iono' }],
            nachladen: async () => {},
        });
        assert.equal(await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 50 }), true);
        assert.equal(F._protokoll.ladeAufrufe, 0, 'kein ueberfluessiger Ladeaufruf');
    });

    it('laedt genau EINMAL nach und meldet dann ja', async () => {
        const F = baue({
            nachladen: async (kasten) => { kasten.window.allCardsDatabase = [{ name: 'Iono' }]; },
        });
        assert.equal(
            await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 200, pollIntervalMs: 5 }),
            true);
        assert.equal(F._protokoll.ladeAufrufe, 1);
    });

    it('wartet auf ein Nachladen, das erst SPAETER fertig wird', async () => {
        // Der Ladeaufruf kehrt sofort zurueck und fuellt das Feld erst
        // danach. Ohne die Warteschleife waere die Antwort hier nein.
        const F = baue({
            nachladen: (kasten) => {
                setTimeout(() => { kasten.window.allCardsDatabase = [{ name: 'Iono' }]; }, 25);
                return Promise.resolve();
            },
        });
        assert.equal(
            await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 400, pollIntervalMs: 5 }),
            true);
    });

    it('wird die Datenbank nie fertig, kommt nein — und zwar innerhalb der Frist', async () => {
        const F = baue({ nachladen: async () => {} });
        const ab = Date.now();
        const ok = await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 60, pollIntervalMs: 10 });
        const dauer = Date.now() - ab;
        assert.equal(ok, false);
        assert.ok(dauer < 2000, `die Frist wurde nicht eingehalten: ${dauer} ms`);
    });

    it('ein Fehler beim Nachladen wird NICHT durchgereicht, sondern zu nein', async () => {
        // Wuerde der Fehler fliegen, verschluckt der Klick auf ★ sich
        // still — der Knopf tut dann gar nichts.
        const F = baue({ nachladen: async () => { throw new Error('Netz weg'); } });
        const ok = await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 30, pollIntervalMs: 10 });
        assert.equal(ok, false);
        assert.equal(F._protokoll.warnungen.length, 1, 'der Fehler wird gemeldet, nicht geschluckt');
        assert.ok(F._protokoll.warnungen[0].includes('[RaritySwitch][ready]'),
            'die Meldung nennt die Stelle: ' + F._protokoll.warnungen[0]);
    });

    it('kommen die Karten TROTZ Ladefehler nachtraeglich an, ist die Antwort ja', async () => {
        const F = baue({
            nachladen: (kasten) => {
                setTimeout(() => { kasten.window.allCardsDatabase = [{ name: 'Iono' }]; }, 20);
                return Promise.reject(new Error('Netz weg'));
            },
        });
        assert.equal(
            await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 400, pollIntervalMs: 5 }),
            true);
    });

    it('fehlt loadAllCardsDatabase ganz, wird nur gewartet — ohne Absturz', async () => {
        const F = baue({});   // kein Nachladen im Kasten
        assert.equal(
            await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 30, pollIntervalMs: 10 }),
            false);
    });

    it('unbrauchbare Optionen fallen auf die Vorgaben zurueck (5000 / 100 ms)', async () => {
        // 0 und negative Werte sind keine Frist. Der Nachweis, dass die
        // Vorgabe greift: mit maxWaitMs 0 darf NICHT sofort nein kommen,
        // sondern es muss auf die nach 30 ms eintreffenden Karten warten.
        const F = baue({
            nachladen: (kasten) => {
                setTimeout(() => { kasten.window.allCardsDatabase = [{ name: 'Iono' }]; }, 30);
                return Promise.resolve();
            },
        });
        assert.equal(
            await F.ensureCardDatabaseReadyForRaritySwitcher({ maxWaitMs: 0, pollIntervalMs: -5 }),
            true);
    });

    it('ganz ohne Optionen laeuft es ebenfalls', async () => {
        const F = baue({
            datenbankSofort: [{ name: 'Iono' }],
            nachladen: async () => {},
        });
        assert.equal(await F.ensureCardDatabaseReadyForRaritySwitcher(), true);
    });
});
