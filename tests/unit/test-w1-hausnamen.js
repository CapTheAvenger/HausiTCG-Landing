/**
 * KEIN HAUSNAME MEHR FUER EINE QUOTE — IN DIESEN FUENF DATEIEN.
 *
 * ANORDNUNG DES BETREIBERS (05.09.2026, wiederholt am 08.09.2026):
 * „Win-Raten ueberall in der Limitless-Bezeichnung ‚Win %‘ — keine
 * eigenen Begriffe."
 *
 * SIE IST KEIN PAUSCHALES UMBENENNEN, UND GENAU DAS PRUEFT DIESE DATEI
 * NICHT. js/win-rate-konvention.js haelt den Namen „Win %" der
 * Konvention MATCHPUNKTE (3S+U)/(3·Partien) vor — so nennt Limitless
 * genau diese Spalte. Eine Zahl, die S/(S+N+U) oder S/(S+N) rechnet,
 * „Win %" zu nennen, waere derselbe Fehler in die andere Richtung.
 * Ob der ANGEZEIGTE Name zur GERECHNETEN Konvention passt, prueft
 * tests/unit/test-w1-konvention-passt.js an den echten Dateien.
 *
 * HIER geht es nur um das eine: dass in der Oberflaeche dieser fuenf
 * Dateien ueberhaupt kein selbst erfundener Name mehr steht. „Win Rate",
 * „Winrate", „Siegquote", „Siegrate", „Gewinnrate" — vier Woerter fuer
 * drei verschiedene Groessen, und keines davon benutzt die Quelle.
 *
 * WAS NICHT GEPRUEFT WIRD, UND WARUM
 *
 *   PROGRAMMTEXT. `winRate`, `win_rate_numeric`, `weightedWinrateSum`,
 *   `WinRateKonvention`, der Schluessel `matchup.winRate` — Bezeichner
 *   sind keine Woerter, die jemand liest. Die Suchmuster verlangen
 *   deshalb ein TRENNZEICHEN zwischen „win" und „rate" (Leerzeichen
 *   oder Bindestrich); ohne Trennzeichen ist es ein Bezeichner.
 *   data/_consumers.md nennt die CSV-Spalten ausdruecklich eine
 *   veroeffentlichte Schnittstelle.
 *
 *   KOMMENTARE. Ein Kommentar erklaert, was frueher dastand und warum
 *   es weg ist — genau diese Dateien leben davon. Block- und
 *   Zeilenkommentare werden vor der Suche entfernt.
 *
 *   HTML-Kommentare (<!-- ... -->) werden NICHT entfernt: sie stehen in
 *   Template-Zeichenketten, wandern also wirklich in die Seite. Wer
 *   dort einen Hausnamen unterbringt, soll ihn begruenden — die
 *   Positivliste unten ist der Ort dafuer.
 *
 * DIE POSITIVLISTE. Jede Zeile braucht eine Begruendung, und eine TOTE
 * Zeile (deren Text es nicht mehr gibt) laesst diesen Test ebenfalls
 * fallen. Sonst waechst eine Liste heran, die niemand mehr raeumt und
 * die irgendwann alles durchlaesst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

/** Die fuenf Dateien dieses Arbeitspakets. */
const DATEIEN = [
    'js/app-current-meta-analysis.js',
    'js/app-current-meta.js',
    'js/app-archetype-card.js',
    'js/app-tier-meta.js',
    'js/meta-analysis-hub.js',
];

/**
 * Verbotene Hausnamen.
 *
 * „win rate" nur MIT Trennzeichen — ohne eines ist es ein Bezeichner
 * (winRate, WinRateKonvention, totalWinrate). „Winrate" nur als
 * eigenstaendiges Wort mit grossem W, damit `weightedWinrateSum` und
 * `winrateText` durchgehen.
 */
const VERBOTEN = [
    { muster: /win[\s ‐-―-]rate/i, was: '„Win Rate" / „win rate" / „Win-Rate"' },
    { muster: /\bWinrate\b/,                      was: '„Winrate" in einem Wort' },
    { muster: /Siegquote/,                        was: '„Siegquote"' },
    { muster: /Siegrate/,                         was: '„Siegrate"' },
    { muster: /Siegesrate/,                       was: '„Siegesrate"' },
    { muster: /Gewinnrate/,                       was: '„Gewinnrate"' },
];

/**
 * Begruendete Ausnahmen. `text` muss als Teilzeichenkette in einer
 * beanstandeten Zeile der Datei vorkommen; `grund` steht hier, damit
 * niemand raten muss, warum die Zeile bleiben darf.
 */
