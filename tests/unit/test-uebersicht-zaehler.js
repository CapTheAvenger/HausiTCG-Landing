/**
 * Befund C3 / F16.12 + F16.27 — der Uebersichtszaehler, AUSGEFUEHRT.
 *
 * WAS DER LIVE-DURCHGANG (07.09.2026) GESEHEN HAT
 * -----------------------------------------------
 * `pastMetaCardCount` fiel nach dem Leeren der Suche von 34 auf 24 und
 * stand nach „Max Consistency" auf „0 Karten", obwohl 24 Karten im
 * Raster standen.
 *
 * WAS HIER GEMESSEN WURDE (Stand vor der Korrektur)
 * -------------------------------------------------
 *   nach renderPastMetaCards()       "34 Karten", 12 Kacheln im Raster
 *   Filter mitten im Schub           "12 Karten", 12 Kacheln im Raster
 *   Schub fertig, kein neuer Lauf    "12 Karten", 34 Kacheln im Raster
 *   Typfilter Pokemon                "24 Karten"
 *   renderPastMetaCards() danach     "34 Karten"
 *
 * Zwei Schreiber mit zwei verschiedenen GROESSEN im selben Feld:
 * app-past-meta.js schrieb `sortedCards.length` (Karten in den Daten,
 * ohne Typfilter, ohne Aufteilung in Drucke), deck-analysis-shared.js
 * schrieb die Zahl der sichtbaren Kacheln.
 *
 * DIE EINE WAHRHEIT AB JETZT: der Zaehler zaehlt, was zu sehen ist, und
 * geschrieben wird er ausschliesslich von uebersichtZaehlerSchreiben().
 *
 * KEIN jsdom: der CI-Schritt installiert nur papaparse.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const L = require('./lib-dom-sandkasten.js');

const PM = L.lies('js', 'app-past-meta.js');

/** Grundgeruest: Dokument, deck-analysis-shared.js geladen. */
function basis() {
    const dok = L.dokument();
    const gitter = dok.neu('div', 'pastMetaDeckGrid');
    const suchfeld = dok.neu('input', 'pastMetaOverviewSearch');
    suchfeld.value = '';
    dok.neu('span', 'pastMetaCardCount');
    dok.neu('span', 'pastMetaCardCountSummary');
    dok.neu('div', 'pastMetaDeckTableView');
    dok.neu('div', 'pastMetaDeckVisual');
    dok.neu('div', 'pastMetaDeckTable');
    dok.neu('select', 'pastMetaDeckSelect');

    const fenster = { document: dok, getLang: () => 'de' };
    fenster.window = fenster;
    const ctx = { window: fenster, document: dok, console: { warn() {}, log() {}, error() {} } };
    vm.createContext(ctx);
    vm.runInContext(L.lies('js', 'deck-analysis-shared.js'), ctx,
        { filename: 'deck-analysis-shared.js' });
    return { dok, gitter, suchfeld, fenster, ctx,
             zaehler: () => dok.getElementById('pastMetaCardCount').textContent };
}

/** N Kacheln ins Raster haengen. */
function fuellen(dok, gitter, karten) {
    karten.forEach(k => gitter.appendChild(L.kachel(dok, k)));
}

const KARTEN = (() => {
    const raus = [];
    for (let i = 0; i < 34; i++) {
        raus.push({ name: 'Karte ' + i, nameDe: 'Karte ' + i, set: 'SVI',
                    nummer: String(i), typ: i < 24 ? 'Pokemon' : 'Trainer' });
    }
    return raus;
})();

function filtern(b, typFilter) {
    return b.fenster.uebersichtKachelnFiltern({
        suchfeldId: 'pastMetaOverviewSearch',
        gitterId: 'pastMetaDeckGrid',
        zaehlerId: 'pastMetaCardCount',
        typFilter: typFilter || 'all',
        kartenWort: 'Karten',
    });
}

