/**
 * BEFUND B1, ZWEITE RUNDE (07.09.2026, Reiter "City League"):
 *
 *   Der Herkunftssatz — "Diese Ansicht beruht auf einem einzigen
 *   Turnier: Kennung 568, …" — stand ZWEIMAL auf derselben Seite:
 *
 *     1. in der Karte "Datenquelle"
 *        (js/app-city-league.js, <span class="city-league-info-card-herkunft">)
 *     2. angehaengt an "Was dieser Reiter hat" im Leerzustandsblock
 *        (cityLeagueVergleichLeerHinweis, Parameter `herkunftSatz`)
 *
 *   Zwei wortgleiche Absaetze im Abstand einer Bildschirmhoehe lesen
 *   sich wie ein Fehler in der Seite.
 *
 * DIE ENTSCHEIDUNG, DIE DIESER TEST FESTHAELT
 *
 *   Er bleibt in der KARTE. Die Karte "Datenquelle" wird IMMER
 *   gerendert; der Leerzustandsblock nur, solange Rubriken fehlen.
 *   Stuende die Herkunft im Block, verschwaende sie in dem Moment, in
 *   dem die Datenlage besser wird — also gerade dann, wenn die Ansicht
 *   auf mehr beruht. Ausserdem ist "woraus die Daten kommen" genau das,
 *   was die Karte ueberschreibt.
 *
 *   Geprueft wird deshalb BEIDES: genau ein Vorkommen, und zwar in der
 *   Karte. Eine reine Zaehlung waere auch dann gruen, wenn der Satz aus
 *   der Karte verschwaende und nur im Block stuende.
 *
 * KEIN jsdom, KEINE Daten aus data/ — die Zeilen setzt der Test.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { rendern } = require('./lib-cityleague-sandkasten.js');

/** Eine Lage OHNE Vorzeitraum: der Leerzustandsblock steht da. */
const OHNE_VORZEITRAUM = [
    { archetype: 'Dragapult Blaziken', status: 'NEU', old_count: '0', new_count: '6',
      count_change: '6', old_meta_share: '0', new_meta_share: '23,08',
      old_avg_placement: '0', new_avg_placement: '14,83', avg_placement_change: '14,83',
      old_best: '0', new_best: '5' },
    { archetype: 'Ogerpon Box', status: 'NEU', old_count: '0', new_count: '5',
      count_change: '5', old_meta_share: '0', new_meta_share: '19,23',
      old_avg_placement: '0', new_avg_placement: '14,2', avg_placement_change: '14,2',
      old_best: '0', new_best: '1' }
];

/**
 * Eine Lage, in der JEDE der sieben Rubriken etwas zu zeigen hat — dann
 * faellt der Leerzustandsblock ganz weg. Genau darum geht es: die Karte
 * traegt die Herkunft auch dann noch.
 *
 * Gebaut, nicht gemessen. Die Zahlen sind so gewaehlt, dass
 * getCityLeagueSortedSections() alle sieben Listen fuellt:
 *   Seltener gespielt      A11 (11 -> 1) und WEG1 (9 -> 0)
 *   Haeufiger gespielt     A10 (1 -> 11), Status nicht NEU
 *   Performance besser     A1  (avg_placement_change -1,50)
 *   Performance schlechter A2  (avg_placement_change +2,00)
 *   Top-10-Wechsel         A10 rein, A11 raus
 *   Neue Archetypen        NEU1 (Status NEU, aber Vorzeitraum vorhanden)
 *   Verschwundene          WEG1 (Status VERSCHWUNDEN)
 */
function _zeile(archetype, status, alt, neu, wechsel, best) {
    return {
        archetype, status,
        old_count: String(alt), new_count: String(neu),
        count_change: String(neu - alt),
        old_meta_share: '10,00', new_meta_share: '10,00',
        old_avg_placement: '10,00', new_avg_placement: '10,00',
        avg_placement_change: wechsel,
        old_best: String(best), new_best: String(best)
    };
}
const MIT_VORZEITRAUM = [
    _zeile('A1', 'BESTAND', 20, 20, '-1,50', 1),
    _zeile('A2', 'BESTAND', 19, 19, '2,00', 2),
    _zeile('A3', 'BESTAND', 18, 18, '0', 3),
    _zeile('A4', 'BESTAND', 17, 17, '0', 4),
    _zeile('A5', 'BESTAND', 16, 16, '0', 5),
    _zeile('A6', 'BESTAND', 15, 15, '0', 6),
    _zeile('A7', 'BESTAND', 14, 14, '0', 7),
    _zeile('A8', 'BESTAND', 13, 13, '0', 8),
    _zeile('A9', 'BESTAND', 12, 12, '0', 9),
    _zeile('A10', 'BESTAND', 1, 11, '0', 10),
    _zeile('A11', 'BESTAND', 11, 1, '0', 11),
    _zeile('NEU1', 'NEU', 0, 5, '0', 12),
    _zeile('WEG1', 'VERSCHWUNDEN', 9, 0, '0', 13)
];

