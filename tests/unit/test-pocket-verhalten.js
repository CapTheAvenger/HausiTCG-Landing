/**
 * Der Pocket-Reiter, AUSGEFUEHRT — nicht gegriffen.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * tests/unit/test-pocket-reiter.js prueft den Quelltext (`assert.match`
 * auf die Datei). Die unabhaengige Abnahme am 07.09.2026 hat gemessen,
 * was das nicht faengt: von zwoelf Mutationen ueberlebten sechs beide
 * vollen Suiten, vier davon in js/ds-pocket.js —
 *
 *   * TIER_ORDNUNG ohne 'D'          -> eine ganze Stufe verschwindet
 *   * Filter 'tier' ohne 'beide'     -> elf Decks fallen aus der Auswahl
 *   * das Vollbild oeffnet nie       -> der Zweck des Reiters
 *   * esc() escaped nicht mehr       -> Deck-Namen kommen von Game8
 *
 * Ein Quelltext-Grep kann keine davon sehen. Diese Datei fuehrt den
 * Renderer deshalb wirklich aus, gegen die ECHTEN Daten, und prueft,
 * was dabei herauskommt.
 *
 * KEIN jsdom
 * ----------
 * Der Testschritt in deploy-pages.yml installiert nur papaparse
 * (`npm install --no-save papaparse`). Ein Test, der jsdom braucht,
 * faellt dort um. Der Ersatz unten ist absichtlich winzig: er kann
 * genau das, was ds-pocket.js anfasst, und nichts weiter.
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const DATEN = JSON.parse(fs.readFileSync(path.join(WURZEL, 'data', 'pocket_tierlist.json'), 'utf8'));

// ── Der kleinste Ersatz, der traegt ──────────────────────────────────

function element(id) {
    return {
        id: id,
        innerHTML: '',
        hidden: true,
        dataset: {},
        style: {},
        _hoerer: {},
        addEventListener(art, f) { (this._hoerer[art] = this._hoerer[art] || []).push(f); },
        querySelector() { return { focus() {} }; },
        querySelectorAll() { return []; }
    };
}

function umgebung(daten) {
    const knoten = {
        pocket: element('pocket'),
        pocketListe: element('pocketListe'),
        pocketOverlay: element('pocketOverlay')
    };
    const dok = {
        readyState: 'complete',
        body: { style: {} },
        _hoerer: {},
        getElementById(id) { return knoten[id] || null; },
        addEventListener(art, f) { (this._hoerer[art] = this._hoerer[art] || []).push(f); },
        querySelector() { return null; }
    };
    // Der Verlauf, so klein wie moeglich und so echt wie noetig: der
    // Reiter legt beim Oeffnen einen Eintrag an, damit die Zurueck-Geste
    // des Telefons das Vollbild schliesst statt die Seite zu verlassen.
    // Ohne diesen Ersatz koennte der Test genau das nicht pruefen.
    const verlauf = {
        eintraege: [],
        pushState(zustand) { this.eintraege.push(zustand); },
        back() {
            this.eintraege.pop();
            (fenster._hoerer.popstate || []).forEach(h => h({}));
        }
    };
    const fenster = {
        document: dok,
        navigator: {},
        history: verlauf,
        _hoerer: {},
        addEventListener(art, f) { (this._hoerer[art] = this._hoerer[art] || []).push(f); },
        fetch(pfad, wahl) {
            fenster._geholt = { pfad: pfad, wahl: wahl };
            return Promise.resolve({ ok: true, json: () => Promise.resolve(daten) });
        },
        getLang: () => 'de',
        console: { warn() {} }
    };
    fenster.window = fenster;
    return { fenster, dok, knoten, verlauf };
}

/** ds-pocket.js in der Ersatzumgebung laufen lassen. */
function laden(daten) {
    const { fenster, dok, knoten, verlauf } = umgebung(daten);
    const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'ds-pocket.js'), 'utf8');
    const qr = require(path.join(WURZEL, 'js', 'qr-svg.js'));
    fenster.qrSvg = qr;
    const f = new Function('window', 'document', 'navigator', 'fetch', 'getLang', 'console',
                           'history',
                           quelle + '\n;return window.dsPocket;');
    // fetch als Weiterleitung, nicht als feste Bindung: sonst haelt das
    // Modul die urspruengliche Funktion fest, und ein Test, der spaeter
    // einen Netzfehler einsetzt, prueft nichts.
    const holen = function () { return fenster.fetch.apply(fenster, arguments); };
    const api = f(fenster, dok, fenster.navigator, holen, fenster.getLang, fenster.console,
                  verlauf);
    return { api, fenster, dok, knoten, verlauf };
}

