'use strict';
/**
 * DER ANGEZEIGTE NAME MUSS ZU DER FORMEL PASSEN, DIE DANEBEN GERECHNET
 * WIRD — ausgefuehrt, nicht gegriffen.
 *
 * BEFUND W2 (08.09.2026, live an thedipidis.app gemessen, Version
 * 202609080008-33eb397). Im Reiter „Turnier / Meta Call" trugen drei
 * verschiedene Formeln denselben Hausnamen:
 *
 *   Begegnungsliste      „WR 42 % · 1.220"   _anzeigeQuote  = S/(S+N)
 *   Empfehlungstabelle   „Ø Win Rate"        expWin/Runden  = S/(S+N+U)
 *   Override-Kasten      „WR (gemischt)" NEBEN „Manuelle WR"
 *                        — links S/(S+N), rechts S/(S+N+U), gleich
 *                        beschriftet, in derselben Tabellenzeile.
 *
 * Ein Quelltext-Grep faengt das nicht: die Namen kommen aus
 * js/i18n.js, die Zahlen aus vier verschiedenen Rechenwegen, und
 * zusammen kommen sie erst im gerenderten HTML. Diese Datei fuehrt die
 * echten Renderfunktionen mit dem echten js/win-rate-konvention.js aus
 * und prueft an jeder Stelle DREIERLEI:
 *
 *   1. welche der drei Konventionen die angezeigte Zahl aus der
 *      Eingabe reproduziert (gerechnet, nicht behauptet),
 *   2. dass genau deren Kurzname im Hinweis steht — geholt aus dem
 *      Modul, nicht abgeschrieben,
 *   3. dass die Formel dieser Konvention mitgenannt wird.
 *
 * Kein jsdom, kein Zugriff auf data/: jede Eingabe ist im Test gesetzt.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { baue, lies } = require('./lib-dom-sandkasten.js');

const WURZEL = path.join(__dirname, '..', '..');
const MC = 'js/app-meta-call.js';

function konventionen(sprache) {
    const src = fs.readFileSync(path.join(WURZEL, 'js', 'win-rate-konvention.js'), 'utf8');
    const win = { getLang: () => (sprache || 'de') };
    return new Function('window', src + '\nreturn window.WinRateKonvention;')(win);
}
const WK = konventionen('de');

/** Der Regexausdruck aus js/app-meta-call.js — dort ein `const`, das
 *  `baue()` nicht ausschneiden kann, weil es keine Funktion ist. Er
 *  wird hier NICHT nachgebaut, sondern woertlich aus der Datei
 *  gelesen: eine Kopie wuerde beim naechsten Namen auseinanderlaufen. */
function hausnameAusDerQuelle() {
    const src = lies('js', 'app-meta-call.js');
    const m = src.match(/const _WR_HAUSNAME\s*=\s*\n?\s*(\/[^\n]*\/gi);/);
    assert.ok(m, '_WR_HAUSNAME steht nicht mehr in js/app-meta-call.js');
    return new Function('return ' + m[1] + ';')();
}
const WR_HAUSNAME = hausnameAusDerQuelle();

/**
 * Welche der drei Konventionen reproduziert `angezeigt` aus der Bilanz?
 * Gibt die Kennungen zurueck, die auf `toleranz` genau treffen.
 */
function passendeKonventionen(s, n, u, angezeigt, toleranz) {
    const tol = (toleranz == null) ? 0.05 : toleranz;
    return Object.keys(WK.KONVENTIONEN).filter(id => {
        const k = WK.KONVENTIONEN[id];
        const soll = (id === 'ohneUnentschieden') ? k.rechne(s, n) : k.rechne(s, n, u);
        return isFinite(soll) && Math.abs(soll - angezeigt) <= tol;
    });
}

