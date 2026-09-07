/**
 * BEFUND B5 (07.09.2026, Reiter "City League"):
 *
 *   getCityLeagueSortedSections() rechnet `newArchetypes`, `disappeared`
 *   und `increased` — und renderCityLeagueTable zeigte keine davon.
 *   Seit dem 07.09. stand nur ihre ZAHL im Leerzustandsblock ("Ohne
 *   Tabelle auf dieser Seite, obwohl Daten vorliegen: …"). Eine Seite,
 *   die selbst schreibt, dass sie etwas hat und nicht zeigt.
 *
 *   Geprueft, ob sie mit den vorhandenen Daten darstellbar sind: ja.
 *   Die Vergleichsdatei fuehrt fuer jede Zeile old_count, new_count,
 *   count_change, old_meta_share/new_meta_share,
 *   old_avg_placement/new_avg_placement und old_best/new_best.
 *
 * EINE AUSNAHME, und die ist Absicht: OHNE VORZEITRAUM bekommt "Neue
 * Archetypen" keine Tabelle. Dann tragen alle Zeilen status=NEU, weil es
 * keine zweite Messung gibt — "neu" waere dieselbe erfundene Rubrik, die
 * am 30.08.2026 bei den Performance-Tabellen abgestellt wurde. Der
 * Leerzustandstext sagt das dann, statt zu schweigen.
 *
 * Geprueft wird am gerenderten HTML: die Tabellen muessen dastehen,
 * nicht nur im Quelltext vorkommen. Keine Live-Daten.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { rendern, nurFunktionen, ueberschriften, zeilenUnter } =
    require('./lib-cityleague-sandkasten.js');

const vgl = (o) => Object.assign({
    archetype: 'X', status: 'BESTEHEND', trend: 'STABIL',
    old_count: '0', new_count: '0', count_change: '0',
    old_meta_share: '0', new_meta_share: '0', meta_share_change: '0',
    old_avg_placement: '0', new_avg_placement: '0', avg_placement_change: '0',
    old_best: '', new_best: ''
}, o);

const archetypZeile = { date: '6th June 2026', tournament_id: '568',
    prefecture: 'Special Event', shop: 'Tournament 568',
    format: 'City League (JP)', placement: '1', player: 'Jemand', archetype: 'A' };

/** Ein Feld MIT Vorzeitraum: alle drei Rubriken sind besetzt. */
const mitVorzeitraum = [
    vgl({ archetype: 'Steigt A', old_count: '4', new_count: '9', count_change: '5',
          new_avg_placement: '6,0', new_meta_share: '18,0', new_best: '1' }),
    vgl({ archetype: 'Steigt B', old_count: '2', new_count: '5', count_change: '3',
          new_avg_placement: '7,5', new_meta_share: '10,0', new_best: '2' }),
    vgl({ archetype: 'Neu A', status: 'NEU', old_count: '0', new_count: '6',
          count_change: '6', new_meta_share: '12,0', new_avg_placement: '9,25', new_best: '3' }),
    vgl({ archetype: 'Weg A', status: 'VERSCHWUNDEN', old_count: '7', new_count: '0',
          count_change: '-7', old_meta_share: '14,0', old_avg_placement: '5,5', old_best: '2' }),
    vgl({ archetype: 'Faellt A', old_count: '8', new_count: '3', count_change: '-5',
          new_avg_placement: '11,0', avg_placement_change: '2,0' })
];

/** Ein Feld OHNE Vorzeitraum: jede Zeile alt = 0, alle als NEU verzeichnet. */
const ohneVorzeitraum = [
    vgl({ archetype: 'Dragapult Blaziken', status: 'NEU', new_count: '6', count_change: '6',
          new_meta_share: '23,08', new_avg_placement: '14,83', new_best: '5' }),
    vgl({ archetype: 'Ogerpon Box', status: 'NEU', new_count: '5', count_change: '5',
          new_meta_share: '19,23', new_avg_placement: '14,2', new_best: '1' })
];

const lauf = (daten, sprache) => rendern({
    vergleich: daten, archetypen: [archetypZeile],
    turniere: 1, zeitraum: '6. Juni 2026', sprache: sprache || 'de'
});

