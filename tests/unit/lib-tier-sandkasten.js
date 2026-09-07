/**
 * Ein Sandkasten fuer die Tier-Einteilung aus js/app-tier-meta.js.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Befund A-F2.7 (Reiter "City League", Tier-Liste) und Befund C6
 * (Reiter "Laufendes Meta", Tier-Liste) sind beide Aussagen darueber,
 * was am Ende in welcher REIHENFOLGE dasteht. Ein Quelltext-Grep sieht
 * die Sortierung, aber nicht ihr Ergebnis. Diese Datei schneidet die
 * echten Bloecke aus der Datei heraus und fuehrt sie aus.
 *
 * KEIN jsdom, kein Netz, keine Live-Daten: die Decks setzt der Test.
 *
 * Die Datei heisst bewusst NICHT test-*.js — scripts/run-js-unit-tests.sh
 * fuehrt nur `tests/unit/test-*.js` aus.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-tier-meta.js'), 'utf8');

/** Von `von` bis zum Ende des Blocks, der bei `bis` beginnt (Klammerzaehlung). */
function schnitt(von, bis) {
    const a = QUELLE.indexOf(von);
    if (a < 0) throw new Error('Anfangsmarke nicht gefunden: ' + von);
    const b = QUELLE.indexOf(bis, a);
    if (b < 0) throw new Error('Endmarke nicht gefunden: ' + bis);
    let tiefe = 0;
    for (let i = QUELLE.indexOf('{', b); i < QUELLE.length; i++) {
        if (QUELLE[i] === '{') tiefe++;
        else if (QUELLE[i] === '}') {
            tiefe--;
            if (tiefe === 0) {
                // bis einschliesslich der schliessenden `});`
                const rest = QUELLE.slice(i, i + 4);
                const zu = i + (rest.startsWith('});') ? 3 : 1);
                return QUELLE.slice(a, zu);
            }
        }
    }
    throw new Error('die Klammern gehen nicht auf ab: ' + bis);
}

/** Eine Funktionsdeklaration per Namen herausschneiden. */
function funktion(name, src) {
    const text = src || QUELLE;
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(text);
    if (!m) throw new Error('Funktion nicht gefunden: ' + name);
    const start = text.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = text.indexOf('{', start); i < text.length; i++) {
        if (text[i] === '{') tiefe++;
        else if (text[i] === '}') {
            tiefe--;
            if (tiefe === 0) return text.slice(start, i + 1);
        }
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

/**
 * Der City-League-Block: Zaehler/Rang-Leser, die Sortierung der
 * Gesamtliste, der Indexschnitt in die vier Stufen und die Sortierung
 * INNERHALB der Stufen — am Stueck, so wie er ausgeliefert wird.
 */
function cityLeagueStufen(decks) {
    const block = schnitt(
        'const parseDeckCount = (deck) => {',
        'Object.keys(tierGroups).forEach((tierKey) => {'
    );
    const kasten = {
        console: { warn() {}, info() {}, log() {} },
        Math, Number, String, Array, Object, Map, Set, JSON, parseInt, parseFloat,
        isNaN, isFinite,
        cityLeagueData: decks,
        parseLocaleNumber: (v, s) => {
            const n = parseFloat(String(v).replace(',', '.'));
            return Number.isFinite(n) ? n : (s || 0);
        },
        // Der Heldenblock dazwischen fasst Varianten zusammen; fuer die
        // Stufen ist nur wichtig, dass er laeuft.
        getCombinedMainArchetypeLabel: (n) => String(n).split(' ')[0],
        toTitleCaseWords: (n) => String(n),
        // Zwischen Indexschnitt und Sortierung stehen die Ueberschriften
        // der Stufen; sie brauchen den Uebersetzer.
        t: (k) => k,
        escapeHtml: (x) => String(x),
        getLang: () => 'de',
        window: { currentCityLeagueFormat: 'past' }
    };
    kasten.window.parseLocaleNumber = kasten.parseLocaleNumber;
    vm.createContext(kasten);
    vm.runInContext(block + '\n;globalThis._stufen = tierGroups;', kasten);
    // Die Felder stammen aus dem vm-Realm; deepStrictEqual vergleicht auch
    // den Prototyp. Also in Felder dieses Realms umkopieren.
    const raus = {};
    Object.keys(kasten._stufen).forEach(k => { raus[k] = Array.from(kasten._stufen[k]); });
    return raus;
}

module.exports = { QUELLE, WURZEL, schnitt, funktion, cityLeagueStufen };
