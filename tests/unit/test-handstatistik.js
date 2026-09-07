/**
 * Befund A-F3.37 / A-F4.63 / C11 — die Handstatistik, AUSGEFUEHRT.
 *
 * WAS DER LIVE-DURCHGANG (07.09.2026) GESEHEN HAT
 * -----------------------------------------------
 * Die Handstatistik bleibt in allen drei Deckbauten leer:
 * `display:none`, kein Inhalt.
 *
 * WAS HIER GEMESSEN WURDE (Stand vor der Korrektur)
 * -------------------------------------------------
 *   leeres Deck                     style.display = 'none',
 *                                   innerHTML 0 Zeichen.
 *   60 Karten, Kartendatenbank
 *   NICHT geladen                   643 Zeichen Statistik mit
 *                                   "Basis auf der Hand 0,0 %" und
 *                                   "Mulligan 100,0 %".
 *
 * Der zweite Fall ist der schlimmere: window.allCardsDatabase wird erst
 * von loadAllCardsDatabase() gesetzt (js/app-core.js:3004). Fehlt sie,
 * findet die Schleife kein einziges Basis-Pokemon und die Funktion
 * rechnet mit basicCount = 0 weiter — eine erfundene Zahl in einer
 * Ansicht, die aussieht wie eine Messung.
 *
 * Beides muss einen Grund nennen statt sich zu verstecken oder zu raten.
 *
 * KEIN jsdom: der CI-Schritt installiert nur papaparse.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const L = require('./lib-dom-sandkasten.js');

const QUELLE = L.lies('js', 'app-features.js');
const MARKUP = L.lies('index.html');

const FUNKTIONEN = [
    'function hypergeomComb(n, k)',
    'function hypergeomProbAtLeastOne(N, K, n)',
    'function _handStatsHinweis(el, textDe, textEn)',
    'function updateOpeningHandStats(source)',
];

const KENNUNG = {
    cityLeague: 'cityLeagueHandStats',
    currentMeta: 'currentMetaHandStats',
    pastMeta: 'pastMetaHandStats',
};

function lauf(quelle, deck, db, sprache, wahl) {
    wahl = wahl || {};
    const dok = L.dokument();
    const el = dok.neu('div', KENNUNG[quelle]);
    const fenster = {
        document: dok,
        allCardsDatabase: db,
        // js/app-core.js setzt das erst, wenn ALLE Chunks da sind.
        cardDBFullyLoaded: wahl.vollstaendig === undefined ? undefined : wahl.vollstaendig,
        formatPercent: (v, n) => v.toFixed(n).replace('.', ',') + '%',
    };
    fenster[quelle + 'Deck'] = deck;
    fenster.window = fenster;
    const ctx = L.baue('js/app-features.js', FUNKTIONEN, {
        document: dok, window: fenster,
        t: (k) => k,
        getLang: () => (sprache || 'de'),
        console: { log() {}, warn() {} },
    });
    ctx.updateOpeningHandStats(quelle);
    return {
        el,
        display: el.style.display,
        html: el.innerHTML,
        text: el.innerHTML.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
}

describe('C11 — die Kennungen stimmen mit dem Markup ueberein', () => {
    it('alle drei Kaesten stehen wirklich in index.html', () => {
        Object.values(KENNUNG).forEach(id => {
            assert.ok(MARKUP.includes('id="' + id + '"'), 'im Markup fehlt ' + id);
        });
    });
});

describe('C11 — leeres Deck: Grund statt leerem Kasten', () => {
    ['cityLeague', 'currentMeta', 'pastMeta'].forEach(quelle => {
        it(quelle + ': der Kasten bleibt sichtbar und sagt, warum nichts gerechnet wird', () => {
            const r = lauf(quelle, {}, [{ name: 'X', set: 'SVI', number: '1', type: 'Basic' }]);
            assert.notEqual(r.display, 'none',
                quelle + ': die Statistik versteckt sich wieder');
            assert.ok(r.text.length > 0, quelle + ': der Kasten ist leer');
            assert.match(r.text, /noch keine Karten im Deck/,
                quelle + ': der Grund fehlt — es steht nur "' + r.text + '"');
        });
    });

    it('auf Englisch steht derselbe Grund auf Englisch', () => {
        const r = lauf('pastMeta', {}, [{ name: 'X', set: 'SVI', number: '1', type: 'Basic' }], 'en');
        assert.match(r.text, /no cards in the deck yet/);
    });
});

describe('C11 — ohne Kartendatenbank keine erfundene Mulligan-Zahl', () => {
    it('fehlt window.allCardsDatabase, steht der Grund da und KEIN Prozentwert', () => {
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 60 }, undefined);
        assert.notEqual(r.display, 'none');
        assert.match(r.text, /Kartendatenbank/, 'der Grund fehlt: ' + r.text);
        assert.equal(/\d+,\d\s*%/.test(r.text), false,
            'es steht wieder eine Prozentzahl da, obwohl die Kartenarten fehlen: ' + r.text);
        assert.equal(/100/.test(r.text), false,
            'die erfundene 100-%-Mulligan-Zahl ist zurueck: ' + r.text);
    });

    it('eine leere Datenbank zaehlt genauso als "nicht geladen"', () => {
        const r = lauf('currentMeta', { 'Pikachu ex (SVI 001)': 60 }, []);
        assert.match(r.text, /Kartendatenbank/);
    });
});

describe('C11 — mit Datenbank wird gerechnet, und Unbekanntes wird benannt', () => {
    const DB = [
        { name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' },
        { name: 'Iono', set: 'PAL', number: '185', type: 'Supporter' },
    ];

    it('60 Basis-Pokemon ergeben 100,0 % und 0,0 % Mulligan', () => {
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 60 }, DB);
        assert.equal(r.display, 'block');
        assert.match(r.text, /100,0%/);
        assert.match(r.text, /0,0%/);
    });

    it('die Rechnung folgt der hypergeometrischen Formel, nicht einer Ansage', () => {
        /* 60 Karten, 12 Basis-Pokemon, 7 Karten auf der Hand:
           1 - C(48,7)/C(60,7) = 1 - 73.629.072/386.206.920 = 0,80935330...
           Unabhaengig nachgerechnet mit math.comb, nicht abgelesen. */
        const ctx = L.baue('js/app-features.js', FUNKTIONEN.slice(0, 2), { console });
        const p = ctx.hypergeomProbAtLeastOne(60, 12, 7);
        assert.ok(Math.abs(p - 0.8093533072892635) < 1e-9,
            'die Formel liefert ' + p + ' statt 0,8093533072892635');
        assert.equal(ctx.hypergeomProbAtLeastOne(60, 0, 7), 0,
            'ohne Basis-Pokemon muss die Chance 0 sein');
        assert.equal(ctx.hypergeomProbAtLeastOne(60, 54, 7), 1,
            'bei 54 von 60 Basis-Pokemon ist die Chance praktisch sicher (Anteil 1, nicht Prozent)');
        assert.equal(ctx.hypergeomProbAtLeastOne(60, 60, 7), 1,
            'ein Deck aus lauter Basis-Pokemon gibt immer eine Startkarte');
    });

    it('Karten, die in der Datenbank fehlen, werden als unbestimmbar ausgewiesen', () => {
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 20, 'Gibt Es Nicht (ZZZ 999)': 40 }, DB);
        assert.match(r.text, /unbestimmbar/, 'die unbekannten Karten werden verschwiegen: ' + r.text);
        assert.match(r.text, /40 Karten unbestimmbar/);
    });

    it('sind alle Karten bekannt, steht kein Zusatz da', () => {
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 20, 'Iono (PAL 185)': 40 }, DB);
        assert.equal(/unbestimmbar/.test(r.text), false, 'der Zusatz steht ohne Grund da: ' + r.text);
    });

    it('eine unbekannte Karte macht aus 20 Basis von 60 nicht 20 von 20', () => {
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 20, 'Gibt Es Nicht (ZZZ 999)': 40 }, DB);
        // draw.basicsOfCards wird mit {b} und {n} befuellt; der Ersatz-t()
        // gibt den Schluessel zurueck, die Zahlen stehen im Zusatz.
        assert.match(r.text, /40 Karten unbestimmbar/);
        assert.equal(/100,0%/.test(r.text), false,
            'die unbekannten 40 Karten wurden stillschweigend als Basis gerechnet: ' + r.text);
    });
});

