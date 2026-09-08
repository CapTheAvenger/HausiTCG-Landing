/**
 * Bereinigung und Proxy-Druckliste — ausgefuehrt, nicht gegriffen.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross. Ihr Name behauptete Abdeckung
 * fuer die Bereinigung UND fuer die Druckliste; `node --test` meldete
 * darauf `# pass 1`. scripts/run-js-unit-tests.sh zaehlt leere Dateien
 * seit dem 30.08.2026 nicht mehr mit und benennt sie namentlich — diese
 * Datei ist die Antwort darauf.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Keine der geprueften Funktionen ist umbenannt worden; sie sind nur
 * ueber drei Dateien verteilt. Fundorte, Stand 07.09.2026:
 *
 *   sanitizeDeckDependencies  js/app-utils.js:706
 *   escapeHtmlAttr            js/app-utils.js:349
 *   escapeJsStr               js/app-utils.js:362
 *   normalizeProxySetCode     js/app-core.js:469
 *   normalizeProxyCardNumber  js/app-core.js:475
 *   buildProxyItemId          js/app-core.js:481
 *   parseProxyCount           js/app-core.js:485
 *   getProxyQueueTotals       js/app-core.js:817
 *   _sanitizeScraperHtml      js/app-meta-cards.js:1388
 *
 * DREI SORTEN ZUSICHERUNG
 * -----------------------
 * (1) DIE ABHAENGIGKEITSBEREINIGUNG: Rare Candy darf nur ins Deck, wenn
 *     eine Stufe-2-Karte dabei ist, und hoechstens dreimal.
 * (2) DIE DRUCKLISTE: was in "x Karten / y Exemplare" landet, und wie
 *     unbrauchbare Anzahlen behandelt werden.
 * (3) EINSCHLEUSUNGSVERSUCHE. Der vom Scraper erzeugte Vergleichsblock
 *     geht ueber innerHTML in den Baum; _sanitizeScraperHtml() ist die
 *     Sperre davor. Geprueft wird an echten Angriffsformen: <script>,
 *     javascript:-Adressen und Ereignisattribute muessen weg sein,
 *     harmlose Attribute muessen bleiben.
 *
 * KEIN jsdom
 * ----------
 * .github/workflows/deploy-pages.yml installiert nur papaparse. Der
 * Knotenbaum weiter unten ist deshalb selbst gebaut und kann genau das,
 * was _sanitizeScraperHtml() anfasst — nicht mehr. Er PARST kein HTML;
 * der Test baut den Baum von Hand, damit nichts erfunden wird.
 * Livedaten liest diese Datei nicht; jede Eingabe setzt sie selbst.
 */