/** „Genau eine Konvention trifft" — sonst prueft der Vergleich nichts. */
function eindeutig(s, n, u, angezeigt, toleranz) {
    const treffer = passendeKonventionen(s, n, u, angezeigt, toleranz);
    assert.equal(treffer.length, 1,
        `die gesetzte Bilanz ${s}-${n}-${u} und der angezeigte Wert ${angezeigt} `
        + `passen auf ${treffer.length} Konventionen (${treffer.join(', ') || 'keine'}). `
        + 'Bei mehr als einer prueft der Namensvergleich nichts — die Eingabe des '
        + 'Tests muss so gewaehlt sein, dass sich die drei Formeln unterscheiden.');
    return treffer[0];
}

/** Der Hinweistext, den das Modul fuer eine Konvention vergibt. */
function erwarteterHinweis(id) {
    return WK.kurz(id) + ' — ' + WK.hinweis(id);
}

/* ══ 1. DER OVERRIDE-KASTEN — ZWEI SPALTEN, ZWEI KONVENTIONEN ═════ */

function overrideUmgebung(paarung, override) {
    const K = konventionen('de');
    const texte = {
        'mc.colOpponent': 'Gegner',
        'mc.colWrBlended': 'WR (gemischt)',
        'mc.colIndicator': 'Einschätzung',
        'mc.colManualWr': 'Manuelle WR',
        'mc.overrideHint': 'Manuelle WR überschreibt alles.',
        'mc.favorable': 'gut', 'mc.unfavorable': 'schlecht', 'mc.even': 'ausgeglichen',
        'mc.selectDeckFirst': 'erst ein Deck',
    };
    const ctx = baue(MC, [
        'function renderOverrideTable()',
        'function _anzeigeQuote(m)',
        'function _wrKonventionsTitel(konventionId)',
        'function _wrVollname(text, konventionId)',
        'function _wrKurzform(text)',
        'function _wrZweiKonventionen(idA, wasA, idB, wasB)',
        'function getMatchup(myDeck, opponent)',
        'function _findByNormalized(obj, name)',
        'function _mcIstDeutsch()',
    ], {
        window: { WinRateKonvention: K.WinRateKonvention || K },
        getLang: () => 'de',
        t: (k) => (k in texte ? texte[k] : k),
        esc: (s) => String(s).replace(/"/g, '&quot;'),
        escJs: (s) => String(s),
        normalize: (s) => String(s || '').toLowerCase().trim(),
        _WR_HAUSNAME: WR_HAUSNAME,
        _settings: { myDeck: 'Mein Deck' },
        _shareList: [{ name: 'Gegner A' }],
        _winRateOverrides: override === undefined ? {} : { 'Gegner A': override },
        _journalStats: {},
        _journalRateKeys: [],
        _junkWinRatePct: () => 55,
        _junkDeckZahl: 0,
        buildField: () => [{ name: 'Gegner A', finalShare: 10 }],
        getBaseMatchup: () => paarung,
    });
    ctx.window.WinRateKonvention = K;
    return ctx;
}

describe('W2 — der Override-Kasten: zwei Spalten, zwei Konventionen', () => {

    it('„WR (gemischt)" zeigt S/(S+N) und sagt es auch', () => {
        // Gesetzte Paarung: 55 Siege, 35 Niederlagen, 10 Unentschieden
        // je 100 Partien. Die drei Konventionen liegen hier weit
        // auseinander (58,3 / 55,0 / 61,1) — der Vergleich unten kann
        // also nicht zufaellig aufgehen.
        const ctx = overrideUmgebung({ pWin: 0.55, pTie: 0.10, pLoss: 0.35 });
        const html = ctx.renderOverrideTable();

        const zelle = html.match(/<span class="mc-wr-meta"[^>]*>(\d+)%<\/span>/);
        assert.ok(zelle, 'die gemischte Quote steht nicht mehr in der Zeile:\n' + html);
        const gezeigt = Number(zelle[1]);

        const id = eindeutig(55, 35, 10, gezeigt, 0.6);
        assert.equal(id, 'ohneUnentschieden',
            'die angezeigte Zahl folgt nicht mehr S/(S+N) — dann ist nicht die '
            + 'Beschriftung falsch, sondern die Rechnung hat sich geaendert');

        const kopf = html.match(/<th title="([^"]*)"[^>]*>WR \(gemischt\)<\/th>/);
        assert.ok(kopf, 'der Spaltenkopf traegt keinen Hinweis mehr:\n' + html);
        assert.equal(kopf[1].replace(/&quot;/g, '"'), erwarteterHinweis(id),
            'der Hinweis nennt nicht den Namen, den das Modul fuer die gerechnete '
            + 'Konvention vergibt');
        assert.ok(kopf[1].includes(WK.KONVENTIONEN[id].formel),
            'die Formel fehlt im Hinweis — ohne sie ist „WR" wieder ein Hausname');
    });

    it('„Manuelle WR" nimmt S/(S+N+U) entgegen und sagt es auch', () => {
        /* Was der Nutzer tippt, landet in getMatchup als pWin:
             const pWin = Math.min(0.98, Math.max(0, ov / 100));
           Der Rest verteilt sich auf pTie und pLoss. Die getippte Zahl
           ist damit der Anteil an ALLEN Partien, nicht an den
           entschiedenen — bis zum 08.09.2026 stand daneben derselbe
           Name wie ueber der Spalte links, die S/(S+N) zeigt. */
        const ctx = overrideUmgebung({ pWin: 0.50, pTie: 0.02, pLoss: 0.48 }, 55);
        const m = ctx.getMatchup('Mein Deck', 'Gegner A');
        assert.equal(m.handEingestellt, true, 'der handgesetzte Wert greift nicht mehr');

        // Aus der zurueckgegebenen Verteilung eine Bilanz je 10.000
        // Partien machen und fragen, welche Konvention die GETIPPTE
        // Zahl reproduziert.
        const s = Math.round(m.pWin * 10000);
        const u = Math.round(m.pTie * 10000);
        const n = 10000 - s - u;
        const id = eindeutig(s, n, u, 55, 0.05);
        assert.equal(id, 'mitUnentschieden',
            'die getippte Zahl wird nicht mehr als S/(S+N+U) eingesetzt');

        const html = ctx.renderOverrideTable();
        const kopf = html.match(/<th title="([^"]*)"[^>]*>Manuelle WR<\/th>/);
        assert.ok(kopf, 'der Spaltenkopf traegt keinen Hinweis mehr:\n' + html);
        assert.equal(kopf[1].replace(/&quot;/g, '"'), erwarteterHinweis(id));
        assert.ok(kopf[1].includes(WK.KONVENTIONEN[id].formel));
    });

    it('und ueber der Tabelle steht, dass es zwei verschiedene sind', () => {
        /* Ohne diesen Satz liest sich der Unterschied zwischen den
           beiden Spalten als Spielstaerke. Er ist aber zum Teil eine
           Einheitenfrage: auf Papier enden rund 11 % der Partien
           unentschieden, online rund 1 %. */
        const ctx = overrideUmgebung({ pWin: 0.55, pTie: 0.10, pLoss: 0.35 });
        const html = ctx.renderOverrideTable();
        const satz = html.match(/<p class="mc-wr-konventionen"[^>]*>([^<]*)<\/p>/);
        assert.ok(satz, 'der Satz ueber den zwei Konventionen fehlt:\n' + html);
        for (const id of ['ohneUnentschieden', 'mitUnentschieden']) {
            assert.ok(satz[1].includes(WK.kurz(id)),
                `der Satz nennt ${id} nicht beim Namen: ` + satz[1]);
            assert.ok(satz[1].includes(WK.KONVENTIONEN[id].formel),
                `der Satz nennt die Formel von ${id} nicht: ` + satz[1]);
        }
        assert.notEqual(WK.kurz('ohneUnentschieden'), WK.kurz('mitUnentschieden'));
    });
});

