/* Das Raster, der Stern und die Herkunftsangaben.
 *
 * Vom Betreiber am 09.09.2026 bestellt: ein Raster aller in Champions
 * verfuegbaren Pokemon, sortierbar nach Nummer und nach Champions-Nutzung,
 * mit Editions- und GO-Angabe im Detail und einem Stern fuer "habe ich
 * schon als Shiny", der am Profil haengt.
 *
 * Der wichtigste Punkt hier ist NICHT, dass das Raster rendert. Es ist,
 * dass die GO-Angabe kein Nein kennt. Die Quelle (PokeWiki) markiert sich
 * selbst als veraltet und fehlerhaft; alles ab 2026 fehlt dort. Ein
 * fehlender Eintrag belegt deshalb keine Abwesenheit — und ein "nicht in
 * GO" auf dem Bildschirm waere eine Behauptung, die die Datei nicht traegt.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const l = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

const JS = l('js/app-side-quest-pokedex.js');
const SHINY = l('js/champions-shiny.js');
const CSS = l('css/side-quest.css');
const HTML = l('index.html');
const GO = JSON.parse(l('data/pokemon_go_liste.json'));
const ED = JSON.parse(l('data/champions_editionen.json'));
const DEX = JSON.parse(l('data/champions_pokedex.json'));
const TEAMS = JSON.parse(l('data/champions_replica_teams.json'));

describe('GO-Angabe: es gibt kein Nein', () => {
    it('die Datei traegt die Warnung der Quelle mit sich', () => {
        assert.ok(GO._meta && GO._meta.warnung, 'ohne Warnung im _meta kann die Oberflaeche sie nicht zeigen');
        assert.match(GO._meta.warnung, /veraltet/i,
            'die Warnung der Quelle nennt das Wort "veraltet" — genau darum geht es');
        assert.match(GO._meta.lesart_kein_treffer, /kein Beleg/i,
            'die Lesart eines fehlenden Treffers muss in der Datei stehen, nicht nur im Kopf eines Menschen');
    });

    it('die Oberflaeche behauptet nirgends, ein Pokemon sei NICHT in GO', () => {
        // goStatus() darf drei Werte liefern: gelistet, nicht-gelistet, mega.
        // Ein vierter Zweig "nein" waere der Fehler, den dieser Test verhindert.
        const m = JS.match(/function goStatus\(e\)\s*\{[\s\S]*?\n    \}/);
        assert.ok(m, 'goStatus() nicht gefunden');
        assert.ok(!/'nein'|"nein"|is-nein/.test(m[0]),
            'goStatus() darf kein Nein kennen — die Quelle traegt keines');
        // Und die Beschriftung sagt "steht nicht in dieser Liste", nicht "gibt es nicht".
        assert.match(JS, /goUnklar: 'Steht nicht in dieser Liste'/,
            'die deutsche Beschriftung muss die Liste nennen, nicht die Wirklichkeit');
        assert.match(JS, /goUnklarHint: 'Das ist kein Nein/,
            'der Hinweis muss ausdruecklich sagen, dass das kein Nein ist');
    });

    it('Mega-Formen bekommen eine eigene Antwort statt einer geratenen', () => {
        // Die GO-Liste fuehrt nur Grundformen. Ein Mega als "nicht gelistet"
        // zu zeigen waere irrefuehrend — es steht dort gar nicht zur Debatte.
        assert.match(JS, /if \(e\.form === 'Mega'\) return 'mega';/,
            'Megas muessen vor der Mengenpruefung abgefangen werden');
        assert.match(JS, /goMega: 'Mega-Entwicklung — die Liste führt nur Grundformen'/);
    });
});

describe('Editionsangabe', () => {
    it('sagt "kommt vor", nicht "ist zu fangen"', () => {
        assert.match(JS, /editionenTitel: 'Kommt vor in'/,
            'die Quelle belegt Vorkommen, nicht Fangbarkeit');
        assert.match(JS, /editionenHint: 'Die Quelle sagt, in welchen Editionen die Art vorkommt — nicht/,
            'der Unterschied muss am Bildschirm stehen, nicht nur im Quelltext');
        assert.match(ED._meta.zweck, /NICHT: wo sie fangbar ist/,
            'auch die Datei selbst muss ihre Grenze nennen');
    });

    it('die zwei kopierten Editionen sind ausgeschlossen, und die Begruendung stimmt noch', () => {
        assert.ok(ED._meta.ausgeschlossen['legends-za'], 'legends-za muss ausgeschlossen sein');
        assert.ok(ED._meta.ausgeschlossen['mega-dimension'], 'mega-dimension muss ausgeschlossen sein');
        const alle = Object.values(ED.editionen).flat().map(v => v.schluessel);
        assert.ok(!alle.includes('legends-za'),
            'legends-za steht trotz Sperre in den Daten');
        assert.ok(!alle.includes('mega-dimension'),
            'mega-dimension steht trotz Sperre in den Daten');
    });

    it('jede Art des Rosters hat eine Editionsliste', () => {
        const arten = [...new Set(DEX.entries.map(e => String(e.dex)))];
        const ohne = arten.filter(d => !(ED.editionen[d] || []).length);
        assert.deepEqual(ohne, [], 'diese Arten haben keine einzige Edition');
    });
});

describe('Sortierung nach Champions-Nutzung', () => {
    it('zaehlt Auftritte in den Replica-Teams', () => {
        assert.match(JS, /if \(_sortKey === 'nutzung'\) return teamAuftritte\(e\);/);
        assert.match(JS, /sNutzung: 'Champions-Nutzung'/);
    });

    it('die zwei Sonderschreibweisen finden ihren Pokedex-Eintrag', () => {
        // Ohne diese Zuordnung stuende bei Floette "0 Team-Auftritte",
        // obwohl es mit 22 Auftritten Rang 8 des Feldes ist.
        assert.match(JS, /floetteeternal: 'Floette'/);
        assert.match(JS, /mausholdfour: 'Maushold'/);
    });

    it('JEDER Teamname findet einen Pokedex-Eintrag — nachgerechnet, nicht behauptet', () => {
        const REG = { alolan: 'Alola', galarian: 'Galar', hisuian: 'Hisui', paldean: 'Paldea' };
        const AUS = { floetteeternal: 'Floette', mausholdfour: 'Maushold' };
        const n = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const showdown = (en) => {
            let m = String(en).match(/^(Alolan|Galarian|Hisuian|Paldean)\s+(.+)$/);
            if (m) return m[2] + '-' + REG[m[1].toLowerCase()];
            m = String(en).match(/^Mega\s+(.+?)(?:\s+([XY]))?$/);
            if (m) return m[1] + '-Mega' + (m[2] ? '-' + m[2] : '');
            return en;
        };
        const bekannt = new Set();
        DEX.entries.forEach(e => { bekannt.add(n(showdown(e.en))); bekannt.add(n(e.en)); });
        const namen = new Set();
        (TEAMS.teams || []).forEach(t => (t.pokemon || []).forEach(p => {
            if (p && p.name) namen.add(String(p.name).trim());
        }));
        const verwaist = [...namen].filter(nm => {
            const s = AUS[n(nm)] ? n(AUS[n(nm)]) : n(nm);
            return !bekannt.has(s);
        });
        assert.deepEqual(verwaist, [],
            'diese Teamnamen finden kein Pokemon — sie zaehlen dann als 0 Auftritte, '
            + 'obwohl sie gespielt werden. Fuer jeden gehoert eine Zeile in TEAM_AUSNAHMEN.');
    });
});

describe('Shiny-Stern', () => {
    it('haengt am Nutzerdokument, ohne die Sammlung anzufassen', () => {
        assert.match(SHINY, /championsShiny/, 'das Feld im Nutzerdokument fehlt');
        assert.match(SHINY, /updateUserDoc/, 'ohne updateUserDoc bleibt der Stern lokal');
        // update() auf ein benanntes Feld — nicht set(), das den Rest ersetzt.
        assert.ok(!/\.set\(/.test(SHINY),
            'set() wuerde das ganze Nutzerdokument ersetzen und Sammlung, '
            + 'Wunschliste und Decks mitnehmen');
    });

    it('vereinigt beim Anmelden, statt zu ersetzen', () => {
        assert.match(SHINY, /fern\.forEach\(function \(k\) \{ s\.add/,
            'die Wolke muss zu den lokalen Sternen DAZU kommen');
        // Ein s.clear() vor dem Vereinigen macht daraus wieder ein Ersetzen,
        // ohne dass die Zeile darueber sich aendert. Der Speicher wird
        // nirgends geleert — Sterne verschwinden nur durch einen Klick.
        assert.ok(!/\.clear\(\)/.test(SHINY),
            'nichts in diesem Modul darf den Sternspeicher leeren — das waere '
            + 'ein Ersetzen mit zusaetzlichen Schritten');
        assert.match(SHINY, /VEREINIGT, NICHT ERSETZT/,
            'die Regel gehoert in den Kopf, sonst dreht sie der naechste um');
    });

    it('haelt Form und Nummer auseinander', () => {
        // 292 Eintraege auf 204 Arten: die Nummer allein wuerde Vulnona und
        // Vulnona (Alola) zu einem Stern zusammenfassen.
        assert.match(SHINY, /return dex \+ '\|' \+ form;/);
        const arten = new Set(DEX.entries.map(e => e.dex));
        assert.ok(DEX.entries.length > arten.size,
            'wenn jede Art nur einen Eintrag haette, waere der Formteil unnoetig — '
            + 'dann gehoert dieser Test weg');
    });

    it('ist verdrahtet und wird vor der Ansicht geladen', () => {
        const iShiny = HTML.indexOf('js/champions-shiny.js');
        const iView = HTML.indexOf('js/app-side-quest-pokedex.js');
        assert.ok(iShiny > 0, 'champions-shiny.js ist nicht eingebunden');
        assert.ok(iShiny < iView,
            'der Sternspeicher muss vor der Ansicht geladen werden, die ihn benutzt');
        assert.match(l('service-worker.js'), /champions-shiny\.js/,
            'ohne Eintrag im Service Worker fehlt die Datei offline');
    });
});

describe('Raster', () => {
    it('bietet beide Ansichten und beide neuen Sortierungen an', () => {
        assert.match(JS, /ansichtRaster: 'Raster'/);
        assert.match(JS, /ansichtTabelle: 'Tabelle'/);
        assert.match(JS, /presetBtn\('dex', 1, l\.sDex\)/, 'Sortierung nach Nummer fehlt');
        assert.match(JS, /presetBtn\('nutzung', -1, l\.sNutzung\)/, 'Sortierung nach Nutzung fehlt');
    });

    it('der Stern liegt neben der Kachel, nicht darin', () => {
        // Ein <button> in einem <button> ist ungueltiges HTML, und der Klick
        // auf den Stern wuerde zusaetzlich das Detail oeffnen.
        assert.match(JS, /sqp-kachel-huelle/);
        const kachel = JS.match(/function kachelHtml\(e\)[\s\S]*?\n    \}/)[0];
        assert.ok(!/sqp-stern/.test(kachel),
            'der Stern darf nicht innerhalb der Kachel gerendert werden');
        assert.match(JS, /ev\.stopPropagation\(\);/,
            'ohne stopPropagation oeffnet der Sternklick zusaetzlich das Detail');
    });

    it('beide Sprachen kennen jede neue Beschriftung', () => {
        const neu = ['sDex', 'sNutzung', 'ansichtRaster', 'ansichtTabelle', 'nurShiny',
                     'sternAn', 'sternAus', 'herkunftTitel', 'editionenTitel',
                     'goTitel', 'goJa', 'goUnklar', 'goMega'];
        const de = JS.slice(JS.indexOf('de: {'), JS.indexOf('en: {'));
        const en = JS.slice(JS.indexOf('en: {'));
        neu.forEach(k => {
            assert.ok(de.includes(k + ':'), `deutsche Beschriftung ${k} fehlt`);
            assert.ok(en.includes(k + ':'), `englische Beschriftung ${k} fehlt`);
        });
    });

    it('die Kachel bleibt lesbar, wenn der Name lang ist', () => {
        // "Tauros (Paldea, Flammenvariante)" ist 32 Zeichen lang.
        assert.match(CSS, /-webkit-line-clamp: 2;/,
            'ohne Zeilenbegrenzung sprengt ein langer Name die Kachel');
        const lang = DEX.entries.filter(e => (e.de || '').length > 25);
        assert.ok(lang.length > 0,
            'kein langer Name mehr im Bestand — dann ist die Begrenzung unnoetig');
    });
});
