/**
 * DIE FUNKTION `fuzzyArchetypeMatch` GIBT ES NICHT MEHR.
 *
 * Der Dateiname stammt aus einer Testrunde vom 31.03.2026; im heutigen
 * Arbeitsbaum kommt der Bezeichner in js/ kein einziges Mal vor
 * (geprueft am 07.09.2026 ueber das ganze Verzeichnis). Die Aufgabe —
 * zwei Quellen mit leicht verschiedenen Deck-Namen aufeinander abbilden
 * — wird heute von DREI benannten Funktionen in ZWEI Modulen erledigt.
 * Diese Datei prueft sie, und der Kopf sagt, worauf sie sich bezieht:
 *
 *   js/app-meta-cards.js:7    normalizeArchetypeForMatch(name)
 *       Der gemeinsame Schluessel. Streicht Apostroph-Genitiv, das
 *       freistehende "ex" und die angehaengten Set-Kuerzel.
 *   js/app-meta-cards.js:35   buildFuzzyArchetypeMap(...)
 *       Baut daraus die Zuordnung "Name aus der Analyse" -> "Name aus
 *       der Vergleichsdatei" fuer die Top 10.
 *   js/app-tier-meta.js:692   fuzzyArchetypeLookup(name, daten)
 *       Fuenfstufige Suche nach den Karten eines Archetyps, mit
 *       eigenem Normalisierer _normArchName (js/app-tier-meta.js:596).
 *
 * WARUM DAS WICHTIG IST
 * --------------------
 * Trifft die Zuordnung daneben, zeigt eine Kachel die Karten eines
 * ANDEREN Decks — falsch, aber vollkommen unauffaellig. Zu grosszuegig
 * ist deshalb genauso schaedlich wie zu streng, und beide Richtungen
 * stehen hier als Zusicherung.
 *
 * KEINE LIVEDATEN, KEIN jsdom: alle Namen setzt der Test.
 */

