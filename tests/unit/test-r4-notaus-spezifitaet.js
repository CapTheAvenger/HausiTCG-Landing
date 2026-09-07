/**
 * BEFUND B3, ZWEITE RUNDE (07.09.2026, Reiter "City League"):
 *
 *   Die Reparatur des ersten Durchgangs hat den NOTAUS kaputtgemacht.
 *
 *   Der Saisonpause-Hinweis wurde von einem Inline-Stil auf eine Klasse
 *   umgestellt, und die Regel dazu spielt js/app-city-league.js zur
 *   Laufzeit als <style id="cl-season-notice-regel"> ein:
 *
 *       .cl-season-notice.cl-season-notice--sichtbar{display:block !important}
 *
 *   Daneben steht die Versteckklasse des Projekts, css/ui-components.css:5372:
 *
 *       .d-none{display:none !important}
 *
 *   Beide tragen !important. Dann entscheidet die Spezifitaet, und die
 *   ist (0,2,0) gegen (0,1,0) — die eingespielte Regel gewinnt.
 *   `element.classList.add('d-none')` blendete den Hinweis also NICHT
 *   mehr aus. Ein Notaus, der nicht ausschaltet, ist schlimmer als
 *   keiner: er sieht im Quelltext nach Absicherung aus.
 *
 * WAS DIESER TEST TUT
 *
 *   Er rechnet die KASKADE aus echten Dateien: css/ui-components.css und
 *   css/city-league.css in dem Ladeplatz, den index.html ihnen gibt, plus
 *   die Regel, die js/app-city-league.js wirklich einspielt (ausgefuehrt,
 *   nicht abgeschrieben). Gefragt wird, welcher `display`-Wert am Ende
 *   fuer ein Element mit den jeweiligen Klassen gilt.
 *
 *   Die entscheidende Zusicherung: mit `d-none` muss `none` gewinnen —
 *   und zwar aus css/ui-components.css, nicht aus irgendeiner Regel.
 *
 * KEIN jsdom, KEINE Daten aus data/.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { dokument, Knoten, WURZEL } = require('./lib-dom-sandkasten.js');
const { stilblatt, regelnAusText, gewinner, spezifitaet } = require('./lib-css-kaskade.js');

const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-city-league.js'), 'utf8');

/** Von der ersten Marke bis zum Ende des Blocks, der bei der zweiten beginnt. */
function schnitt(von, bis) {
    const a = QUELLE.indexOf(von);
    assert.notEqual(a, -1, 'Anfangsmarke nicht gefunden: ' + von);
    const b = QUELLE.indexOf(bis, a);
    assert.notEqual(b, -1, 'Endmarke nicht gefunden: ' + bis);
    let tiefe = 0;
    for (let i = QUELLE.indexOf('{', b); i < QUELLE.length; i++) {
        if (QUELLE[i] === '{') tiefe++;
        else if (QUELLE[i] === '}') { tiefe--; if (tiefe === 0) return QUELLE.slice(a, i + 1); }
    }
    throw new Error('die Klammern gehen nicht auf ab: ' + bis);
}

/** Der Schalter samt seiner Regel, ausgefuehrt in einem Mini-Dokument. */
function aufbau() {
    const dok = dokument();
    dok.head = Knoten('head', dok);
    dok.documentElement.appendChild(dok.head);

    const hinweis = dok.neu('div');
    hinweis.className = 'cl-season-notice';

    const kasten = { document: dok, console: { warn() {}, info() {} } };
    kasten.globalThis = kasten;
    vm.createContext(kasten);
    vm.runInContext(
        schnitt('const CL_SAISON_KLASSE', 'function setCitySeasonNotice(show)')
        + '\n;globalThis.setCitySeasonNotice = setCitySeasonNotice;'
        + '\n;globalThis.CL_SAISON_KLASSE = CL_SAISON_KLASSE;', kasten);
    return { dok, hinweis, kasten };
}

/**
 * Alle Regeln, die auf den Hinweis wirken: die beiden echten Stilblaetter
 * und das zur Laufzeit angehaengte <style>. Das <style> steht spaeter im
 * Dokument als jedes <link>, deshalb der hohe Ladeplatz.
 */
