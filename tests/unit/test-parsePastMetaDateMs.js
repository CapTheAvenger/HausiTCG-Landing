/**
 * parsePastMetaDateMs() aus js/app-past-meta.js (Zeile 294).
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross. `node --test` meldet fuer eine leere Datei
 * `# pass 1`, der Name behauptete also Abdeckung, die es nicht gab —
 * genau die Luecke, die scripts/run-js-unit-tests.sh seit dem
 * 30.08.2026 gesondert ausweist.
 *
 * WAS DIE FUNKTION TUT
 * --------------------
 * Sie macht aus einem Turnierdatum eine Zahl, nach der die Liste der
 * vergangenen Metas sortiert wird (getPastMetaSortScore reicht sie als
 * `latestDateMap` durch). Zwei Wege: erst `new Date(roh)`, und wenn das
 * NaN ergibt, noch einmal ohne Ordnungszahl-Endung ("15th" -> "15").
 * Was auch dann nicht geht, wird 0 — kein Wurf, damit eine kaputte
 * Zeile die Sortierung nicht anhaelt.
 *
 * KEINE LIVEDATEN, KEIN jsdom: jede Eingabe setzt der Test selbst.
 *
 * ZEITZONE: ISO-Datumszeichenketten ("2026-03-15") liest V8 als UTC,
 * alle anderen Formen als ORTSZEIT. Die Sollwerte hier sind deshalb
 * entsprechend gebildet (Date.UTC bzw. new Date(j, m, t)) und nicht als
 * feste Millisekundenzahl geschrieben — sonst waere die Datei in jeder
 * Zeitzone ausser UTC rot.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-past-meta.js'), 'utf8');

/** Eine Funktionsdeklaration per Namen herausschneiden (Klammerzaehlung). */
function funktion(name, quelle = QUELLE) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(quelle);
    if (!m) throw new Error('Funktion nicht gefunden: ' + name);
    const start = quelle.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = quelle.indexOf('{', start); i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}') {
            tiefe--;
            if (tiefe === 0) return quelle.slice(start, i + 1);
        }
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

// eslint-disable-next-line no-new-func
const parsePastMetaDateMs = new Function(
    funktion('parsePastMetaDateMs') + '\nreturn parsePastMetaDateMs;'
)();

describe('parsePastMetaDateMs — was nicht lesbar ist, wird 0', () => {
    it('leere und fehlende Eingaben ergeben 0, ohne zu werfen', () => {
        // Gemessen an js/app-past-meta.js:294 mit jeder dieser Eingaben.
        for (const leer of ['', '   ', '\t\n', null, undefined, 0, false, NaN]) {
            assert.equal(parsePastMetaDateMs(leer), 0,
                `Eingabe ${JSON.stringify(leer)} haette 0 ergeben muessen`);
        }
    });

    it('unlesbarer Text ergibt 0 statt NaN', () => {
        // NaN waere hier das Gefaehrliche: es faellt durch jeden
        // Groessenvergleich der Sortierung und macht sie lautlos wirkungslos.
        for (const muell of ['kein Datum', '2026-13-45', '15.03.2026', '٢٠٢٦', '—']) {
            const erg = parsePastMetaDateMs(muell);
            assert.equal(erg, 0, `Eingabe ${JSON.stringify(muell)} → ${erg}`);
            assert.equal(Number.isNaN(erg), false, 'NaN darf nie herauskommen');
        }
    });

    it('eine Zahl als Eingabe ist KEIN Zeitstempel — 1700000000000 → 0', () => {
        // Belegt eine Eigenschaft, die man leicht anders erwartet: die
        // Funktion wandelt IMMER erst in eine Zeichenkette um, und
        // new Date("1700000000000") ist ungueltig. Wer hier einen
        // Millisekundenwert durchreicht, verliert ihn still.
        assert.equal(parsePastMetaDateMs(1700000000000), 0);
    });
});

