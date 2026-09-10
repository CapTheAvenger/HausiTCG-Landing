/**
 * Zwei Decklisten nebeneinander — was der Vergleich zusichern muss.
 *
 * Die Ansicht steht im Deckvergleich unter "Meine Decks"
 * (js/firebase-collection.js, showDeckComparison, Ansicht 'side') und
 * rechnet in js/deck-vergleich-nebeneinander.js.
 *
 * Die teuerste Zusicherung ist die zweite Gruppe: DIE ZUORDNUNG LAEUFT
 * NICHT UEBER DEN NAMEN. CLAUDE.md, "Data rules": Namen sind innerhalb
 * eines Sets nicht eindeutig — PBL fuehrt vier Produkte namens *Mega
 * Darkrai ex*. Ein Vergleich, der ueber den Namen zusammenfasst, zeigt
 * eine Karte mit drei Kopien, die es so nicht gibt, und verschweigt
 * genau den Unterschied, wegen dem jemand den Vergleich geoeffnet hat.
 *
 * Die Probe laeuft von beiden Seiten:
 *   • gleicher Name, verschiedene Nummer  -> zwei Zeilen
 *   • verschiedener Name, gleiche Nummer  -> eine Zeile
 * Die zweite faellt sofort um, sobald der Name irgendwo in den
 * Schluessel wandert — auch als Zusatz neben (set, nummer).
 *
 * Alle Daten setzt der Test selbst. Nichts hier liest data/.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const lies = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const M = require(path.join(ROOT, 'js', 'deck-vergleich-nebeneinander.js'));

/* Zwei Listen, von Hand nachrechenbar.
 *
 *   Druck        A   B   Klasse
 *   MEW 006/6    3   4   abweichend   (und: 006 == 6, siehe unten)
 *   OBF 164      2   2   gleich
 *   PAL 172      2   -   nurA
 *   PBL 184      1   -   nurA         gleicher Name wie PBL 331 …
 *   PBL 331      2   2   gleich       … und trotzdem eine eigene Zeile
 *   SVI 191      4   4   gleich
 *   PAL 185      -   3   nurB
 *
 *   Karten A = 3+2+2+1+2+4 = 14      Karten B = 4+2+3+2+4 = 15
 */
const DECK_A = {
    name: 'Charizard Bank',
    cards: {
        'Charizard ex (MEW 006)': 3,
        'Pidgeot ex (OBF 164)': 2,
        "Boss's Orders (PAL 172)": 2,
        'Mega Darkrai ex (PBL 184)': 1,
        'Mega Darkrai ex (PBL 331)': 2,
        'Rare Candy (SVI 191)': 4
    }
};
const DECK_B = {
    name: 'Charizard Turnier',
    cards: {
        'Charizard ex (MEW 6)': 4,
        'Pidgeot ex (OBF 164)': 2,
        'Iono (PAL 185)': 3,
        'Mega Darkrai ex (PBL 331)': 2,
        'Rare Candy (SVI 191)': 4
    }
};

const zeileMit = (v, set, nummer) =>
    v.zeilen.find(z => z.set === set && z.nummer === String(nummer));

describe('Nebeneinander: die drei Unterschiedsklassen', () => {
    const v = M.vergleiche(DECK_A, DECK_B);

    it('findet die Karten, die es nur links gibt', () => {
        const nurA = v.zeilen.filter(z => z.klasse === 'nurA')
            .map(z => z.set + ' ' + z.nummer).sort();
        assert.deepEqual(nurA, ['PAL 172', 'PBL 184']);
        assert.equal(zeileMit(v, 'PAL', 172).anzahlA, 2);
        assert.equal(zeileMit(v, 'PAL', 172).anzahlB, 0);
    });

    it('findet die Karten, die es nur rechts gibt', () => {
        const nurB = v.zeilen.filter(z => z.klasse === 'nurB')
            .map(z => z.set + ' ' + z.nummer);
        assert.deepEqual(nurB, ['PAL 185']);
        assert.equal(zeileMit(v, 'PAL', 185).anzahlA, 0);
        assert.equal(zeileMit(v, 'PAL', 185).anzahlB, 3);
    });

    it('findet die Karten, die in beiden stehen, aber unterschiedlich oft', () => {
        const ab = v.zeilen.filter(z => z.klasse === 'abweichend');
        assert.equal(ab.length, 1, 'genau eine Karte hat eine andere Anzahl');
        assert.equal(ab[0].set + ' ' + ab[0].nummer, 'MEW 6');
        assert.equal(ab[0].anzahlA, 3);
        assert.equal(ab[0].anzahlB, 4);
    });

    it('nennt den Rest gleich — und zaehlt ihn nicht zu den Unterschieden', () => {
        const gleich = v.zeilen.filter(z => z.klasse === 'gleich')
            .map(z => z.set + ' ' + z.nummer).sort();
        assert.deepEqual(gleich, ['OBF 164', 'PBL 331', 'SVI 191']);
        gleich.forEach(g => {
            const z = v.zeilen.find(x => x.set + ' ' + x.nummer === g);
            assert.equal(z.anzahlA, z.anzahlB);
        });
    });

    it('jede Zeile traegt genau eine der vier Klassen', () => {
        v.zeilen.forEach(z => {
            assert.ok(M.KLASSEN.includes(z.klasse), `unbekannte Klasse ${z.klasse}`);
        });
    });
});

