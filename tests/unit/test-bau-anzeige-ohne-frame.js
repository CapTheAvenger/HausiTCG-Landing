/**
 * DAS FERTIGE DECK DARF NICHT AN EINEM FRAME HAENGEN
 *
 * BEFUND (07.09.2026, QA-A F3.28/F4.51, live nachgemessen). Nach
 * "Consistency Generate" bzw. "Max Consistency" meldete der Toast
 * "60/60 Karten", `window.cityLeagueDeck` trug 60 Karten und der
 * Autospeicher hatte sie — aber `#cityLeagueDeckCount` stand weiter
 * auf "0" und `#cityLeagueMyDeckVisual` behielt `d-none`. Erst ein
 * beliebiger +/--Klick liess das Deck erscheinen.
 *
 * Die Kette ist kurz und haengt an einer einzigen Schrift:
 *
 *   updateDeckDisplay -> schreibt #<quelle>DeckCount
 *                     -> MutationObserver in index.html (Z. 963-979
 *                        und 1011-1043) nimmt d-none von "Dein Deck"
 *                        und der Kennzahlenleiste.
 *
 * Der Abschluss des Baus rief dafuer `scheduleDeckDisplayUpdate` —
 * einen Umweg ueber `requestAnimationFrame`. Bleibt der Frame aus
 * (verdecktes oder gedrosseltes Dokument, verworfener Frame), bleibt
 * die ganze Turniervorbereitung unsichtbar, obwohl das Deck fertig im
 * Speicher liegt.
 *
 * Live gegengeprueft: mit einem `requestAnimationFrame`, das den
 * Rueckruf nie aufruft, war der gemessene Zustand exakt der gemeldete
 * (Zaehler "0", d-none gesetzt, Deck 60 Karten im Speicher). Mit dem
 * direkten Aufruf steht der Zaehler auf 60, ohne dass ein Frame
 * gelaufen ist.
 *
 * Diese Zusicherungen rechnen statt zu suchen: sie ziehen die
 * ECHTEN Abschlussbloecke beider Baupfade aus js/app-deck-builder.js
 * heraus und lassen sie in einer Welt laufen, in der
 * `requestAnimationFrame` nie zurueckruft. Wer den Umweg
 * wiederherstellt, faellt hier auf.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { describe, it } = require('node:test');

const WURZEL = path.join(__dirname, '..', '..');
const BAUER = fs.readFileSync(path.join(WURZEL, 'js', 'app-deck-builder.js'), 'utf8');

/* Schneidet ein Stueck Quelltext zwischen zwei Ankern heraus. Die
   Anker sind Saetze, die im Code stehen und nicht der Formatierung
   dienen — verschwindet einer, faellt die Zusicherung mit einer
   Meldung um, die sagt, wo gesucht wurde. */
function stueck(von, bis) {
    const a = BAUER.indexOf(von);
    assert.ok(a >= 0, `Anker nicht gefunden: ${von}`);
    const b = BAUER.indexOf(bis, a);
    assert.ok(b > a, `Endanker nicht gefunden: ${bis}`);
    return BAUER.slice(a + von.length, b);
}

/* Der Abschluss des Y.2-Pfades (MostConsistencyBuilder): speichern,
   dann Anzeige nachziehen. */
function abschlussY2() {
    return stueck('// Persist the freshly built deck.',
                  '// Verify the deck actually populated');
}

/* Der Abschluss der Legacy-Stufen. */
function abschlussLegacy() {
    return stueck("} catch (e) { devLog('[autoCompleteConsistency] vanilla snapshot failed:', e); }",
                  '// Build-vs auto-fill');
}

/* Die ECHTE Entprellung aus dem Quelltext — damit hier nicht eine
   nachgebaute Fassung geprueft wird, die sich anders verhaelt. */
function ladeEntprellung(welt) {
    const kopf = 'function scheduleDeckDisplayUpdate(source) {';
    const a = BAUER.indexOf(kopf);
    assert.ok(a >= 0, 'scheduleDeckDisplayUpdate nicht gefunden');
    let i = BAUER.indexOf('{', a), tiefe = 0, ende = -1;
    for (let j = i; j < BAUER.length; j++) {
        if (BAUER[j] === '{') tiefe++;
        else if (BAUER[j] === '}') { tiefe--; if (tiefe === 0) { ende = j; break; } }
    }
    assert.ok(ende > 0, 'unbalancierte Klammern in scheduleDeckDisplayUpdate');
    const koerper = BAUER.slice(i + 1, ende);
    const f = new Function(
        'source', 'requestAnimationFrame', 'updateDeckDisplay',
        'pendingDeckDisplayUpdateBySource', koerper);
    const offen = {};
    return (q) => f(q, welt.requestAnimationFrame, welt.updateDeckDisplay, offen);
}

