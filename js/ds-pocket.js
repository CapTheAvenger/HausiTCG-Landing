/**
 * ds-pocket.js — Reiter "Side Quest · Pokémon TCG Pocket".
 *
 * WAS ER ZEIGT
 * ------------
 * Game8s Tier-Liste für Pokémon TCG Pocket plus die Decks des aktuellen
 * Sets, je mit dem 2D-Muster zum Scannen und der Kartenliste. Die Daten
 * kommen aus data/pocket_tierlist.json; das Muster zeichnet
 * js/qr-svg.js selbst aus dem Feld `code` — kein Hotlink auf Game8s
 * Bildserver.
 *
 * WARUM EIN EIGENER REITER
 * ------------------------
 * Der vorhandene `#side-quest` heißt in Überschrift, Menü und i18n
 * ausdrücklich "Pokémon Champions", und js/ds-nav.js:19 schreibt die
 * Trennung als Zweck auf: "Pokémon Champions ist ein anderes Spiel".
 * TCG Pocket ist ein drittes. Ein achter Unterreiter dort stünde unter
 * einer Überschrift, die etwas anderes verspricht.
 *
 * WAS DIE DATEN VERLANGEN, NICHT VORSCHLAGEN
 * ------------------------------------------
 * `_meta.quelle_hinweis` sagt wörtlich: "Die Tier-Einstufung ist die
 * redaktionelle Einschätzung von Game8, keine von uns gemessene Zahl.
 * Die Oberfläche muss das anschreiben." Deshalb steht die Quelle mit
 * Datum unter der Überschrift UND im Vollbild — der Screenshot verlässt
 * die Seite, und was nicht im Bild steht, existiert für den Empfänger
 * nicht.
 *
 * DREI EHRLICHKEITSLÖCHER, DIE ANGESCHRIEBEN WERDEN
 * -------------------------------------------------
 * 1. `_meta.ohne_code`: zwei Decks stehen NICHT in `decks`. Wer nur die
 *    Liste zeichnet, zeigt 33 von 35 und sagt nirgends, dass zwei
 *    fehlen. Ihre Namen stehen deshalb in der Fußzeile.
 * 2. `_meta.zusammengelegt`: 17 Einträge. Zwei davon tragen eine ANDERE
 *    Stufe als das behaltene Deck — Game8 führt dasselbe Deck an zwei
 *    Stellen verschieden ein. Diese zwei bekommen eine Fußnote, die
 *    übrigen 15 nicht (sie sind stufengleich).
 * 3. `quelle_liste === 'set'`: bei diesen Decks stammt die Stufe aus
 *    der Zelle der Set-Tabelle, nicht aus der Rangliste. Zwei Maße in
 *    einer Liste; das Kennzeichen sagt es.
 *
 * DAS ALTER
 * ---------
 * Der Ablauf .github/workflows/pocket-tierlist.yml läuft nur auf
 * Knopfdruck — Game8 weist GitHub-Läufer mit HTTP 202 ab. Die Datei
 * altert also. Ab PLAUSIBEL_TAGE steht eine sichtbare Warnung da; das
 * bloße Datum liest niemand nach.
 */
