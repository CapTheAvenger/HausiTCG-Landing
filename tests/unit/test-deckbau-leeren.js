/**
 * Befund C1 / F16.31 — „Leeren" im Deckbau, AUSGEFUEHRT.
 *
 * WAS DER LIVE-DURCHGANG (07.09.2026) GESEHEN HAT
 * -----------------------------------------------
 * Im Past-Meta-Deckbau macht „Leeren" den Reiter dauerhaft unerreichbar,
 * und das Deck ist danach nicht leer.
 *
 * WAS HIER GEMESSEN WURDE (Stand vor der Korrektur)
 * -------------------------------------------------
 *   confirm() => false   clearDeck('pastMeta') ruft NICHTS auf, wirft
 *                        nichts, und das Deck steht unveraendert da.
 *   confirm() => true    das Deck wird geleert, aber die Neuzeichnung
 *                        lief ueber document.getElementById(
 *                        'current-meta-tab') — eine Kennung, die es in
 *                        index.html NICHT gibt (0 Treffer, ebenso
 *                        'city-league-tab' und 'past-meta-tab'). Der
 *                        Block war fuer alle drei Quellen tot, und im
 *                        pastMeta-Zweig haette er das FALSCHE Raster
 *                        gezeichnet.
 *
 * Im Zeichenpfad steckt also kein Einfrieren — er lief ohne Ausnahme
 * und ohne Schleife durch. Das einzige blockierende Element war das
 * native confirm(), das den Seitenlauf anhaelt, bis jemand antwortet.
 *
 * Deshalb pruefen die Zusicherungen unten drei Dinge:
 *   1. clearDeck ruft kein confirm() mehr auf.
 *   2. Ein einzelner Klick leert NICHTS — er macht scharf und sagt es an.
 *   3. Der zweite Klick leert und zeichnet das Raster der EIGENEN Quelle.
 *
 * NACHTRAG 07.09.2026 — BEFUND B1/B2/B3 DES PRUEFAGENTEN
 * ------------------------------------------------------
 * Diese Datei hat die Fristmechanik NICHT geprueft: sie las
 * DECK_LEEREN_FRIST_MS aus der Quelle zurueck und passte sich jedem Wert
 * an. Eine Frist von 1 ms haette "Leeren" dauerhaft unbrauchbar gemacht
 * und waere gruen geblieben (Mutationen M1/M2). Und zwei Aufrufe im
 * Abstand von 0 ms leerten das Deck — ein gewoehnlicher Doppelklick.
 *
 * Ab jetzt gilt hier:
 *   - Die drei Zeitkonstanten werden gegen FESTE Zahlen geprueft
 *     (6000 / 400 / 400). Wer sie aendert, aendert diese Datei mit.
 *   - Die Uhr ist gestellt, nicht gemessen: Date.now() kommt aus dem
 *     Test. Die Verhaltensproben stehen auf festen Zeitpunkten
 *     (0, 399, 401, 5999, 6001 ms) und fallen, sobald eine der
 *     Konstanten wandert.
 *
 * KEIN jsdom: der CI-Schritt installiert nur papaparse. Der DOM-Ersatz
 * steht in tests/unit/lib-dom-sandkasten.js.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const L = require('./lib-dom-sandkasten.js');

/** Kommentare raus: eine Zusicherung auf den Quelltext darf nicht an
 *  einem Kommentar haengen bleiben, der den Befund festhaelt. */
