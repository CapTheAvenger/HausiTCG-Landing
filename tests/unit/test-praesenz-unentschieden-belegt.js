/**
 * EIN KOMMENTAR, DER EINE MESSUNG BEHAUPTET, IST EINE QUELLENANGABE.
 *
 * BEFUND (07.09.2026). In js/app-meta-call.js stand an zwei Stellen
 * "10,95 % (gemessen in data/labs_tournament_matchups_TEF-PBL.csv,
 * 6.121 Partien)" und einmal "Limitless Online 1,28 % (2.248 von
 * 174.954)". Nachgemessen ergibt dieselbe Auswahl heute 11,05 % aus
 * 6.192 Partien und 1,29 % aus 180.414 Partien. Die Dateien sind
 * gewachsen, die Saetze nicht.
 *
 * Gerechnet wurde nie mit diesen Zahlen — die Quote kommt zur Laufzeit
 * aus der Datei (siehe `aggUnentschieden` und `_unentschiedenQuote`).
 * Das macht es nicht harmlos: der Kommentar ist der einzige Ort, an dem
 * steht, WORAUF sich die Umstellung der Tag-2-Rechnung stuetzt. Eine
 * Quellenangabe, die die Datei nicht mehr hergibt, ist nicht
 * nachpruefbar und sieht so aus, als waere sie es.
 *
 * BEHOBEN, INDEM DIE ZAHL AUFHOERT, PROSA ZU SEIN. Sie steht jetzt in
 * der Konstanten BELEGTE_FELDQUOTEN in js/app-meta-call.js, und dieser
 * Test rechnet jeden Eintrag gegen seine Datei nach. Wer die Datei neu
 * scrapt und die Konstante nicht nachzieht, bekommt Rot statt eines
 * still falschen Satzes.
 *
 * WAS HIER KEIN WOCHENWERT IST: geprueft wird nicht "die Quote ist
 * 11,05 %", sondern "die Quote, die im Code als gemessen ausgewiesen
 * ist, ist auch die, die in der Datei steht". Der Sollwert kommt aus
 * dem Code, der Istwert aus der Datei; beide bewegen sich gemeinsam.
 * Das Toleranzband steht in der Konstanten selbst und ist dort
 * begruendet.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (...p) => fs.readFileSync(path.join(WURZEL, ...p), 'utf8');
const MC = lies('js', 'app-meta-call.js');

/** BELEGTE_FELDQUOTEN aus der Quelle schneiden und WIRKLICH auswerten. */
function ladeBelege() {
    const anfang = MC.indexOf('const BELEGTE_FELDQUOTEN = {');
    assert.ok(anfang >= 0,
        'BELEGTE_FELDQUOTEN ist aus js/app-meta-call.js verschwunden — dann '
        + 'stehen die gemessenen Feldquoten wieder nur als Prosa im Kommentar');
    const ende = MC.indexOf('\n  };', anfang);
    assert.ok(ende > anfang, 'BELEGTE_FELDQUOTEN hat kein Ende');
    const stueck = MC.slice(anfang, ende + 5);
    return new Function(stueck + ' return BELEGTE_FELDQUOTEN;')();
}
const BELEGE = ladeBelege();

function csv(datei, trenner) {
    const text = lies(...datei.split('/')).replace(/\r/g, '').replace(/^﻿/, '');
    const teile = (z) => {
        const out = []; let cur = ''; let q = false;
        for (let i = 0; i < z.length; i++) {
            const c = z[i];
            if (c === '"') { q = !q; continue; }
            if (c === trenner && !q) { out.push(cur); cur = ''; continue; }
            cur += c;
        }
        out.push(cur); return out;
    };
    const raw = text.split('\n').filter((z) => z.trim() !== '');
    const kopf = teile(raw[0]).map((h) => h.trim().replace(/^﻿/, ''));
    return raw.slice(1).map((z) => {
        const v = teile(z); const o = {};
        kopf.forEach((h, i) => { o[h] = (v[i] || '').trim(); });
        return o;
    });
}
const ganz = (v) => {
    const s = String(v == null ? '' : v).trim();
    if (s === '') return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
};

/* Die Partienzahl darf sich zwischen zwei Wochenlaeufen bewegen; der
   ANTEIL soll es nur im Rahmen der Toleranz, die im Code selbst
   dranstehen muss. Fuer den Nenner reicht ein weites Band: er faellt
   nur, wenn eine Datei leerlaeuft oder sich verdoppelt. */
const PARTIEN_BAND = 0.30;

/** Die Praesenzquote — genau die Auswahl, die auch aggUnentschieden trifft. */
function messePraesenz(datei) {
    let s = 0, n = 0, u = 0, zeilen = 0;
    for (const r of csv(datei, ',')) {
        if ((r.day_filter || '').trim().toLowerCase() !== 'overall') continue;
        const vs = ganz(r.vs_wins), vn = ganz(r.vs_losses), vu = ganz(r.vs_ties);
        if (vs == null || vn == null) continue;
        s += vs; n += vn; u += (vu || 0); zeilen++;
    }
    return { s, n, u, zeilen, partien: s + n + u };
}

