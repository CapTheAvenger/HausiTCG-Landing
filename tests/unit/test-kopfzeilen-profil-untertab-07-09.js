/**
 * N1 — Kopfzeilen-Verknuepfungen landeten im falschen Profil-Untertab.
 *
 * GEMESSEN AM 07.09.2026, im Browser (Chromium, playwright, lokal
 * ausgeliefertes index.html):
 *
 *   Klick auf "Wunschliste"   -> Reiter profile, Untertab
 *                                profile-collection, Adresse #profile
 *   switchProfileTab('wishlist') direkt aufgerufen -> profile-wishlist
 *
 * Reproduzierbar bei einem Erstbesuch, bei dem der Service Worker die
 * Seite einmal neu laedt (4 von 7 Laeufen). Zwei Ursachen:
 *
 *   1. Die Adresse trug den Untertab nicht. switchTabAndUpdateMenu()
 *      schreibt ueber kanonischerHash() nur '#profile'. Beim Neuladen
 *      loest applyHash() '#profile' auf — und '#profile' steht in
 *      PROFILE_SUBTAB_FOR_HASH nicht, also bleibt der Standarduntertab
 *      "Meine Sammlung" stehen.
 *   2. Der Umschaltbefehl hing an EINEM requestAnimationFrame mit einer
 *      typeof-Wache. War switchProfileTab in genau diesem Bild noch
 *      nicht da, fiel er wortlos aus.
 *
 * Beide Ursachen werden hier gepruef — die zweite funktional: der echte
 * Rumpf von openProfileSection() laeuft in einer Sandbox, in der
 * switchProfileTab erst nach drei Bildern auftaucht.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js', 'inline-init.js'), 'utf8');

/* Rumpf einer benannten Funktion samt Kopf herausschneiden — der ECHTE
 * Code, kein Nachbau: ein Nachbau wuerde den Befund nicht abdecken. */
function funktion(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.ok(start >= 0, name + '() gibt es nicht mehr');
    let i = src.indexOf('{', start), tiefe = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') tiefe++;
        else if (src[j] === '}') { tiefe--; if (tiefe === 0) return src.slice(start, j + 1); }
    }
    assert.fail(name + '(): Klammern gehen nicht auf');
}

function tabelle(name) {
    const m = new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\n    \\};').exec(SRC);
    assert.ok(m, name + ' nicht gefunden');
    return m[1];
}

// Nur echte Eintraege, keine erwaehnten Namen aus Kommentaren.
function eintraege(body) {
    const ohne = body.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return Object.fromEntries(
        [...ohne.matchAll(/^\s*'([^']+)':\s*'([^']+)'/gm)].map(m => [m[1], m[2]]));
}

describe('N1 — der Untertab steht in der Adresse', () => {
    const ALIAS = eintraege(tabelle('HASH_ALIASES'));
    const UNTER = eintraege(tabelle('PROFILE_SUBTAB_FOR_HASH'));

    it('die drei Kopfzeilen-Ziele haben eine eigene Kurzform', () => {
        // "Wunschliste", "Meine Decks", Menuepunkt "Deck Builder".
        for (const k of ['wishlist', 'decks', 'deckbuilder']) {
            assert.strictEqual(ALIAS[k], 'profile',
                'HASH_ALIASES kennt "' + k + '" nicht — dann kann '
                + 'openProfileSection() den Untertab nicht in die Adresse '
                + 'schreiben und jedes Neuladen faellt auf die Sammlung zurueck');
            assert.strictEqual(UNTER[k], k,
                'PROFILE_SUBTAB_FOR_HASH kennt "' + k + '" nicht selbstbezueglich');
        }
    });

    /* NACHGEFUEHRT AM 07.09.2026 (Befund B4 der Nachabnahme).
       Hier stand frueher die Erwartung, schreibeProfilHash() ERSETZE das
       zuvor geschobene '#profile'. Genau daran ist der Klick gescheitert:
       ersetzen kommt eine Stufe zu spaet — der '#profile'-Eintrag war da,
       bevor er ersetzt werden konnte. Gemessen: history.length 3 -> 4 bei
       unveraendertem #wishlist, und der erste Zurueck-Druck aenderte nichts
       Sichtbares. Unterdrueckt wird jetzt der '#profile'-Eintrag selbst
       (Marke __dsProfilHashFolgt in schreibeHash), und diese Funktion
       SCHIEBT den einen Eintrag, den der Klick verdient. Die Erwartung
       hier folgt der Korrektur; dass daraus wirklich genau ein
       Verlaufseintrag wird, misst
       tests/unit/test-tieflink-nachabnahme-07-09.js am ganzen Ablauf. */
    it('schreibeProfilHash() schiebt genau die Kurzform in die Adresse', () => {
        const sandbox = { console, String, Object, assert };
        const verlauf = [];
        sandbox.window = {
            location: { pathname: '/', search: '', hash: '#profile' },
            history: {
                pushState: (s, t, u) => verlauf.push(['push', u]),
                // Bleibt im Ersatz stehen: waere es wieder replaceState,
                // muss der Unterschied hier auffallen und nicht in einem
                // stillen TypeError verschwinden.
                replaceState: (s, t, u) => verlauf.push(['replace', u]),
            },
        };
        sandbox.routetGerade = false;
        // Rueckfallebene der Funktion: kennt sie die Kurzform nicht, laesst
        // sie wenigstens '#profile' schreiben, statt die Adresse der vorigen
        // Ansicht stehenzulassen.
        sandbox.schreibeHash = (t) => verlauf.push(['rueckfall', t]);
        vm.createContext(sandbox);
        vm.runInContext([
            'const HASH_ALIASES = {' + tabelle('HASH_ALIASES') + '\n};',
            'const PROFILE_SUBTAB_FOR_HASH = {' + tabelle('PROFILE_SUBTAB_FOR_HASH') + '\n};',
            funktion(SRC, 'schreibeProfilHash'),
            'window.schreibeProfilHash = schreibeProfilHash;',
        ].join('\n\n'), sandbox, { filename: 'profilhash.js' });

        sandbox.window.schreibeProfilHash('wishlist');
        sandbox.window.schreibeProfilHash('decks');
        sandbox.window.schreibeProfilHash('deckbuilder');
        assert.deepStrictEqual(verlauf,
            [['push', '/#wishlist'], ['push', '/#decks'], ['push', '/#deckbuilder']]);

        // Ein Reiter ist kein Profil-Untertab, ein erfundener Name auch nicht.
        // Beides darf die Adresse nicht mit einer Kurzform belegen, die
        // applyHash() nicht aufloesen kann — geschrieben wird dann '#profile'.
        verlauf.length = 0;
        sandbox.window.schreibeProfilHash('quellen');
        sandbox.window.schreibeProfilHash('gibtesnicht');
        sandbox.window.schreibeProfilHash('');
        assert.deepStrictEqual(verlauf, [
            ['rueckfall', 'profile'], ['rueckfall', 'profile'], ['rueckfall', 'profile'],
        ], 'geschrieben werden darf nur eine Kurzform, die applyHash() '
            + 'anschliessend wieder aufloesen kann');
    });
});