function ohneKommentare(text) {
    return String(text)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .split('\n').map(z => z.replace(/(^|[^:'"])\/\/.*$/, '$1')).join('\n');
}

/** Werte aus dem Sandkasten haben eine andere Realm-Herkunft; deepEqual
 *  vergleicht sonst auch den Prototyp und faellt immer. */
const rein = (x) => JSON.parse(JSON.stringify(x));

const QUELLE = L.lies('js', 'app-deck-builder.js');
const MARKUP = L.lies('index.html');

const FUNKTIONEN = [
    'function _deckLeerenDe()',
    'function _deckLeerenKnopf(source)',
    'function _deckLeerenWarnungSchreiben(knopf)',
    'function _deckLeerenEntschaerfen()',
    'function _deckLeerenScharfMachen(source)',
    'function _deckLeerenUebersichtNeu(source)',
    'function _deckLeerenBasisname(deckSchluessel)',
    'function _deckLeerenSeltenheitAufraeumen(source, geleertesDeck)',
    'function clearDeck(source)',
];

/* ── Die drei Zeitkonstanten, mit FESTEN Zahlen ──────────────────────
 *
 * Nicht aus der Quelle zurueckgelesen: genau daran ist die letzte Runde
 * gescheitert (M1/M2). Diese Zahlen stehen hier, damit eine Aenderung in
 * app-deck-builder.js rot wird und jemand sie bewusst mitzieht.
 */
const FRIST_MS   = 6000;   // so lange bleibt der erste Klick scharf
const MINDEST_MS = 400;    // so frueh zaehlt der zweite Klick noch NICHT
const PRELL_MS   = 400;    // so nah beieinander sind zwei Klicks EINER

function konstanteAusQuelle(name) {
    const m = QUELLE.match(new RegExp('const ' + name + '\\s*=\\s*(\\d+)'));
    assert.ok(m, name + ' steht nicht mehr in app-deck-builder.js');
    return Number(m[1]);
}

/** Baut eine Umgebung, in der das echte clearDeck() laeuft. */
function umgebung(wahl) {
    wahl = wahl || {};
    const dok = L.dokument();
    const t = L.takt();
    const protokoll = { gerufen: [], toasts: [], confirmGerufen: 0, entfernt: [] };

    // Die Reiter, wie sie WIRKLICH im Markup heissen.
    ['city-league', 'current-meta', 'past-meta'].forEach(id => {
        const k = dok.neu('div', id);
        k.className = 'tab-content';
    });
    if (wahl.aktiverReiter) dok.getElementById(wahl.aktiverReiter).classList.add('active');

    // Die drei Leeren-Knoepfe, wie in index.html — MIT data-i18n, denn
    // genau daran haengt Befund B2.
    ['cityLeague', 'currentMeta', 'pastMeta'].forEach(q => {
        const b = dok.neu('button', 'knopf-' + q);
        b.className = 'btn-modern tertiary-danger deck-builder-clear-btn';
        b.setAttribute('onclick', "clearDeck('" + q + "')");
        b.setAttribute('data-i18n', 'cl.clear');
        b.textContent = 'Leeren';
    });

    const speicher = { cityLeagueDeck: 'a', currentMetaDeck: 'b', pastMetaDeck: 'c' };
    const fenster = {
        document: dok,
        cityLeagueDeck: { 'Iono (PAL 185)': 4 }, cityLeagueDeckOrder: ['Iono (PAL 185)'],
        currentCityLeagueArchetype: 'CL',
        currentMetaDeck: { 'Iono (PAL 185)': 4 }, currentMetaDeckOrder: ['Iono (PAL 185)'],
        currentMetaArchetype: 'CM',
        pastMetaDeck: { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 },
        pastMetaDeckOrder: ['Pikachu ex (SVI 001)', 'Iono (PAL 185)'],
        pastMetaCurrentArchetype: 'PM',
    };
    fenster.window = fenster;

    // Die Uhr ist GESTELLT. Nur so laesst sich die Frist auf feste
    // Zeitpunkte pruefen, ohne den Test schlafen zu legen.
    const uhr = { jetzt: 1000000 };
    wahl.sprache = wahl.sprache || 'de';
    const ctx = {
        window: fenster, document: dok, console: { error() {}, warn() {}, log() {} },
        setTimeout: t.setTimeout, clearTimeout: t.clearTimeout,
        Date: { now: () => uhr.jetzt },
        localStorage: {
            removeItem(k) { protokoll.entfernt.push(k); delete speicher[k]; },
            getItem(k) { return speicher[k] || null; },
            setItem() {},
        },
        confirm(m) { protokoll.confirmGerufen++; return true; },
        // Wie t() sich wirklich verhaelt: uebersetzt, wenn es den
        // Schluessel kennt, sonst gibt es den Schluessel zurueck.
        t: (k) => (wahl.woerterbuch && wahl.woerterbuch[k] !== undefined) ? wahl.woerterbuch[k] : k,
        getLang: () => (wahl.sprache || 'de'),
        devLog() {},
        showToast: (text, art) => protokoll.toasts.push({ text, art }),
        rarityPreferences: wahl.seltenheit || {},
        saveRarityPreferences: () => protokoll.gerufen.push('saveRarityPreferences'),
        updateDeckDisplay: (s) => protokoll.gerufen.push('updateDeckDisplay:' + s),
        renderCityLeagueDeckGrid: () => protokoll.gerufen.push('renderCityLeagueDeckGrid'),
        renderCurrentMetaDeckGrid: () => protokoll.gerufen.push('renderCurrentMetaDeckGrid'),
        renderPastMetaCards: () => {
            protokoll.gerufen.push('renderPastMetaCards');
            if (wahl.rasterWirftFehler) throw new Error('Raster kaputt');
        },
        cityLeagueCardsFiltered: [], currentMetaCardsFiltered: [],
        cityLeagueOverviewRarityMode: 'max', currentMetaOverviewRarityMode: 'max',
    };
    ctx.globalThis = ctx;
    require('node:vm').createContext(ctx);
    const code = FUNKTIONEN.map(m => L.ausschnitt(QUELLE, m)).join('\n')
        + '\n' + L.ausschnitt(QUELLE, 'const DECK_REITER = {').replace(/^const/, 'var')
        + '\nglobalThis.clearDeck = clearDeck;'
        + '\nglobalThis.DECK_REITER = DECK_REITER;';
    // DECK_REITER steht vor den Funktionen; die Reihenfolge ist egal,
    // weil `var`-Hebung greift — aber der Wert muss VOR dem Aufruf da sein.
    require('node:vm').runInContext(
        L.ausschnitt(QUELLE, 'const DECK_REITER = {').replace(/^const/, 'var') + '\n'
        + 'var DECK_LEEREN_FRIST_MS = ' + konstanteAusQuelle('DECK_LEEREN_FRIST_MS') + ';\n'
        + 'var DECK_LEEREN_MINDEST_MS = ' + konstanteAusQuelle('DECK_LEEREN_MINDEST_MS') + ';\n'
        + 'var DECK_LEEREN_PRELL_MS = ' + konstanteAusQuelle('DECK_LEEREN_PRELL_MS') + ';\n'
        + 'var _deckLeerenScharf = null;\nvar _deckLeerenUhr = null;\n'
        + 'var _deckLeerenLetzterKlick = null;\n'
        + 'var _deckLeerenZuFruehGemeldet = null;\n'
        + FUNKTIONEN.map(m => L.ausschnitt(QUELLE, m)).join('\n') + '\n'
        /* Der Sprachhorcher steht auf Dateiebene, nicht in einer
           Funktion — er wird als ECHTER Quelltext mitgeladen, damit ein
           Eingriff dort hier rot wird und nicht an einer Abschrift
           vorbeilaeuft. */
        + L.ausschnitt(QUELLE, "if (typeof document !== 'undefined' && document.addEventListener)") + '\n'
        + 'globalThis.clearDeck = clearDeck;\nglobalThis.DECK_REITER = DECK_REITER;',
        ctx, { filename: 'app-deck-builder-clearDeck.js' });

    return {
        dok, ctx, protokoll, takt: t, fenster, uhr,
        /** Die gestellte Uhr weiterdrehen. */
        vor(ms) { uhr.jetzt += ms; return this; },
        /** Ein Klick auf "Leeren" der Quelle. */
        klick(q) { ctx.clearDeck(q); return this; },
        knopf(q) { return dok.getElementById('knopf-' + q); },
        /** Sprache umstellen und das Ereignis feuern, wie switchLanguage(). */
        sprache(neu, woerterbuch) {
            wahl.sprache = neu;
            if (woerterbuch) wahl.woerterbuch = woerterbuch;
            this.uebersetzungslauf(wahl.woerterbuch);
            dok.dispatchEvent({ type: 'languageChanged' });
        },
        /* Was updateTranslationsInDOM() tut (js/i18n.js): jedes Element
           mit data-i18n bekommt den uebersetzten Text. Genau dieser Lauf
           hat den scharfen Knopf zurueckbeschriftet (Befund B2), und
           app-cards-db.js loest ihn zweimal OHNE languageChanged aus. */
        uebersetzungslauf(woerterbuch) {
            dok.querySelectorAll('[data-i18n]').forEach(el => {
                const k = el.getAttribute('data-i18n');
                if (woerterbuch && woerterbuch[k] !== undefined) el.textContent = woerterbuch[k];
            });
        },
    };
}


describe('C1 — die Reiter-Kennungen, die es nicht gibt', () => {
    it('index.html kennt city-league / current-meta / past-meta, NICHT die -tab-Fassungen', () => {
        ['city-league', 'current-meta', 'past-meta'].forEach(id => {
            assert.ok(MARKUP.includes('id="' + id + '"'),
                'im Markup fehlt der Reiter id="' + id + '"');
            assert.equal(MARKUP.includes('id="' + id + '-tab"'), false,
                'es gibt doch eine Kennung id="' + id + '-tab" — dann stimmt die Messung nicht mehr');
        });
    });

    it('app-deck-builder.js schlaegt keine "-tab"-Kennung mehr nach', () => {
        // Nur ECHTE Nachschlagevorgaenge, nicht die Erwaehnung im
        // Kommentar, der den Befund festhaelt.
        const treffer = QUELLE.match(/getElementById\(\s*['"][a-z-]+-tab['"]/g) || [];
        assert.deepEqual(treffer, [],
            'app-deck-builder.js schlaegt weiter eine "-tab"-Kennung nach: ' + treffer.join(', '));
    });

    it('DECK_REITER bildet genau die drei Quellen auf die echten Reiter ab', () => {
        const u = umgebung({});
        assert.deepEqual(rein(u.ctx.DECK_REITER), {
            cityLeague: 'city-league', currentMeta: 'current-meta', pastMeta: 'past-meta',
        });
        Object.values(u.ctx.DECK_REITER).forEach(id => {
            assert.ok(MARKUP.includes('id="' + id + '"'), 'Reiter ' + id + ' fehlt im Markup');
        });
    });
});

describe('C1 — der blockierende Dialog ist weg', () => {
    it('clearDeck ruft kein confirm() mehr', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.equal(u.protokoll.confirmGerufen, 0,
            'clearDeck haelt den Seitenlauf wieder mit confirm() an');
    });

    it('im Quelltext von clearDeck steht kein confirm mehr', () => {
        const block = L.ausschnitt(QUELLE, 'function clearDeck(source)');
        assert.equal(/\bconfirm\s*\(/.test(block), false, 'confirm() steht wieder in clearDeck');
    });
});

describe('C1 — ein Klick leert nicht, zwei Klicks leeren', () => {
    it('der erste Klick laesst das Deck vollstaendig stehen und sagt an, was zu tun ist', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        const vorher = JSON.stringify(u.fenster.pastMetaDeck);
        u.klick('pastMeta');
        assert.equal(JSON.stringify(u.fenster.pastMetaDeck), vorher,
            'der erste Klick hat schon geleert');
        assert.deepEqual(rein(u.protokoll.entfernt), [],
            'der erste Klick hat schon in den Speicher gegriffen');
        assert.equal(u.protokoll.gerufen.length, 0,
            'der erste Klick hat schon gezeichnet: ' + u.protokoll.gerufen.join(', '));
        assert.equal(u.protokoll.toasts.length, 1, 'der erste Klick sagt nichts an');
        assert.match(u.protokoll.toasts[0].text, /Leeren/,
            'die Ansage nennt den Knopf nicht: ' + u.protokoll.toasts[0].text);
        assert.equal(u.dok.getElementById('knopf-pastMeta').textContent, 'Wirklich leeren?',
            'der Knopf sagt nicht, dass er scharf ist');
    });

    it('der zweite Klick leert das Deck und zeichnet das RICHTIGE Raster', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), {}, 'das Deck ist nicht leer');
        assert.deepEqual(rein(u.fenster.pastMetaDeckOrder), []);
        assert.equal(u.fenster.pastMetaCurrentArchetype, null);
        assert.deepEqual(rein(u.protokoll.entfernt), ['pastMetaDeck'],
            'aus dem Speicher wurde das falsche Deck genommen: ' + u.protokoll.entfernt.join(', '));
        assert.ok(u.protokoll.gerufen.includes('renderPastMetaCards'),
            'das Past-Meta-Raster wurde nicht neu gezeichnet: ' + u.protokoll.gerufen.join(', '));
        assert.equal(u.protokoll.gerufen.includes('renderCurrentMetaDeckGrid'), false,
            'es wurde das Current-Meta-Raster gezeichnet — genau der Befund');
        assert.equal(u.dok.getElementById('knopf-pastMeta').textContent, 'Leeren',
            'der Knopf traegt weiter die Warnbeschriftung');
    });

    it('die anderen beiden Decks bleiben unberuehrt', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.cityLeagueDeck), { 'Iono (PAL 185)': 4 });
        assert.deepEqual(rein(u.fenster.currentMetaDeck), { 'Iono (PAL 185)': 4 });
    });

    it('City League zeichnet City League, Current Meta zeichnet Current Meta', () => {
        [['cityLeague', 'city-league', 'renderCityLeagueDeckGrid', 'cityLeagueDeck'],
         ['currentMeta', 'current-meta', 'renderCurrentMetaDeckGrid', 'currentMetaDeck']]
            .forEach(([quelle, reiter, zeichner, speicherSchluessel]) => {
                const u = umgebung({ aktiverReiter: reiter });
                u.klick(quelle).vor(500).klick(quelle);
                assert.ok(u.protokoll.gerufen.includes(zeichner),
                    quelle + ': ' + zeichner + ' wurde nicht gerufen (' + u.protokoll.gerufen.join(', ') + ')');
                assert.deepEqual(rein(u.protokoll.entfernt), [speicherSchluessel]);
                assert.deepEqual(rein(u.fenster[speicherSchluessel]), {});
            });
    });

    it('ein zweiter Klick auf einen ANDEREN Knopf leert nicht, sondern macht dort scharf', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').klick('currentMeta');
        assert.deepEqual(rein(u.fenster.currentMetaDeck), { 'Iono (PAL 185)': 4 },
            'der Klick auf den anderen Knopf hat sofort geleert');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 });
        assert.equal(u.dok.getElementById('knopf-pastMeta').textContent, 'Leeren',
            'der erste Knopf blieb scharf beschriftet');
    });

    it('nach der Frist verfaellt die Schaerfe und sagt das auch', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta');
        u.vor(FRIST_MS + 1);
        u.takt.laufen();          // die Frist laeuft ab
        assert.equal(u.dok.getElementById('knopf-pastMeta').textContent, 'Leeren');
        assert.equal(u.protokoll.toasts.length, 2, 'der Abbruch wurde nicht angesagt');
        assert.match(u.protokoll.toasts[1].text, /unver/,
            'der Abbruch sagt nicht, dass das Deck unveraendert ist');
        u.klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 },
            'nach abgelaufener Frist hat der naechste Klick sofort geleert');
    });
});

