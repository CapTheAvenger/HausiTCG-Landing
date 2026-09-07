/**
 * B3 — Eine Menue-Kennung, die einen anderen Reiter benannte als der
 *      Punkt oeffnete.
 *
 * GEMESSEN am 07.09.2026 im Markup: der Menuepunkt "Startseite" trug
 * `id="menu-btn-meta-analysis-hub"`, oeffnete aber
 * `switchTabAndUpdateMenu('current-meta')`.
 *
 * WARUM DAS NICHT NUR HAESSLICH IST: drei Stellen im Motor lesen einen
 * Menuepunkt ueber das Muster `menu-btn-<Reitername>` —
 *
 *   js/app-core.js          Fenstertitel und Abzeichen
 *   js/inline-init.js       Markierung im Menue und Abzeichen
 *   js/meta-analysis-hub.js Markierung beim Rueckweg zur Kachelseite
 *
 * — und alle drei bekamen fuer den Reiter `meta-analysis-hub` diesen
 * Knopf samt seiner Beschriftung "Startseite". Die Kachelseite nannte
 * sich damit selbst Startseite, obwohl die Seite auf `current-meta`
 * startet. Genau diese Verwechslung ("zwei Antworten auf die Frage wo
 * ist Zuhause") hat der Nutzer am 26.08.2026 abstellen lassen; sie war
 * ueber die Kennung noch da.
 *
 * DIE RICHTUNG DER KORREKTUR ist damit vorgegeben: das ZIEL ist die
 * Entscheidung des Nutzers und bleibt (tests/unit/test-startseite-
 * eindeutig.js haelt es fest), die KENNUNG war der Rest von vorher und
 * benennt jetzt keinen Reiter mehr.
 *
 * WIE HIER GEPRUEFT WIRD
 * ----------------------
 * Das Muster `menu-btn-<Reitername>` wird NICHT abgeschrieben, sondern
 * aus den drei js-Dateien gelesen, die es bilden. Die Liste der Reiter
 * kommt aus dem Markup selbst. Damit ist die Zusicherung an die
 * tatsaechliche Abfrage gebunden und nicht an eine Zeichenkette, die
 * beim naechsten Umbau stehenbleibt.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = p => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const MARKUP = lies('index.html');

/** Die Dateien, die einen Menuepunkt ueber seine Kennung nachschlagen. */
const NACHSCHLAGER = [
    'js/app-core.js',
    'js/inline-init.js',
    'js/meta-analysis-hub.js'
];

/**
 * Das Praefix, mit dem der Motor einen Menuepunkt AUS EINEM REITERNAMEN
 * bildet — aus den Dateien gelesen, nicht abgeschrieben. Entscheidend
 * ist der Anhang: nur Nachschlagungen, deren Variable der Reitername
 * ist (`tabId` / `tabName`), bilden diese Zuordnung. Die uebrigen
 * getElementById-Aufrufe im Menue (menu-submenu-, menu-group-) haengen
 * an Gruppennamen und gehen diese Pruefung nichts an.
 *
 * Alle drei Dateien muessen dasselbe Praefix benutzen; taeten sie es
 * nicht, gaebe es zwei Zuordnungen und der Test sagt das, statt eine
 * davon zu raten.
 */
function nachschlagePraefix() {
    const gefunden = new Map();
    for (const datei of NACHSCHLAGER) {
        for (const m of lies(datei).matchAll(
            /getElementById\(\s*'([a-z-]+-)'\s*\+\s*(tabId|tabName)\s*\)/g)) {
            gefunden.set(m[1], (gefunden.get(m[1]) || []).concat(datei));
        }
    }
    assert.equal(gefunden.size, 1,
        'Erwartet wird genau EIN Praefix, mit dem aus einem Reiternamen ein '
        + 'Menuepunkt wird (' + NACHSCHLAGER.join(', ') + ') — gefunden: '
        + [...gefunden.keys()].join(', ')
        + '. Bei mehreren muss diese Pruefung neu gedacht werden.');
    const [praefix, dateien] = [...gefunden][0];
    assert.deepEqual([...new Set(dateien)].sort(), [...NACHSCHLAGER].sort(),
        'Nicht alle drei Dateien schlagen ueber "' + praefix + '<Reitername>" nach — '
        + 'gefunden in: ' + [...new Set(dateien)].join(', '));
    return praefix;
}