const { describe, it, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (datei) => fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8');

/** Eine Funktionsdeklaration per Namen aus `src` schneiden (Klammerzaehlung). */
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

// ══════════════════════════════════════════════════════════════════
// (1) sanitizeDeckDependencies — js/app-utils.js
// ══════════════════════════════════════════════════════════════════

const UTILS = lies('app-utils.js');

const REINIGER = (() => {
    const kasten = {
        String, Number, Object, Array, Math, RegExp,
        console: { log() {}, warn() {} },
        // normalizeCardName kommt aus derselben Datei und wird gebraucht.
        LEGACY_CARD_NAME_ALIASES: {},
        fixMojibake: (v) => (v === null || v === undefined) ? '' : String(v).trim(),
        getLegacyCardNameAlias: () => '',
    };
    vm.createContext(kasten);
    vm.runInContext(
        funktion(UTILS, 'normalizeCardName', 'app-utils.js') + '\n'
        + funktion(UTILS, 'sanitizeDeckDependencies', 'app-utils.js') + '\n'
        + funktion(UTILS, 'escapeHtmlAttr', 'app-utils.js') + '\n'
        + funktion(UTILS, 'escapeJsStr', 'app-utils.js'),
        kasten);
    return kasten;
})();

const namen = (liste) => liste.map(e => REINIGER.normalizeCardName(e.card_name));

describe('sanitizeDeckDependencies — Rare Candy braucht eine Stufe 2', () => {
    it('ohne Stufe-2-Karte fliegt Rare Candy raus, der Rest bleibt', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Pikachu', type: 'Basic' },
            { card_name: 'Rare Candy', type: 'Item' },
            { card_name: "Boss's Orders", type: 'Supporter' },
        ]);
        assert.equal(raus.length, 2);
        assert.equal(namen(raus).includes('rare candy'), false);
        assert.deepEqual(namen(raus), ['pikachu', "boss's orders"]);
    });

    it('mit Stufe-2-Karte bleibt Rare Candy drin', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', type: 'Stage 2' },
            { card_name: 'Rare Candy', type: 'Item' },
        ]);
        assert.equal(raus.length, 2);
        assert.equal(namen(raus).includes('rare candy'), true);
    });

    it('das Feld heisst wahlweise type oder card_type — beide werden gelesen', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', card_type: 'Stage 2 Pokemon' },
            { card_name: 'Rare Candy', card_type: 'Item' },
        ]);
        assert.equal(namen(raus).includes('rare candy'), true);
    });

    it('die Schreibweise der Stufe ist egal', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', type: 'STAGE 2' },
            { card_name: 'Rare Candy', type: 'Item' },
        ]);
        assert.equal(namen(raus).includes('rare candy'), true);
    });

    it('mehr als drei Rare Candy werden auf drei gedeckelt', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', type: 'Stage 2', addCount: 4 },
            { card_name: 'Rare Candy', type: 'Item', addCount: 5 },
        ]);
        const rc = raus.find(e => REINIGER.normalizeCardName(e.card_name) === 'rare candy');
        assert.equal(rc.addCount, 3);
        // Die Stufe-2-Karte wird NICHT gedeckelt.
        assert.equal(raus.find(e => e.card_name === 'Charizard ex').addCount, 4);
    });

    it('drei oder weniger bleiben unveraendert', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', type: 'Stage 2' },
            { card_name: 'Rare Candy', type: 'Item', addCount: 2 },
        ]);
        assert.equal(raus.find(e => e.card_name === 'Rare Candy').addCount, 2);
    });

    it('das uebergebene Feld wird nicht veraendert', () => {
        const eingang = [
            { card_name: 'Charizard ex', type: 'Stage 2' },
            { card_name: 'Rare Candy', type: 'Item', addCount: 9 },
        ];
        REINIGER.sanitizeDeckDependencies(eingang);
        assert.equal(eingang[1].addCount, 9, 'der Aufrufer haelt noch seine 9');
    });

    it('leere Eingabe, null und undefined ergeben eine leere Liste', () => {
        // Die Felder stammen aus dem vm-Realm; deepEqual vergleicht auch
        // den Prototyp. Also ueber die Laenge pruefen.
        assert.equal(REINIGER.sanitizeDeckDependencies([]).length, 0);
        assert.equal(REINIGER.sanitizeDeckDependencies(null).length, 0);
        assert.equal(REINIGER.sanitizeDeckDependencies(undefined).length, 0);
        assert.equal(REINIGER.sanitizeDeckDependencies('kein Feld').length, 0);
    });

    it('null-Eintraege im Feld werfen nicht, sie werden verworfen', () => {
        const raus = REINIGER.sanitizeDeckDependencies([
            null, { card_name: 'Pikachu', type: 'Basic' }, undefined,
        ]);
        assert.equal(raus.length, 1);
    });

    it('doppelte Rare-Candy-Eintraege: die Deckelung fasst nur den ersten', () => {
        // Dokumentierte Grenze: .find() nimmt den ersten Treffer. Wer die
        // Deckelung auf alle Eintraege ausweiten will, muss hier vorbei.
        const raus = REINIGER.sanitizeDeckDependencies([
            { card_name: 'Charizard ex', type: 'Stage 2' },
            { card_name: 'Rare Candy', type: 'Item', addCount: 9 },
            { card_name: 'Rare Candy', type: 'Item', addCount: 9 },
        ]);
        const rcs = raus.filter(e => REINIGER.normalizeCardName(e.card_name) === 'rare candy');
        assert.equal(rcs.length, 2);
        assert.equal(rcs[0].addCount, 3);
        assert.equal(rcs[1].addCount, 9);
    });
});

// ══════════════════════════════════════════════════════════════════
// (2) Die Proxy-Druckliste — js/app-core.js
// ══════════════════════════════════════════════════════════════════

const CORE = lies('app-core.js');

const PROXY = (() => {
    const kasten = {
        String, Number, Object, Array, Math, parseInt,
        window: { proxyQueue: [] },
        console: { log() {}, warn() {} },
    };
    vm.createContext(kasten);
    vm.runInContext(
        ['normalizeProxySetCode', 'normalizeProxyCardNumber', 'buildProxyItemId',
         'parseProxyCount', 'getProxyQueueTotals']
            .map(n => funktion(CORE, n, 'app-core.js')).join('\n'),
        kasten);
    return kasten;
})();