const ARCHETYPEN = [
    { tournament_id: '568', prefecture: 'Special Event', shop: 'Tournament 568', placement: '1' },
    { tournament_id: '568', prefecture: 'Special Event', shop: 'Tournament 568', placement: '9' }
];

/** Wie oft kommt der Kopf des Herkunftssatzes im HTML vor? */
function vorkommen(html, de) {
    const kopf = de ? 'Diese Ansicht beruht auf' : 'This view rests on';
    return (String(html).match(new RegExp(kopf, 'g')) || []).length;
}

/** Der Inhalt des Herkunfts-<span> der Karte "Datenquelle". */
function ausKarte(html) {
    const m = String(html).match(
        /<span class="city-league-info-card-herkunft">([\s\S]*?)<\/span>/);
    return m ? m[1] : null;
}

/** Der Text des Leerzustandsblocks. */
function leerzustand(html) {
    const m = String(html).match(
        /<div class="city-league-info-combined-explanation" role="status">([\s\S]*?)<\/div>/);
    return m ? m[1] : null;
}

describe('B1/2 — der Herkunftssatz steht genau einmal, und zwar in der Karte', () => {

    it('Vorpruefung: die gesetzte Lage erzeugt ueberhaupt beide Bloecke', () => {
        const { html } = rendern({ vergleich: OHNE_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026' });
        assert.notEqual(ausKarte(html), null, 'die Karte "Datenquelle" traegt keinen Herkunftssatz');
        assert.notEqual(leerzustand(html), null,
            'der Leerzustandsblock steht gar nicht da — dann kann dieser Test nichts doppelt finden');
    });

    it('DER FALL DES BEFUNDS: genau ein Vorkommen, wenn der Leerzustand danebensteht', () => {
        const { html } = rendern({ vergleich: OHNE_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026' });
        assert.equal(vorkommen(html, true), 1,
            'der Herkunftssatz steht ' + vorkommen(html, true) + '-mal auf der Seite — genau B1');
    });

    it('das eine Vorkommen sitzt in der Karte, nicht im Leerzustand', () => {
        const { html } = rendern({ vergleich: OHNE_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026' });
        assert.match(ausKarte(html), /Diese Ansicht beruht auf einem einzigen Turnier/);
        assert.doesNotMatch(leerzustand(html), /Diese Ansicht beruht auf/,
            'der Leerzustand traegt den Satz ein zweites Mal');
    });

    it('der Leerzustand behaelt seinen eigenen Bestandssatz — nur die Herkunft faellt weg', () => {
        const { html } = rendern({ vergleich: OHNE_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026' });
        assert.match(leerzustand(html),
            /Was dieser Reiter hat: Zeitraum 6th June 2026, 1 Turnier, 2 Archetypen\./);
    });

    it('WARUM DIE KARTE: bei besserer Datenlage faellt der Block weg, die Karte bleibt', () => {
        const { html } = rendern({ vergleich: MIT_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026' });
        assert.equal(leerzustand(html), null,
            'Vorpruefung: bei dieser Lage darf der Leerzustandsblock gar nicht mehr erscheinen');
        assert.equal(vorkommen(html, true), 1,
            'die Herkunft ist mit dem Leerzustand verschwunden — genau der Grund fuer die Karte');
        assert.match(ausKarte(html), /Diese Ansicht beruht auf einem einzigen Turnier/);
    });

    it('englisch: dieselbe Zaehlung, damit die Dopplung nicht sprachweise zurueckkommt', () => {
        const { html } = rendern({ vergleich: OHNE_VORZEITRAUM, archetypen: ARCHETYPEN,
                                   turniere: 1, zeitraum: '6th June 2026', sprache: 'en' });
        assert.equal(vorkommen(html, false), 1);
        assert.match(ausKarte(html), /This view rests on a single tournament/);
        assert.doesNotMatch(leerzustand(html), /This view rests on/);
    });
});
