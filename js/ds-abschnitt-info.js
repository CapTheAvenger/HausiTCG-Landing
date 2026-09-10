// ds-abschnitt-info.js — die lange Erklaerung wandert hinter den Knopf.
//
// WAS GEMELDET WURDE (10.09.2026, mit fuenf Bildschirmfotos vom Telefon)
// ---------------------------------------------------------------------
// Vier Textwaende standen mitten in der Meta-Ansicht und schoben die
// Zahlen nach unten. Gemessen an den Bildern:
//
//   Quellen-Balken          zwei Zeilen ueber der Ueberschrift
//   Tier-Grundlage          9 Zeilen, 611 Zeichen
//   Heatmap-Erklaerung      6 Zeilen Fliesstext + 5 Zeilen Legende
//   Meta-Performance        7 Zeilen, 540 Zeichen
//
// Woertlich: "wird sonst zu viel Text auf der Seite, was auch geht waere
// den Text zu zeigen wenn man ueber den Auswertungstitel hovert oder wie
// man das Professor eich Bild neben jedem Titel und geben darueber die
// Beschreibung, Infos und Legenden."
//
// WARUM DER KNOPF UND NICHT DAS HOVER
// -----------------------------------
// Alle fuenf Bilder sind vom Telefon. Auf einem Touchscreen gibt es kein
// Hover — ein Text, der nur bei :hover erscheint, ist dort schlicht
// unerreichbar. Der Knopf ist auf beiden Geraeten dieselbe Geste.
//
// WAS DIESE DATEI IST — UND WAS SIE AUSDRUECKLICH NICHT IST
// --------------------------------------------------------
// Sie ist ein REGISTER, keine zweite Textquelle.
//
// Das ist der ganze Punkt. Die Tier-Grundlage nennt Gewichte, Deckel und
// Listenzahlen, die zur Laufzeit aus den Daten kommen ("hier 365 von
// 3.644 Listen"). Die Meta-Performance beschreibt Spalten, die je nach
// Datenlage da sind oder nicht. Wer solche Texte hierher KOPIERT, hat
// beim naechsten Datenlauf zwei Wahrheiten — und die falsche steht im
// Dialog, wo sie niemand nachrechnet.
//
// Deshalb: der Erzeuger baut seinen Text weiter dort, wo die Zahlen
// sind, und MELDET ihn hierher (`melde`). Diese Datei entscheidet nur,
// WO er erscheint — hinter dem Knopf statt auf der Flaeche.
//
// Fehlt eine Meldung, gibt es keinen Knopf. Ein Knopf, der einen leeren
// Dialog oeffnet, ist schlimmer als kein Knopf.
(function (global) {
    'use strict';

    /* id -> { titel, html } — zur Laufzeit gefuellt. Kein Vorrat an
       Texten hier: was nicht gemeldet wurde, gibt es nicht. */
    var REGISTER = {};

    /* Wer auf eine Aenderung wartet (ds-sections.js zeichnet die Knoepfe
       nach, sobald ein Abschnitt zum ersten Mal etwas meldet). */
    var HOERER = [];

    function de() {
        return !(typeof global.getLang === 'function' && global.getLang() === 'en');
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    /**
     * Einen Abschnittstext melden.
     *
     * @param {string} id     Abschnittskennung, dieselbe wie in ds-sections.js
     * @param {Object} inhalt { titel?: string, html: string }
     *
     * `html` darf Markup enthalten — die Erzeuger bauen ihre Texte mit
     * <strong> und Tabellen. Es kommt AUS DEM EIGENEN QUELLTEXT, nicht
     * aus Nutzereingaben; wo Daten einfliessen, maskieren die Erzeuger
     * selbst (escapeHtml), so wie sie es beim Rendern auf der Flaeche
     * auch getan haben.
     */
    function melde(id, inhalt) {
        if (!id || !inhalt || !inhalt.html) return;
        var vorher = REGISTER[id] && REGISTER[id].html;
        REGISTER[id] = { titel: inhalt.titel || '', html: inhalt.html };
        if (vorher !== inhalt.html) {
            HOERER.forEach(function (f) {
                try { f(id); } catch (e) { console.warn('[AbschnittInfo] Hoerer:', e); }
            });
        }
    }

    /** Gibt es fuer diesen Abschnitt etwas zu zeigen? */
    function hat(id) {
        return !!(REGISTER[id] && REGISTER[id].html);
    }

    function hol(id) {
        return REGISTER[id] ? Object.assign({}, REGISTER[id]) : null;
    }

    function beiAenderung(f) {
        if (typeof f === 'function') HOERER.push(f);
    }

    /**
     * Den Dialog oeffnen. Nutzt denselben #helpModal wie openTabHelp() —
     * ein zweiter Dialog mit eigener Fokusfalle waere eine zweite Stelle,
     * an der Tastaturbedienung kaputtgehen kann.
     */
    function zeige(id, ueberschrift) {
        var eintrag = REGISTER[id];
        if (!eintrag) return false;
        var modal = document.getElementById('helpModal');
        if (!modal) return false;
        var titelEl = modal.querySelector('.help-modal-title');
        var bodyEl = modal.querySelector('.help-modal-body');
        if (!titelEl || !bodyEl) return false;

        titelEl.textContent = eintrag.titel || ueberschrift ||
            (de() ? 'Zu dieser Auswertung' : 'About this view');
        bodyEl.innerHTML = eintrag.html;
        modal.classList.add('active');
        if (global.HintergrundSperre) global.HintergrundSperre.sperren('hilfe');

        var zuerst = modal.querySelector('.help-modal-close') || modal;
        if (zuerst && typeof zuerst.focus === 'function') zuerst.focus();
        return true;
    }

    /**
     * Das Markup des Knopfes. Dieselbe Klasse wie der vorhandene
     * Professor-Eich-Knopf neben den Reiter-Ueberschriften
     * (js/app-meta-call.js, js/app-testing-groups.js) — ein zweites
     * Aussehen fuer dieselbe Geste waere eine Marke, die nichts bedeutet.
     */
    function knopfHtml(id, ueberschrift) {
        if (!hat(id)) return '';
        var lab = de()
            ? ('Beschreibung und Legende: ' + (ueberschrift || ''))
            : ('Description and legend: ' + (ueberschrift || ''));
        return '<button type="button" class="tab-help-btn ds-abschnitt-info"' +
            ' data-abschnitt-info="' + esc(id) + '"' +
            ' title="' + esc(de() ? 'Beschreibung, Zahlen und Legende' : 'Description, figures and legend') + '"' +
            ' aria-label="' + esc(lab.trim()) + '"></button>';
    }

    /* Ein einziger Zuhoerer am Dokument statt eines je Knopf: die
       Abschnitte werden neu gezeichnet, wenn Daten nachkommen, und ein
       Handler am Knopf waere dann weg. */
    function verdrahte() {
        if (document._abschnittInfoVerdrahtet) return;
        document._abschnittInfoVerdrahtet = true;
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('[data-abschnitt-info]');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();          // sonst klappt der Abschnitt zu
            zeige(btn.getAttribute('data-abschnitt-info'),
                  btn.getAttribute('aria-label') || '');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verdrahte);
    } else {
        verdrahte();
    }

    global.DsAbschnittInfo = {
        melde: melde,
        hat: hat,
        hol: hol,
        zeige: zeige,
        knopfHtml: knopfHtml,
        beiAenderung: beiAenderung,
        /* Nur fuer Tests: das Register leeren. */
        _leeren: function () { REGISTER = {}; }
    };
})(typeof window !== 'undefined' ? window : this);