function regelwerk(dok) {
    const alle = stilblatt(['css/ui-components.css', 'css/city-league.css']);
    const stil = dok.getElementById('cl-season-notice-regel');
    assert.notEqual(stil, null, 'die Regel wurde gar nicht eingespielt');
    alle.push(...regelnAusText(stil.textContent, '<style> aus js/app-city-league.js', 9999));
    return alle;
}

/** Was gilt am Ende fuer `display`? Reihenfolge wie im Browser. */
function display(el, alle) {
    const g = gewinner(alle, { klassen: [...el._klassenMenge], tag: 'div' }, 'display');
    const inline = el.style.display;
    if (g.wert && g.wichtig) return g;
    if (inline) return { wert: inline, datei: 'inline', sel: null, wichtig: false };
    return g;
}

describe('B3/2 — der Notaus `.d-none` blendet den Saisonhinweis wieder aus', () => {

    it('Ausgangslage: beide Regeln gibt es wirklich, und beide sind !important', () => {
        const alle = stilblatt(['css/ui-components.css', 'css/city-league.css']);
        const versteckt = gewinner(alle, { klassen: ['d-none'], tag: 'div' }, 'display');
        assert.equal(versteckt.wert, 'none', '.d-none blendet nicht mehr aus');
        assert.equal(versteckt.wichtig, true, '.d-none ohne !important — dann ist der Befund ein anderer');
        assert.equal(versteckt.datei, 'css/ui-components.css');

        const grund = gewinner(alle, { klassen: ['cl-season-notice'], tag: 'div' }, 'display');
        assert.equal(grund.wert, 'none', 'ohne Zutun war der Hinweis bisher unsichtbar');
    });

    it('DER FALL DES BEFUNDS: sichtbar geschaltet UND `d-none` gesetzt -> unsichtbar', () => {
        const { dok, hinweis, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        hinweis.classList.add('d-none');

        const alle = regelwerk(dok);
        const g = display(hinweis, alle);
        assert.equal(g.wert, 'none',
            'der Notaus wirkt nicht: `.d-none` verliert gegen die eingespielte Regel — genau B3/2');
        assert.equal(g.datei, 'css/ui-components.css',
            'der Gewinner kommt nicht aus der Versteckklasse, sondern aus ' + g.datei + ' (' + g.sel + ')');
    });

    it('ohne `d-none` bleibt der Hinweis sichtbar — die Reparatur nimmt ihm nichts', () => {
        const { dok, hinweis, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);

        const alle = regelwerk(dok);
        assert.equal(display(hinweis, alle).wert, 'block',
            'der Hinweis ist gar nicht mehr sichtbar zu bekommen');
    });

    it('`d-none` wieder abnehmen bringt ihn zurueck — der Notaus klemmt nicht', () => {
        const { dok, hinweis, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        hinweis.classList.add('d-none');
        hinweis.classList.remove('d-none');

        const alle = regelwerk(dok);
        assert.equal(display(hinweis, alle).wert, 'block');
    });

    it('der Inline-Stil verliert weiterhin — die Reparatur von B3/1 bleibt stehen', () => {
        const { dok, hinweis, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        hinweis.style.display = 'none';

        const alle = regelwerk(dok);
        assert.equal(display(hinweis, alle).wert, 'block',
            'ein fremder Inline-Stil entscheidet wieder ueber die Sichtbarkeit');
    });

    it('die eingespielte Regel nennt die Versteckklasse ausdruecklich als Ausnahme', () => {
        const { dok, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        const text = dok.getElementById('cl-season-notice-regel').textContent;
        assert.match(text, /:not\(\.d-none\)/,
            'ohne :not(.d-none) haengt der Notaus allein an der Spezifitaet — und die verliert');

        // Die Zahlen zum Befund, damit niemand raten muss, warum es ohne
        // die Ausnahme schiefgeht.
        assert.deepEqual(spezifitaet('.cl-season-notice.cl-season-notice--sichtbar'), [0, 2, 0]);
        assert.deepEqual(spezifitaet('.d-none'), [0, 1, 0]);
    });

    it('ausgeschaltet ist ausgeschaltet, mit und ohne Versteckklasse', () => {
        const { dok, hinweis, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        kasten.setCitySeasonNotice(false);
        let alle = regelwerk(dok);
        assert.equal(display(hinweis, alle).wert, 'none');

        hinweis.classList.add('d-none');
        alle = regelwerk(dok);
        assert.equal(display(hinweis, alle).wert, 'none');
    });
});