describe('C3 — es gibt genau EINEN Schreiber', () => {
    it('app-past-meta.js schreibt pastMetaCardCount nicht mehr selbst', () => {
        const treffer = PM.match(/getElementById\(['"]pastMetaCardCount['"]\)\s*\.textContent\s*=/g) || [];
        assert.deepEqual(treffer, [],
            'app-past-meta.js schreibt den Zaehler wieder direkt: ' + treffer.join(', '));
    });

    it('deck-analysis-shared.js bietet den Schreiber an und meldet, wer geschrieben hat', () => {
        const b = basis();
        assert.equal(typeof b.fenster.uebersichtZaehlerSchreiben, 'function');
        b.fenster.uebersichtZaehlerSchreiben('pastMetaCardCount',
            { anzahl: 7, kartenWort: 'Karten', quelle: 'probe' });
        assert.equal(b.zaehler(), '7 Karten');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'probe');
    });

    it('der Kachelfilter schreibt ueber denselben Weg', () => {
        const b = basis();
        fuellen(b.dok, b.gitter, KARTEN);
        b.gitter.setAttribute('data-kacheln-soll', '34');
        filtern(b, 'all');
        assert.equal(b.zaehler(), '34 Karten');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'uebersichtKachelnFiltern');
    });
});

describe('C3 — der Zaehler zaehlt nie mitten im Aufbau', () => {
    it('halb gefuelltes Raster: der Zaehler weist den Aufbau aus statt 12 zu behaupten', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        assert.equal(b.zaehler(), '12 / 34 Karten …',
            'der Zaehler behauptet mitten im Schub eine Endzahl');
        assert.equal(b.fenster.__uebersichtZaehler.unvollstaendig, true);
        assert.match(b.dok.getElementById('pastMetaCardCount').getAttribute('title') || '',
            /aufgebaut/, 'der Grund steht nicht am Zaehler');
    });

    it('leeres Raster bei 24 angekuendigten Kacheln ergibt NICHT "0 Karten"', () => {
        // Genau der gemeldete Zustand: "0 Karten" ueber 24 Kacheln.
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '24');
        filtern(b, 'all');
        assert.notEqual(b.zaehler(), '0 Karten',
            'der Zaehler meldet wieder 0, waehrend 24 Kacheln unterwegs sind');
        assert.equal(b.zaehler(), '0 / 24 Karten …');
    });

    it('vollstaendiges Raster: klare Zahl, kein Hinweis mehr', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'all');
        assert.equal(b.zaehler(), '34 Karten');
        assert.equal(b.dok.getElementById('pastMetaCardCount').getAttribute('title'), null);
    });

    it('ohne Sollmarke bleibt es beim gezaehlten Bestand (City League / Current Meta)', () => {
        const b = basis();
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        assert.equal(b.zaehler(), '12 Karten');
        assert.equal(b.fenster.__uebersichtZaehler.unvollstaendig, false);
    });
});

describe('C3 — Suche und Typfilter widersprechen dem Zaehler nicht mehr', () => {
    it('der Typfilter zeigt 24, und niemand schreibt danach 34 dagegen', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'Pokemon');
        assert.equal(b.zaehler(), '24 Karten');

        // Der frueher zweite Schreiber: renderPastMetaCards. Er darf den
        // Zaehler jetzt nicht mehr anfassen.
        const pm = laufwerkRenderPastMetaCards(b, KARTEN.map((k, i) => ({
            full_card_name: k.name, card_name: k.name, typ: k.typ,
        })), { gitterAnsicht: true });
        pm.renderPastMetaCards();
        assert.equal(b.zaehler(), '24 Karten',
            'renderPastMetaCards schreibt wieder die Datenzahl ueber den Filterstand');
    });

    it('die Suche filtert und der Zaehler folgt ihr', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        b.suchfeld.value = 'karte 1';   // Karte 1 und 10..19 => 11 Treffer
        filtern(b, 'all');
        const erwartet = KARTEN.filter(k => k.name.toLowerCase().includes('karte 1')).length;
        assert.equal(b.zaehler(), erwartet + ' Karten');
        assert.ok(erwartet > 0 && erwartet < 34, 'die Probe filtert nichts — sie wuerde leer bestehen');
    });
});