/* ══ 2. DER CHIP AN DER DECKZEILE ═════════════════════════════════ */

describe('W2 — der WR-Chip an der Deckzeile nennt seine Konvention', () => {

    it('die Labs-Bilanz wird als S/(S+N+U) gezeigt — und der Chip sagt es', () => {
        const K = konventionen('de');
        const ctx = baue(MC, [
            'function _labsGanz(v)',
            'function _labsDeckWr(r, praefix)',
            'function _labsDeckPartien(r, praefix)',
            'function _wrKonventionsTitel(konventionId)',
            'function _wrChip(wert, partien, konventionId)',
        ], {
            window: { WinRateKonvention: K, zahlLokal: (n) => String(n) },
            esc: (s) => String(s).replace(/"/g, '&quot;'),
        });

        // Gesetzte Zeile. 44-50-12: matchpunkte 45,3 · S/(S+N+U) 41,5 ·
        // S/(S+N) 46,8 — drei klar getrennte Werte.
        const zeile = { wins: '44', losses: '50', ties: '12' };
        const wert = ctx._labsDeckWr(zeile, '');
        const partien = ctx._labsDeckPartien(zeile, '');
        assert.equal(partien, 106);

        const id = eindeutig(44, 50, 12, wert, 0.05);
        assert.equal(id, 'mitUnentschieden');

        const chip = ctx._wrChip(wert, partien);
        assert.match(chip, /WR 42 % · 106/,
            'der Chip zeigt Zahl oder Nenner nicht mehr: ' + chip);
        const titel = chip.match(/title="([^"]*)"/);
        assert.ok(titel, 'das Kuerzel „WR" steht ohne Hinweis da — dann ist es ein '
            + 'Hausname: ' + chip);
        assert.equal(titel[1].replace(/&quot;/g, '"'), erwarteterHinweis(id));
        assert.ok(titel[1].includes(WK.KONVENTIONEN[id].formel));
    });
});

