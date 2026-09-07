/**
 * BEFUND A-F2.7 (Reiter "City League", Tier-Liste, gemessen 07.09.2026):
 *
 *   Ueber Tier 1 steht "Die 3 meistgespielten". Darunter standen die
 *   Kacheln mit 3, dann 5, dann 6 Listen — also aufsteigend nach
 *   Listenzahl. Ueber Tier 2 und 3 steht "Raenge 4-10 / 11-20 nach
 *   Listenzahl", und auch dort ist die Reihenfolge eine andere.
 *
 * IM QUELLTEXT NACHVERFOLGT: js/app-tier-meta.js teilt die Stufen als
 * reinen Indexschnitt auf einer nach Listenzahl absteigend sortierten
 * Liste ein — die AUSWAHL passt zur Beschriftung. Danach sortierte
 * derselbe Block INNERHALB der Stufen nach parseDeckRank, also nach
 * Ø-Platzierung. Die Reihenfolge, die der Leser sieht, hatte damit
 * nichts mehr mit dem zu tun, was die Ueberschrift verspricht.
 *
 * Die Untertitel stehen in js/i18n.js ('tier.clSub1' bis 'clSub3') und
 * sind fuer diesen Arbeitsbereich gesperrt. Sie sind aber auch sachlich
 * richtig — sie beschreiben genau den Indexschnitt, der oben passiert.
 * Also wurde die Sortierung an die Beschriftung angeglichen, nicht
 * umgekehrt.
 *
 * Diese Datei fuehrt den ECHTEN Block aus der Datei aus (siehe
 * tests/unit/lib-tier-sandkasten.js). Sie liest keine Live-Daten.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cityLeagueStufen } = require('./lib-tier-sandkasten.js');

const WURZEL = path.join(__dirname, '..', '..');
const I18N = fs.readFileSync(path.join(WURZEL, 'js', 'i18n.js'), 'utf8');

/** Ein Archetyp, wie die City-League-CSV ihn liefert (deutsches Komma). */
function deck(name, listen, platzierung) {
    return {
        archetype: name,
        count: String(listen),
        new_count: String(listen),
        average_placement: String(platzierung).replace('.', ',')
    };
}

/**
 * 25 Archetypen. Listenzahl faellt streng, die Ø-Platzierung laeuft
 * ABSICHTLICH gegenlaeufig: wer am seltensten gespielt wird, hat hier
 * die beste Platzierung. Genau dieses Muster hat der Befund gemeldet.
 */
const FELD = Array.from({ length: 25 }, (_, i) =>
    deck('Deck-' + String(i + 1).padStart(2, '0'), 100 - i * 4, (1 + (24 - i) * 0.3).toFixed(2)));

const listen = (d) => parseInt(d.count, 10);

describe('Tier-Sortierung folgt der Beschriftung (A-F2.7)', () => {
    const stufen = cityLeagueStufen(FELD);

    it('Vorbedingung: der Indexschnitt liefert die erwarteten Stufengroessen', () => {
        assert.equal(stufen['tier-1'].length, 3, 'Tier 1 = Raenge 1-3');
        assert.equal(stufen['tier-2'].length, 7, 'Tier 2 = Raenge 4-10');
        assert.equal(stufen['tier-3'].length, 10, 'Tier 3 = Raenge 11-20');
        assert.equal(stufen['tier-trending'].length, 5, 'der Rest');
    });

    it('Tier 1 sind wirklich die drei meistgespielten — auch in dieser Reihenfolge', () => {
        const zahlen = stufen['tier-1'].map(listen);
        assert.deepEqual(zahlen, [100, 96, 92],
            'Ueber der Stufe steht "Die 3 meistgespielten". Steht darunter 92, 96, 100, '
            + 'behauptet die Ueberschrift eine Ordnung, die die Kacheln nicht zeigen.');
    });

    it('Tier 2 und Tier 3 stehen absteigend nach Listenzahl', () => {
        ['tier-2', 'tier-3'].forEach(stufe => {
            const zahlen = stufen[stufe].map(listen);
            const sortiert = [...zahlen].sort((a, b) => b - a);
            assert.deepEqual(zahlen, sortiert,
                stufe + ': die Untertitel sagen "nach Listenzahl"');
        });
    });

    it('der Rogue-Block bleibt absteigend nach Listenzahl', () => {
        const zahlen = stufen['tier-trending'].map(listen);
        assert.deepEqual(zahlen, [...zahlen].sort((a, b) => b - a));
    });

    it('keine Stufe faengt hoeher an als die vorige aufhoert', () => {
        const folge = ['tier-1', 'tier-2', 'tier-3', 'tier-trending']
            .flatMap(k => stufen[k].map(listen));
        assert.deepEqual(folge, [...folge].sort((a, b) => b - a),
            'ueber alle vier Stufen hinweg ist das eine einzige Rangliste nach Listenzahl');
    });

    it('bei gleicher Listenzahl entscheidet die bessere Ø-Platzierung', () => {
        const gleich = [
            deck('Gleich-A', 50, '9,00'),
            deck('Gleich-B', 50, '4,00'),
            deck('Gleich-C', 50, '6,00')
        ];
        const s = cityLeagueStufen(gleich);
        assert.deepEqual(s['tier-1'].map(d => d.archetype),
            ['Gleich-B', 'Gleich-C', 'Gleich-A'],
            'die Listenzahl ordnet zuerst; sind sie gleich, ist die Platzierung der Stichentscheid');
    });

    it('die Untertitel in js/i18n.js sagen weiterhin "Listenzahl" — sonst passt die Sortierung nicht mehr', () => {
        // js/i18n.js ist fuer diesen Arbeitsbereich gesperrt. Aendert sie
        // jemand, muss die Sortierung oben mitwandern; dieser Test sagt es.
        assert.match(I18N, /'tier\.clSub1':\s*'Die 3 meistgespielten'/);
        assert.match(I18N, /'tier\.clSub2':\s*'Ränge 4–10 nach Listenzahl'/);
        assert.match(I18N, /'tier\.clSub3':\s*'Ränge 11–20 nach Listenzahl'/);
    });
});
