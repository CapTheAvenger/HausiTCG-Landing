/**
 * Die Namensbruecke zwischen Decklisten-Datei und labs.
 *
 * BEFUND (09.09.2026): `tournament_decklists_per_player.csv` und
 * `labs_tournament_decks.csv` fuehren zwei Vokabulare fuer dasselbe
 * Deck. Ein Join ueber `deck_slug` ist unmoeglich — die Decklisten-Datei
 * traegt dort eine Decklisten-ID (28752, …), die Schnittmenge mit den
 * labs-Slugs ist 0. Der Name ist der einzige Schluessel.
 *
 * Gemessen ueber alle 1.201 Listen: 1.159 fanden ihr labs-Gegenstueck,
 * 42 nicht — an genau drei Paaren:
 *     0069  'Hydrapple'    23 Listen -> 'Ogerpon Meganium Hydrapple'
 *     0071  'Ogerpon Box'  18 Listen -> 'Basic Box'
 *     0071  'Hydrapple'     1 Liste  -> 'Ogerpon Meganium Hydrapple'
 *
 * Die Folge war keine falsche Zahl, sondern eine fehlende: die Kachel
 * schrieb „18 Tag-2-Listen" statt „18 von 74 Piloten (Feld 797)".
 *
 * Geprueft wird an den ECHTEN Dateien: dass die Bruecke genau diese
 * Faelle deckt, dass sie belegt ist, und dass sie NICHT greift, wo der
 * Name selbst trifft — in TEF-CRI gibt es 'Hydrapple' in beiden Dateien
 * und meint dort dasselbe Deck.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ALIASES = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data', 'archetype_aliases.json'), 'utf8'));
const SRC = fs.readFileSync(
    path.join(ROOT, 'js', 'deck-builder-consistency.js'), 'utf8');

function csv(datei) {
    const text = fs.readFileSync(path.join(ROOT, 'data', datei), 'utf8');
    const zeilen = text.split('\n').filter(z => z.trim());
    const kopf = zeilen[0].split(',').map(s => s.trim().replace(/^﻿/, ''));
    return zeilen.slice(1).map(z => {
        // Zerleger MIT Anfuehrungszeichen. Ein blosses split(',') hat am
        // 09.09.2026 die Spalten verschoben: labs fuehrt in
        // `tournament_name` und `pokemon` Kommata in Anfuehrungszeichen,
        // und `player_count` landete dadurch im falschen Feld.
        const teile = [];
        let feld = '', inAnf = false;
        for (let i = 0; i < z.length; i++) {
            const c = z[i];
            if (c === '"') { inAnf = !inAnf; continue; }
            if (c === ',' && !inAnf) { teile.push(feld); feld = ''; continue; }
            feld += c;
        }
        teile.push(feld);
        const o = {};
        kopf.forEach((k, i) => { o[k] = (teile[i] || '').trim(); });
        return o;
    });
}

const norm = (s) => String(s || '').trim().toLowerCase();

describe('Namensbruecke Decklisten -> labs', () => {
    const bruecke = ALIASES.decklisten_zu_labs;

    it('die Bruecke existiert und ist belegt', () => {
        assert.ok(bruecke, 'decklisten_zu_labs fehlt in archetype_aliases.json');
        const paare = Object.entries(bruecke).filter(([k]) => !k.startsWith('_'));
        assert.ok(paare.length >= 2, `nur ${paare.length} Paare`);
        for (const [von, e] of paare) {
            assert.ok(e.labs, `${von} ohne labs-Ziel`);
            assert.ok(e.beleg && e.beleg.length > 40,
                `${von} ohne Beleg — eine Zuordnung ohne nachgerechnete `
                + 'Zahlen ist geraten');
            assert.match(e.beleg, /\d/, `${von}: der Beleg nennt keine Zahl`);
        }
    });

    it('jedes Ziel steht wirklich in den labs-Daten', () => {
        const labs = csv('labs_tournament_decks.csv');
        const namen = new Set(labs.map(r => norm(r.deck_name)));
        for (const [von, e] of Object.entries(bruecke)) {
            if (von.startsWith('_')) continue;
            assert.ok(namen.has(norm(e.labs)),
                `${von} -> ${e.labs}: dieses Deck gibt es in labs nicht`);
        }
    });

    it('die drei gemessenen Paare treffen nur ueber die Bruecke', () => {
        // Gezielt die drei Faelle, nicht die Gesamtquote: die haengt an
        // der Turnier-Bruecke ueber tournament_cards_data_overview.csv
        // (NAIC traegt keine tournament_id), und die hier nachzubauen
        // hiesse, den Produktionscode ein zweites Mal zu schreiben.
        const labs = csv('labs_tournament_decks.csv');
        const piloten = new Map();
        for (const r of labs) {
            const k = String(r.tournament_id || '').trim() + '|' + norm(r.deck_name);
            const pc = parseInt(r.player_count || '0', 10) || 0;
            if (pc > 0 && !piloten.has(k)) piloten.set(k, pc);
        }
        const b = new Map(Object.entries(bruecke)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => [norm(k), norm(v.labs)]));

        for (const [tid, name, erwartet] of [
            ['0069', 'Hydrapple', 114],
            ['0071', 'Ogerpon Box', 74],
            ['0071', 'Hydrapple', 12],
        ]) {
            const a = norm(name);
            assert.equal(piloten.get(tid + '|' + a), undefined,
                `${tid}/${name}: trifft direkt — dann ist die Bruecke `
                + 'fuer diesen Fall ueberfluessig geworden');
            assert.ok(b.has(a), `${tid}/${name}: keine Bruecke hinterlegt`);
            assert.equal(piloten.get(tid + '|' + b.get(a)), erwartet,
                `${tid}/${name} -> ${b.get(a)}: erwartet ${erwartet} Piloten`);
        }
    });

    it('in TEF-CRI trifft Hydrapple direkt — die Bruecke darf da nicht ran', () => {
        const labs = csv('labs_tournament_decks.csv');
        const direkt = labs.filter(r => norm(r.deck_name) === 'hydrapple'
                                     && (r.meta || '').trim() === 'TEF-CRI');
        assert.ok(direkt.length > 0,
            'Testannahme veraltet: Hydrapple steht in TEF-CRI nicht mehr '
            + 'unter eigenem Namen in labs');
    });

    it('der Direkttreffer gewinnt immer', () => {
        // 'Hydrapple' existiert in TEF-CRI in BEIDEN Dateien. Griffe die
        // Bruecke dort, wuerde ein richtiger Treffer durch einen
        // fremden Namen ersetzt.
        const i = SRC.indexOf('let pc = (_archetypPiloten && a)');
        assert.ok(i > 0, 'die Nachschlagestelle sieht anders aus');
        const danach = SRC.slice(i, i + 420);
        assert.match(danach, /pc === undefined && _archetypBruecke/,
            'die Bruecke wird nicht nur bei fehlendem Direkttreffer benutzt');
    });

    it('die Bruecke wird wirklich geladen', () => {
        assert.match(SRC, /archetype_aliases\.json/,
            'die Aliasdatei wird nicht geladen');
        assert.match(SRC, /decklisten_zu_labs/,
            'der Block decklisten_zu_labs wird nicht gelesen');
        assert.match(SRC, /return \{ sizes, piloten, bruecke \}/,
            'die Bruecke verlaesst den Lader nicht');
    });
});