describe('Nebeneinander: zugeordnet wird ueber (set, nummer), nie ueber den Namen', () => {
    it('gleicher Name, verschiedene Nummer — bleibt zwei Zeilen', () => {
        const v = M.vergleiche(DECK_A, DECK_B);
        const darkrai = v.zeilen.filter(z => z.name === 'Mega Darkrai ex');
        assert.equal(darkrai.length, 2,
            'PBL 184 und PBL 331 heissen gleich und sind zwei verschiedene Produkte');
        const nummern = darkrai.map(z => z.nummer).sort();
        assert.deepEqual(nummern, ['184', '331']);
        // Ein Namensverbund haette 1+2 = 3 Kopien in EINER Zeile gemacht.
        assert.ok(!darkrai.some(z => z.anzahlA === 3),
            'die beiden Drucke wurden zu einer Zeile mit 3 Kopien verschmolzen');
        assert.equal(zeileMit(v, 'PBL', 184).klasse, 'nurA');
        assert.equal(zeileMit(v, 'PBL', 331).klasse, 'gleich');
    });

    it('verschiedener Name, gleiche Nummer — bleibt eine Zeile', () => {
        // Dieselbe Karte, in der einen Liste deutsch benannt. Faellt um,
        // sobald der Name in den Schluessel wandert.
        const v = M.vergleiche(
            { name: 'A', cards: { 'Charizard ex (MEW 006)': 3 } },
            { name: 'B', cards: { 'Glurak ex (MEW 006)': 4 } }
        );
        assert.equal(v.zeilen.length, 1, 'ein Druck, eine Zeile');
        assert.equal(v.zeilen[0].klasse, 'abweichend');
        assert.equal(v.zeilen[0].anzahlA, 3);
        assert.equal(v.zeilen[0].anzahlB, 4);
    });

    it('fuehrende Nullen sind derselbe Druck, nicht zwei', () => {
        const e1 = M.eintragLesen('Charizard ex (MEW 006)');
        const e2 = M.eintragLesen('Charizard ex (mew 6)');
        assert.equal(e1.schluessel, e2.schluessel);
        assert.equal(e1.schluessel, 'DRUCK:MEW-6');
        // Alphanumerische Nummern bleiben unangetastet.
        assert.equal(M.eintragLesen('Radiant Greninja (ASR TG12)').schluessel, 'DRUCK:ASR-TG12');
    });

    it('liest auch card_identifier und {set, number}', () => {
        const ausIdent = M.vergleiche(
            { cards: [{ name: 'Charizard ex', card_identifier: 'MEW 006', count: 3 }] },
            { cards: { 'Charizard ex (MEW 6)': 3 } }
        );
        assert.equal(ausIdent.zeilen.length, 1);
        assert.equal(ausIdent.zeilen[0].klasse, 'gleich');

        const ausFeldern = M.eintragLesen('', { name: 'Iono', set: 'pal', number: '185' });
        assert.equal(ausFeldern.schluessel, 'DRUCK:PAL-185');
    });

    it('ein Eintrag ohne Druckangabe wird NICHT an einen Druck herangezogen', () => {
        const v = M.vergleiche(
            { name: 'A', cards: { 'Iono': 4 } },
            { name: 'B', cards: { 'Iono (PAL 185)': 4 } }
        );
        assert.equal(v.zeilen.length, 2, 'ohne Set und Nummer ist die Zuordnung nicht belegt');
        assert.deepEqual(v.zeilen.map(z => z.klasse).sort(), ['nurA', 'nurB']);
        assert.equal(v.kennzahlen.ohneDruck, 1);
    });
});

