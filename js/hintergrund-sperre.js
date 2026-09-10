/* hintergrund-sperre.js — die Seite hinter einem Vollbild stillhalten.
 *
 * WARUM ES DIESE DATEI GIBT
 *
 * Fuenf Stellen der Seite haben denselben Griff benutzt, um die Seite
 * hinter einem Overlay zu sperren:
 *
 *     document.body.style.overflow = 'hidden';
 *
 * Der Griff ist auf DIESER Seite wirkungslos, und zwar in jedem Browser.
 * Der Grund steht in css/styles.css:225 und css/mobile-responsive.css:10:
 *
 *     html { overflow-x: hidden; }
 *
 * Ein `overflow` am `body` wirkt nur dann auf den Viewport, wenn das
 * `html`-Element `overflow: visible` traegt (CSS Overflow, Abschnitt
 * "overflow propagation"). Sobald `html` einen eigenen Wert hat — und
 * `overflow-x: hidden` rechnet `overflow-y` auf `auto` hoch — bleibt der
 * Bildlauf beim `html`, und `body { overflow: hidden }` sperrt nur noch
 * die Box des Body, die ohnehin nicht scrollt.
 *
 * GEMESSEN live am 10.09.2026 auf 202609100611-b527580:
 *   document.body.classList.add('sqp-d-open')
 *   -> getComputedStyle(body).overflowY === 'hidden'
 *   -> getComputedStyle(html).overflowY === 'auto'
 *   window.scrollTo({top: 700, behavior:'instant'})  ->  scrollY 200 -> 700
 * Die Seite lief also trotz gesetzter Sperre weiter.
 *
 * WAS STATTDESSEN PASSIERT
 *
 * Der Body wird fuer die Dauer der Sperre auf `position: fixed` gelegt und
 * um den gemerkten Scrollstand nach oben geschoben. Damit hat das Dokument
 * keine Hoehe mehr, an der sich ein Bildlauf festmachen koennte — das
 * funktioniert auch auf iOS, wo `overflow: hidden` selbst am `html` von
 * der Touch-Geste regelmaessig uebergangen wird.
 *
 * Beim Freigeben wird der Stand exakt wiederhergestellt. Dabei muss
 * `scroll-behavior` kurz auf `auto` — `html` traegt hier `smooth`, sonst
 * animiert die Seite nach dem Schliessen sichtbar an ihre alte Stelle
 * zurueck.
 *
 * ZAEHLWEISE
 *
 * Gesperrt wird unter einem Namen, freigegeben unter demselben. Zweimal
 * dasselbe Sperren zaehlt einmal (sonst haette ein Overlay, das sich neu
 * zeichnet, den Zaehler hochgetrieben und nie wieder losgelassen). Erst
 * wenn der letzte Name weg ist, laeuft die Seite wieder.
 */
(function () {
    'use strict';

    var offen = Object.create(null);
    var anzahl = 0;
    var stand = 0;
    var gemerkt = null;

    function body() { return document.body; }

    function anlegen() {
        var b = body();
        if (!b) return false;
        stand = window.pageYOffset || document.documentElement.scrollTop || 0;
        // `|| ''` ist kein Schmuck: ein zurueckgeschriebenes `undefined`
        // landet in einer echten CSSStyleDeclaration als Zeichenkette
        // "undefined" und damit als ungueltiger Wert.
        gemerkt = {
            position: b.style.position || '',
            top: b.style.top || '',
            left: b.style.left || '',
            right: b.style.right || '',
            width: b.style.width || ''
        };
        b.style.position = 'fixed';
        b.style.top = (-stand) + 'px';
        b.style.left = '0';
        b.style.right = '0';
        b.style.width = '100%';
        b.classList.add('hintergrund-gesperrt');
        return true;
    }

    function abbauen() {
        var b = body();
        if (!b || !gemerkt) return;
        b.style.position = gemerkt.position;
        b.style.top = gemerkt.top;
        b.style.left = gemerkt.left;
        b.style.right = gemerkt.right;
        b.style.width = gemerkt.width;
        b.classList.remove('hintergrund-gesperrt');
        gemerkt = null;

        // `html` traegt scroll-behavior: smooth. Ohne diese Klammer sieht
        // der Nutzer nach dem Schliessen die Seite an ihre alte Stelle
        // zurueckfahren, statt einfach dort zu stehen.
        var wurzel = document.documentElement;
        var altesVerhalten = wurzel.style.scrollBehavior;
        wurzel.style.scrollBehavior = 'auto';
        window.scrollTo(0, stand);
        wurzel.style.scrollBehavior = altesVerhalten;
    }

    function sperren(name) {
        if (!name) return;
        if (offen[name]) return;
        offen[name] = true;
        anzahl += 1;
        if (anzahl === 1) {
            if (!anlegen()) { delete offen[name]; anzahl = 0; }
        }
    }

    function freigeben(name) {
        if (!name) return;
        if (!offen[name]) return;
        delete offen[name];
        anzahl -= 1;
        if (anzahl <= 0) { anzahl = 0; abbauen(); }
    }

    function aktiv() { return anzahl > 0; }

    /** Nur fuer Tests und die Fehlersuche: was haelt die Sperre gerade? */
    function halter() { return Object.keys(offen); }

    window.HintergrundSperre = {
        sperren: sperren,
        freigeben: freigeben,
        aktiv: aktiv,
        halter: halter
    };
})();