const { describe, it, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..', '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');
const KARTEN = lies('js/app-meta-cards.js');
const TIER = lies('js/app-tier-meta.js');

function funktion(name, quelle) {
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

// eslint-disable-next-line no-new-func
const bruecke = new Function('window',
    funktion('normalizeArchetypeForMatch', KARTEN) + '\n'
    + funktion('buildFuzzyArchetypeMap', KARTEN)
    + '\nreturn { normalizeArchetypeForMatch, buildFuzzyArchetypeMap };')({});

const fensterAttrappe = {};
// eslint-disable-next-line no-new-func
const suche = new Function('window',
    funktion('_normArchName', TIER) + '\n'
    + funktion('fuzzyArchetypeLookup', TIER)
    + '\nreturn { _normArchName, fuzzyArchetypeLookup };')(fensterAttrappe);

const norm = bruecke.normalizeArchetypeForMatch;
const baueKarte = bruecke.buildFuzzyArchetypeMap;
const normTier = suche._normArchName;
const nachschlagen = suche.fuzzyArchetypeLookup;

describe('die Funktion aus dem Dateinamen ist wirklich weg', () => {
    it('kein Modul unter js/ nennt fuzzyArchetypeMatch', () => {
        const treffer = fs.readdirSync(path.join(WURZEL, 'js'))
            .filter(f => f.endsWith('.js'))
            .filter(f => lies('js/' + f).includes('fuzzyArchetypeMatch'));
        assert.deepEqual(treffer, [],
            'gibt es sie wieder, gehoert dieser Kopfkommentar korrigiert');
    });

    it('die drei Nachfolger sind vorhanden und aufrufbar', () => {
        assert.equal(typeof norm, 'function');
        assert.equal(typeof baueKarte, 'function');
        assert.equal(typeof nachschlagen, 'function');
    });
});

describe('normalizeArchetypeForMatch — der gemeinsame Schluessel', () => {
    it('leere und fehlende Eingaben ergeben eine leere Zeichenkette', () => {
        for (const leer of ['', null, undefined, 0, false, NaN]) {
            assert.equal(norm(leer), '', `${JSON.stringify(leer)} → ${JSON.stringify(norm(leer))}`);
        }
    });

    it('der Genitiv faellt mit und ohne Apostroph gleich aus', () => {
        // Die Scraper schreiben denselben Namen unterschiedlich: mit
        // geradem, mit typografischem und ganz ohne Apostroph.
        assert.equal(norm("Rocket's Mewtwo ex"), 'rocket mewtwo');
        assert.equal(norm('Rocket’s Mewtwo ex'), 'rocket mewtwo');
        assert.equal(norm('Rockets Mewtwo'), 'rocket mewtwo');
        assert.equal(norm("Rocket's Mewtwo ex"), norm('Rockets Mewtwo'));
    });

    it('das freistehende "ex" verschwindet, ein "ex" im Wort nicht', () => {
        assert.equal(norm('Gardevoir ex'), 'gardevoir');
        assert.equal(norm('Gholdengo EX'), 'gholdengo');
        // "Excadrill" darf nicht zu "cadrill" werden — \b schuetzt davor.
        assert.equal(norm('Mega Excadrill'), 'mega excadrill');
    });

    it('angehaengte Set-Kuerzel fallen weg', () => {
        // Genau der Fall, fuer den es die Funktion gibt:
        // current_meta_card_data.csv haengt Kuerzel an,
        // limitless_online_decks.csv nicht.
        assert.equal(norm('Crustle Dri'), 'crustle');
        assert.equal(norm('Dragapult ex TEF'), 'dragapult');
        assert.equal(norm('Mega Gardevoir ex MEG'), 'mega gardevoir');
        assert.equal(norm('Crustle Dri'), norm('Crustle'));
    });

    it('mehrfache Leerzeichen werden zusammengezogen und Raender geschnitten', () => {
        assert.equal(norm('  Dragapult   ex   TEF  '), 'dragapult');
        assert.equal(norm('Raging Bolt Ogerpon'), 'raging bolt ogerpon');
    });

    it('Unicode-Namen bleiben erhalten, nur die Schreibung wird klein', () => {
        assert.equal(norm('Pokémon Café'), 'pokémon café');
        assert.equal(norm('Nの Zoroark'), 'nの zoroark');
    });
});

describe('buildFuzzyArchetypeMap — die Zuordnung der Top 10', () => {
    const top10 = [
        { name: 'Dragapult Dusknoir' },
        { name: "Rocket's Mewtwo ex" },
        { name: 'Gardevoir ex' },
    ];
    const namen = new Set(top10.map(a => a.name.toLowerCase()));

    it('ein exakter Name bildet auf sich selbst ab', () => {
        const karte = baueKarte(namen, top10, ['Dragapult Dusknoir']);
        assert.equal(karte.get('dragapult dusknoir'), 'dragapult dusknoir');
    });

    it('Set-Kuerzel und Genitiv-Schreibweise finden ihr Gegenstueck', () => {
        const karte = baueKarte(namen, top10, ['Dragapult Dusknoir Tef', 'Rockets Mewtwo', 'Gardevoir']);
        assert.equal(karte.get('dragapult dusknoir tef'), 'dragapult dusknoir');
        assert.equal(karte.get('rockets mewtwo'), "rocket's mewtwo ex");
        assert.equal(karte.get('gardevoir'), 'gardevoir ex');
    });

    it('ein Name ohne Gegenstueck kommt gar nicht erst in die Karte', () => {
        const karte = baueKarte(namen, top10, ['Iron Thorns Box']);
        assert.equal(karte.has('iron thorns box'), false);
        assert.equal(karte.size, 0);
    });

    it('EINE gemeinsame Silbe reicht NICHT — die kuerzere Seite muss ganz aufgehen', () => {
        // Der Kern der Strenge: "Dragapult Charizard" teilt ein Wort mit
        // "Dragapult Dusknoir", ist aber ein anderes Deck. Waere die
        // Bedingung `matchCount > 0` statt `matchCount === shorter.length`,
        // stuenden hier die Karten des falschen Decks — unauffaellig
        // falsch, genau die teure Sorte Fehler.
        const karte = baueKarte(namen, top10, ['Dragapult Charizard', 'Dusknoir Charizard']);
        assert.equal(karte.has('dragapult charizard'), false,
            'ein einziges gemeinsames Wort darf kein Deck umbenennen');
        assert.equal(karte.has('dusknoir charizard'), false);
    });

    it('die Regel ist bewusst einseitig: der laengere Name darf auf den kuerzeren', () => {
        // GEMESSEN, weil es der Punkt der Bedingung ist: geprueft wird
        // die KUERZERE Wortliste. "Gardevoir Munkidori Box" (drei
        // Woerter) enthaelt den ganzen Vergleichsnamen "Gardevoir" (ein
        // Wort nach der Normalisierung) und wird ihm zugeordnet — eine
        // Variantenschreibweise desselben Decks. Umgekehrt wird
        // "Gardevoir" NICHT einem laengeren Vergleichsnamen zugeordnet,
        // dessen uebrige Woerter fehlen.
        const karte = baueKarte(namen, top10, ['Gardevoir Munkidori Box']);
        assert.equal(karte.get('gardevoir munkidori box'), 'gardevoir ex');

        const langeSeite = [{ name: 'Gardevoir Munkidori Box' }];
        const gegen = baueKarte(new Set(['gardevoir munkidori box']), langeSeite, ['Charizard']);
        assert.equal(gegen.has('charizard'), false,
            'ein Name ohne gemeinsames Wort bleibt draussen');
    });

    it('bei mehreren Kandidaten gewinnt der mit der besseren Deckung', () => {
        const kandidaten = [{ name: 'Dragapult' }, { name: 'Dragapult Dusknoir' }];
        const menge = new Set(kandidaten.map(a => a.name.toLowerCase()));
        const karte = baueKarte(menge, kandidaten, ['Dragapult Dusknoir Tef']);
        // "dragapult dusknoir" deckt 2 von 2 Woertern (100), "dragapult"
        // nur 1 von 2 (50).
        assert.equal(karte.get('dragapult dusknoir tef'), 'dragapult dusknoir');
    });

    it('leere Eingaben ergeben eine leere Karte statt eines Wurfs', () => {
        assert.equal(baueKarte(new Set(), [], []).size, 0);
        assert.equal(baueKarte(new Set(), [], ['Irgendwas']).size, 0);
    });
});

describe('fuzzyArchetypeLookup — die fuenfstufige Suche', () => {
    const daten = {
        'Rocket Mewtwo Ex': [{ card_name: 'Rocket’s Mewtwo ex' }],
        'Dragapult Dusknoir': [{ card_name: 'Dragapult ex' }],
        'Gardevoir ex': [{ card_name: 'Kirlia' }],
    };
    // Stufe 2 bis 5 lesen window._cardArchetypeNormalizedMap. Die
    // Auslieferung baut ihn beim Laden der Kartendaten; hier wird er
    // mit demselben Normalisierer gesetzt, den der Code selbst benutzt.
    fensterAttrappe._cardArchetypeNormalizedMap = Object.fromEntries(
        Object.keys(daten).map(k => [normTier(k), k])
    );

    it('leere Eingaben ergeben ein leeres Array, nie null', () => {
        for (const leer of [null, undefined, '', 0]) {
            assert.deepEqual(nachschlagen(leer, daten), []);
        }
        assert.deepEqual(nachschlagen('Gardevoir ex', null), []);
        assert.deepEqual(nachschlagen('Gardevoir ex', undefined), []);
    });

    it('Stufe 1: der exakte Schluessel wird unveraendert durchgereicht', () => {
        assert.equal(nachschlagen('Dragapult Dusknoir', daten), daten['Dragapult Dusknoir']);
    });

    it('Stufe 2: der Apostroph-Genitiv findet den Schluessel ohne ihn', () => {
        assert.deepEqual(nachschlagen("Rocket's Mewtwo Ex", daten), daten['Rocket Mewtwo Ex']);
    });

    it('Stufe 3: mit und ohne "ex" fuehren zum selben Eintrag', () => {
        assert.deepEqual(nachschlagen('Gardevoir', daten), daten['Gardevoir ex']);
        assert.deepEqual(nachschlagen('Gardevoir ex', daten), daten['Gardevoir ex']);
    });

    it('ein voellig fremder Name ergibt ein leeres Array, keine falschen Karten', () => {
        assert.deepEqual(nachschlagen('Zoroark', daten), []);
        assert.deepEqual(nachschlagen('Blissey Box', daten), []);
    });

    it('_normArchName macht aus Bindestrichen Leerzeichen', () => {
        // "Raging-Bolt Ogerpon" und "Raging Bolt Ogerpon" sind dasselbe
        // Deck; die Quellen schreiben es unterschiedlich.
        assert.equal(normTier('Raging-Bolt Ogerpon'), 'raging bolt ogerpon');
        assert.equal(normTier('Raging Bolt Ogerpon'), normTier('Raging-Bolt Ogerpon'));
        assert.equal(normTier('  Doppel   Leer  '), 'doppel leer');
        assert.equal(normTier(null), '');
    });
});

/* DER TYPOGRAFISCHE APOSTROPH — der Befund vom 07.09.2026 ist behoben.
 *
 * Hier stand bis eben eine uebersprungene Zusicherung mit der Begruendung,
 * die beiden Normalisierer behandelten U+2019 verschieden: js/app-meta-cards.js
 * kannte ihn, js/app-tier-meta.js trug in seiner Zeichenklasse zweimal
 * den geraden Apostroph U+0027 und sonst nur einen Gravis.
 *
 * Beide Module tragen jetzt dieselbe Zeichenklasse ['\u2018\u2019\u201b`\u00b4\u02bc].
 * NACHGEMESSEN am 07.09.2026 an _normArchName aus js/app-tier-meta.js:
 *
 *   normTier('N\u2019s Zoroark ex')   -> "n zoroark ex"
 *   normTier('Rocket\u2019s Mewtwo')  -> "rocket mewtwo"
 *   normTier("Rocket's Mewtwo")        -> "rocket mewtwo"   (identisch)
 *
 * Die Zusicherung laeuft jetzt mit. Sie ist gegenueber der
 * uebersprungenen Fassung geschaerft: sie prueft nicht mehr nur U+2019,
 * sondern JEDE Schreibweise aus der Zeichenklasse, und sie prueft, dass
 * alle dasselbe Ergebnis liefern wie der gerade Apostroph — denn genau
 * das ist der Zweck: eine Quelle in Typografie-Schreibweise darf die
 * Kartensuche im Reiter "Laufendes Meta" nicht ins Leere laufen lassen.
 *
 * Der freistehende "ex"-Zusatz faellt bei _normArchName NICHT weg
 * (anders als bei normalizeArchetypeForMatch) — das ist so gemessen und
 * steht hier als Ergebnis, nicht als Wunsch. */
describe('_normArchName kennt alle Apostroph-Schreibweisen', () => {
    const SCHREIBWEISEN = [
        ["gerade U+0027", "'"],
        ['typografisch U+2019', '\u2019'],
        ['typografisch links U+2018', '\u2018'],
        ['hochgestellt umgekehrt U+201B', '\u201b'],
        ['Gravis U+0060', '`'],
        ['Akut U+00B4', '\u00b4'],
        ['Modifikator-Apostroph U+02BC', '\u02bc'],
    ];

    it('der Genitiv faellt in jeder Schreibweise gleich weg', () => {
        for (const [name, zeichen] of SCHREIBWEISEN) {
            assert.equal(normTier(`Rocket${zeichen}s Mewtwo`), 'rocket mewtwo',
                `${name}: ${JSON.stringify(normTier(`Rocket${zeichen}s Mewtwo`))}`);
            assert.equal(normTier(`Rocket${zeichen}s Mewtwo`), normTier("Rocket's Mewtwo"),
                `${name} weicht vom geraden Apostroph ab`);
        }
    });

    it('der Fall aus dem alten Befund: N\u2019s Zoroark ex', () => {
        // Wortwoertlich die Eingabe, die vorher "n\u2019s zoroark ex" ergab.
        assert.equal(normTier('N\u2019s Zoroark ex'), 'n zoroark ex');
        assert.equal(normTier('N\u2019s Zoroark ex'), normTier("N's Zoroark ex"));
        // Kein U+2019 bleibt uebrig — die eigentliche Aussage.
        assert.ok(!/[\u2018\u2019\u201b`\u00b4\u02bc']/.test(normTier('N\u2019s Zoroark ex')),
            'es ist noch ein Apostroph drin: ' + JSON.stringify(normTier('N\u2019s Zoroark ex')));
    });

    it('die beiden Normalisierer stimmen beim Apostroph ueberein', () => {
        // Der Grund fuer den urspruenglichen Befund war die Abweichung
        // zwischen den Modulen, nicht ein einzelnes Zeichen.
        for (const [, zeichen] of SCHREIBWEISEN) {
            const t = normTier(`Rocket${zeichen}s Mewtwo ex`);
            const k = norm(`Rocket${zeichen}s Mewtwo ex`);
            assert.ok(!/[\u2018\u2019\u201b`\u00b4\u02bc']/.test(t), 'tier: ' + JSON.stringify(t));
            assert.ok(!/[\u2018\u2019\u201b`\u00b4\u02bc']/.test(k), 'karten: ' + JSON.stringify(k));
        }
        // Beide Module tragen dieselbe Zeichenklasse im Quelltext —
        // wortwoertlich so geschrieben, mit \u-Schreibweise, damit der
        // Unterschied zwischen U+0027 und U+2019 in der Datei SICHTBAR
        // ist. Genau seine Unsichtbarkeit war der urspruengliche Fehler.
        const klasse = "['\\u2018\\u2019\\u201B\\u0060\\u00B4\\u02BC]";
        assert.ok(TIER.includes(klasse), 'js/app-tier-meta.js traegt die Zeichenklasse nicht');
        assert.ok(KARTEN.includes(klasse), 'js/app-meta-cards.js traegt die Zeichenklasse nicht');
    });

    it('ein Apostroph, der KEIN Genitiv ist, bleibt unangetastet', () => {
        // \b s schuetzt: nur "…'s" faellt weg. Sonst wuerde aus einem
        // Namen mit Apostroph im Wortinneren stillschweigend ein anderer.
        assert.equal(normTier('Farfetch\u2019d'), normTier("Farfetch'd"));
    });
});
