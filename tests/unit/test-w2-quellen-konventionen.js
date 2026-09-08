'use strict';
/**
 * DIE QUELLEN RECHNEN VERSCHIEDEN — FESTGENAGELT, NICHT GEGLAUBT.
 *
 * Zwei Dateien liefern die Zahlen, die im Reiter „Turnier / Meta Call"
 * und im Deckbauer als Win-Raten erscheinen, und sie rechnen NICHT
 * dasselbe:
 *
 *   data/limitless_online_decks_matchups.csv (Spalte win_rate)
 *       S / (S + N)            — OHNE_UNENTSCHIEDEN
 *       Speist js/tech-ideen.js (Baustein „Tech-Ideen" im Deckbauer)
 *       und die Online-Matchup-Matrix des Meta Calls.
 *
 *   data/labs_tournament_matchups_TEF-PBL.csv (Spalte vs_win_pct)
 *       (3S + U) / (3 · Partien) — MATCHPUNKTE, von Limitless „Win %"
 *       genannt. Speist die Matchup-Tabelle im Reiter „Past Meta".
 *
 * Waeren beide gleich beschriftet, waere die Beschriftung an einer der
 * beiden Stellen falsch. Diese Datei sorgt dafuer, dass ein spaeterer
 * Quellenwechsel auffaellt, statt still die Bedeutung einer Spalte zu
 * aendern.
 *
 * KEINE WOCHENWERTE. Jede Zusicherung ist eine GLEICHUNG zwischen der
 * Prozentspalte einer Zeile und der Bilanz DERSELBEN Zeile. Welche
 * Decks dort stehen und welche Quoten sie haben, ist der Pruefung egal.
 * Die Formeln werden nicht abgeschrieben, sondern aus dem echten
 * js/win-rate-konvention.js geholt.
 *
 * Registriert in tests/unit/test-testdaten-wachhund.js.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');

/* Das echte Konventionsmodul, kein Nachbau. */
function konventionen() {
    const win = { getLang: () => 'de' };
    const src = fs.readFileSync(path.join(WURZEL, 'js', 'win-rate-konvention.js'), 'utf8');
    return new Function('window', src + '\nreturn window.WinRateKonvention;')(win);
}
const WK = konventionen();

/** CSV-Leser, der Anfuehrungszeichen respektiert (labs-Dateien haben welche). */
function tabelle(rel, trenner) {
    let text = fs.readFileSync(path.join(WURZEL, 'data', rel), 'utf8').replace(/^﻿/, '');
    const zeilen = [];
    let feld = '', reihe = [], inAnf = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inAnf) {
            if (c === '"') { if (text[i + 1] === '"') { feld += '"'; i++; } else inAnf = false; }
            else feld += c;
            continue;
        }
        if (c === '"') { inAnf = true; continue; }
        if (c === trenner) { reihe.push(feld); feld = ''; continue; }
        if (c === '\n') { reihe.push(feld); zeilen.push(reihe); reihe = []; feld = ''; continue; }
        if (c === '\r') continue;
        feld += c;
    }
    if (feld !== '' || reihe.length) { reihe.push(feld); zeilen.push(reihe); }
    const kopf = zeilen[0].map(s => s.trim());
    return zeilen.slice(1)
        .filter(r => r.length === kopf.length)
        .map(r => { const o = {}; kopf.forEach((k, i) => { o[k] = String(r[i]).trim(); }); return o; });
}

/** „68,73" und „38.79" — beide Schreibweisen kommen in data/ vor. */
function prozent(v) {
    const s = String(v == null ? '' : v).trim();
    if (s === '') return NaN;
    return parseFloat(s.indexOf(',') >= 0 ? s.replace(/\./g, '').replace(',', '.') : s);
}
const ganz = (v) => { const n = parseInt(String(v).trim(), 10); return Number.isFinite(n) ? n : 0; };

