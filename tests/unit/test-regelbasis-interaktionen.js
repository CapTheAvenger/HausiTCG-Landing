/**
 * data/card_capability_interactions.json — IST "0.1" EHRLICH?
 *
 * DER BEFUND, DER ZU DIESER DATEI FUEHRTE
 * ---------------------------------------
 * Die Regelbasis fuer Tech-Interaktionen steht seit dem 15.05.2026 auf
 * `"version": "0.1"`. Zwei Lesarten: entweder ist die Datei bewusst
 * unvollstaendig und sagt das — oder die 0.1 ist ein vergessener
 * Platzhalter aus einem Entwurf.
 *
 * GEMESSEN 10.09.2026
 * -------------------
 *   Eintraege in dieser Datei                       :  5
 *   data/card_capability_patterns.json (auch v0.1)  : 16 Muster
 *   Faehigkeitsmarken darin                         :  9
 *     davon attack.*                                :  3
 *     davon ability.*                               :  5
 *     davon weder-noch (disruption.hand_reset)      :  1
 *   moegliche Angreifer-/Verteidigerpaare (3 x 5)   : 15
 *   davon beschrieben                               :  5  = 33,3 %
 *   Paarungen mit unbekannter Marke ("Waisen")      :  0
 *
 * Die Angabe ist also EHRLICH: ein Drittel der Paare, die die eigene
 * Musterdatei ueberhaupt bilden kann, und die Oberflaeche schreibt die
 * Luecke hin, statt sie zu verschweigen — `datenstand()` in
 * js/tech-ideen.js liest Version, Datum und die Zahl der Paarungen aus
 * dieser Datei und haengt sie an jede Empfehlung; was fehlt, erscheint
 * als "keine Daten" (tests/unit/test-tech-beleg-kennzeichnung.js).
 *
 * WAS TROTZDEM FEHLTE
 * -------------------
 * KEIN einziger Test hat diese Datei bis zum 10.09.2026 gelesen.
 * Gesucht wurde in tests/ nach `readFileSync`, `require(`, `JSON.parse`
 * und `existsSync` in Verbindung mit dem Dateinamen — null Treffer. Alle
 * Erwaehnungen prueften nur, dass der NAME irgendwo im Quelltext steht.
 * Eine Paarung mit vertippter Marke waere damit eine tote Regel gewesen,
 * die niemand je gemeldet haette.
 *
 * Und die Zahl "fuenf Paarungen" steht am 10.09.2026 an zehn Stellen in
 * fuenf Dateien unter js/ als Fliesstext. Wer eine sechste ergaenzt,
 * macht zehn Saetze falsch. Diese Datei nennt sie beim Namen, sobald
 * die Zahl sich bewegt — sie schreibt NICHT vor, dass es fuenf bleiben
 * muessen (CLAUDE.md: Veraenderung gegen einen Grundstand messen).
 *
 * NICHT GEPRUEFT: ob die fuenf Paarungen inhaltlich RICHTIG sind, und ob
 * `matchup_value` (die Prozentpunkte) je an Partien gemessen wurde. Im
 * Repo gibt es dazu keine Quelle, und der Sandkasten hat keinen Netzweg
 * zu einer.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const REGEL_PFAD  = path.join(WURZEL, 'data', 'card_capability_interactions.json');
const MUSTER_PFAD = path.join(WURZEL, 'data', 'card_capability_patterns.json');

const REGEL  = JSON.parse(fs.readFileSync(REGEL_PFAD, 'utf8'));
const MUSTER = JSON.parse(fs.readFileSync(MUSTER_PFAD, 'utf8'));

/* Die Marken, die die Musterdatei ueberhaupt vergeben kann. */
const MARKEN = new Set(MUSTER.patterns.map(m => m.capability || m.tag).filter(Boolean));
const ANGREIFER = [...MARKEN].filter(m => m.startsWith('attack.')).sort();
const VERTEIDIGER = [...MARKEN].filter(m => m.startsWith('ability.')).sort();

/* Die Platzhalter, die js/card-capability-engine.js `_narrative()`
   tatsaechlich ersetzt. Steht einer im Text, den die Maschine nicht
   kennt, erscheint er dem Nutzer roh als "{foo}". */
const ERSETZTE_PLATZHALTER = new Set([
    'attacker_name', 'attacker_source', 'defender_name', 'defender_ability',
]);