/** renderPastMetaCards aus der echten Datei, mit Ersatz drumherum. */
function laufwerkRenderPastMetaCards(b, karten, wahl) {
    const protokoll = { gitter: [], tabelle: [] };
    const ctx = L.baue('js/app-past-meta.js', ['function renderPastMetaCards()'], {
        document: b.dok, window: b.fenster, console: { log() {}, warn() {}, error() {} },
        pastMetaFilteredCards: karten,
        pastMetaShowGridView: !!(wahl && wahl.gitterAnsicht),
        sortCardsByType: (c) => c,
        getPastMetaSummaryTotalCount: () => 60,
        t: (k) => (k === 'cl.cards' ? 'Karten' : k === 'cl.total' ? 'Gesamt' : k),
        resetDeckOverviewCounts: b.fenster.resetDeckOverviewCounts,
        renderNoDeckSelectedState: b.fenster.renderNoDeckSelectedState,
        getEmptyStateBoxHtml: () => '<div>leer</div>',
        renderPastMetaGridView: (c) => protokoll.gitter.push(c.length),
        renderPastMetaTableView: (c) => protokoll.tabelle.push(c.length),
    });
    ctx.protokoll = protokoll;
    return ctx;
}

describe('C3 — der Schub-Zeichner kuendigt an, wie viele Kacheln kommen', () => {
    /* Der Schwanz von renderPastMetaGridView wird als echter Quelltext
       ausgefuehrt: von `const renderGen` bis zum Ende der Funktion. Wer
       dort die Sollmarke oder das Nachziehen entfernt, macht diesen
       Test rot — ein Griff in den Quelltext koennte das nicht. */
    function schubZeichner() {
        const ganz = L.ausschnitt(PM, 'function renderPastMetaGridView(cards)');
        const ab = ganz.indexOf('const renderGen = ++_pastMetaRenderGen;');
        assert.ok(ab > 0, 'der Schub-Block in renderPastMetaGridView ist nicht mehr auffindbar');
        const rumpf = ganz.slice(ab, ganz.lastIndexOf('}'));
        return 'function schub(gridContainer, cardHtmls) {\n' + rumpf + '\n}';
    }

    function laufen(anzahl, wahl) {
        wahl = wahl || {};
        const b = basis();
        if (wahl.vorbelegung) b.dok.getElementById('pastMetaCardCount').textContent = wahl.vorbelegung;
        const t = L.takt();
        const gerufen = [];
        const ctx = {
            window: b.fenster, document: b.dok, console: { log() {}, warn() {} },
            requestAnimationFrame: t.requestAnimationFrame,
            _pastMetaRenderGen: 0,
        };

        b.fenster.filterPastMetaOverviewCards = () => {
            filtern(b, 'all');
            // Was nach JEDEM Nachziehen im Zaehler stand — daran haengt
            // der Befund "Zwischenzustand ohne Ausweis".
            gerufen.push(b.zaehler());
        };
        vm.createContext(ctx);
        vm.runInContext(schubZeichner() + '\nglobalThis.schub = schub;', ctx,
            { filename: 'renderPastMetaGridView-schub.js' });

        // Der echte Zeichner setzt innerHTML und haengt danach in
        // Schueben nach; der Sandkasten zaehlt daraus die Kacheln.
        const htmls = [];
        for (let i = 0; i < anzahl; i++) {
            const k = KARTEN[i % KARTEN.length];
            htmls.push('<div class="card-item city-league-card-item" data-card-name="'
                + k.name.toLowerCase() + '" data-card-type="' + k.typ + '"></div>');
        }
        ctx.schub(b.gitter, htmls);
        if (wahl.ueberholenNachRunde) {
            // Ein zweiter Zeichenlauf setzt mitten im Schub ein.
            t.laufen(wahl.ueberholenNachRunde);
            ctx._pastMetaRenderGen++;
        }
        t.laufen();
        return { b, gerufen, drin: b.gitter.querySelectorAll('.card-item').length };
    }

    it('die Sollmarke steht am Raster, bevor die erste Kachel drin ist', () => {
        const r = laufen(34);
        assert.equal(r.b.gitter.getAttribute('data-kacheln-soll'), '34');
    });

    it('der erste Schub weist sich sofort als Aufbau aus, der letzte gibt die Endzahl', () => {
        /* BEFUND "Zwischenzustand ohne Ausweis" (07.09.2026): zwischen
           erstem Schub und Nachziehen schrieb niemand. Der Zaehler stand
           auf der Zahl des VORIGEN Archetyps, waehrend im Raster schon die
           ersten Kacheln des neuen lagen. */
        const r = laufen(34);
        assert.deepEqual(r.gerufen, ['12 / 34 Karten \u2026', '34 Karten'],
            'geschrieben wurde: ' + r.gerufen.join(' | '));
        assert.equal(r.b.zaehler(), '34 Karten');
        assert.equal(r.drin, 34);
    });

    it('der Zaehler steht nie auf dem Stand des vorigen Archetyps', () => {
        const r = laufen(34, { vorbelegung: '99 Karten' });
        assert.notEqual(r.gerufen[0], '99 Karten');
        assert.match(r.gerufen[0], /\/ 34 Karten/,
            'der erste Schub hinterlaesst keinen Aufbau-Ausweis: ' + r.gerufen[0]);
    });

    it('auch ein Raster unter der Schubgroesse wird nachgezogen', () => {
        const r = laufen(7);
        assert.deepEqual(r.gerufen, ['7 Karten'],
            'ein Raster unter der Schubgroesse braucht genau EIN Nachziehen: ' + r.gerufen.join(' | '));
        assert.equal(r.b.gitter.getAttribute('data-kacheln-soll'), '7');
        assert.equal(r.b.zaehler(), '7 Karten');
    });

    /* M12 — der Generationswaechter in _pastMetaZaehlerNachziehen.
       Er wird HIER ALLEIN ausgefuehrt, mit echtem Quelltext: auf dem Weg
       durch renderNextBatch greift dessen eigener Waechter eine Stufe
       frueher, und eine Mutation im Nachziehen bliebe unbemerkt. */
    function nachziehenAllein(renderGen, aktuelleGeneration) {
        const gerufen = [];
        const ctx = {
            renderGen: renderGen,
            _pastMetaRenderGen: aktuelleGeneration,
            window: { filterPastMetaOverviewCards: () => gerufen.push('filter') },
            console: { log() {}, warn() {} },
        };
        vm.createContext(ctx);
        vm.runInContext(
            L.ausschnitt(PM, 'function _pastMetaZaehlerNachziehen()')
            + '\nglobalThis._pastMetaZaehlerNachziehen = _pastMetaZaehlerNachziehen;',
            ctx, { filename: 'pastMetaZaehlerNachziehen.js' });
        ctx._pastMetaZaehlerNachziehen();
        return gerufen;
    }

    it('M12 — der eigene Lauf zieht nach', () => {
        assert.deepEqual(nachziehenAllein(3, 3), ['filter'],
            'der aktuelle Zeichenlauf zieht den Zaehler nicht mehr nach');
    });

    it('M12 — ein ueberholter Lauf zieht NICHT nach', () => {
        assert.deepEqual(nachziehenAllein(3, 4), [],
            'ein ueberholter Zeichenlauf schreibt in den Zaehler des neuen Archetyps');
        assert.deepEqual(nachziehenAllein(4, 3), [],
            'die Pruefung vergleicht nicht auf Gleichheit');
    });

    it('ein ueberholter Schub bricht ab und schreibt nichts mehr', () => {
        const r = laufen(34, { ueberholenNachRunde: 1 });
        assert.deepEqual(r.gerufen, ['12 / 34 Karten \u2026'],
            'der ueberholte Schub hat weitergezeichnet: ' + r.gerufen.join(' | '));
    });
});