/** Einen Klick auf ein Element mit diesem Attribut nachstellen. */
function klick(knoten, attribut, wert) {
    const ziel = {
        closest(w) {
            return w === '[' + attribut + ']'
                ? { getAttribute: (a) => (a === attribut ? wert : null) }
                : null;
        }
    };
    (knoten.pocket._hoerer.click || []).forEach(h => h({ target: ziel }));
}

async function gezeichnet(daten) {
    const u = laden(daten);
    u.api.render();
    await new Promise(r => setTimeout(r, 0));
    return u;
}

describe('Pocket-Reiter: die Liste entsteht wirklich', () => {
    let u;
    before(async () => { u = await gezeichnet(DATEN); });

    it('zeichnet jedes Deck der Datei', () => {
        const zeilen = (u.knoten.pocketListe.innerHTML.match(/class="pk-zeile"/g) || []).length;
        assert.equal(zeilen, DATEN.decks.length,
            `${zeilen} Zeilen gegen ${DATEN.decks.length} Decks in der Datei — ` +
            `die Fusszeile behauptet die Zahl der Datei, also muss sie auch dastehen`);
    });

    it('jede Stufe bekommt ihren eigenen Abschnitt mit der richtigen Zahl', () => {
        // Faengt TIER_ORDNUNG ohne 'D' (ueberlebende Mutation 07.09.2026).
        const zaehlung = {};
        DATEN.decks.forEach(d => { zaehlung[d.tier] = (zaehlung[d.tier] || 0) + 1; });
        const html = u.knoten.pocketListe.innerHTML;
        Object.keys(zaehlung).forEach(stufe => {
            const re = new RegExp('Stufe ' + stufe.replace('+', '\\+') +
                                  ' <span class="pk-stufe-zahl">' + zaehlung[stufe] + '<');
            assert.match(html, re,
                `der Abschnitt "Stufe ${stufe}" mit ${zaehlung[stufe]} Decks fehlt`);
        });
        const abschnitte = (html.match(/class="pk-stufe"/g) || []).length;
        assert.equal(abschnitte, Object.keys(zaehlung).length,
            'die Zahl der Abschnitte passt nicht zu den Stufen in der Datei');
    });

    it('holt die Daten ohne Zwischenspeicher', () => {
        assert.equal(u.fenster._geholt.pfad, 'data/pocket_tierlist.json');
        assert.equal(u.fenster._geholt.wahl.cache, 'no-store');
    });
});

describe('Pocket-Reiter: die Filter rechnen', () => {
    // Faengt "Filter 'tier' ohne 'beide'" (ueberlebende Mutation).
    const erwartet = {
        alle: DATEN.decks.length,
        tier: DATEN.decks.filter(d => d.quelle_liste === 'tier' || d.quelle_liste === 'beide').length,
        set: DATEN.decks.filter(d => d.quelle_liste === 'set' || d.quelle_liste === 'beide').length
    };

    it('die Datei taugt ueberhaupt als Probe', () => {
        // Ohne das koennte jeder Filter alles zeigen und der Test bestaende leer.
        assert.notEqual(erwartet.tier, erwartet.alle);
        assert.notEqual(erwartet.set, erwartet.alle);
        assert.notEqual(erwartet.tier, erwartet.set);
    });

    Object.keys(erwartet).forEach(name => {
        it(`"${name}" zeigt ${erwartet[name]} Decks`, async () => {
            const u = await gezeichnet(DATEN);
            klick(u.knoten, 'data-pk-filter', name);
            const zeilen = (u.knoten.pocketListe.innerHTML.match(/class="pk-zeile"/g) || []).length;
            assert.equal(zeilen, erwartet[name]);
        });
    });
});

