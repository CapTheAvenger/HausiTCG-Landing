/**
 * BEFUND A2 / A-F3.13b und A-F3.11 (live gemessen am 07.09.2026,
 * Reiter "City League" -> Kartenuebersicht):
 *
 *   Typfilter "Spez. Energie" anklicken -> das Gitter zeigt nur
 *   Spezial-Energien, der Zaehler sagt "2 Karten". Danach den
 *   Seltenheitsmodus auf "Alle Drucke" umstellen -> der Knopf
 *   "Spez. Energie" bleibt hervorgehoben, das Gitter zeigt wieder
 *   ALLE Karten, und der Zaehler bleibt auf der alten Zahl stehen.
 *   Er springt erst beim naechsten Klick auf einen Typfilter nach.
 *
 * IM QUELLTEXT NACHVERFOLGT: js/app-city-league.js, setOverviewRarityMode()
 * ruft applyCityLeagueFilter(). Die Funktion baut das Gitter neu auf und
 * schreibt den Zaehler mit der Zahl der EINDEUTIGEN Karten. Der Typfilter
 * lebt aber ausschliesslich in filterOverviewCards() — die Funktion setzt
 * d-none auf die Kacheln und laesst den Zaehler in
 * js/deck-analysis-shared.js:100 die Zahl der SICHTBAREN Kacheln
 * schreiben. Ohne diesen zweiten Aufruf ist der Zustand der Variablen
 * overviewCardTypeFilter nach dem Neuaufbau nirgends mehr im DOM
 * abgebildet.
 *
 * Der Zaehler wird NICHT hier repariert: js/deck-analysis-shared.js
 * gehoert einem anderen Arbeitsbereich. Er wird ueber
 * filterOverviewCards() erreicht, also ueber genau den Aufruf, der fehlte.
 *
 * Diese Datei fuehrt die echten Funktionen aus (siehe
 * tests/unit/lib-uebersicht-sandkasten.js). Sie liest keine Live-Daten:
 * die Kacheln setzt der Test selbst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sandkasten, kachel } = require('./lib-uebersicht-sandkasten.js');

/**
 * Ein Deck mit drei eindeutigen Karten. Im Modus "min"/"max" steht je
 * Karte EINE Kachel, im Modus "all" stehen alle Drucke — genau der
 * Sprung, den der Befund beschreibt (33 Karten -> 206 Drucke).
 */
function gitterBauen(modus) {
    const karten = [
        { name: 'Doppelte Turbo-Energie', typ: 'Special Energy', drucke: 4 },
        { name: 'Professor-Research',      typ: 'Supporter',      drucke: 3 },
        { name: 'Neo-Upper-Energie',       typ: 'Special Energy', drucke: 2 }
    ];
    const raus = [];
    karten.forEach((k, i) => {
        const n = modus === 'all' ? k.drucke : 1;
        for (let d = 0; d < n; d++) {
            raus.push(kachel({ id: `k${i}-${d}`, name: k.name, typ: k.typ,
                               set: 'M1', nummer: String(d + 1) }));
        }
    });
    return raus;
}

const EINDEUTIG = 3;                       // 3 Karten
const DRUCKE_GESAMT = 4 + 3 + 2;           // 9 Kacheln im Modus "all"
const SPEZIALENERGIEN_ALL = 4 + 2;         // davon Spezial-Energien

describe('Seltenheitswechsel zieht den Typfilter nach (A2 / A-F3.13b, A-F3.11)', () => {

    it('Ausgangslage: der Typfilter greift und der Zaehler nennt die sichtbaren Kacheln', () => {
        const s = sandkasten({ neuAufbau: gitterBauen, eindeutig: EINDEUTIG });
        s.kasten.applyCityLeagueFilter();               // Modus "min"
        s.kasten.setOverviewCardTypeFilter('Special Energy');

        const sichtbar = s.gitter._kacheln.filter(k => !k.classList.contains('d-none'));
        assert.equal(sichtbar.length, 2, 'im Modus "min" steht je Karte eine Kachel');
        assert.equal(s.zaehler.textContent, '2 Karten');
        assert.ok(s.knoten.overviewTypeSpecialEnergy.classList.contains('active'),
            'der geklickte Typknopf ist hervorgehoben');
    });

    it('nach dem Wechsel auf "Alle Drucke" bleiben nur die Spezial-Energien stehen', () => {
        const s = sandkasten({ neuAufbau: gitterBauen, eindeutig: EINDEUTIG });
        s.kasten.applyCityLeagueFilter();
        s.kasten.setOverviewCardTypeFilter('Special Energy');

        s.kasten.setOverviewRarityMode('all');

        assert.equal(s.gitter._kacheln.length, DRUCKE_GESAMT,
            'Vorbedingung: das Gitter wurde mit allen Drucken neu aufgebaut');
        const sichtbar = s.gitter._kacheln.filter(k => !k.classList.contains('d-none'));
        assert.equal(sichtbar.length, SPEZIALENERGIEN_ALL,
            'der Typfilter "Spez. Energie" muss nach dem Neuaufbau weiter greifen — '
            + 'sonst behauptet der hervorgehobene Knopf eine Auswahl, die das Gitter nicht zeigt');
        assert.ok(sichtbar.every(k => k.getAttribute('data-card-type') === 'Special Energy'));
    });

    it('der Zaehler nennt nach dem Wechsel die Zahl, die das Gitter zeigt (A-F3.11)', () => {
        const s = sandkasten({ neuAufbau: gitterBauen, eindeutig: EINDEUTIG });
        s.kasten.applyCityLeagueFilter();
        s.kasten.setOverviewCardTypeFilter('Special Energy');
        s.kasten.setOverviewRarityMode('all');

        assert.equal(s.zaehler.textContent, `${SPEZIALENERGIEN_ALL} Karten`,
            'der Zaehler darf nicht auf dem Stand vor dem Wechsel stehen bleiben');
    });

    it('ohne Typfilter zaehlt der Zaehler alle Drucke, nicht die eindeutigen Karten', () => {
        const s = sandkasten({ neuAufbau: gitterBauen, eindeutig: EINDEUTIG });
        s.kasten.applyCityLeagueFilter();
        s.kasten.setOverviewRarityMode('all');

        const sichtbar = s.gitter._kacheln.filter(k => !k.classList.contains('d-none'));
        assert.equal(sichtbar.length, DRUCKE_GESAMT);
        assert.equal(s.zaehler.textContent, `${DRUCKE_GESAMT} Karten`,
            '"33 Karten" ueber einem Gitter aus 206 Drucken war der gemeldete Widerspruch');
    });

    it('die Suche im Suchfeld ueberlebt den Seltenheitswechsel ebenfalls', () => {
        const s = sandkasten({ neuAufbau: gitterBauen, eindeutig: EINDEUTIG });
        s.kasten.applyCityLeagueFilter();
        s.suchfeld.value = 'neo-upper';
        s.kasten.filterOverviewCards();
        assert.equal(s.zaehler.textContent, '1 Karten');

        s.kasten.setOverviewRarityMode('all');
        const sichtbar = s.gitter._kacheln.filter(k => !k.classList.contains('d-none'));
        assert.equal(sichtbar.length, 2, 'Neo-Upper-Energie hat zwei Drucke');
        assert.equal(s.zaehler.textContent, '2 Karten');
    });
});
