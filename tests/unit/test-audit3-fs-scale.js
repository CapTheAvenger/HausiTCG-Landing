/**
 * Audit 3 — Weg 2, Etappe 1: Ausstieg aus dem 12-px-Boden fuers Handy.
 *
 * Ausgangslage (gemessen 21.08.2026 bei 390 px im Aktuellen Meta):
 * 354 von 395 sichtbaren Textknoten lagen auf exakt 12 px — 89,6 %. Die
 * Rangordnung, die das Designsystem am Schreibtisch herstellt, gab es auf dem
 * Telefon nicht.
 *
 * Weg 3 (font-size: max(12px, 1em)) waere ein No-op gewesen, weil der Body
 * selbst 12 px traegt und 1em damit ueberall 12 px ergibt. Gewaehlt wurde
 * deshalb Weg 2: die Skala aus tokens.css uebernehmen, Ansicht fuer Ansicht.
 * Der Ausstieg haengt an der Klasse .fs-scale, damit das Uebernehmen einer
 * Ansicht eine Wortaenderung im HTML ist und keine weitere Zeile in der
 * Ausnahmeliste — die Liste war der Fehler, nicht ihre Laenge.
 *
 * Was der Boden verdeckt hat, zeigte sich erst beim Abschalten: 181 Knoten
 * fielen unter 11 px, davon 90 auf 6,6 px. Ursache ist multiplizierendes em
 * (.top-card-stats 0.65em, Kinder noch einmal 0.82/0.78/0.72em) — der Boden
 * hob jedes Element EINZELN auf 12 px, weshalb die Verschachtelung nie
 * auffiel. Diese Komponenten haben jetzt absolute Tokenwerte.
 *
 * Der Test prueft die Regeln, nicht Screenshots: dass der Ausstieg existiert,
 * dass die uebernommene Ansicht ihn traegt, dass die Tokenwerte gesetzt sind
 * und dass dabei kein neues !important entstanden ist.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const MOBILE = R('css/mobile-responsive.css');
const TOKENS = R('css/tokens.css');
const INDEX = R('index.html');

describe('Audit 3 — Etappe 1 des 12-px-Ausstiegs', () => {

  it('der Boden hat einen Ausstieg, und zwar an JEDEM seiner Selektoren', () => {
    // Sonst greift er bei einer der 32 Zeilen doch noch und die Ansicht
    // bekommt ein zufaelliges Gemisch aus Boden und Skala.
    const zeilen = MOBILE.split('\n')
      .filter(l => l.includes('.tab-content') && l.includes(':not(.ds-panel *)'));
    assert.ok(zeilen.length >= 32,
      `nur ${zeilen.length} Selektoren der Sammelregel gefunden`);
    for (const l of zeilen) {
      assert.ok(l.includes(':not(.fs-scale *)'),
        'Selektor ohne Ausstieg: ' + l.trim().slice(0, 90));
    }
  });

  it('das Aktuelle Meta ist die uebernommene Ansicht', () => {
    assert.match(INDEX, /id="current-meta"[^>]*class="[^"]*\bfs-scale\b/,
      '#current-meta traegt die Klasse nicht — dann aendert der Ausstieg nichts');
  });

  it('die Skala, aus der die Groessen kommen, gibt es wirklich', () => {
    for (const t of ['--fs-xs', '--fs-sm', '--fs-md', '--fs-lg', '--fs-xl', '--fs-hero']) {
      assert.ok(TOKENS.includes(t + ':'), 'Token fehlt in tokens.css: ' + t);
    }
  });

  it('die em-Ketten der uebernommenen Ansicht sind auf Tokens umgestellt', () => {
    // Genau die Komponenten, die ohne Boden auf 5,6 bis 6,6 px fielen.
    const block = MOBILE.slice(MOBILE.indexOf('#current-meta.fs-scale'));
    for (const k of ['.top-card-stats', '.top-card-share', '.top-card-decks',
                     '.top-card-rank', '.top-card-name', '.heatmap-td-n']) {
      assert.ok(block.includes('#current-meta.fs-scale ' + k),
        'ohne Tokenwert faellt diese Klasse unter 11 px: ' + k);
    }
    assert.match(block, /font-size:\s*var\(--fs-(xs|sm)\)/,
      'die Groessen muessen aus der Skala kommen, nicht als neue Sonderwerte');
  });

  it('Etappe 2: das Vergangene Meta ist die zweite uebernommene Ansicht', () => {
    assert.match(INDEX, /id="past-meta"[^>]*class="[^"]*\bfs-scale\b/,
      '#past-meta traegt die Klasse nicht');
    const block = MOBILE.slice(MOBILE.indexOf('#past-meta.fs-scale'));
    // Genau die Komponenten, die ohne Boden unter 11 px fielen — gemessen
    // bei 390 px, Chunk TEF-CRI: 555 von 1.058 Knoten, der kleinste 5,0 px.
    for (const k of ['.city-league-card-title-mobile', '.city-league-card-set-mobile',
                     '.city-league-card-stats-mobile', '.city-league-card-avg-mobile',
                     '.city-league-card-deck-stats-mobile', '.city-league-card-badge',
                     '.past-meta-matchup-table td', '.past-meta-stat-label',
                     '.past-meta-stat-nenner', '.toolbar-metric-value']) {
      assert.ok(block.includes('#past-meta.fs-scale ' + k),
        'ohne Tokenwert faellt diese Klasse unter 11 px: ' + k);
    }
  });

  it('die Kartenkacheln haben nur noch EINEN Haltepunkt, und der steht auf der Skala', () => {
    const UI = R('css/ui-components.css');
    // Vorher: 11/10/9 px und 12/11/10,5 px an drei Haltepunkten, alle mit
    // !important — und alle wirkungslos, weil der Boden spaeter laedt.
    const kachelBlock = UI.slice(UI.indexOf('CARD OVERVIEW INFO PANEL'),
                                 UI.indexOf('Card table row list container'));
    assert.ok(kachelBlock.length > 200, 'Kachelblock nicht gefunden');
    for (const wert of ['10.5px', '9px', '10px', '11px !important', '12px !important']) {
      assert.ok(!kachelBlock.includes(wert), 'alter Sonderwert steht noch da: ' + wert);
    }
    assert.equal((kachelBlock.match(/@media/g) || []).length, 1,
      'es soll genau ein Haltepunkt uebrig sein');
    const zeile = /\.card-item\.city-league-card-item \.city-league-card-title-mobile \{\s*font-size: var\(--fs-sm\);/;
    assert.match(UI, zeile, 'der Kartentitel kommt nicht aus der Skala');
  });

  it('kein !important mehr auf den Schriftgroessen der Kartenkacheln', () => {
    // Sie waren der Grund, warum die Skala in einer .fs-scale-Ansicht nicht
    // durchkam: bei gleicher Wichtigkeit entscheidet die Ladefolge, und der
    // Boden laedt zuletzt. Ohne Boden gewann dann die em-Kette — 4,95 px.
    const dateien = ['css/mobile-responsive.css', 'css/ui-components.css',
                     'css/styles.css', 'index.html'];
    const klassen = ['city-league-card-title-mobile', 'city-league-card-set-mobile',
                     'city-league-card-stats-mobile', 'city-league-card-avg-mobile',
                     'city-league-card-deck-stats-mobile', 'city-league-card-badge',
                     'card-info-text'];
    for (const d of dateien) {
      // Kommentare zitieren die alten Werte absichtlich — sie duerfen den
      // Test nicht ausloesen.
      const text = R(d)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/<!--[\s\S]*?-->/g, '');
      const teile = text.split('}');
      for (const teil of teile) {
        const auf = teil.lastIndexOf('{');
        if (auf < 0) continue;
        const sel = teil.slice(0, auf);
        const koerper = teil.slice(auf);
        if (!klassen.some(k => sel.includes('.' + k))) continue;
        assert.ok(!/font-size:[^;]*!important/.test(koerper),
          `${d}: font-size mit !important auf einer Kartenklasse — ` + sel.trim().slice(-70));
      }
    }
  });

  it('Etappe 1 und 2 kommen ohne neues !important aus', () => {
    // Der Boden greift in der Ansicht nicht mehr, also genuegt Spezifitaet.
    // #current-meta.fs-scale (1,2,0) schlaegt #currentMetaContent (1,1,0).
    //
    // Die Grenze endet ausdruecklich VOR Etappe 3: dort tragen die Ziele
    // eine eigene !important-Regel, und das ist ein anderer Fall — siehe
    // die naechste Zusicherung.
    const block = MOBILE.slice(MOBILE.indexOf('#current-meta.fs-scale'),
                               MOBILE.indexOf('Etappe 3: City League'));
    assert.ok(block.length > 200, 'der Bereich der Etappen 1 und 2 ist leer');
    assert.ok(!/!important/.test(block),
      'der neue Block enthaelt !important — der Zaehler darf nicht steigen');
  });

  it('Etappe 3: die City League ist die dritte uebernommene Ansicht', () => {
    assert.match(INDEX, /id="city-league"[^>]*class="[^"]*\bfs-scale\b/,
      '#city-league traegt die Klasse nicht');
    assert.ok(MOBILE.indexOf('Etappe 3: City League') > 0,
      'der Block der Etappe 3 fehlt');
    // Genau die Komponenten, die ohne Boden unter 11 px fielen — gemessen
    // bei 390 px: 106 von 194 sichtbaren Textknoten, der kleinste 6,3 px.
    for (const k of ['.city-league-info-table-cell', '.city-league-info-table-header',
                     '.city-league-info-card-details', '.stat-badge',
                     '.data-freshness-chip', '.city-league-tier-title']) {
      assert.ok(MOBILE.includes('#city-league.fs-scale ' + k),
        'ohne Tokenwert faellt diese Klasse unter 11 px: ' + k);
    }
  });

  it('Etappe 3 braucht !important — und nur deshalb hat sie es', () => {
    /* ANDERS ALS ETAPPE 1 UND 2, und das ist kein Schlendrian.
       .city-league-info-table-cell setzt in derselben Datei
       `font-size: 0.6em !important`. Gegen !important verliert jede
       Regel ohne, egal wie spezifisch — die Etappe griffe sonst gar
       nicht. Geprueft wird deshalb BEIDES: dass die Ziele wirklich
       !important tragen (sonst waere unseres unnoetig) und dass die
       Groessen trotzdem aus der Skala kommen. */
    assert.match(MOBILE, /\.city-league-info-table-cell \{[^}]*font-size:[^;]*!important/s,
      'das Ziel traegt kein !important mehr — dann gehoert es aus Etappe 3 '
      + 'auch wieder entfernt');
    // Grenzen an den SELEKTOREN, nicht an den Kommentaren: der Block
    // zitiert die alten em-Werte absichtlich, und ein Schnitt mitten in
    // einen Kommentar laesst sich hinterher nicht mehr sauber saeubern.
    const roh = MOBILE.slice(MOBILE.indexOf('#city-league.fs-scale'),
                             MOBILE.indexOf('#past-meta.fs-scale'));
    assert.ok(roh.length > 200, 'der Block der Etappe 3 ist leer');
    const block = roh.replace(/\/\*[\s\S]*?\*\//g, '');
    const groessen = block.match(/font-size:\s*[^;]+;/g) || [];
    assert.ok(groessen.length >= 4, `nur ${groessen.length} Groessen in Etappe 3`);
    for (const g of groessen) {
      assert.match(g, /var\(--fs-(xs|sm|md|lg)\)/,
        'eine Groesse in Etappe 3 kommt nicht aus der Skala: ' + g);
    }
  });
});
