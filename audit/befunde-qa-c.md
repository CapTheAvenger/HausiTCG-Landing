# Befunde QA-C — F15, F16, F17, F18, F19 (+ H3, H6, H13)

Prüfer: Agent QA-C · Datum: 2026-09-07 · Live-Seite `https://thedipidis.app`
Browser-Tab 1877068117 · nicht angemeldet · Datenraum „🌐 Global" (current-meta), Datenstand 6.9.2026 / past-meta 1.9.2026.

Alles unten wurde **live geklickt**. Wo eine Prüfung nicht möglich war, steht NICHT GEPRÜFT mit Grund.
Es wurde nichts gespeichert. Der im past-meta-Bauer vorgefundene 60-Karten-Entwurf wurde nach dem Test
Karte für Karte auf den Ausgangsstand zurückgesetzt (Ultra Ball 4 → 1, Zähler 63 → 60).

---

## Teil 1 — Prüftabelle

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| F15.1 | Abschnitt „Die meistgespielten Decks" | Reiter `current-meta` frisch geladen, `aria-expanded` aller sechs `.ds-sec-hd` gelesen | `true` — startet offen | OK |
| F15.2 | Abschnitt „Matchups" | wie F15.1 | `true` — startet offen | OK |
| F15.3 | Abschnitt „Meistgespielte Karten" | wie F15.1 | `true` — startet offen | OK |
| F15.4 | Abschnitt „Gegen welches Meta?" | wie F15.1 | `false` — startet zu | OK |
| F15.5 | Abschnitt „Tier-Liste" | wie F15.1 | `false` — startet zu | OK |
| F15.6 | Abschnitt „Meta-Performance" | wie F15.1 | `false` — startet zu | OK |
| F15.7 | Abschnittszustände (localStorage) | Abschnitt 1 zu + Abschnitt 5 auf → `ds_sections_v1` = `["heatmap","cards","tiers"]`; unbekannte id `quatsch-unbekannt-xyz` eingetragen; Seite neu geladen | Zustand exakt wiederhergestellt (false,true,true,false,true,false); unbekannte id stillschweigend ignoriert, kein Fehler in der Konsole | OK |
| F15.8 | „Ansicht zurücksetzen" | Knopf war im Standardzustand unsichtbar, erschien nach Abweichung; angeklickt | Alle sechs Abschnitte zurück auf true,true,true,false,false,false; `ds_sections_v1` = `["top","heatmap","cards"]`; Knopf verschwindet wieder | OK |
| F15.9–F15.14 | Rangliste „Meta-Performance": Spaltenköpfe, Sortierung, Rangneuzählung, Sichtbarkeitsgrenze | Voreinstellung geprüft (Listen absteigend, 3.138 → 330, 25 Zeilen). Alle 8 sortierbaren Köpfe je zweimal geklickt, danach **alle 139 tbody-Zeilen** auf Monotonie geprüft | Kein einziger Ordnungsverstoß in 16 Sortierläufen. Tausenderpunkt korrekt numerisch („3.138" vor „1"), Dezimalkomma korrekt („66,7 %" vor „60,0 %", „10,x" über „9,x"). `#` nach jeder Sortierung neu 1…25 durchgezählt, Sichtbarkeitsgrenze jedes Mal auf 25 zurück, Leerwerte „–" durchgängig am Ende (3 bei Listen, 5 bei Win Rate, 18 bei Antritte/Top 8/Top-8-Quote, 90 bei ggü. Schnitt). `#` selbst nicht klickbar (`cursor:auto`, Reihenfolge unverändert) | OK (Ausnahme siehe FEHLER-9) |
| F15.15 | „Alle n Decks zeigen" | Knopf „Alle 139 Decks zeigen" geklickt, dann erneut | 25 → 139 sichtbar, Beschriftung wechselt zu „Nur die Top 25 zeigen"; erneuter Klick → 25, Beschriftung zurück | OK |
| F15.16 | Fußnote nicht zugeordnete Turniernamen | Volltext von `#current-meta` (37.856 Zeichen) nach „nicht zugeordnet" durchsucht | Keine solche Fußnote vorhanden | NICHT VORHANDEN (siehe FEHLER-10) |
| F15.17 | Held-Kachel | Kachel #2 Mega Excadrill ausgelesen | „#2 · Mega Excadrill · 1 Variante · 7,3 % · WR 48,7 % · 3.004"; `title` an der Anteils-Plakette („Eine einzelne Variante") und an der WR-Plakette („Gewichtete durchschnittliche Win Rate über 3.004 Antritte") vorhanden und stimmig; Kachel #1 Dragapult trägt korrekt „Summe über 6 Varianten…" | OK |
| F15.18 | Klick/Enter/Leertaste auf Held-Kachel | Alle drei Wege je einzeln auf Mega Excadrill ausgelöst; Rückweg über Nav-Leiste und Browser-Zurück | Alle drei wechseln zu `current-analysis` mit vorausgewähltem „Mega Excadrill"; Rückweg über Nav-Leiste funktioniert; Browser-Zurück landet wieder auf current-meta | OK, aber siehe FEHLER-8 (Adresszeile) |
| F15.19–F15.22 | Tier-Abschnitte 1/2/3/Trending | Alle Mitglieder samt „Share online" ausgelesen | Einordnung folgt **nicht** den dokumentierten Anteilsschwellen | FEHLER-mittel (FEHLER-6) |
| F15.23 | Plakette „n Listen" / dünne Stichprobe | Nach `tier-listen-duenn` gesucht | Diese Markierung existiert in der Tier-Liste nicht; eine Dünn-Markierung gibt es nur in der Heatmap (`heatmap-zelle-duenn`, z. B. „54,5 % / 2") | NICHT VORHANDEN |
| F15.24 | Grundlagen-Zeile unter den Kacheln | Tier-Abschnitt Element für Element nach Text mit „Schwelle / Einordnung / ≥ / 8 % / Tier-Score" durchsucht | Keine erklärende Zeile vorhanden; nur die Kurzuntertitel „Beherrschen das Meta" / „Starke Herausforderer" / „Spielbare Optionen" | NICHT VORHANDEN (verstärkt FEHLER-6) |
| F15.25 | Deckauswahl (Gegen welches Meta?) | Auswahl Dragapult → Mega Excadrill | Ergebnisblock wechselt von 53,3 % auf 47,2 %, Beitragstabelle komplett neu | OK |
| F15.26 | Feldauswahl | „Das ganze Meta" → „Jedes Deck gleich oft" | Gewichte springen alle auf 5,0 %, Erwartungswert 47,2 % → 46,4 % | OK |
| F15.27 | Rundenzahl | Werte 1, 20, 25, 0 eingegeben | 1 → „0,5 Siege"; 20 → „9,4 Siege"; 25 wird auf 20 gedeckelt; 0 fällt auf 8 zurück (`min=1`, `max=20`) | OK |
| F15.28 | Ergebnisblock | Mega Excadrill / ganzes Meta / 8 Runden | „47,2 % · Unsicherheitsband 46,3–48,1 % · 3,8 Siege · Abdeckung 76 % · 20 Gegner-Decks · 10.361 Matches" — plausibel | OK |
| F15.29 | Feldnotiz + Fußnote | Beide Feldvarianten gelesen | „Das ganze Meta — gewichtet nach gemessenem Anteil." bzw. „Jedes Deck gleich oft — ignoriert den Anteil — zeigt die reine Kartenstärke."; Fußnote „Runden × Win Rate, kein Turniermodell" — beide inhaltlich korrekt | OK |
| F15.30 | Tabelle Gegner-Deck/…/trägt bei | Werte nachgerechnet, Kopf „Deine Win Rate" angeklickt | Nachrechnung Gewicht × (WR − 50 %) stimmt durchgehend: 7,6 % × 6,8 = +0,52 ✓; 5,6 % × 8,5 = +0,48 ✓; 1,7 % × (−2,1) = −0,04 ✓; Spiegelzeile Mega Excadrill 50,0 % → 0,00 ✓. Klick auf den Kopf ändert nichts (`cursor:auto`) — nicht sortierbar wie gefordert | OK |
| F15.31 | Statistikkarte „Archetype Overview" | Volltext durchsucht | Block existiert in `current-meta` nicht mehr | NICHT VORHANDEN |
| F15.32 | Statistikkarte Meta-Statistiken | Volltext durchsucht | Block existiert nicht mehr | NICHT VORHANDEN |
| F15.33 | Best/Worst-Matchup-Tabellen | Volltext durchsucht | Blöcke existieren nicht mehr; Mobilbreiten-Kürzel „WR" damit gegenstandslos | NICHT VORHANDEN |
| F15.34 | Vollständige Vergleichstabelle (Spalte „Rank") | Volltext durchsucht | Tabelle existiert nicht mehr | NICHT VORHANDEN |
| F15.35 | Deckname als Link (`jumpToCardAnalysis`) | Setzt F15.34 voraus | Auslöser nicht vorhanden | NICHT GEPRÜFT — Trägerelement fehlt |
| F15.36 | Top-100-Matchup-Block entfernt | Volltext nach „Top 100"/„Top-100" durchsucht | Kein Treffer — Block ist tatsächlich entfernt | OK |
| F15.37 | Matchup-Heatmap | `#matchupHeatmapContainer`: 10×10 = 100 Zellen, Stichproben nachgerechnet | Vollständig, farbcodiert, Gegenzellen konsistent: Dragapult↔Alakazam 62,2 % / 37,8 % (Summe 100,0), M=968 auf beiden Seiten; Major 57,9 / 42,1, M=110 | OK |
| F15.38 | Meistgespielte Karten | `div.top-cards-container` ausgelesen | 15 Karten, Rangfolge plausibel: #1 Night Stretcher 100,0 % / 62 Archetypen, #2 Boss's Orders 95,2 % / 59, #3 Ultra Ball 95,2 % / 59; Umschalter Top 15 / Top 30 vorhanden | OK |
| F16.1 | Hilfeknopf past-meta | `.tab-help-btn` geklickt | `#helpModal` öffnet mit past-meta-eigenem Inhalt („🏆 Vergangenes Turnier-Meta … Format-Filter … Quellen-Filter") | OK (Schließen siehe FEHLER-7) |
| F16.2 | Datenstand-Chip | Kopfzeile gelesen | „🔄 Daten: 1.9.2026" — plausibel gegenüber current-meta (6.9.2026) | OK |
| F16.3 | Formatfilter | „SVI-MEG" gewählt, dann „-- Alle Formate --", dann „TEF-PBL" | Inhalt wechselt jedes Mal: Turnierliste 1 → 7 → 1 Einträge, Deckliste 29 → 70 → 29 Einträge | OK, aber siehe FEHLER-2 |
| F16.4 | Turnierfilter | Optionsliste je Format gelesen | Bei TEF-PBL nur „World Championships 2026 – Limitless"; bei SVI-MEG sieben Turniere (LAIC São Paulo, SE Buenos Aires, Regional Las Vegas/Gdańsk/Lille/Belo Horizonte/Milwaukee) — filtert entsprechend | OK |
| F16.5 | Deck-Archetyp-Auswahl | „Mega Excadrill" gewählt | Statistikblock erscheint vollständig | OK |
| F16.6 | Card Share Filter | Optionen all/90/70/50 vorhanden, „Alle Karten" voreingestellt | Vorhanden und vorbelegt | OK (Einzelklicks nicht durchgespielt) |
| F16.7–F16.9 | Deck-Statistik | Werte für Mega Excadrill gelesen | „Karten im Deck (verschiedene / Ø-Liste) 34 / 60", „World Championships 2026 – Limitless (8 Tag-2-Decklisten)", „TEF-PBL". Zahlen in sich stimmig (34 verschiedene Karten, Listen à 60). **Keine Definition daneben** — „34 / 60" ist ohne die Klammerüberschrift nicht selbsterklärend | OK mit Vorbehalt |
| F16.10 | „Turnier-Performance" | Block gelesen | „Turniere 1 · Spieler 32 · Record (W-L-T) 112-122-20 · Win % (kumuliert)" — passt zu 8 Tag-2-Listen aus einem Turnier | OK |
| F16.11 | „Erfolgreichste Decklist" | Block gelesen | „#37 Boming Wang · 8-3-1 · 69,4 % · World Championships 2026" — beste Platzierung des Archetyps; `title` erklärt die Win-%-Konvention (Sieg 3, Unentschieden 1) | OK |
| F16.12 | Card Overview: Suche | „Ultra" eingetippt, dann Feld geleert | Filtert korrekt (34 → 1). **Beim Leeren kommt die Übersicht nicht zurück** (24 statt 34) | FEHLER-mittel (FEHLER-3) |
| F16.13–F16.21 | 9 Typfilter | „Alle" und „Pokémon" einzeln geklickt, Klassen und Hintergrundfarben gemessen | Filterung selbst korrekt (24 → 11 bei Pokémon). **Die Hervorhebung bleibt auf „Alle" kleben** | FEHLER-mittel (FEHLER-4) |
| F16.22–F16.24 | Seltenheit min/max/all | „Niedrige Seltenheit" ist vorbelegt; „Max. Seltenheit" und „Alle Drucke" geklickt | Kartenbilder wechseln tatsächlich (POR_062 → POR_121 → POR_107). **Hervorhebung bleibt auf „Niedrige Seltenheit"** | FEHLER-mittel (FEHLER-4) |
| F16.25 | Copy | „Decklist kopieren" geklickt (Zwischenablage abgefangen) | Liefert „17 Metal Energy MEE 8 / 4 Beldum TEF 113 / 4 Metang TEF 114 / …" — brauchbare Liste | OK |
| F16.26 | Grid | „Listenansicht" geklickt, dann zurück | Beschriftung wechselt zu „Rasteransicht", `pastMetaDeckTableView` wird sichtbar; zurück funktioniert | OK |
| F16.27 | Consistency Generate | „Max Consistency" geklickt | Meldung „✓ Mega Excadrill: 60/60 Karten · Core @ 85 % · 8 Listen ausgewertet"; `pastMetaDeckGrid` mit 24 verschiedenen Karten gefüllt. **`pastMetaCardCount` steht danach auf „0 Karten"** | FEHLER-mittel (FEHLER-3) |
| F16.28 | Max Rarity | Knopf „↑ Max Seltenheit" vorhanden | vorhanden, nicht einzeln ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.29 | Test Draw | „Testhand" geklickt | `.draw-sim-hand` zeigt 7 gezogene Karten inline (kein Modal) | OK |
| F16.30 | TCG Showdown | „📋 TCG Showdown ↗" geklickt (`window.open` protokolliert) | Kopiert das aktuelle Deck („1 Hero's Cape TEF 152 / 4 Beldum TEF 113 / …") und öffnet `https://tcg-showdown.com/` mit `target="_blank"`; Meldung „Deck kopiert! TCG Showdown öffnet sich — zum Importieren einfügen." | OK |
| F16.31 | Clear | „Leeren" (Deckbau-Leiste, `clearDeck("pastMeta")`) geklickt | **Tab friert dauerhaft ein**, Deck bleibt unverändert | FEHLER-hoch (FEHLER-1) |
| F16.32 | Algorithmus-`<details>` | `<summary>` „i So baut der Consistency-Algorithmus" vorhanden, `open=false` | vorhanden; Aufklappen nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.27–32 Zusatz: Formattor | Suche nach Karten aus verschiedenen Sets bei Format TEF-PBL | „Prime Catcher PRE 119", „Legacy Energy TWM 167", „Master Ball TEF 153" werden angeboten — alle innerhalb TEF–PBL, daher kein Gegenbeweis. Ältere Sets (vor TEF) wurden nicht gezielt gesucht | NICHT GEPRÜFT — kein Beispiel außerhalb des Fensters gesucht |
| F16.33 | „Build vs …" | Knopf geklickt | `antiTechModal` öffnet mit Schritt 1 „Bauen gegen spezifische Decks" | OK |
| F16.34 | Tech-Slots leeren + Picker | Zweiter „Leeren"-Knopf (`clearTechSlots("pastMeta")`) identifiziert, Tech-Eingabe nicht befüllt | nicht durchgespielt | NICHT GEPRÜFT — nach FEHLER-1 wurde der Bereich nicht weiter belastet |
| F16.35 | Handstatistik | `pastMetaHandStats` nach „Testhand" gelesen | Element vorhanden, aber **leer** (kein Text) | FEHLER-niedrig (FEHLER-11) |
| F16.36 | Your Deck: Save | Knopf „Speichern ⓘ" vorhanden | **bewusst nicht angeklickt** (Live-Daten) | NICHT GEPRÜFT — Auftragsverbot |
| F16.37 | Your Deck: Why | Knopf „Warum?" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.38 | Your Deck: Compare | Knopf „Vergleichen" / „Mit Builder-Deck vergleichen" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.39 | Your Deck: Copy | Knopf „Deck kopieren" vorhanden | siehe F16.25 (gleiche Funktion in der Kartenübersicht geprüft) | TEILWEISE |
| F16.40 | Your Deck: Deck→Proxy | Knopf „Proxy" vorhanden | nicht ausgelöst (wechselt den Reiter) | NICHT GEPRÜFT — Zeitbudget |
| F16.41 | Your Deck: Share | Knopf „Teilen" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.42 | Your Deck: PTCGL Import | Knopf vorhanden | nicht ausgelöst (hätte fremdes Deck eingespielt) | NICHT GEPRÜFT — hätte den vorgefundenen Entwurf überschrieben |
| F16.43 | Your Deck: PTCGL Export | Knopf geklickt, Zwischenablage abgefangen | Sauberes Limitless-/PTCGL-Paste: `Pokémon: 20` / `Trainer: 26` / `Energy: 17` / `Total Cards: 63`; Kopfzahlen stimmen exakt mit den Einzelzeilen überein; Set-Kürzel + Nummer je Karte | OK |
| F16.44 | Your Deck: Grid | Knopf „Raster" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F16.45 | Your Deck: Suche + Autocomplete | „Ultra Ball", „Prime Catcher", „Legacy Energy", „Master Ball" eingetippt | Vorschlagsliste erscheint jeweils mit Typ und Set („Ultra Ball · Item · ASC 213"); Klick fügt die Karte ins Deck ein | OK |
| F16.46 | Bank | `pastMetaBenchSection` | Zeile „(17 Karten zum Einpacken)" sichtbar, Inhalt nicht im Detail nachgerechnet | NICHT GEPRÜFT — Zeitbudget |
| F16.47 | Tech vs Normal | Überschrift „Tech vs Normal" in past-meta vorhanden | Block existiert; Werte nicht nachgerechnet | NICHT GEPRÜFT — Zeitbudget |
| — | Deckbau-Regel: 4 Kopien | Ultra Ball fünfmal nacheinander hinzugefügt | Bei 4 gedeckelt, Meldung „⚠️ Maximal 4 Kopien pro Karte!" | OK |
| — | Deckbau-Regel: 1 ACE SPEC | „Prime Catcher" und „Master Ball" in ein Deck gelegt, das bereits „Hero's Cape TEF 152" (ACE SPEC) enthielt | Beide abgelehnt: „⚠️ Nur 1 Ace-Spec-Karte pro Deck erlaubt! Entferne zuerst die vorhandene." | OK |
| — | Deckbau-Regel: 60 Karten | Deck auf 61 und weiter auf 63 Karten gebracht | Kein Blockieren, aber der Zähler färbt sich rot (`color-red`, `rgb(153,27,27)`); nach Rückbau auf 60 wieder normal | OK (weiche Grenze, sichtbar markiert) |
| F17.1 | Menü-Hervorhebung Deck Builder | `menu-btn-deckbuilder` ohne Anmeldung angeklickt | Menü hebt **„Mein Profil"** hervor, Kopf-Abzeichen zeigt ebenfalls „Mein Profil", Adresse `#profile`. Kein Hinweis, dass der Deck Builder gemeint war | FEHLER-niedrig (FEHLER-5) |
| F17.2 | Ohne Anmeldung | derselbe Klick | Landet auf der Anmeldewand („Anmelden, um alle Funktionen freizuschalten … Anmelden / Registrieren") statt im Deck Builder — wie gefordert | OK |
| F18.1 | Menüpunkt „Playtester" | `menu-btn-showdown` geklickt (`window.open` protokolliert und abgefangen) | Öffnet `https://tcg-showdown.com/` mit `target="_blank"`; **kein** Reiterwechsel in der App (vorher wie nachher `profile`) | OK |
| F18.2 | Übergabe aus dem Deck Builder | „📋 TCG Showdown ↗" aus past-meta (F16.30) ausgelöst | Richtiges, aktuelles Deck in der Zwischenablage + externer Aufruf | OK für past-meta; F3.34 und F4.58 NICHT GEPRÜFT (Zeitbudget) |
| F18.3 | Alte Tieflinks `#playtester` / `#sandbox` | Beide Adressen einzeln aufgerufen | Beide landen auf `meta-analysis-hub`; kurz danach erscheint „Der Playtester läuft jetzt extern über TCG Showdown — im Menü unter ‚Werkzeuge'." | OK |
| F19.1 | Hilfe (`helpModal`) | Aus `current-analysis` und `past-meta` geöffnet; Schließen über ×, Hintergrundklick und Escape | Inhalt passt jeweils zum Reiter. × schließt ✓, Hintergrundklick schließt ✓, **Escape schließt nicht** | FEHLER-mittel (FEHLER-7) |
| F19.2 | Anmeldung (`auth-modal`) | — | **bewusst nicht ausgelöst**: Anmelde-/Registrier-/Passwort-Zurücksetzen-Vorgänge auf der Live-Seite sind keine zulässige Prüfhandlung für mich | NICHT GEPRÜFT — Anmeldevorgang nicht zulässig |
| F19.3 | Starthand-Simulator | „Testhand" im past-meta-Bauer | 7 Karten in `.draw-sim-hand`; **kein Modal**, sondern inline. „Combo Probability"/`comboTargetBadges` in dieser Ansicht nicht auffindbar | TEILWEISE / Rest NICHT GEPRÜFT |
| F19.4 | Deck Compare | Auslöser „Vergleichen" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.5 | 3-way Compare | Überschrift „3-Wege-Vergleich · Builder · Major · Online" in `current-analysis` gesehen | nicht geöffnet | NICHT GEPRÜFT — Zeitbudget |
| F19.6 | Anti-Tech / Build vs | Modal geöffnet, Schnellauswahl „Dragapult 14.8 % 52.3 %" gewählt, „Weiter → Tech-Karten wählen (1)" geklickt | Schritt 1 → Schritt 2 wechselt korrekt (`antiTechStep1Wrap` none, `antiTechStep2Wrap` block). Schritt 2 meldet für Dragapult: „Keine Counter-Karten zu diesen Zielen — data/active_threats.json führt sie nicht." Escape schließt das Modal ✓ | OK, Inhalt siehe FEHLER-12 |
| F19.7 | Rarity Switcher (★) | ★-Knöpfe vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.8 | Matchup-Analyse | `openMatchupAnalysisModal()` | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.9 | Deck-Gitter-Vorschau | Auslöser „Raster" | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.10 | Bildansicht (`imageViewModal`) | Kartenbild im Deckraster angeklickt | Es öffnet `singleCardModal`, nicht `imageViewModal` (bleibt `none`) | NICHT GEPRÜFT — anderer Auslöseweg nötig |
| F19.11 | Vollbildkarte (`fullscreenCardModal`) | derselbe Klick | bleibt `none` | NICHT GEPRÜFT — anderer Auslöseweg nötig |
| F19.12 | Einzelkarte (`singleCardModal`) | Kartenbild „Meowth ex" angeklickt, dann Escape | Öffnet (`display:flex`), Escape schließt sauber | OK |
| F19.13 | Deck-Bild teilen | Auslöser „Teilen" vorhanden | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.14 | Wishlist-Gitter | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.15 | Cardmarket-Wants-Helfer | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.16 | Tradelist-Gitter | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.17 | Battle-Journal-Schublade | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.18 | Journal: Turnier bearbeiten | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.19 | Journal: Match bearbeiten | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.20 | Meta Binder: verworfene Karten | erfordert Anmeldung | — | NICHT GEPRÜFT — nicht angemeldet |
| F19.21 | Tech Lab: fehlenden Tech ergänzen | Überschriften „Tech Lab — finde Techs für jede Meta-Karte" und „Tech hinzufügen die die Engine übersehen hat" in `current-analysis` gesehen | nicht ausgelöst | NICHT GEPRÜFT — Zeitbudget |
| F19.22 | Pocket-Muster | Reiter `pocket` gehört nicht zu meinen Gruppen | — | NICHT GEPRÜFT — außerhalb des Auftrags |
| F19.23 | Meldungen (Toast) | Mehrere Aktionen ausgelöst (Generate, 4-Kopien-Verstoß, ACE-SPEC-Verstoß, Showdown-Übergabe) | Toast erscheint in `#toast-container`, `aria-live="polite"` ✓; Erfolgsmeldungen verschwinden von selbst; **Warnmeldungen bleiben dauerhaft stehen** (nach >2 Minuten und einer zusätzlichen 9-Sekunden-Messung unverändert) | FEHLER-niedrig (FEHLER-13) |
| H3 | Sortierung „Deck" liest Ziffern als Zahl | Alle 139 Decknamen der current-meta-Rangliste und alle 70 Deck-Optionen in past-meta auf Ziffern geprüft; Spalte „Deck" zweimal sortiert | **Kein einziger Deckname im aktuellen Datensatz enthält eine Ziffer.** Die Sortierung läuft sauber A→Z („Alakazam" … „Decidueye") und Z→A („Zygarde Barbaracle" … „Salamence"), Startrichtung ist konsistent A→Z. Der Ziffernpfad ist damit nicht auslösbar | NICHT GEPRÜFT — Hypothese im aktuellen Datenbestand unentscheidbar |
| H6 | Kennzahlen ohne Definition | In `current-analysis` die Anzeigeorte untersucht: `title`, `aria-label`, Elterncontainer und Hilfe-Modal | Wortlaut vor Ort: **„Gesamte Win Rate — Limitless Online Turniere · 48,69 %"**, **„Matchup gegen Top 20 · 47,05 % (20 MU)"**, **„Used in Top 256 · 68×"**. Kein `title`, kein `aria-label`, keine Fußnote, kein Info-Symbol an diesen drei Kacheln. Das Hilfe-Modal (1.974 Zeichen) enthält weder „Top 20" noch „Gesamte Win Rate" noch „Platzierung". „Avg Placement"/„Ø-Platzierung" und „Decks Used" kommen in `current-analysis` gar nicht vor. Einzige Definition weit und breit: der `title` an den Platzierungszeilen („Win % — so nennt Limitless diese Spalte: ein Sieg zählt 3, ein Unentschieden 1, eine Niederlage 0.") | FEHLER-mittel (FEHLER-14) — bestätigt |
| H13 | Kein Meta-Card-Analysis-Block in Past Meta | Überschriften der drei baugleichen Ansichten Block für Block verglichen | Bestätigt. `city-league-analysis`: Deck-Statistiken, Kartenübersicht, Deckbau, Dein Deck, **Meta-Karten-Analyse (Top 10 Archetypen)**, Tech vs Normal. `current-analysis`: dieselbe Kette plus 3-Wege-Vergleich, Legende, Kernkarten/Optionen, Matchups gegen Meta Call, Referenz-Listen, Tech Lab — ebenfalls **mit** Meta-Karten-Analyse. `past-meta`: Deck-Statistiken, Turnier-Performance, Matchup-Matrix, Erfolgreichste Decklist, Kartenübersicht, Deckbau, Dein Deck, Tech vs Normal — **ohne** Meta-Karten-Analyse | FEHLER-mittel (FEHLER-15) — bestätigt |