describe('C11 — kein style.display = none mehr in der Funktion', () => {
    it('updateOpeningHandStats blendet sich nicht mehr weg', () => {
        const block = L.ausschnitt(QUELLE, 'function updateOpeningHandStats(source)')
            .split('\n')
            .filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z))
            .join('\n');
        assert.equal(/display\s*=\s*'none'/.test(block), false,
            'die Statistik versteckt sich wieder, statt den Grund zu nennen');
    });
});

/* ══════════════════════════════════════════════════════════════════════
   BEFUND B7 (Pruefagent, 07.09.2026) — DIE 100 % WAREN NICHT WEG
   ══════════════════════════════════════════════════════════════════════
   Gemessen: Kartendatenbank VORHANDEN, aber keine der 60 Deckkarten darin
   auffindbar -> "Basis auf der Hand 0.0 %", "Mulligan 100.0 %". Die Wache
   prueft nur db.length === 0.

   Genau das ist im Past-Meta-Reiter der Regelfall beim Laden: app-core.js
   legt zuerst nur den Standard-Chunk in window.allCardsDatabase und laedt
   den Rest im Hintergrund nach (window.cardDBFullyLoaded bleibt bis dahin
   ungesetzt). Ein Past-Meta-Deck besteht per Definition aus Karten
   ausserhalb des Standard-Pools.
   ════════════════════════════════════════════════════════════════════ */