describe('Pocket-Reiter: das Vollbild', () => {
    it('geht auf und traegt ein Muster', async () => {
        // Faengt "das Vollbild oeffnet nie" (ueberlebende Mutation).
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        const ov = u.knoten.pocketOverlay;
        assert.equal(ov.hidden, false, 'das Vollbild ist nach dem Antippen verborgen');
        assert.match(ov.innerHTML, /<svg /, 'kein Muster im Vollbild');
        assert.match(ov.innerHTML, /fill="#000000"/, 'das Muster ist nicht schwarz');
        assert.match(ov.innerHTML, /fill="#ffffff"/, 'der Grund ist nicht weiss');
    });

    it('traegt Name, Stufe und Quelle IM Bild', () => {
        return gezeichnet(DATEN).then(u => {
            klick(u.knoten, 'data-pk-deck', '0');
            const h = u.knoten.pocketOverlay.innerHTML;
            const d = DATEN.decks[0];
            assert.ok(h.includes(d.name), 'der Deck-Name fehlt im Vollbild');
            assert.match(h, /Game8/, 'die Quelle fehlt im Vollbild');
            assert.match(h, /Stand \d\d\.\d\d\.\d{4}/, 'das Datum fehlt im Vollbild');
        });
    });

    it('schliesst wieder', async () => {
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        assert.equal(u.knoten.pocketOverlay.hidden, false);
        klick(u.knoten, 'data-pk-zu', '1');
        assert.equal(u.knoten.pocketOverlay.hidden, true, 'das Vollbild bleibt offen');
    });
});

/* Der Weg zurueck aus dem Vollbild.
 *
 * BEFUND (10.09.2026, vom Betreiber am Telefon gemeldet: "Man kommt von
 * hier aus nicht zurueck"). Es gab genau einen Ausweg — den Knopf —, und
 * der war am Telefon nicht erreichbar: die Polsterung des Overlays
 * beachtete den unteren Geraeteeinzug, aber nicht den oberen. Gemessen
 * bei 390 px lag seine Oberkante 20 px unter dem Bildschirmrand, bei
 * einer Dynamic Island (59 px Einzug) also vollstaendig darunter. Und er
 * scrollte mit: nach 25 px stand er schon bei -5 px.
 *
 * Escape gibt es am Telefon nicht, und ohne Verlaufseintrag verliess die
 * Zurueck-Geste die ganze Anwendung.
 *
 * Geprueft werden hier die WEGE, nicht ihre Pixel — die Geometrie steht
 * in den CSS-Zusicherungen weiter unten. */
describe('Pocket-Reiter: der Weg zurueck aus dem Vollbild', () => {

    it('der Knopf steht in der klebenden Leiste, nicht frei im Fluss', async () => {
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        const html = u.knoten.pocketOverlay.innerHTML;
        assert.match(html, /<div class="pk-leiste">\s*<button[^>]*data-pk-zu/,
            'der Schliessknopf steht wieder frei im Fluss — dann scrollt '
            + 'er weg und liegt am Telefon unter der Statusleiste');
    });

    it('das Oeffnen legt einen Verlaufseintrag an', async () => {
        const u = await gezeichnet(DATEN);
        assert.equal(u.verlauf.eintraege.length, 0);
        klick(u.knoten, 'data-pk-deck', '0');
        assert.equal(u.verlauf.eintraege.length, 1,
            'ohne Eintrag verlaesst die Zurueck-Geste die ganze Anwendung');
        assert.equal(u.verlauf.eintraege[0].dsPocket, 'pocketOverlay',
            'der Eintrag traegt keine Marke — dann laesst er sich nicht '
            + 'von einem fremden unterscheiden');
    });

    it('die Zurueck-Geste schliesst das Vollbild', async () => {
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        assert.equal(u.knoten.pocketOverlay.hidden, false);
        u.verlauf.back();
        assert.equal(u.knoten.pocketOverlay.hidden, true,
            'die Zurueck-Geste laesst das Vollbild offen — am Telefon ist '
            + 'sie der Reflex');
        assert.equal(u.dok.body.style.overflow, '',
            'die Scroll-Sperre des Koerpers bleibt stehen');
    });

    it('nach der Zurueck-Geste wird nicht ein zweites Mal zurueckgesprungen', async () => {
        // Sonst faellt die Anwendung eine Ansicht zu weit zurueck: der
        // Eintrag ist vom popstate schon verbraucht.
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        u.verlauf.back();
        assert.equal(u.verlauf.eintraege.length, 0);
        // Ein zweites back() darf nichts mehr aus unserem Bestand nehmen.
        const vorher = u.verlauf.eintraege.length;
        u.verlauf.back();
        assert.equal(u.verlauf.eintraege.length, vorher,
            'es wurde ein Eintrag zu viel verbraucht');
    });

    it('der Knopf raeumt seinen Verlaufseintrag wieder ab', async () => {
        // Sonst sammeln sich Eintraege an, und die Zurueck-Geste muesste
        // danach mehrfach gedrueckt werden, um die Seite zu verlassen.
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        assert.equal(u.verlauf.eintraege.length, 1);
        klick(u.knoten, 'data-pk-zu', '1');
        assert.equal(u.knoten.pocketOverlay.hidden, true);
        assert.equal(u.verlauf.eintraege.length, 0,
            'der Eintrag bleibt liegen — dann braucht es zwei Zurueck, um '
            + 'die Seite zu verlassen');
    });

    it('zweimal oeffnen legt nicht zwei Eintraege an', async () => {
        const u = await gezeichnet(DATEN);
        klick(u.knoten, 'data-pk-deck', '0');
        klick(u.knoten, 'data-pk-deck', '1');
        assert.equal(u.verlauf.eintraege.length, 1,
            'ein Deckwechsel im offenen Vollbild haeuft Eintraege an');
    });
});

