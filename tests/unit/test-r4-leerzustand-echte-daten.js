/**
 * BEFUNDE B2 UND B4 (07.09.2026, Reiter "City League", Vergangenheitsfenster)
 *
 * B4: DREI TABELLEN, DIE NIE ERSCHEINEN.
 *   Am 07.09.2026 wurden "Häufiger gespielt", "Neue Archetypen" und
 *   "Verschwundene Archetypen" gerendert — und mit den heutigen Daten
 *   erscheint keine davon. Dieser Test stellt fest WARUM, und zwar an der
 *   echten Datei, und haelt fest, dass an ihrer Stelle ein ehrlicher
 *   Leerzustand steht: Quelle (Dateiname) und Zeitfenster inbegriffen.
 *
 * B2: DIE BEGRUENDUNG WAR FALSCH.
 *   Im Quelltext stand, "Häufiger gespielt" sei ohne Vorzeitraum leer,
 *   "weil count_change > 0 … ohne Vorzeitraum nicht vorkommt". An den
 *   Daten ist das Gegenteil richtig: ALLE Zeilen von
 *   data/city_league_archetypes_past_comparison.csv haben count_change > 0.
 *   Leer ist die Rubrik, weil ihr Filter zusaetzlich status !== 'NEU'
 *   verlangt und jede Zeile den Status NEU traegt.
 *
 * WAS DIESER TEST PRUEFT — UND WAS NICHT
 *
 *   Er liest zwei Dateien aus data/, behauptet aber KEINE Wochenwerte.
 *   Jeder Sollwert wird aus derselben Datei gezaehlt, gegen die geprueft
 *   wird; verglichen werden zwei Rechenwege auf denselben Zeilen:
 *
 *     (1) Der Filter der Oberflaeche gegen die Zaehlung im Test.
 *         `increased` muss genau die Zeilen sein, die status !== 'NEU'
 *         UND count_change > 0 erfuellen — nicht "0 Zeilen".
 *     (2) Die Zahlen im Leerzustandstext gegen dieselbe Zaehlung.
 *         Steht dort "11 von 11", muessen es 11 von 11 sein.
 *     (3) Jede Rubrik ist entweder als Tabelle da ODER im Leerzustand
 *         benannt. Eine dritte Moeglichkeit — weder noch — ist der
 *         Befund selbst.
 *
 *   Aendert sich die Datenlage (eine echte City-League-Saison faengt
 *   wieder an), bleiben alle drei Zusicherungen gruen: dann stehen die
 *   Tabellen da, und der Leerzustand faellt weg.
 *
 * EINGETRAGEN in tests/unit/test-testdaten-wachhund.js.
 * KEIN jsdom.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WURZEL, QUELLE, rendern, ueberschriften } = require('./lib-cityleague-sandkasten.js');

const VERGLEICHSDATEI = 'city_league_archetypes_past_comparison.csv';
const ARCHETYPDATEI = 'city_league_archetypes_past.csv';

/** Eine Semikolon-CSV aus data/ lesen, so wie die Seite sie bekommt. */
function csv(name) {
    const roh = fs.readFileSync(path.join(WURZEL, 'data', name), 'utf8').replace(/^﻿/, '');
    const zeilen = roh.trim().split(/\r?\n/);
    const kopf = zeilen[0].split(';');
    return zeilen.slice(1).map(z => {
        const werte = z.split(';');
        const o = {};
        kopf.forEach((k, i) => { o[k] = werte[i]; });
        return o;
    });
}

const VERGLEICH = csv(VERGLEICHSDATEI);
const ARCHETYPEN = csv(ARCHETYPDATEI);

/** Die Zaehlung, gegen die alles geprueft wird — aus der Datei, nicht gesetzt. */
const Z = {
    zeilen: VERGLEICH.length,
    mitZuwachs: VERGLEICH.filter(d => parseInt(d.count_change || 0, 10) > 0).length,
    zuwachsUndNeu: VERGLEICH.filter(d => parseInt(d.count_change || 0, 10) > 0
                                      && d.status === 'NEU').length,
    haeufiger: VERGLEICH.filter(d => d.status !== 'NEU'
                                  && parseInt(d.count_change || 0, 10) > 0).length,
    neu: VERGLEICH.filter(d => d.status === 'NEU').length,
    verschwunden: VERGLEICH.filter(d => d.status === 'VERSCHWUNDEN').length
};

