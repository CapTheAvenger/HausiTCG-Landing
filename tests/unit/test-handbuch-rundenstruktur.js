/**
 * DIE TURNIERSTRUKTUR STEHT IM HANDBUCH — und ab jetzt auch hier.
 *
 * Quelle: Play! Pokémon Turnierregel-Handbuch, deutschsprachige
 * Version, Stand 1. September 2026, Abschnitt 5.5.6.
 * Abgeschrieben und belegt in docs/turnierregeln-handbuch.md.
 *
 * Vorgeschichte (08.09.2026): Ich hatte behauptet, ein Feld von rund
 * 2.700 Spielern laufe an Tag 1 ueber neun Runden — aus einer
 * Sekundaerquelle, ohne Beleg. Der Betreiber hat widersprochen und das
 * Handbuch beigebracht. Es gibt ihm recht: Phase 1 sind ACHT Runden
 * von 129 bis 4096 Spielern je Altersklasse, Grenzwert 16 Matchpunkte.
 * Neun Runden beginnen erst bei 4097 Spielern IN EINER Altersklasse.
 *
 * Beim Nachlesen kamen vier echte Fehler in der lokalen Rundenleiter
 * heraus: sie war EINE Leiter fuer ZWEI verschiedene Handbuchtabellen.
 *
 * Diese Datei haelt beide Tabellen zeichengenau. Sie ist bewusst
 * stumpf: jede Zeile des Handbuchs ist ein Fall. Wenn Play! Pokémon
 * die Tabelle aendert (das Handbuch wird vierteljaehrlich ueberarbeitet),
 * faellt dieser Test um — und genau das soll er.
 */
'use strict';

const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('node:fs');
const path   = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies   = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

const MC   = lies('js/app-meta-call.js');
const DOKU = lies('docs/turnierregeln-handbuch.md');

function schneideFunktion(quelle, name) {
    const start = quelle.indexOf('function ' + name + '(');
    assert.ok(start >= 0, `Funktion ${name} nicht gefunden`);
    let i = quelle.indexOf('{', start), tiefe = 0;
    for (; i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}') { tiefe--; if (tiefe === 0) return quelle.slice(start, i + 1); }
    }
    throw new Error(`Rumpf von ${name} nicht geschlossen`);
}

const runden = new Function(
    schneideFunktion(MC, '_suggestSwissRounds') + '; return _suggestSwissRounds;')();
const cut = new Function(
    schneideFunktion(MC, '_suggestTopCutSize') + '; return _suggestTopCutSize;')();

/* ── Handbuch 5.5.6.1, Variante 2 — nur Schweizer Runden ──────────── */
const VARIANTE_2 = [
    [4, 3], [8, 3],
    [9, 4], [16, 4],
    [17, 5], [32, 5],
    [33, 6], [64, 6],
    [65, 7], [128, 7],
    [129, 8], [256, 8],
    [257, 9], [512, 9],
    [513, 10], [2000, 10],
];

/* ── Handbuch 5.5.6.1, Variante 3 — eintaegig (mit Cut) ───────────── */
const VARIANTE_3 = [
    [4, 3], [8, 3],
    [9, 4], [12, 4],
    [13, 5], [20, 5],
    [21, 5], [32, 5],
    [33, 6], [64, 6],
    [65, 7], [128, 7],
    [129, 8], [226, 8],
    [227, 9], [409, 9],
    [410, 10], [2000, 10],
];

test('Liga-Herausforderung folgt Variante 2 des Handbuchs', () => {
    for (const [spieler, soll] of VARIANTE_2) {
        assert.strictEqual(runden(spieler, 'challenge'), soll,
            `${spieler} Spieler → ${runden(spieler, 'challenge')} Runden, `
            + `Handbuch Variante 2 sagt ${soll}`);
    }
});

test('Liga-Cup folgt Variante 3 des Handbuchs', () => {
    for (const [spieler, soll] of VARIANTE_3) {
        assert.strictEqual(runden(spieler, 'cup'), soll,
            `${spieler} Spieler → ${runden(spieler, 'cup')} Runden, `
            + `Handbuch Variante 3 sagt ${soll}`);
    }
});