describe('C3 — die Tabellenansicht zaehlt ihre Zeilen, nicht fremde Kacheln', () => {
    it('in der Tabellenansicht faellt die Sollmarke weg und der Zaehler nennt die Zeilen', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);

        const ctx = L.baue('js/app-past-meta.js', ['function renderPastMetaTableView(cards)'], {
            document: b.dok, window: b.fenster, console: { log() {}, warn() {} },
            t: (k) => (k === 'cl.cards' ? 'Karten' : k),
            getEmptyStateBoxHtml: () => '<div>leer</div>',
            getPastMetaTableRowHtml: () => '',
        });
        try {
            ctx.renderPastMetaTableView(KARTEN.slice(0, 9).map(k => ({ card_name: k.name })));
        } catch (e) {
            // Der Tabellenrumpf braucht mehr Umfeld, als hier steht. Was
            // geprueft wird, passiert VOR dem Aufbau der Zeilen.
        }
        assert.equal(b.gitter.getAttribute('data-kacheln-soll'), null,
            'die Sollmarke des Rasters gilt in der Tabellenansicht weiter');
        assert.equal(b.zaehler(), '9 Karten');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'renderPastMetaTableView');
    });
});

/* ══════════════════════════════════════════════════════════════════════
   BEFUND B5 — DER SPRACHWECHSEL WAR EIN ZWEITER SCHREIBER
   ══════════════════════════════════════════════════════════════════════
   Gemessen: der languageChanged-Handler in app-past-meta.js las
   `el.textContent.match(/[\d.,]+/)` und schrieb `zahl + ' ' + t('cl.cards')`
   zurueck. Aus "12 / 34 Karten …" wurde "12 Karten" — aus einem
   gekennzeichneten Zwischenstand eine behauptete Endzahl.
   ════════════════════════════════════════════════════════════════════ */

