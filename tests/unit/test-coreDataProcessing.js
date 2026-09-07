/**
 * Die Datenaufbereitung aus js/app-core.js.
 *
 * WARUM ES DIESE DATEI GIBT
 * -------------------------
 * Sie war 0 Byte gross. Der Name behauptete Abdeckung fuer die Schicht,
 * durch die jede Turnierzeile laeuft, bevor sie irgendwo angezeigt wird.
 *
 * WAS HIER GEPRUEFT WIRD (alles AUSGEFUEHRT, nicht gegriffen)
 * -----------------------------------------------------------
 *   js/app-core.js:469  normalizeProxySetCode
 *   js/app-core.js:475  normalizeProxyCardNumber
 *   js/app-core.js:481  buildProxyItemId
 *   js/app-core.js:491  getCardDisplayName / :495 getCardSetCode / :499 getCardNumber
 *   js/app-core.js:2224 fixCardNameEncoding / :2234 healCurrentMetaCardRows
 *   js/app-core.js:2301 mapSetCodeToMetaFormat
 *   js/app-core.js:2353 normalizeTournamentFormatLabel
 *   js/app-core.js:2400 sanitizeTournamentArchetypeName
 *   js/app-core.js:2409 normalizeCurrentMetaFallbackRows
 *   js/app-core.js:1857 parseArchetypeSelection
 *   js/app-core.js:3447 filterCardsArray
 *   js/app-core.js:3600 sortCardsPTCG
 *
 * Zwei Dinge sind GESETZT statt geladen, weil sie Eingaben sind und
 * nicht Gegenstand der Pruefung: setOrderMap (kommt sonst aus
 * data/sets.json) und parseLocaleNumber.
 *
 * KEINE LIVEDATEN, KEIN jsdom.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const CORE = fs.readFileSync(path.join(WURZEL, 'js', 'app-core.js'), 'utf8');

function funktion(name, quelle = CORE) {
    const re = new RegExp(`(^|\\n)\\s*function\\s+${name}\\s*\\(`);
    const m = re.exec(quelle);
    if (!m) throw new Error('Funktion nicht gefunden: ' + name);
    const start = quelle.indexOf('function', m.index);
    let tiefe = 0;
    for (let i = quelle.indexOf('{', start); i < quelle.length; i++) {
        if (quelle[i] === '{') tiefe++;
        else if (quelle[i] === '}') {
            tiefe--;
            if (tiefe === 0) return quelle.slice(start, i + 1);
        }
    }
    throw new Error(name + ': die Klammern gehen nicht auf');
}

function block(re, was) {
    const m = CORE.match(re);
    if (!m) throw new Error('Block nicht gefunden: ' + was);
    return m[0];
}

const NAMEN = [
    'normalizeProxySetCode', 'normalizeProxyCardNumber', 'buildProxyItemId',
    'getCardDisplayName', 'getCardSetCode', 'getCardNumber',
    'fixCardNameEncoding', 'healCurrentMetaCardRows',
    'mapSetCodeToMetaFormat', 'normalizeTournamentFormatLabel',
    'sanitizeTournamentArchetypeName', 'normalizeCurrentMetaFallbackRows',
    'parseArchetypeSelection', 'filterCardsArray', 'sortCardsPTCG',
];

const QUELLTEXT = [
    block(/const KNOWN_META_FORMAT_CODES = \[[\s\S]*?\];/, 'KNOWN_META_FORMAT_CODES'),
    block(/const TOURNAMENT_FORMAT_NAME_TO_CODE = \{[\s\S]*?\n        \};/, 'TOURNAMENT_FORMAT_NAME_TO_CODE'),
    'const _seenUnknownFormatLabels = new Set();',
    // Gesetzt: die Zahlenumwandlung ist woanders geprueft.
    'function parseLocaleNumber(v, f) { const n = parseFloat(String(v ?? f).replace(",", ".")); return Number.isFinite(n) ? n : f; }',
    ...NAMEN.map(n => funktion(n)),
].join('\n\n');

// setOrderMap kommt in der Auslieferung aus data/sets.json. Hier
// GESETZT: die Reihenfolge ist Eingabe der Rotationsregel, nicht ihr
// Gegenstand. CRI liegt bewusst ueber TEF, damit die Regel greift.
const SET_ORDER = { XY: 1, PAR: 5, SVI: 10, SVE: 10, TEF: 20, MEG: 30, CRI: 40 };

// eslint-disable-next-line no-new-func
const F = new Function('window', 'setOrderMap',
    QUELLTEXT + '\nreturn { ' + NAMEN.join(', ') + ' };')({}, SET_ORDER);

describe('Proxy-Kennungen — normalizeProxySetCode / -CardNumber / buildProxyItemId', () => {
    it('die Platzhalter "???" und "?" werden zu leerem Text', () => {
        // Die Scraper schreiben sie, wenn Set oder Nummer fehlen. Ohne
        // diese Regel stuende "???" als Set in der Proxy-Kennung.
        assert.equal(F.normalizeProxySetCode('???'), '');
        assert.equal(F.normalizeProxyCardNumber('?'), '');
    });

    it('leere und fehlende Eingaben ergeben leeren Text, nie "undefined"', () => {
        for (const leer of [null, undefined, '', '   ', 0, false, NaN]) {
            assert.equal(F.normalizeProxySetCode(leer), '', JSON.stringify(leer));
            assert.equal(F.normalizeProxyCardNumber(leer), '', JSON.stringify(leer));
        }
    });

    it('das Set wird gross geschrieben, die Nummer NICHT', () => {
        // Gemessen: Kartennummern wie "SV107" behalten ihre Schreibung,
        // damit die Bildadresse stimmt.
        assert.equal(F.normalizeProxySetCode(' svi '), 'SVI');
        assert.equal(F.normalizeProxyCardNumber(' sv107 '), 'sv107');
        assert.equal(F.normalizeProxyCardNumber(' 012 '), '012',
            'fuehrende Nullen bleiben stehen');
    });

    it('die Kennung setzt sich aus kleinem Namen, grossem Set und Nummer zusammen', () => {
        assert.equal(F.buildProxyItemId(' Ultra Ball ', 'svi', '196'), 'ultra ball|SVI|196');
        assert.equal(F.buildProxyItemId(null, '???', '?'), '||',
            'auch ohne jede Angabe kommt eine wohlgeformte Kennung heraus');
    });

    it('zwei Drucke derselben Karte bekommen verschiedene Kennungen', () => {
        assert.notEqual(
            F.buildProxyItemId('Ultra Ball', 'SVI', '196'),
            F.buildProxyItemId('Ultra Ball', 'BRS', '186')
        );
    });
});

describe('Kartenfelder — getCardDisplayName / getCardSetCode / getCardNumber', () => {
    it('der englische Name hat Vorrang vor dem allgemeinen', () => {
        assert.equal(F.getCardDisplayName({ name_en: ' Pikachu ', name: 'Pikachu JP' }), 'Pikachu');
        assert.equal(F.getCardDisplayName({ name: 'Iono' }), 'Iono');
    });

    it('eine fehlende Karte ergibt leeren Text statt eines Wurfs', () => {
        for (const leer of [null, undefined, {}]) {
            assert.equal(F.getCardDisplayName(leer), '');
            assert.equal(F.getCardSetCode(leer), '');
            assert.equal(F.getCardNumber(leer), '');
        }
    });

    it('beide Spaltenschreibweisen werden gelesen und normalisiert', () => {
        assert.equal(F.getCardSetCode({ set: 'tef' }), 'TEF');
        assert.equal(F.getCardSetCode({ set_code: 'tef' }), 'TEF');
        assert.equal(F.getCardNumber({ number: '85' }), '85');
        assert.equal(F.getCardNumber({ set_number: '85' }), '85');
        assert.equal(F.getCardSetCode({ set: '???' }), '', 'der Platzhalter faellt auch hier weg');
    });
});

describe('Zeichensatzreparatur — fixCardNameEncoding / healCurrentMetaCardRows', () => {
    it('repariert die vier bekannten Fehlfolgen', () => {
        assert.equal(F.fixCardNameEncoding('PokÃ©mon Center'), 'Pokémon Center');
        assert.equal(F.fixCardNameEncoding('Câ€™s Orders'), "C's Orders");
        assert.equal(F.fixCardNameEncoding('Ã©tat'), 'état');
        assert.equal(F.fixCardNameEncoding('AÂ B'), 'A B');
    });

    it('ein sauberer Name bleibt unveraendert', () => {
        assert.equal(F.fixCardNameEncoding('Pokémon Center'), 'Pokémon Center');
        assert.equal(F.fixCardNameEncoding('N’s Zoroark ex'), 'N’s Zoroark ex');
        assert.equal(F.fixCardNameEncoding('日本のカード'), '日本のカード');
    });

    it('leere Eingaben kommen UNVERAENDERT zurueck — auch null', () => {
        // GEMESSEN, nicht vermutet: die Funktion gibt bei falschem Wert
        // die Eingabe zurueck, nicht ''. Wer ihr null gibt, bekommt null.
        assert.equal(F.fixCardNameEncoding(null), null);
        assert.equal(F.fixCardNameEncoding(undefined), undefined);
        assert.equal(F.fixCardNameEncoding(''), '');
    });

    it('healCurrentMetaCardRows repariert vier Spalten und laesst den Rest stehen', () => {
        const zeilen = [
            { card_name: 'PokÃ©mon Center', full_card_name: 'PokÃ©mon Center (SVI 1)',
              name: 'PokÃ©mon Center', name_en: 'PokÃ©mon Center', andere: 'PokÃ©mon' },
        ];
        const erg = F.healCurrentMetaCardRows(zeilen);
        assert.equal(erg[0].card_name, 'Pokémon Center');
        assert.equal(erg[0].full_card_name, 'Pokémon Center (SVI 1)');
        assert.equal(erg[0].name, 'Pokémon Center');
        assert.equal(erg[0].name_en, 'Pokémon Center');
        assert.equal(erg[0].andere, 'PokÃ©mon',
            'nicht genannte Spalten bleiben unangetastet');
        assert.equal(erg, zeilen, 'die Liste wird an Ort und Stelle geaendert');
    });

    it('kaputte Eintraege in der Liste stuerzen nicht ab', () => {
        assert.doesNotThrow(() => F.healCurrentMetaCardRows([null, 'Text', 42, undefined, {}]));
        assert.equal(F.healCurrentMetaCardRows('kein Array'), 'kein Array');
        assert.equal(F.healCurrentMetaCardRows(null), null);
    });
});

describe('mapSetCodeToMetaFormat — Set-Kuerzel zu Formatcode', () => {
    it('leere Eingaben ergeben leeren Text', () => {
        for (const leer of ['', null, undefined, '   ']) {
            assert.equal(F.mapSetCodeToMetaFormat(leer), '');
        }
    });

    it('die ausdrueckliche Tabelle schlaegt jede Regel', () => {
        assert.equal(F.mapSetCodeToMetaFormat('MEG'), 'SVI-MEG');
        assert.equal(F.mapSetCodeToMetaFormat('PAR'), 'BST-PAR');
        assert.equal(F.mapSetCodeToMetaFormat('TEF'), 'BRS-TEF');
        // WHT und BLK fuehren auf DENSELBEN Code — die beiden Sets sind
        // ein gemeinsames Format.
        assert.equal(F.mapSetCodeToMetaFormat('WHT'), F.mapSetCodeToMetaFormat('BLK'));
    });

    it('Klein- und Grossschreibung sowie Leerzeichen sind egal', () => {
        assert.equal(F.mapSetCodeToMetaFormat('meg'), 'SVI-MEG');
        assert.equal(F.mapSetCodeToMetaFormat('  Meg  '), 'SVI-MEG');
    });

    it('ein bereits zusammengesetzter Code bleibt stehen, ausser er ist ueberholt', () => {
        assert.equal(F.mapSetCodeToMetaFormat('TEF-CRI'), 'TEF-CRI');
        assert.equal(F.mapSetCodeToMetaFormat('SVI-POR'), 'TEF-POR',
            'der alte Code wird auf den heutigen umgeschrieben');
    });

    it('ein unbekanntes, aber legales Set bekommt den Rotationspraefix', () => {
        // CRI steht in der gesetzten Reihenfolge ueber TEF (dem
        // aeltesten legalen Set) und bekommt deshalb TEF- davor. Genau
        // das beschreibt der Kommentar "MAINTAIN-ME-ON-ROTATION".
        assert.equal(F.mapSetCodeToMetaFormat('CRI'), 'TEF-CRI');
    });

    it('ein Set unterhalb der Rotation bleibt unveraendert', () => {
        assert.equal(F.mapSetCodeToMetaFormat('XY'), 'XY');
        assert.equal(F.mapSetCodeToMetaFormat('ZZZ'), 'ZZZ',
            'ein voellig unbekanntes Kuerzel wird durchgereicht, nicht verworfen');
    });
});

describe('normalizeTournamentFormatLabel — Turnierbeschriftung zu Formatcode', () => {
    it('ohne Beschriftung entscheidet das Rueckfall-Set', () => {
        assert.equal(F.normalizeTournamentFormatLabel('', 'MEG'), 'SVI-MEG');
        assert.equal(F.normalizeTournamentFormatLabel(null, 'MEG'), 'SVI-MEG');
        assert.equal(F.normalizeTournamentFormatLabel('', ''), '');
    });

    it('"Meta Live" und "Meta Play!" treffen das neueste bekannte Format', () => {
        // Und zwar unabhaengig von der Schreibung — der Kommentar im
        // Quelltext nennt genau diesen Fall.
        const neuestes = F.normalizeTournamentFormatLabel('Meta Live', '');
        assert.equal(F.normalizeTournamentFormatLabel('META LIVE', ''), neuestes);
        assert.equal(F.normalizeTournamentFormatLabel('meta live', ''), neuestes);
        assert.equal(F.normalizeTournamentFormatLabel('Meta Play!', ''), neuestes);
        assert.notEqual(neuestes, '', 'es muss ueberhaupt ein Format herauskommen');
    });

    it('die ausgeschriebenen Setnamen werden aufgeloest', () => {
        assert.equal(F.normalizeTournamentFormatLabel('scarlet & violet - mega evolution', ''), 'SVI-MEG');
        assert.equal(F.normalizeTournamentFormatLabel('SCARLET & VIOLET - JOURNEY TOGETHER', ''), 'SVI-JTG');
    });

    it('ein Zusatz hinter dem Setnamen stoert nicht', () => {
        // Die Turnierdateien schreiben "… - Journey Together Regional".
        assert.equal(
            F.normalizeTournamentFormatLabel('Scarlet & Violet - Journey Together Regional', ''),
            'SVI-JTG'
        );
    });

    it('ein fertiger Formatcode wird durchgelassen', () => {
        assert.equal(F.normalizeTournamentFormatLabel('SVI-ASC', ''), 'SVI-ASC');
    });

    it('eine unbekannte Beschriftung faellt auf das Set zurueck und warnt einmal', () => {
        const gesehen = [];
        const echt = console.warn;
        console.warn = (...a) => gesehen.push(a.join(' '));
        try {
            assert.equal(F.normalizeTournamentFormatLabel('Voellig neues Format', 'MEG'), 'SVI-MEG');
            assert.equal(F.normalizeTournamentFormatLabel('Voellig neues Format', 'MEG'), 'SVI-MEG');
        } finally {
            console.warn = echt;
        }
        assert.equal(gesehen.length, 1,
            'zweimal dieselbe Beschriftung darf nur eine Warnung geben');
        assert.match(gesehen[0], /unmapped tournament format/);
    });
});

describe('sanitizeTournamentArchetypeName — Preisreste abschneiden', () => {
    it('der angehaengte Preis faellt weg', () => {
        // Der Scraper zieht die Preisspalte manchmal in den Namen.
        assert.equal(F.sanitizeTournamentArchetypeName('Dragapult ex 12,50$14,20€ '), 'Dragapult ex');
        assert.equal(F.sanitizeTournamentArchetypeName('Gardevoir ex 9.00$8.00€'), 'Gardevoir ex');
    });

    it('geschuetzte Leerzeichen am Ende fallen ebenfalls weg', () => {
        assert.equal(F.sanitizeTournamentArchetypeName('Gardevoir ex  '), 'Gardevoir ex');
    });

    it('ein sauberer Name bleibt unveraendert, leere Eingaben werden leer', () => {
        assert.equal(F.sanitizeTournamentArchetypeName("Rocket's Mewtwo ex"), "Rocket's Mewtwo ex");
        for (const leer of ['', null, undefined, '   ']) {
            assert.equal(F.sanitizeTournamentArchetypeName(leer), '');
        }
    });

    it('ein Preis MITTEN im Namen bleibt stehen — nur das Ende wird geschnitten', () => {
        assert.equal(
            F.sanitizeTournamentArchetypeName('Deck 1,00$2,00€ Rest'),
            'Deck 1,00$2,00€ Rest'
        );
    });
});

describe('parseArchetypeSelection — Einzelauswahl und Gruppe', () => {
    it('eine einfache Auswahl bleibt eine einelementige Liste', () => {
        assert.deepEqual(F.parseArchetypeSelection('Dragapult ex'), {
            raw: 'Dragapult ex', isGroup: false,
            targetArchetypes: ['Dragapult ex'], displayArchetypeName: 'Dragapult ex',
        });
    });

    it('GROUP: teilt am senkrechten Strich und beschriftet die Sammlung', () => {
        const erg = F.parseArchetypeSelection('GROUP:Dragapult ex|Dragapult Dusknoir');
        assert.equal(erg.isGroup, true);
        assert.deepEqual(erg.targetArchetypes, ['Dragapult ex', 'Dragapult Dusknoir']);
        assert.equal(erg.displayArchetypeName, 'Dragapult (All Variants)');
    });

    it('leere Teile einer Gruppe fallen heraus', () => {
        const erg = F.parseArchetypeSelection('GROUP:A||B|  |C');
        assert.deepEqual(erg.targetArchetypes, ['A', 'B', 'C']);
    });

    it('leere Eingaben ergeben eine wohlgeformte Antwort', () => {
        const erg = F.parseArchetypeSelection(null);
        assert.equal(erg.raw, '');
        assert.equal(erg.isGroup, false);
        assert.deepEqual(erg.targetArchetypes, ['']);
    });

    it('eine leere Gruppe faellt auf die Beschriftung "Group" zurueck', () => {
        assert.equal(F.parseArchetypeSelection('GROUP:').displayArchetypeName, 'Group (All Variants)');
    });
});

describe('filterCardsArray — die Kartensuche', () => {
    const karten = [
        { name_en: 'Pikachu', name_de: 'Pikachu', set: 'SVI', number: '25', pokedex_number: '25' },
        { name_en: 'Iono', name_de: 'Nemila', set: 'PAL', number: '185' },
        { name_en: 'Meowth', set: 'MEG', number: '52', pokedex_number: '52' },
    ];

    it('ein leerer Suchbegriff gibt alles zurueck', () => {
        assert.equal(F.filterCardsArray(karten, '').length, 3);
        assert.equal(F.filterCardsArray(karten, '   ').length, 3);
        assert.equal(F.filterCardsArray(karten, null).length, 3);
    });

    it('eine fehlende Liste ergibt ein leeres Array', () => {
        assert.deepEqual(F.filterCardsArray(null, 'pika'), []);
        assert.deepEqual(F.filterCardsArray(undefined, 'pika'), []);
        assert.deepEqual(F.filterCardsArray('kein Array', 'pika'), []);
    });

    it('kaputte Eintraege werden uebersprungen statt zu werfen', () => {
        const erg = F.filterCardsArray([null, 'Text', 42, { name_en: 'Iono' }], 'iono');
        assert.deepEqual(erg.map(c => c.name_en), ['Iono']);
    });

    it('sucht in englischem und deutschem Namen', () => {
        assert.deepEqual(F.filterCardsArray(karten, 'pika').map(c => c.name_en), ['Pikachu']);
        assert.deepEqual(F.filterCardsArray(karten, 'nemila').map(c => c.name_en), ['Iono']);
        assert.deepEqual(F.filterCardsArray(karten, 'IONO').map(c => c.name_en), ['Iono'],
            'die Suche ist unabhaengig von der Schreibung');
    });

    it('sucht nach Set und Nummer mit und ohne Leerzeichen', () => {
        assert.deepEqual(F.filterCardsArray(karten, 'svi 25').map(c => c.name_en), ['Pikachu']);
        assert.deepEqual(F.filterCardsArray(karten, 'pal185').map(c => c.name_en), ['Iono']);
    });

    it('eine reine Zahl trifft die Pokedex-Nummer exakt', () => {
        // Befund N (30.08.2026): ohne diesen Zweig fand die Suche nach
        // "25" kein einziges Pikachu.
        assert.deepEqual(F.filterCardsArray(karten, '52').map(c => c.name_en), ['Meowth']);
    });

    it('ein Begriff ohne Treffer ergibt eine leere Liste', () => {
        assert.deepEqual(F.filterCardsArray(karten, 'Charizard'), []);
    });
});

describe('sortCardsPTCG — die offizielle Decklistenordnung', () => {
    const deck = () => [
        { type: 'Item', name_en: 'Ultra Ball', set: 'SVI', number: '196' },
        { type: 'Basic Energy', name_en: 'Fire Energy', set: 'SVE', number: '18' },
        { type: 'Pokémon', name_en: 'Charizard', pokedex_number: 6, set: 'OBF', number: '125' },
        { type: 'Pokémon Tool', name_en: 'Bravery Charm', set: 'PAL', number: '173' },
        { type: 'Supporter', name_en: 'Boss’s Orders', set: 'PAL', number: '172' },
        { type: 'Pokémon', name_en: 'Bulbasaur', pokedex_number: 1, set: 'SVI', number: '1' },
        { type: 'Stadium', name_en: 'Artazon', set: 'PAL', number: '171' },
        { type: 'Special Energy', name_en: 'Jet Energy', set: 'PAL', number: '190' },
    ];

    it('die sieben Rubriken kommen in der offiziellen Reihenfolge', () => {
        const sortiert = F.sortCardsPTCG(deck()).map(c => c.type);
        assert.deepEqual(sortiert, [
            'Pokémon', 'Pokémon', 'Supporter', 'Item', 'Pokémon Tool',
            'Stadium', 'Special Energy', 'Basic Energy',
        ]);
    });

    it('"Pokémon Tool" wird als Werkzeug einsortiert, NICHT als Pokemon', () => {
        // Die Falle: "pokémon tool".includes("pokémon") ist wahr. Nur
        // weil der Werkzeug-Zweig VOR dem Pokemon-Zweig steht, landet
        // Bravery Charm hinter den Items statt vor Charizard. Genau
        // dieser Fehler steht als eigener Commit in der Geschichte
        // ("sortCardsPTCG - Pokemon Tool wurde als Pokemon sortiert").
        const sortiert = F.sortCardsPTCG(deck()).map(c => c.name_en);
        assert.ok(sortiert.indexOf('Bravery Charm') > sortiert.indexOf('Ultra Ball'),
            `Bravery Charm muss hinter Ultra Ball stehen, bekam ${JSON.stringify(sortiert)}`);
        assert.ok(sortiert.indexOf('Bravery Charm') > sortiert.indexOf('Charizard'));
    });

    it('Pokemon werden nach Pokedex-Nummer geordnet, nicht nach Namen', () => {
        // Bulbasaur (1) vor Charizard (6) — alphabetisch waere es
        // dieselbe Reihenfolge, deshalb ein Gegenbeispiel:
        const zwei = F.sortCardsPTCG([
            { type: 'Pokémon', name_en: 'Applin', pokedex_number: 840, set: 'TWM', number: '17' },
            { type: 'Pokémon', name_en: 'Zorua', pokedex_number: 570, set: 'SFA', number: '96' },
        ]).map(c => c.name_en);
        assert.deepEqual(zwei, ['Zorua', 'Applin'],
            '570 vor 840, obwohl "Applin" alphabetisch vorne stuende');
    });

    it('Pokemon ohne Pokedex-Nummer wandern ans Ende ihrer Rubrik', () => {
        const erg = F.sortCardsPTCG([
            { type: 'Pokémon', name_en: 'Unbekannt', set: 'AAA', number: '1' },
            { type: 'Pokémon', name_en: 'Charizard', pokedex_number: 6, set: 'OBF', number: '125' },
        ]).map(c => c.name_en);
        assert.deepEqual(erg, ['Charizard', 'Unbekannt']);
    });

    it('Trainer und Energien werden innerhalb ihrer Rubrik nach Namen geordnet', () => {
        const erg = F.sortCardsPTCG([
            { type: 'Item', name_en: 'Ultra Ball', set: 'SVI', number: '196' },
            { type: 'Item', name_en: 'Buddy-Buddy Poffin', set: 'TEF', number: '144' },
            { type: 'Item', name_en: 'Nest Ball', set: 'SVI', number: '181' },
        ]).map(c => c.name_en);
        assert.deepEqual(erg, ['Buddy-Buddy Poffin', 'Nest Ball', 'Ultra Ball']);
    });

    it('bei gleichem Namen entscheiden Set und dann die Kartennummer', () => {
        const erg = F.sortCardsPTCG([
            { type: 'Item', name_en: 'Ultra Ball', set: 'SVI', number: '196' },
            { type: 'Item', name_en: 'Ultra Ball', set: 'BRS', number: '186' },
            { type: 'Item', name_en: 'Ultra Ball', set: 'SVI', number: '150' },
        ]).map(c => `${c.set}-${c.number}`);
        assert.deepEqual(erg, ['BRS-186', 'SVI-150', 'SVI-196']);
    });

    it('eine Karte ohne Typ landet hinter allen sieben Rubriken', () => {
        const erg = F.sortCardsPTCG([
            { name_en: 'Ohne Typ', set: 'AAA', number: '1' },
            { type: 'Basic Energy', name_en: 'Fire Energy', set: 'SVE', number: '18' },
        ]).map(c => c.name_en);
        assert.deepEqual(erg, ['Fire Energy', 'Ohne Typ']);
    });
});

describe('normalizeCurrentMetaFallbackRows — der Notdatensatz', () => {
    it('eine Nicht-Liste ergibt ein leeres Array', () => {
        assert.deepEqual(F.normalizeCurrentMetaFallbackRows(null), []);
        assert.deepEqual(F.normalizeCurrentMetaFallbackRows('x'), []);
        assert.deepEqual(F.normalizeCurrentMetaFallbackRows({}), []);
    });

    it('Zeilen ohne Kartenname oder Archetyp fallen heraus', () => {
        const erg = F.normalizeCurrentMetaFallbackRows([
            null, { card_name: '', archetype: 'A' }, { card_name: 'X', archetype: '' },
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex', format: 'MEG' },
        ]);
        assert.equal(erg.length, 1);
        assert.equal(erg[0].card_name, 'Ultra Ball');
    });

    it('Archetyp und Format werden normalisiert, meta wird gesetzt', () => {
        const erg = F.normalizeCurrentMetaFallbackRows([
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex 12,50$14,20€ ', format: 'MEG' },
        ]);
        assert.equal(erg[0].archetype, 'Dragapult ex');
        assert.equal(erg[0].format, 'SVI-MEG');
        assert.equal(erg[0].meta, 'Meta Play!');
    });

    it('zusammengefallene Archetypen korrigieren den Nenner nach OBEN', () => {
        // Zwei Rohnamen desselben Turniers werden zu einem Archetyp. Die
        // Datei nennt fuer jede Zeile 1 Deck; richtig sind 2.
        const erg = F.normalizeCurrentMetaFallbackRows([
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex 12,50$14,20€', tournament_id: 't1',
              format: 'MEG', total_decks_in_archetype: '1', total_count: '40' },
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex 9,00$8,00€', tournament_id: 't1',
              format: 'MEG', total_decks_in_archetype: '1', total_count: '40' },
        ]);
        assert.equal(erg[0].total_decks_in_archetype, '2');
        assert.equal(erg[1].total_decks_in_archetype, '2');
    });

    it('ein bereits groesserer Nenner aus der Datei bleibt stehen', () => {
        const erg = F.normalizeCurrentMetaFallbackRows([
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex', tournament_id: 't1',
              format: 'MEG', total_decks_in_archetype: '30', total_count: '90' },
        ]);
        assert.equal(erg[0].total_decks_in_archetype, '30');
        assert.equal(erg[0].average_count_overall, '3.00', '90/30, auf zwei Stellen');
    });

    it('deck_count wird aus deck_inclusion_count nachgetragen', () => {
        const erg = F.normalizeCurrentMetaFallbackRows([
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex', format: 'MEG',
              deck_inclusion_count: '12' },
        ]);
        assert.equal(erg[0].deck_count, '12');
    });

    it('die Eingabezeilen selbst werden nicht veraendert', () => {
        const eingabe = [{ card_name: 'Ultra Ball', archetype: 'Dragapult ex 1,00$2,00€', format: 'MEG' }];
        F.normalizeCurrentMetaFallbackRows(eingabe);
        assert.equal(eingabe[0].archetype, 'Dragapult ex 1,00$2,00€',
            'die Funktion kopiert die Zeile, sie schreibt nicht in die Quelle');
    });

    it('das Set-Kuerzel dient als Rueckfall, wenn kein Format dasteht', () => {
        const erg = F.normalizeCurrentMetaFallbackRows([
            { card_name: 'Ultra Ball', archetype: 'Dragapult ex', set_code: 'MEG' },
        ]);
        assert.equal(erg[0].format, 'SVI-MEG');
    });
});