describe('B7 — Datenbank da, Deckkarten nicht darin: keine Prozentzahl', () => {
    /* Der Standard-Chunk, wie er zuerst geladen wird — er enthaelt genau
       KEINE der Karten des Past-Meta-Decks. */
    const STANDARD_CHUNK = [
        { name: 'Iono', set: 'PAL', number: '185', type: 'Supporter' },
        { name: 'Ultra Ball', set: 'SVI', number: '196', type: 'Item' },
    ];
    const PAST_DECK = { 'Zoroark GX (SLG 53)': 30, 'Ditto Prism (LOT 154)': 30 };

    it('der gemeldete Zustand: 60 Karten, keine davon auffindbar, kein Prozentwert', () => {
        const r = lauf('pastMeta', PAST_DECK, STANDARD_CHUNK);
        assert.equal(/\d+,\d\s*%/.test(r.text), false,
            'es steht wieder eine Prozentzahl da: ' + r.text);
        assert.equal(/100/.test(r.text), false,
            'die erfundene 100-%-Mulligan-Zahl ist zurueck: ' + r.text);
        assert.match(r.text, /60/, 'die Zahl der Deckkarten fehlt im Grund: ' + r.text);
        assert.match(r.text, /unbestimmbar/, 'es steht kein Grund da: ' + r.text);
    });

    it('solange cardDBFullyLoaded nicht gesetzt ist, sagt der Grund "erst teilweise geladen"', () => {
        const r = lauf('pastMeta', PAST_DECK, STANDARD_CHUNK);
        assert.match(r.text, /teilweise geladen/,
            'der Nachladevorgang wird nicht genannt — der Nutzer weiss nicht, dass Warten hilft: ' + r.text);
    });

    it('ist die Datenbank vollstaendig, nennt der Grund die fehlenden Karten statt des Ladens', () => {
        const r = lauf('pastMeta', PAST_DECK, STANDARD_CHUNK, 'de', { vollstaendig: true });
        assert.equal(/\d+,\d\s*%/.test(r.text), false, 'trotzdem eine Prozentzahl: ' + r.text);
        assert.match(r.text, /nicht in der Kartendatenbank/,
            'der Grund passt nicht zur vollstaendigen Datenbank: ' + r.text);
        assert.equal(/teilweise geladen/.test(r.text), false,
            'bei vollstaendiger Datenbank wird weiter Nachladen behauptet: ' + r.text);
    });

    it('schon EINE unbestimmbare Karte von 60 verhindert die Prozentzahl', () => {
        const db = [{ name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' }];
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 59, 'Gibt Es Nicht (ZZZ 999)': 1 }, db,
            'de', { vollstaendig: true });
        assert.equal(/%/.test(r.text), false,
            'mit einer unbestimmbaren Karte steht wieder ein Prozentwert da: ' + r.text);
        assert.match(r.text, /1 Karten unbestimmbar/);
    });

    it('sind alle Karten bestimmbar, wird gerechnet wie bisher', () => {
        const db = [{ name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' }];
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 60 }, db, 'de', { vollstaendig: true });
        assert.match(r.text, /100,0%/, 'die Rechnung faellt jetzt auch bei bekannten Karten aus: ' + r.text);
    });

    it('auf Englisch steht derselbe Grund auf Englisch', () => {
        const r = lauf('pastMeta', PAST_DECK, STANDARD_CHUNK, 'en');
        assert.match(r.text, /undetermined/);
        assert.match(r.text, /partly loaded/);
        assert.equal(/%/.test(r.text), false);
    });

    it('die Wache liest window.cardDBFullyLoaded wirklich aus', () => {
        const block = L.ausschnitt(QUELLE, 'function updateOpeningHandStats(source)');
        assert.match(block, /cardDBFullyLoaded/,
            'window.cardDBFullyLoaded wird weiterhin nicht abgefragt');
    });
});