/** Der echte languageChanged-Block aus app-past-meta.js, ausgefuehrt. */
function sprachwechselLauf(b, wort) {
    const ganz = L.ausschnitt(PM, "document.addEventListener('languageChanged', function ()");
    // ausschnitt() liefert den Aufruf MIT Rumpf; gebraucht wird nur der Rumpf.
    const rumpf = ganz.slice(ganz.indexOf('{'));
    const ctx = {
        window: b.fenster, document: b.dok, console: { log() {}, warn() {} },
        t: (k) => (k === 'cl.cards' ? wort : k === 'cl.total' ? 'Total' : k),
    };
    vm.createContext(ctx);
    vm.runInContext('function sprachwechsel() ' + rumpf + '\nglobalThis.sprachwechsel = sprachwechsel;',
        ctx, { filename: 'app-past-meta-languageChanged.js' });
    ctx.sprachwechsel();
    return ctx;
}

describe('B5 — der Sprachwechsel tauscht das Wort, nicht die Aussage', () => {
    it('aus "12 / 34 Karten …" wird "12 / 34 Cards …" — nicht "12 Cards"', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        assert.equal(b.zaehler(), '12 / 34 Karten …');

        sprachwechselLauf(b, 'Cards');
        assert.equal(b.zaehler(), '12 / 34 Cards …',
            'aus dem Zwischenstand wurde eine behauptete Endzahl: "' + b.zaehler() + '"');
    });

    it('der Aufbau-Hinweis bleibt nach dem Sprachwechsel am Zaehler', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        sprachwechselLauf(b, 'Cards');
        assert.match(b.dok.getElementById('pastMetaCardCount').getAttribute('title') || '',
            /still being built|aufgebaut/,
            'der Aufbau-Hinweis ist beim Sprachwechsel verschwunden');
        assert.equal(b.fenster.__uebersichtZaehler.unvollstaendig, true);
    });

    it('eine fertige Zahl bleibt eine fertige Zahl — mit neuem Wort und ohne Hinweis', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'all');
        assert.equal(b.zaehler(), '34 Karten');
        sprachwechselLauf(b, 'Cards');
        assert.equal(b.zaehler(), '34 Cards');
        assert.equal(b.dok.getElementById('pastMetaCardCount').getAttribute('title'), null,
            'die fertige Zahl hat beim Sprachwechsel einen Aufbau-Hinweis bekommen');
    });

    it('der Sprachwechsel geht ueber den EINEN Schreiber', () => {
        const b = basis();
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 5));
        filtern(b, 'all');
        sprachwechselLauf(b, 'Cards');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'languageChanged',
            'der Sprachwechsel schreibt wieder am gemeinsamen Schreiber vorbei');
    });

    it('ohne den gemeinsamen Schreiber wird die Zahl NICHT angefasst', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        delete b.fenster.uebersichtZaehlerSchreiben;
        sprachwechselLauf(b, 'Cards');
        assert.equal(b.zaehler(), '12 / 34 Karten …',
            'ohne Schreiber wurde trotzdem eine Endzahl behauptet: "' + b.zaehler() + '"');
    });

    it('die Summe daneben bleibt die Summe', () => {
        const b = basis();
        b.dok.getElementById('pastMetaCardCountSummary').textContent = '/ 60 Gesamt';
        sprachwechselLauf(b, 'Cards');
        assert.equal(b.dok.getElementById('pastMetaCardCountSummary').textContent, '/ 60 Total');
    });
});