describe('die Regelbasis sagt, was sie ist', () => {

    it('Version und Datum stehen drin — die Oberflaeche liest genau die', () => {
        /* js/tech-ideen.js datenstand() haengt beide an jede Empfehlung.
           Fehlt eines, steht dort ein "null" statt eines Datenstands. */
        assert.equal(typeof REGEL.version, 'string', 'kein version-Feld');
        assert.ok(REGEL.version.trim(), 'version ist leer');
        assert.match(String(REGEL.generated_at), /^\d{4}-\d{2}-\d{2}$/,
            'generated_at ist kein Datum im Format JJJJ-MM-TT');
    });

    it('die Datei traegt ihren eigenen Befund, nicht nur eine Versionsnummer', () => {
        /* Eine "0.1" allein sagt nicht, ob sie ehrlich ist. Der
           gemessene Deckungsgrad steht deshalb IN der Datei. */
        const b = REGEL._befund_2026_09_10;
        assert.equal(typeof b, 'string', 'der gemessene Befund fehlt in der Datei');
        assert.ok(/EHRLICHE Angabe/.test(b),
            'der Befund sagt nicht mehr, dass 0.1 eine ehrliche Angabe ist');
        assert.ok(/NICHT GEPRUEFT/.test(b),
            'der Befund nennt nicht mehr, was an der Datei ungeprueft bleibt');
    });

    it('sie enthaelt ueberhaupt Paarungen', () => {
        assert.ok(Array.isArray(REGEL.interactions), 'interactions ist keine Liste');
        assert.ok(REGEL.interactions.length > 0,
            'die Regelbasis ist leer — dann faende der Tech-Vorschlag nie etwas, '
            + 'und die Oberflaeche schriebe ueberall "keine Daten"');
    });
});

describe('keine tote Regel: jede Paarung zeigt auf Marken, die es gibt', () => {

    it('jede Angreifer- und Verteidigermarke kommt in der Musterdatei vor', () => {
        /* DER FALL, GEGEN DEN DAS GESCHRIEBEN IST: ein Tippfehler in
           "ability.ko_prevention". Die Paarung greift dann nie, die
           Oberflaeche zeigt "keine Daten", und niemand erfaehrt, dass es
           an der Regelbasis liegt statt an den Karten. */
        const waisen = [];
        REGEL.interactions.forEach((x, i) => {
            if (!MARKEN.has(x.attacker)) waisen.push(`#${i} attacker "${x.attacker}"`);
            if (!MARKEN.has(x.defender)) waisen.push(`#${i} defender "${x.defender}"`);
        });
        assert.deepStrictEqual(waisen, [],
            'diese Marken vergibt data/card_capability_patterns.json nicht — '
            + 'die Paarung kann nie greifen:\n  ' + waisen.join('\n  ')
            + '\n  bekannte Marken: ' + [...MARKEN].sort().join(', '));
    });

    it('die Angreiferseite steht links, die Verteidigerseite rechts', () => {
        const verdreht = REGEL.interactions
            .map((x, i) => ({ i, x }))
            .filter(({ x }) => !x.attacker.startsWith('attack.')
                            || !x.defender.startsWith('ability.'))
            .map(({ i, x }) => `#${i}: ${x.attacker} vs ${x.defender}`);
        assert.deepStrictEqual(verdreht, [],
            'Angreifer- und Verteidigerseite sind vertauscht oder tragen eine '
            + 'Marke der falschen Seite:\n  ' + verdreht.join('\n  '));
    });

    it('keine Paarung steht zweimal drin', () => {
        /* Zwei Zeilen fuer dasselbe Paar heisst: welche gewinnt, haengt
           an der Reihenfolge in der Datei. Das ist keine Regel mehr. */
        const gesehen = new Map();
        const doppelt = [];
        REGEL.interactions.forEach((x, i) => {
            const k = `${x.attacker}|${x.defender}`;
            if (gesehen.has(k)) doppelt.push(`${k} (#${gesehen.get(k)} und #${i})`);
            else gesehen.set(k, i);
        });
        assert.deepStrictEqual(doppelt, [], 'doppelte Paarungen: ' + doppelt.join(', '));
    });

    it('jede Paarung traegt die Felder, die die Maschine ausliest', () => {
        const fehlt = [];
        REGEL.interactions.forEach((x, i) => {
            for (const f of ['attacker', 'defender', 'result', 'confidence',
                             'matchup_value', 'narrative_en', 'narrative_de']) {
                if (x[f] === undefined || x[f] === null || x[f] === '') {
                    fehlt.push(`#${i}: ${f}`);
                }
            }
            if (typeof x.matchup_value !== 'number' || !Number.isFinite(x.matchup_value)) {
                fehlt.push(`#${i}: matchup_value ist keine Zahl (${x.matchup_value})`);
            }
        });
        assert.deepStrictEqual(fehlt, [], 'fehlende Felder:\n  ' + fehlt.join('\n  '));
    });
});