---

## Teil 2 — Fehler im Einzelnen

### FEHLER-1 · „Leeren" im past-meta-Deckbau friert den Reiter ein — **hoch**
**Was passiert.** Ein Klick auf „Leeren" in der Deckbau-Werkzeugleiste von `past-meta` (`onclick="clearDeck(\"pastMeta\")"`) macht den Renderer dauerhaft unerreichbar. Jeder weitere Skriptaufruf und selbst ein Bildschirmfoto laufen ins Zeitlimit; nach über 90 Sekunden reagierte die Seite immer noch nicht. Nur ein Neuladen hilft. Das Deck wird dabei **nicht** geleert — nach dem Neuladen stand der Zähler unverändert auf 63.
**Wie nachstellen.** `#past-meta` → Format TEF-PBL → Deck „Mega Excadrill" → „Max Consistency" → in der Leiste unter dem Deckraster „Leeren" klicken.
**Zweimal reproduziert** (einmal isoliert, einmal in Folge mit „Build vs …").
**Vermutet.** `clearDeck()` für die Quelle `pastMeta` — vermutlich eine Endlosschleife beim Neuzeichnen, wahrscheinlich in `js/deck-builder*.js` bzw. der Stelle, die nach dem Leeren `pastMetaMyDeckGrid` neu rendert.

### FEHLER-2 · Zwei sichtbare Formatfilter, die nur in eine Richtung gleichziehen — **mittel**
**Was passiert.** `past-meta` zeigt zwei Auswahlfelder mit identischen 17 Formatoptionen: eines unter der Beschriftung „Format" (Datenraum) und eines als „Meta/Format-Filter:". Ändert man das obere, zieht das untere mit. Ändert man das untere, bleibt das obere stehen. Danach zeigt die Seite gleichzeitig „SVI-MEG" und „TEF-PBL" an, während die Daten dem unteren Feld folgen.
**Wie nachstellen.** `#past-meta` → oberes Feld auf „Scarlet & Violet → Mega Evolution (SVI-MEG)" → unteres Feld auf „Temporal Forces → PBL (TEF-PBL)" → beide Felder ablesen.
**Vermutet.** Der Änderungshandler des zweiten Feldes spiegelt seinen Wert nicht zurück auf das erste; Gegenstück zur bereits vorhandenen Rückspiegelung in der anderen Richtung.

### FEHLER-3 · Kartenübersicht zeigt nach Suche/Generate zu wenige Karten — **mittel**
**Was passiert.** Mega Excadrill hat 34 verschiedene Karten; der Zähler zeigt korrekt „34 Karten". Tippt man „Ultra" in die Kartensuche, steht dort richtig „1 Karten". Leert man das Feld wieder, steht dort „24 Karten" — zehn Karten fehlen dauerhaft. Erst ein erneutes Auswählen desselben Decks stellt 34 wieder her. Derselbe Zähler steht nach „Max Consistency" auf „0 Karten", obwohl das Raster 24 Karten zeigt.
**Wie nachstellen.** `#past-meta` → Deck „Mega Excadrill" → Zähler „34 Karten" ablesen → in „Karten suchen…" `Ultra` tippen → Feld leeren → Zähler zeigt „24 Karten".
**Vermutet.** Das Zurücksetzen der Suche rendert aus dem Deckbau-Bestand (24 Einträge) statt aus dem Archetyp-Bestand (34); `pastMetaCardCount` wird aus derselben falschen Quelle gefüllt.

### FEHLER-4 · Hervorhebung der Filterknöpfe bleibt am falschen Knopf kleben — **mittel**
**Was passiert.** Bei den 9 Typfiltern trägt „Alle" die Klasse `active` fest verdrahtet und ist dauerhaft blau (`rgb(59,76,202)`). Wählt man „Pokémon", bekommt „Pokémon" zwar `btn-active`, bleibt aber optisch unverändert (transparenter Hintergrund), während „Alle" weiter blau leuchtet. Genauso bei der Seltenheit: „Niedrige Seltenheit" trägt `btn-success` und bleibt blau, auch wenn „Max. Seltenheit" aktiv ist. Der Nutzer sieht nie, welcher Filter greift — die Karten ändern sich, die Knöpfe nicht.
**Wie nachstellen.** `#past-meta` → Deck wählen → „Pokémon" anklicken (Zähler springt 24 → 11) → die Knopfleiste ansehen: „Alle" ist weiterhin der einzige hervorgehobene Knopf. Analog „Max. Seltenheit" anklicken.
**Vermutet.** Zwei konkurrierende Zustandssysteme (`active`/`btn-success` aus dem Markup gegen `btn-active`/`btn-inactive` aus dem Skript); `btn-active` besitzt in diesen beiden Gruppen keine sichtbare Formatierung.

### FEHLER-5 · Deck-Builder-Menüpunkt führt ohne Erklärung ins Profil — **niedrig**
**Was passiert.** Ein Klick auf „Deck Builder" im Menü landet ohne Anmeldung auf `#profile`. Menü-Hervorhebung und Kopf-Abzeichen zeigen dann „Mein Profil"; es erscheint kein Hinweis („Bitte anmelden, um den Deck Builder zu nutzen"), keine Meldung, kein Anmelde-Dialog. Der Nutzer klickt A und bekommt kommentarlos B.
**Wie nachstellen.** Abgemeldet auf `https://thedipidis.app` → Menü → „Deck Builder".
**Vermutet.** Der Umleitungspfad für `deckbuilder` setzt nur den Zielreiter, ohne `showNotification` oder das Anmelde-Modal auszulösen.

### FEHLER-6 · Tier-Einordnung widerspricht den dokumentierten Anteilsschwellen — **mittel**
**Was passiert.** Die Prüfmatrix nennt Tier 1 ≥ 8 %, Tier 2 = 4–8 %, Tier 3 = 1,5–4 %. Live gemessen (Share online):
Tier 1: Dragapult 7,6 % · Alakazam Dudunsparce 5,8 % · Festival Lead 5,8 % · Dragapult Blaziken 5,7 % · Dragapult Dusknoir 5,6 % · Slowking 5,5 % — **kein einziges Deck erreicht 8 %**.
Tier 2: Mega Excadrill 7,3 % · N's Zoroark 5,2 % · Grimmsnarl Froslass 4,1 % · Dhelmise 4,0 % · Raging Bolt Ogerpon 2,2 % · Lucario Hariyama 1,8 % · Basic Box 1,7 % · Mega Chandelure 1,1 % · **Crustle 1,0 %**.
Tier 3: Toucannon 2,5 % · Mega Lucario 2,0 % · Mega Greninja 1,5 % · Ogerpon Meganium Hydrapple 1,4 % · … · Kangaskhan Bouffalant 0,8 %.
Mega Excadrill mit 7,3 % steht also unter Slowking mit 5,5 %, und Crustle mit 1,0 % steht über Toucannon mit 2,5 %. Die Einordnung folgt offensichtlich einem zusammengesetzten Wert, nicht dem Anteil — **auf der Seite steht dazu kein Wort** (siehe F15.24: keine Grundlagen-Zeile, keine Schwellenangabe).
**Wie nachstellen.** `#current-meta` → Abschnitt „Tier-Liste" öffnen → die „Share online"-Werte in Tier 1 und Tier 2 vergleichen.
**Vermutet.** Entweder ist die Dokumentation veraltet oder die Schwellenlogik greift nicht; in jedem Fall fehlt die Erklärzeile an der Anzeigestelle.

### FEHLER-7 · Escape schließt das Hilfe-Modal nicht (uneinheitlich) — **mittel**
**Was passiert.** `#helpModal` reagiert nicht auf Escape (bleibt `display:flex`), weder aus `current-analysis` noch aus `past-meta`. × und Hintergrundklick funktionieren. `antiTechModal` und `singleCardModal` dagegen schließen mit Escape sauber — das Verhalten ist also innerhalb derselben Seite widersprüchlich.
Zusätzlich: Beim Öffnen bleibt der Tastaturfokus auf `BODY`, er wandert nicht in den Dialog; nach dem Schließen kehrt er nicht zum Hilfeknopf zurück. Der Hintergrund ließ sich im Test nicht scrollen (in Ordnung).
**Wie nachstellen.** Beliebiger Reiter mit Hilfeknopf → „?" klicken → Escape drücken.
**Vermutet.** Der globale Escape-Handler ist auf einzelne Modal-Ids eingeschränkt und deckt `helpModal` nicht ab.

### FEHLER-8 · Reiterwechsel per Held-Kachel ändert die Adresszeile nicht — **mittel**
**Was passiert.** Klick (oder Enter/Leertaste) auf eine Held-Kachel wechselt korrekt zu `current-analysis` mit vorgewähltem Deck, der Seitentitel wird zu „Deck-Analyse (Global)" — aber `location.hash` bleibt `#current-meta`. Der Zustand ist damit nicht verlinkbar, nicht als Lesezeichen speicherbar und erzeugt keinen eigenen Verlaufseintrag. Browser-Zurück landete im Test zwar wieder auf current-meta, aber nur weil zufällig ein passender älterer Verlaufseintrag existierte, nicht weil der Wechsel einen erzeugt hätte.
**Wie nachstellen.** `#current-meta` → Kachel „#2 Mega Excadrill" anklicken → Adresszeile ansehen.
**Vermutet.** `navigateToCMAnalysisWithCombinedDeck` ruft die Reiterumschaltung direkt auf, ohne `location.hash` bzw. `history.pushState` zu setzen.

### FEHLER-9 · „ggü. Schnitt" sortiert beim ersten Klick aufsteigend, alle anderen Spalten absteigend — **niedrig**
**Was passiert.** Listen, Anteil, Win Rate, Turnier-Antritte, Top 8 und Top-8-Quote beginnen alle mit „größter Wert oben". „ggü. Schnitt" beginnt mit „0,4-mal" oben und braucht einen zweiten Klick für „1,6-mal". Sachlich richtig sortiert, aber gegenläufig zur Erwartung.
**Wie nachstellen.** `#current-meta` → „Meta-Performance" → Kopf „ggü. Schnitt" einmal klicken.

### FEHLER-10 · Angekündigte Blöcke in current-meta fehlen ersatzlos — **niedrig** (Dokumentationslage)
Fußnote zu nicht zugeordneten Turniernamen (F15.16), „Archetype Overview" (F15.31), Meta-Statistiken (F15.32), Best/Worst-Matchup-Tabellen (F15.33), vollständige Vergleichstabelle mit „Rank"-Spalte (F15.34) und damit auch der Decknamen-Link (F15.35) sind im Volltext von `#current-meta` (37.856 Zeichen) nicht auffindbar. Entweder wurden sie bewusst entfernt — dann gehört die Matrix nachgezogen — oder sie werden nicht mehr gerendert.

### FEHLER-11 · `pastMetaHandStats` bleibt nach „Testhand" leer — **niedrig**
Nach dem Ziehen einer Testhand (7 Karten erscheinen korrekt) bleibt das Element `pastMetaHandStats` ohne jeden Inhalt. Die in F16.35 erwartete Verteilung wird nicht angezeigt.
**Wie nachstellen.** `#past-meta` → Deck wählen → „Max Consistency" → „Testhand".

### FEHLER-12 · „Build vs …" liefert für das meistgespielte Deck keine Vorschläge — **niedrig**
Für Dragapult (14,8 % Feldanteil, erster Eintrag der Schnellauswahl) meldet Schritt 2: „Keine Counter-Karten zu diesen Zielen — `data/active_threats.json` führt sie nicht. Das ist eine Lücke in unseren Daten, keine …". Die Meldung ist ehrlich formuliert, aber die Funktion ist damit ausgerechnet für den wichtigsten Fall wirkungslos.

### FEHLER-13 · Warnmeldungen verschwinden nie von selbst — **niedrig**
Die Meldung „⚠️ Maximal 4 Kopien pro Karte!" stand nach über zwei Minuten und einer gezielten Nachmessung (9 Sekunden Wartezeit, unverändert) immer noch in `#toast-container`. Erfolgsmeldungen („✓ Mega Excadrill: 60/60 Karten") verschwinden dagegen von selbst. Nur das × entfernt Warnungen.

### FEHLER-14 · Kennzahlen ohne Definition am Anzeigeort (H6) — **mittel**
Der Wortlaut an Ort und Stelle in `current-analysis` lautet exakt:
* „Gesamte Win Rate — Limitless Online Turniere" · **48,69 %**
* „Matchup gegen Top 20" · **47,05 % (20 MU)**
* „Used in Top 256" · **68×**
An keiner dieser drei Kacheln hängt ein `title`, ein `aria-label`, ein Info-Symbol oder eine Fußnote. Das Hilfe-Modal des Reiters erklärt Archetyp-Filter, Kartenverteilung, Deck Builder, Consistency Generate, Tech-Slots und „Build vs …" — aber keine dieser drei Zahlen. Offen bleibt für den Nutzer: Zählen Unentschieden mit? Welche Top 20 — nach Anteil oder nach Win Rate? Was heißt „MU"? Warum 256? „Avg Placement"/„Ø-Platzierung" und „Decks Used" kommen in `current-analysis` überhaupt nicht vor; die Fußnote `cityLeagueStatDecksNote` konnte ich in meinen Gruppen nicht auslösen.

### FEHLER-15 · Past Meta ohne Meta-Karten-Analyse (H13) — **mittel** (Spielersicht)
Bestätigt: `city-league-analysis` und `current-analysis` haben beide den Block „Meta-Karten-Analyse (Top 10 Archetypen)", `past-meta` nicht. Aus Spielersicht fällt die Lücke auf, weil die drei Ansichten sonst dieselbe Blockfolge haben (Deck-Statistiken → Kartenübersicht → Deckbau → Dein Deck → Tech vs Normal): In past-meta folgt auf „Dein Deck" direkt „Tech vs Normal", genau dort wo in den beiden anderen Ansichten die Meta-Karten-Analyse steht. Wer die Ansichten nacheinander benutzt, sucht an dieser Stelle vergeblich. Ein Hinweis, warum der Block hier fehlt (historische Daten, kein aktuelles Meta), steht nirgends.

---

## Teil 3 — Zählung

| Status | Anzahl |
|---|---|
| OK | 40 |
| FEHLER-kritisch | 0 |
| FEHLER-hoch | 1 |
| FEHLER-mittel | 8 |
| FEHLER-niedrig | 6 |
| NICHT GEPRÜFT / NICHT VORHANDEN | 34 |

Geprüfte Zeilen gesamt: 89 (F15: 38 · F16: 47+3 Zusatzregeln · F17: 2 · F18: 3 · F19: 23 · H3/H6/H13).

---

## Teil 4 — Konsolenmeldungen

Sammler ab dem ersten Seitenaufruf eingehängt (`console.error`, `console.warn`, `window.onerror`, `unhandledrejection`).

**Keine JavaScript-Fehler, keine unbehandelten Zusagen-Ablehnungen** über die gesamte Sitzung.

Drei Warnungen, alle beim Laden von `past-meta`:
1. `No deck selected - filter saved for when deck is selected`
2. `[loadMetaCardAnalysis] Guard triggered: comparison data shape looks like current while past is selected. Forcing explicit past comparison file.`
3. `[loadMetaCardAnalysis] Guard triggered: analysis data shape looks like current while past is selected. Forcing explicit past analysis file.`

Bemerkenswert an 2. und 3.: Eine Schutzabfrage schlägt an, weil beim Umschalten auf `past-meta` zunächst die **aktuellen** Vergleichs- und Analysedateien geladen werden. Die Abfrage korrigiert das zwar, das Anschlagen bei jedem Reiterwechsel deutet aber auf eine falsche Ladereihenfolge hin. Passt zum Umstand, dass `past-meta` als Format standardmäßig **TEF-PBL** vorbelegt — also das derzeit laufende Format, nicht ein abgeschlossenes Fenster.

Der Einfrierfall aus FEHLER-1 hinterlässt **keine** Konsolenmeldung — der Renderer steht, bevor irgendetwas protokolliert werden kann.