const totale = (queue) => { PROXY.window.proxyQueue = queue; return PROXY.getProxyQueueTotals(); };

describe('parseProxyCount — die Anzahl je Zeile der Druckliste', () => {
    it('liest Zahlen und Zahlentext', () => {
        assert.equal(PROXY.parseProxyCount(3), 3);
        assert.equal(PROXY.parseProxyCount('4'), 4);
    });

    it('schneidet Nachkommastellen ab statt zu runden', () => {
        assert.equal(PROXY.parseProxyCount('2.9'), 2);
    });

    it('null, undefined und Unsinn fallen auf den Ersatzwert', () => {
        assert.equal(PROXY.parseProxyCount(null), 1);
        assert.equal(PROXY.parseProxyCount(undefined), 1);
        assert.equal(PROXY.parseProxyCount('viele'), 1);
        assert.equal(PROXY.parseProxyCount({}), 1);
    });

    it('0 und negative Werte gelten als unbrauchbar', () => {
        assert.equal(PROXY.parseProxyCount(0), 1);
        assert.equal(PROXY.parseProxyCount(-5), 1);
        // Der Ersatzwert ist einstellbar — die Bilanz nutzt 0.
        assert.equal(PROXY.parseProxyCount(-5, 0), 0);
    });
});

describe('getProxyQueueTotals — "x Karten, y Exemplare" unter der Liste', () => {
    it('zaehlt Zeilen und summiert die Exemplare', () => {
        const t = totale([{ count: 2 }, { count: 3 }, { count: 1 }]);
        assert.equal(t.uniqueCards, 3);
        assert.equal(t.totalCopies, 6);
    });

    it('leere Liste ergibt 0 und 0', () => {
        const t = totale([]);
        assert.deepEqual({ u: t.uniqueCards, c: t.totalCopies }, { u: 0, c: 0 });
    });

    it('Zahlentext wird mitgezaehlt', () => {
        assert.equal(totale([{ count: '4' }]).totalCopies, 4);
    });

    it('unbrauchbare Anzahlen zaehlen als 0 — die Summe wird nicht NaN', () => {
        const t = totale([{ count: 'viele' }, { count: -3 }, { count: 2 }]);
        assert.equal(t.totalCopies, 2);
        assert.equal(Number.isNaN(t.totalCopies), false);
        // Die Zeile bleibt trotzdem eine Zeile.
        assert.equal(t.uniqueCards, 3);
    });

    it('eine Zeile ohne count-Feld zaehlt als 0 Exemplare', () => {
        assert.equal(totale([{ name: 'Iono' }]).totalCopies, 0);
    });
});

describe('buildProxyItemId — zwei Drucke derselben Karte sind zwei Zeilen', () => {
    it('Set und Nummer gehen in die Kennung ein', () => {
        assert.notEqual(
            PROXY.buildProxyItemId('Ultra Ball', 'SVI', '196'),
            PROXY.buildProxyItemId('Ultra Ball', 'PAF', '91')
        );
    });

    it('Schreibweise von Name und Set ist egal — dieselbe Zeile', () => {
        assert.equal(
            PROXY.buildProxyItemId('Ultra Ball', 'svi', '196'),
            PROXY.buildProxyItemId('  ULTRA BALL  ', 'SVI', '196')
        );
    });

    it('die Platzhalter "???" und "?" gelten als "unbekannt", nicht als Wert', () => {
        assert.equal(
            PROXY.buildProxyItemId('Iono', '???', '?'),
            PROXY.buildProxyItemId('Iono', '', '')
        );
        assert.equal(PROXY.normalizeProxySetCode('???'), '');
        assert.equal(PROXY.normalizeProxyCardNumber('?'), '');
    });

    it('null und undefined ergeben leere Bestandteile, keine Textbrocken', () => {
        assert.equal(PROXY.buildProxyItemId(null, null, null), '||');
        assert.equal(PROXY.buildProxyItemId(undefined, undefined, undefined), '||');
    });

    it('die Kartennummer behaelt ihre Schreibweise (185a ist nicht 185A)', () => {
        assert.equal(PROXY.normalizeProxyCardNumber('185a'), '185a');
    });
});