describe('Nebeneinander: die Kennzahlen stimmen mit den Listen ueberein', () => {
    const v = M.vergleiche(DECK_A, DECK_B);
    const k = v.kennzahlen;

    it('zaehlt gleich / nur A / nur B / abweichend so, wie die Zeilen es sagen', () => {
        assert.equal(k.gleich, 3);
        assert.equal(k.nurA, 2);
        assert.equal(k.nurB, 1);
        assert.equal(k.abweichend, 1);
        M.KLASSEN.forEach(kl => {
            assert.equal(k[kl], v.zeilen.filter(z => z.klasse === kl).length,
                `Kennzahl ${kl} passt nicht zu den Zeilen`);
        });
    });

    it('die vier Zahlen ergeben zusammen jede Zeile genau einmal', () => {
        assert.equal(k.gleich + k.nurA + k.nurB + k.abweichend, v.zeilen.length);
        assert.equal(k.zeilen, v.zeilen.length);
        assert.equal(v.zeilen.length, 7);
    });

    it('die Kartenzahl je Seite ist die Summe der eingegebenen Liste', () => {
        const summe = o => Object.values(o).reduce((n, x) => n + x, 0);
        assert.equal(k.kartenA, summe(DECK_A.cards));
        assert.equal(k.kartenB, summe(DECK_B.cards));
        assert.equal(k.kartenA, 14);
        assert.equal(k.kartenB, 15);
        assert.equal(k.kartenA, v.zeilen.reduce((n, z) => n + z.anzahlA, 0));
        assert.equal(k.kartenB, v.zeilen.reduce((n, z) => n + z.anzahlB, 0));
    });

    it('zwei identische Listen melden null Unterschiede', () => {
        const g = M.vergleiche(DECK_A, DECK_A).kennzahlen;
        assert.equal(g.nurA, 0);
        assert.equal(g.nurB, 0);
        assert.equal(g.abweichend, 0);
        assert.equal(g.gleich, g.zeilen);
    });

    it('Eintraege mit Anzahl 0 zaehlen nicht als Karte', () => {
        const v0 = M.vergleiche(
            { cards: { 'Iono (PAL 185)': 0, 'Rare Candy (SVI 191)': 2 } },
            { cards: { 'Rare Candy (SVI 191)': 2 } }
        );
        assert.equal(v0.zeilen.length, 1);
        assert.equal(v0.kennzahlen.kartenA, 2);
    });
});