describe('N1 — der Umschaltbefehl geht nicht mehr verloren', () => {
    function laufen(bildBisSwitchProfileTab) {
        const rufe = [];
        const bilder = [];
        const sandbox = { console };
        sandbox.window = {
            __dsSchreibeProfilHash: (s) => rufe.push(['adresse', s]),
        };
        sandbox.switchTabAndUpdateMenu = (t) => rufe.push(['reiter', t]);
        sandbox.requestAnimationFrame = (fn) => bilder.push(fn);
        vm.createContext(sandbox);
        vm.runInContext(funktion(SRC, 'openProfileSection'), sandbox,
            { filename: 'openProfileSection.js' });

        sandbox.openProfileSection('wishlist');
        for (let i = 0; i < 90 && bilder.length; i++) {
            if (i === bildBisSwitchProfileTab) {
                sandbox.window.switchProfileTab = (s) => rufe.push(['untertab', s]);
            }
            bilder.shift()();
        }
        return rufe;
    }

    it('switchProfileTab ist von Anfang an da', () => {
        // -1 heisst: schon vor dem ersten Bild gesetzt.
        const rufe = [];
        const sandbox = { console };
        sandbox.window = {
            __dsSchreibeProfilHash: (s) => rufe.push(['adresse', s]),
            switchProfileTab: (s) => rufe.push(['untertab', s]),
        };
        sandbox.switchTabAndUpdateMenu = (t) => rufe.push(['reiter', t]);
        sandbox.requestAnimationFrame = () => assert.fail('kein Bild noetig');
        vm.createContext(sandbox);
        vm.runInContext(funktion(SRC, 'openProfileSection'), sandbox,
            { filename: 'openProfileSection.js' });
        sandbox.openProfileSection('wishlist');
        assert.deepStrictEqual(rufe, [
            ['reiter', 'profile'],
            ['adresse', 'wishlist'],
            ['untertab', 'wishlist'],
        ]);
    });

    it('switchProfileTab kommt erst im vierten Bild — der Befehl wartet', () => {
        // GENAU DER BEFUND: die alte Fassung versuchte es EIN Bild lang
        // und gab dann wortlos auf. Der Nutzer sah seine Sammlung.
        const rufe = laufen(3);
        assert.deepStrictEqual(rufe, [
            ['reiter', 'profile'],
            ['adresse', 'wishlist'],
            ['untertab', 'wishlist'],
        ], 'der Umschaltbefehl faellt aus, wenn switchProfileTab nicht im '
         + 'ersten Bild schon geladen ist');
    });

    it('kommt sie gar nicht, wird nicht endlos gewartet', () => {
        const bilder = [];
        const sandbox = { console };
        sandbox.window = { __dsSchreibeProfilHash: () => {} };
        sandbox.switchTabAndUpdateMenu = () => {};
        sandbox.requestAnimationFrame = (fn) => bilder.push(fn);
        vm.createContext(sandbox);
        vm.runInContext(funktion(SRC, 'openProfileSection'), sandbox,
            { filename: 'openProfileSection.js' });
        sandbox.openProfileSection('wishlist');
        let n = 0;
        while (bilder.length && n < 5000) { bilder.shift()(); n++; }
        assert.strictEqual(bilder.length, 0, 'die Warteschleife haelt nicht an');
        assert.ok(n < 200, 'zu viele Versuche: ' + n);
    });
});
