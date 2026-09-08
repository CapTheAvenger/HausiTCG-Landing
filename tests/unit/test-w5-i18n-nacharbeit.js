/**
 * Zwei Nacharbeiten aus der Win-%-Umstellung (08.09.2026), gemeldet von
 * einem Pruefagenten und hier festgenagelt.
 *
 * 1. GRAMMATIK NACH DER LAUFZEIT-ERSETZUNG.
 *    js/app-meta-call.js:12319 schickt 'mc.intelTgWr' durch
 *    _wrKurzform(); die Ersetzung macht aus dem Hausnamen "WR". Der
 *    deutsche Wert lautete "Mein Matchup-Win (Testing Group)" - nach der
 *    Ersetzung stand "Mein WR" auf der Kachel. Die Quote ist aber
 *    weiblich (die Siegquote, die Win Rate). Die Ersetzung kennt den
 *    Artikel nicht, also muss er schon im Wert stimmen.
 *
 * 2. DREI TOTE SCHLUESSEL.
 *    'mc.badgeTg', 'mc.badgeTgShare' und 'mc.labelJunkWinRate' hatten in
 *    js/, index.html und tests/ keine einzige Aufrufstelle. Ein toter
 *    Schluessel ist keine Uebersetzung, sondern eine Behauptung ueber
 *    eine Oberflaeche, die es nicht gibt - und 'mc.labelJunkWinRate'
 *    behauptete zusaetzlich den reservierten Namen "Win %" fuer eine
 *    Zahl, die niemand rechnet.
 *
 * Der Test prueft BEIDES aus derselben Richtung: er sucht die
 * Aufrufstellen selbst, statt eine Liste abzuschreiben. Ein Schluessel,
 * der wieder eine Aufrufstelle bekommt, darf zurueckkommen; einer ohne
 * darf nicht wieder auftauchen.
 */
'use strict';

const test   = require('node:test');
const assert = require('node:assert');
const fs     = require('node:fs');
const path   = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies   = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

const I18N  = lies('js/i18n.js');
const MC    = lies('js/app-meta-call.js');

/** Alle Dateien, die einen i18n-Schluessel aufrufen koennten. */
function benutzerDateien() {
    const raus = ['index.html'];
    for (const f of fs.readdirSync(path.join(WURZEL, 'js'))) {
        if (f.endsWith('.js') && f !== 'i18n.js') raus.push('js/' + f);
    }
    return raus;
}
const BENUTZER = benutzerDateien().map(p => lies(p)).join('\n');

test('mc.intelTgWr traegt den Artikel, der nach der Ersetzung stimmt', () => {
    const zeilen = [...I18N.matchAll(/'mc\.intelTgWr':\s*'([^']*)'/g)].map(m => m[1]);
    assert.strictEqual(zeilen.length, 2, 'mc.intelTgWr steht nicht genau zweimal (de + en)');

    const de = zeilen.find(z => /Mein/.test(z));
    assert.ok(de, 'der deutsche Wert von mc.intelTgWr fehlt');

    /* _wrKurzform aus js/app-meta-call.js WIRKLICH ANWENDEN, nicht den
       Wortlaut raten: das Muster steht dort und kann sich aendern. */
    const m = MC.match(/const _WR_HAUSNAME\s*=\s*(\/(?:[^/\\\n]|\\.)+\/[gimsuy]*)/);
    assert.ok(m, '_WR_HAUSNAME nicht in js/app-meta-call.js gefunden');
    // eslint-disable-next-line no-eval
    const muster = eval(m[1]);
    const angezeigt = de.replace(muster, 'WR');

    assert.ok(!/\bMein WR\b/.test(angezeigt),
        `nach der Ersetzung steht "${angezeigt}" auf der Kachel - `
        + 'die Quote ist weiblich, also "Meine"');
    assert.match(angezeigt, /\bMeine\b/,
        `nach der Ersetzung steht "${angezeigt}" - erwartet wird der `
        + 'weibliche Artikel');
    assert.ok(!/Matchup-Win\b(?! Rate)/.test(angezeigt),
        'der Hausname ist nach der Ersetzung noch da: ' + angezeigt);
});

test('kein i18n-Schluessel ohne Aufrufstelle (Stichprobe der drei entfernten)', () => {
    for (const k of ['mc.badgeTg', 'mc.badgeTgShare', 'mc.labelJunkWinRate']) {
        const stehtInI18n = I18N.includes(`'${k}'`);
        const wirdGerufen = BENUTZER.includes(`'${k}'`)
            || BENUTZER.includes(`"${k}"`)
            || BENUTZER.includes('`' + k + '`');
        assert.ok(!(stehtInI18n && !wirdGerufen),
            `${k} steht in js/i18n.js, wird aber nirgends aufgerufen. `
            + 'Entweder die Aufrufstelle fehlt oder der Schluessel ist tot.');
    }
});

test('"Win %" bleibt den Matchpunkten vorbehalten - auch in js/i18n.js', () => {
    /* Der entfernte Schluessel mc.labelJunkWinRate hiess "Others Win %".
       "Others" ist der Sammelrest des Predictors; dessen Quote rechnet
       js/app-meta-call.js in _junkWinRatePct() als 100 - gewichtetes
       Mittel der Gegner-pWin - also gerade NICHT Matchpunkte. Der Name
       darf dafuer nicht zurueckkommen. */
    assert.ok(!/'[^']*Others[^']*Win\s*%[^']*'/.test(I18N),
        'ein Sammelrest-Schluessel traegt wieder den Namen "Win %"');
});