describe('C1 — kein stiller Ausfall beim Neuzeichnen', () => {
    it('wirft der Zeichner, steht der Grund in einer Meldung und das Deck ist trotzdem leer', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', rasterWirftFehler: true });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), {});
        const texte = u.protokoll.toasts.map(x => x.text).join(' | ');
        assert.match(texte, /Raster kaputt/,
            'der Grund des Fehlschlags steht nirgends: ' + texte);
    });

    it('ist der Reiter nicht der aktive, wird nicht gezeichnet', () => {
        const u = umgebung({ aktiverReiter: 'current-meta' });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), {}, 'geleert wird trotzdem');
        assert.equal(u.protokoll.gerufen.includes('renderPastMetaCards'), false,
            'ein unsichtbares Raster wurde neu gezeichnet');
    });

    it('fehlt der Reiter im Baum, wird trotzdem gezeichnet', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.dok.getElementById('past-meta').remove();
        // getElementById haelt die Kennung noch — also wirklich abhaengen:
        u.dok.getElementById = () => null;
        u.klick('pastMeta');
        u.vor(500);
        u.klick('pastMeta');
        assert.ok(u.protokoll.gerufen.includes('renderPastMetaCards'),
            'ohne Reiterknoten wurde stillschweigend gar nichts gezeichnet');
    });
});