/* ══ 3. DAS GETEILTE BILD — KEIN title, ALSO EINE LEGENDE ═════════ */

describe('W2 — auf dem geteilten Bild steht die Konvention sichtbar', () => {

    function bildUmgebung() {
        const K = konventionen('de');
        const texte = { 'mc.recDeck': 'Deck', 'mc.recAvgWr': 'Ø Win Rate',
                        'mc.day1WinRate': 'Day 1 Win Rate', 'mc.recTitle': 'Day 2' };
        return baue(MC, [
            'function calcDay2(field, deckOverride)',
            'function _paintRecRows(ctx, originX, originY, columnW, recs)',
            'function _wrKurzform(text)',
            'function _wrLegende(paare)',
        ], {
            window: { WinRateKonvention: K },
            getLang: () => 'de',
            t: (k) => (k in texte ? texte[k] : k),
            zahlLokal: (n) => String(n),
            normalize: (s) => String(s || '').toLowerCase().trim(),
            _WR_HAUSNAME: WR_HAUSNAME,
            _mcNum: (n, dp) => Number(n).toFixed(dp).replace('.', ','),
            _mcPz: () => ' %',
            _predictTitleKey: () => 'mc.recTitle',
            _settings: { rounds: 9, day2Points: 19, myDeck: 'Mein Deck' },
            _unentschiedenQuote: () => ({ quote: 0.02, partien: 0, meta: '', gemessen: false }),
            getMatchup: () => ({ pWin: 0.55, pTie: 0.10, pLoss: 0.35 }),
            getBaseMatchup: () => ({ pWin: 0.55, pTie: 0.10, pLoss: 0.35 }),
            Float64Array,
        });
    }

    it('„Ø WR" auf dem Bild ist S/(S+N+U) — und die Legende sagt es', () => {
        const ctx = bildUmgebung();
        const feld = [{ name: 'Gegner A', finalShare: 100 }];
        const r = ctx.calcDay2(feld);
        const avgWR = (r.expWin / 9) * 100;

        // Bei einem Feld aus genau einer Paarung ist avgWR = pWin·100.
        const id = eindeutig(55, 35, 10, avgWR, 0.05);
        assert.equal(id, 'mitUnentschieden',
            'die Spalte auf dem Bild rechnet nicht mehr „Siege je gespielter Partie"');

        // Der gezeichnete Spaltenkopf.
        const gemalt = [];
        const leinwand = {
            fillStyle: '', font: '', textAlign: '', textBaseline: '',
            fillRect() {}, measureText: (s) => ({ width: String(s).length * 8 }),
            fillText: (s) => gemalt.push(String(s)),
            createLinearGradient: () => ({ addColorStop() {} }),
        };
        ctx._paintRecRows(leinwand, 0, 100, 400,
            [{ name: 'Mein Deck', day2Prob: 0.4, avgWR }]);
        assert.ok(gemalt.some(s => /Ø WR/i.test(s)),
            'der Spaltenkopf des Bildes traegt weiter einen Hausnamen: ' + gemalt.join(' | '));
        assert.ok(!gemalt.some(s => /WIN RATE/i.test(s)),
            '„WIN RATE" steht weiter auf dem Bild: ' + gemalt.join(' | '));

        // Und die Legende im Fuss loest das Kuerzel auf.
        const legende = ctx._wrLegende([
            { was: ctx._wrKurzform('Ø Win Rate'), konvention: id },
        ]);
        assert.ok(legende.includes(WK.kurz(id)), 'die Legende nennt den Namen nicht: ' + legende);
        assert.ok(legende.includes(WK.KONVENTIONEN[id].formel),
            'die Legende nennt die Formel nicht: ' + legende);
    });

    it('die Legende des Day-2-Bildes nennt BEIDE Konventionen', () => {
        /* Auf diesem Bild steht die grosse Kachel (S/(S+N+U)) direkt
           ueber einer Matchup-Spalte, die S/(S+N) zeigt. */
        const ctx = bildUmgebung();
        const legende = ctx._wrLegende([
            { was: ctx._wrKurzform('Day 1 Win Rate'), konvention: 'mitUnentschieden' },
            { was: 'Matchup-Spalte', konvention: 'ohneUnentschieden' },
        ]);
        for (const id of ['mitUnentschieden', 'ohneUnentschieden']) {
            assert.ok(legende.includes(WK.kurz(id)), id + ' fehlt in der Legende: ' + legende);
            assert.ok(legende.includes(WK.KONVENTIONEN[id].formel),
                'die Formel von ' + id + ' fehlt: ' + legende);
        }
        assert.ok(!/Win Rate/i.test(legende.split(WK.kurz('mitUnentschieden'))[0]),
            'der Hausname steht weiter vor dem Konventionsnamen: ' + legende);
    });
});