describe('B7 — Nebenbefunde derselben Stelle', () => {
    it('kein Trennpunkt ohne Leerzeichen davor', () => {
        /* Gemeldet: "60 Karten· 40 Karten unbestimmbar". Geprueft wird
           die AUSGABE, nicht der Quelltext — dieselbe Stelle hat den
           Fehler schon einmal ueberlebt. */
        const db = [
            { name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' },
            { name: 'Iono', set: 'PAL', number: '185', type: 'Supporter' },
        ];
        [{ 'Pikachu ex (SVI 001)': 60 },
         { 'Pikachu ex (SVI 001)': 20, 'Iono (PAL 185)': 40 },
         { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': -4 }].forEach(deck => {
            const r = lauf('pastMeta', deck, db, 'de', { vollstaendig: true });
            /* Tags werden ERSATZLOS entfernt, nicht durch ein Leerzeichen:
               genau so setzt der Browser zwei aneinanderstossende <span>
               zusammen. Mit einem eingefuegten Leerzeichen haette diese
               Probe den Befund nicht sehen koennen — gemessen im
               Mutationslauf, die Mutation "Leerzeichen weg" blieb gruen. */
            const roh = r.html.replace(/<[^>]*>/g, '');
            assert.equal(/\S·/.test(roh), false,
                'der Trennpunkt klebt am Wort davor: ' + JSON.stringify(roh.replace(/\s+/g, ' ')));
        });
    });

    it('ein Deck {A:4, B:-4} ist NICHT leer — vier Karten liegen darin', () => {
        const db = [
            { name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' },
            { name: 'Iono', set: 'PAL', number: '185', type: 'Supporter' },
        ];
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': -4 }, db,
            'de', { vollstaendig: true });
        assert.equal(/noch keine Karten im Deck/.test(r.text), false,
            'vier Karten im Deck, und die Statistik sagt "noch keine Karten": ' + r.text);
        assert.match(r.text, /negativer Anzahl/,
            'der kaputte Eintrag wird verschwiegen: ' + r.text);
        // 4 Karten, alle 4 Basis -> die Startkarte ist sicher.
        assert.match(r.text, /100,0%/, 'gerechnet wurde mit der falschen Deckgroesse: ' + r.text);
    });

    it('ohne negative Eintraege steht auch kein Hinweis darauf', () => {
        const db = [{ name: 'Pikachu ex', set: 'SVI', number: '001', type: 'Basic' }];
        const r = lauf('pastMeta', { 'Pikachu ex (SVI 001)': 4 }, db, 'de', { vollstaendig: true });
        assert.equal(/negativer Anzahl/.test(r.text), false, 'der Hinweis steht ohne Grund da: ' + r.text);
    });
});