/* ══════════════════════════════════════════════════════════════════════
   BEFUND B6 — DIE SOLLMARKE UEBERLEBTE DIE LEERZEICHNUNG
   ════════════════════════════════════════════════════════════════════ */

/** renderPastMetaGridView mit LEERER Kartenliste, echter Quelltext. */
function leerZeichnen(b) {
    const ctx = L.baue('js/app-past-meta.js', ['function renderPastMetaGridView(cards)'], {
        document: b.dok, window: b.fenster, console: { log() {}, warn() {} },
        devLog() {},
        t: (k) => (k === 'cl.noCardsFound' ? 'Keine Karten gefunden' : k === 'cl.cards' ? 'Karten' : k),
        escapeHtml: (x) => String(x),
        pastMetaRarityMode: 'min',
    });
    ctx.renderPastMetaGridView([]);
    return ctx;
}

describe('B6 — die Leerzeichnung raeumt die Sollmarke ab', () => {
    it('nach voll -> leer steht keine Sollmarke mehr am Raster', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'all');
        assert.equal(b.zaehler(), '34 Karten');

        leerZeichnen(b);
        assert.equal(b.gitter.getAttribute('data-kacheln-soll'), null,
            'die Sollmarke des vorigen Decks steht weiter am leeren Raster');
    });

    it('der naechste Filterlauf meldet danach "0 Karten", nicht "0 / 34 Karten …"', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'all');
        leerZeichnen(b);
        filtern(b, 'all');
        assert.equal(b.zaehler(), '0 Karten',
            'der Zaehler behauptet einen Aufbau, der nicht stattfindet: "' + b.zaehler() + '"');
        assert.equal(b.dok.getElementById('pastMetaCardCount').getAttribute('title'), null,
            'am leeren Raster haengt weiter "Das Raster wird noch aufgebaut"');
    });

    it('die Leerzeichnung setzt den Zaehler selbst auf 0 — ohne fremden Filterlauf', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN);
        filtern(b, 'all');
        leerZeichnen(b);
        assert.equal(b.zaehler(), '0 Karten',
            'der Zaehler steht weiter auf dem Stand des vorigen Decks: "' + b.zaehler() + '"');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'renderPastMetaGridView(leer)');
    });
});