describe('parsePastMetaDateMs — der direkte Weg', () => {
    it('ISO-Datum wird als UTC gelesen', () => {
        assert.equal(parsePastMetaDateMs('2026-03-15'), Date.UTC(2026, 2, 15));
    });

    it('ISO mit Uhrzeit und Zonenkennung behaelt die Uhrzeit', () => {
        assert.equal(parsePastMetaDateMs('2026-03-15T12:00:00Z'), Date.UTC(2026, 2, 15, 12));
    });

    it('umschliessende Leerzeichen werden vorher abgeschnitten', () => {
        assert.equal(parsePastMetaDateMs('  2026-03-15  '), Date.UTC(2026, 2, 15));
        assert.equal(parsePastMetaDateMs('\n2026-03-15\t'), Date.UTC(2026, 2, 15));
    });

    it('Klartextdatum wird als Ortszeit gelesen', () => {
        assert.equal(parsePastMetaDateMs('March 15, 2026'), new Date(2026, 2, 15).getTime());
    });
});

describe('parsePastMetaDateMs — der Rueckfall ohne Ordnungszahl', () => {
    // GEMESSEN, weil man es anders vermuten wuerde: V8 liest
    // "1st August 2026" schon DIREKT, "15th March 2026" dagegen nicht
    // (new Date(...) ist NaN). Nur die zweite Form erreicht ueberhaupt
    // den zweiten Zweig. Faellt die Zeile mit dem Ersetzen weg, gibt
    // die Funktion fuer sie 0 zurueck.
    it('"15th March 2026" kommt erst ueber den bereinigten Zweig durch', () => {
        assert.equal(Number.isNaN(new Date('15th March 2026').getTime()), true,
            'Vorpruefung: der direkte Weg muss fuer diese Form scheitern, '
            + 'sonst prueft dieser Test den Rueckfall gar nicht');
        assert.equal(parsePastMetaDateMs('15th March 2026'), new Date(2026, 2, 15).getTime());
    });

    it('auch "2026 March 15th" und "Sat, 15th March 2026" kommen an', () => {
        const soll = new Date(2026, 2, 15).getTime();
        assert.equal(parsePastMetaDateMs('2026 March 15th'), soll);
        assert.equal(parsePastMetaDateMs('Sat, 15th March 2026'), soll);
    });

    it('die Ersetzung greift auch mitten in einer ISO-Form', () => {
        // "2026-03rd-15" ist so in keiner Quelle zu erwarten, belegt
        // aber, dass /(\d+)(st|nd|rd|th)/gi global und nicht nur am
        // Ende ersetzt: aus 03rd wird 03, und dann ist es wieder ISO.
        assert.equal(parsePastMetaDateMs('2026-03rd-15'), Date.UTC(2026, 2, 15));
    });

    it('die Ordnungszahl rettet nur, was sonst lesbar waere', () => {
        // "15th.03.2026" wird zu "15.03.2026" — und das bleibt unlesbar.
        assert.equal(parsePastMetaDateMs('15th.03.2026'), 0);
    });
});

describe('parsePastMetaDateMs — die Ordnung, fuer die es die Funktion gibt', () => {
    it('spaeter ist groesser, und unlesbar sortiert nach ganz unten', () => {
        const frueh   = parsePastMetaDateMs('2025-01-03');
        const spaet   = parsePastMetaDateMs('2026-08-01');
        const kaputt  = parsePastMetaDateMs('Datum fehlt');
        assert.ok(spaet > frueh, `${spaet} > ${frueh} erwartet`);
        assert.ok(kaputt < frueh, 'eine unlesbare Zeile darf keine Zeile ueberholen');

        const sortiert = ['2026-08-01', 'Datum fehlt', '2025-01-03']
            .sort((a, b) => parsePastMetaDateMs(b) - parsePastMetaDateMs(a));
        assert.deepEqual(sortiert, ['2026-08-01', '2025-01-03', 'Datum fehlt']);
    });

    it('zwei Schreibweisen desselben Tages ergeben dieselbe Zahl', () => {
        // Sonst listet dieselbe Woche zweimal an zwei Stellen.
        assert.equal(
            parsePastMetaDateMs('March 15, 2026'),
            parsePastMetaDateMs('15th March 2026')
        );
    });
});