/** Die Online-Quote — Summe ueber alle Deckzeilen der Uebersicht. */
function messeOnline(datei) {
    let s = 0, n = 0, u = 0, zeilen = 0;
    for (const r of csv(datei, ';')) {
        const a = ganz(r.wins), b = ganz(r.losses), c = ganz(r.ties);
        if (a == null || b == null) continue;
        s += a; n += b; u += (c || 0); zeilen++;
    }
    return { s, n, u, zeilen, partien: s + n + u };
}

describe('Die im Code genannten Feldquoten stehen so in den Dateien', () => {

    it('BELEGTE_FELDQUOTEN ist vollstaendig und selbsterklaerend', () => {
        assert.deepStrictEqual(Object.keys(BELEGE).sort(),
            ['unentschiedenOnline', 'unentschiedenPraesenz']);
        for (const [k, e] of Object.entries(BELEGE)) {
            for (const feld of ['was', 'datei', 'auswahl', 'anteilPz', 'partien', 'toleranzPp', 'stand']) {
                assert.ok(e[feld] != null && e[feld] !== '',
                    `${k}: das Feld ${feld} fehlt — ohne es ist der Beleg nicht nachpruefbar`);
            }
            assert.ok(fs.existsSync(path.join(WURZEL, ...e.datei.split('/'))),
                `${k} zeigt auf eine Datei, die es nicht gibt: ${e.datei}`);
        }
    });

    it('Praesenz: 11,05 % steht wirklich in labs_tournament_matchups_TEF-PBL.csv', () => {
        const e = BELEGE.unentschiedenPraesenz;
        const m = messePraesenz(e.datei);
        assert.ok(m.partien > 0, `${e.datei} liefert keine einzige Bilanzzeile`);
        const ist = (m.u / m.partien) * 100;
        const ab = Math.abs(ist - e.anteilPz);
        assert.ok(ab <= e.toleranzPp,
            `${e.datei}: gemessen ${ist.toFixed(4)} %, im Code steht ${e.anteilPz} % `
            + `(${ab.toFixed(4)} pp Abstand, erlaubt ${e.toleranzPp}). `
            + `${m.u} von ${m.partien} Partien aus ${m.zeilen} Zeilen. `
            + 'BELEGTE_FELDQUOTEN in js/app-meta-call.js nachziehen.');
        const nennerAb = Math.abs(m.partien - e.partien) / e.partien;
        assert.ok(nennerAb <= PARTIEN_BAND,
            `${e.datei}: ${m.partien} Partien, im Code stehen ${e.partien}`);
    });

    it('Online: 1,29 % steht wirklich in limitless_online_decks.csv', () => {
        const e = BELEGE.unentschiedenOnline;
        const m = messeOnline(e.datei);
        assert.ok(m.partien > 0, `${e.datei} liefert keine einzige Bilanzzeile`);
        const ist = (m.u / m.partien) * 100;
        const ab = Math.abs(ist - e.anteilPz);
        assert.ok(ab <= e.toleranzPp,
            `${e.datei}: gemessen ${ist.toFixed(4)} %, im Code steht ${e.anteilPz} % `
            + `(${ab.toFixed(4)} pp Abstand, erlaubt ${e.toleranzPp}). `
            + `${m.u} von ${m.partien} Partien aus ${m.zeilen} Zeilen.`);
        const nennerAb = Math.abs(m.partien - e.partien) / e.partien;
        assert.ok(nennerAb <= PARTIEN_BAND,
            `${e.datei}: ${m.partien} Partien, im Code stehen ${e.partien}`);
    });

    it('die beiden Felder unterscheiden sich wirklich um ein Vielfaches', () => {
        /* Ohne diese Probe koennte die ganze Umstellung der Tag-2-Rechnung
           leer bestehen: waeren die Quoten gleich, aenderte sie nichts.
           Das Verhaeltnis ist eine Eigenschaft der beiden Spielformen
           (auf Papier laeuft die Zeit ab, online nicht), kein Wochenwert. */
        const p = messePraesenz(BELEGE.unentschiedenPraesenz.datei);
        const o = messeOnline(BELEGE.unentschiedenOnline.datei);
        const qP = p.u / p.partien;
        const qO = o.u / o.partien;
        assert.ok(qO > 0, 'online gibt es gar keine Unentschieden mehr');
        const VERHAELTNIS_MIN = 3;
        assert.ok(qP / qO >= VERHAELTNIS_MIN,
            `Papier ${(qP * 100).toFixed(2)} % gegen Online ${(qO * 100).toFixed(2)} % — `
            + 'nur noch Faktor ' + (qP / qO).toFixed(1));
    });

    it('die veralteten Zahlen stehen nur noch als Zitat da', () => {
        /* 6.121 und 174.954 duerfen im Text vorkommen — als das, was
           frueher dastand. Sie duerfen nur nicht mehr als aktuelle
           Messung ausgegeben werden. Geprueft wird das an der Konstanten,
           die der Code wirklich liest: dort darf keine der alten Zahlen
           stehen. */
        const alsText = JSON.stringify(BELEGE);
        for (const alt of ['6121', '174954', '10.95', '1.28', '15.3']) {
            assert.ok(!alsText.includes(alt),
                `die ueberholte Zahl ${alt} steht wieder in BELEGTE_FELDQUOTEN`);
        }
    });
});