describe('M26 / M9 — Aufbau-Hinweis und Sollmarke, die Waechter selbst', () => {
    it('M26 — der Aufbau-Hinweis wird beim Umschalten auf die Endzahl ENTFERNT', () => {
        /* Frueher wurde das nur an einem Knoten geprueft, der nie einen
           title hatte — die Mutation "removeAttribute weglassen" blieb
           gruen. Hier steht der Hinweis vorher WIRKLICH da. */
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        const zaehlerEl = b.dok.getElementById('pastMetaCardCount');
        assert.ok(zaehlerEl.getAttribute('title'), 'Vorbedingung: der Hinweis muss stehen');

        fuellen(b.dok, b.gitter, KARTEN.slice(12));
        filtern(b, 'all');
        assert.equal(b.zaehler(), '34 Karten');
        assert.equal(zaehlerEl.getAttribute('title'), null,
            'der Aufbau-Hinweis klebt an der fertigen Endzahl');
    });

    it('M26 — auch resetDeckOverviewCounts nimmt den Hinweis mit (Befund B4)', () => {
        const b = basis();
        b.gitter.setAttribute('data-kacheln-soll', '34');
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        filtern(b, 'all');
        const zaehlerEl = b.dok.getElementById('pastMetaCardCount');
        assert.ok(zaehlerEl.getAttribute('title'), 'Vorbedingung: der Hinweis muss stehen');

        b.fenster.resetDeckOverviewCounts('pastMetaCardCount', 'pastMetaCardCountSummary',
            '0 Karten', '/ 0 Gesamt');
        assert.equal(b.zaehler(), '0 Karten');
        assert.equal(zaehlerEl.getAttribute('title'), null,
            'nach dem Ruecksetzen steht "0 Karten" mit dem Aufbau-Hinweis daneben');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'resetDeckOverviewCounts');
        assert.equal(b.fenster.__uebersichtZaehler.text, '0 Karten');
    });

    it('B4 — fehlt der Zaehlerknoten, wird auch kein Schreibvorgang gemeldet', () => {
        const b = basis();
        b.fenster.uebersichtZaehlerSchreiben('pastMetaCardCount', { anzahl: 5, kartenWort: 'Karten', quelle: 'vorher' });
        b.fenster.resetDeckOverviewCounts('gibtEsNicht', 'auchNicht', '0 Karten', '/ 0 Gesamt');
        assert.equal(b.fenster.__uebersichtZaehler.quelle, 'vorher',
            'es wurde ein Schreibvorgang gemeldet, den es nicht gab');
    });

    it('M9 — eine unlesbare Sollmarke gilt als KEINE Sollmarke', () => {
        const b = basis();
        fuellen(b.dok, b.gitter, KARTEN.slice(0, 12));
        [['', '12 Karten'], ['abc', '12 Karten'], ['NaN', '12 Karten'],
         ['34', '12 / 34 Karten …'], ['12', '12 Karten']].forEach(([marke, erwartet]) => {
            b.gitter.setAttribute('data-kacheln-soll', marke);
            filtern(b, 'all');
            assert.equal(b.zaehler(), erwartet,
                'Sollmarke "' + marke + '" ergibt "' + b.zaehler() + '" statt "' + erwartet + '"');
        });
    });

    it('M9 — uebersichtKachelnSoll liefert null statt NaN', () => {
        const b = basis();
        const soll = b.fenster.uebersichtKachelnSoll;
        b.gitter.setAttribute('data-kacheln-soll', 'abc');
        assert.equal(soll(b.gitter), null, 'aus "abc" wurde eine Zahl');
        b.gitter.setAttribute('data-kacheln-soll', '');
        assert.equal(soll(b.gitter), null);
        b.gitter.removeAttribute('data-kacheln-soll');
        assert.equal(soll(b.gitter), null);
        b.gitter.setAttribute('data-kacheln-soll', '7');
        assert.equal(soll(b.gitter), 7);
        assert.equal(soll(null), null, 'ohne Raster faellt es um');
    });
});
