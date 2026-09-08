/**
 * parseCSV() aus js/app-core.js (Zeile 2192).
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross. Der Name behauptete Abdeckung fuer den Leser,
 * durch den saemtliche City-League-Tabellen laufen — und `node --test`
 * meldete dafuer `# pass 1`.
 *
 * WAS DIE FUNKTION TUT
 * --------------------
 * Sie liest eine CSV-Zeichenkette in ein Array von Objekten. Zwei Dinge
 * daran sind eigene Logik und nicht PapaParse:
 *
 *   1. Die TRENNZEICHENERKENNUNG. Ohne ausdruckliche Angabe zaehlt sie
 *      in der ERSTEN Zeile Semikolons gegen Kommas; bei Gleichstand
 *      gewinnt das Semikolon (`>=`). Die Dateien des Projekts sind
 *      semikolongetrennt, die Vergleichsexporte kommagetrennt.
 *   2. Der RUECKFALL OHNE PapaParse. Ist Papa nicht geladen, teilt sie
 *      naiv an jedem Trennzeichen — bewusst, um nicht abzustuerzen.
 *      Dieser Zweig kann Anfuehrungszeichen NICHT, und genau das steht
 *      hier als Zusicherung, damit niemand ihn fuer gleichwertig haelt.
 *
 * Der Quelltext traegt eine ausdrueckliche Warnung: eine fruehere
 * Aufraeumrunde (Commit 751d2d8) hielt parseCSV fuer toten Code und
 * loeschte sie, worauf der Reiter "City League" mit
 * 'parseCSV is not defined' aufschlug.
 *
 * KEIN jsdom, KEINE Livedaten: jede CSV in dieser Datei ist gesetzt.
 * PapaParse kommt aus node_modules — genau das eine Paket, das
 * .github/workflows/deploy-pages.yml vor dem Testschritt installiert.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Papa = require('papaparse');

const WURZEL = path.join(__dirname, '..', '..');
const CORE = fs.readFileSync(path.join(WURZEL, 'js', 'app-core.js'), 'utf8');

function funktion(name, quelle) {
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

const QUELLTEXT = funktion('parseCSV', CORE);

/** parseCSV mit PapaParse — der Weg, den die ausgelieferte Seite geht. */
// eslint-disable-next-line no-new-func
const parseCSV = new Function('Papa', 'window', QUELLTEXT + '\nreturn parseCSV;')(Papa, {});

/** parseCSV OHNE PapaParse — der Notweg. */
// eslint-disable-next-line no-new-func
const parseCsvOhnePapa = new Function('Papa', 'window', QUELLTEXT + '\nreturn parseCSV;')(undefined, {});