describe('die Erzaehltexte erreichen den Nutzer vollstaendig', () => {

    it('sie benutzen nur Platzhalter, die die Maschine auch ersetzt', () => {
        /* js/card-capability-engine.js `_narrative()` ersetzt genau vier
           Namen. Jeder andere {name} landet roh auf dem Bildschirm. */
        const unbekannt = [];
        REGEL.interactions.forEach((x, i) => {
            for (const feld of ['narrative_en', 'narrative_de']) {
                for (const m of String(x[feld] || '').matchAll(/\{(\w+)\}/g)) {
                    if (!ERSETZTE_PLATZHALTER.has(m[1])) {
                        unbekannt.push(`#${i} ${feld}: {${m[1]}}`);
                    }
                }
            }
        });
        assert.deepStrictEqual(unbekannt, [],
            'diese Platzhalter ersetzt js/card-capability-engine.js nicht und '
            + 'der Nutzer sieht sie roh:\n  ' + unbekannt.join('\n  '));
    });

    it('deutsch und englisch tragen dieselben Platzhalter', () => {
        /* Sonst steht im deutschen Satz ein Kartenname weniger als im
           englischen — und zwar genau bei der Karte, um die es geht. */
        const schief = [];
        REGEL.interactions.forEach((x, i) => {
            const p = (t) => [...new Set([...String(t || '').matchAll(/\{(\w+)\}/g)]
                .map(m => m[1]))].sort().join(',');
            const en = p(x.narrative_en), de = p(x.narrative_de);
            if (en !== de) schief.push(`#${i}: en [${en}] vs de [${de}]`);
        });
        assert.deepStrictEqual(schief, [], 'Platzhalter weichen ab:\n  ' + schief.join('\n  '));
    });

    it('jede Paarung hat einen deutschen Satz — die Oberflaeche ist deutsch', () => {
        const ohneDe = REGEL.interactions
            .map((x, i) => ({ i, x }))
            .filter(({ x }) => !String(x.narrative_de || '').trim())
            .map(({ i }) => `#${i}`);
        assert.deepStrictEqual(ohneDe, [],
            'ohne narrative_de faellt die Maschine auf den englischen Satz zurueck, '
            + 'mitten in einer deutschen Seite: ' + ohneDe.join(', '));
    });
});

describe('die Zahl der Paarungen steht auch im Fliesstext — sie muss mitwandern', () => {

    /* GRUNDSTAND 10.09.2026: 5 Paarungen, und der Satz "fuenf Paarungen"
       an zehn Stellen in fuenf Dateien. Diese Zusicherung nagelt die 5
       NICHT fest — sie meldet, WENN die Zahl sich bewegt, und zeigt
       gleich die Stellen, die dann nachziehen muessen. */
    const GRUNDSTAND_PAARUNGEN = 5;

    function fundstellen() {
        const jsDir = path.join(WURZEL, 'js');
        const treffer = [];
        for (const f of fs.readdirSync(jsDir).filter(n => n.endsWith('.js'))) {
            const text = fs.readFileSync(path.join(jsDir, f), 'utf8');
            text.split('\n').forEach((zeile, i) => {
                if (/f(ü|ue|UE|Ü)nf\s+Paarungen/i.test(zeile)) treffer.push(`js/${f}:${i + 1}`);
            });
        }
        return treffer;
    }

    it('bewegt sich die Zahl, sagt der Test welche Saetze nachziehen muessen', () => {
        const ist = REGEL.interactions.length;
        if (ist === GRUNDSTAND_PAARUNGEN) return;   // Grundstand unveraendert
        const stellen = fundstellen();
        assert.fail(
            `die Regelbasis traegt jetzt ${ist} Paarungen statt ${GRUNDSTAND_PAARUNGEN}. `
            + 'Das ist kein Fehler — aber diese Stellen behaupten weiter "fuenf '
            + 'Paarungen" und muessen mitgezogen werden (danach den Grundstand '
            + `GRUNDSTAND_PAARUNGEN in dieser Datei auf ${ist} setzen):\n  `
            + (stellen.length ? stellen.join('\n  ') : '(keine gefunden)'));
    });

    it('der Fliesstext behauptet die Zahl ueberhaupt noch — sonst greift die Warnung ins Leere', () => {
        const stellen = fundstellen();
        assert.ok(stellen.length > 0,
            'kein js/ nennt die Zahl der Paarungen mehr im Fliesstext. Entweder '
            + 'wurde sie ueberall entfernt (dann kann die Zusicherung darueber weg) '
            + 'oder anders geschrieben (dann findet die Suche sie nicht mehr und '
            + 'warnt kuenftig ins Leere).');
        assert.ok(stellen.length >= 5,
            `nur noch ${stellen.length} Fundstelle(n) statt 10 am 10.09.2026 — `
            + 'die Suche greift vermutlich nicht mehr:\n  ' + stellen.join('\n  '));
    });
});
