/**
 * DIE KARTENWEISE SELTENHEITS-VORLIEBE UND IHR ZWISCHENSPEICHER.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Am 07.09.2026 wurde gemessen, dass eine ueber setRarityPreference()
 * gesetzte kartenweise Vorliebe NIE ausgewertet wurde: der globale Zweig
 * in getPreferredVersionForCard (js/app-utils.js) kehrte immer vorher
 * zurueck, weil getGlobalRarityPreference() (js/app-core.js) mit
 * `globalRarityPreference || 'min'` nie etwas anderes als 'min'/'max'
 * liefern kann. Der Nutzer stellte im Seltenheitswaehler einen Druck ein
 * und nichts passierte.
 *
 *   Eingabe:      "Pikachu", Vorrat [TEF 12 Common, SSP 181 SAR],
 *                 prefs {Pikachu:{mode:'specific',set:'SSP',number:'181'}},
 *                 globalRarityPreference = null
 *   vorher:       TEF 12
 *   nach der Behebung: SSP 181
 *
 * Die Zusicherung dafuer steht in
 * tests/unit/test-getPreferredVersionForCard.js (ehemals test.skip).
 *
 * HIER steht, was diese Zusicherung NICHT abdeckt und was an der
 * Behebung schiefgehen kann:
 *
 *   1. DER ZWISCHENSPEICHER. Sobald die Vorliebe WIRKT, muss sie im
 *      Schluessel stehen — sonst liefert der Speicher nach dem Umstellen
 *      das alte Ergebnis, und der Waehler waere wieder wirkungslos, nur
 *      eine Ebene tiefer. Vorher war das folgenlos, jetzt traegt es.
 *   2. KARTEN OHNE EIGENE EINSTELLUNG duerfen sich NICHT veraendern.
 *   3. Ein gewaehlter Druck, den es im Vorrat nicht gibt, darf die Karte
 *      nicht verschwinden lassen.
 *   4. Die Vorliebe muss auch gegen 'max' und gegen die
 *      Basis-Energie-Sonderregel gewinnen.
 *
 * AUSGEFUEHRT, NICHT GEGRIFFEN: derselbe Zuschnitt wie in
 * test-getPreferredVersionForCard.js — echte Funktionen aus js/, nur die
 * beiden Vorratsquellen sind gesetzt.
 *
 * KEINE LIVEDATEN, KEIN jsdom.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const UTILS = lies('js/app-utils.js');
const CORE = lies('js/app-core.js');
const CITY = lies('js/app-city-league.js');

function funktion(name, quelle) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(quelle);
    assert.ok(m, 'Funktion nicht gefunden: ' + name);
    const start = quelle.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = quelle.indexOf('{', start); i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}' && --tiefe === 0) return quelle.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

const ALIAS = UTILS.match(/const LEGACY_CARD_NAME_ALIASES = (Object\.freeze\(\{[\s\S]*?\}\));/);
assert.ok(ALIAS, 'LEGACY_CARD_NAME_ALIASES nicht gefunden');

const KETTE = [
    'const LEGACY_CARD_NAME_ALIASES = ' + ALIAS[1] + ';',
    funktion('fixMojibake', UTILS),
    funktion('getLegacyCardNameAlias', UTILS),
    funktion('normalizeCardName', UTILS),
    funktion('isBasicEnergy', UTILS),
    funktion('normalizeSetCode', CITY),
    funktion('normalizeCardNumber', CITY),
    funktion('getGlobalRarityPreference', CORE),
    funktion('getRarityPreference', CORE),
    funktion('setRarityPreference', CORE),
    funktion('getRarityPriority', UTILS),
    funktion('getPreferredVersionForCard', UTILS),
    'const preferredVersionCache = new Map();',
    'function debugVersionSelectionLog() {}',
    'function saveRarityPreferences() {}',
].join('\n\n');

function baueAuswahl(cfg = {}) {
    const fenster = {
        setOrderMap: cfg.setOrderMap || {},
        englishSetCodes: cfg.englishSetCodes || new Set(),
    };
    const prefs = cfg.prefs || {};
    // eslint-disable-next-line no-new-func
    const teile = new Function(
        'window', 'globalRarityPreference', 'rarityPreferences',
        'getInternationalPrintsForCard', 'getEnglishCardVersions', 'cardsByNameMap',
        KETTE + '\nreturn { waehle: getPreferredVersionForCard, speicher: preferredVersionCache,'
              + ' stelleEin: setRarityPreference, globalGelesen: getGlobalRarityPreference() };'
    )(
        fenster,
        Object.prototype.hasOwnProperty.call(cfg, 'global') ? cfg.global : 'min',
        prefs,
        cfg.intl || (() => []),
        cfg.eng || (() => []),
        {}
    );
    teile.prefs = prefs;
    return teile;
}

const druck = (set, nummer, seltenheit, art = 'Pokémon') =>
    ({ set, number: nummer, rarity: seltenheit, type: art, image_url: 'bild' });

const VORRAT = () => [
    druck('TEF', '12', 'Common'),
    druck('PAL', '73', 'Double Rare'),
    druck('SSP', '181', 'Special Illustration Rare'),
];

describe('die Voraussetzung des Befunds — sie besteht weiter', () => {
    it('getGlobalRarityPreference() liefert auch bei null noch "min"', () => {
        // Das war die URSACHE. Sie wurde bewusst NICHT angefasst: die
        // globale Vorliebe soll ihren Vorgabewert behalten. Behoben wurde
        // die REIHENFOLGE der Auswertung. Faellt diese Zusicherung eines
        // Tages, ist der Befund auf dem anderen Weg geloest — dann darf
        // sie mit Begruendung weg, nicht stillschweigend.
        assert.equal(baueAuswahl({ global: null }).globalGelesen, 'min');
        assert.equal(baueAuswahl({ global: undefined }).globalGelesen, 'min');
        assert.equal(baueAuswahl({ global: '' }).globalGelesen, 'min');
    });
});

describe('die kartenweise Vorliebe gewinnt', () => {
    it('gegen die globale Vorgabe "min"', () => {
        const a = baueAuswahl({
            global: 'min',
            prefs: { Pikachu: { mode: 'specific', set: 'SSP', number: '181' } },
            eng: VORRAT,
        });
        const g = a.waehle('Pikachu');
        assert.equal(g.set, 'SSP');
        assert.equal(g.number, '181');
    });

    it('gegen die globale Vorgabe "max"', () => {
        // Gegenprobe zur Zeile darueber: dieselbe Karte, andere globale
        // Vorgabe, und die Vorliebe zeigt auf den NIEDRIGSTEN Druck.
        // Nur so trennt der Test "Vorliebe wirkt" von "min gewinnt".
        const a = baueAuswahl({
            global: 'max',
            prefs: { Pikachu: { mode: 'specific', set: 'TEF', number: '12' } },
            eng: VORRAT,
        });
        assert.equal(a.waehle('Pikachu').set, 'TEF');
        assert.equal(baueAuswahl({ global: 'max', eng: VORRAT }).waehle('Pikachu').set, 'SSP',
            'Vorpruefung: ohne Vorliebe kaeme hier SSP heraus');
    });

    it('gegen die SVE-Sonderregel fuer Basis-Energien', () => {
        // Ohne Vorliebe erzwingt der Quelltext im min-Modus SVE 22.
        const vorrat = () => [
            druck('SVE', '22', 'Common', 'Basic Energy'),
            druck('SVI', '300', 'Rare', 'Basic Energy'),
        ];
        assert.equal(baueAuswahl({ eng: vorrat }).waehle('Fighting Energy').set, 'SVE',
            'Vorpruefung: ohne Vorliebe gilt die SVE-Regel');
        const a = baueAuswahl({
            prefs: { 'Fighting Energy': { mode: 'specific', set: 'SVI', number: '300' } },
            eng: vorrat,
        });
        const g = a.waehle('Fighting Energy');
        assert.equal(g.set, 'SVI');
        assert.equal(g.number, '300');
    });

    it('auch fuer einen Druck, den die Sortierung nie gewaehlt haette', () => {
        // PAL 73 steht in der Mitte: weder min noch max kaemen darauf.
        const a = baueAuswahl({
            prefs: { Pikachu: { mode: 'specific', set: 'PAL', number: '73' } },
            eng: VORRAT,
        });
        assert.equal(a.waehle('Pikachu').set, 'PAL');
    });

    it('und ueber setRarityPreference() gesetzt genauso — das ist der Weg der Oberflaeche', () => {
        // js/app-cards-db.js:4722/:4828/:4923 und js/app-deck-builder.js:600/:811
        // rufen genau diese Funktion mit genau dieser Form.
        const a = baueAuswahl({ eng: VORRAT });
        a.stelleEin('Pikachu', { mode: 'specific', set: 'SSP', number: '181' });
        assert.equal(a.waehle('Pikachu').set, 'SSP');
    });
});

describe('Karten OHNE eigene Einstellung bleiben unberuehrt', () => {
    it('die globale Vorgabe entscheidet weiter, wenn keine Vorliebe da ist', () => {
        const a = baueAuswahl({ eng: VORRAT });
        assert.equal(a.waehle('Pikachu').set, 'TEF');
    });

    it('die Vorliebe EINER Karte faerbt nicht auf eine andere ab', () => {
        const a = baueAuswahl({
            prefs: { Pikachu: { mode: 'specific', set: 'SSP', number: '181' } },
            eng: VORRAT,
        });
        assert.equal(a.waehle('Pikachu').set, 'SSP');
        assert.equal(a.waehle('Raichu').set, 'TEF', 'Raichu hat keine eigene Einstellung');
    });

    it('eine halbe Vorliebe (ohne set/number) faellt auf die globale Vorgabe zurueck', () => {
        for (const halb of [{ mode: 'specific' }, { mode: 'specific', set: 'SSP' }, { mode: 'specific', number: '181' }]) {
            const a = baueAuswahl({ prefs: { Pikachu: halb }, eng: VORRAT });
            assert.equal(a.waehle('Pikachu').set, 'TEF', JSON.stringify(halb) + ' → min erwartet');
        }
    });

    it('ein gewaehlter Druck, den es im Vorrat NICHT gibt, laesst die Karte nicht verschwinden', () => {
        // Wichtiger Unterschied zur alten, unerreichbaren Fassung: die
        // haette hier null geliefert und die Karte aus der Ansicht
        // genommen. Ein veralteter Speichereintrag im Browser des Nutzers
        // (Set spaeter umbenannt) darf das nicht ausloesen.
        const a = baueAuswahl({
            prefs: { Pikachu: { mode: 'specific', set: 'GIBTS', number: '999' } },
            eng: VORRAT,
        });
        const g = a.waehle('Pikachu');
        assert.notEqual(g, null, 'kein null — die globale Vorliebe muss uebernehmen');
        assert.equal(g.set, 'TEF');
    });
});

describe('der Zwischenspeicher traegt die Vorliebe im Schluessel', () => {
    it('der Schluessel enthaelt die Vorliebe woertlich', () => {
        const a = baueAuswahl({
            prefs: { Pikachu: { mode: 'specific', set: 'SSP', number: '181' } },
            eng: VORRAT,
        });
        a.waehle('Pikachu');
        const schluessel = [...a.speicher.keys()];
        assert.equal(schluessel.length, 1);
        assert.match(schluessel[0], /specific/);
        assert.match(schluessel[0], /SSP/);
        assert.match(schluessel[0], /181/);
    });

    it('das Umstellen der Vorliebe liefert NICHT das alte Ergebnis aus dem Speicher', () => {
        // Das ist die eigentliche Gefahr an dieser Behebung. Vorher war
        // die Vorliebe im Schluessel folgenlose Zierde; jetzt haengt das
        // Ergebnis daran. Gemessen wird an DERSELBEN Auswahl mit
        // DEMSELBEN Speicher, also genau so, wie es im Browser laeuft.
        const a = baueAuswahl({ eng: VORRAT });
        assert.equal(a.waehle('Pikachu').set, 'TEF', 'erst ohne Vorliebe');

        a.stelleEin('Pikachu', { mode: 'specific', set: 'SSP', number: '181' });
        assert.equal(a.waehle('Pikachu').set, 'SSP', 'nach dem Umstellen sofort der neue Druck');

        a.stelleEin('Pikachu', { mode: 'specific', set: 'PAL', number: '73' });
        assert.equal(a.waehle('Pikachu').set, 'PAL', 'und noch einmal umgestellt');

        assert.equal(a.speicher.size, 3, 'drei Zustaende, drei eigene Eintraege');
    });

    it('zurueck auf keine Vorliebe liefert wieder die globale Wahl', () => {
        const a = baueAuswahl({ eng: VORRAT });
        a.stelleEin('Pikachu', { mode: 'specific', set: 'SSP', number: '181' });
        assert.equal(a.waehle('Pikachu').set, 'SSP');
        delete a.prefs['Pikachu'];
        assert.equal(a.waehle('Pikachu').set, 'TEF');
    });

    it('bei gleicher Vorliebe wird der Vorrat nur einmal gefragt', () => {
        let aufrufe = 0;
        const a = baueAuswahl({
            prefs: { Pikachu: { mode: 'specific', set: 'SSP', number: '181' } },
            eng: () => { aufrufe++; return VORRAT(); },
        });
        const erst = a.waehle('Pikachu');
        const zweit = a.waehle('Pikachu');
        assert.equal(aufrufe, 1, 'der zweite Aufruf kommt aus dem Speicher');
        assert.equal(erst, zweit);
    });
});
