/* Welche Champions-Pokemon der Nutzer schon als Shiny besitzt.
 *
 * Ein Stern je Eintrag, mehr nicht — so vom Betreiber am 09.09.2026
 * entschieden ("nur Shiny im Besitz", nicht zusaetzlich normal gefangen
 * oder eine Wunschliste).
 *
 * ZWEI SPEICHER, UND ZWAR IN DIESER REIHENFOLGE:
 *
 *   1. localStorage — immer. Der Stern muss auch ohne Anmeldung und ohne
 *      Netz sofort haften; wer im Zug durch das Raster tippt, will nicht
 *      erst ein Konto anlegen.
 *   2. Das Nutzerdokument in Firestore — nur wenn angemeldet, ueber
 *      window.updateUserDoc({ championsShiny: [...] }). Das ist ein
 *      update() auf GENAU dieses eine Feld; Sammlung, Wunschliste,
 *      Tradelist und Decks werden dabei nicht angefasst.
 *
 * BEIM ANMELDEN WIRD VEREINIGT, NICHT ERSETZT. Wer auf dem Telefon zehn
 * Sterne setzt und sich danach am Rechner anmeldet, haette bei einem
 * "Wolke gewinnt" zehn Sterne verloren. Ein Stern ist eine Aussage ueber
 * die Wirklichkeit ("ich habe das Vieh"), und die verschwindet nicht,
 * weil ein zweites Geraet nichts davon weiss. Loeschen geht deshalb nur
 * ueber den bewussten Klick auf einen gesetzten Stern.
 *
 * SCHLUESSEL: "<dex>|<form>", z. B. "38|Regional" fuer Vulnona (Alola)
 * und "38|Base" fuer Vulnona. Die Pokedex-Nummer allein reicht nicht —
 * das Roster fuehrt 292 Eintraege auf 204 Arten.
 */
(function () {
    'use strict';

    var SCHLUESSEL = 'championsShinyV1';
    var FELD = 'championsShiny';

    var _set = null;          // Set<string> — null solange nicht geladen
    var _wolkeGelesen = false;

    function eintragSchluessel(e) {
        if (!e) return '';
        var dex = (e.dex != null) ? e.dex : '';
        var form = e.form || 'Base';
        return dex + '|' + form;
    }

    function lies() {
        if (_set) return _set;
        _set = new Set();
        try {
            var roh = localStorage.getItem(SCHLUESSEL);
            if (roh) {
                var arr = JSON.parse(roh);
                if (Array.isArray(arr)) arr.forEach(function (k) { _set.add(String(k)); });
            }
        } catch (_e) { /* privater Modus, geleerter Speicher — leer ist ok */ }
        return _set;
    }

    function schreibeLokal() {
        try {
            localStorage.setItem(SCHLUESSEL, JSON.stringify([...lies()]));
        } catch (_e) { /* Speicher voll oder gesperrt: der Stern bleibt fuer diese Sitzung */ }
    }

    function schreibeWolke() {
        if (typeof window.updateUserDoc !== 'function') return Promise.resolve(false);
        var auth = window.auth || (window.firebase && window.firebase.auth && window.firebase.auth());
        if (!auth || !auth.currentUser) return Promise.resolve(false);
        var payload = {};
        payload[FELD] = [...lies()];
        return Promise.resolve(window.updateUserDoc(payload))
            .then(function () { return true; })
            .catch(function (err) {
                // Nicht verschlucken: der Stern steht lokal, aber der Nutzer
                // soll wissen, dass er nicht am zweiten Geraet ankommt.
                console.warn('[champions-shiny] Wolke nicht geschrieben:', err && err.message);
                return false;
            });
    }

    function hat(e) { return lies().has(eintragSchluessel(e)); }

    function umschalten(e) {
        var k = eintragSchluessel(e);
        if (!k) return false;
        var s = lies();
        if (s.has(k)) s.delete(k); else s.add(k);
        schreibeLokal();
        schreibeWolke();
        try {
            document.dispatchEvent(new CustomEvent('championsShinyChanged',
                { detail: { schluessel: k, gesetzt: s.has(k), anzahl: s.size } }));
        } catch (_e) { /* ohne DOM (Testlauf) gibt es nichts zu melden */ }
        return s.has(k);
    }

    function anzahl() { return lies().size; }

    /* Einmal je Sitzung aus dem Nutzerdokument nachladen und VEREINIGEN. */
    function ausWolkeLaden() {
        if (_wolkeGelesen) return Promise.resolve(anzahl());
        var auth = window.auth || (window.firebase && window.firebase.auth && window.firebase.auth());
        var db = window.db;
        if (!auth || !auth.currentUser || !db) return Promise.resolve(anzahl());
        _wolkeGelesen = true;
        return db.collection('users').doc(auth.currentUser.uid).get()
            .then(function (doc) {
                var d = doc && doc.exists ? doc.data() : null;
                var fern = (d && Array.isArray(d[FELD])) ? d[FELD] : [];
                var s = lies();
                var vorher = s.size;
                fern.forEach(function (k) { s.add(String(k)); });
                if (s.size !== vorher) {
                    schreibeLokal();
                    try {
                        document.dispatchEvent(new CustomEvent('championsShinyChanged',
                            { detail: { schluessel: null, gesetzt: null, anzahl: s.size } }));
                    } catch (_e) { /* ohne DOM nichts zu melden */ }
                }
                // Was nur lokal stand, gehoert jetzt auch in die Wolke.
                if (s.size !== fern.length) schreibeWolke();
                return s.size;
            })
            .catch(function (err) {
                console.warn('[champions-shiny] Wolke nicht gelesen:', err && err.message);
                return anzahl();
            });
    }

    window.ChampionsShiny = {
        schluessel: eintragSchluessel,
        hat: hat,
        umschalten: umschalten,
        anzahl: anzahl,
        alle: function () { return [...lies()]; },
        ausWolkeLaden: ausWolkeLaden,
        _speicherSchluessel: SCHLUESSEL,
        _feld: FELD,
    };
})();
