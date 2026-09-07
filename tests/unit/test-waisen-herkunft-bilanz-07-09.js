/**
 * ZWEI WAISENKLASSEN (07.09.2026).
 *
 * Beide wurden in den letzten zwei Laeufen im JavaScript eingefuehrt und
 * hatten in css/ keine einzige Regel. Ihr Text lief damit unformatiert
 * im Fluss mit:
 *
 *   B1  .city-league-info-card-herkunft
 *       js/app-city-league.js:1428, Karte "Datenquelle". Traegt den
 *       Satz, woraus die japanische Vergangenheitsansicht besteht
 *       (Turnierkennung, Ortsangabe, Zahl der erfassten Platzierungen,
 *       und ausdruecklich, dass Turniername und Teilnehmerzahl im
 *       Datensatz fehlen). Gemessen im Browser bei 360/390/768/1280 px:
 *       12px/400/rgb(255,255,255), display:inline, kein Abstand — also
 *       Zeichen fuer Zeichen dasselbe Bild wie der Wert "1" eine Zeile
 *       darueber.
 *
 *   B2  .arc-mu-major-bilanz
 *       js/app-archetype-card.js:1267, Matchup-Tabelle der Deckkarte.
 *       Traegt die Rohbilanz ("8–1–0") in der Spalte, in der unter
 *       MIN_PRAESENZ_PARTIEN bewusst KEIN Prozentwert stehen darf.
 *       Gemessen: rgb(238,242,255) = --arc-ink, dieselbe Tinte wie eine
 *       echte Quote; bei 412 px lief "25–25–10" 3,3 px ueber die linke
 *       Spaltenlinie.
 *
 * WAS DIESER TEST TUT
 *
 *   Er rechnet die Kaskade AUS (lib-css-kaskade.js liest die echten
 *   Dateien in der Ladereihenfolge aus index.html und loest Kurzformen
 *   auf), statt im Quelltext nach Zeichenketten zu suchen. Gefragt wird
 *   je Eigenschaft: was gilt am Ende fuer ein Element mit genau diesen
 *   Klassen?
 *
 *   Dazu kommen zwei Rechnungen, die die Farbwahl tragen:
 *     * B1 darf NICHT gedaempft werden — der Kartengrund ist ein fester
 *       Verlauf, auf dessen blauem Ende jede gedaempfte Variante unter
 *       4,5:1 faellt. Der Test rechnet das aus den Tokenwerten nach.
 *     * B2 wird gedaempft — der Test rechnet nach, dass --arc-ink2 auf
 *       den Flaechen der .arc-card ueber 4,5:1 bleibt.
 *
 * Kein jsdom, keine Live-Daten, kein Browser.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stilblatt, gewinner, spezifitaet, WURZEL } = require('./lib-css-kaskade.js');

/* Die drei Blaetter, in denen die beteiligten Regeln stehen. Die
   Ladereihenfolge holt sich stilblatt() aus index.html. */
const BLATT = stilblatt([
    'css/tokens.css',
    'css/styles.css',
    'css/ui-components.css',
    'css/mobile-responsive.css',
]);

/** Das Element aus der Karte "Datenquelle". */
const HERKUNFT = { tag: 'span', klassen: ['city-league-info-card-herkunft'] };

/** Die Zelle mit der Rohbilanz — so, wie praesenzZellen() sie baut. */
const BILANZ = {
    tag: 'td',
    klassen: ['arc-mu-major', 'arc-mu-major-duenn', 'arc-mu-major-bilanz'],
};

/** Dieselbe Spalte, aber mit einem Prozentwert: die Gegenprobe. */
const QUOTE = { tag: 'td', klassen: ['arc-mu-major'] };

function wert(el, eigenschaft) {
    return gewinner(BLATT, el, eigenschaft).wert;
}

// ── Kontrastrechnung ────────────────────────────────────────────────

