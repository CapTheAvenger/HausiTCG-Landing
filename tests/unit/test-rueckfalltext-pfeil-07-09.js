/**
 * B2 — "Deck ? Proxy": im sichtbaren Rueckfalltext war ein Pfeil
 *      verlorengegangen.
 *
 * GEMESSEN am 07.09.2026 im Quelltext von index.html (Zeilen 858, 1603,
 * 2022): drei Knoepfe, die den Deckinhalt an den Proxy-Drucker geben,
 * trugen als Beschriftung die Zeichenfolge "Deck ? Proxy". In
 * js/i18n.js steht unter demselben Schluessel 'btn.deckToProxy' der
 * Text "Deck → Proxy" — der Pfeil ist also nicht gemeint gewesen als
 * Fragezeichen, er ist unterwegs verlorengegangen.
 *
 * WAS MAN DAVON SIEHT: data-i18n ueberschreibt den Text beim ersten
 * i18n-Lauf. Sichtbar ist der Rueckfall nur davor — also im ersten
 * Bild nach dem Laden, und dauerhaft, wenn js/i18n.js nicht laedt.
 * Wie lange dieses Fenster dauert, ist hier NICHT GEPRUEFT; gemessen
 * ist nur, was im Markup steht.
 *
 * WIE HIER GEPRUEFT WIRD
 * ----------------------
 * Der erwartete Text wird NICHT abgeschrieben, sondern aus js/i18n.js
 * unter dem Schluessel gelesen, den das Markup selbst nennt. Und
 * zusaetzlich sucht die zweite Pruefung die GATTUNG des Fehlers im
 * ganzen sichtbaren Text: ein alleinstehendes "?" zwischen zwei
 * Woertern ist im Deutschen wie im Englischen kein Satzzeichen,
 * sondern die Spur eines verlorenen Sonderzeichens.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const MARKUP = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const I18N = fs.readFileSync(path.join(WURZEL, 'js', 'i18n.js'), 'utf8');

/** Den ERSTEN (englischen) Wert eines i18n-Schluessels aus js/i18n.js lesen. */
function uebersetzung(schluessel) {
    const treffer = I18N.match(
        new RegExp("'" + schluessel.replace('.', '\\.') + "':\\s*'([^']*)'"));
    assert.ok(treffer, `js/i18n.js kennt den Schluessel '${schluessel}' nicht (mehr).`);
    return treffer[1];
}

/** Skript- und Stilbloecke raus — dort sind "? :" Ternaere, kein Text. */
function nurSichtbarerText(html) {
    return html
        .replace(/<script\b[\s\S]*?<\/script>/gi, '<script></script>')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '<style></style>')
        .replace(/<!--[\s\S]*?-->/g, '');
}

describe('B2 — verlorener Pfeil im sichtbaren Rueckfalltext', () => {

    it('die Proxy-Knoepfe tragen den Pfeil aus js/i18n.js', () => {
        const erwartet = uebersetzung('btn.deckToProxy');
        assert.ok(erwartet.includes('→'),
            'js/i18n.js fuehrt btn.deckToProxy ohne Pfeil — dann ist diese '
            + 'Pruefung ueberholt und muss neu gedacht werden, nicht angepasst.');

        const knoepfe = [...MARKUP.matchAll(
            /<button[^>]*sendCurrentDeckToProxyPrinter\('([a-zA-Z]+)'\)[^>]*>([^<]*)</g)];
        assert.equal(knoepfe.length, 3,
            'Erwartet werden die drei Deck-an-Proxy-Knoepfe (cityLeague, '
            + 'currentMeta, pastMeta); gefunden: ' + knoepfe.length);

        for (const [, quelle, text] of knoepfe) {
            assert.equal(text.trim(), erwartet,
                `Der Deck-an-Proxy-Knopf der Quelle "${quelle}" zeigt vor dem `
                + `ersten i18n-Lauf "${text.trim()}" statt "${erwartet}".`);
        }
    });

    it('kein alleinstehendes "?" zwischen zwei Woertern im sichtbaren Text', () => {
        const text = nurSichtbarerText(MARKUP);
        const verdaechtig = [];
        for (const m of text.matchAll(/>([^<>]{1,400})</g)) {
            if (/[0-9A-Za-zÀ-ɏ)\]] \? [0-9A-Za-zÀ-ɏ(\[]/.test(m[1])) {
                verdaechtig.push(m[1].trim());
            }
        }
        assert.deepEqual(verdaechtig, [],
            'Ein " ? " zwischen zwei Woertern ist die Spur eines verlorenen '
            + 'Sonderzeichens (Pfeil, Gedankenstrich, Symbol). Gefunden in: '
            + JSON.stringify(verdaechtig));
    });
});