describe('B5 — die drei gerechneten Rubriken stehen jetzt auch da', () => {

    it('mit Vorzeitraum: alle drei Tabellen werden gerendert', () => {
        const { html } = lauf(mitVorzeitraum);
        const titel = ueberschriften(html);
        ['Häufiger gespielt', 'Neue Archetypen', 'Verschwundene Archetypen'].forEach(x => {
            assert.ok(titel.includes(x),
                'Tabelle fehlt: ' + x + '\ngerendert wurde: ' + JSON.stringify(titel));
        });
    });

    it('in den Tabellen stehen die richtigen Archetypen, nach der richtigen Groesse sortiert', () => {
        const { html } = lauf(mitVorzeitraum);
        assert.deepEqual(zeilenUnter(html, 'Häufiger gespielt'), ['Steigt A', 'Steigt B'],
            '"Häufiger gespielt" fuehrt nicht die Aufsteiger, absteigend nach Zuwachs');
        assert.deepEqual(zeilenUnter(html, 'Neue Archetypen'), ['Neu A']);
        assert.deepEqual(zeilenUnter(html, 'Verschwundene Archetypen'), ['Weg A']);
    });

    it('die Zahlen der Tabellen kommen aus den Zeilen — mit deutschem Komma', () => {
        const { html } = lauf(mitVorzeitraum);
        const neu = html.slice(html.indexOf('>Neue Archetypen</h2>'),
                               html.indexOf('>Verschwundene Archetypen</h2>'));
        assert.ok(neu.includes('>6<'), 'die Listenzahl 6 von "Neu A" fehlt:\n' + neu);
        assert.ok(neu.includes('12,00 %'), 'der Meta-Anteil steht nicht mit Komma da:\n' + neu);
        assert.ok(neu.includes('9,25'), 'die Ø-Platzierung fehlt:\n' + neu);
        assert.ok(neu.includes('>3<'), 'der beste Platz fehlt:\n' + neu);
    });

    it('englisch bleibt englisch — Titel und Zahlen', () => {
        const { html } = lauf(mitVorzeitraum, 'en');
        const titel = ueberschriften(html);
        ['Popularity Increases', 'New Archetypes', 'Disappeared Archetypes'].forEach(x => {
            assert.ok(titel.includes(x), 'englischer Titel fehlt: ' + x
                + '\ngerendert wurde: ' + JSON.stringify(titel));
        });
        const neu = html.slice(html.indexOf('>New Archetypes</h2>'));
        assert.ok(neu.includes('12.00 %'), 'im Englischen steht ein Dezimalkomma:\n'
            + neu.slice(0, 900));
    });

    it('OHNE Vorzeitraum steht "Neue Archetypen" bewusst nicht da — und die Seite sagt warum', () => {
        const { html } = lauf(ohneVorzeitraum);
        assert.equal(ueberschriften(html).includes('Neue Archetypen'), false,
            'ohne zweite Messung waere "neu" eine erfundene Rubrik');
        assert.ok(html.includes('Eine Tabelle „Neue Archetypen“ steht hier bewusst nicht'),
            'der Grund fehlt im Leerzustandstext');
        assert.ok(html.includes('„Neue Archetypen“ (2)'),
            'die Zahl der betroffenen Archetypen fehlt');
    });

    it('gibt es die Tabelle, meldet der Leerzustandstext sie NICHT mehr als ungezeigt', () => {
        const { html } = lauf(mitVorzeitraum);
        assert.equal(html.includes('Ohne eigene Tabelle, obwohl Daten vorliegen'), false,
            'der Hinweis nennt Rubriken als ungezeigt, die jetzt eine Tabelle haben:\n'
            + html.slice(html.indexOf('city-league-info-combined-explanation'), 1200));
    });

    it('Ueberschrift und Hinweistext benutzen denselben Namen', () => {
        const k = nurFunktionen('de');
        const namen = k.cityLeagueRubrikNamen(true);
        ['haeufiger', 'neuTabelle', 'verschwunden'].forEach(schluessel => {
            assert.equal(namen.zitiert[schluessel], '„' + namen.roh[schluessel] + '“',
                'zitierter und roher Name laufen auseinander: ' + schluessel);
        });
        const { html } = lauf(ohneVorzeitraum);
        // Der Hinweis zitiert genau die Ueberschrift, die es sonst gaebe.
        assert.ok(html.includes(namen.zitiert.neuTabelle), html.slice(0, 200));
    });

    it('leere Rubriken erzeugen keine leeren Tabellen', () => {
        const { html } = lauf([vgl({ archetype: 'Allein', old_count: '5', new_count: '5' })]);
        const titel = ueberschriften(html);
        ['Häufiger gespielt', 'Neue Archetypen', 'Verschwundene Archetypen'].forEach(x => {
            assert.equal(titel.includes(x), false, 'leere Tabelle gerendert: ' + x);
        });
    });
});