function kanal(c) {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function leuchte(hex) {
    const h = String(hex).trim().replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}
function kontrast(a, b) {
    const x = leuchte(a), y = leuchte(b);
    const hell = Math.max(x, y), dunkel = Math.min(x, y);
    return (hell + 0.05) / (dunkel + 0.05);
}

/**
 * Der Selektor, unter dem die Bilanzregel WIRKLICH in css/styles.css
 * steht. Der Test soll die Spezifitaet der echten Zeile rechnen, nicht
 * die einer erwarteten Zeichenkette — sonst bliebe er gruen, wenn jemand
 * den Selektor auf die nackte Klasse verkuerzt.
 */
function bilanzSelektor() {
    const text = fs.readFileSync(path.join(WURZEL, 'css', 'styles.css'), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
    const koepfe = [...text.matchAll(/(^|[};])\s*([^{};]*arc-mu-major-bilanz[^{};]*)\{/g)]
        .map(m => m[2].trim());
    assert.equal(koepfe.length, 1,
        'Genau ein Regelkopf mit .arc-mu-major-bilanz erwartet, gefunden: '
        + JSON.stringify(koepfe));
    return koepfe[0];
}

/** Einen Tokenwert aus einer Datei holen — kein fester Wert im Test. */
function token(datei, name) {
    const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
    const treffer = new RegExp('--' + name + '\\s*:\\s*(#[0-9a-fA-F]{6})').exec(text);
    assert.ok(treffer, 'Token --' + name + ' nicht in ' + datei + ' gefunden');
    return treffer[1];
}

describe('B1 — der Herkunftssatz der Karte "Datenquelle"', () => {
    it('steht als eigener Block, nicht inline hinter der Turnierzahl', () => {
        assert.equal(wert(HERKUNFT, 'display'), 'block',
            'Ohne display:block klebt der Satz als Inline-Lauf hinter der Zahl — '
            + 'gemessen war das der Ausgangszustand.');
    });

    it('bekommt Luft und eine Trennlinie ueber sich', () => {
        assert.equal(wert(HERKUNFT, 'margin-top'), 'var(--s-2)');
        assert.equal(wert(HERKUNFT, 'padding-top'), 'var(--s-2)');
        assert.equal(wert(HERKUNFT, 'border-top-width'), null,
            'border-top-width steht nicht einzeln — die Kurzform traegt sie.');
        assert.equal(wert(HERKUNFT, 'border-top'), '1px solid currentColor');
        // Die Kurzform wird von lib-css-kaskade in die Seitenfarbe zerlegt.
        assert.equal(wert(HERKUNFT, 'border-top-color'), 'currentColor',
            'Die Linie erbt das Weiss des Textes, statt eine zweite Farbe zu setzen.');
    });

    it('laesst die Zeilen atmen', () => {
        assert.equal(wert(HERKUNFT, 'line-height'), '1.45');
    });

    it('bleibt weiss — jede Daempfung faellt auf dem Kartengrund durch', () => {
        assert.equal(wert(HERKUNFT, 'color'), 'inherit',
            'Der Satz uebernimmt die Kartenfarbe (weiss) und faerbt sich nicht selbst.');

        /* Warum keine gedaempfte Variante: der Grund ist der feste
           Verlauf --solid-info -> #764ba2. Am blauen Ende traegt Weiss
           5,01:1; die gedaempften Tokens des Projekts fallen dort
           deutlich unter die Grenze. Beides hier ausgerechnet, damit die
           Begruendung nicht nur im Kommentar steht. */
        const grund = token('css/tokens.css', 'solid-info');
        const aufDunkel = token('css/tokens.css', 'on-dark');
        const aufDunkel2 = token('css/tokens.css', 'on-dark-2');

        assert.ok(kontrast('#ffffff', grund) >= 4.5,
            'Weiss auf --solid-info: ' + kontrast('#ffffff', grund).toFixed(2) + ':1');
        assert.ok(kontrast(aufDunkel, grund) < 4.5,
            '--on-dark auf --solid-info traegt nur '
            + kontrast(aufDunkel, grund).toFixed(2) + ':1 — deshalb kein Daempfen.');
        assert.ok(kontrast(aufDunkel2, grund) < 4.5,
            '--on-dark-2 auf --solid-info traegt nur '
            + kontrast(aufDunkel2, grund).toFixed(2) + ':1.');
    });

    it('setzt keine Schriftgroesse — die waere auf dem Telefon wirkungslos', () => {
        /* css/mobile-responsive.css setzt unter (max-width: 768px) auf
           jedes <span> in .tab-content font-size: 12px !important.
           Eine Groesse hier wirkte nur auf dem Schirm und ergaebe zwei
           Erscheinungsbilder aus einer Regel. */
        assert.equal(wert(HERKUNFT, 'font-size'), null);
    });
});

describe('B2 — die Rohbilanz in der Praesenzspalte', () => {
    it('steht in gedaempfter Tinte, die Quote daneben nicht', () => {
        assert.equal(wert(BILANZ, 'color'), 'var(--arc-ink2)');
        assert.notEqual(wert(QUOTE, 'color'), 'var(--arc-ink2)',
            'Eine Zelle ohne .arc-mu-major-bilanz darf die Daempfung nicht erben.');
    });

    it('haelt die Ziffern auf fester Laufweite und zieht die Spur an', () => {
        /* tabular-nums steht schon auf .arc-mu-major und gilt fuer die
           ganze Spalte — ein zweites Mal in der Bilanzregel waere Laerm.
           Geprueft wird deshalb, dass es bei der Bilanzzelle ANKOMMT:
           ohne feste Ziffernbreite springen "8–1–0" und "13–13–2"
           untereinander. */
        assert.equal(wert(BILANZ, 'font-variant-numeric'), 'tabular-nums');
        assert.equal(wert(BILANZ, 'letter-spacing'), '-0.04em',
            'Gemessen bei 412 px: ohne die Spur lief "25–25–10" 3,3 px ueber die '
            + 'linke Spaltenlinie, mit -0,04em bleiben 0,6 px Luft.');
    });

    it('gewinnt ueber die Zellregel der Telefonbreite', () => {
        /* `table:not(.ds-table) td` aus css/mobile-responsive.css setzt
           unter 430 px die Zellgroesse und liegt bei (0,1,2). Die Klasse
           allein laege bei (0,1,0) und verloere. Gefragt wird nicht nach
           einer erwarteten Zeichenkette, sondern nach dem Selektor, der
           WIRKLICH in css/styles.css steht. */
        const meiner = spezifitaet(bilanzSelektor());
        const gegner = spezifitaet('table:not(.ds-table) td');
        const nurKlasse = spezifitaet('.arc-mu-major-bilanz');
        assert.ok(meiner[0] > gegner[0] || (meiner[0] === gegner[0] && meiner[1] > gegner[1]),
            'Der Selektor "' + bilanzSelektor() + '" liegt bei ' + meiner.join(',')
            + ' und schlaegt ' + gegner.join(',') + ' nicht.');
        assert.ok(nurKlasse[1] <= gegner[1],
            'Die Klasse allein haette an derselben Stelle nicht gereicht.');
    });

    it('bleibt auf dem Kartengrund lesbar', () => {
        /* Beide Flaechen gehoeren zur festen Palette der .arc-card und
           drehen mit keinem Farbschema mit. */
        const ink2 = token('css/styles.css', 'arc-ink2');
        for (const flaeche of ['arc-s1', 'arc-bg1', 'arc-s2']) {
            const grund = token('css/styles.css', flaeche);
            assert.ok(kontrast(ink2, grund) >= 4.5,
                '--arc-ink2 auf --' + flaeche + ': '
                + kontrast(ink2, grund).toFixed(2) + ':1');
        }
    });
});

describe('Beide Klassen sind ueberhaupt gestaltet', () => {
    /* Die Klammer um alles: eine Klasse, die im erzeugten HTML steht und
       in css/ nirgends vorkommt, ist genau der Befund, der diese Runde
       ausgeloest hat. */
    const CSS = ['css/styles.css', 'css/ui-components.css']
        .map(d => fs.readFileSync(path.join(WURZEL, d), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, ' '))
        .join('\n');

    for (const name of ['city-league-info-card-herkunft', 'arc-mu-major-bilanz']) {
        it('.' + name + ' hat eine Regel in css/', () => {
            assert.ok(new RegExp('\\.' + name + '\\s*[,{.:]').test(CSS),
                'Kein Selektor mit .' + name + ' in css/ gefunden.');
        });
    }
});