/** Das Zeitfenster, wie die Seite es aus den Datumsangaben der Datei bildet. */
const ZEITFENSTER = (() => {
    const d = [...new Set(ARCHETYPEN.map(r => r.date).filter(Boolean))].sort();
    return d.length === 1 ? d[0] : (d[0] + ' – ' + d[d.length - 1]);
})();

function seite(sprache) {
    return rendern({
        vergleich: VERGLEICH, archetypen: ARCHETYPEN,
        turniere: new Set(ARCHETYPEN.map(r => r.tournament_id)).size,
        zeitraum: ZEITFENSTER, sprache: sprache || 'de'
    }).html;
}

/** Der Text des Leerzustandsblocks, ohne HTML-Maskierung. */
function leerzustand(html) {
    const m = String(html).match(
        /<div class="city-league-info-combined-explanation" role="status">([\s\S]*?)<\/div>/);
    return m ? m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') : null;
}

describe('B2/B4 — die leeren Rubriken, ihr wahrer Grund und der Leerzustand', () => {

    it('Vorpruefung: beide Dateien haben ueberhaupt Zeilen', () => {
        assert.notEqual(Z.zeilen, 0, 'data/' + VERGLEICHSDATEI + ' ist leer');
        assert.notEqual(ARCHETYPEN.length, 0, 'data/' + ARCHETYPDATEI + ' ist leer');
        assert.notEqual(ZEITFENSTER, '', 'die Archetypdatei fuehrt kein Datum');
    });

    it('B2: die Datei widerlegt die alte Begruendung — Zuwachs gibt es sehr wohl', () => {
        // Die alte Behauptung war: "count_change > 0 kommt ohne Vorzeitraum
        // nicht vor". Wahr ist: mitZuwachs Zeilen haben Zuwachs, und genau
        // so viele tragen zugleich den Status NEU — daran scheitert die
        // Rubrik, nicht am fehlenden Zuwachs.
        assert.equal(Z.haeufiger, Z.mitZuwachs - Z.zuwachsUndNeu,
            'die Rechnung des Tests trifft den Filter der Oberflaeche nicht mehr');
        assert.doesNotMatch(QUELLE, /count_change > 0 bzw\. status=VERSCHWUNDEN kommt ohne/,
            'die widerlegte Begruendung steht wieder im Quelltext');
    });

    it('B2: der Filter der Oberflaeche liefert genau die gezaehlten Zeilen', () => {
        const html = seite('de');
        const titel = ueberschriften(html);
        const daSteht = titel.includes('Häufiger gespielt');
        assert.equal(daSteht, Z.haeufiger > 0,
            'die Tabelle "Häufiger gespielt" steht ' + (daSteht ? 'da' : 'nicht da')
            + ', die Datei traegt aber ' + Z.haeufiger + ' passende Zeile(n)');
    });

    it('B4: der Leerzustand nennt die QUELLE, und die Datei gibt es wirklich', () => {
        const text = leerzustand(seite('de'));
        assert.notEqual(text, null, 'es steht ueberhaupt kein Leerzustand da');
        const m = text.match(/Quelle: (\S+?),/);
        assert.notEqual(m, null, 'der Leerzustand nennt keine Quelle: ' + text);
        assert.equal(fs.existsSync(path.join(WURZEL, m[1])), true,
            'der genannte Pfad "' + m[1] + '" existiert im Arbeitsbaum nicht');
        assert.equal(path.basename(m[1]), VERGLEICHSDATEI,
            'genannt wird "' + m[1] + '", gelesen wurde ' + VERGLEICHSDATEI);
    });

    it('B4: der Leerzustand nennt das ZEITFENSTER, und zwar dasselbe wie die Karte', () => {
        const html = seite('de');
        const text = leerzustand(html);
        assert.match(text, new RegExp('Zeitfenster ' + ZEITFENSTER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(html, new RegExp('cl\\.period</strong><br>' + ZEITFENSTER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
            'Karte und Leerzustand nennen verschiedene Zeitfenster');
    });

    it('B4: die Zahlen im Leerzustand sind die Zahlen der Datei', () => {
        const text = leerzustand(seite('de'));
        const m = text.match(
            /count_change > 0, die NICHT den Status NEU tragen: (\d+) von (\d+) Zeilen haben count_change > 0, davon tragen (\d+) den Status NEU — es bleiben (\d+)\./);
        assert.notEqual(m, null, 'die ausgezaehlte Bilanz steht nicht im Text: ' + text);
        assert.equal(Number(m[1]), Z.mitZuwachs);
        assert.equal(Number(m[2]), Z.zeilen);
        assert.equal(Number(m[3]), Z.zuwachsUndNeu);
        assert.equal(Number(m[4]), Z.haeufiger);

        const v = text.match(/Status VERSCHWUNDEN: (\d+) von (\d+)\./);
        assert.notEqual(v, null, 'die Bilanz zu "Verschwundene Archetypen" fehlt: ' + text);
        assert.equal(Number(v[1]), Z.verschwunden);
        assert.equal(Number(v[2]), Z.zeilen);
    });

    it('B4: jede der drei Rubriken ist entweder Tabelle ODER benannter Leerzustand', () => {
        const html = seite('de');
        const titel = ueberschriften(html);
        const text = leerzustand(html) || '';
        const rubriken = [
            ['Häufiger gespielt', Z.haeufiger],
            ['Neue Archetypen', Z.neu],
            ['Verschwundene Archetypen', Z.verschwunden]
        ];
        rubriken.forEach(([name, anzahl]) => {
            const alsTabelle = titel.includes(name);
            const imText = text.includes('„' + name + '“');
            assert.equal(alsTabelle || imText, true,
                'die Rubrik "' + name + '" (' + anzahl + ' Zeile(n) in der Datei) erscheint weder '
                + 'als Tabelle noch im Leerzustand — genau Befund B4');
        });
    });

    it('B4: "Neue Archetypen" hat Zeilen, bekommt aber bewusst keine Tabelle — und sagt das', () => {
        const text = leerzustand(seite('de'));
        if (Z.neu > 0 && Z.neu === Z.zeilen) {
            // Kein Vorzeitraum: jede Zeile ist NEU, also sagt "neu" nichts.
            assert.match(text, new RegExp('Ohne eigene Tabelle, obwohl Daten vorliegen: '
                + '„Neue Archetypen“ \\(' + Z.neu + '\\)'));
            assert.match(text, /steht hier bewusst nicht/);
        }
    });

    it('B5-Beleg an den heutigen Daten: die Ortsangabe ist der Scraper-Platzhalter', () => {
        const orte = [...new Set(ARCHETYPEN.map(r => r.prefecture).filter(Boolean))];
        const html = seite('de');
        orte.forEach(ort => {
            if (ort !== 'Special Event') return;
            assert.match(html, /Ortsangabe „Special Event“ \(vom Scraper gesetzt, nicht aus der Quelle\)/,
                'die Seite gibt den Platzhalter der Datei unmarkiert als Ortsangabe aus');
        });
    });

    it('englisch: derselbe Leerzustand, dieselben Zahlen', () => {
        const text = leerzustand(seite('en'));
        assert.match(text, new RegExp('source: \\S*' + VERGLEICHSDATEI.replace(/\./g, '\\.')));
        const m = text.match(/(\d+) of (\d+) rows have count_change > 0, (\d+) of those are flagged NEW/);
        assert.notEqual(m, null, 'die englische Bilanz fehlt: ' + text);
        assert.equal(Number(m[1]), Z.mitZuwachs);
        assert.equal(Number(m[2]), Z.zeilen);
        assert.equal(Number(m[3]), Z.zuwachsUndNeu);
    });
});
