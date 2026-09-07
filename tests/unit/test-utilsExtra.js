/**
 * Die kleinen Helfer aus js/app-utils.js — ausgefuehrt, nicht gegriffen.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war am 07.09.2026 NULL Byte gross. Der Name behauptete Abdeckung
 * fuer ein gutes Dutzend Funktionen, die jeder Reiter der Seite
 * benutzt; `node --test` meldete darauf `# pass 1`, und die
 * Gesamtzahl der Suite war um genau diese eine Luecke zu hoch.
 * scripts/run-js-unit-tests.sh zaehlt leere Dateien seit dem
 * 30.08.2026 nicht mehr mit und benennt sie — diese hier ist die
 * Antwort darauf.
 *
 * WORAUF SIE SICH BEZIEHT
 * -----------------------
 * Alle geprueften Funktionen stehen weiterhin unter denselben Namen in
 * js/app-utils.js; keine ist umbenannt worden. Fundorte (Stand
 * 07.09.2026):
 *
 *   fixMojibake                 js/app-utils.js:308
 *   hasMojibake                 js/app-utils.js:345
 *   escapeHtmlAttr              js/app-utils.js:349
 *   escapeJsStr                 js/app-utils.js:362
 *   getLegacyCardNameAlias      js/app-utils.js:375
 *   getCanonicalDeckKey         js/app-utils.js:440
 *   normalizeCardName           js/app-utils.js:534
 *   getSafeCardIdentityName     js/app-utils.js:547
 *   isRadiantPokemon            js/app-utils.js:580
 *   isPrismStarCard             js/app-utils.js:585
 *   getDeckCopiesForCardName    js/app-utils.js:590
 *   getTotalAceSpecCopiesInDeck js/app-utils.js:602
 *   getTotalRadiantCopiesInDeck js/app-utils.js:611
 *   getLegalMaxCopies           js/app-utils.js:620
 *   getOpeningHandProbability   js/app-utils.js:633
 *   safeParseFloat              js/app-utils.js:827
 *   getRarityPriority           js/app-utils.js:1142
 *   getRarityAbbreviation       js/app-utils.js:1191
 *
 * KEIN jsdom, KEINE Livedaten
 * ---------------------------
 * Der Testschritt in .github/workflows/deploy-pages.yml installiert nur
 * papaparse. Deshalb werden die Funktionsruempfe per Klammerzaehlung aus
 * der Datei geschnitten und in einem vm-Kontext ausgefuehrt — dieselbe
 * Technik wie in tests/unit/lib-tier-sandkasten.js. Jede Eingabe setzt
 * dieser Test selbst; nichts unter data/ wird gelesen.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WURZEL = path.join(__dirname, '..', '..');
const QUELLE = fs.readFileSync(path.join(WURZEL, 'js', 'app-utils.js'), 'utf8');

/** Eine Funktionsdeklaration per Namen herausschneiden (Klammerzaehlung). */
function funktion(name) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(QUELLE);
    assert.ok(m, `Funktion nicht mehr in js/app-utils.js: ${name}`);
    const start = QUELLE.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = QUELLE.indexOf('{', start); i < QUELLE.length; i++) {
        if (QUELLE[i] === '{') tiefe++;
        else if (QUELLE[i] === '}' && --tiefe === 0) return QUELLE.slice(start, i + 1);
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

const NAMEN = [
    'fixMojibake', 'hasMojibake', 'escapeHtmlAttr', 'escapeJsStr',
    'getLegacyCardNameAlias', 'getDisplayCardName', 'getCanonicalDeckKey',
    'normalizeCardName', 'getSafeCardIdentityName', 'isBasicEnergy',
    'isRadiantPokemon', 'isPrismStarCard', 'getDeckCopiesForCardName',
    'getTotalAceSpecCopiesInDeck', 'getTotalRadiantCopiesInDeck',
    'getLegalMaxCopies', 'getOpeningHandProbability', 'safeParseFloat',
    'getRarityPriority', 'getRarityAbbreviation',
];

// Die Aliastabelle ist eine gefrorene Konstante im selben Modul; ohne
// sie faellt getLegacyCardNameAlias mit ReferenceError.
const ALIASE = (() => {
    const m = /const LEGACY_CARD_NAME_ALIASES = Object\.freeze\(\{[\s\S]*?\}\);/m.exec(QUELLE);
    assert.ok(m, 'LEGACY_CARD_NAME_ALIASES steht nicht mehr in js/app-utils.js');
    return m[0];
})();

/**
 * Die geschnittenen Funktionen in einem eigenen Realm ausfuehren.
 * `aceSpecs` bestimmt, was isAceSpec (die zentrale Fassung lebt in
 * js/app-core.js) hier melden soll — der Test setzt sie selbst.
 */
function baue(opts = {}) {
    const aceSpecs = (opts.aceSpecs || ['prime catcher', 'master ball']).map(s => s.toLowerCase());
    const kasten = {
        console: { log() {}, warn() {}, error() {} },
        String, Number, Object, Array, Map, Set, Math, JSON,
        parseInt, parseFloat, isNaN, RegExp,
        window: { cardsByNameMap: {} },
        // Nachbarmodule, die app-utils.js zur Laufzeit vorfindet.
        getCanonicalCardRecord: opts.getCanonicalCardRecord || (() => null),
        getCardByNameFromIndex: opts.getCardByNameFromIndex || (() => null),
        isAceSpec: (x) => {
            const n = String((x && (x.card_name || x.full_card_name || x.name)) || x || '')
                .toLowerCase().trim();
            return aceSpecs.includes(n);
        },
        isBasicEnergyCardEntry: opts.isBasicEnergyCardEntry || ((card) => {
            const n = String((card && (card.card_name || card.name)) || '').toLowerCase().trim();
            return /^(fire|water|grass|lightning|psychic|fighting|darkness|metal)\s+energy$/.test(n);
        }),
    };
    vm.createContext(kasten);
    vm.runInContext(ALIASE + '\n' + NAMEN.map(funktion).join('\n\n'), kasten);
    return kasten;
}

const F = baue();

// ── safeParseFloat ─────────────────────────────────────────────────
describe('safeParseFloat — Zahlen aus Text, deutsches Komma inbegriffen', () => {
    it('liest Punkt- und Kommaschreibweise auf denselben Wert', () => {
        assert.equal(F.safeParseFloat('2.5'), 2.5);
        assert.equal(F.safeParseFloat('2,5'), 2.5);
        assert.equal(F.safeParseFloat(42), 42);
    });

    it('gibt bei unlesbarer Eingabe den Ersatzwert zurueck, nicht NaN', () => {
        assert.equal(F.safeParseFloat('keine Zahl', -1), -1);
        assert.equal(F.safeParseFloat('', 7), 7);
        assert.equal(F.safeParseFloat(NaN, 3), 3);
        // Ohne zweiten Parameter ist der Ersatzwert 0.
        assert.equal(F.safeParseFloat('keine Zahl'), 0);
    });

    it('null und undefined fallen auf den Ersatzwert, nicht auf 0', () => {
        assert.equal(F.safeParseFloat(null, 5), 5);
        assert.equal(F.safeParseFloat(undefined, 5), 5);
    });

    it('Infinity ist keine endliche Zahl und faellt ebenfalls zurueck', () => {
        assert.equal(F.safeParseFloat(Infinity, 9), 9);
        assert.equal(F.safeParseFloat(-Infinity, 9), 9);
    });

    it('nur das ERSTE Komma wird getauscht — "1,234,5" wird nicht zu 1234.5', () => {
        // .replace(',', '.') ohne /g: Tausendertrenner werden NICHT
        // zusammengezogen. Das ist die dokumentierte Grenze der Funktion.
        assert.equal(F.safeParseFloat('1,234,5'), 1.234);
    });
});

// ── Maskierung: escapeHtmlAttr und escapeJsStr ─────────────────────
describe('escapeHtmlAttr — die fuenf Zeichen, die aus einem Attribut ausbrechen', () => {
    it('maskiert & < > " und \' vollstaendig', () => {
        assert.equal(F.escapeHtmlAttr('&'), '&amp;');
        assert.equal(F.escapeHtmlAttr('<'), '&lt;');
        assert.equal(F.escapeHtmlAttr('>'), '&gt;');
        assert.equal(F.escapeHtmlAttr('"'), '&quot;');
        assert.equal(F.escapeHtmlAttr("'"), '&#39;');
    });

    it('das kaufmaennische Und zuerst — sonst entstehen doppelte Entitaeten', () => {
        // Reihenfolgeprobe: wuerde & NACH < maskiert, kaeme &amp;lt; heraus.
        assert.equal(F.escapeHtmlAttr('&lt;'), '&amp;lt;');
    });

    it('ein Ausbruchsversuch aus einem Attribut bleibt Text', () => {
        const roh = '" onerror="alert(1)';
        const raus = F.escapeHtmlAttr(roh);
        assert.equal(raus.includes('"'), false, 'kein rohes Anfuehrungszeichen mehr');
        assert.equal(raus, '&quot; onerror=&quot;alert(1)');
    });

    it('null und undefined werden zu leer, nicht zum Text "null"', () => {
        assert.equal(F.escapeHtmlAttr(null), '');
        assert.equal(F.escapeHtmlAttr(undefined), '');
    });

    it('unauffaelliger Text bleibt unveraendert', () => {
        assert.equal(F.escapeHtmlAttr('Charizard ex'), 'Charizard ex');
    });
});

describe('escapeJsStr — Kartennamen in einem onclick-Aufruf', () => {
    it('Rueckstrich zuerst, sonst wird die eigene Maskierung mitmaskiert', () => {
        assert.equal(F.escapeJsStr('a\\b'), 'a\\\\b');
        assert.equal(F.escapeJsStr("\\'"), "\\\\\\'");
    });

    it('maskiert beide Anfuehrungszeichen und beide Zeilenenden', () => {
        assert.equal(F.escapeJsStr("Boss's Orders"), "Boss\\'s Orders");
        assert.equal(F.escapeJsStr('sagt "hallo"'), 'sagt \\"hallo\\"');
        assert.equal(F.escapeJsStr('a\nb'), 'a\\nb');
        assert.equal(F.escapeJsStr('a\rb'), 'a\\rb');
    });

    it('ein Ausbruch aus dem Zeichenkettenliteral gelingt nicht', () => {
        const roh = "'); alert(1); //";
        const raus = F.escapeJsStr(roh);
        assert.equal(raus, "\\'); alert(1); //");
        // Die harte Probe: kein einziges UNMASKIERTES Anfuehrungszeichen.
        assert.equal(/(^|[^\\])'/.test(raus), false, 'ein Apostroph steht ohne Rueckstrich davor');
        // Und die Gegenprobe am fertigen Aufruf: eingesetzt in
        // onclick="addCardToProxy('…')" bleibt der Rumpf ein Argument.
        const aufruf = `addCardToProxy('${raus}')`;
        assert.equal(aufruf, "addCardToProxy('\\'); alert(1); //')");
        assert.equal(aufruf.split(/(?<!\\)'/).length, 3, 'genau zwei unmaskierte Begrenzer');
    });

    it('null wird zu leer', () => {
        assert.equal(F.escapeJsStr(null), '');
    });
});

// ── Mojibake ───────────────────────────────────────────────────────
describe('fixMojibake / hasMojibake — kaputte UTF-8-Bytes erkennen und heilen', () => {
    it('erkennt die drei Marker Ã, Â und â', () => {
        assert.equal(F.hasMojibake('LatiasÂ ex'), true);
        assert.equal(F.hasMojibake('PokÃ©mon'), true);
        assert.equal(F.hasMojibake('â€™'), true);
    });

    it('sauberer Text — auch mit echten Umlauten — gilt nicht als kaputt', () => {
        assert.equal(F.hasMojibake('Pokémon'), false);
        assert.equal(F.hasMojibake('Glurak für alle'), false);
        assert.equal(F.hasMojibake(''), false);
        assert.equal(F.hasMojibake(null), false);
    });

    it('repariert die haeufigen Folgen und raeumt das Stray-Byte weg', () => {
        assert.equal(F.fixMojibake('PokÃ©mon'), 'Pokémon');
        assert.equal(F.fixMojibake('LatiasÂ ex'), 'Latias ex');
    });

    it('null und undefined werden zu leer', () => {
        assert.equal(F.fixMojibake(null), '');
        assert.equal(F.fixMojibake(undefined), '');
    });
});

// ── normalizeCardName ──────────────────────────────────────────────
describe('normalizeCardName — der Schluessel, auf dem die halbe Seite vergleicht', () => {
    it('entfernt Klammerzusaetze und senkt die Schreibweise', () => {
        assert.equal(F.normalizeCardName('Charizard ex (MEW 006)'), 'charizard ex');
        assert.equal(F.normalizeCardName('Iono [PAL]'), 'iono');
    });

    it('vereinheitlicht krumme Apostrophe auf den geraden', () => {
        assert.equal(F.normalizeCardName('Boss’s Orders'), F.normalizeCardName("Boss's Orders"));
    });

    it('zieht Mehrfachleerzeichen zusammen', () => {
        assert.equal(F.normalizeCardName('Ultra    Ball'), 'ultra ball');
    });

    it('leere Eingabe, null und undefined ergeben die leere Zeichenkette', () => {
        assert.equal(F.normalizeCardName(''), '');
        assert.equal(F.normalizeCardName(null), '');
        assert.equal(F.normalizeCardName(undefined), '');
    });

    it('der Altnamens-Alias greift und wird kleingeschrieben zurueckgegeben', () => {
        // LEGACY_CARD_NAME_ALIASES: 'rock fighting energy' -> 'Rocky Fighting Energy'
        assert.equal(F.normalizeCardName('Rock Fighting Energy'), 'rocky fighting energy');
    });
});

// ── getSafeCardIdentityName ────────────────────────────────────────
describe('getSafeCardIdentityName — Druckmarke weg, Spielmarke bleibt', () => {
    it('entfernt "(SET NUM)" am Ende', () => {
        assert.equal(F.getSafeCardIdentityName('Charizard ex (MEW 006)'), 'Charizard ex');
    });

    it('entfernt auch die klammerlose Form "SET NUM"', () => {
        assert.equal(F.getSafeCardIdentityName('Ultra Ball SVI 196'), 'Ultra Ball');
    });

    it('spielentscheidende Endungen bleiben stehen', () => {
        assert.equal(F.getSafeCardIdentityName('Lucario ex'), 'Lucario ex');
        assert.equal(F.getSafeCardIdentityName('Charizard VMAX'), 'Charizard VMAX');
    });

    it('leere Eingabe und null ergeben leer', () => {
        assert.equal(F.getSafeCardIdentityName(''), '');
        assert.equal(F.getSafeCardIdentityName(null), '');
        assert.equal(F.getSafeCardIdentityName(undefined), '');
    });

    it('ein Name, der NUR aus einer Druckmarke besteht, wird nicht weggeschnitten', () => {
        // noTrailingPrint waere leer — dann gilt der Rohname.
        assert.equal(F.getSafeCardIdentityName('SVI 196'), 'SVI 196');
    });
});

// ── getCanonicalDeckKey ────────────────────────────────────────────
describe('getCanonicalDeckKey — der Schluessel, unter dem eine Karte im Deck liegt', () => {
    it('baut "Name (SET NUM)", wenn Set UND Nummer da sind', () => {
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', 'svi', '196'), 'Ultra Ball (SVI 196)');
    });

    it('das Setkuerzel wird grossgeschrieben, die Nummer nicht angefasst', () => {
        assert.equal(F.getCanonicalDeckKey('Iono', 'pal', '185a'), 'Iono (PAL 185a)');
    });

    it('fehlt eines von beidem, bleibt der blosse Name uebrig', () => {
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', '', '196'), 'Ultra Ball');
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', 'SVI', ''), 'Ultra Ball');
        assert.equal(F.getCanonicalDeckKey('Ultra Ball', null, null), 'Ultra Ball');
    });

    it('ein leerer Kartenname ergibt "Unknown Card", nicht die leere Zeichenkette', () => {
        assert.equal(F.getCanonicalDeckKey('', '', ''), 'Unknown Card');
        assert.equal(F.getCanonicalDeckKey(null, null, null), 'Unknown Card');
    });

    it('bei kaputtem Eingangsnamen gewinnt der Name aus dem Kartenindex', () => {
        const G = baue({ getCanonicalCardRecord: () => ({ name_en: 'Pokémon Center Lady' }) });
        assert.equal(
            G.getCanonicalDeckKey('PokÃ©mon Center Lady', 'SVI', '9'),
            'Pokémon Center Lady (SVI 9)'
        );
    });
});

// ── Zaehler ueber ein Deck ─────────────────────────────────────────
describe('getDeckCopiesForCardName — zaehlt ueber alle Drucke derselben Karte', () => {
    const deck = {
        'Ultra Ball (SVI 196)': 2,
        'Ultra Ball (PAF 91)': 2,
        'Ultra Ball': 1,
        'Nest Ball (SVI 181)': 3,
    };

    it('addiert alle Druckvarianten zu einer Zahl', () => {
        assert.equal(F.getDeckCopiesForCardName(deck, 'Ultra Ball'), 5);
    });

    it('der uebergebene Name darf selbst eine Druckmarke tragen', () => {
        assert.equal(F.getDeckCopiesForCardName(deck, 'Ultra Ball (PAF 91)'), 5);
    });

    it('eine nicht enthaltene Karte ergibt 0', () => {
        assert.equal(F.getDeckCopiesForCardName(deck, 'Rare Candy'), 0);
    });

    it('leeres Deck, null-Deck und leerer Name ergeben 0', () => {
        assert.equal(F.getDeckCopiesForCardName({}, 'Ultra Ball'), 0);
        assert.equal(F.getDeckCopiesForCardName(null, 'Ultra Ball'), 0);
        assert.equal(F.getDeckCopiesForCardName(deck, ''), 0);
        assert.equal(F.getDeckCopiesForCardName(deck, null), 0);
    });

    it('unlesbare Anzahlen zaehlen als 0 und reissen die Summe nicht auf NaN', () => {
        const kaputt = { 'Ultra Ball (SVI 196)': 'zwei', 'Ultra Ball (PAF 91)': 2 };
        assert.equal(F.getDeckCopiesForCardName(kaputt, 'Ultra Ball'), 2);
    });
});

describe('getTotalAceSpecCopiesInDeck / getTotalRadiantCopiesInDeck', () => {
    it('zaehlt Ace Specs deckweit, quer ueber verschiedene Namen', () => {
        const deck = { 'Prime Catcher (TEF 157)': 1, 'Master Ball (TWM 145)': 1, 'Iono (PAL 185)': 4 };
        assert.equal(F.getTotalAceSpecCopiesInDeck(deck), 2);
    });

    it('ohne Ace Spec ist es 0 — und ein leeres/null-Deck ebenfalls', () => {
        assert.equal(F.getTotalAceSpecCopiesInDeck({ 'Iono (PAL 185)': 4 }), 0);
        assert.equal(F.getTotalAceSpecCopiesInDeck({}), 0);
        assert.equal(F.getTotalAceSpecCopiesInDeck(null), 0);
    });

    it('zaehlt Radiant-Pokemon ueber den Namensanfang', () => {
        const deck = { 'Radiant Greninja (ASR 46)': 1, 'Radiant Charizard (CRZ 20)': 1, 'Greninja ex': 2 };
        assert.equal(F.getTotalRadiantCopiesInDeck(deck), 2);
    });

    it('"Radiantxyz" ohne Leerzeichen ist kein Radiant-Pokemon', () => {
        assert.equal(F.getTotalRadiantCopiesInDeck({ 'Radiantly Shiny Thing': 3 }), 0);
    });
});

// ── getLegalMaxCopies ──────────────────────────────────────────────
describe('getLegalMaxCopies — die Obergrenze, die den Deckbau bindet', () => {
    it('gewoehnliche Karten duerfen viermal ins Deck', () => {
        assert.equal(F.getLegalMaxCopies('Iono'), 4);
    });

    it('Basis-Energie ist praktisch unbegrenzt (59)', () => {
        assert.equal(F.getLegalMaxCopies('Fire Energy'), 59);
    });

    it('Ace Spec, Radiant und Prism Star sind Einzelstuecke', () => {
        assert.equal(F.getLegalMaxCopies('Prime Catcher'), 1);
        assert.equal(F.getLegalMaxCopies('Radiant Greninja'), 1);
        assert.equal(F.getLegalMaxCopies('Solgaleo ◇'), 1);
        assert.equal(F.getLegalMaxCopies('Lunala Prism Star'), 1);
    });

    it('nimmt auch ein Kartenobjekt statt einer Zeichenkette', () => {
        assert.equal(F.getLegalMaxCopies({ card_name: 'Prime Catcher' }), 1);
        assert.equal(F.getLegalMaxCopies({ name: 'Iono' }), 4);
    });

    it('leere Eingabe faellt auf 4, nicht auf 0 oder 1', () => {
        assert.equal(F.getLegalMaxCopies(''), 4);
        assert.equal(F.getLegalMaxCopies(null), 4);
    });
});

// ── getOpeningHandProbability ──────────────────────────────────────
describe('getOpeningHandProbability — sieben Karten, hypergeometrisch', () => {
    it('vier von sechzig in der Starthand: 39,9 %', () => {
        // 1 - (56·55·54·53·52·51·50)/(60·59·58·57·56·55·54) = 0,39926…
        assert.equal(F.getOpeningHandProbability(4, 60), '39.9');
    });

    it('eine von sechzig: 11,7 %', () => {
        assert.equal(F.getOpeningHandProbability(1, 60), '11.7');
    });

    it('mehr Kopien heben die Wahrscheinlichkeit streng monoton', () => {
        const werte = [1, 2, 3, 4].map(n => Number(F.getOpeningHandProbability(n, 60)));
        for (let i = 1; i < werte.length; i++) {
            assert.ok(werte[i] > werte[i - 1], `${werte[i]} muss ueber ${werte[i - 1]} liegen`);
        }
    });

    it('null Kopien und negative Kopien ergeben 0', () => {
        assert.equal(F.getOpeningHandProbability(0, 60), 0);
        assert.equal(F.getOpeningHandProbability(-3, 60), 0);
    });

    it('ein Deck unter sieben Karten ergibt 0 statt einer Wurzel aus Unsinn', () => {
        assert.equal(F.getOpeningHandProbability(4, 6), 0);
    });

    it('sind alle Karten Kopien, ist es sicher — 100,0', () => {
        assert.equal(F.getOpeningHandProbability(60, 60), '100.0');
    });
});

// ── Seltenheiten ───────────────────────────────────────────────────
describe('getRarityPriority — die Rangfolge, nach der der Druckwechsler waehlt', () => {
    it('teurer schlaegt billiger: Common < Double Rare < SAR < Secret Rare', () => {
        const c = F.getRarityPriority('Common');
        const dr = F.getRarityPriority('Double Rare');
        const sar = F.getRarityPriority('Special Illustration Rare');
        const sr = F.getRarityPriority('Secret Rare');
        assert.ok(c < dr && dr < sar && sar < sr, `Rangfolge verletzt: ${c} ${dr} ${sar} ${sr}`);
    });

    it('"Uncommon" wird nicht als "Common" gelesen', () => {
        // Beide Zeichenketten enthalten "common"; die Reihenfolge der
        // Abfragen entscheidet. Faellt sie um, tauschen zwei Stufen.
        assert.equal(F.getRarityPriority('Uncommon'), 2);
        assert.equal(F.getRarityPriority('Common'), 1);
    });

    it('"Secret Rare" wird nicht vom Sammelbegriff "rare" abgefangen', () => {
        assert.equal(F.getRarityPriority('Secret Rare'), 16);
        assert.equal(F.getRarityPriority('Rare'), 3);
    });

    it('ohne Seltenheit: Promo-Set bekommt 8, alles andere 999', () => {
        assert.equal(F.getRarityPriority('', 'SVP'), 8);
        assert.equal(F.getRarityPriority(null, 'SVI'), 999);
        assert.equal(F.getRarityPriority(undefined), 999);
    });

    it('die Gross-/Kleinschreibung der Seltenheit ist egal', () => {
        assert.equal(F.getRarityPriority('DOUBLE RARE'), F.getRarityPriority('double rare'));
    });

    it('eine unbekannte Seltenheit landet auf 0 und damit ganz unten', () => {
        assert.equal(F.getRarityPriority('Glitzerkarte'), 0);
    });
});

describe('getRarityAbbreviation — das Kuerzel fuer die Bild-URL', () => {
    it('trifft die bekannten Stufen', () => {
        assert.equal(F.getRarityAbbreviation('Common'), 'C');
        assert.equal(F.getRarityAbbreviation('Special Art Rare'), 'SAR');
        assert.equal(F.getRarityAbbreviation('Secret Rare'), 'SR');
    });

    it('ohne Seltenheit ist es "C", bei unbekannter Seltenheit "R"', () => {
        assert.equal(F.getRarityAbbreviation(''), 'C');
        assert.equal(F.getRarityAbbreviation(null), 'C');
        assert.equal(F.getRarityAbbreviation('Glitzerkarte'), 'R');
    });

    it('die Tabelle ist schreibungsgenau — "common" trifft sie nicht', () => {
        // Dokumentierte Grenze: rarityMap wird ohne Normalisierung
        // gelesen. Wer sie schreibungsunabhaengig macht, muss hier vorbei.
        assert.equal(F.getRarityAbbreviation('common'), 'R');
    });
});

// ── isRadiantPokemon / isPrismStarCard ─────────────────────────────
describe('isRadiantPokemon / isPrismStarCard — die beiden Ein-Kopie-Klassen', () => {
    it('erkennt Radiant unabhaengig von Schreibung und Druckmarke', () => {
        assert.equal(F.isRadiantPokemon('Radiant Greninja'), true);
        assert.equal(F.isRadiantPokemon('radiant charizard (CRZ 20)'), true);
    });

    it('ein blosser Wortanfang "Radiant..." ohne Leerzeichen zaehlt nicht', () => {
        assert.equal(F.isRadiantPokemon('Radiantly Shiny Thing'), false);
        assert.equal(F.isRadiantPokemon('Greninja ex'), false);
        assert.equal(F.isRadiantPokemon(''), false);
        assert.equal(F.isRadiantPokemon(null), false);
    });

    it('Prism Star greift auf das Rautenzeichen UND auf den Wortlaut', () => {
        assert.equal(F.isPrismStarCard('Solgaleo ◇'), true);
        assert.equal(F.isPrismStarCard('Lunala Prism Star'), true);
        assert.equal(F.isPrismStarCard('lunala prismstar'), true);
    });

    it('normale Karten sind kein Prism Star', () => {
        assert.equal(F.isPrismStarCard('Iono'), false);
        assert.equal(F.isPrismStarCard(''), false);
        assert.equal(F.isPrismStarCard(null), false);
    });
});
