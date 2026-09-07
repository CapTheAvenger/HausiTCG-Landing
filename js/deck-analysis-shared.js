// deck-analysis-shared.js
// Shared helpers for Deck Analysis tabs (City League, Current Meta, Past Meta)

(function () {
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function updateDeckStatsByIds(statsById, sectionId) {
        if (!statsById || typeof statsById !== 'object') return;
        Object.entries(statsById).forEach(([id, value]) => setText(id, String(value)));
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) section.classList.remove('d-none', 'city-league-stats-section-hidden');
        }
    }

    /* ── EIN Zaehler, EIN Schreiber ─────────────────────────────────
     *
     * BEFUND C3 / F16.12 + F16.27 (Live-Durchgang 07.09.2026), hier
     * nachgemessen mit tests/unit/test-uebersicht-zaehler.js:
     *
     *   nach renderPastMetaCards()       "34 Karten", 12 Kacheln im Raster
     *   Filter mitten im Schub           "12 Karten", 12 Kacheln im Raster
     *   Schub fertig, kein neuer Lauf    "12 Karten", 34 Kacheln im Raster
     *   Typfilter Pokemon                "24 Karten"
     *   renderPastMetaCards() danach     "34 Karten"  (Typfilter zeigt 24)
     *
     * Zwei Schreiber, zwei verschiedene GROESSEN im selben Feld:
     * app-past-meta.js schrieb `sortedCards.length` — die Zahl der
     * KARTEN in den Daten, vor dem Typfilter und vor der Aufteilung in
     * Drucke (im Seltenheitsmodus "alle" wird aus EINER Karte ein
     * Dutzend Kacheln). uebersichtKachelnFiltern schrieb die Zahl der
     * SICHTBAREN KACHELN. Beide hatten recht, und beide standen
     * abwechselnd in demselben Feld.
     *
     * Die eine Wahrheit ab jetzt: DER ZAEHLER ZAEHLT, WAS GERADE ZU
     * SEHEN IST. Geschrieben wird er ausschliesslich hier.
     *
     * Und er zaehlt nie mitten im Aufbau: die Raster fuellen sich in
     * Schueben von 12 Kacheln je Frame. Wer waehrenddessen zaehlt,
     * bekommt eine Zwischenzahl. Deshalb meldet der Zaehler den Aufbau,
     * statt eine falsche Endzahl zu zeigen — "0 Karten" neben 24
     * Kacheln war genau dieser Fall.
     */
    const ZAEHLER_MARKE = 'data-kacheln-soll';

    function uebersichtZaehlerSchreiben(zaehlerId, o) {
        const el = document.getElementById(zaehlerId);
        if (!el) return null;
        o = o || {};
        const wort = o.kartenWort || 'Cards';
        const de = (typeof window.getLang === 'function' && window.getLang() === 'de');
        let text;
        if (o.unvollstaendig) {
            text = o.anzahl + ' / ' + o.soll + ' ' + wort + ' \u2026';
            el.setAttribute('title', de
                ? 'Das Raster wird noch aufgebaut \u2014 die Endzahl steht, sobald alle Kacheln da sind.'
                : 'The grid is still being built \u2014 the final count appears once every tile is in place.');
        } else {
            /* `rohtext` ist der Weg fuer Aufrufer, die einen fertigen Satz
               mitbringen statt Anzahl + Wort (resetDeckOverviewCounts).
               Er geht ausdruecklich durch DIESEN Schreiber, damit auch
               dort der Aufbau-Hinweis vom Knoten verschwindet — genau
               daran ist Befund B4 haengen geblieben. */
            text = (typeof o.rohtext === 'string') ? o.rohtext : (o.anzahl + ' ' + wort);
            el.removeAttribute('title');
        }
        el.textContent = text;
        // Fuer Tests und fuer die Fehlersuche: wer zuletzt geschrieben hat.
        window.__uebersichtZaehler = {
            zaehlerId: zaehlerId, text: text, quelle: o.quelle || 'unbekannt',
            anzahl: o.anzahl, soll: o.soll, unvollstaendig: !!o.unvollstaendig
        };
        return text;
    }

    /** Wie viele Kacheln das Raster am Ende tragen soll (vom Zeichner
     *  gesetzt), oder null, wenn der Zeichner nichts gesagt hat. */
    function kachelnSoll(gitter) {
        const roh = gitter && gitter.getAttribute ? gitter.getAttribute(ZAEHLER_MARKE) : null;
        if (roh === null || roh === '') return null;
        const n = parseInt(roh, 10);
        return Number.isFinite(n) ? n : null;
    }

    /* BEFUND B4 (Pruefagent, 07.09.2026): hier stand setText(countId, …)
     * — also ein Schreiber AM gemeinsamen Schreiber vorbei — und danach
     * wurde nur der Buchfuehrungsknoten window.__uebersichtZaehler auf
     * "resetDeckOverviewCounts" gesetzt. Gemessen: ein Zaehler
     * "12 / 34 Karten …" mit title="Das Raster wird noch aufgebaut …"
     * trug nach dem Ruecksetzen den Text "0 Karten" UND weiterhin den
     * alten title. Die Behauptung "nur noch ein Schreiber" war damit
     * falsch, und der Nutzer las einen Aufbau-Hinweis an einer Endzahl.
     *
     * Jetzt geht auch dieser Weg durch uebersichtZaehlerSchreiben. Und
     * der Buchfuehrungsknoten wird nur noch gesetzt, wenn wirklich
     * geschrieben wurde: fehlt der Zaehlerknoten, gibt es nichts zu
     * melden — vorher meldete er einen Schreibvorgang, den es nicht gab.
     */
    function resetDeckOverviewCounts(countId, summaryId, cardsText, totalText) {
        uebersichtZaehlerSchreiben(countId, {
            rohtext: cardsText || '0 Cards',
            anzahl: 0, soll: 0, unvollstaendig: false,
            quelle: 'resetDeckOverviewCounts'
        });
        setText(summaryId, totalText || '/ 0 Total');
    }

    function renderNoDeckSelectedState(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const text = message || 'Please select a deck from the dropdown to load cards.';
        container.innerHTML = '<div class="deck-builder-empty-state" role="status" aria-live="polite"><h4 class="deck-builder-empty-title">'
            + text + '</h4></div>';
    }

    // ── Der Kachelfilter der drei Uebersichten ───────────────────────
    //
    // BEFUND (03.09.2026, Dublettenmessung zu Aufgabe #16): City League,
    // Current Meta und Past Meta hatten diese Funktion dreimal, zu
    // 88-95 % wortgleich. Gemessen wurden 3 x 43 normalisierte Zeilen mit
    // nur zwei bzw. vier abweichenden Stellen — die Element-Kennungen,
    // die Filtervariable, und ein echter Verhaltensunterschied:
    //
    //   City League + Past Meta   card.classList.add/remove('d-none')
    //   Current Meta              card.style.display = 'none' / ''
    //
    // Der Inline-Stil ist genau das Muster, das dieses Projekt sich in
    // app-city-league.js (Z. 535 ff.) als Falle notiert hat. Ein Live-Bug
    // war er nicht — auf .card-item liegt weder in ui-components.css noch
    // in styles.css eine display-Regel, und Current Meta war die einzige
    // Stelle im Projekt, die Kacheln per Inline-Stil versteckt. Beim
    // Zusammenlegen faellt er trotzdem weg: eine Klasse laesst sich per
    // CSS uebersteuern, ein Inline-Stil nicht.
    //
    // Was NICHT zusammengelegt wurde und warum, steht in
    // docs/geparkte-features.md — renderDeckGrid und copyDeckOverview
    // sehen aehnlich aus, sind aber mit acht Verhaltensunterschieden
    // auseinandergelaufen.
    function uebersichtKachelnFiltern(o) {
        const suchfeld = document.getElementById(o.suchfeldId);
        if (!suchfeld) return;
        const gitter = document.getElementById(o.gitterId);
        if (!gitter) return;

        const suchbegriff = suchfeld.value.toLowerCase().trim();
        const typFilter = o.typFilter || 'all';
        const kacheln = gitter.querySelectorAll('.card-item');
        let sichtbar = 0;

        kacheln.forEach(kachel => {
            const name   = kachel.getAttribute('data-card-name') || '';
            const nameDe = kachel.getAttribute('data-card-name-de') || '';
            const typ    = kachel.getAttribute('data-card-type') || '';
            const set    = kachel.getAttribute('data-card-set') || '';
            const nummer = kachel.getAttribute('data-card-number') || '';

            const setNrMitLuecke = `${set} ${nummer}`;
            const setNrOhneLuecke = `${set}${nummer}`;
            // Die Kachel kennt nur ihren Namen; der gemeinsame Helfer
            // faellt deshalb auf window.pokedexNumbers zurueck. Ohne
            // diesen Zweig fand die Suche 0 Treffer ueber die
            // Pokedex-Nummer, obwohl der Platzhalter sie verspricht
            // (Befunde D und N, 30.08.2026).
            const dexNr = (typeof window.cardPokedexSearchValue === 'function')
                ? window.cardPokedexSearchValue({ name })
                : '';
            const passtSuche = suchbegriff === ''
                || name.includes(suchbegriff)
                || nameDe.includes(suchbegriff)
                || setNrMitLuecke.includes(suchbegriff)
                || setNrOhneLuecke.includes(suchbegriff)
                || (dexNr !== '' && dexNr === suchbegriff)
                || (suchbegriff.length >= 3 && dexNr !== '' && dexNr.includes(suchbegriff));

            const passtTyp = typFilter === 'all' || typ === typFilter
                || (typFilter === 'Energy' && typ === 'Basic Energy');

            if (passtSuche && passtTyp) {
                kachel.classList.remove('d-none');
                sichtbar++;
            } else {
                kachel.classList.add('d-none');
            }
        });

        if (o.zaehlerId) {
            // Waechst das Raster noch, wird die Zwischenzahl als solche
            // ausgewiesen statt als Endstand ausgegeben.
            const soll = kachelnSoll(gitter);
            const unvollstaendig = (soll !== null && kacheln.length < soll);
            uebersichtZaehlerSchreiben(o.zaehlerId, {
                anzahl: sichtbar,
                soll: soll,
                unvollstaendig: unvollstaendig,
                kartenWort: o.kartenWort,
                quelle: 'uebersichtKachelnFiltern'
            });
        }

        // Die Abschnittskoepfe zeigten sonst weiter die ungefilterten
        // Zahlen und blieben bei 0 Treffern stumm stehen (Befund E,
        // 30.08.2026). Melden, nicht verschweigen.
        if (typeof window.uebersichtSuchergebnisMelden === 'function') {
            window.uebersichtSuchergebnisMelden(gitter, sichtbar);
        }
        return sichtbar;
    }

    window.uebersichtZaehlerSchreiben = uebersichtZaehlerSchreiben;
    window.uebersichtKachelnSoll = kachelnSoll;
    window.UEBERSICHT_ZAEHLER_MARKE = ZAEHLER_MARKE;
    window.updateDeckStatsByIds = updateDeckStatsByIds;
    window.resetDeckOverviewCounts = resetDeckOverviewCounts;
    window.renderNoDeckSelectedState = renderNoDeckSelectedState;
    window.uebersichtKachelnFiltern = uebersichtKachelnFiltern;

    // showDeckSections / hideDeckSections sind am 03.09.2026 entfallen:
    // ueber js/ und index.html gemessen null Aufrufer, seit sie 2026
    // angelegt wurden. Ein Export ohne Aufrufer ist kein Angebot,
    // sondern eine Behauptung ueber die Architektur.
})();