(function () {
    'use strict';

    var QUELLE = 'data/pocket_tierlist.json';
    var HOST = 'pocket';
    var TIER_ORDNUNG = ['S', 'A+', 'A', 'B', 'C', 'D'];
    // Ein neues Pocket-Set erscheint etwa im Monatsabstand; danach ist
    // eine Bestenliste eine Momentaufnahme von gestern.
    var PLAUSIBEL_TAGE = 28;

    var daten = null;
    var geladen = false;
    var laeuft = null;
    var filter = 'alle';
    var wachschloss = null;

    function t(de, en) {
        return (typeof getLang === 'function' && getLang() === 'en') ? en : de;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function kurzDatum(iso) {
        if (!iso) return null;
        var d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return ('0' + d.getDate()).slice(-2) + '.' +
               ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
    }

    function tageSeit(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return Math.floor((Date.now() - d.getTime()) / 86400000);
    }

    /* Welche Decks tragen laut _meta.zusammengelegt eine abweichende
     * Stufe? Die Bindung läuft nur über den Namen — das ist die einzige,
     * die die Datei hergibt. Ein Treffer, der nicht eindeutig ist, wird
     * still übergangen: lieber keine Fußnote als eine an der falschen
     * Zeile. */
    function abweichendeStufen(meta, decks) {
        var raus = {};
        var nachName = {};
        decks.forEach(function (d) {
            nachName[d.name] = (nachName[d.name] === undefined) ? d : null;
        });
        (meta.zusammengelegt || []).forEach(function (z) {
            var deck = nachName[z.behalten];
            if (!deck || !z.verlorene_stufe) return;
            if (z.verlorene_stufe === deck.tier) return;
            (raus[z.behalten] = raus[z.behalten] || []).push(z.verlorene_stufe);
        });
        return raus;
    }

    function meldung(text, istFehler) {
        return '<div class="pk-meldung' + (istFehler ? ' is-fehler' : '') +
               '" role="status">' + esc(text) + '</div>';
    }

    function kopf() {
        var m = daten._meta || {};
        var stand = kurzDatum(m.abgerufen);
        var tage = tageSeit(m.abgerufen);
        var s = '';
        s += '<div class="header">';
        s += '<h2>' + esc(t('Side Quest · Pokémon TCG Pocket',
                            'Side Quest · Pokémon TCG Pocket')) + '</h2>';
        s += '<p>' + esc(t('Game8s Tier-Liste und die Decks des neuen Sets. Deck antippen, ' +
                           'Muster zeigen, zweites Gerät scannt.',
                           'Game8’s tier list and the new set decks. Tap a deck, show the ' +
                           'pattern, scan it with a second device.')) + '</p>';
        s += '</div>';

        s += '<p class="pk-quelle">' +
             esc(t('Einstufung von Game8, keine von uns gemessene Zahl',
                   'Game8’s own assessment, not a figure we measured'));
        if (m.quelle_url) {
            s += ' · <a href="' + esc(m.quelle_url) + '" target="_blank" rel="noopener">game8.co</a>';
        }
        if (stand) s += ' · ' + esc(t('Stand ', 'as of ')) + esc(stand);
        s += '</p>';

        if (tage !== null && tage >= PLAUSIBEL_TAGE) {
            s += '<p class="pk-alt">' + esc(
                t('Seit ' + tage + ' Tagen nicht aufgefrischt — nach einem neuen Set kann ' +
                  'sich die Einstufung deutlich verschoben haben.',
                  'Not refreshed for ' + tage + ' days — after a new set the ratings may ' +
                  'have shifted considerably.')) + '</p>';
        }
        return s;
    }

    function filterleiste() {
        var knoepfe = [
            ['alle',  t('Alle', 'All')],
            ['tier',  t('Tier-Liste', 'Tier list')],
            ['set',   t('Neues Set', 'New set')]
        ];
        return '<div class="pk-filter" role="group" aria-label="' +
            esc(t('Auswahl', 'Filter')) + '">' +
            knoepfe.map(function (k) {
                return '<button type="button" data-pk-filter="' + k[0] + '"' +
                       (filter === k[0] ? ' class="is-active" aria-pressed="true"'
                                        : ' aria-pressed="false"') +
                       '>' + esc(k[1]) + '</button>';
            }).join('') + '</div>';
    }

    function passt(d) {
        if (filter === 'alle') return true;
        if (filter === 'tier') return d.quelle_liste === 'tier' || d.quelle_liste === 'beide';
        return d.quelle_liste === 'set' || d.quelle_liste === 'beide';
    }

    function liste() {
        var decks = (daten.decks || []).filter(passt);
        if (!decks.length) {
            return meldung(t('Für diese Auswahl steht kein Deck in der Liste.',
                             'No deck in the list matches this filter.'));
        }
        var streit = abweichendeStufen(daten._meta || {}, daten.decks || []);
        var s = '';
        TIER_ORDNUNG.forEach(function (stufe) {
            var teil = decks.filter(function (d) { return d.tier === stufe; });
            if (!teil.length) return;
            // Innerhalb einer Stufe alphabetisch — Game8 vergibt dort
            // keine Rangfolge, und eine Nummerierung würde eine erfinden.
            teil.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
            s += '<section class="pk-stufe">';
            s += '<h3>' + esc(t('Stufe ', 'Tier ')) + esc(stufe) +
                 ' <span class="pk-stufe-zahl">' + teil.length + '</span></h3>';
            teil.forEach(function (d) {
                var i = (daten.decks || []).indexOf(d);
                s += '<button type="button" class="pk-zeile" data-pk-deck="' + i + '">';
                s += '<span class="pk-marke">' + esc(d.tier) + '</span>';
                s += '<span class="pk-name">' + esc(d.name);
                var fuss = [];
                if (d.quelle_liste === 'set') {
                    fuss.push(t('Stufe aus der Set-Tabelle', 'tier from the set table'));
                }
                if (streit[d.name]) {
                    fuss.push(t('Game8 nennt auch ' + streit[d.name].join('/'),
                                'Game8 also lists ' + streit[d.name].join('/')));
                }
                if (fuss.length) {
                    s += '<span class="pk-fussnote">' + esc(fuss.join(' · ')) + '</span>';
                }
                s += '</span>';
                s += '<span class="pk-pfeil" aria-hidden="true">›</span>';
                s += '</button>';
            });
            s += '</section>';
        });

        // EINE UNBEKANNTE STUFE DARF NICHT STILL VERSCHWINDEN.
        //
        // js/ds-post-quellen.js:1024 traegt dieselbe Reihenfolge und
        // davor genau diesen Riegel, mit dem Kommentar vom 04.09.2026:
        // fuehrt Game8 eines Tages "SS" ein, sortierte sie vorher ans
        // Ende und wurde nie genommen — die Ausgabe zeigte "Stufe S",
        // waehrend die hoechste Stufe fehlte.
        //
        // Hier war das Array kopiert und der Riegel nicht (Abnahme
        // 07.09.2026, nachgestellt): ein Deck mit tier 'S+' oder null
        // fiel aus der Liste, waehrend die Fusszeile weiter 33 von 52
        // behauptete. Und `tier: null` ist ueber den Kollisionsweg des
        // Scrapers schon heute erreichbar
        // (tests/python/test_pocket_tierlist.py haelt es fest); in den
        // aktuellen Daten stehen sechs Kollisionen.
        //
        // Gezeigt wird es trotzdem — nur angeschrieben. Ein Deck
        // wegzulassen waere die stille Reparatur, die dieses Projekt
        // ueberall verbietet.
        var fremd = decks.filter(function (d) {
            return TIER_ORDNUNG.indexOf(d.tier) < 0;
        });
        if (fremd.length) {
            var stufen = fremd.map(function (d) {
                return d.tier === null || d.tier === undefined || d.tier === ''
                    ? t('ohne Angabe', 'not given') : String(d.tier);
            }).filter(function (v, i, a) { return a.indexOf(v) === i; });
            s += '<section class="pk-stufe">';
            s += '<h3>' + esc(t('Ohne bekannte Stufe', 'Tier not recognised')) +
                 ' <span class="pk-stufe-zahl">' + fremd.length + '</span></h3>';
            s += '<p class="pk-alt">' + esc(t(
                'Game8 führt hier eine Einstufung, die wir nicht kennen (' +
                stufen.join(', ') + '). Die Decks stehen trotzdem da — ' +
                'weglassen wäre die stillere, aber schlechtere Lösung.',
                'Game8 uses a tier we do not know (' + stufen.join(', ') +
                '). The decks are shown anyway — dropping them would be the ' +
                'quieter but worse option.')) + '</p>';
            fremd.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
            fremd.forEach(function (d) {
                var i = (daten.decks || []).indexOf(d);
                s += '<button type="button" class="pk-zeile" data-pk-deck="' + i + '">';
                s += '<span class="pk-marke">?</span>';
                s += '<span class="pk-name">' + esc(d.name) + '</span>';
                s += '<span class="pk-pfeil" aria-hidden="true">›</span>';
                s += '</button>';
            });
            s += '</section>';
        }
        return s;
    }

    function rechnung() {
        var m = daten._meta || {};
        var u = m.uebersicht || {};
        var ohne = m.ohne_code || [];
        var zus = m.zusammengelegt || [];
        var s = '<div class="pk-rechnung">';
        if (u.angegangen) {
            s += '<strong>' + (daten.decks || []).length + ' ' +
                 esc(t('von ', 'of ')) + u.angegangen + '</strong> ' +
                 esc(t('Einträgen bei Game8 — ' + ohne.length + ' ohne lesbares Muster, ' +
                       zus.length + ' als Dublette zusammengelegt.',
                       'entries at Game8 — ' + ohne.length + ' without a readable pattern, ' +
                       zus.length + ' merged as duplicates.'));
        }
        if (ohne.length) {
            s += '<br>' + esc(t('Diese Decks fehlen hier: ', 'Missing here: ')) +
                 ohne.map(function (o) {
                     return esc(String(o.name).replace(/\s*\[[^\]]+\]\s*$/, ''));
                 }).join(', ') + '. ' +
                 esc(t('Ihr Muster ließ sich keinem Deck-Abschnitt eindeutig zuordnen — ' +
                       'ein falscher Code ist schlimmer als keiner.',
                       'Their pattern could not be matched to a deck section — a wrong ' +
                       'code is worse than none.'));
        }
        s += '</div>';
        return s;
    }

    /* ── Vollbild ────────────────────────────────────────────────── */

    function wachHalten() {
        // Der Bildschirm darf während des Scannens nicht dunkel werden.
        // Fehlt die Schnittstelle oder wird sie abgelehnt, passiert
        // nichts — der Hinweistext bleibt trotzdem stehen, weil die
        // Helligkeit sich vom Web aus nicht setzen lässt.
        try {
            if (navigator.wakeLock && navigator.wakeLock.request) {
                navigator.wakeLock.request('screen').then(function (l) {
                    wachschloss = l;
                }, function () { });
            }
        } catch (e) { /* nichts */ }
    }

    function wachFreigeben() {
        try { if (wachschloss) wachschloss.release(); } catch (e) { /* nichts */ }
        wachschloss = null;
    }

    function kartenliste(d) {
        // `[]` ist wahr — mit `!d.pokemon` allein bliebe bei einer leeren
        // Liste ein leerer Kasten stehen statt des Grundes (Abnahme
        // 07.09.2026).
        var hatKarten = (d.pokemon && d.pokemon.length) ||
                        (d.trainer && d.trainer.length);
        if (!hatKarten) {
            return d.karten_hinweis
                ? '<p class="pk-hell">' + esc(t('Keine Kartenliste: ', 'No card list: ')) +
                  esc(d.karten_hinweis) + '</p>'
                : '';
        }
        function block(titel, karten) {
            if (!karten || !karten.length) return '';
            var stueck = karten.reduce(function (a, k) { return a + k.anzahl; }, 0);
            return '<h4>' + esc(titel) + ' <span>(' + stueck + ')</span></h4><ul>' +
                karten.map(function (k) {
                    var nr = k.set && k.nummer ? k.set + '-' + k.nummer : '';
                    return '<li><span>' + k.anzahl + '× ' + esc(k.name) + '</span>' +
                           '<span>' + esc(nr) + '</span></li>';
                }).join('') + '</ul>';
        }
        return '<div class="pk-karten">' +
               block(t('Pokémon', 'Pokémon'), d.pokemon) +
               block(t('Trainer', 'Trainer'), d.trainer) +
               '</div>';
    }

    function oeffne(index) {
        var d = (daten.decks || [])[index];
        var host = document.getElementById('pocketOverlay');
        if (!d || !host) return;

        var stand = kurzDatum((daten._meta || {}).abgerufen);
        var bild;
        try {
            if (!window.qrSvg || typeof window.qrSvg.svg !== 'function') {
                throw new Error('qrSvg fehlt');
            }
            bild = '<div class="pk-qr">' +
                   window.qrSvg.svg(d.code, { stufe: 'M', titel: d.name }) + '</div>';
        } catch (e) {
            // Stilles Nichts wäre der schlimmste Zustand. Wenigstens der
            // Code als markierbarer Text, damit der Weg nicht ganz
            // zuläuft.
            bild = '<div class="pk-meldung is-fehler">' +
                   esc(t('Das Muster ließ sich nicht zeichnen. Der Code lautet:',
                         'The pattern could not be drawn. The code is:')) +
                   '<br><code style="word-break:break-all">' + esc(d.code) + '</code></div>';
        }

        var s = '';
        s += '<button type="button" class="pk-schliessen" data-pk-zu="1" aria-label="' +
             esc(t('Schließen', 'Close')) + '">✕</button>';
        // Name, Stufe und Quelle stehen IM Bild, nicht darüber: das
        // Bildschirmfoto ist das Lieferstück.
        s += '<div class="pk-overlay-kopf">';
        // KEIN <h3>. Der Deck-Name ist Game8s englische Bezeichnung, und
        // .github/workflows/sprachreinheit.yml prueft sichtbaren Text in
        // h1..h5, label, button und a auf Sprachreinheit. Die Rolle
        // bleibt erhalten, die Sprachpruefung greift hier nicht mehr.
        s += '<div class="pk-overlay-name" role="heading" aria-level="2">' +
             esc(d.name) + '</div>';
        s += '<p>' + esc(t('Stufe ', 'Tier ') + d.tier) + ' · Game8' +
             (stand ? ' · ' + esc(t('Stand ', 'as of ') + stand) : '') + '</p>';
        s += '</div>';
        s += bild;
        s += '<p class="pk-hell">' + esc(
            t('Bildschirm hell stellen und in Pocket abscannen.',
              'Turn the screen brightness up and scan it in Pocket.')) + '</p>';
        s += kartenliste(d);

        host.innerHTML = s;
        host.hidden = false;
        document.body.style.overflow = 'hidden';
        var zu = host.querySelector('[data-pk-zu]');
        if (zu) zu.focus();
        wachHalten();
    }

    function schliesse() {
        var host = document.getElementById('pocketOverlay');
        if (!host || host.hidden) return;
        host.hidden = true;
        host.innerHTML = '';
        document.body.style.overflow = '';
        wachFreigeben();
    }

    /* ── Zeichnen ────────────────────────────────────────────────── */

    function zeichne() {
        var host = document.getElementById('pocketListe');
        if (!host) return;
        if (!daten) {
            host.innerHTML = meldung(t('Lädt…', 'Loading…'));
            return;
        }
        if (!(daten.decks || []).length) {
            host.innerHTML = meldung(t('Die Tier-Liste ist leer.', 'The tier list is empty.'));
            return;
        }
        host.innerHTML = kopf() + filterleiste() + liste() + rechnung();
    }

    function fehler(e) {
        var host = document.getElementById('pocketListe');
        if (!host) return;
        host.innerHTML = meldung(
            t('Die Tier-Liste konnte nicht geladen werden. ' +
              'Bist du gerade offline?',
              'The tier list could not be loaded. Are you offline?'), true);
        if (window.console) console.warn('[pocket]', e);
    }

    function laden() {
        if (laeuft) return laeuft;
        // Der Service Worker reicht bei einem Netzfehler ONLINE den
        // Fehler durch, statt einen alten Stand zu liefern. Ohne diesen
        // Fangarm bliebe der Reiter leer und ohne Erklärung — genau der
        // Ausfall vom 26.08.2026 an #side-quest.
        laeuft = fetch(QUELLE, { cache: 'no-store' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (j) {
                daten = j;
                geladen = true;
                zeichne();
            })
            .catch(function (e) {
                laeuft = null;
                fehler(e);
            });
        return laeuft;
    }

    function render() {
        if (!geladen) {
            zeichne();          // "Lädt…" zeigen, bevor das Netz antwortet
            laden();
            return;
        }
        zeichne();
    }

    function verdrahten() {
        var reiter = document.getElementById(HOST);
        if (!reiter || reiter.dataset.pkVerdrahtet) return;
        reiter.dataset.pkVerdrahtet = '1';

        reiter.addEventListener('click', function (ev) {
            var f = ev.target.closest('[data-pk-filter]');
            if (f) {
                filter = f.getAttribute('data-pk-filter');
                zeichne();
                return;
            }
            var z = ev.target.closest('[data-pk-deck]');
            if (z) { oeffne(Number(z.getAttribute('data-pk-deck'))); return; }
            var zu = ev.target.closest('[data-pk-zu]');
            if (zu) schliesse();
        });

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') schliesse();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verdrahten);
    } else {
        verdrahten();
    }

    window.dsPocket = { render: render, oeffne: oeffne, schliesse: schliesse };
}());
