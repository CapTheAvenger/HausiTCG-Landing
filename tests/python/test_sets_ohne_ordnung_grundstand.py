"""Sets ohne Ordnungszahl: melden, was NEU ist — nicht den Altbestand.

WARUM ES DIESE DATEI GIBT
-------------------------
Der Wochenlauf meldete bei jedem Durchgang dieselbe Warnung:

    239 set(s) have a release date but no order and are too old to
    append safely: 20TH, BGS, BKB, BKC, BKR, BKV, BKW, BKZ, BTV, ...

Dieselben 239 Sets, Lauf fuer Lauf, seit Wochen unveraendert. Das ist
genau die Sorte Meldung, an die man sich gewoehnt — und dann uebersieht
man die echte. Die Regel des Projekts dazu steht in CLAUDE.md:

    "Absolute quality thresholds produce noise here. Detect *change*
     against a baseline instead."

Ein NEUES Set ohne Ordnungszahl waere dagegen ein ernster Befund: seine
Karten landen im Legacy-Block, und der Deckbauer findet sie nicht. Genau
so sind am 03.05.2026 die POR/M4-Karten verschwunden.

Diese Datei haelt fest, dass der Altbestand schweigt und ein Neuzugang
meldet.
"""

import json
import os
import sys
import tempfile
import unittest

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(WURZEL, 'backend'))

from core import update_sets  # noqa: E402


class GrundstandTest(unittest.TestCase):

    def setUp(self):
        self._alt = update_sets.SETS_OHNE_ORDNUNG_GRUNDSTAND
        self._ordner = tempfile.mkdtemp()
        update_sets.SETS_OHNE_ORDNUNG_GRUNDSTAND = os.path.join(
            self._ordner, 'data', '_sets_ohne_ordnung.json')

    def tearDown(self):
        update_sets.SETS_OHNE_ORDNUNG_GRUNDSTAND = self._alt

    def _grundstand(self):
        with open(update_sets.SETS_OHNE_ORDNUNG_GRUNDSTAND, encoding='utf-8') as fh:
            return json.load(fh)

    def test_erster_lauf_legt_an_und_meldet_nichts(self):
        neu = update_sets.melde_sets_ohne_ordnung(['BKB', 'BKC', 'BW2'])
        self.assertEqual(neu, [],
                         'Der erste Lauf meldet den ganzen Altbestand — das '
                         'waeren 239 Warnungen auf einen Schlag.')
        self.assertEqual(self._grundstand()['codes'], ['BKB', 'BKC', 'BW2'])

    def test_altbestand_schweigt(self):
        update_sets.melde_sets_ohne_ordnung(['BKB', 'BKC', 'BW2'])
        neu = update_sets.melde_sets_ohne_ordnung(['BW2', 'BKC', 'BKB'])
        self.assertEqual(neu, [],
                         'Derselbe Bestand meldet sich erneut — genau die '
                         'Gewoehnung, die die Warnung wertlos macht.')

    def test_ein_neues_set_meldet_sich(self):
        update_sets.melde_sets_ohne_ordnung(['BKB', 'BKC'])
        neu = update_sets.melde_sets_ohne_ordnung(['BKB', 'BKC', 'MEZ'])
        self.assertEqual(neu, ['MEZ'],
                         'Ein neues Set ohne Ordnungszahl bleibt stumm — seine '
                         'Karten landen im Legacy-Block und der Deckbauer '
                         'findet sie nicht (so verschwanden POR/M4 am 03.05.2026).')

    def test_gross_und_kleinschreibung_zaehlt_nicht(self):
        update_sets.melde_sets_ohne_ordnung(['BKB'])
        self.assertEqual(update_sets.melde_sets_ohne_ordnung(['bkb']), [],
                         'Ein Code in anderer Schreibweise gilt als neu — das '
                         'meldet dieselbe Sache ein zweites Mal.')

    def test_leere_liste_ist_kein_fehler(self):
        update_sets.melde_sets_ohne_ordnung(['BKB'])
        self.assertEqual(update_sets.melde_sets_ohne_ordnung([]), [])

    def test_verschwundenes_set_meldet_sich_nicht_als_neu(self):
        # Ein Set aus dem Altbestand hat eine Ordnungszahl bekommen.
        # Das ist ein Fortschritt, keine Warnung.
        update_sets.melde_sets_ohne_ordnung(['BKB', 'BKC'])
        self.assertEqual(update_sets.melde_sets_ohne_ordnung(['BKB']), [])


if __name__ == '__main__':
    unittest.main()