/* ══ 4. DER SATZ IM GEHEIMTIPP ════════════════════════════════════ */

describe('W2 — der Geheimtipp-Satz nennt die Konvention seiner Zahl', () => {

    it('„{wr} % Win Rate bei …" wird zum Namen der gerechneten Konvention', () => {
        const K = konventionen('de');
        const ctx = baue(MC, [
            'function _labsGanz(v)',
            'function _labsDeckWr(r, praefix)',
            'function _wrVollname(text, konventionId)',
        ], { window: { WinRateKonvention: K }, _WR_HAUSNAME: WR_HAUSNAME });

        // Die Zahl im Satz ist lm.winPct, und lm.winPct ist _labsDeckWr.
        const wert = ctx._labsDeckWr({ wins: '44', losses: '50', ties: '12' }, '');
        const id = eindeutig(44, 50, 12, wert, 0.05);
        assert.equal(id, 'mitUnentschieden');

        const satz = ctx._wrVollname(
            '{wr} % Win Rate bei {where} bei nur {share} Field-Share vor Ort', id);
        assert.ok(satz.includes(WK.kurz(id)), 'der Satz traegt den Namen nicht: ' + satz);
        assert.ok(!/Win Rate/i.test(satz), 'der Hausname steht noch im Satz: ' + satz);

        // Und in englischer Oberflaeche der englische Name.
        const En = konventionen('en');
        const ctxEn = baue(MC, ['function _wrVollname(text, konventionId)'],
            { window: { WinRateKonvention: En }, _WR_HAUSNAME: WR_HAUSNAME });
        const satzEn = ctxEn._wrVollname(
            '{wr} % win rate at {where} on just {share} field share there', id);
        assert.ok(satzEn.includes(En.kurz(id)), satzEn);
        assert.notEqual(En.kurz(id), WK.kurz(id));
    });
});