test('die beiden Leitern sind wirklich verschieden', () => {
    /* Ohne diese Zusicherung koennte jemand beide Zweige auf dieselbe
       Leiter legen und alles bliebe gruen, solange die Faelle oben
       zufaellig uebereinstimmen. Das Handbuch trennt sie an genau
       diesen Stellen. */
    const unterschiede = [13, 16, 227, 256, 410, 512]
        .filter(n => runden(n, 'cup') !== runden(n, 'challenge'));
    assert.ok(unterschiede.length >= 3,
        'Cup und Challenge liefern fast ueberall dasselbe — dann ist eine '
        + 'der beiden Handbuchtabellen nicht abgebildet. Abweichend nur bei: '
        + unterschiede.join(', '));
    // Die drei Stellen, an denen es sachlich am meisten ausmacht:
    assert.strictEqual(runden(13, 'cup'), 5);
    assert.strictEqual(runden(13, 'challenge'), 4);
    assert.strictEqual(runden(227, 'cup'), 9);
    assert.strictEqual(runden(227, 'challenge'), 8);
});

test('der Top-Cut folgt der Spalte "Einzelausscheidungsrunden"', () => {
    // 0 Runden → kein Cut, 2 Runden → Top 4, 3 Runden → Top 8
    for (const [spieler, soll] of [[4, 0], [8, 0], [9, 4], [12, 4], [20, 4],
                                   [21, 8], [32, 8], [64, 8], [500, 8]]) {
        assert.strictEqual(cut(spieler), soll,
            `${spieler} Spieler → Top ${cut(spieler)}, Handbuch sagt `
            + (soll === 0 ? 'kein Cut' : 'Top ' + soll));
    }
    // Die Stelle, an der die alte Annahme danebenlag:
    assert.strictEqual(cut(17), 4,
        '17-20 Spieler laufen Top 4 (zwei Ausscheidungsrunden), nicht Top 8');
});

test('grosse Turniere laufen NICHT ueber diese Leiter', () => {
    /* Handbuch Variante 5: Phase 1 ist 8 Runden von 129 bis 4096
       Spielern je Altersklasse. Eine Ableitung aus der Spielerzahl
       waere hier also nicht nur unerwuenscht, sondern ueber die ganze
       Spanne auch schlicht dieselbe Zahl. */
    assert.match(MC, /if \(!MAJOR_TYPES\.includes\(_settings\.tournamentType\)\) \{[\s\S]{0,260}_settings\.rounds = _suggestSwissRounds\(val, _settings\.tournamentType\);/,
        'die Leiter wird nicht mehr nur fuer die lokalen Typen aufgerufen, '
        + 'oder der Turniertyp wird nicht mitgegeben');
    assert.match(MC, /const STANDARD_RUNDEN = 8;/);
});

test('Phase 1 und Grenzwert stimmen mit Variante 5 ueberein', () => {
    const m = MC.match(/const MAJOR_DAY2_POINTS = \{([^}]*)\}/);
    const tab = {};
    for (const [, k, v] of m[1].matchAll(/(\d+)\s*:\s*(\d+)/g)) tab[k] = Number(v);
    // Handbuch: 8 Runden → 16 Punkte (129-4096), 9 Runden → 19 (4097-8192)
    assert.strictEqual(tab['8'], 16);
    assert.strictEqual(tab['9'], 19);
});

test('die Belegstelle steht im Haus und traegt die Zahlen', () => {
    /* Ein Test, der eine Handbuchzahl behauptet, ohne dass die Quelle
       im Haus liegt, ist eine Behauptung. Diese Datei existiert, ist
       datiert, und die vier Eckwerte stehen darin. */
    assert.match(DOKU, /letzte Aktualisierung 1\. September 2026/i);
    assert.match(DOKU, /Variante 5/);
    assert.match(DOKU, /2049–4096 \| 14 \| \*\*8\*\* \| \*\*16\*\*/);
    assert.match(DOKU, /4097–8192 \| 15 \| 9 \| 19/);
    assert.match(DOKU, /pro ALTERSKLASSE, nicht die\s*\n?\s*Gesamtteilnehmerzahl/i);
});
