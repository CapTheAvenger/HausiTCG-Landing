/**
 * Kartentexte sind auf Englisch — und das steht jetzt dran.
 *
 * BEFUND (10.09.2026)
 * -------------------
 * Die Kartendatenbank fuehrt Kartennamen zweisprachig (`name_en`,
 * `name_de`), den KARTENTEXT aber nur einmal: `card_text` in
 * data/all_cards_database.csv und in den data/cards_chunk_*.json.
 * Ein deutsches Gegenstueck gibt es nicht — weder in der CSV-Kopfzeile
 * noch in den Chunks (nachgesehen am 10.09.2026: die Kopfzeile lautet
 * name_en,name_de,set,number,type,energy_type,hp,rarity,image_url,
 * international_prints,jp_prints,cardmarket_url,card_text).
 *
 * Der deutsche Nutzer bekam den englischen Text also kommentarlos
 * serviert und musste selbst darauf kommen, dass das kein Fehler ist,
 * sondern die Datenlage.
 *
 * ENTSCHEIDUNG DES BETREIBERS (10.09.2026)
 * ----------------------------------------
 * "Englisch zeigen, sichtbar gekennzeichnet." Also nicht uebersetzen,
 * nicht verstecken, nicht raten — sondern danebenschreiben, woher der
 * Text kommt.
 *
 * WARUM DAS HIER STEHT UND NICHT AN DER ANZEIGESTELLE
 * ---------------------------------------------------
 * Weil es mehr als eine Anzeigestelle werden kann. Eine Kennzeichnung,
 * die an jeder Stelle neu getippt wird, driftet auseinander und wird an
 * der naechsten Stelle vergessen — genau die Sorte Fehler, die
 * tests/unit/test-kartentext-kennzeichnung.js findet: der Test zaehlt
 * die Anzeigestellen im Quelltext und verlangt von JEDER den Aufruf
 * hierher.
 *
 * SPRACHREINHEIT
 * --------------
 * tests/e2e_i18n_language_purity.py liest sichtbaren Text aus
 * `[data-i18n]` sowie aus h1..h5, label, button, a, .tab-btn und
 * .menu-item-label. Der englische Kartentext darf in KEINEM dieser
 * Traeger stehen, sonst meldet die Pruefung zu Recht Fremdtext in der
 * deutschen Oberflaeche. Deshalb baut `umhuellen` den Text in ein
 * <div lang="en"> und die Kennzeichnung in ein <p> — dieselbe Loesung,
 * die js/ds-pocket.js fuer Game8s englische Decknamen benutzt
 * (role="heading" statt <h3>, siehe der Kommentar dort).
 * Die Kennzeichnung SELBST ist uebersetzt und faellt damit auch dann
 * nicht auf, wenn die Pruefung spaeter weitere Traeger liest.
 */

(function () {
    'use strict';

    var TEXTE = {
        de: {
            chip:  'EN',
            label: 'Kartentext auf Englisch',
            titel: 'Die Quelle liefert Kartentexte nur auf Englisch.'
        },
        en: {
            chip:  'EN',
            label: 'Card text in English',
            titel: 'The source only provides card text in English.'
        }
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /**
     * 'de' oder 'en'. Ein uebergebener Wert gewinnt (die Anzeigestelle
     * kennt ihre eigene Sprachlogik), sonst window.getLang(), sonst
     * 'en' — dieselbe Rueckfallordnung wie uiLang() in
     * js/app-profile-deck-builder.js.
     */
    function sprache(vorgabe) {
        if (vorgabe === 'de' || vorgabe === 'en') return vorgabe;
        try {
            if (typeof window !== 'undefined' && typeof window.getLang === 'function') {
                return window.getLang() === 'de' ? 'de' : 'en';
            }
        } catch (e) { /* getLang darf fehlen — dann eben 'en' */ }
        return 'en';
    }

    /** Nur das Abzeichen, ohne den Text. HTML-Zeichenkette. */
    function abzeichen(vorgabe) {
        var l = TEXTE[sprache(vorgabe)];
        return '<p class="kartentext-hinweis" data-kartentext-quelle="en" title="' +
               esc(l.titel) + '">' +
               '<span class="kartentext-hinweis-chip" aria-hidden="true">' +
               esc(l.chip) + '</span>' +
               '<span class="kartentext-hinweis-text">' + esc(l.label) + '</span>' +
               '</p>';
    }

    /**
     * Abzeichen + der englische Kartentext, fertig zum Einsetzen.
     *
     * `innenHtml` ist BEREITS fertiges HTML (die Anzeigestelle hat den
     * Rohtext selbst maskiert und in Absaetze zerlegt) — hier wird
     * deshalb nicht noch einmal maskiert, das wuerde die Absaetze
     * zerstoeren.
     */
    function umhuellen(innenHtml, vorgabe) {
        return abzeichen(vorgabe) +
               '<div class="kartentext-original" lang="en">' +
               String(innenHtml == null ? '' : innenHtml) +
               '</div>';
    }

    var API = {
        TEXTE: TEXTE,
        sprache: sprache,
        abzeichen: abzeichen,
        umhuellen: umhuellen
    };

    if (typeof window !== 'undefined') window.KartentextHinweis = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