/* ══════════════════════════════════════════════════════════════════════
   BEFUND B1 — DER DOPPELKLICK, DER LOESCHT
   ════════════════════════════════════════════════════════════════════ */

describe('B1a — die Fristmechanik, an festen Zahlen gemessen', () => {
    it('die drei Zeitkonstanten stehen auf 6000 / 400 / 400 ms', () => {
        /* Ohne diese Zusicherung passt sich jeder Test jedem Wert an —
           genau der Grund, warum M1/M2 die letzte Runde ueberlebt haben.
           Eine Frist von 1 ms macht "Leeren" unbedienbar, eine
           Mindestzeit von 0 ms macht den Doppelklick wieder toedlich. */
        assert.equal(konstanteAusQuelle('DECK_LEEREN_FRIST_MS'), FRIST_MS,
            'die Bestaetigungsfrist ist nicht mehr ' + FRIST_MS + ' ms');
        assert.equal(konstanteAusQuelle('DECK_LEEREN_MINDEST_MS'), MINDEST_MS,
            'die Mindestwartezeit ist nicht mehr ' + MINDEST_MS + ' ms');
        assert.equal(konstanteAusQuelle('DECK_LEEREN_PRELL_MS'), PRELL_MS,
            'die Entprellzeit ist nicht mehr ' + PRELL_MS + ' ms');
    });

    it('zwei Aufrufe im Abstand von 0 ms leeren NICHTS — der gemessene Befund', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta');
        u.klick('pastMeta');            // Doppelklick: 0 ms Abstand
        assert.deepEqual(rein(u.fenster.pastMetaDeck),
            { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 },
            'ein Doppelklick hat das Deck geleert — Datenverlust durch Fehlbedienung');
        assert.deepEqual(rein(u.protokoll.entfernt), [],
            'ein Doppelklick hat in localStorage gegriffen: ' + u.protokoll.entfernt.join(', '));
    });

    it('auch fuenf Klicks in derselben Millisekunde leeren nichts', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        for (let i = 0; i < 5; i++) u.klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck),
            { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 });
        assert.deepEqual(rein(u.protokoll.entfernt), []);
    });

    it('bei 399 ms zaehlt der zweite Klick noch nicht, bei 401 ms leert er', () => {
        const zu_frueh = umgebung({ aktiverReiter: 'past-meta' });
        zu_frueh.klick('pastMeta').vor(399).klick('pastMeta');
        assert.deepEqual(rein(zu_frueh.fenster.pastMetaDeck),
            { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 },
            'nach 399 ms wurde schon geleert — die Mindestwartezeit greift nicht');
        assert.equal(zu_frueh.knopf('pastMeta').textContent, 'Wirklich leeren?',
            'der zu fruehe Klick hat den Knopf entschaerft — der naechste haette geleert');

        const rechtzeitig = umgebung({ aktiverReiter: 'past-meta' });
        rechtzeitig.klick('pastMeta').vor(401).klick('pastMeta');
        assert.deepEqual(rein(rechtzeitig.fenster.pastMetaDeck), {},
            'nach 401 ms hat der bewusste zweite Klick nicht geleert');
    });

    it('bei 5999 ms leert der zweite Klick noch, bei 6001 ms nicht mehr', () => {
        const drin = umgebung({ aktiverReiter: 'past-meta' });
        drin.klick('pastMeta').vor(5999).klick('pastMeta');
        assert.deepEqual(rein(drin.fenster.pastMetaDeck), {},
            'kurz vor Fristende leert der zweite Klick nicht mehr — die Frist ist zu kurz');

        const drueber = umgebung({ aktiverReiter: 'past-meta' });
        drueber.klick('pastMeta').vor(6001).klick('pastMeta');
        assert.deepEqual(rein(drueber.fenster.pastMetaDeck),
            { 'Pikachu ex (SVI 001)': 4, 'Iono (PAL 185)': 2 },
            'nach Fristende hat der Klick trotzdem geleert');
        assert.equal(drueber.knopf('pastMeta').textContent, 'Wirklich leeren?',
            'nach Fristende macht der Klick nicht neu scharf');
    });

    it('der zu fruehe Klick sagt, warum nichts passiert ist', () => {
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').vor(100).klick('pastMeta');
        const texte = u.protokoll.toasts.map(x => x.text).join(' | ');
        assert.match(texte, /Zu schnell/, 'der zu fruehe Klick bleibt stumm: ' + texte);
    });

    it('nach dem zu fruehen Klick leert der naechste rechtzeitige weiterhin', () => {
        // Die Sperre darf den Knopf nicht dauerhaft unbrauchbar machen.
        const u = umgebung({ aktiverReiter: 'past-meta' });
        u.klick('pastMeta').vor(100).klick('pastMeta').vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), {},
            'nach einem zu fruehen Klick leert gar nichts mehr');
    });
});

