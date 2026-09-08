/**
 * B5 — Die Legende der Plaketten stand nur ueber einem von drei Gittern.
 *
 * GEMESSEN am 07.09.2026 im Markup: `<details class="ds-legend">` kam
 * genau EINMAL vor, im Reiter `current-analysis`, direkt ueber
 * #currentMetaDeckGrid. #cityLeagueDeckGrid und #pastMetaDeckGrid
 * zeichnen dieselben Plaketten ohne jede Erklaerung.
 *
 * ES IST MARKUP, KEIN js: die Zeichenkette "ds-legend" kommt in keiner
 * js-Datei vor (die erste Zusicherung unten misst das). Die Legende
 * wird also nicht gerendert, sondern steht da — die Ergaenzung gehoert
 * damit ins Markup.
 *
 * ABER NICHT WORTGLEICH. Gemessen an den drei Zeichnern:
 *
 *   js/app-city-league.js          kein city-league-card-pin-btn,
 *                                  kein -exclude-btn. Der Quelltext sagt
 *                                  es dort selbst: "Pin functionality
 *                                  intentionally omitted in City League's
 *                                  card overview".
 *   js/app-past-meta.js            Pin ja, Exclude nein.
 *   js/app-current-meta-analysis.js beides.
 *
 * Die Plakette K erklaert "📌 Pin / 🚫 Exclude, nur im Cooking Mode".
 * An den beiden anderen Gittern waere das eine Erklaerung fuer Knoepfe,
 * die es dort nicht gibt — deshalb steht K nur ueber dem Gitter, das
 * sie zeichnet.
 *
 * WIE HIER GEPRUEFT WIRD
 * ----------------------
 * Nichts davon ist abgeschrieben. Die Gitter kommen aus den
 * `gitterId:`-Angaben der Zeichner, die Zuordnung Plakette -> Klasse aus
 * der Legende selbst (jede Marke traegt ihre Klasse und ihren
 * Schluessel), und ob eine Klasse an einem Gitter vorkommt, wird im
 * Quelltext des zugehoerigen Zeichners nachgesehen.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const MARKUP = lies('index.html');
/* Kennungen werden OHNE Kommentare gezaehlt: in index.html steht in
   mehreren Erklaerungen eine Kennung als Zitat (`id="menu-btn-…"`), und
   eine gezaehlte Kennung aus einem Kommentar waere ein erfundener
   Doppelgaenger. Gemessen am 07.09.2026: die Doppel-Pruefung schlug bei
   Mutation M4 aus genau diesem Grund an, nicht wegen des Markups. */
const OHNE_KOMMENTARE = MARKUP.replace(/<!--[\s\S]*?-->/g, '');

const ZEICHNER = [
    'js/app-city-league.js',
    'js/app-current-meta-analysis.js',
    'js/app-past-meta.js'
];

/** Kennung des Kartengitters -> Zeichnerdatei, aus den Zeichnern gelesen. */
function gitterZuZeichner() {
    const zuordnung = new Map();
    for (const datei of ZEICHNER) {
        for (const m of lies(datei).matchAll(/gitterId:\s*'([A-Za-z]+)'/g)) {
            assert.ok(!zuordnung.has(m[1]),
                `#${m[1]} wird von zwei Dateien beansprucht.`);
            zuordnung.set(m[1], datei);
        }
    }
    assert.equal(zuordnung.size, 3,
        'Erwartet werden drei Kartengitter (gitterId in ' + ZEICHNER.join(', ')
        + ') — gefunden: ' + [...zuordnung.keys()].join(', '));
    return zuordnung;
}

/** Anfangspositionen aller Legendenbloecke. */
function legendenStellen() {
    return [...MARKUP.matchAll(/<details class="ds-legend">/g)].map(m => m.index);
}

function legendenBlock(pos) {
    return MARKUP.slice(pos, MARKUP.indexOf('</details>', pos));
}