/** Die Reiter, die es im echten Markup wirklich gibt. */
function reiterIds() {
    return new Set([...MARKUP.matchAll(/id="([a-z-]+)"\s+class="tab-content[^"]*"/g)]
        .map(m => m[1]));
}

/** Alle Menuepunkte mit ihrer Kennung, ihrem data-tab-id und ihrem Ziel. */
function menuepunkte() {
    const praefix = nachschlagePraefix();
    /* `\bid="` alleine reicht nicht: in `data-tab-id="city-league"` steht
       vor dem `id` ein Bindestrich, also auch eine Wortgrenze — die
       gierige Suche griff dann den Reiternamen statt der Kennung. */
    return [...MARKUP.matchAll(/<button[^>]*(?<![-a-zA-Z])id="([^"]+)"[^>]*>/g)]
        .filter(m => m[1].startsWith(praefix))
        .map(m => ({
            id: m[1],
            endung: m[1].slice(praefix.length),
            merkmal: (m[0].match(/data-tab-id="([^"]*)"/) || [])[1],
            ziel: (m[0].match(/switchTabAndUpdateMenu\('([^']*)'\)/) || [])[1],
            roh: m[0]
        }));
}

describe('B3 — Kennung und Ziel eines Menuepunkts', () => {

    it('es gibt ueberhaupt Menuepunkte mit dem Nachschlage-Praefix', () => {
        const punkte = menuepunkte();
        assert.ok(punkte.length >= 10,
            `nur ${punkte.length} Menuepunkte gefunden — wurde das Menue umgebaut?`);
    });

    it('keine Kennung benennt einen Reiter, den der Punkt nicht oeffnet', () => {
        const reiter = reiterIds();
        const luegen = menuepunkte()
            .filter(p => reiter.has(p.endung))   // Kennung BEHAUPTET einen Reiter
            .filter(p => p.ziel !== p.endung);   // … oeffnet ihn aber nicht
        assert.deepEqual(luegen.map(p => `${p.id} oeffnet ${p.ziel}`), [],
            'Diese Kennungen benennen einen Reiter, den ihr Punkt nicht oeffnet. '
            + 'js/app-core.js, js/inline-init.js und js/meta-analysis-hub.js '
            + 'schlagen genau darueber nach und bekommen dann den falschen Knopf '
            + '— samt seiner Beschriftung fuer Titel und Abzeichen.');
    });

    it('wo ein data-tab-id steht, sagt es dasselbe wie das onclick', () => {
        const abweichler = menuepunkte()
            .filter(p => p.merkmal !== undefined && p.merkmal !== p.ziel)
            .map(p => `${p.id}: data-tab-id=${p.merkmal}, onclick=${p.ziel}`);
        assert.deepEqual(abweichler, []);
    });

    it('kein Reiter wird von zwei Menuepunkten als data-tab-id beansprucht', () => {
        /* Der Ersatzweg in js/app-core.js nimmt per querySelector den
           ERSTEN Punkt mit passendem data-tab-id. Gibt es zwei, entscheidet
           die Reihenfolge im Markup, welche Beschriftung in den Titel geht —
           gemessen am 07.09.2026: Titel "Startseite", Abzeichen daneben
           "Current Meta (Global)". */
        const zaehler = new Map();
        for (const m of MARKUP.matchAll(/<button[^>]*data-tab-id="([^"]*)"[^>]*>/g)) {
            zaehler.set(m[1], (zaehler.get(m[1]) || 0) + 1);
        }
        const doppelt = [...zaehler].filter(([, n]) => n > 1).map(([id, n]) => `${id} (${n}x)`);
        assert.deepEqual(doppelt, [],
            'Zwei Menuepunkte beanspruchen denselben Reiter ueber data-tab-id — '
            + 'welcher den Titel stellt, entscheidet dann die Reihenfolge im Markup.');
    });

    it('der Ersatzweg ueber data-tab-id findet fuer die Startseite den richtigen Punkt', () => {
        /* Nachgestellt wird die Abfrage aus js/app-core.js:
           `.menu-item[data-tab-id="<Reiter>"] .menu-item-label` — der erste
           Treffer im Markup. Seine Beschriftung muss die des Reiters sein,
           nicht die eines Kurzwegs dorthin. */
        const start = (MARKUP.match(/<div id="([a-z-]+)" class="tab-content active/) || [])[1];
        assert.equal(start, 'current-meta',
            'Die Startansicht hat gewechselt — diese Pruefung muss dann neu gemessen werden.');
        const erster = MARKUP.match(
            new RegExp('<button[^>]*data-tab-id="' + start + '"[^>]*>\\s*<span class="menu-item-label">([^<]*)<'));
        assert.ok(erster, `Kein Menuepunkt mit data-tab-id="${start}" und Beschriftung gefunden.`);
        assert.equal(erster[1].trim(), 'Current Meta (Global)',
            'Der erste Punkt mit diesem data-tab-id ist nicht der Punkt der Ansicht '
            + 'selbst — dann traegt der Fenstertitel den Namen eines Kurzwegs.');
    });
});