describe('B1b — das Leeren einer Quelle laesst die anderen Seltenheiten stehen', () => {
    function seltenheit() {
        return {
            'Pikachu ex': { mode: 'specific', set: 'SVI', number: '001' },
            'Iono':       { mode: 'specific', set: 'PAL', number: '185' },
            'Boss’s Orders': { mode: 'specific', set: 'PAL', number: '172' },
        };
    }

    it('nur die Karten der geleerten Quelle verlieren ihre Druckauswahl', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', seltenheit: seltenheit() });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        const uebrig = Object.keys(rein(u.ctx.rarityPreferences)).sort();
        // "Pikachu ex" lag nur im Past-Meta-Deck  -> weg.
        // "Iono" liegt weiter in den anderen zwei -> bleibt.
        // "Boss's Orders" lag in gar keinem Deck  -> bleibt.
        assert.deepEqual(uebrig, ['Boss’s Orders', 'Iono'],
            'geloescht wurde die falsche Menge: uebrig ' + uebrig.join(', '));
    });

    it('rarityPreferences wird NICHT komplett zurueckgesetzt', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', seltenheit: seltenheit() });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.notDeepEqual(rein(u.ctx.rarityPreferences), {},
            'das Leeren EINER Quelle hat alle Seltenheitseinstellungen geloescht');
    });

    it('leert man City League, behaelt Past Meta seine Karte', () => {
        const u = umgebung({ aktiverReiter: 'city-league', seltenheit: seltenheit() });
        u.klick('cityLeague').vor(500).klick('cityLeague');
        assert.ok(Object.prototype.hasOwnProperty.call(u.ctx.rarityPreferences, 'Pikachu ex'),
            'die Past-Meta-Karte hat ihre Druckauswahl verloren, obwohl City League geleert wurde');
        assert.ok(Object.prototype.hasOwnProperty.call(u.ctx.rarityPreferences, 'Iono'),
            '"Iono" liegt noch in zwei Decks und darf seine Auswahl nicht verlieren');
    });

    it('ist nichts zu loeschen, wird auch nicht gespeichert', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', seltenheit: {} });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.equal(u.protokoll.gerufen.includes('saveRarityPreferences'), false,
            'ohne Aenderung wurde trotzdem in localStorage geschrieben');
    });

    it('der Basisname wird aus dem Deckschluessel gewonnen, nicht geraten', () => {
        const u = umgebung({});
        assert.equal(u.ctx._deckLeerenBasisname('Iono (PAL 185)'), 'Iono');
        assert.equal(u.ctx._deckLeerenBasisname('Iono'), 'Iono');
        assert.equal(u.ctx._deckLeerenBasisname('Mega Darkrai ex (PBL 100)'), 'Mega Darkrai ex');
    });
});

