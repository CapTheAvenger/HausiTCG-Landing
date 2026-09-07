/**
 * Ein winziger Kaskaden-Rechner fuer CSS-Regeln aus css/.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Befund C4 / A-F3.22-24 / A-F4.45-47: "Niedrige Seltenheit" bzw. "Alle"
 * bleiben dauerhaft blau, waehrend die tatsaechlich gewaehlte Option
 * ungewaehlt aussieht. Das ist kein Fehler in EINER Regel, sondern das
 * Zusammenspiel von dreien aus drei Dateien:
 *
 *   index.html            setzt btn-success bzw. active fest ins Markup
 *   ui-components.css     .btn-active / .btn-inactive (nur Deckkraft)
 *   pokeball-menu.css     .btn-toggle-item.btn-success/.active -> blau
 *   city-league.css       .past-meta-cards-type-btn.active     -> blau
 *
 * Eine Textpruefung auf eine einzelne Regel kann das nicht sehen. Was
 * zaehlt, ist der GEWINNER fuer eine bestimmte Klassenmenge. Genau das
 * rechnet dieses Modul: Spezifitaet, !important, Quellreihenfolge — und
 * die Quellreihenfolge kommt aus der Reihenfolge der <link>-Zeilen in
 * index.html, nicht aus einer Annahme.
 *
 * ERWEITERUNG (B1, 07.09.2026): ein Vergleich EINER Farbe hat den Befund
 * nicht gesehen. Der abgewaehlte Startknopf war nicht farblos, sondern
 * gruen — `background: linear-gradient(...) !important` aus
 * css/ui-components.css:962, dazu ein gruener Schein. Wer nur fragt "ist
 * der Hintergrund das Blau der Seite?", liest darauf "nein" und haelt den
 * Knopf fuer unmarkiert. Deshalb rechnet dieses Modul jetzt LAENGSFORMEN:
 * die Kurzform `background` wird in background-color und background-image
 * zerlegt, `border`/`border-right`/`border-color` in die vier
 * Seitenfarben. Erst damit lassen sich zwei Knopfzustaende Eigenschaft
 * fuer Eigenschaft vergleichen, statt gegen eine erwartete Farbe.
 *
 * BEWUSSTE GRENZEN (damit niemand mehr hineinliest, als drinsteht):
 *   * @media-Bloecke bleiben aussen vor — geprueft wird die Grundansicht.
 *   * Zustands-Pseudoklassen (:hover, :focus) zaehlen nur mit, wenn der
 *     Aufrufer sie ausdruecklich als aktiv angibt.
 *   * Unterstuetzt werden Selektoren aus Klassen, :not(.klasse) und
 *     Zustands-Pseudoklassen — mehr braucht dieser Befund nicht, und
 *     alles andere wird als "passt nicht" behandelt.
 *   * Zerlegt werden nur `background`, `border`, `border-<seite>` und
 *     `border-color`. Andere Kurzformen (font, transition, ...) bleiben
 *     stehen, wie sie geschrieben sind — sie tragen keine Flaeche.
 *
 * Die Datei heisst bewusst NICHT test-*.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');

/** Die Stilblaetter in genau der Reihenfolge, in der index.html sie laedt. */
function ladeReihenfolge() {
    const markup = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
    return [...markup.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(css\/[^"?]+)/g)]
        .map(m => m[1]);
}

/** Kommentare raus, dann Regeln auf oberster Ebene einsammeln. */
function regeln(datei, rang) {
    const roh = fs.readFileSync(path.join(WURZEL, datei), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    const raus = [];
    let i = 0, nr = 0;
    while (i < roh.length) {
        const auf = roh.indexOf('{', i);
        if (auf < 0) break;
        const kopf = roh.slice(i, auf).trim();
        // Block-At-Regeln (@media, @supports, @keyframes) ueberspringen.
        let tiefe = 1, j = auf + 1;
        while (j < roh.length && tiefe > 0) {
            if (roh[j] === '{') tiefe++;
            else if (roh[j] === '}') tiefe--;
            j++;
        }
        if (!kopf.startsWith('@')) {
            const koerper = roh.slice(auf + 1, j - 1);
            kopf.split(',').map(s => s.trim()).filter(Boolean).forEach(sel => {
                raus.push({ datei, sel, rang, nr: nr++, deklarationen: deklarationen(koerper) });
            });
        }
        i = j;
    }
    return raus;
}

/** Rahmenstile und Laengen, die in einer border-Kurzform KEINE Farbe sind. */
const RAHMENSTIL = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i;
const LAENGE = /^(0|[\d.]+(px|em|rem|%|vh|vw|pt|ch)|thin|medium|thick)$/i;

/** Werte einer Kurzform an den Ebenen-Kommas vorbei in Marken zerlegen. */
function marken(wert) {
    const raus = [];
    let tiefe = 0, akt = '';
    for (const z of wert) {
        if (z === '(') tiefe++;
        if (z === ')') tiefe--;
        if (/\s/.test(z) && tiefe === 0) { if (akt) raus.push(akt); akt = ''; continue; }
        akt += z;
    }
    if (akt) raus.push(akt);
    return raus;
}

/**
 * Die Kurzformen zerlegen, die eine Flaeche tragen.
 * Bewusst grob und bewusst benannt: `background` mit einem Verlauf oder
 * einem Bild setzt background-image und laesst die Farbe auf ihrem
 * Anfangswert (transparent); alles andere ist die Farbe, und das Bild
 * faellt auf none. Genau diese zwei Faelle kommen in css/ vor.
 */
function laengsformen(name, wert) {
    const raus = {};
    if (name === 'background') {
        const bild = /(gradient|url)\(/i.test(wert);
        raus['background-image'] = bild ? wert : 'none';
        raus['background-color'] = bild ? 'transparent' : wert;
        return raus;
    }
    if (name === 'border-color') {
        ['top', 'right', 'bottom', 'left'].forEach(s => { raus['border-' + s + '-color'] = wert; });
        return raus;
    }
    let m = /^border(?:-(top|right|bottom|left))?$/.exec(name);
    if (m) {
        const seiten = m[1] ? [m[1]] : ['top', 'right', 'bottom', 'left'];
        const farbe = marken(wert).find(t => !RAHMENSTIL.test(t) && !LAENGE.test(t));
        // `border: none` nennt keine Farbe — dann bleibt die Seitenfarbe
        // unberuehrt, und genau das soll der Vergleich auch sehen.
        if (farbe) seiten.forEach(s => { raus['border-' + s + '-color'] = farbe; });
        return raus;
    }
    return raus;
}

function deklarationen(koerper) {
    const d = {};
    koerper.split(';').forEach(teil => {
        const k = teil.indexOf(':');
        if (k < 0) return;
        const name = teil.slice(0, k).trim();
        let wert = teil.slice(k + 1).trim();
        if (!name || !wert) return;
        const wichtig = /!important$/i.test(wert);
        if (wichtig) wert = wert.replace(/!important$/i, '').trim();
        d[name] = { wert, wichtig };
        // Die Kurzform bleibt stehen UND wird zerlegt: die Laengsformen
        // erben Spezifitaet, !important und Quellplatz der Kurzform —
        // genau so rechnet der Browser.
        Object.entries(laengsformen(name, wert)).forEach(([n, w]) => {
            d[n] = { wert: w, wichtig };
        });
    });
    return d;
}

/** Spezifitaet (a,b,c) fuer die unterstuetzte Selektorform. */
function spezifitaet(sel) {
    const ids = (sel.match(/#[\w-]+/g) || []).length;
    const klassen = (sel.match(/\.[\w-]+/g) || []).length
        + (sel.match(/:(?!not\b)[\w-]+/g) || []).length;
    const tags = (sel.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
    return [ids, klassen, tags];
}

/**
 * Passt der Selektor auf ein Element mit diesen Klassen?
 * @param {string} sel
 * @param {{klassen:string[], tag?:string, zustaende?:string[]}} el
 */
function passt(sel, el) {
    const s = sel.trim();
    // Nachfahren/Geschwister-Selektoren kommen fuer diesen Befund nicht vor.
    if (/[\s>+~]/.test(s.replace(/:not\([^)]*\)/g, ''))) return false;
    const klassen = new Set(el.klassen);
    const zustaende = new Set(el.zustaende || []);
    let rest = s;

    // :not(.x)
    const nots = [...rest.matchAll(/:not\(([^)]*)\)/g)].map(m => m[1].trim());
    rest = rest.replace(/:not\([^)]*\)/g, '');
    for (const n of nots) {
        if (!n.startsWith('.')) return false;
        if (klassen.has(n.slice(1))) return false;
    }

    // Zustands-Pseudoklassen
    const pseudos = [...rest.matchAll(/::?([\w-]+)/g)].map(m => m[1]);
    rest = rest.replace(/::?[\w-]+/g, '');
    for (const p of pseudos) {
        if (!zustaende.has(p)) return false;
    }

    // Rest: Tag und Klassen
    const geforderteKlassen = [...rest.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
    const tagTeil = rest.replace(/\.[\w-]+/g, '').replace(/\*/g, '').trim();
    if (tagTeil && el.tag && tagTeil.toLowerCase() !== el.tag.toLowerCase()) return false;
    if (tagTeil && !el.tag) return false;
    if (!tagTeil && geforderteKlassen.length === 0) return false;
    return geforderteKlassen.every(k => klassen.has(k));
}

/** Alle Regeln der genannten Dateien, in Ladereihenfolge. */
function stilblatt(dateien) {
    const ordnung = ladeReihenfolge();
    const alle = [];
    dateien.forEach(d => {
        const rang = ordnung.indexOf(d);
        if (rang < 0) throw new Error('nicht in index.html verlinkt: ' + d);
        alle.push(...regeln(d, rang));
    });
    alle.sort((a, b) => (a.rang - b.rang) || (a.nr - b.nr));
    return alle;
}

/**
 * Welcher Wert gewinnt fuer diese Eigenschaft?
 * @returns {{wert:string|null, wichtig:boolean, sel:string|null, datei:string|null}}
 */
function gewinner(alle, el, eigenschaft) {
    let best = null;
    alle.forEach((r, lauf) => {
        const d = r.deklarationen[eigenschaft];
        if (!d) return;
        if (!passt(r.sel, el)) return;
        const sp = spezifitaet(r.sel);
        const kandidat = { ...d, sel: r.sel, datei: r.datei, sp, lauf };
        if (!best) { best = kandidat; return; }
        if (kandidat.wichtig !== best.wichtig) {
            if (kandidat.wichtig) best = kandidat;
            return;
        }
        for (let i = 0; i < 3; i++) {
            if (kandidat.sp[i] !== best.sp[i]) {
                if (kandidat.sp[i] > best.sp[i]) best = kandidat;
                return;
            }
        }
        best = kandidat; // gleiche Spezifitaet: die spaetere Regel gewinnt
    });
    return best
        ? { wert: best.wert, wichtig: best.wichtig, sel: best.sel, datei: best.datei }
        : { wert: null, wichtig: false, sel: null, datei: null };
}

/**
 * Die Eigenschaften, aus denen sich entscheidet, ob ein Knopf ANDERS
 * aussieht als sein unmarkierter Nachbar. Nicht "ist er blau" — jede
 * sichtbare Abweichung zaehlt, sonst wiederholt sich B1.
 */
const FLAECHE = [
    'background-color', 'background-image', 'box-shadow',
    'color', 'border-right-color'
];

/** Nichts-Werte gleichsetzen: fehlend, none, transparent meinen dasselbe. */
function normwert(w) {
    if (w == null) return '';
    const s = String(w).trim();
    return /^(none|transparent|initial|unset|0)$/i.test(s) ? '' : s;
}

/** Alle Flaechen-Eigenschaften eines Elements auf einmal, schon normiert. */
function flaeche(alle, el, eigenschaften) {
    const raus = {};
    (eigenschaften || FLAECHE).forEach(p => {
        raus[p] = normwert(gewinner(alle, el, p).wert);
    });
    return raus;
}

module.exports = {
    stilblatt, gewinner, passt, spezifitaet, ladeReihenfolge, WURZEL,
    laengsformen, marken, flaeche, normwert, FLAECHE
};