/**
 * Zaehlt je Konvention, wie viele Zeilen sie auf TOLERANZ genau trifft.
 * @returns {{zeilen:number, treffer:Object<string,number>, groessteAbweichung:Object<string,number>}}
 */
const TOLERANZ = 0.0051;   // halbe Einheit der letzten Stelle (zwei Nachkommastellen)

function abgleich(bilanzen) {
    const treffer = { matchpunkte: 0, mitUnentschieden: 0, ohneUnentschieden: 0 };
    const groesste = { matchpunkte: 0, mitUnentschieden: 0, ohneUnentschieden: 0 };
    bilanzen.forEach(b => {
        Object.keys(treffer).forEach(id => {
            const k = WK.KONVENTIONEN[id];
            const soll = id === 'ohneUnentschieden' ? k.rechne(b.s, b.n) : k.rechne(b.s, b.n, b.u);
            if (!isFinite(soll)) return;
            const d = Math.abs(soll - b.p);
            if (d <= TOLERANZ) treffer[id] += 1;
            if (d > groesste[id]) groesste[id] = d;
        });
    });
    return { zeilen: bilanzen.length, treffer, groesste };
}

describe('W2 — die beiden Quellen rechnen verschieden, und zwar nachweislich', () => {

    it('limitless_online_decks_matchups.csv (win_rate) ist S/(S+N), und nur das', () => {
        const zeilen = tabelle('limitless_online_decks_matchups.csv', ';')
            .map(z => {
                const m = String(z.record || '').split('-').map(x => ganz(x));
                return { s: m[0] || 0, n: m[1] || 0, u: m[2] || 0, p: prozent(z.win_rate) };
            })
            .filter(b => isFinite(b.p) && (b.s + b.n) > 0);

        /* Vorpruefung gegen ein leeres Bestehen: haette die Datei keine
           Zeilen, waeren alle drei Zaehlungen 0 und alles unten wahr. */
        assert.notEqual(zeilen.length, 0,
            'die Datei liefert keine auswertbare Zeile — dann prueft der Rest nichts');

        const e = abgleich(zeilen);
        assert.equal(e.treffer.ohneUnentschieden, e.zeilen,
            `S/(S+N) trifft nur ${e.treffer.ohneUnentschieden} von ${e.zeilen} Zeilen `
            + `(groesste Abweichung ${e.groesste.ohneUnentschieden.toFixed(4)} Punkte). `
            + 'Entweder hat die Quelle ihre Konvention gewechselt, oder der Leser ist kaputt. '
            + 'In beiden Faellen stimmt die Beschriftung im Deckbauer und im Meta Call nicht mehr.');

        /* Die Gegenprobe: keine der beiden anderen Formeln darf diese
           Spalte EBENFALLS auf jeder Zeile treffen. Auf Zeilen ohne
           Unentschieden fallen zwei Konventionen rechnerisch zusammen —
           deshalb wird nicht „nie" verlangt, sondern „nicht ueberall".
           Ohne diese Gegenprobe waere die Zusicherung darueber leer,
           sobald die Datei nur noch Bilanzen ohne Unentschieden
           enthaelt. Bewusst als Ungleichheit formuliert, nicht als
           Band: eine Bandgrenze waere eine abgelesene Zahl. */
        assert.notEqual(e.treffer.matchpunkte, e.zeilen,
            `(3S+U)/3n trifft ebenfalls alle ${e.zeilen} Zeilen — `
            + 'die Spalte ist nicht mehr eindeutig S/(S+N)');
        assert.notEqual(e.treffer.mitUnentschieden, e.zeilen,
            `S/(S+N+U) trifft ebenfalls alle ${e.zeilen} Zeilen — `
            + 'die Spalte ist nicht mehr eindeutig S/(S+N)');
    });

    it('labs_tournament_matchups_TEF-PBL.csv (vs_win_pct) ist (3S+U)/3n, und nur das', () => {
        const zeilen = tabelle('labs_tournament_matchups_TEF-PBL.csv', ',')
            .map(z => ({
                s: ganz(z.vs_wins), n: ganz(z.vs_losses), u: ganz(z.vs_ties),
                p: prozent(z.vs_win_pct),
            }))
            .filter(b => isFinite(b.p) && (b.s + b.n + b.u) > 0);

        assert.notEqual(zeilen.length, 0,
            'die Datei liefert keine auswertbare Zeile — dann prueft der Rest nichts');

        const e = abgleich(zeilen);
        assert.equal(e.treffer.matchpunkte, e.zeilen,
            `(3S+U)/3n trifft nur ${e.treffer.matchpunkte} von ${e.zeilen} Zeilen `
            + `(groesste Abweichung ${e.groesste.matchpunkte.toFixed(4)} Punkte). `
            + 'Die Matchup-Tabelle im Reiter „Past Meta" heisst dann zu Unrecht „Win %".');

        assert.notEqual(e.treffer.mitUnentschieden, e.zeilen,
            `S/(S+N+U) trifft ebenfalls alle ${e.zeilen} Zeilen`);
        assert.notEqual(e.treffer.ohneUnentschieden, e.zeilen,
            `S/(S+N) trifft ebenfalls alle ${e.zeilen} Zeilen`);
    });

    it('und deshalb duerfen die beiden nicht gleich heissen', () => {
        /* Der Name ist keine Geschmacksfrage: „Win %" ist in
           js/win-rate-konvention.js fuer MATCHPUNKTE reserviert (so
           nennt Limitless die Spalte). Traegt eine der beiden anderen
           Konventionen denselben Namen, heissen wieder drei Groessen
           gleich — genau der Zustand, gegen den das Modul geschrieben
           wurde. */
        assert.equal(WK.kurz('matchpunkte'), 'Win %');
        assert.notEqual(WK.kurz('ohneUnentschieden'), WK.kurz('matchpunkte'));
        assert.notEqual(WK.kurz('mitUnentschieden'), WK.kurz('matchpunkte'));
        assert.notEqual(WK.kurz('mitUnentschieden'), WK.kurz('ohneUnentschieden'));
    });

    it('der Unentschieden-Anteil der beiden Felder ist wirklich verschieden', () => {
        /* Warum das hier steht: eine Online-Quote neben einer
           Papier-Quote liest sich als Spielstaerke, ist aber teils eine
           Einheitenfrage. Diese Zusicherung behauptet keinen
           Wochenwert, sondern nur, dass der Unterschied ueberhaupt
           existiert — ohne ihn waere der Hinweis, den die Oberflaeche
           jetzt traegt, gegenstandslos. */
        const online = tabelle('limitless_online_decks.csv', ';');
        const papier = tabelle('labs_tournament_matchups_TEF-PBL.csv', ',');
        const summe = (rows, f) => rows.reduce((a, r) => a + ganz(r[f]), 0);

        const uOnline = summe(online, 'ties')
            / (summe(online, 'wins') + summe(online, 'losses') + summe(online, 'ties'));
        const uPapier = summe(papier, 'vs_ties')
            / (summe(papier, 'vs_wins') + summe(papier, 'vs_losses') + summe(papier, 'vs_ties'));

        assert.notEqual(summe(online, 'ties'), 0,
            'online werden gar keine Unentschieden gezaehlt');
        assert.notEqual(uPapier.toFixed(3), uOnline.toFixed(3),
            `Papier ${(uPapier * 100).toFixed(2)} % gegen Online ${(uOnline * 100).toFixed(2)} % `
            + 'Unentschieden — liegen die beiden Felder gleichauf, ist der Hinweis '
            + 'ueber die zwei Konventionen zwar nicht falsch, aber ohne Anlass. '
            + 'Dann gehoert er neu begruendet statt stehen gelassen.');
    });
});