describe('B2/B3 — die Warnbeschriftung ueberlebt einen Sprachwechsel', () => {
    const DE = { 'cl.clear': 'Leeren' };
    const EN = { 'cl.clear': 'Clear' };

    it('ein Uebersetzungslauf OHNE Ereignis nimmt dem scharfen Knopf die Warnung nicht', () => {
        /* Genau der Weg aus js/app-cards-db.js (Z. 194 und 1102):
           updateTranslationsInDOM() ohne languageChanged. */
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: DE });
        u.klick('pastMeta');
        assert.equal(u.knopf('pastMeta').textContent, 'Wirklich leeren?');
        u.uebersetzungslauf(EN);
        assert.equal(u.knopf('pastMeta').textContent, 'Wirklich leeren?',
            'ein Uebersetzungslauf hat den scharfen Knopf harmlos beschriftet — '
            + 'der naechste Tipper loescht, ohne dass der Knopf es sagt');
    });

    it('waehrend der Frist traegt der Knopf kein data-i18n mehr, danach wieder', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: DE });
        u.klick('pastMeta');
        assert.equal(u.knopf('pastMeta').getAttribute('data-i18n'), null,
            'der scharfe Knopf haengt weiter am Uebersetzungslauf');
        u.vor(FRIST_MS + 1);
        u.takt.laufen();
        assert.equal(u.knopf('pastMeta').getAttribute('data-i18n'), 'cl.clear',
            'nach dem Verfallen fehlt dem Knopf sein data-i18n — er bleibt fuer immer unuebersetzt');
    });

    it('ein Sprachwechsel schreibt die Warnung in der neuen Sprache', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: DE });
        u.klick('pastMeta');
        u.sprache('en', EN);
        assert.equal(u.knopf('pastMeta').textContent, 'Really clear?',
            'nach dem Sprachwechsel steht die Warnung nicht in der neuen Sprache: "'
            + u.knopf('pastMeta').textContent + '"');
        // Und scharf ist er immer noch.
        u.vor(500).klick('pastMeta');
        assert.deepEqual(rein(u.fenster.pastMetaDeck), {},
            'der Sprachwechsel hat den scharfen Zustand mitgenommen');
    });

    it('B3 — nach dem Verfallen steht die NEUE Sprache auf dem Knopf, nicht die alte', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: DE });
        u.klick('pastMeta');                       // merkt sich "Leeren"
        u.sprache('en', EN);                       // Nutzer wechselt auf Englisch
        u.vor(FRIST_MS + 1);
        u.takt.laufen();                           // Frist verfaellt
        assert.equal(u.knopf('pastMeta').textContent, 'Clear',
            'zurueckgeschrieben wurde die vor dem Sprachwechsel gemerkte Beschriftung');
    });

    it('kennt t() den Schluessel nicht, steht der gemerkte Text da — nicht der Schluessel', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: {} });
        u.knopf('pastMeta').textContent = 'Leeren';
        u.klick('pastMeta');
        u.vor(FRIST_MS + 1);
        u.takt.laufen();
        assert.equal(u.knopf('pastMeta').textContent, 'Leeren',
            'auf dem Knopf steht der Uebersetzungsschluessel');
    });

    it('nach dem echten Leeren traegt der Knopf wieder seine Beschriftung', () => {
        const u = umgebung({ aktiverReiter: 'past-meta', woerterbuch: DE });
        u.klick('pastMeta').vor(500).klick('pastMeta');
        assert.equal(u.knopf('pastMeta').textContent, 'Leeren');
        assert.equal(u.knopf('pastMeta').getAttribute('data-i18n'), 'cl.clear');
    });
});

