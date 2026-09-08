/**
 * HTML VOR JS — DIE MASKIERUNG IN DER KARTENDATENBANK, DER
 * PROXY-WARTESCHLANGE UND DEM META-BINDER.
 *
 * WORUM ES GEHT
 * -------------
 * Ein Kartenname steht in diesen drei Modulen an vielen Stellen in ZWEI
 * Sprachen gleichzeitig: als JS-Zeichenkette, und diese JS-Zeichenkette
 * wiederum als HTML-Attributwert.
 *
 *   <button onclick="addCardToProxy('NAME', 'SVI', '196', 1)">
 *                    └──────── HTML-Attributwert ────────┘
 *                                └ JS-Zeichenkette ┘
 *
 * Der Browser zerteilt in dieser Reihenfolge: erst HTML, dann JS. Wer
 * nur fuer JS maskiert, maskiert zu spaet.
 *
 * BEFUND (07.09.2026), hier behoben
 * ---------------------------------
 * In den drei Dateien stand `escapeJsStr(x)` allein in einem
 * HTML-Attribut. escapeJsStr macht aus " ein \" — im HTML ist der
 * Rueckstrich ein gewoehnliches Zeichen, und das " danach BEENDET den
 * Attributwert.
 *
 *   Eingabe   item.name = 'x" onmouseover=alert(1) y="'
 *   Stelle    js/app-core.js:947 (Proxy-Warteschlange, Entfernen-Knopf)
 *   gemessen  <button class="btn-remove" onclick="removeCardFromProxy(
 *               'x\" onmouseover=alert(1) y=\"', '', '')">
 *             Der Tag traegt danach ZWEI Ereignisattribute: onclick und
 *             ein dazugekommenes onmouseover mit dem Wert alert(1).
 *
 * WELCHE REIHENFOLGE — GEMESSEN, NICHT GERATEN
 * --------------------------------------------
 * Beide Verschachtelungen ergeben genau zwei " im Tag; am Zaehlen der
 * Anfuehrungszeichen ist die Frage NICHT zu entscheiden. Erst wenn
 * beide Zerteiler nacheinander laufen, trennt sich das:
 *
 *   "Boss's Orders"
 *     A escapeHtmlAttr(escapeJsStr(x)) -> Boss\&#39;s Orders
 *       HTML loest &#39; auf -> 'Boss\'s Orders' -> Boss's Orders   ✓
 *     B escapeJsStr(escapeHtmlAttr(x)) -> Boss&#39;s Orders
 *       escapeJsStr findet kein ' mehr; HTML loest &#39; DANACH auf
 *       -> 'Boss's Orders' -> SyntaxError                          ✗
 *
 * Richtig ist A: der AEUSSERE Zerteiler maskiert zuletzt. Hausbeleg
 * seit jeher: js/app-current-meta-analysis.js:4312.
 *
 * DREI SORTEN STELLE
 * ------------------
 *   a) Wert in einem Attribut, das als JS gelesen wird (onclick,
 *      onkeydown, onchange) -> escapeHtmlAttr(escapeJsStr(x))
 *   b) Wert in einem gewoehnlichen Attribut (src, data-…), das NIE als
 *      JS gelesen wird -> escapeHtmlAttr(String(x || '')). escapeJsStr
 *      waere dort der falsche Maskierer: er setzt Rueckstriche, die der
 *      Nutzer im Wert liest, und laesst " durch.
 *   c) reine JS-Zeichenkette ausserhalb von HTML -> unveraendert.
 *
 * KEIN jsdom, KEINE LIVEDATEN
 * ---------------------------
 * .github/workflows/deploy-pages.yml installiert nur papaparse. Der
 * HTML-Zerteiler unten ist deshalb selbst gebaut — er liest einen
 * Start-Tag so, wie der Browser ihn liest (Anfuehrungszeichen
 * begrenzen, Entitaeten aufloesen). Die JS-Stufe laeuft in node:vm,
 * also in echtem JS. Die beiden Masken werden aus js/app-utils.js
 * GESCHNITTEN, nicht abgeschrieben. Jede Eingabe setzt der Test selbst.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');

/** Eine Funktionsdeklaration per Namen aus `src` schneiden. */
function funktion(src, name, datei) {
    const re = new RegExp(`(^|\\n)\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const m = re.exec(src);
    assert.ok(m, `Funktion nicht mehr in js/${datei}: ${name}`);
    const start = src.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = src.indexOf('{', start); i < src.length; i++) {
        if (src[i] === '{') tiefe++;
        else if (src[i] === '}' && --tiefe === 0) return src.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

// Die beiden Masken kommen aus der echten Datei, nicht aus einer Abschrift.
const UTILS = lies('app-utils.js');
const MASKEN = (() => {
    const kasten = { String };
    vm.createContext(kasten);
    vm.runInContext(
        funktion(UTILS, 'escapeHtmlAttr', 'app-utils.js') + '\n'
        + funktion(UTILS, 'escapeJsStr', 'app-utils.js'), kasten);
    return kasten;
})();
const escapeHtmlAttr = MASKEN.escapeHtmlAttr;
const escapeJsStr = MASKEN.escapeJsStr;

/** So maskiert der Meta-Binder Archetypnamen (js/meta-binder.js:1660). */
const escapeArchetypeForJs = (v) => escapeJsStr(v);

// ══════════════════════════════════════════════════════════════════
// STUFE 1 — der HTML-Zerteiler
// ══════════════════════════════════════════════════════════════════

/** Die fuenf Entitaeten aufloesen, die escapeHtmlAttr erzeugt. */
function entitaetenAuf(roh) {
    return String(roh)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * Die Attribute des ERSTEN Start-Tags lesen — so, wie der HTML-Zerteiler
 * sie liest. Ein Anfuehrungszeichen im Wert beendet den Wert; was danach
 * kommt, ist ein NEUES Attribut. Genau daran erkennt der Test den
 * Ausbruch, statt Anfuehrungszeichen zu zaehlen.
 */
function startTagAttribute(markup) {
    const auf = markup.indexOf('<');
    assert.ok(auf >= 0, 'kein Start-Tag im Markup');
    let i = auf + 1;
    while (i < markup.length && /[^\s/>]/.test(markup[i])) i++;   // Tagname
    const attrs = [];
    while (i < markup.length) {
        while (i < markup.length && /\s/.test(markup[i])) i++;
        if (i >= markup.length || markup[i] === '>' || markup[i] === '/') break;
        let n = '';
        while (i < markup.length && !/[\s=/>]/.test(markup[i])) n += markup[i++];
        while (i < markup.length && /\s/.test(markup[i])) i++;
        if (markup[i] !== '=') { attrs.push({ name: n, wert: '' }); continue; }
        i++;                                                       // das =
        while (i < markup.length && /\s/.test(markup[i])) i++;
        let w = '';
        if (markup[i] === '"' || markup[i] === "'") {
            const grenze = markup[i++];
            while (i < markup.length && markup[i] !== grenze) w += markup[i++];
            i++;                                                   // Grenze zu
        } else {
            while (i < markup.length && !/[\s>]/.test(markup[i])) w += markup[i++];
        }
        attrs.push({ name: n, wert: entitaetenAuf(w) });
    }
    return attrs;
}

const ereignisAttribute = (attrs) =>
    attrs.map(a => a.name.toLowerCase()).filter(n => n.startsWith('on'));

// ══════════════════════════════════════════════════════════════════
// STUFE 2 — der JS-Zerteiler (echtes JS, node:vm)
// ══════════════════════════════════════════════════════════════════

const EREIGNIS = { key: 'Enter', preventDefault() {}, stopPropagation() {} };

/** Den Attributwert als JS ausfuehren und aufzeichnen, was ankam. */
function jsLauf(code, ergaenzung) {
    const gesehen = [];
    const merke = (name) => (...a) => gesehen.push([name, ...a.map(
        w => (w === EREIGNIS ? '<event>' : w))]);
    const kasten = {
        // js/app-cards-db.js
        selectCardFromAutocomplete: merke('selectCardFromAutocomplete'),
        handleCardAutocompleteKeydown: merke('handleCardAutocompleteKeydown'),
        showImageView: merke('showImageView'),
        openLimitlessCard: merke('openLimitlessCard'),
        addCardToProxy: merke('addCardToProxy'),
        waehleAnzeigeDruck: merke('waehleAnzeigeDruck'),
        selectRarityVersion: merke('selectRarityVersion'),
        openCardmarket: merke('openCardmarket'),
        // js/app-core.js
        setProxyCardCount: merke('setProxyCardCount'),
        removeCardFromProxy: merke('removeCardFromProxy'),
        // js/meta-binder.js
        navigateToAnalysisWithDeck: merke('navigateToAnalysisWithDeck'),
        navigateToCurrentMetaWithDeck: merke('navigateToCurrentMetaWithDeck'),
        openRaritySwitcherFromDB: merke('openRaritySwitcherFromDB'),
        // was ein Angriff aufrufen wuerde
        alert: merke('alert'),
        event: EREIGNIS,
        value: '3',            // fuer `this.value` in der Mengeneingabe
        JSON, decodeURIComponent, String,
    };
    Object.assign(kasten, ergaenzung || {});
    vm.createContext(kasten);
    let fehler = null;
    try { vm.runInContext(code, kasten, { timeout: 1000 }); }
    catch (e) { fehler = e.constructor.name + ': ' + e.message; }
    return { gesehen, fehler };
}

// ══════════════════════════════════════════════════════════════════
// DIE ANGRIFFSFORMEN
// ══════════════════════════════════════════════════════════════════

const ANGRIFFE = [
    ['Attributausbruch ueber "',       'x" onmouseover=alert(1) y="'],
    ['Attributausbruch mit \\"',       'x\\" onmouseover=alert(1) y=\\"'],
    ['Zeichenkettenausbruch ueber \'', "x'); alert(1); ('"],
    ['Tag-Einschleusung',              '<script>alert(1)</script>'],
    ['Adresse mit javascript:',        'javascript:alert(1)'],
    ['Ereignisattribut im Namen',      '" onerror="alert(1)'],
    ['Tagabbruch',                     '"><img src=x onerror=alert(1)>'],
    ['Rueckstrich am Ende',            'Ende\\'],
    ['kaufmaennisches Und',            'Farfetch&d &quot; &amp;'],
    ['Zeilenumbruch',                  'a\nb\rc'],
    ['gewoehnlicher Genitiv',          "Boss's Orders"],
    ['typografischer Genitiv',         'N’s Zoroark ex'],
];

// ══════════════════════════════════════════════════════════════════
// (1) DIE REIHENFOLGE — welche Verschachtelung ist die richtige
// ══════════════════════════════════════════════════════════════════

describe('F4 — die Reihenfolge der Maskierung, gemessen', () => {
    it('escapeJsStr ALLEIN bricht aus dem Attribut aus (der Befund, app-core.js:947)', () => {
        const name = 'x" onmouseover=alert(1) y="';
        const markup = `<button class="btn-remove" onclick="removeCardFromProxy('${escapeJsStr(name)}', '', '')">x</button>`;
        const attrs = startTagAttribute(markup);
        assert.deepEqual(ereignisAttribute(attrs), ['onclick', 'onmouseover'],
            'genau das ist der Befund: ein zweiter Ereignishaken entsteht');
        assert.equal(attrs.find(a => a.name === 'onmouseover').wert, 'alert(1)');
    });

    it('A = escapeHtmlAttr(escapeJsStr(x)) — ein Attribut, der Wert kommt heil an', () => {
        const name = 'x" onmouseover=alert(1) y="';
        const markup = `<button class="btn-remove" onclick="removeCardFromProxy('${escapeHtmlAttr(escapeJsStr(name))}', '', '')">x</button>`;
        const attrs = startTagAttribute(markup);
        assert.deepEqual(ereignisAttribute(attrs), ['onclick'], 'nur ein Ereignishaken');
        const { gesehen, fehler } = jsLauf(attrs.find(a => a.name === 'onclick').wert);
        assert.equal(fehler, null);
        assert.deepEqual(gesehen, [['removeCardFromProxy', name, '', '']]);
    });

    it('B = escapeJsStr(escapeHtmlAttr(x)) ist FALSCH HERUM — Beleg an "Boss\'s Orders"', () => {
        const name = "Boss's Orders";
        const markupB = `<button onclick="removeCardFromProxy('${escapeJsStr(escapeHtmlAttr(name))}', '', '')">x</button>`;
        assert.equal((markupB.match(/"/g) || []).length, 2,
            'am Zaehlen der Anfuehrungszeichen ist B nicht zu erkennen');
        const b = jsLauf(startTagAttribute(markupB).find(a => a.name === 'onclick').wert);
        assert.ok(/^SyntaxError/.test(String(b.fehler)),
            'B zerbricht an einem gewoehnlichen Kartennamen, gemessen: ' + b.fehler);

        const markupA = `<button onclick="removeCardFromProxy('${escapeHtmlAttr(escapeJsStr(name))}', '', '')">x</button>`;
        const a = jsLauf(startTagAttribute(markupA).find(x => x.name === 'onclick').wert);
        assert.equal(a.fehler, null);
        assert.deepEqual(a.gesehen, [['removeCardFromProxy', "Boss's Orders", '', '']]);
    });

    it('B fuehrt eingeschleustes JS aus — escapeHtmlAttr macht ein \' unsichtbar fuer escapeJsStr', () => {
        const name = "x'); alert(1); ('";
        const b = jsLauf(startTagAttribute(
            `<button onclick="removeCardFromProxy('${escapeJsStr(escapeHtmlAttr(name))}', '', '')">x</button>`
        ).find(a => a.name === 'onclick').wert);
        assert.ok(b.gesehen.some(e => e[0] === 'alert'),
            'B fuehrt den eingeschleusten alert(1) aus');

        const a = jsLauf(startTagAttribute(
            `<button onclick="removeCardFromProxy('${escapeHtmlAttr(escapeJsStr(name))}', '', '')">x</button>`
        ).find(x => x.name === 'onclick').wert);
        assert.equal(a.gesehen.some(e => e[0] === 'alert'), false, 'A nicht');
        assert.deepEqual(a.gesehen, [['removeCardFromProxy', name, '', '']]);
    });

    it('DOPPELT maskieren zeigt dem Nutzer &amp;quot; — deshalb nicht zweimal escapeHtmlAttr', () => {
        const einfach = escapeHtmlAttr('Farfetch"d');
        const doppelt = escapeHtmlAttr(escapeHtmlAttr('Farfetch"d'));
        assert.equal(einfach, 'Farfetch&quot;d');
        assert.equal(doppelt, 'Farfetch&amp;quot;d');
        const [attr] = startTagAttribute(`<div title="${doppelt}"></div>`);
        assert.equal(attr.wert, 'Farfetch&quot;d', 'der Nutzer saehe die Entitaet als Text');
        const [ok] = startTagAttribute(`<div title="${einfach}"></div>`);
        assert.equal(ok.wert, 'Farfetch"d');
    });

    it('escapeHtmlAttr ist umkehrbar — kein Angriffsname geht durch das HTML verloren', () => {
        for (const [, name] of ANGRIFFE) {
            assert.equal(entitaetenAuf(escapeHtmlAttr(name)), name,
                `Rueckweg gebrochen bei ${JSON.stringify(name)}`);
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// (2) JEDE REPARIERTE BAUFORM DURCH BEIDE ZERTEILER
// ══════════════════════════════════════════════════════════════════

/**
 * Die Bauformen sind woertlich aus den drei Modulen uebernommen, nur die
 * Umgebung (Klassen, Titel) ist gekuerzt. `ereignisse` nennt die
 * Ereignisattribute, die der Tag tragen DARF — mehr ist ein Ausbruch.
 */
const H = (x) => escapeHtmlAttr(escapeJsStr(x));

const FORMEN = [
    // ── js/app-cards-db.js ───────────────────────────────────────
    {
        datei: 'app-cards-db.js:1659', name: 'Autocomplete-Eintrag',
        bau: (n) => `<div class="cards-autocomplete-item" role="option" tabindex="0" onclick="selectCardFromAutocomplete('${H(n)}')" onkeydown="handleCardAutocompleteKeydown(event, '${H(n)}')" aria-label="Select x from autocomplete">y</div>`,
        ereignisse: ['onclick', 'onkeydown'],
        pro: (n) => ({
            onclick: [['selectCardFromAutocomplete', n]],
            onkeydown: [['handleCardAutocompleteKeydown', '<event>', n]],
        }),
    },
    {
        datei: 'app-cards-db.js:3390', name: 'Limitless-Knopf (Prize Pack)',
        bau: (n) => `<button type="button" onclick="openLimitlessCard('${H(n)}', '${H('150')}')" class="btn-gradient-blue">Limitless</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['openLimitlessCard', n, '150']] }),
    },
    {
        datei: 'app-cards-db.js:3396/3397', name: 'Prize-Pack-Bild (onclick UND onkeydown, fuenf Werte)',
        bau: (n) => `<img src="${escapeHtmlAttr('https://x.invalid/' + n + '.png')}" alt="x" loading="lazy" decoding="async" onclick="showImageView('${H('https://x.invalid/' + n + '.png')}', '${H(n)}', '${H('https://cm.invalid/' + n)}', '${H('PPS9SVI')}', '${H('150')}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showImageView('${H('https://x.invalid/' + n + '.png')}', '${H(n)}', '${H('https://cm.invalid/' + n)}', '${H('PPS9SVI')}', '${H('150')}');}" aria-label="x">`,
        ereignisse: ['onclick', 'onkeydown'],
        pro: (n) => {
            const e = [['showImageView', 'https://x.invalid/' + n + '.png', n,
                'https://cm.invalid/' + n, 'PPS9SVI', '150']];
            return { onclick: e, onkeydown: e };
        },
        // b) src ist ein gewoehnliches Attribut: nur die HTML-Maske,
        //    und der Wert muss vollstaendig und ohne Rueckstriche ankommen.
        gewoehnlich: (n) => ({ src: 'https://x.invalid/' + n + '.png' }),
    },
    {
        datei: 'app-cards-db.js:3419', name: 'Proxy-Knopf (Prize Pack)',
        bau: (n) => `<button type="button" onclick="addCardToProxy('${H(n)}', '${H('PPS9SVI')}', '${H('150')}', 1)" class="btn-gradient-red">Proxy</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['addCardToProxy', n, 'PPS9SVI', '150', 1]] }),
    },
    {
        datei: 'app-cards-db.js:3598', name: 'Kartenkachel-Bild (src gewoehnlich, onclick als JS)',
        bau: (n) => `<img src="${escapeHtmlAttr(String('https://x.invalid/' + n + '.png'))}" alt="x" loading="lazy" decoding="async" onclick="showImageView('${H('https://x.invalid/' + n + '.png')}', '${H(n)}', '${H('https://cm.invalid/' + n)}', '${H('SVI')}', '${H('196')}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showImageView('${H('https://x.invalid/' + n + '.png')}', '${H(n)}', '${H('https://cm.invalid/' + n)}', '${H('SVI')}', '${H('196')}');}" aria-label="x">`,
        ereignisse: ['onclick', 'onkeydown'],
        pro: (n) => {
            const e = [['showImageView', 'https://x.invalid/' + n + '.png', n,
                'https://cm.invalid/' + n, 'SVI', '196']];
            return { onclick: e, onkeydown: e };
        },
        gewoehnlich: (n) => ({ src: 'https://x.invalid/' + n + '.png' }),
    },
    {
        datei: 'app-cards-db.js:3621', name: 'Proxy-Knopf (Kartenkachel, Set und Nummer aus den Daten)',
        bau: (n) => `<button type="button" onclick="addCardToProxy('${H(n)}', '${H(n)}', '${H('196')}', 1)" class="btn-gradient-red">Proxy</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['addCardToProxy', n, n, '196', 1]] }),
    },
    {
        datei: 'app-cards-db.js:4558', name: 'Druckwaehler — Anzeigedruck waehlen (fuenf Werte)',
        bau: (n) => `<button class="btn btn-primary rarity-option-swap-all-btn" onclick="event.stopPropagation(); waehleAnzeigeDruck('${H(n)}', '${H('SVI')}', '${H('196')}', '${H('PAF')}', '${H('001')}')" title="x">y</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['waehleAnzeigeDruck', n, 'SVI', '196', 'PAF', '001']] }),
    },
    {
        datei: 'app-cards-db.js:4563', name: 'Druckwaehler — Version tauschen (fuenf Werte)',
        bau: (n) => `<button class="btn btn-primary" onclick="event.stopPropagation(); selectRarityVersion('${H('PAF')}', '${H('001')}', '${H(n)}', '${H(n)}', '${H('cityLeague')}')" title="x">y</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['selectRarityVersion', 'PAF', '001', n, n, 'cityLeague']] }),
    },
    {
        datei: 'app-cards-db.js:4569', name: 'Cardmarket-Knopf (Adresse im onclick)',
        bau: (n) => `<button class="card-database-price-btn" onclick="event.stopPropagation(); openCardmarket('${H('https://cm.invalid/' + n)}', '');" title="x">€</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['openCardmarket', 'https://cm.invalid/' + n, '']] }),
    },
    {
        datei: 'app-cards-db.js:4599/4600', name: 'Prize-Pack-Kachel im Druckwaehler (Aufruf hinter typeof-Pruefung)',
        bau: (n) => `<div style="position:relative;display:block;cursor:zoom-in;" onclick="if(typeof showImageView==='function')showImageView('${H('https://x.invalid/' + n)}','${H(n)}','','','')">x</div>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['showImageView', 'https://x.invalid/' + n, n, '', '', '']] }),
    },

    // ── js/app-core.js ───────────────────────────────────────────
    {
        datei: 'app-core.js:945-947', name: 'Proxy-Warteschlange — Entfernen-Knopf',
        bau: (n) => `<button class="btn-remove" onclick="removeCardFromProxy('${H(n)}', '${H('SVI')}', '${H('196')}')">Entfernen</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['removeCardFromProxy', n, 'SVI', '196']] }),
    },
    {
        datei: 'app-core.js:945-947', name: 'Proxy-Warteschlange — Mengeneingabe (onchange mit this.value)',
        bau: (n) => `<input type="number" min="1" value="2" onchange="setProxyCardCount('${H(n)}', '${H('SVI')}', '${H('196')}', this.value)">`,
        ereignisse: ['onchange'],
        pro: (n) => ({ onchange: [['setProxyCardCount', n, 'SVI', '196', '3']] }),
    },
    {
        datei: 'app-core.js:945-947', name: 'Proxy-Warteschlange — Plus-Knopf (Zahl als vierter Wert)',
        bau: (n) => `<button class="btn-plus" onclick="setProxyCardCount('${H(n)}', '${H('SVI')}', '${H('196')}', 3)">+</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['setProxyCardCount', n, 'SVI', '196', 3]] }),
    },

    // ── js/meta-binder.js ────────────────────────────────────────
    {
        datei: 'meta-binder.js:1678/1690', name: 'Archetypbanner im Meta-Binder',
        bau: (n) => `<div class="deck-banner-card" onclick="navigateToAnalysisWithDeck('${escapeHtmlAttr(escapeArchetypeForJs(n))}')">x</div>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['navigateToAnalysisWithDeck', n]] }),
    },
    {
        datei: 'meta-binder.js:2022', name: 'Druckwaehler-Knopf im Meta-Binder (drei Werte)',
        bau: (n) => `<button type="button" class="meta-binder-prints-btn" onclick="openRaritySwitcherFromDB('${escapeHtmlAttr(escapeArchetypeForJs(n))}','${escapeHtmlAttr(escapeArchetypeForJs(String('SVI')))}','${escapeHtmlAttr(escapeArchetypeForJs(String('196')))}')" title="x">y</button>`,
        ereignisse: ['onclick'],
        pro: (n) => ({ onclick: [['openRaritySwitcherFromDB', n, 'SVI', '196']] }),
    },
];

describe('F4 — Einschleusungsversuche durch jede reparierte Bauform', () => {
    for (const form of FORMEN) {
        for (const [was, name] of ANGRIFFE) {
            it(`${form.datei} ${form.name} — ${was}`, () => {
                const markup = form.bau(name);
                const attrs = startTagAttribute(markup);

                // (a) GENAU die vorgesehenen Ereignisattribute, kein weiteres.
                assert.deepEqual(ereignisAttribute(attrs), form.ereignisse,
                    'ein Ereignisattribut ist dazugekommen: ' + markup);

                // (b) Keine Adresse traegt eine javascript:-Nutzlast, und
                //     die gewoehnlichen Attribute kommen unverfaelscht an.
                const erwarteteGewoehnliche = form.gewoehnlich ? form.gewoehnlich(name) : {};
                for (const a of attrs) {
                    const kl = a.name.toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(erwarteteGewoehnliche, kl)) {
                        // Gleichheit ist die schaerfere Zusicherung: haette
                        // hier escapeJsStr gestanden, saessen zusaetzliche
                        // Rueckstriche im Wert (und ein " haette das
                        // Attribut beendet — dann waere schon (a) gefallen).
                        assert.equal(a.wert, erwarteteGewoehnliche[kl],
                            `${a.name} ist kein gewoehnliches Attribut mehr — Wert verfaelscht`);
                        continue;
                    }
                    if (!['href', 'src', 'xlink:href'].includes(kl)) continue;
                    assert.equal(/^\s*javascript:/i.test(a.wert), false,
                        `${a.name} traegt eine javascript:-Adresse`);
                }

                // (c) Kein <script> und kein zusaetzlicher Tag entstanden.
                assert.equal(/<script/i.test(markup), false, 'ein <script> ist entstanden');
                assert.equal((markup.match(/</g) || []).length,
                             (markup.match(/>/g) || []).length,
                             'Tagklammern gehen nicht mehr auf');

                // (d) Jeder Ereignisattributwert ist gueltiges JS, fuehrt
                //     nichts Fremdes aus und liefert den Wert unveraendert.
                const erwartet = form.pro(name);
                for (const attrName of form.ereignisse) {
                    const treffer = attrs.filter(a => a.name.toLowerCase() === attrName);
                    assert.equal(treffer.length, 1, `${attrName} genau einmal erwartet`);
                    const { gesehen, fehler } = jsLauf(treffer[0].wert);
                    assert.equal(fehler, null, `${attrName} ist kein gueltiges JS mehr`);
                    assert.equal(gesehen.some(e => e[0] === 'alert'), false,
                        `${attrName}: ein eingeschleustes alert(1) wurde ausgefuehrt`);
                    assert.deepEqual(gesehen, erwartet[attrName],
                        `${attrName}: der Wert kommt nicht unveraendert an`);
                }
            });
        }
    }
});

// ══════════════════════════════════════════════════════════════════
// (3) FALL b — GEWOEHNLICHE ATTRIBUTE VERTRAGEN KEIN escapeJsStr
// ══════════════════════════════════════════════════════════════════

describe('F4 — gewoehnliche Attribute: escapeJsStr waere dort der falsche Maskierer', () => {
    it('escapeJsStr in einem src bricht aus UND verfaelscht den Wert', () => {
        const url = 'https://x.invalid/a"b\'c.png';
        const falsch = `<img src="${escapeJsStr(url)}" alt="x">`;
        const attrsF = startTagAttribute(falsch);
        assert.notEqual(attrsF[0].wert, url,
            'escapeJsStr laesst das " durch — der Wert bricht ab');
        assert.ok(attrsF.length > 2, 'aus dem Rest entstehen weitere Attribute: '
            + attrsF.map(a => a.name).join(','));

        const richtig = `<img src="${escapeHtmlAttr(String(url || ''))}" alt="x">`;
        const attrsR = startTagAttribute(richtig);
        assert.deepEqual(attrsR.map(a => a.name), ['src', 'alt']);
        assert.equal(attrsR[0].wert, url, 'der Wert kommt vollstaendig an');
    });

    it('data-set / data-number im Druckwaehler: HTML-Maske, keine Rueckstriche', () => {
        const set = 'SV"I';
        const markup = `<input type="number" class="rarity-option-qty-input" data-set="${escapeHtmlAttr(set)}" data-number="${escapeHtmlAttr('196')}" onclick="event.stopPropagation();">`;
        const attrs = startTagAttribute(markup);
        assert.deepEqual(ereignisAttribute(attrs), ['onclick'], 'kein zusaetzlicher Ereignishaken');
        assert.equal(attrs.find(a => a.name === 'data-set').wert, set,
            'der Wert wird spaeter verglichen und muss unveraendert sein');
        assert.equal(/\\/.test(attrs.find(a => a.name === 'data-set').wert), false);
    });
});

// ══════════════════════════════════════════════════════════════════
// (4) DIE QUELLEN — jede Stelle in den drei Dateien
// ══════════════════════════════════════════════════════════════════

/*
 * Die Zusicherungen oben pruefen die BAUFORM. Diese hier pruefen, dass
 * die drei Module sie auch benutzen — an JEDER Stelle. Wird eine
 * einzige Stelle auf escapeJsStr allein zurueckgedreht, faellt sie um.
 *
 * Stand 07.09.2026, nachgezaehlt (Kommentarzeilen zaehlen nicht mit):
 *   js/app-cards-db.js  37   js/app-core.js  3   js/meta-binder.js  1
 * Die eine Stelle in js/meta-binder.js ist der Helfer
 * escapeArchetypeForJs selbst — Fall c: sein Rueckgabewert ist noch
 * kein Attributwert. Gehuellt wird an seinen Aufrufstellen.
 */
const ohneKommentare = (datei) => lies(datei).split('\n')
    .filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');

const ERWARTET = {
    'app-cards-db.js': 37,
    'app-core.js': 3,
};

describe('F4 — die Quellen maskieren an jeder Stelle in beiden Sprachen', () => {
    for (const [datei, anzahl] of Object.entries(ERWARTET)) {
        it(`${datei} — jede escapeJsStr steckt in einer escapeHtmlAttr`, () => {
            const code = ohneKommentare(datei);
            const alle = (code.match(/escapeJsStr\(/g) || []).length;
            const gehuellt = (code.match(/(?:window\.)?escapeHtmlAttr\(escapeJsStr\(/g) || []).length;
            assert.equal(alle, anzahl, `Anzahl der Stellen hat sich geaendert (${alle})`);
            assert.equal(gehuellt, anzahl,
                `${alle - gehuellt} Stelle(n) maskieren nur fuer JS — der HTML-Zerteiler laeuft davor`);
        });
    }

    it('meta-binder.js — escapeJsStr nur im Helfer, jede Aufrufstelle gehuellt', () => {
        const code = ohneKommentare('meta-binder.js');
        assert.equal((code.match(/escapeJsStr\(/g) || []).length, 1,
            'escapeJsStr steht in meta-binder.js nur im Helfer escapeArchetypeForJs');
        assert.ok(/function escapeArchetypeForJs\(value\) \{\s*\n\s*if \(typeof escapeJsStr === 'function'\) return escapeJsStr\(value\);/.test(code),
            'der Helfer sieht nicht mehr aus wie erwartet');
        // Jedes Vorkommen ausser der Deklaration ist ein Aufruf in einem
        // HTML-Attribut und muss in escapeHtmlAttr stecken.
        const alle = (code.match(/escapeArchetypeForJs\(/g) || []).length;
        const deklaration = (code.match(/function escapeArchetypeForJs\(/g) || []).length;
        const gehuellt = (code.match(/escapeHtmlAttr\(escapeArchetypeForJs\(/g) || []).length;
        assert.equal(deklaration, 1);
        assert.equal(alle - deklaration, gehuellt,
            `${alle - deklaration - gehuellt} Aufrufstelle(n) ohne HTML-Maske`);
        assert.ok(gehuellt >= 4, 'es waren vier Aufrufstellen');
    });

    for (const datei of ['app-cards-db.js', 'app-core.js', 'meta-binder.js']) {
        it(`${datei} — weder doppelt maskiert noch falsch herum`, () => {
            const code = ohneKommentare(datei);
            // `window.` davor ist dieselbe Funktion — app-core.js ruft sie so auf.
            const W = '(?:window\\.)?';
            const zaehl = (muster) => (code.match(new RegExp(muster, 'g')) || []).length;
            assert.equal(zaehl(`${W}escapeHtmlAttr\\(\\s*${W}escapeHtmlAttr\\(`), 0,
                'doppelt maskiert — der Nutzer saehe die Entitaet als Text');
            assert.equal(zaehl(`${W}escapeHtmlAttr\\(\\s*${W}escapeHtml\\(`), 0,
                'escapeHtml IST escapeHtmlAttr — doppelt maskiert');
            assert.equal(zaehl(`${W}escapeHtml\\(\\s*${W}escapeHtmlAttr\\(`), 0,
                'doppelt maskiert');
            assert.equal(zaehl(`escapeJsStr\\(\\s*${W}escapeHtml(?:Attr)?\\(`), 0,
                'falsche Reihenfolge — escapeHtmlAttr INNEN bricht an jedem Apostroph');
            assert.equal(zaehl('escapeJsStr\\(\\s*escapeJsStr\\('), 0,
                'zweimal fuer JS maskiert — ein Rueckstrich zu viel');
            assert.equal(zaehl(`escapeArchetypeForJs\\(\\s*${W}escapeHtml(?:Attr)?\\(`), 0,
                'falsche Reihenfolge beim Archetyp-Helfer');
        });
    }

    it('app-cards-db.js — src der Kartenkachel traegt die HTML-Maske, nicht die JS-Maske', () => {
        // Fall b. Der Wert stand vorher als escapeJsStr(card.image_url) im
        // src UND im onclick — ein Wert kann nicht beides sein.
        const code = ohneKommentare('app-cards-db.js');
        assert.ok(/const attrImageUrl = escapeHtmlAttr\(String\(card\.image_url \|\| ''\)\);/.test(code),
            'attrImageUrl fehlt oder maskiert nicht mehr fuer HTML');
        assert.ok(/<img src="\$\{attrImageUrl\}"/.test(code),
            'das src der Kartenkachel nimmt wieder den JS-maskierten Wert');
        const m = /data-set="\$\{([^}]*)\}"/.exec(code);
        assert.ok(m, 'data-set im Druckwaehler nicht mehr gefunden');
        assert.equal(/escapeJsStr/.test(m[1]), false,
            'data-set maskiert fuer JS — es wird nie als JS gelesen');
        assert.ok(/escapeHtmlAttr\(/.test(m[1]), 'data-set ohne HTML-Maske');
    });
});