describe('Pocket-Reiter: was schiefgehen kann', () => {
    it('Deck-Namen werden maskiert', async () => {
        // Faengt "esc() escaped nicht mehr" (ueberlebende Mutation).
        // Die Namen kommen von Game8, nicht von uns.
        const boese = JSON.parse(JSON.stringify(DATEN));
        boese.decks[0].name = '<img src=x onerror=alert(1)>';
        const u = await gezeichnet(boese);
        const h = u.knoten.pocketListe.innerHTML;
        assert.doesNotMatch(h, /<img src=x/, 'ein Deck-Name kam ungefiltert ins HTML');
        assert.match(h, /&lt;img src=x/, 'der Name wurde gar nicht gezeigt');
    });

    it('eine unbekannte Stufe verschwindet nicht still', async () => {
        // Der Riegel, den ds-post-quellen.js schon hatte und der hier
        // fehlte (Abnahme 07.09.2026). tier:null ist ueber den
        // Kollisionsweg des Scrapers erreichbar.
        const fremd = JSON.parse(JSON.stringify(DATEN));
        fremd.decks[0].tier = 'S+';
        fremd.decks[1].tier = null;
        const u = await gezeichnet(fremd);
        const h = u.knoten.pocketListe.innerHTML;
        const zeilen = (h.match(/class="pk-zeile"/g) || []).length;
        assert.equal(zeilen, fremd.decks.length,
            `${zeilen} von ${fremd.decks.length} Decks gezeichnet — zwei sind ` +
            `still verschwunden, waehrend die Fusszeile weiter alle behauptet`);
        assert.match(h, /Ohne bekannte Stufe/, 'die fremde Stufe wird nicht angeschrieben');
        assert.ok(h.includes('S+'), 'die unbekannte Stufe wird nicht benannt');
    });

    it('eine leere Kartenliste zeigt den Grund, nicht einen leeren Kasten', async () => {
        const leer = JSON.parse(JSON.stringify(DATEN));
        leer.decks[0].pokemon = [];
        leer.decks[0].trainer = [];
        leer.decks[0].karten_hinweis = 'auf der Seite steht keine Liste';
        const u = await gezeichnet(leer);
        klick(u.knoten, 'data-pk-deck', '0');
        assert.match(u.knoten.pocketOverlay.innerHTML, /auf der Seite steht keine Liste/,
            'der Grund fehlt — es bleibt ein leerer Kasten stehen');
    });

    it('eine leere Datei meldet das, statt nichts zu zeigen', async () => {
        const u = await gezeichnet({ _meta: {}, decks: [] });
        assert.match(u.knoten.pocketListe.innerHTML, /Tier-Liste ist leer/);
    });

    it('ein Netzfehler wird gemeldet, nicht verschwiegen', async () => {
        const u = laden(DATEN);
        u.fenster.fetch = () => Promise.resolve({ ok: false, status: 503 });
        u.api.render();
        await new Promise(r => setTimeout(r, 0));
        assert.match(u.knoten.pocketListe.innerHTML, /is-fehler/,
            'ein 503 hinterlaesst einen leeren Reiter ohne Erklaerung');
    });

    it('ohne QR-Erzeuger kommt der Code als Text', async () => {
        const u = laden(DATEN);
        u.fenster.qrSvg = undefined;
        u.api.render();
        await new Promise(r => setTimeout(r, 0));
        klick(u.knoten, 'data-pk-deck', '0');
        const h = u.knoten.pocketOverlay.innerHTML;
        assert.match(h, /nicht zeichnen/, 'es bleibt ein leeres weisses Feld stehen');
        assert.ok(h.includes(DATEN.decks[0].code), 'der Code steht nirgends zum Abschreiben');
    });
});