/* ══════════════════════════════════════════════════════════════════════
   BEFUND B1c — DIE LETZTE KOPIE
   ══════════════════════════════════════════════════════════════════════
   updateDeckDisplay loeschte `autosave_deck`, sobald alle drei Decks leer
   waren — also genau dann, wenn die drei Einzelschluessel schon weg sind
   und diese Aufnahme die letzte Kopie ist.

   GEMESSEN, bevor entschieden wurde: der einzige Leser der Aufnahme steht
   am Kopf von app-deck-builder.js und legt sie nach window._pendingAutosave.
   Ueber js/ und index.html hat window._pendingAutosave NULL Leser — es gibt
   KEINE Wiederherstellung. Also hatte das Loeschen keinen Nutzen und genau
   einen Nachteil. Die Aufnahme bleibt jetzt stehen. Eine Wiederherstellung
   wird hier NICHT erfunden; diese Datei prueft nur, dass nichts vernichtet
   wird.
   ════════════════════════════════════════════════════════════════════ */

/** updateDeckDisplay aus der echten Datei, mit leerem Dokument drumherum. */
function anzeigeLauf(decks, speicherVorher) {
    const dok = L.dokument();
    const speicher = Object.assign({}, speicherVorher || {});
    const gerufen = [];
    const fenster = {
        document: dok,
        cityLeagueDeck: decks.cityLeague || {}, cityLeagueDeckOrder: [],
        currentCityLeagueArchetype: null,
        currentMetaDeck: decks.currentMeta || {}, currentMetaDeckOrder: [],
        currentMetaArchetype: null,
        pastMetaDeck: decks.pastMeta || {}, pastMetaDeckOrder: [],
        pastMetaCurrentArchetype: null,
    };
    fenster.window = fenster;
    const ctx = L.baue('js/app-deck-builder.js', ['function updateDeckDisplay(source)'], {
        document: dok, window: fenster, console: { log() {}, warn() {}, error() {} },
        t: (k) => k,
        devLog() {},
        localStorage: {
            getItem: (k) => (k in speicher ? speicher[k] : null),
            setItem: (k, v) => { speicher[k] = String(v); gerufen.push('setItem:' + k); },
            removeItem: (k) => { delete speicher[k]; gerufen.push('removeItem:' + k); },
        },
        normalizeDeckEntries: () => false,
        renderMyDeckGrid: () => gerufen.push('renderMyDeckGrid'),
        scheduleDeckDependentRefresh: () => gerufen.push('scheduleDeckDependentRefresh'),
    });
    return { ctx, speicher, gerufen, fenster };
}