// ══════════════════════════════════════════════════════════════════
// (3) EINSCHLEUSUNGSVERSUCHE
// ══════════════════════════════════════════════════════════════════

/**
 * Der kleinste Knotenbaum, den _sanitizeScraperHtml() braucht.
 *
 * Angefasst werden dort genau vier Dinge: querySelectorAll mit der
 * festen Liste 'script, iframe, object, embed' und mit '*', .remove(),
 * .attributes (Name und Wert) und .removeAttribute(). Mehr kann dieser
 * Baum nicht, und er PARST kein HTML — der Test baut ihn von Hand,
 * damit keine Struktur erfunden wird, die es im Browser nicht gaebe.
 */
function knoten(tag, attrs = {}, kinder = []) {
    const self = {
        tagName: String(tag).toUpperCase(),
        kinder: [],
        eltern: null,
        _attr: new Map(Object.entries(attrs).map(([k, v]) => [k, String(v)])),
    };
    Object.defineProperty(self, 'attributes', {
        get: () => [...self._attr].map(([name, value]) => ({ name, value })),
    });
    self.getAttribute = (n) => (self._attr.has(n) ? self._attr.get(n) : null);
    self.removeAttribute = (n) => { self._attr.delete(n); };
    self.remove = () => {
        if (!self.eltern) return;
        const i = self.eltern.kinder.indexOf(self);
        if (i >= 0) self.eltern.kinder.splice(i, 1);
        self.eltern = null;
    };
    self._alle = () => self.kinder.flatMap(k => [k, ...k._alle()]);
    self.querySelectorAll = (wahl) => {
        const alle = self._alle();
        if (wahl.trim() === '*') return alle;
        const tags = wahl.split(',').map(s => s.trim().toUpperCase());
        return alle.filter(k => tags.includes(k.tagName));
    };
    kinder.forEach(k => { k.eltern = self; self.kinder.push(k); });
    return self;
}

const REINIGER_HTML = (() => {
    const kasten = { String, Array, Object, console: { warn() {} } };
    vm.createContext(kasten);
    vm.runInContext(
        funktion(lies('app-meta-cards.js'), '_sanitizeScraperHtml', 'app-meta-cards.js'),
        kasten);
    return kasten._sanitizeScraperHtml;
})();

describe('_sanitizeScraperHtml — Einschleusungsversuche im Scraper-Block', () => {
    it('<script> wird aus dem Baum entfernt', () => {
        const wurzel = knoten('div', {}, [
            knoten('script', {}, []),
            knoten('p', {}, []),
        ]);
        REINIGER_HTML(wurzel);
        assert.deepEqual(wurzel.kinder.map(k => k.tagName), ['P']);
    });

    it('iframe, object und embed fliegen ebenfalls raus', () => {
        const wurzel = knoten('div', {}, [
            knoten('iframe', { src: 'https://beispiel.invalid' }),
            knoten('object', {}), knoten('embed', {}), knoten('table', {}),
        ]);
        REINIGER_HTML(wurzel);
        assert.deepEqual(wurzel.kinder.map(k => k.tagName), ['TABLE']);
    });

    it('auch tief verschachtelt — nicht nur auf der obersten Ebene', () => {
        const tief = knoten('script', {});
        const wurzel = knoten('div', {}, [knoten('div', {}, [knoten('td', {}, [tief])])]);
        assert.equal(wurzel.querySelectorAll('script, iframe, object, embed').length, 1);
        REINIGER_HTML(wurzel);
        assert.equal(wurzel.querySelectorAll('script, iframe, object, embed').length, 0);
    });

    it('JEDES Ereignisattribut wird entfernt, nicht nur onclick', () => {
        const el = knoten('img', {
            src: 'x', onerror: 'alert(1)', onclick: 'alert(2)',
            onmouseover: 'alert(3)', ONLOAD: 'alert(4)',
        });
        REINIGER_HTML(knoten('div', {}, [el]));
        assert.equal(el.getAttribute('onerror'), null);
        assert.equal(el.getAttribute('onclick'), null);
        assert.equal(el.getAttribute('onmouseover'), null);
        assert.equal(el.getAttribute('ONLOAD'), null, 'Grossschreibung darf nicht durchrutschen');
        assert.equal(el.attributes.filter(a => a.name.toLowerCase().startsWith('on')).length, 0);
    });

    it('javascript:-Adressen werden aus href, src und xlink:href entfernt', () => {
        const a = knoten('a', { href: 'javascript:alert(1)' });
        const img = knoten('img', { src: 'JavaScript:alert(2)' });
        const use = knoten('use', { 'xlink:href': '  javascript:alert(3)' });
        REINIGER_HTML(knoten('div', {}, [a, img, use]));
        assert.equal(a.getAttribute('href'), null);
        assert.equal(img.getAttribute('src'), null, 'Grossschreibung darf nicht durchrutschen');
        assert.equal(use.getAttribute('xlink:href'), null, 'fuehrende Leerzeichen ebensowenig');
    });

    it('harmlose Adressen und Attribute bleiben unangetastet', () => {
        const a = knoten('a', { href: 'https://limitlesstcg.com/x', class: 'link', title: 'Iono' });
        const img = knoten('img', { src: './images/x.png', alt: 'Iono' });
        REINIGER_HTML(knoten('div', {}, [a, img]));
        assert.equal(a.getAttribute('href'), 'https://limitlesstcg.com/x');
        assert.equal(a.getAttribute('class'), 'link');
        assert.equal(a.getAttribute('title'), 'Iono');
        assert.equal(img.getAttribute('src'), './images/x.png');
        assert.equal(img.getAttribute('alt'), 'Iono');
    });

    it('ein "javascript:" MITTEN in der Adresse ist keine Adresse — und bleibt', () => {
        // Nur der Anfang zaehlt; "?q=javascript:" ist ein Suchparameter.
        const a = knoten('a', { href: 'https://x.invalid/?q=javascript:alert(1)' });
        REINIGER_HTML(knoten('div', {}, [a]));
        assert.equal(a.getAttribute('href'), 'https://x.invalid/?q=javascript:alert(1)');
    });

    it('ein leerer Baum und null werfen nicht', () => {
        assert.equal(REINIGER_HTML(null), null);
        const leer = knoten('div');
        assert.equal(REINIGER_HTML(leer), leer);
    });
});