const POSITIVLISTE = [
    {
        datei: 'js/app-current-meta.js',
        text: '"Win Rate" und "Matches" ausgeschrieben standen',
        grund: 'HTML-Kommentar im Vorlagentext der Heatmap. Er zitiert den '
             + 'BEFUND vom 02.09.2026 woertlich — im Gitter standen die Woerter '
             + 'hundertmal ausgeschrieben und machten die Zellen breit. Der Satz '
             + 'beschreibt den frueheren Zustand; er beschriftet keine Zahl. '
             + 'Wird er zur Beschriftung umgebaut, faellt er hier durch, weil '
             + 'dann die Anfuehrungszeichen fehlen.',
    },
    {
        datei: 'js/app-current-meta.js',
        text: 'sagen das WR = Win Rate ist und Games = G oder',
        grund: 'Derselbe HTML-Kommentar, woertliches Zitat des Betreibers '
             + '(„vll sollten wir hier eine legende machen und sagen das WR = '
             + 'Win Rate ist"). Ein Zitat umzuschreiben hiesse, ihm etwas in den '
             + 'Mund zu legen. Die Legende SELBST steht nicht mehr so da: sie '
             + 'holt ihren Namen zur Laufzeit aus js/win-rate-konvention.js '
             + '(heatmapMitQuote(t(\'heatmap.legendeWr\'), …)).',
    },
];

/** Block- und Zeilenkommentare weg, Zeilennummern erhalten. */
function ohneJsKommentare(quelltext) {
    const ohneBlock = quelltext.replace(/\/\*[\s\S]*?\*\//g,
        (m) => m.replace(/[^\n]/g, ' '));
    return ohneBlock.split('\n')
        .map((z) => (/^\s*\/\//.test(z) ? '' : z))
        .join('\n');
}

function befunde(datei) {
    const zeilen = ohneJsKommentare(lies(datei)).split('\n');
    const raus = [];
    zeilen.forEach((zeile, i) => {
        for (const v of VERBOTEN) {
            if (v.muster.test(zeile)) {
                raus.push({ datei, nr: i + 1, zeile: zeile.trim(), was: v.was });
                break;
            }
        }
    });
    return raus;
}

describe('W1 — kein Hausname fuer eine Quote', () => {
    it('das Suchmuster faengt einen Hausnamen ueberhaupt', () => {
        // Ohne diese Probe koennte die ganze Datei gruen melden, weil das
        // Muster nichts mehr findet — der teuerste Fehler eines Waechters.
        const treffer = VERBOTEN.filter(v => v.muster.test('Gesamte Win Rate — Limitless'));
        assert.ok(treffer.length >= 1, 'das Muster erkennt „Win Rate" nicht mehr');
        assert.ok(VERBOTEN.some(v => v.muster.test('Die Siegquote des Decks')));
        // …und es faengt KEINEN Bezeichner.
        for (const bezeichner of ['window.WinRateKonvention', 'const winRate = 0',
                                  'weightedWinrateSum += x', 'stats.totalWinrate',
                                  "t('matchup.winRate')"]) {
            assert.ok(!VERBOTEN.some(v => v.muster.test(bezeichner)),
                'Bezeichner faelschlich beanstandet: ' + bezeichner);
        }
    });

    it('keine Datei zeigt einen Hausnamen ausserhalb der Positivliste', () => {
        const offen = [];
        for (const datei of DATEIEN) {
            for (const b of befunde(datei)) {
                const erlaubt = POSITIVLISTE.some(
                    p => p.datei === datei && b.zeile.includes(p.text));
                if (!erlaubt) offen.push(`${b.datei}:${b.nr} ${b.was} → ${b.zeile}`);
            }
        }
        assert.deepEqual(offen, [],
            'Hausname in der Oberflaeche:\n  ' + offen.join('\n  '));
    });

    it('jede Zeile der Positivliste ist begruendet und lebt noch', () => {
        for (const p of POSITIVLISTE) {
            assert.ok(p.grund && p.grund.length >= 40,
                'ohne Begruendung: ' + p.datei + ' / ' + p.text);
            // TOTE ZEILE = ROTER TEST. Der Text muss in einer Zeile stehen,
            // die das Suchmuster wirklich beanstandet — sonst deckt die
            // Ausnahme nichts mehr ab und gehoert geloescht.
            const passend = befunde(p.datei).filter(b => b.zeile.includes(p.text));
            assert.ok(passend.length >= 1,
                'tote Positivlisten-Zeile (nichts beanstandet diesen Text mehr): '
                + p.datei + ' / ' + p.text);
        }
    });
});
