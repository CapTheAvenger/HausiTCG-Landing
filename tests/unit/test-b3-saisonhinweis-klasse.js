/**
 * BEFUND B3 (07.09.2026, Reiter "City League"):
 *
 *   Der Saisonpause-Hinweis wurde ueber einen INLINE-Stil sichtbar
 *   gemacht (`el.style.display = 'block'`), gegen `display: none` aus
 *   css/city-league.css. Jede Stelle, die das style-Attribut
 *   zuruecksetzt, macht ihn damit wieder unsichtbar — lautlos. Der
 *   Vorgaenger dieses Fehlers ist am 30.08.2026 schon einmal
 *   aufgetreten (`el.style.display = ''` statt 'block'); die Bauart
 *   blieb dieselbe.
 *
 * WAS DIESER TEST TUT
 *
 *   Er rechnet die KASKADE aus, statt eine Zeichenkette zu suchen:
 *   die Regeln aus css/city-league.css (echte Datei, echter Ladeplatz
 *   aus index.html) plus die Regel, die js/app-city-league.js zur
 *   Laufzeit einspielt, plus der Inline-Stil des Elements. Gefragt
 *   wird, was am Ende gilt.
 *
 *   Der entscheidende Fall: erst anzeigen, dann das style-Attribut
 *   raeumen — so wie es ein Neuaufbau oder ein Aufraeumdurchlauf tut.
 *   Mit dem Inline-Stil als Traeger ist der Hinweis danach weg; mit
 *   der Klasse bleibt er stehen.
 *
 * KEIN jsdom (der Testschritt in deploy-pages.yml installiert nur
 * papaparse), keine Live-Daten aus data/.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { dokument, Knoten, WURZEL } = require('./lib-dom-sandkasten.js');
const { stilblatt, regelnAusText, gewinner } = require('./lib-css-kaskade.js');

const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-city-league.js'), 'utf8');
const MARKUP = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

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

    const hinweise = [dok.neu('div'), dok.neu('div')];
    hinweise.forEach(h => { h.className = 'cl-season-notice'; });

    const kasten = { document: dok, console: { warn() {}, info() {} } };
    kasten.globalThis = kasten;
    vm.createContext(kasten);
    vm.runInContext(
        schnitt('const CL_SAISON_KLASSE', 'function setCitySeasonNotice(show)')
        + '\n;globalThis.setCitySeasonNotice = setCitySeasonNotice;'
        + '\n;globalThis.CL_SAISON_KLASSE = CL_SAISON_KLASSE;'
        + '\n;globalThis.CL_SAISON_REGEL_ID = CL_SAISON_REGEL_ID;', kasten);
    return { dok, hinweise, kasten };
}

/** Alle Regeln, die auf den Hinweis wirken: aus css/ und aus dem <style>. */
function regelwerk(dok) {
    const alle = stilblatt(['css/city-league.css']);
    const stil = dok.getElementById('cl-season-notice-regel');
    if (stil) {
        // Ladeplatz hinter allen Stilblaettern: ein zur Laufzeit
        // angehaengtes <style> steht spaeter im Dokument als jedes <link>.
        alle.push(...regelnAusText(stil.textContent, '<style> aus js/app-city-league.js', 9999));
    }
    return alle;
}

/**
 * Was gilt am Ende fuer `display`?
 * Reihenfolge wie im Browser: !important aus dem Stilblatt schlaegt den
 * Inline-Stil, sonst schlaegt ein gesetzter Inline-Stil das Stilblatt.
 */
function display(el, alle) {
    const g = gewinner(alle, { klassen: [...el._klassenMenge], tag: 'div' }, 'display');
    const inline = el.style.display;
    if (g.wert && g.wichtig) return g.wert;
    if (inline) return inline;
    return g.wert || '';
}

describe('B3 — der Saisonpause-Hinweis haengt nicht mehr am Inline-Stil', () => {

    it('das Markup traegt den Hinweis, und css/ blendet ihn ohne Zutun aus', () => {
        const treffer = MARKUP.match(/class="cl-season-notice"/g) || [];
        assert.notEqual(treffer.length, 0, 'index.html fuehrt keinen .cl-season-notice mehr');

        const alle = stilblatt(['css/city-league.css']);
        const g = gewinner(alle, { klassen: ['cl-season-notice'], tag: 'div' }, 'display');
        assert.equal(g.wert, 'none',
            'ohne Zutun war der Hinweis bisher unsichtbar — das ist die Ausgangslage des Befunds');
    });

    it('anzeigen macht ihn sichtbar, ausblenden wieder unsichtbar', () => {
        const { dok, hinweise, kasten } = aufbau();

        kasten.setCitySeasonNotice(true);
        let alle = regelwerk(dok);
        hinweise.forEach((h, i) => {
            assert.notEqual(display(h, alle), 'none', 'Hinweis ' + i + ' bleibt versteckt');
        });

        kasten.setCitySeasonNotice(false);
        alle = regelwerk(dok);
        hinweise.forEach((h, i) => {
            assert.equal(display(h, alle), 'none', 'Hinweis ' + i + ' bleibt sichtbar');
        });
    });

    it('DER FALL DES BEFUNDS: wer das style-Attribut raeumt, loescht den Hinweis nicht mehr', () => {
        const { dok, hinweise, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);

        // Genau das, was ein Neuaufbau / Aufraeumdurchlauf tut.
        hinweise.forEach(h => { h.style.display = ''; h.setAttribute('style', ''); });

        const alle = regelwerk(dok);
        hinweise.forEach((h, i) => {
            assert.notEqual(display(h, alle), 'none',
                'Hinweis ' + i + ' ist nach dem Raeumen des style-Attributs verschwunden — '
                + 'genau Befund B3');
            assert.equal(h.classList.contains(kasten.CL_SAISON_KLASSE), true,
                'die Klasse ist der Traeger und muss stehenbleiben');
        });
    });

    it('auch ein fremder Inline-Stil display:none setzt sich nicht mehr durch', () => {
        const { dok, hinweise, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        hinweise.forEach(h => { h.style.display = 'none'; });

        const alle = regelwerk(dok);
        hinweise.forEach((h, i) => {
            assert.notEqual(display(h, alle), 'none',
                'Hinweis ' + i + ': ein fremder Inline-Stil entscheidet wieder ueber die Sichtbarkeit');
        });
    });

    it('die Regel wird genau einmal eingespielt, egal wie oft geschaltet wird', () => {
        const { dok, kasten } = aufbau();
        kasten.setCitySeasonNotice(true);
        kasten.setCitySeasonNotice(false);
        kasten.setCitySeasonNotice(true);
        const stile = dok.head.children.filter(k => k.tagName === 'STYLE');
        assert.equal(stile.length, 1, 'jedes Schalten haengt ein weiteres <style> an');
    });
});