describe('Nebeneinander: die Anzeige zeigt den Unterschied in Form UND Farbe', () => {
    const v = M.vergleiche(DECK_A, DECK_B);
    const html = M.rendere(v, { nameA: DECK_A.name, nameB: DECK_B.name, sprache: 'de' });

    it('stellt beide Listen mit ihrem Decknamen als Ueberschrift auf', () => {
        assert.match(html, /<h4 class="dvn-titel">Charizard Bank/);
        assert.match(html, /<h4 class="dvn-titel">Charizard Turnier/);
        assert.equal((html.match(/class="dvn-spalte /g) || []).length, 2);
    });

    it('jede Klasse traegt ein Zeichen und einen Text, nicht nur eine Farbe', () => {
        M.KLASSEN.forEach(kl => {
            assert.ok(html.includes(M.ZEICHEN[kl]), `Zeichen fuer ${kl} fehlt`);
        });
        ['gleich', 'nur links', 'nur rechts', 'andere Anzahl'].forEach(wort => {
            assert.ok(html.includes(wort), `Beschriftung "${wort}" fehlt`);
        });
        // Der Text steht in einem eigenen Element, das nicht nur eine
        // Farbe ist — sonst waere er im Stylesheet abschaltbar, ohne dass
        // hier etwas rot wird.
        assert.match(html, /<span class="dvn-marke-text">/);
    });

    it('schreibt bei abweichender Anzahl beide Zahlen hin (3 → 4)', () => {
        assert.match(html, /3<span class="dvn-pfeil"> → 4<\/span>/);
        assert.match(html, /4<span class="dvn-pfeil"> → 3<\/span>/);
    });

    it('nennt die vier Kennzahlen mit ihrem Wert', () => {
        assert.match(html, /<b>3<\/b> gleich/);
        assert.match(html, /<b>2<\/b> nur links/);
        assert.match(html, /<b>1<\/b> nur rechts/);
        assert.match(html, /<b>1<\/b> andere Anzahl/);
    });

    it('haelt beide Spalten gleich lang — jede Zeile steht in beiden', () => {
        const zeilen = (html.match(/class="dvn-zeile/g) || []).length;
        assert.equal(zeilen, v.zeilen.length * 2);
        // Was fehlt, steht als Platzhalter da, nicht als Luecke.
        assert.equal((html.match(/dvn-zeile dvn-leer/g) || []).length,
            v.kennzahlen.nurA + v.kennzahlen.nurB);
    });

    it('sagt in der Kopfzeile, worueber zugeordnet wird', () => {
        assert.match(html, /Set und Nummer/);
        assert.match(html, /nie über den Kartennamen/);
    });

    it('gibt es auf Englisch — und dort ohne deutsche Wörter', () => {
        const en = M.rendere(v, { nameA: 'A', nameB: 'B', sprache: 'en' });
        ['same', 'left only', 'right only', 'different count'].forEach(w => {
            assert.ok(en.includes(w), `"${w}" fehlt in der englischen Fassung`);
        });
        ['nur links', 'nur rechts', 'andere Anzahl', 'nicht enthalten']
            .forEach(w => assert.ok(!en.includes(w), `deutsches "${w}" steht in der englischen Fassung`));
    });

    it('maskiert Decknamen und Kartennamen', () => {
        const boes = M.rendere(
            M.vergleiche({ cards: { '<img> (SVI 191)': 1 } }, { cards: {} }),
            { nameA: '<script>x</script>', nameB: 'B', sprache: 'de' }
        );
        assert.ok(!boes.includes('<script>'), 'der Deckname landet unmaskiert im Markup');
        assert.ok(boes.includes('&lt;script&gt;'));
        assert.ok(boes.includes('&lt;img&gt;'));
    });

    it('kommt mit zwei leeren Listen ohne Absturz durch', () => {
        const leer = M.rendere(M.vergleiche({ cards: {} }, { cards: {} }), { sprache: 'de' });
        assert.match(leer, /Beide Listen sind leer/);
    });
});

describe('Nebeneinander: eingebaut und mobil brauchbar', () => {
    const HTML = lies('index.html');
    const FC = lies('js/firebase-collection.js');
    const CSS = lies('css/styles.css');
    const MOD = lies('js/deck-vergleich-nebeneinander.js');

    it('index.html laedt den Baustein VOR firebase-collection.js', () => {
        const i = HTML.indexOf('js/deck-vergleich-nebeneinander.js');
        const j = HTML.indexOf('js/firebase-collection.js');
        assert.ok(i > -1, 'der Baustein wird gar nicht geladen');
        assert.ok(i < j, 'showDeckComparison ruft ihn auf — er muss vorher dastehen');
    });

    it('der Baustein haengt sich an window', () => {
        assert.match(MOD, /window\.DeckVergleichNebeneinander\s*=/);
    });

    it('der Deckvergleich hat den dritten Knopf und ruft den Baustein', () => {
        assert.match(FC, /'side'\)"[^>]*>\$\{de \? '↔ Nebeneinander' : '↔ Side by side'\}/);
        assert.match(FC, /window\.DeckVergleichNebeneinander/);
        assert.match(FC, /view === 'side' \? sideHtml/);
    });

    it('unter 700 px stehen die beiden Listen untereinander', () => {
        assert.match(CSS, /\.dvn-spalten \{[^}]*grid-template-columns:\s*1fr 1fr/);
        const mq = CSS.slice(CSS.indexOf('@media (max-width: 700px) {', CSS.indexOf('.dvn-spalten')));
        const block = mq.slice(0, mq.indexOf('\n}') + 2);
        assert.match(block, /\.dvn-spalten \{ grid-template-columns: 1fr; \}/,
            'ohne diese Regel stehen bei 400 px zwei Spalten nebeneinander');
        assert.match(block, /\.dvn-zeile\.dvn-leer \{ display: none; \}/,
            'die Platzhalter richten im gestapelten Zustand nichts mehr aus');
    });

    it('nichts in der neuen Regelgruppe erzwingt sich mit !important', () => {
        const teil = CSS.slice(CSS.indexOf('.dvn-kennzahlen {'));
        assert.ok(!teil.includes('!important'), 'der !important-Berg darf nicht wachsen');
    });
});