describe('parseCSV — leere und unbrauchbare Eingaben', () => {
    it('gibt fuer leere Eingaben ein leeres Array zurueck, nie null', () => {
        for (const leer of ['', '   ', '\n\n', '\t \r\n ', null, undefined, 0, false, NaN]) {
            const erg = parseCSV(leer);
            assert.ok(Array.isArray(erg), `${JSON.stringify(leer)} → kein Array`);
            assert.equal(erg.length, 0, `${JSON.stringify(leer)} → ${JSON.stringify(erg)}`);
        }
    });

    it('eine Datei mit nur einer Kopfzeile ergibt null Datenzeilen', () => {
        assert.deepEqual(parseCSV('deck_name;count;share'), []);
        assert.deepEqual(parseCsvOhnePapa('deck_name;count;share'), []);
    });

    it('Leerzeilen zwischen den Datenzeilen werden uebersprungen', () => {
        const erg = parseCSV('a;b\n\n1;2\n\n3;4\n');
        assert.equal(erg.length, 2);
        assert.deepEqual(erg, [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
    });
});

describe('parseCSV — die Trennzeichenerkennung', () => {
    it('erkennt Semikolon und Komma je aus der ersten Zeile', () => {
        assert.deepEqual(parseCSV('a;b\n1;2'), [{ a: '1', b: '2' }]);
        assert.deepEqual(parseCSV('a,b\n1,2'), [{ a: '1', b: '2' }]);
    });

    it('bei Gleichstand in der Kopfzeile gewinnt das Semikolon', () => {
        // 'a;b,c' hat je ein Semikolon und ein Komma. Der Vergleich im
        // Quelltext ist `>=`, das Semikolon gewinnt also. Waere es `>`,
        // zerfiele jede semikolongetrennte Datei, deren Kopfzeile ein
        // Komma in einem Spaltennamen traegt, in falsche Spalten.
        const erg = parseCSV('a;b,c\n1;2,3');
        assert.deepEqual(erg, [{ a: '1', 'b,c': '2,3' }]);
        assert.equal(Object.keys(erg[0]).length, 2,
            'zwei Spalten, weil am Semikolon getrennt wurde');
    });

    it('ein ausdrueckliches Trennzeichen schlaegt die Erkennung', () => {
        // Dieselbe Zeichenkette, einmal erkannt und einmal vorgegeben.
        assert.deepEqual(parseCSV('a;b\n1;2'), [{ a: '1', b: '2' }]);
        assert.deepEqual(parseCSV('a;b\n1;2', ','), [{ 'a;b': '1;2' }]);
    });

    it('nur die ERSTE Zeile entscheidet, nicht die ganze Datei', () => {
        // Kopfzeile kommagetrennt, Datenzeilen voller Semikolons: das
        // Trennzeichen bleibt trotzdem das Komma.
        const erg = parseCSV('name,wert\nA;B;C,7');
        assert.deepEqual(erg, [{ name: 'A;B;C', wert: '7' }]);
    });
});

describe('parseCSV — Anfuehrungszeichen, Zeilenumbrueche, Unicode', () => {
    it('ein Komma in Anfuehrungszeichen trennt keine Spalte', () => {
        const erg = parseCSV('name,wert\n"Iono, Bellibolt",3');
        assert.deepEqual(erg, [{ name: 'Iono, Bellibolt', wert: '3' }]);
    });

    it('ein Zeilenumbruch in Anfuehrungszeichen erzeugt keine neue Zeile', () => {
        const erg = parseCSV('name;wert\n"Zeile1\nZeile2";7\nDanach;8');
        assert.equal(erg.length, 2, 'zwei Datensaetze, nicht drei');
        assert.equal(erg[0].name, 'Zeile1\nZeile2');
        assert.equal(erg[1].name, 'Danach');
    });

    it('doppelte Anfuehrungszeichen werden zu einem entpackt', () => {
        const erg = parseCSV('name;wert\n"sagt ""hallo""";1');
        assert.equal(erg[0].name, 'sagt "hallo"');
    });

    it('CRLF-Zeilenenden landen nicht als \\r im letzten Feld', () => {
        const erg = parseCSV('a;b\r\n1;2\r\n3;4\r\n');
        assert.deepEqual(erg, [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
        assert.equal(erg[0].b.includes('\r'), false);
    });

    it('eine Byte-Reihenfolge-Marke haengt nicht am ersten Spaltennamen', () => {
        // Ohne BOM-Behandlung hiesse die erste Spalte "﻿deck_name"
        // und jeder Zugriff auf row.deck_name waere undefined.
        const erg = parseCSV('﻿deck_name;count\nDragapult;300');
        assert.deepEqual(Object.keys(erg[0]), ['deck_name', 'count']);
        assert.equal(erg[0].deck_name, 'Dragapult');
        const ohne = parseCsvOhnePapa('﻿deck_name;count\nDragapult;300');
        assert.equal(ohne[0].deck_name, 'Dragapult',
            'auch der Notweg muss die Marke abstreifen');
    });

    it('Unicode in Feldern bleibt unveraendert', () => {
        const erg = parseCSV('name;land\nPokémon Café ☕;日本\nN’s Zoroark;—');
        assert.equal(erg[0].name, 'Pokémon Café ☕');
        assert.equal(erg[0].land, '日本');
        assert.equal(erg[1].name, 'N’s Zoroark');
    });

    it('Zahlen kommen als Zeichenketten heraus (dynamicTyping ist aus)', () => {
        // Die Aufrufer rechnen mit parseLocaleNumber und erwarten Text.
        // Waere dynamicTyping an, wuerde "007" zu 7 und die Kartennummer
        // waere kaputt.
        const erg = parseCSV('nummer;quote\n007;2.5');
        assert.equal(typeof erg[0].nummer, 'string');
        assert.equal(erg[0].nummer, '007');
        assert.equal(typeof erg[0].quote, 'string');
        assert.equal(erg[0].quote, '2.5');
    });

    it('doppelte Spaltennamen ueberschreiben einander nicht', () => {
        // PapaParse benennt die zweite Spalte um (a → a_1). Wichtig ist
        // nur, dass beide Werte ankommen: bei einem naiven Objektaufbau
        // waere die erste still verloren.
        const erg = parseCSV('a;a;b\n1;2;3');
        const werte = Object.values(erg[0]);
        assert.equal(werte.length, 3);
        assert.ok(werte.includes('1') && werte.includes('2') && werte.includes('3'),
            `beide a-Werte muessen ankommen, bekam ${JSON.stringify(erg[0])}`);
    });
});

describe('parseCSV — der Notweg ohne PapaParse', () => {
    it('liest einfache Zeilen genauso wie der PapaParse-Weg', () => {
        const eingabe = 'deck_name;count\nDragapult;300\nGardevoir;250';
        assert.deepEqual(parseCsvOhnePapa(eingabe), parseCSV(eingabe));
    });

    it('fuellt fehlende Spalten am Zeilenende mit leerem Text', () => {
        assert.deepEqual(parseCsvOhnePapa('a;b;c\n1;2'), [{ a: '1', b: '2', c: '' }]);
    });

    it('kann Anfuehrungszeichen NICHT — das ist der Preis des Notwegs', () => {
        // Ausdrueckliche Zusicherung, damit niemand den Zweig fuer
        // gleichwertig haelt und PapaParse spart. Gemessen: aus
        // "Iono, Bellibolt" werden zwei Felder, das Anfuehrungszeichen
        // bleibt im Text stehen.
        const erg = parseCsvOhnePapa('name,wert\n"Iono, Bellibolt",3');
        assert.equal(erg[0].name, '"Iono');
        assert.equal(erg[0].wert, 'Bellibolt"');
        assert.notDeepEqual(erg, parseCSV('name,wert\n"Iono, Bellibolt",3'));
    });

    it('wirft nicht, wenn Papa fehlt — es gibt keine Ausnahme nach oben', () => {
        assert.doesNotThrow(() => parseCsvOhnePapa('a;b\n1;2'));
        assert.doesNotThrow(() => parseCsvOhnePapa(''));
        assert.doesNotThrow(() => parseCsvOhnePapa(null));
    });
});

describe('parseCSV — die Zusage aus dem Quelltext', () => {
    it('haengt weiterhin an window, sonst faellt der City-League-Reiter um', () => {
        // Der Kommentar ueber der Funktion beschreibt genau diesen
        // Absturz (Commit 751d2d8). js/app-city-league.js ruft parseCSV
        // ueber window auf; ohne die Zuweisung ist der Reiter tot.
        assert.match(CORE, /window\.parseCSV\s*=\s*parseCSV/);
        const cityLeague = fs.readFileSync(path.join(WURZEL, 'js', 'app-city-league.js'), 'utf8');
        assert.ok(/\bparseCSV\s*\(/.test(cityLeague),
            'app-city-league.js ruft parseCSV — sonst ist diese Zusicherung gegenstandslos');
    });
});
