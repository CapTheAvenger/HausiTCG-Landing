/**
 * Die Abzeichen auf den Kartenkacheln haben ein groesseres Tippziel als
 * ihre sichtbare Flaeche
 * =====================================================================
 *
 * BEFUND (10.09.2026, live an thedipidis.app nachgemessen, Reiter
 * Karten): 463 von 483 klickbaren Flaechen sind kleiner als 44x44 px.
 * Die kleinsten sind die vier Abzeichen je Kartenkachel:
 *
 *     btn-green / btn-red / btn-wishlist / btn-tradelist
 *     je 26 x 26 px, 3 px Abstand, Kachelbreite 134 px
 *
 * WARUM SIE NICHT EINFACH GROESSER WERDEN. Die Rechnung steht seit
 * laengerem im Stylesheet und stimmt weiter: vier Knoepfe zu 44 px plus
 * drei Luecken zu 3 px brauchen 185 px, das Kartenbild ist bei 390 px
 * Bildschirmbreite 173,5 px breit. Sichtbar passt 44x44 px hier nicht.
 *
 * WAS DIESER TEST FESTHAELT — und was ausdruecklich NICHT:
 *
 *   FESTGEHALTEN: das Tippziel ist ueber ein ::after vergroessert, es
 *   traegt keine eigene Farbe, und es UEBERLAPPT DIE NACHBARN NICHT.
 *   Ueberlappende Ziele sind schlimmer als kleine: dann trifft der
 *   Finger den falschen Knopf.
 *
 *   NICHT FESTGEHALTEN: dass 44x44 px erreicht sind. Sind sie nicht.
 *   Waagerecht sind es 29 px, weil die Nachbarn 3 px entfernt stehen
 *   und die Erweiterung nur bis zur Mitte der Luecke gehen darf. Wer
 *   die empfohlene Mindestgroesse will, muss die Leiste umbauen — das
 *   ist eine Gestaltungsfrage, keine CSS-Regel.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..', '..');
const CSS = fs.readFileSync(path.join(WURZEL, 'css', 'cards-tabs.css'), 'utf8');

/** Der Regelblock zu einem Selektor, roh. */
function block(selektor) {
    const i = CSS.indexOf(selektor);
    if (i < 0) return null;
    const auf = CSS.indexOf('{', i);
    const zu = CSS.indexOf('}', auf);
    if (auf < 0 || zu < 0) return null;
    return CSS.slice(auf + 1, zu);
}

/** Ein px-Wert aus einer Eigenschaft, Vorzeichen inklusive. */
function px(regelText, eigenschaft) {
    const m = new RegExp(eigenschaft + '\\s*:\\s*(-?[\\d.]+)px').exec(regelText || '');
    return m ? parseFloat(m[1]) : null;
}

const BADGE = '#cards .card-database-top-actions .card-badge {';
const ZIEL = '#cards .card-database-top-actions .card-badge::after';

describe('Die Abzeichen bleiben sichtbar klein', () => {
    it('26 x 26 px, wie berechnet — daran wird nichts still gedreht', () => {
        const b = block(BADGE);
        assert.ok(b, 'Der Regelblock der Abzeichen ist weg');
        assert.equal(px(b, 'width'), 26);
        assert.equal(px(b, 'height'), 26);
    });

    it('sie sind ein Bezugsrahmen — sonst haengt das Ziel woanders', () => {
        const b = block(BADGE);
        assert.match(b, /position:\s*relative/,
            'Ohne `position: relative` bezieht sich das absolut gesetzte '
            + '::after auf einen Vorfahren und liegt irgendwo.');
    });
});

describe('Das Tippziel ist groesser als der Knopf', () => {
    it('es gibt ueberhaupt eines', () => {
        assert.ok(block(ZIEL), 'Kein ::after — das Tippziel ist wieder 26 x 26 px.');
    });

    it('es ragt oben und unten hinaus', () => {
        const z = block(ZIEL);
        assert.ok(px(z, 'top') < 0 && px(z, 'bottom') < 0,
            'Das Ziel ragt senkrecht nicht hinaus.');
    });

    it('senkrecht kommt es auf 44 px', () => {
        const z = block(ZIEL);
        const hoehe = 26 + Math.abs(px(z, 'top')) + Math.abs(px(z, 'bottom'));
        assert.equal(hoehe, 44,
            `Senkrecht sind es ${hoehe} px statt 44. Ueber und unter der `
            + 'Leiste liegt das Kartenbild, dort ist der Platz vorhanden.');
    });

    it('waagerecht bleibt es INNERHALB der Luecke — kein Nachbar wird ueberdeckt', () => {
        const z = block(ZIEL);
        const LUECKE = 3;                    // gemessen: gap: 3px
        const jeSeite = Math.abs(px(z, 'left'));
        assert.equal(jeSeite, Math.abs(px(z, 'right')),
            'links und rechts unterschiedlich weit — dann sitzt das Ziel schief');
        assert.ok(jeSeite <= LUECKE / 2,
            `${jeSeite} px je Seite bei ${LUECKE} px Luecke: die Ziele zweier `
            + 'Nachbarn ueberlappen sich. Dann trifft der Finger den FALSCHEN '
            + 'Knopf — schlimmer als ein kleines Ziel.');
        assert.ok(jeSeite > 0, 'Waagerecht wird gar nicht erweitert.');
    });

    it('es ist unsichtbar — es soll den Knopf nicht veraendern', () => {
        const z = block(ZIEL);
        assert.ok(!/background(-color)?\s*:/.test(z),
            'Das Ziel traegt eine Fuellung und waere sichtbar.');
        assert.ok(!/\bborder\s*:/.test(z),
            'Das Ziel traegt einen Rand und waere sichtbar.');
    });
});

describe('Was hier NICHT behauptet wird', () => {
    it('der Kommentar sagt ausdruecklich, dass 44 x 44 px nicht erreicht sind', () => {
        assert.match(CSS, /NICHT die empfohlene Mindestgroesse/,
            'Ohne diesen Satz liest sich die Regel wie eine geloeste '
            + 'Aufgabe. Sie ist eine Verbesserung, keine Loesung.');
    });

    it('und er nennt die Rechnung, an der es scheitert', () => {
        assert.match(CSS, /4\*44 \+ 3\*3 = 185/,
            'Die Rechnung fehlt. Ohne sie wirkt die Beschraenkung wie eine '
            + 'Meinung statt wie eine gemessene Grenze.');
    });
});
