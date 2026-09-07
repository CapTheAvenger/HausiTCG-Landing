// js/app-calculator.js

(function () {
    function combinations(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        let c = 1;
        for (let i = 1; i <= k; i++) {
            c = c * (n - i + 1) / i;
        }
        return c;
    }

    function hypergeom(deckSize, copiesInDeck, cardsDrawn, targetCopies) {
        const successCombos = combinations(copiesInDeck, targetCopies);
        const failCombos = combinations(deckSize - copiesInDeck, cardsDrawn - targetCopies);
        const totalCombos = combinations(deckSize, cardsDrawn);
        if (totalCombos === 0) return 0;
        return (successCombos * failCombos) / totalCombos;
    }

    function probabilityAtLeastOne(deckSize, copiesInDeck, cardsDrawn) {
        if (copiesInDeck <= 0 || cardsDrawn <= 0) return 0;
        return (1 - hypergeom(deckSize, copiesInDeck, cardsDrawn, 0)) * 100;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    // Prozent locale-abhaengig, 2 Nachkommastellen. Nutzt app-utils.formatPercent
    // (de: "11,67 %", en: "11.67%"); faellt bei fehlendem Helfer sprachbewusst
    // zurueck, damit die deutsche UI nie einen Punkt-Dezimaltrenner zeigt
    // (Audit 2, F10).
    function _calcPct(prob) {
        if (typeof formatPercent === 'function') return formatPercent(prob, 2);
        const de = (typeof getLang === 'function' && getLang() === 'de');
        const s = Number(prob).toFixed(2);
        return de ? s.replace('.', ',') + ' %' : s + '%';
    }

    /**
     * Klemmen und es sagen (20.08.2026).
     *
     * Bisher wurde jede Eingabe still in den gueltigen Bereich gezogen,
     * ohne das Feld anzufassen. Auf dem Bildschirm stand dann eine Zahl,
     * mit der NICHT gerechnet wurde:
     *
     *     Kopien 0   ->  gerechnet mit 1  ->  Anzeige "11,67 %"
     *     Deck 0     ->  gerechnet mit 1  ->  Anzeige "100,00 %"
     *
     * Beides sieht aus wie ein Ergebnis fuer die eingegebene Zahl. Jetzt
     * wird der geklemmte Wert ins Feld zurueckgeschrieben und das Feld
     * kurz markiert — die Rechnung und das, was dasteht, sagen wieder
     * dasselbe.
     */
    /* ── Zwei Nachbesserungen vom 07.09.2026, beide gemessen ──────────
     *
     * (1) DAS LEERE FELD RECHNETE STILL WEITER (F13.3b). Gemessen: Feld
     *     "Karten im Deck" geleert, Kopien 4, gezogen 7 →
     *
     *       Feld:      ""              (leer, ohne Titel, ohne Hinweis)
     *       Fusszeile: "4 von 60 Karten, 7 gezogen"
     *       Ergebnis:  "39,95 %"
     *
     *     Gerechnet wurde mit 60, obwohl nirgends 60 stand: `String(el.value)
     *     .trim() !== ''` schloss den Leerfall aus, und getInputNumber()
     *     lieferte den Ersatzwert stumm.
     *
     *     NICHT behoben wird das, indem die 60 ins Feld geschrieben wird.
     *     Ein leeres Feld ist der Normalzustand beim Tippen — wer 60 loescht,
     *     um 59 einzugeben, bekaeme die 60 im selben Tastendruck zurueck.
     *     Genau davor steht seit dem 20.08.2026 eine Zusicherung
     *     ("ein leeres Feld bleibt leer — dort tippt gerade jemand",
     *     tests/unit/test-rechenfehler.js), und sie hat recht.
     *
     *     Der Ausfall ist die STILLE, nicht der Ersatzwert. Also wird er
     *     benannt: eine Zeile unter den Eingabefeldern sagt, welches Feld
     *     leer ist und mit welcher Zahl gerechnet wurde, und das Feld traegt
     *     denselben Satz als Titel. Das Feld selbst bleibt unberuehrt.
     *
     * (2) DIE KLEMM-KASKADE ZERSTOERTE DREI EINGABEN (F13.3c). Gemessen:
     *     Deck 1, Kopien 4, gezogen 7, in der Hand 2 → alle vier Felder
     *     standen danach auf 1. Zurueck auf Deck 60: Kopien 1, gezogen 1,
     *     in der Hand 1 — die 4, die 7 und die 2 waren fort.
     *
     *     Ursache ist nicht das Klemmen, sondern WAS geklemmt wurde. Eine
     *     Untergrenze wie "mindestens 1 Kopie" gilt immer; die Obergrenze
     *     "hoechstens so viele wie das Deck gross ist" gilt nur, solange die
     *     Deckgroesse so klein ist. Ein Wert, der nur an einer FREMDEN
     *     Eingabe scheitert, darf die eigene nicht ueberschreiben — sonst
     *     macht ein Tippfehler im ersten Feld die anderen drei kaputt.
     *
     *     Untere und eigene Grenzen werden also weiter ins Feld geschrieben,
     *     abhaengige Obergrenzen nicht. Gerechnet wird trotzdem mit dem
     *     geklemmten Wert, und der steht im Titel des Feldes und in der
     *     Fusszeile unter dem Ergebnis. `schreibeObergrenze` sagt, welche
     *     der beiden Sorten die Obergrenze ist.
     */
    function feldName(id) {
        var lab = document.querySelector('label[for="' + id + '"]');
        var txt = lab ? String(lab.textContent || '').trim() : '';
        return txt || id;
    }

    function leseUndKlemme(id, fallback, min, max, schreibeObergrenze) {
        const el = document.getElementById(id);
        const roh = getInputNumber(id, fallback);
        const wert = clamp(roh, min, max);
        const de = (typeof getLang === 'function' && getLang() === 'de');
        /* BEFUND 07.09.2026: getInputNumber() liest mit parseInt. Aus "6.5"
         * wird damit 6, und weil 6 im gueltigen Bereich liegt, galt
         * roh === wert — der Zweig ganz unten nahm den Titel WEG. Auf dem
         * Bildschirm stand 6.5, gerechnet wurde mit 6, und nichts sagte es.
         * Eine halbe Karte gibt es nicht; abgeschnitten wird weiter, aber
         * es steht jetzt dabei. Erkannt wird es am Feldtext selbst, nicht
         * an einem Merker von aussen. */
        const rohText = el ? String(el.value).trim() : '';
        const rohZahl = rohText === '' ? NaN : Number(rohText.replace(',', '.'));
        const abgeschnitten = Number.isFinite(rohZahl) && rohZahl !== roh;

        if (el && String(el.value).trim() === '') {
            /* Das Feld bleibt leer — dort tippt gerade jemand. Aber es sagt,
             * womit die Rechnung daneben gerade laeuft. Gesammelt wird das
             * NICHT hier: vorgabeHinweisZeigen() sieht selbst nach, welche
             * Felder leer sind. So bleibt diese Funktion ohne Seitenkanal
             * und laesst sich fuer sich allein ausfuehren. */
            el.setAttribute('title', de
                ? `Feld leer — gerechnet wird mit dem Vorgabewert ${wert}.`
                : `Field empty — the calculation uses the default ${wert}.`);
            return wert;
        }

        if (el && roh !== wert) {
            const nurObergrenze = (roh > max && roh >= min);
            const fremdeGrenze = (nurObergrenze && schreibeObergrenze === false);
            if (!fremdeGrenze) {
                el.value = String(wert);
            }
            el.classList.add('calc-input-geklemmt');
            el.setAttribute('title', fremdeGrenze
                ? (de
                    ? `${roh} passt nicht zu den anderen Eingaben — gerechnet wird mit ${wert}. `
                      + `Die Eingabe bleibt stehen und gilt wieder, sobald die Obergrenze ${roh} zulässt.`
                    : `${roh} does not fit the other inputs — the calculation uses ${wert}. `
                      + `Your entry stays and applies again as soon as the limit allows ${roh}.`)
                : (de
                    ? `Wert auf den gültigen Bereich ${min}–${max} gesetzt — gerechnet wird mit ${wert}.`
                    : `Value set to the valid range ${min}–${max} — the calculation uses ${wert}.`));
            clearTimeout(el._klemmTimer);
            el._klemmTimer = setTimeout(() => {
                el.classList.remove('calc-input-geklemmt');
            }, 1600);
        } else if (el && abgeschnitten) {
            /* Der Wert liegt im gueltigen Bereich, ist aber nicht der, der im
             * Feld steht. Dasselbe Aussehen wie beim Klemmen, damit die Stelle
             * auffaellt — und ein Satz, der beide Zahlen nennt. */
            el.classList.add('calc-input-geklemmt');
            el.setAttribute('title', de
                ? `${rohText} ist keine ganze Zahl — gerechnet wird mit ${wert}. `
                  + 'Karten gibt es nur ganz.'
                : `${rohText} is not a whole number — the calculation uses ${wert}. `
                  + 'Cards come in whole units.');
            clearTimeout(el._klemmTimer);
            el._klemmTimer = setTimeout(() => {
                el.classList.remove('calc-input-geklemmt');
            }, 1600);
        } else if (el && roh === wert) {
            el.classList.remove('calc-input-geklemmt');
            el.removeAttribute('title');
        }
        return wert;
    }

    /* Die Zeile unter den Eingabefeldern. index.html traegt sie nicht (die
     * Datei gehoert diesem Paket nicht), also legt das Modul sie einmal an
     * und benutzt die Klassen, die die Fusszeilen daneben schon haben. */
    function vorgabeHinweisZeigen(paare) {
        var wirt = document.querySelector('#calculator .calc-params');
        if (!wirt) return;
        var leere = (paare || []).filter(function (p) {
            var el = document.getElementById(p[0]);
            return el && String(el.value).trim() === '';
        });
        /* Felder, in denen etwas ANDERES steht als das, womit gerechnet wird
         * — "6.5" im Feld, 6 in der Rechnung. Dieselbe Pruefung wie in
         * leseUndKlemme, wieder ohne Merker von aussen. */
        var abgeschnittene = (paare || []).filter(function (p) {
            var el = document.getElementById(p[0]);
            if (!el) return false;
            var txt = String(el.value).trim();
            if (txt === '') return false;
            var zahl = Number(txt.replace(',', '.'));
            return Number.isFinite(zahl) && zahl !== p[1];
        });
        var zeile = document.getElementById('calc-vorgabe-hinweis');
        if (!zeile) {
            if (!leere.length && !abgeschnittene.length) return;
            zeile = document.createElement('div');
            zeile.id = 'calc-vorgabe-hinweis';
            zeile.className = 'calc-result-note calc-result-fuss';
            zeile.setAttribute('role', 'status');
            wirt.appendChild(zeile);
        }
        if (!leere.length && !abgeschnittene.length) { zeile.textContent = ''; return; }
        var de = (typeof getLang === 'function' && getLang() === 'de');
        var saetze = [];
        if (leere.length) {
            saetze.push((de
                ? 'Leeres Feld — gerechnet wird mit dem Vorgabewert: '
                : 'Empty field — the calculation uses the default: ')
                + leere.map(function (p) { return feldName(p[0]) + ' = ' + p[1]; }).join(' · '));
        }
        if (abgeschnittene.length) {
            saetze.push((de
                ? 'Keine ganze Zahl — gerechnet wird mit: '
                : 'Not a whole number — the calculation uses: ')
                + abgeschnittene.map(function (p) {
                    var el = document.getElementById(p[0]);
                    return feldName(p[0]) + ' ' + String(el.value).trim() + ' → ' + p[1];
                }).join(' · '));
        }
        zeile.textContent = saetze.join(' · ');
    }

    function getInputNumber(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const parsed = parseInt(el.value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    function updateCalculations() {
        try {
            const deckSizeEl = document.getElementById('calc-deck-size');
            const copiesEl = document.getElementById('calc-copies');
            const drawnEl = document.getElementById('calc-drawn');
            const inHandEl = document.getElementById('calc-in-hand');
            if (!deckSizeEl || !copiesEl || !drawnEl || !inHandEl) return;

        /* Nur die Deckgroesse hat eine eigene Obergrenze (99 Karten passen in
         * kein Deck). Die drei anderen haengen mit ihrer Obergrenze an der
         * Deckgroesse bzw. an den Kopien — dort wird nicht zurueckgeschrieben,
         * siehe die Notiz an leseUndKlemme. */
        const deckSize = leseUndKlemme('calc-deck-size', 60, 1, 99, true);
        const copies = leseUndKlemme('calc-copies', 1, 1, deckSize, false);
        const drawn = leseUndKlemme('calc-drawn', 7, 1, deckSize, false);
        const inHand = leseUndKlemme('calc-in-hand', 0, 0, copies, false);

        // Verbleibende Karten im Deck nach Hand und Preisen
        const remaining = Math.max(deckSize - drawn - 6, 0);
        const remainingEl = document.getElementById('calc-remaining-deck');
        if (remainingEl) remainingEl.textContent = remaining;

        // 1. Wahrscheinlichkeit mindestens 1 beim Ziehen (z.B. Starthand)
        const drawProb = probabilityAtLeastOne(deckSize, copies, drawn);
        const drawResEl = document.getElementById('res-draw');
        // Locale-abhaengig formatieren (de: "11,67 %", en: "11.67%") —
        // konsistent mit app-utils.formatPercent statt rohem toFix(2)+'%',
        // das in der deutschen UI einen Punkt-Dezimaltrenner zeigte
        // (Audit 2, F10, gemessen 21.08.2026).
        if (drawResEl) drawResEl.textContent = _calcPct(drawProb);

        // 2. Preiskarten-Wahrscheinlichkeit (mindestens 1 in den 6 Preiskarten)
        const copiesLeft = copies - inHand;
        const prizePool = deckSize - drawn; // Karten nach Starthand
        let prizeProb = 0;
        if (copiesLeft > 0 && prizePool >= 6) {
            prizeProb = probabilityAtLeastOne(prizePool, copiesLeft, 6);
        }
        const prizeResEl = document.getElementById('res-prize');
        if (prizeResEl) prizeResEl.textContent = _calcPct(prizeProb);

        // 3. Topdeck-Wahrscheinlichkeit (nächste Karte nach Hand + Preise)
        //
        // The denominator is the UNSEEN pool (deck + prizes), not the deck
        // alone. After the opening hand, deckSize - drawn cards are unseen;
        // six of them become prizes, but which six is unknown, so every unseen
        // card is equally likely to be sitting on top of the deck. Dividing by
        // deckSize - drawn - 6 while still counting every not-in-hand copy in
        // the numerator overstated the chance on every input, and could exceed
        // 100 % outright: deck 10, drawn 1, copies 4 gave 4/3 = 133 %.
        const unseen = Math.max(deckSize - drawn, 0);
        let topdeckProb = 0;
        if (remaining > 0 && copiesLeft > 0 && unseen > 0) {
            topdeckProb = Math.min(100, (copiesLeft / unseen) * 100);
        }
        const topdeckResEl = document.getElementById('res-topdeck');
        if (topdeckResEl) topdeckResEl.textContent = _calcPct(topdeckProb);

        /* ── Die Nenner auf den Bildschirm ──────────────────────────
         *
         * BEFUND DER ABNAHME (02.09.2026): der Rechner ermittelt
         * `remaining` (Deck nach Hand und Preisen) und schreibt es in
         * ein Element `calc-remaining-deck`, das es in index.html gar
         * nicht gibt — die Zahl wurde also berechnet und weggeworfen.
         * Auf dem Bildschirm standen drei Prozentwerte ohne jede
         * Bezugsgroesse: "Topdeck-Chance 1,89 %" ist copiesLeft/unseen,
         * die Beschriftung klang aber nach den 47 Restkarten.
         * Nachrechnen konnte das niemand.
         *
         * Dieselbe Regel wie ueberall sonst auf dieser Seite: neben der
         * Zahl steht, woraus sie folgt. */
        var de = (typeof getLang === 'function' ? getLang() : 'de') === 'de';
        var setzeFuss = function (id, text) {
            var el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        setzeFuss('calc-fuss-draw', de
            ? copies + ' von ' + deckSize + ' Karten, ' + drawn + ' gezogen'
            : copies + ' of ' + deckSize + ' cards, ' + drawn + ' drawn');
        setzeFuss('calc-fuss-prize', de
            ? copiesLeft + ' übrig in ' + prizePool + ' ungesehenen Karten, 6 davon Preiskarten'
            : copiesLeft + ' left among ' + prizePool + ' unseen cards, 6 of them prizes');
        setzeFuss('calc-fuss-topdeck', de
            ? copiesLeft + ' von ' + unseen + ' ungesehenen Karten'
            : copiesLeft + ' of ' + unseen + ' unseen cards');

        // Und die Zeile, die leere Felder beim Namen nennt (F13.3b).
        vorgabeHinweisZeigen([
            ['calc-deck-size', deckSize],
            ['calc-copies', copies],
            ['calc-drawn', drawn],
            ['calc-in-hand', inHand]
        ]);

        // Farbe der Hauptanzeige
            const drawEl = document.getElementById('res-draw');
            if (drawEl) {
                drawEl.className = 'calc-result-value';
                if (drawProb >= 70) drawEl.classList.add('calc-prob-high');
                else if (drawProb >= 40) drawEl.classList.add('calc-prob-mid');
                else drawEl.classList.add('calc-prob-low');
            }
        } catch (err) {
            // Do not break app startup if calculator UI is not mounted yet.
            console.warn('[Calculator] updateCalculations failed:', err);
        }
    }

    function init() {
        try {
            const calculatorRoot = document.getElementById('calculator');
            const inputs = calculatorRoot
                ? calculatorRoot.querySelectorAll('.calc-input')
                : document.querySelectorAll('#calculator .calc-input');
            inputs.forEach(function (input) {
                input.addEventListener('input', updateCalculations);
            });
            updateCalculations();
        } catch (err) {
            console.warn('[Calculator] init failed:', err);
        }
    }

    window.updateCalculations = updateCalculations;

    /* Sprachwechsel: die drei Ergebniszahlen mitziehen.
     *
     * URSACHE (gemessen 30.08.2026): dieses Modul hatte keinen
     * languageChanged-Listener. Die Beschriftungen daneben haengen an
     * data-i18n und werden von i18n.js selbst umgeschrieben, die Zahlen
     * dagegen entstehen nur in updateCalculations() — und das lief
     * zuletzt beim Laden bzw. beim letzten Tastendruck im Eingabefeld.
     * FOLGE: nach dem Umschalten von Deutsch auf Englisch standen
     * "11,67 %", "11,32 %", "1,89 %" unter englischen Beschriftungen
     * (umgekehrt "11.67%", "11.32%", "1.89%" unter deutschen), also drei
     * Zahlen im Trennzeichen der abgewaehlten Sprache. Ein Punkt statt
     * eines Kommas ist in einer Prozentzahl kein Schoenheitsfehler: 11.67
     * und 11,67 sind in beiden Lesarten verschiedene Zahlen.
     *
     * Neu rechnen statt nur neu formatieren: updateCalculations() ist
     * reine Arithmetik auf den vier Eingabefeldern, kostet kein Netz und
     * keine Daten, und _calcPct() fragt getLang() beim Formatieren ab.
     * Der Wert bleibt derselbe, nur die Schreibweise folgt.
     *
     * Ohne Sichtbarkeitspruefung, aber nicht ohne Bedingung: das Modul
     * baut nichts auf, es beschreibt vier feste Felder aus index.html.
     * Fehlen die Felder, kehrt updateCalculations() von selbst zurueck —
     * ein Sprachwechsel kann hier also keinen ungeoeffneten Reiter
     * befuellen. Genau die Sichtbarkeitspruefung waere hier falsch: der
     * Rechner liegt in einem eigenen Reiter, und wer woanders umschaltet,
     * traefe sonst denselben Fehler wie die Heatmap (siehe
     * js/app-current-meta.js, 30.08.2026).
     */
    document.addEventListener('languageChanged', updateCalculations);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