/** Der Reiter (tab-content), in dem eine Stelle liegt. */
function reiterAn(pos) {
    let treffer = null;
    for (const m of MARKUP.matchAll(/<div id="([a-z-]+)" class="tab-content/g)) {
        if (m.index <= pos) treffer = m[1]; else break;
    }
    return treffer;
}

/**
 * Aus einem Legendenblock: Schluessel -> die Klasse, an der die Marke
 * auf der Musterkarte haengt. Die Traegerklassen der Legende selbst
 * (meta-hub-legend-*) und die reinen Sammelklassen fallen weg — uebrig
 * bleibt die Klasse, die das Gitter wirklich zeichnen muss.
 */
const SAMMELKLASSEN = new Set([
    'city-league-card-badge', 'city-league-card-action-btn', 'card-item',
    'city-league-card-item'
]);
function klasseJeSchluessel(block) {
    const zuordnung = new Map();
    for (const m of block.matchAll(/<\w+[^>]*class="([^"]*)"[^>]*data-legend-key="([A-K])"/g)) {
        const k = m[1].split(/\s+/).filter(
            c => c && !c.startsWith('meta-hub-legend') && !SAMMELKLASSEN.has(c));
        assert.equal(k.length, 1,
            `Plakette ${m[2]}: erwartet genau eine kennzeichnende Klasse, gefunden `
            + JSON.stringify(k));
        zuordnung.set(m[2], k[0]);
    }
    return zuordnung;
}

