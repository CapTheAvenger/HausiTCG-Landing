/**
 * zahlKomma() FUER vm-SANDKAESTEN.
 *
 * WARUM ES DIESE DATEI GIBT (gemessen 10.09.2026)
 * -----------------------------------------------
 * Am 10.09.2026 wurde der 29-fach kopierte Ausdruck
 * `.toFixed(1)` + `.replace('.', ',')` durch den zentralen Aufruf
 * `zahlKomma()` aus js/app-utils.js abgeloest. Im Browser ist das
 * unkritisch: index.html laedt app-utils.js vor allen acht Dateien, die
 * die Funktion rufen (das prueft
 * tests/unit/test-zahlkomma-zeichengleich.js).
 *
 * In den Unit-Tests ist es das nicht. Sieben Testdateien schneiden
 * einzelne Funktionen aus dem Quelltext und fuehren sie in einem
 * vm-Kontext aus, der nur das enthaelt, was die Funktion braucht.
 * Gemessen unmittelbar nach der Umstellung: 10 Fehlschlaege in sieben
 * Dateien, alle mit derselben Meldung `zahlKomma is not defined`.
 *
 * Der Sandkasten hatte also weniger Globals als die Seite. Behoben wird
 * das, indem der Sandkasten die ECHTE Funktion bekommt — nicht eine
 * Nachbildung. Deshalb wird der Rumpf hier aus js/app-utils.js gelesen
 * und nicht abgeschrieben: waere er abgeschrieben, wuerde eine
 * Aenderung an der ausgelieferten Fassung hier nicht auffallen.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');

/** Zieht eine benannte Funktion samt Kopf aus einem Quelltext, an der
 *  geschweiften Klammer gezaehlt. */
function _funktion(quelle, kopf) {
    const a = quelle.indexOf(kopf);
    if (a < 0) throw new Error(`nicht gefunden: ${kopf}`);
    let tiefe = 0;
    for (let j = quelle.indexOf('{', a); j < quelle.length; j++) {
        if (quelle[j] === '{') tiefe++;
        else if (quelle[j] === '}') { tiefe--; if (tiefe === 0) return quelle.slice(a, j + 1); }
    }
    throw new Error(`unbalancierte Klammern in ${kopf}`);
}

const UTILS = fs.readFileSync(path.join(WURZEL, 'js', 'app-utils.js'), 'utf8');

/** Der Quelltext von zahlKomma(), so wie er ausgeliefert wird. */
const ZAHL_KOMMA_SRC = _funktion(UTILS, 'function zahlKomma(');

/** Legt zahlKomma() in einen bereits kontextualisierten Sandkasten und
 *  haengt sie zusaetzlich ans window — die Aufrufstellen nutzen beide
 *  Wege. Gibt den Kontext zurueck, damit sich der Aufruf verketten
 *  laesst. */
function zahlKommaEinsetzen(kontext) {
    vm.runInContext(ZAHL_KOMMA_SRC, kontext);
    vm.runInContext(
        'if (typeof window !== "undefined" && window) window.zahlKomma = zahlKomma;',
        kontext);
    return kontext;
}

module.exports = { ZAHL_KOMMA_SRC, zahlKommaEinsetzen };