describe('escapeHtmlAttr — die Sperre vor einem Attributwert', () => {
    it('ein Kartenname mit <script> wird zu Text, nicht zu einem Tag', () => {
        const name = '<script>alert(1)</script>';
        const raus = REINIGER.escapeHtmlAttr(name);
        assert.equal(raus.includes('<'), false);
        assert.equal(raus, '&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('ein Ausbruch aus title="…" gelingt nicht', () => {
        const name = '" onmouseover="alert(1)';
        const markup = `<div title="${REINIGER.escapeHtmlAttr(name)}"></div>`;
        // Genau zwei Anfuehrungszeichen im ganzen Tag: die beiden
        // Begrenzer. Der Rest steht als &quot; im Wert.
        assert.equal((markup.match(/"/g) || []).length, 2);
        assert.equal(markup, '<div title="&quot; onmouseover=&quot;alert(1)"></div>');
        // Zwei Anfuehrungszeichen heisst: es gibt GENAU EIN Attribut,
        // und alles zwischen den Begrenzern ist sein Wert. Der Text
        // "onmouseover=" steht darin, aber als Wert, nicht als Attribut.
        const wert = markup.split('"')[1];
        assert.equal(wert, REINIGER.escapeHtmlAttr(name));
        assert.equal(wert.includes('&quot;'), true, 'die Begrenzer sind Entitaeten');
    });

    it('eine javascript:-Adresse wird nicht gefiltert — sie wird nur maskiert', () => {
        // Wichtig fuer die Arbeitsteilung: escapeHtmlAttr ist KEIN
        // Adressfilter. Wer eine Adresse einsetzt, braucht zusaetzlich
        // die Pruefung aus _sanitizeScraperHtml.
        assert.equal(REINIGER.escapeHtmlAttr('javascript:alert(1)'), 'javascript:alert(1)');
    });
});

/*
 * BEFUND (07.09.2026) — BEHOBEN. Der Kommentar bleibt stehen, weil er
 * erklaert, warum die Zusicherung unten so aussieht, wie sie aussieht.
 *
 * Die Proxy- und Deckknoepfe setzten den Kartennamen mit escapeJsStr()
 * allein in ein doppelt begrenztes HTML-Attribut ein:
 *
 *   js/app-city-league.js:4215   const cardNameEscaped = escapeJsStr(cardName);
 *   js/app-city-league.js:4299   onclick="addCardToProxy('${cardNameEscaped}', …)"
 *   js/app-deck-builder.js:1991/1992, js/app-meta-cards.js, js/app-tier-meta.js ebenso.
 *
 * escapeJsStr() maskiert fuer eine JS-Zeichenkette und macht aus " ein
 * \" — im HTML-Attribut ist der Rueckstrich aber ein gewoehnliches
 * Zeichen, und das " danach BEENDET das Attribut. Der HTML-Zerteiler
 * laeuft vor dem JS-Zerteiler, also griff die Maskierung zu spaet.
 *
 *   Eingabe  cardName = 'x" onmouseover=alert(1) y="'
 *   vorher:  onclick endete nach 'x\, danach stand ein NEUES Attribut
 *            onmouseover=alert(1) im Tag (vier " statt zwei).
 *   nachher: escapeHtmlAttr(escapeJsStr(name)) — ein einziges onclick.
 *
 * WARUM DIESE REIHENFOLGE UND NICHT DIE UMGEKEHRTE
 * ------------------------------------------------
 * Beide Verschachtelungen ergeben zwei " im Tag; am Zaehlen ist die
 * Frage nicht zu entscheiden. Entschieden wird sie, wenn man beide
 * Zerteiler nacheinander laufen laesst — nachgemessen an "Boss's Orders":
 *
 *   escapeJsStr(escapeHtmlAttr(x))  -> Boss&#39;s Orders
 *       escapeJsStr findet kein ' mehr und tut nichts; der
 *       HTML-Zerteiler macht daraus DANACH wieder ein ' und die
 *       JS-Zeichenkette bricht auf -> SyntaxError.
 *   escapeHtmlAttr(escapeJsStr(x))  -> Boss\&#39;s Orders
 *       HTML loest zu \' auf, JS liest Boss's Orders. Richtig.
 *
 * Der ausfuehrliche Beleg dazu, samt Einschleusungsversuchen durch jede
 * einzelne reparierte Bauform, steht in
 * tests/unit/test-f3-attributmaskierung.js.
 *
 * EINORDNUNG: der Weg war offen, benutzt hat ihn niemand. Am 07.09.2026
 * trug keine der 20.878 Zeilen in data/all_cards_merged.json und keine
 * der 20.419 in data/all_cards_database.json ein " oder < im Namen.
 */
describe('escapeJsStr im HTML-Attribut — die Maskierung muss doppelt sein', () => {
    /**
     * Die Ereignisattribute eines Start-Tags lesen, so wie der
     * HTML-Zerteiler sie liest: ein Anfuehrungszeichen im Wert beendet
     * den Wert, was danach kommt ist ein NEUES Attribut. Anfuehrungs-
     * zeichen zu zaehlen reicht dafuer nicht — die frueher hier
     * stehende Pruefung `/\son[a-z]+=/` sah auch den Text INNERHALB
     * eines Attributwerts und haette den reparierten Code faelschlich
     * angemahnt.
     */
    function ereignisAttribute(markup) {
        let i = markup.indexOf('<') + 1;
        while (i < markup.length && /[^\s/>]/.test(markup[i])) i++;
        const namen = [];
        while (i < markup.length && markup[i] !== '>') {
            while (i < markup.length && /\s/.test(markup[i])) i++;
            if (i >= markup.length || markup[i] === '>' || markup[i] === '/') break;
            let n = '';
            while (i < markup.length && !/[\s=/>]/.test(markup[i])) n += markup[i++];
            namen.push(n.toLowerCase());
            while (i < markup.length && /\s/.test(markup[i])) i++;
            if (markup[i] !== '=') continue;
            i++;
            while (i < markup.length && /\s/.test(markup[i])) i++;
            if (markup[i] === '"' || markup[i] === "'") {
                const grenze = markup[i++];
                while (i < markup.length && markup[i] !== grenze) i++;
                i++;
            } else {
                while (i < markup.length && !/[\s>]/.test(markup[i])) i++;
            }
        }
        return namen.filter(n => n.startsWith('on'));
    }

    const knopf = (wert) =>
        `<button onclick="addCardToProxy('${wert}', '', '', 1)">P</button>`;

    it('escapeJsStr ALLEIN bricht aus dem Attribut aus — der Befund', () => {
        const name = 'x" onmouseover=alert(1) y="';
        const markup = knopf(REINIGER.escapeJsStr(name));
        assert.equal((markup.match(/"/g) || []).length, 4,
            'vier Anfuehrungszeichen: der Name hat das Attribut beendet');
        assert.deepEqual(ereignisAttribute(markup), ['onclick', 'onmouseover'],
            'ein zweiter Ereignishaken ist entstanden');
    });

    it('escapeHtmlAttr(escapeJsStr(x)) — ein einziges onclick-Attribut', () => {
        const name = 'x" onmouseover=alert(1) y="';
        const markup = knopf(REINIGER.escapeHtmlAttr(REINIGER.escapeJsStr(name)));
        assert.equal((markup.match(/"/g) || []).length, 2,
            'genau die beiden Begrenzer');
        assert.deepEqual(ereignisAttribute(markup), ['onclick'],
            'kein zweites Ereignisattribut');
    });

    it('der Name kommt durch beide Zerteiler unveraendert an', () => {
        // Stufe 1 HTML: die fuenf Entitaeten aufloesen. Stufe 2 JS: den
        // Attributwert wirklich ausfuehren.
        const htmlAuf = (s) => s
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        for (const name of [
            'x" onmouseover=alert(1) y="',
            "Boss's Orders",
            "x'); alert(1); ('",
            '<script>alert(1)</script>',
            'Farfetch&d',
            'Ende\\',
        ]) {
            const markup = knopf(REINIGER.escapeHtmlAttr(REINIGER.escapeJsStr(name)));
            const roh = markup.slice(markup.indexOf('onclick="') + 9);
            const code = htmlAuf(roh.slice(0, roh.indexOf('"')));

            let gesehen = null;
            const kasten = { addCardToProxy: (n) => { gesehen = n; }, alert: () => { gesehen = '__ALERT__'; } };
            vm.createContext(kasten);
            vm.runInContext(code, kasten, { timeout: 1000 });
            assert.equal(gesehen, name,
                `${JSON.stringify(name)} kam als ${JSON.stringify(gesehen)} an`);
        }
    });

    it('die UMGEKEHRTE Reihenfolge zerbricht an einem gewoehnlichen Namen', () => {
        // Beleg dafuer, dass die Reihenfolge gemessen und nicht geraten
        // ist: escapeJsStr(escapeHtmlAttr(x)) sieht am Tag genauso
        // harmlos aus, ist aber kaputt.
        const markup = knopf(REINIGER.escapeJsStr(REINIGER.escapeHtmlAttr("Boss's Orders")));
        assert.equal((markup.match(/"/g) || []).length, 2, 'sieht unauffaellig aus');
        assert.deepEqual(ereignisAttribute(markup), ['onclick']);

        const roh = markup.slice(markup.indexOf('onclick="') + 9);
        const code = roh.slice(0, roh.indexOf('"'))
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
        const kasten = { addCardToProxy: () => {} };
        vm.createContext(kasten);
        let fehler = null;
        // Der Fehler entsteht IM vm-Realm; `instanceof SyntaxError` des
        // Wirts trifft ihn deshalb nicht. Der Name trifft ihn.
        try { vm.runInContext(code, kasten, { timeout: 1000 }); }
        catch (e) { fehler = e.constructor.name; }
        assert.equal(fehler, 'SyntaxError',
            'der aufgeloeste Apostroph bricht die JS-Zeichenkette auf');
    });

    it('die vier Module benutzen die doppelte Maskierung wirklich', () => {
        // Ohne diese Zusicherung prueft die Datei nur eine Bauform, die
        // im Produktivcode gar nicht mehr stehen muesste.
        for (const datei of ['app-city-league.js', 'app-deck-builder.js',
                             'app-meta-cards.js', 'app-tier-meta.js']) {
            const code = lies(datei).split('\n')
                .filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
            const alle = (code.match(/escapeJsStr\(/g) || []).length;
            const gehuellt = (code.match(/escapeHtmlAttr\(escapeJsStr\(/g) || []).length;
            assert.ok(alle > 0, `js/${datei} benutzt escapeJsStr nicht mehr — Zaehlung pruefen`);
            assert.equal(gehuellt, alle,
                `js/${datei}: ${alle - gehuellt} Stelle(n) maskieren nur fuer JS`);
            // Und nicht einmal zu viel: escapeHtmlAttr auf einen schon
            // maskierten Wert macht aus &quot; ein &amp;quot;, und der
            // Nutzer liest die Entitaet als Text.
            assert.equal((code.match(/escapeHtmlAttr\(\s*escapeHtmlAttr\(/g) || []).length, 0,
                `js/${datei}: doppelt maskiert`);
        }
    });
});