/* Eine Welt, in der KEIN Frame kommt: requestAnimationFrame nimmt den
   Rueckruf entgegen, vergibt eine Kennung und ruft ihn nie auf. Genau
   das passiert in einem verdeckten oder gedrosselten Dokument. */
function weltOhneFrame() {
    const welt = {
        rafAufrufe: 0,
        anzeigeAufrufe: [],
        gespeichert: [],
        rarityZurueck: 0,
    };
    welt.requestAnimationFrame = (cb) => { welt.rafAufrufe++; return 1; };
    welt.updateDeckDisplay = (q) => { welt.anzeigeAufrufe.push(q); };
    return welt;
}

/* Fuehrt einen Abschlussblock in dieser Welt aus. Alles, was der Block
   von aussen anfasst, wird hereingereicht — nichts davon rechnet, alles
   protokolliert nur. */
function fahre(koerper, welt, quelle) {
    const f = new Function(
        'source', 'updateDeckDisplay', 'scheduleDeckDisplayUpdate',
        'saveCityLeagueDeck', 'saveCurrentMetaDeck', 'savePastMetaDeck',
        'resetDeckRarityToggle', 'devLog', 'window',
        koerper);
    const entprellung = ladeEntprellung(welt);
    f(quelle,
      welt.updateDeckDisplay,
      entprellung,
      () => welt.gespeichert.push('cityLeague'),
      () => welt.gespeichert.push('currentMeta'),
      () => welt.gespeichert.push('pastMeta'),
      () => { welt.rarityZurueck++; },
      () => {},
      {});
}

describe('Bauabschluss zeichnet die Anzeige auch ohne Frame', () => {

    it('die Entprellung allein tut ohne Frame gar nichts (das war die Ursache)', () => {
        const welt = weltOhneFrame();
        const entprellung = ladeEntprellung(welt);
        entprellung('cityLeague');
        assert.strictEqual(welt.rafAufrufe, 1,
            'scheduleDeckDisplayUpdate soll einen Frame anfordern');
        assert.deepStrictEqual(welt.anzeigeAufrufe, [],
            'ohne Frame darf die Entprellung nichts gezeichnet haben — '
            + 'genau daran haengt der gemeldete Fehler');
    });

    it('Y.2-Pfad: updateDeckDisplay laeuft, ohne dass ein Frame kommt', () => {
        const welt = weltOhneFrame();
        fahre(abschlussY2(), welt, 'currentMeta');
        assert.deepStrictEqual(welt.anzeigeAufrufe, ['currentMeta'],
            'nach dem Y.2-Bau muss die Anzeige direkt nachgezogen werden, '
            + 'nicht erst im naechsten Frame');
    });

    it('Legacy-Pfad: updateDeckDisplay laeuft, ohne dass ein Frame kommt', () => {
        const welt = weltOhneFrame();
        fahre(abschlussLegacy(), welt, 'cityLeague');
        assert.deepStrictEqual(welt.anzeigeAufrufe, ['cityLeague'],
            'auch der Abschluss der Legacy-Stufen darf nicht am Frame haengen');
    });

    it('Legacy-Pfad setzt den Rarity-Umschalter weiterhin zurueck', () => {
        // Mitgeprueft, weil die Behebung genau in dieser Zeile sitzt:
        // wer sie umschreibt, soll den Nachbarn nicht verlieren.
        const welt = weltOhneFrame();
        fahre(abschlussLegacy(), welt, 'cityLeague');
        assert.strictEqual(welt.rarityZurueck, 1);
    });

    it('Y.2-Pfad speichert das Deck, bevor er die Anzeige nachzieht', () => {
        const welt = weltOhneFrame();
        fahre(abschlussY2(), welt, 'pastMeta');
        assert.deepStrictEqual(welt.gespeichert, ['pastMeta'],
            'der Bau muss sein Ergebnis auch weiterhin sichern');
    });

});