describe('B1c — die Sicherungskopie wird beim Leeren nicht vernichtet', () => {
    it('sind alle drei Decks leer, bleibt eine vorhandene autosave_deck stehen', () => {
        const a = anzeigeLauf({}, { autosave_deck: '{"cityLeague":{"deck":{"Iono (PAL 185)":4}}}' });
        a.ctx.updateDeckDisplay('pastMeta');
        assert.ok(a.speicher.autosave_deck,
            'die letzte Kopie der Decks wurde geloescht — sie ist nicht wiederherstellbar');
        assert.equal(a.gerufen.includes('removeItem:autosave_deck'), false,
            'updateDeckDisplay greift wieder nach autosave_deck');
        assert.match(a.speicher.autosave_deck, /Iono/,
            'die Aufnahme wurde mit einem leeren Stand ueberschrieben');
    });

    it('liegen Karten in einem Deck, wird die Aufnahme wie bisher geschrieben', () => {
        const a = anzeigeLauf({ pastMeta: { 'Pikachu ex (SVI 001)': 4 } }, {});
        a.ctx.updateDeckDisplay('pastMeta');
        assert.ok(a.speicher.autosave_deck, 'die Aufnahme wurde gar nicht geschrieben');
        const stand = JSON.parse(a.speicher.autosave_deck);
        assert.equal(stand.pastMeta.deck['Pikachu ex (SVI 001)'], 4);
    });

    it('im Quelltext steht kein removeItem auf autosave_deck mehr', () => {
        const block = ohneKommentare(L.ausschnitt(QUELLE, 'function updateDeckDisplay(source)'));
        assert.equal(/removeItem\(\s*['"]autosave_deck['"]\s*\)/.test(block), false,
            'updateDeckDisplay loescht wieder die letzte Kopie');
    });

    it('und es gibt weiterhin KEINE Wiederherstellung, die hier behauptet wuerde', () => {
        // Der Befund verlangt ausdruecklich: keine erfundene Wiederherstellung.
        // Diese Probe haelt fest, was gemessen wurde — faellt sie, ist der
        // Kommentar in app-deck-builder.js ueberholt und gehoert nachgezogen.
        const leser = (ohneKommentare(QUELLE).match(/_pendingAutosave/g) || []).length;
        assert.equal(leser, 1,
            'window._pendingAutosave hat jetzt mehr als die eine Schreibstelle — '
            + 'die Begruendung in app-deck-builder.js muss nachgezogen werden');
    });
});