/** Die Schluessel, die die Erklaerliste (das <dl>) eines Blocks auffuehrt. */
function schluesselDerListe(block) {
    return [...block.matchAll(
        /<span class="meta-hub-legend-key[^"]*">([A-Z])<\/span>/g)].map(m => m[1]);
}

/**
 * Zeichnet dieser Zeichner die Klasse? Entweder steht sie in seiner
 * eigenen Datei — oder sie kommt aus einem gemeinsamen Helfer, dann
 * muss der Zeichner den Namen der Funktion nennen, in deren Rumpf die
 * Klasse woanders steht. (So wird die Wunschlisten-Plakette gezeichnet:
 * getWishlistBadgeHtml() in js/firebase-collection.js.)
 */
function zeichnetKlasse(zeichnerDatei, klasse) {
    const eigen = lies(zeichnerDatei);
    if (eigen.includes(klasse)) return { ja: true, weg: 'direkt' };
    for (const datei of fs.readdirSync(path.join(WURZEL, 'js'))
        .filter(f => f.endsWith('.js')).map(f => 'js/' + f)) {
        if (datei === zeichnerDatei) continue;
        const src = lies(datei);
        let pos = src.indexOf(klasse);
        while (pos >= 0) {
            const fn = [...src.slice(0, pos).matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].pop();
            if (fn && eigen.includes(fn[1] + '(')) {
                return { ja: true, weg: `${fn[1]}() aus ${datei}` };
            }
            pos = src.indexOf(klasse, pos + 1);
        }
    }
    return { ja: false, weg: null };
}

describe('B5 — Plaketten-Legende an allen drei Kartengittern', () => {

    it('die Legende ist Markup, kein js', () => {
        for (const f of fs.readdirSync(path.join(WURZEL, 'js')).filter(f => f.endsWith('.js'))) {
            assert.ok(!lies('js/' + f).includes('ds-legend'),
                `js/${f} erzeugt die Legende selbst — dann ist die Ergaenzung im `
                + 'Markup die falsche Stelle und diese Pruefung die falsche Pruefung.');
        }
    });

    it('vor jedem Kartengitter steht genau eine Legende im selben Reiter', () => {
        const stellen = legendenStellen();
        const gitter = gitterZuZeichner();
        assert.equal(stellen.length, gitter.size,
            `${stellen.length} Legenden bei ${gitter.size} Gittern.`);
        for (const id of gitter.keys()) {
            const pos = MARKUP.indexOf(`id="${id}"`);
            assert.ok(pos > 0, `#${id} steht nicht im Markup.`);
            const reiter = reiterAn(pos);
            const davor = stellen.filter(p => p < pos && reiterAn(p) === reiter);
            assert.equal(davor.length, 1,
                `Vor #${id} (Reiter ${reiter}) stehen ${davor.length} Legenden, `
                + 'erwartet wird genau eine. Ohne sie zeigt das Gitter dieselben '
                + 'Plaketten wie die anderen, nur ohne Erklaerung.');
        }
    });

    it('Erklaerliste und Musterkarte nennen dieselben Plaketten', () => {
        /* MUTATION M11 (07.09.2026) ist ohne diese Zusicherung durchgekommen:
           ein zusaetzlicher Eintrag "K" in der Erklaerliste der City-League-
           Legende, ohne Marke auf der Musterkarte. Die Pruefung darunter liest
           die Plaketten von der MUSTERKARTE — ein Listeneintrag ohne Marke war
           fuer sie unsichtbar. Ein Eintrag ohne Marke erklaert aber etwas,
           das der Leser auf der Karte daneben nicht wiederfindet. */
        for (const pos of legendenStellen()) {
            const block = legendenBlock(pos);
            const aufKarte = [...klasseJeSchluessel(block).keys()].sort();
            const inListe = schluesselDerListe(block).sort();
            assert.deepEqual(inListe, aufKarte,
                'Erklaerliste und Musterkarte nennen verschiedene Plaketten — '
                + `Liste: ${inListe.join('')}, Karte: ${aufKarte.join('')}.`);
            assert.equal(new Set(inListe).size, inListe.length,
                'Ein Schluessel steht zweimal in derselben Erklaerliste: ' + inListe.join(''));
        }
    });

    it('jede Legende erklaert nur Plaketten, die ihr Gitter auch zeichnet', () => {
        const gitter = gitterZuZeichner();
        for (const [id, zeichner] of gitter) {
            const pos = MARKUP.indexOf(`id="${id}"`);
            const reiter = reiterAn(pos);
            const legende = legendenStellen().filter(p => p < pos && reiterAn(p) === reiter).pop();
            const klassen = klasseJeSchluessel(legendenBlock(legende));
            assert.ok(klassen.size >= 8,
                `Legende vor #${id} markiert nur ${klassen.size} Plaketten.`);
            for (const [schluessel, klasse] of klassen) {
                const befund = zeichnetKlasse(zeichner, klasse);
                assert.ok(befund.ja,
                    `Die Legende vor #${id} erklaert Plakette ${schluessel} `
                    + `(.${klasse}), aber ${zeichner} zeichnet sie nicht — weder `
                    + 'selbst noch ueber einen Helfer, den es aufruft.');
            }
        }
    });

    it('umgekehrt: was ein Gitter zeichnet und eine andere Legende erklaert, fehlt nicht ohne Grund', () => {
        /* Die Gegenrichtung, damit die Pruefung oben nicht dadurch gruen
           bleibt, dass jemand alle Plaketten herausnimmt: jede Plakette,
           die IRGENDEINE Legende erklaert, muss ueberall dort erklaert
           sein, wo das Gitter sie auch zeichnet. */
        const gitter = gitterZuZeichner();
        const alleSchluessel = new Map();
        for (const p of legendenStellen()) {
            for (const [k, c] of klasseJeSchluessel(legendenBlock(p))) alleSchluessel.set(k, c);
        }
        assert.ok(alleSchluessel.size >= 10,
            `Nur ${alleSchluessel.size} verschiedene Plaketten in allen Legenden.`);
        const luecken = [];
        for (const [id, zeichner] of gitter) {
            const pos = MARKUP.indexOf(`id="${id}"`);
            const reiter = reiterAn(pos);
            const legende = legendenStellen().filter(p => p < pos && reiterAn(p) === reiter).pop();
            const erklaert = klasseJeSchluessel(legendenBlock(legende));
            for (const [k, klasse] of alleSchluessel) {
                if (erklaert.has(k)) continue;
                if (zeichnetKlasse(zeichner, klasse).ja) {
                    luecken.push(`#${id} zeichnet .${klasse} (Plakette ${k}), erklaert sie aber nicht`);
                }
            }
        }
        assert.deepEqual(luecken, []);
    });

    it('keine Kennung kommt im Dokument zweimal vor', () => {
        /* Die Legende steht dreimal da; ihre Ueberschrift traegt ein
           aria-labelledby. Zwei gleiche Kennungen liessen zwei der drei
           auf dieselbe Ueberschrift zeigen. */
        const zaehler = new Map();
        for (const m of OHNE_KOMMENTARE.matchAll(/[^-a-zA-Z]id="([^"]+)"/g)) {
            zaehler.set(m[1], (zaehler.get(m[1]) || 0) + 1);
        }
        assert.deepEqual(
            [...zaehler].filter(([, n]) => n > 1).map(([id, n]) => `${id} (${n}x)`), []);
    });

    it('jedes aria-labelledby zeigt auf eine Kennung, die es gibt', () => {
        const kennungen = new Set(
            [...OHNE_KOMMENTARE.matchAll(/[^-a-zA-Z]id="([^"]+)"/g)].map(m => m[1]));
        const tot = [...OHNE_KOMMENTARE.matchAll(/aria-labelledby="([^"]+)"/g)]
            .flatMap(m => m[1].split(/\s+/))
            .filter(z => !kennungen.has(z));
        assert.deepEqual([...new Set(tot)], []);
    });
});
