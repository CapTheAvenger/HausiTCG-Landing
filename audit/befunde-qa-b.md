# Befunde QA-B — Live-Prüfung thedipidis.app

**Prüfer:** QA-B · **Datum:** 07.09.2026 · **Browser-Tab:** 1877068116 · **Fensterbreite:** 1536–1707 px (Desktop)
**Umfang:** Teil A, Gruppen F6 (cards), F7 (proxy), F8 (tutorial), F9 (quellen), F10 (admin), F11 (side-quest), F12 (pocket), F13 (calculator), F14 (profile)
**Hypothesen:** H4, H5, H8, H11

## Vorbemerkungen

* **Der Browser war bereits angemeldet** (Konto „CapTheAvenger", `<html class="is-signed-in">`). Ich habe mich **nicht** angemeldet und **nichts** angelegt, gespeichert, gelöscht oder zur Wunschliste hinzugefügt. Der Profil-Reiter war dadurch lesbar; alle schreibenden Funktionen (Import, Speichern, Leeren, Markieren, Team übernehmen, Binder erzeugen) sind bewusst **NICHT GEPRÜFT**.
* **Einzige Zustandsänderung:** die Proxy-Warteschlange wurde für F7 befüllt und danach über „Warteschlange leeren" wieder in den Ausgangszustand (leer) zurückgesetzt. Vorher war sie leer.
* Der Druckdialog (`printProxyQueue`) wurde **nicht** ausgelöst — er blockiert den geteilten Browser.
* Prüfmethode: Live-Klicks bzw. echte Ereignisse im DOM des laufenden Tabs, Kontrolle über Trefferzahlen, Text, Bildschirmfotos.

---

## Tabelle

| Nr | Element | Handlung | Ergebnis | Status |
|---|---|---|---|---|
| **F6 · cards** | | | | |
| F6.1 | Hilfeknopf | `#cards .tab-help-btn` geklickt | `#helpModal` öffnet mit „🧰 Kartendatenbank"-Text; ✕ schließt | OK |
| F6.1b | Hilfemodal · Escape | Escape bei offenem Hilfemodal | Modal bleibt offen (`display:flex`) — anders als beim Kartendetail | FEHLER-niedrig |
| F6.2 | Datenstand-Chip | `data-quelle="all_cards_database.csv"` gelesen | „Daten: 25.8.2026" — 13 Tage alt, plausibel für einen Kartendaten-Build | OK |
| F6.3 | Kartensuche + Autovervollständigung | „Excadrill" getippt | 4 Vorschläge (Mega Excadrill ex PBL 65 · 2 versions, Excadrill ex BLK 46 · 3 versions, Excadrill SSP 109 · 15 versions, Excadrill-EX LTR 82); Gitter filtert auf 21 Treffer, 21 Kacheln | OK |
| F6.3b | Autovervollständigung beim Scrollen | Nach Auswahl gescrollt | Vorschlagsliste bleibt offen und überlagert das Kartengitter am Seitenkopf | FEHLER-niedrig |
| F6.3c | Auswahl aus der Liste | Ersten Vorschlag angeklickt | Suchfeld übernimmt „Mega Excadrill ex", 2 Treffer, 2 Kacheln | OK |
| F6.4 | Filterpanel ein/aus | `cardsFiltersToggle` geklickt | Beschriftung wechselt „Filter ausblenden"⇄„Filter einblenden", `aria-expanded` wechselt, Klasse `mobile-filters-collapsed` wird gesetzt. Der Knopf ist auf Desktop `display:none` — die Wirkung greift nur auf Mobilbreite | NICHT GEPRÜFT (Mobilbreite; Fenstergröße im geteilten Browser nicht verstellbar) |
| F6.5 | Filter Meta/Format | Alle drei Radios einzeln | „total" (Vorgabe) 14.990 · „Alle Spielbaren" 2.791 · „Nur City League" **0 Karten** | FEHLER-mittel |
| F6.6 | Filter Set | Set „MEG" angehakt | 135 Karten, Seite 1 von 3, 168 Kacheln | OK |
| F6.7 | Filter Rarity | „Double Rare" angehakt | 1.059 Karten, 18 Seiten | OK |
| F6.8 | Filter Category | „supporter" angehakt | 483 Karten, 8 Seiten | OK |
| F6.9 | Filter Element Type | „Fire" angehakt | 1.186 Karten, 20 Seiten | OK |
| F6.10 | Filter Main Pokemon | Abschnitt aufgeklappt, „Excadrill" gesucht | **Kein Treffer** — die Liste (43 Einträge) enthält Namensfragmente wie „Basic", „Mega", „Other", „Raging", „Cynthia's", „N's", „Hop's", „Festival". Mit „Dragapult" funktioniert der Filter (374 Karten) | FEHLER-mittel |
| F6.11 | Filter Archetype | „Mega Excadrill" gesucht und gewählt | 175 Karten, 4 Seiten, Drilbur/Mega Excadrill ex an erster Stelle | OK |
| F6.12 | Filter Deck Coverage | Radio „70" | 5 Karten, 6 Kacheln | OK |
| F6.13 | Reset Filters | Set MEG + Suche + Coverage gesetzt (0 Treffer), dann „Filter zurücksetzen" | Alle Filter leer, Suchfeld leer, Sortierung „set", 14.990 Karten | OK |
| F6.14 | Sortierung | Alle vier Optionen | set → Tropius PBL 1 · deck → Galvantula STS 42 · coverage → Boss's Orders ASC 183 · pokedex → Bulbasaur CG 45. Vorgabe „set" | OK |
| F6.15 | Standard Print | Nach „Alle Drucke" zurückgeschaltet | 14.990 Karten, Knopf `active` | OK |
| F6.16 | All Prints | Ohne Suche | 14.990 → **20.638** Karten (332 Seiten) | OK |
| F6.16b | All Prints bei aktiver Suche | Suche „Excadrill", dann Standard ⇄ Alle Drucke | **Beide Male exakt dieselben 21 Treffer** — obwohl die Vorschlagsliste für „Excadrill SSP 109" 15 Fassungen ausweist | FEHLER-mittel |
| F6.17 | Trefferanzeige | Zählung gegen Kacheln | „14.990 Karten gefunden (Seite 1 von 241) · 15.130 Kacheln, davon 140 gestempelte Prize-Pack-Drucke" — 14.990+140 = 15.130 ✔, 63 Kacheln je Seite, Seitenzahl passt. Bei 21 Treffern genau 21 Kacheln | OK |
| F6.18 | Kartengitter | Bilder, Preise, Plaketten geprüft | Bilder laden, Preise (Ø 0,13 €), Seltenheit, Coverage-Plaketten vorhanden | OK |
| F6.18b | Coverage-Plakette | Archetyp „Mega Excadrill" gesetzt | 8 der ersten 12 Kacheln zeigen **„🔥 125,0 % Coverage"** — ein Prozentwert über 100 | FEHLER-mittel |
| F6.18c | Preis-Warnplakette | Karte LTR 82 | Plakette „⚠ ohne Zuordnung" ist abgeschnitten (scrollWidth 102 px, clientWidth 56 px); die Erklärung steht nur im `title`, per Fingertipp also unerreichbar | FEHLER-niedrig |
| F6.18d | Kartendetail | Kartenbild geklickt, dann Escape / ✕ | `#singleCardModal` öffnet mit Großbild und 6 Aktionsknöpfen; Escape und die ✕-Taste (Escape-Rope-Symbol) schließen | OK |
| F6.18e | Seitenblättern | „Weiter →" / „← Zurück" | Seite 1 (Tropius PBL 1) → Seite 2 (Bronzong PBL 64) → zurück auf Seite 1 | OK |
| **F7 · proxy** | | | | |
| F7.1 | Zurück „← Startseite" | Geklickt | Wechselt zu `#current-meta`, Titel „Startseite" | OK |
| F7.2 | Hilfeknopf | Geklickt | `#helpModal` „🖨️ Proxy-Drucker" | OK |
| F7.3 | Decklisten-Eingabe | 6-zeilige PTCGL-Liste eingefügt | Feld nimmt die Liste an | OK |
| F7.4 | Add Decklist to Queue | „Deckliste zur Warteschlange" | 6 Verschiedene, 17 Kopien (2+2+1+4+2+6) — vollständig und richtig gezählt | OK |
| F7.5 | Kartenname | „Excadrill" in `proxyManualName` | `datalist` schlägt Excadrill, Excadrill ex, Excadrill-EX, Mega Excadrill ex vor | OK |
| F7.6/7.7 | Set / Nummer | „SSP" / „109" | Übernommen | OK |
| F7.8 | Anzahl · Grenzen | 0 · −5 · 999 | 0 und −5 werden auf 1 geklemmt ✔ — **999 wird ungeprüft übernommen** (Warteschlange dann 1.017 Kopien), das Feld hat kein `max` | FEHLER-niedrig |
| F7.9 | Add Card | Manuelle Karte hinzugefügt | Erscheint als „Excadrill SSP 109" mit Bild und Mengenfeld | OK |
| F7.9b | Add Card · leerer Name | Alle Felder geleert, „Karte hinzufügen" | Meldung „⚠️ Bitte einen Kartennamen eingeben." | OK |
| F7.9c | Add Card · erfundene Karte | „Zzzz Fantasiekarte / XYZ / 999" | Wird ohne Prüfung in die Warteschlange gelegt; das Bild (`…/XYZ/XYZ_999_R_EN_LG.png`) lädt nicht (naturalWidth 0) → leere Kachel im Druckstapel | FEHLER-niedrig |
| F7.10 | Aus Binder laden | Geklickt | „⚠️ Kein gespeicherter Binder auf diesem Gerät — erst unter Profil → Custom Binder generieren." — verständliche Meldung, kein toter Knopf. Der tatsächliche Übertrag ungeprüft (kein Binder anlegen erlaubt) | OK (Vollpfad NICHT GEPRÜFT) |
| F7.11–13 | Add City League / Current Meta / Past Meta Deck | Alle drei geklickt | Jeweils „⚠️ Für diese Quelle liegt noch keine Kartenliste vor. Eine Auswahl im Archetyp-Menü reicht nicht — bau die Liste erst in der Deck-Analyse …" | OK (Vollpfad NICHT GEPRÜFT — Deckbau in fremder Gruppe) |
| F7.14 | Print Queue | Nicht ausgelöst | Der Druckdialog blockiert den geteilten Browser | NICHT GEPRÜFT |
| F7.15 | Clear Queue | Geklickt | Rückfrage „Gesamte Proxy-Warteschlange leeren?"; danach 0/0 und Leertext „Warteschlange leer — Deckliste einfügen oder Karten oben hinzufügen." | OK |
| F7.16 | Warteschlange | Nach F7.4/F7.9 geprüft | Alle Karten mit Bild, Set+Nummer, Mengenfeld (min 1), −/+ und „Entfernen" | OK |
| **F8 · tutorial** | | | | |
| F8.1 | Zurück „← Startseite" | Geklickt | Wechselt zu `#current-meta` | OK |
| F8.2 | Hilfeknopf | Geklickt | `#helpModal` „📖 Anleitung" | OK |
| F8.3/F8.4 | Links „Anleitung (deutsch)" / „Guide (english)" | Reiter komplett nach `<a>` durchsucht | **Diese Links gibt es nicht mehr.** Der Text wird seit dem Umbau vom 18.08.2026 aus `tutorial/tutorial.de.html` in `#tutorialHost` eingebettet (89.069 Zeichen im Reiter). Die Matrix ist an dieser Stelle veraltet | ENTFALLEN (Prüfzeile veraltet) |
| F8.5 | Restlicher Inhalt aus `js/ds-tutorial.js` | Gesamten Reitertext gesichtet | Vollständige Anleitung, Stand „V48 · AUGUST 2026", Abschnitte Meta Call, Cooking Mode, Telegram-Bot, FAQ, Schlussblock — inhaltlich plausibel und aktuell | OK |
| F8.5b | Verweise im Anleitungstext | Alle 12 `<a>` geprüft, einen geklickt | 9 Verweise zeigen auf `href="#"` ohne `onclick` (8× „🛒 Cardmarket", 1× „@TheDipidisBot"). Klick auf „🛒 Cardmarket" **verlässt die Anleitung und landet auf der Startseite** | FEHLER-mittel |
| **F9 · quellen** | | | | |
| F9.1 | Zurück „← Startseite" | Vorhanden, geprüft über `#quellen` | Knopf vorhanden und beschriftet | OK |
| F9.2 | Abschnitt „Quellen" | Reiter frisch geöffnet | `#qu-quellen` ist **offen**, 845 Zeichen, nennt Limitless Online, limitlesstcg.com/jp, Limitless Labs, Cardmarket | OK |
| F9.3 | Abschnitt „Datenumfang" | Startzustand + aufgeklappt | Startet zu; aufgeklappt 1.086 Zeichen mit „39.694 gemeldete Decklisten … 136 Archetypen … 96,3 % des Feldes" | OK |
| F9.4 | Abschnitt „Begriffe" | Aufgeklappt | Startet zu; 2.023 Zeichen, sechs Definitionen (Anteil, Gewichteter Antritt, Top-8-Quote, „…-mal so oft wie der Schnitt", u. a.) | OK |
| F9.5 | Abschnitt „Zuverlässigkeit" | Aufgeklappt | 716 Zeichen, beschreibt Regression zum Mittel und Mindestzahl | OK |
| F9.6 | Abschnitt „Trennung der Datenräume" | Aufgeklappt | 297 Zeichen, Japan/Global/Past werden ausdrücklich nie vermischt | OK |
| F9.7 | Abschnitt „Stand / Aktualisierung" | Aufgeklappt | 314 Zeichen; Abgleich mit `datenfluss.md` §2 nicht durchgeführt | OK (Abgleich NICHT GEPRÜFT) |
| F9.8 | Abschnitt „Rechtliches" | Aufgeklappt | 335 Zeichen, Marken- und Quellenhinweis vorhanden | OK |
| F9.9–F9.14 | Begriffsdefinitionen gegen die Rechnung | Nur Text gelesen | Der rechnerische Abgleich mit F1/F15 liegt in fremden Gruppen | NICHT GEPRÜFT (Anzeigestellen gehören QA-A/QA-C) |
| F9.15 | Datenumfang zur Laufzeit | Zahlen gelesen | 39.694 Decklisten / 136 Archetypen / 96,3 %; Abgleich gegen die tatsächlichen Zeilenzahlen nicht möglich (kein Dateizugriff im Browser) | NICHT GEPRÜFT |
| H5 | Tieflink `#quellen-umfang` | Adresszeile auf `#quellen-umfang` gesetzt | **Es passiert nichts** — der Reiter bleibt auf `current-meta` (Titel „Startseite"), `#quellen` wird nicht sichtbar, der Abschnitt klappt nicht auf, der falsche Hash bleibt in der Adresszeile stehen. Ergänzung: **keine** Stelle der Seite verweist auf diesen Hash; die drei vorhandenen Verweise („Quellen & Methodik →", „Wie das gerechnet ist →", „Nenner und Rechenweg →") zeigen alle auf `#quellen` und funktionieren | FEHLER-mittel |
| **F10 · admin** | | | | |
| F10.1 | Zurück „← Startseite" | Vorhanden | Knopf da | OK |
| F10.2 | Titel „Datenlücken" | `#admin` direkt aufgerufen | Überschrift „Datenlücken" sichtbar | OK |
| F10.2b | Seitentitel + Reiter-Abzeichen | Nach dem Aufruf geprüft | Browser-Titel bleibt „Startseite – Pokémon TCG Hub", das Abzeichen zeigt „AKTUELLES META (GLOBAL)" — beide werden für `admin` nicht gesetzt | FEHLER-niedrig |
| F10.3 | Einleitung + Hinweis | Ohne weitere Anmeldung aufgerufen | Seite vollständig erreichbar; Hinweis „Nicht zugangsgeschützt: diese Seite steht nicht im Menü, ist aber über #admin für jeden erreichbar." sichtbar | OK |
| F10.4 | Filterchip „Alle n" | Gesucht | Nicht vorhanden — Inventar ist leer | NICHT GEPRÜFT (keine Lücken vorhanden) |
| F10.5 | Filterchips je Klasse | Gesucht | Nicht vorhanden | NICHT GEPRÜFT (keine Lücken vorhanden) |
| F10.6–F10.11 | Lückenkarte, Einstufung, Vorschlag, „Quelle ansehen", „Bestätigen & senden", Sammelknopf | Reiter vollständig ausgelesen | Der Reiter zeigt nur „Keine offene Lücke. Das Inventar ist leer — jede geprüfte Stelle trägt einen belegten Wert." | NICHT GEPRÜFT (keine Lücken vorhanden) |
| F10.12 | Fußblock „Wie es weitergeht" + Inventarzeit | Gesamttext (473 Zeichen) durchsucht | **Fehlt vollständig** — weder der Fußblock noch die UTC-Zeit „Inventar erzeugt" steht auf der Seite. Der Leser erfährt nicht, wie alt der Leerbefund ist | FEHLER-niedrig |
| **F11 · side-quest** | | | | |
| F11.1 | Zurück „← Startseite" | Vorhanden | Knopf da | OK |
| F11.2 | Statuszeile `sideQuestStatus` | Nach Kopieren, Export, Claude-Knopf, Filtern gelesen | Bleibt in **allen** Fällen leer — die `aria-live`-Zeile gibt nie eine Rückmeldung (Fenster hatte Fokus, `document.hasFocus()` = true) | FEHLER-niedrig |
| F11.3 | Unterreiter „Teams" | Reiter geöffnet | Aktiv, `sideQuestTeamsHost` sichtbar (118.375 Zeichen), alle sechs anderen Hosts `hidden` | OK |
| F11.4 | Unterreiter „Nutzung" | Geklickt | `sideQuestUsageHost` sichtbar (2.596 Zeichen), Teams-Host verschwindet | OK |
| F11.5 | Unterreiter „Matchups" | Geklickt | Host sichtbar, 30.122 Zeichen | OK |
| F11.6 | Unterreiter „Pokémon" | Geklickt | Host sichtbar, 52.162 Zeichen, 292 Zeilen | OK |
| F11.7 | Unterreiter „Team-Builder" | Geklickt | Host sichtbar mit Erklärtext | OK |
| F11.8 | Unterreiter „Status" | Geklickt | Host sichtbar, 7 Statuszustände | OK |
| F11.9 | Unterreiter „Nachschlagen" | Geklickt | Host sichtbar, 833 Einträge | OK |
| F11.10 | Replica-Code kopieren | `.side-quest-copy-btn` geklickt | Kein Fehler, aber keinerlei Rückmeldung (keine Statuszeile, kein Toast); ob der Code in der Zwischenablage landet, ist im geteilten Browser nicht nachprüfbar | NICHT GEPRÜFT (Zwischenablage) |
| F11.11 | Eigenen Code kopieren | Nicht ausgelöst | „Als eigenes übernehmen" legt ein Team an | NICHT GEPRÜFT (würde Nutzerdaten anlegen) |
| F11.12/13 | Export-Auswahl + Export | Knopf geprüft, nicht bis zum Ende ausgeführt | `.side-quest-export-btn` trägt `aria-label` „Team im Showdown-Format exportieren"; eine getrennte Copy/Limitless/Showdown-Auswahl gibt es im Reiter nicht mehr | NICHT GEPRÜFT (Zwischenablage/neuer Tab) |
| F11.14 | Team importieren | „➕ Eigenes Team importieren" geöffnet, „Abbrechen" | Overlay `side-quest-modal-overlay` öffnet, Abbrechen schließt es sauber. Zustände „name"/„do" nicht ausgeführt | OK (open/cancel); name/do NICHT GEPRÜFT (würde Daten anlegen) |
| F11.15 | Aktives Team setzen | Nicht ausgelöst | Schreibt Nutzerdaten | NICHT GEPRÜFT |
| F11.16 | Markierung (mark) | Nicht ausgelöst | Schreibt Nutzerdaten | NICHT GEPRÜFT |
| F11.17 | Filter setzen/entfernen/leeren | „＋ Pokémon auswählen" → Kingambit; Chip-„×"; erneut Garchomp; „Zurücksetzen" | 110 → 48 Teams („48 von 110 Teams", Chip „Kingambit ×"); „×" → 110; Garchomp → 45; „Zurücksetzen" → 110, kein Chip mehr | OK |
| F11.17b | Auswahl-Overlay · Escape | Escape bei offener Pokémon-Auswahl | Overlay bleibt offen; nur die ✕-Taste schließt | FEHLER-niedrig |
| F11.18 | Info-Knopf | `.side-quest-info-btn` im ganzen Reiter gesucht | 0 Treffer — das Element gibt es nicht (mehr) | ENTFALLEN (Element nicht vorhanden) |
| F11.19 | Claude-Knopf | `.side-quest-claude-btn` geklickt | Kein sichtbarer Vorgang, kein Modal, keine Statusmeldung, kein Konsolenfehler. Laut `aria-label` soll er „Strategie-Prompt kopieren und Claude öffnen" | NICHT GEPRÜFT (Zwischenablage + neuer Tab im geteilten Browser nicht prüfbar) |
| F11.20 | Modal schließen | Import-Overlay über Abbrechen geschlossen | Schließt | OK |
| F11.21 | Formatwahl (Usage) | „Doppel" → „Einzel" | **Identische Daten**: 85 Pokémon, gleiche Reihenfolge, gleiche Zahlen (Kingambit 48, Garchomp 45, Basculegion 40 …). Der gesamte Text unterscheidet sich um 2 Zeichen (nur die aktive Markierung) | FEHLER-mittel |
| F11.22 | Typfilter (Usage) | „Fire" gewählt | 85 → 12 Einträge (Charizard 40, Incineroar 31, Torkoal 10 …), „Alle" stellt zurück | OK |
| F11.23 | Formatwahl (Matchups) | Doppel/Einzel vorhanden | Umschalter vorhanden; die Zahlen ändern sich nicht sichtbar | NICHT GEPRÜFT (kein belastbarer Vergleichswert im Standardzustand) |
| F11.24 | Sortierung (Matchups) | Meta/Schaden/Gefahr/Initiative | Knöpfe vorhanden; die Sortierprüfung brach beim wiederholten Neuaufbau im Zeitlimit ab | NICHT GEPRÜFT |
| F11.25 | Suche (Matchups) | „Garchomp" eingegeben | Auswahl springt auf Garchomp 45 (Mega Garchomp, Fähigkeiten, Item, Attacken) | OK |
| F11.26 | Team-Chips setzen/entfernen | Siehe F11.17 (gleiche Auswahl) | Funktioniert | OK |
| F11.27 | Kreuztabelle | Reiter untersucht | Es gibt **keine** `<table>`-Kreuztabelle; die Ansicht arbeitet mit Auswahl-Kacheln je Gegner (292 Gegner). Prüfzeile passt nicht mehr zum Aufbau | ENTFALLEN (Aufbau geändert) |
| F11.28 | „Mehr" / „Zurück" | `.sq-more` geklickt | „+252 weitere anzeigen" → „+172 weitere anzeigen", 80 Gegner werden nachgeladen ✔. Ein `.sq-back` gibt es nicht | OK (Mehr); „Zurück" ENTFALLEN |
| F11.28b | Leistung | Mehrere `.sq-more`-Klicks hintereinander | Der Renderer war zweimal über 45 s nicht ansprechbar; die Seite fing sich wieder | FEHLER-niedrig |
| F11.29 | Formatumschalter (Pokédex) | „Doppelkämpfe" → „Einzelkämpfe" | 292 Zeilen, identische Reihenfolge und Werte — die sichtbaren Spalten sind Basiswerte und formatunabhängig; ein Unterschied zeigt sich nur in der Detailansicht | OK (mit Einschränkung) |
| F11.30 | Suche (Pokédex) | „Knakrack" | 292 → 2 Zeilen (Knakrack, Knakrack (Mega)) | OK |
| F11.31 | Typfilter (Pokédex) | `sqpType` = Fire | 292 → 37 Zeilen | OK |
| F11.32 | Presets | „Initiative" | Kopfzeile wechselt auf „INIT ▼", Reihenfolge ändert sich (Aerodactyl (Mega), Simsala (Mega), Bibor (Mega)) | OK |
| F11.33 | Sortierbare Tabelle | Spalte „KP" angeklickt | „KP ▼", Relaxo 160 / Aquana 130 / Amagarga 123 — richtig absteigend. Voreinstellung beim Öffnen ist „GES ▼" | OK |
| F11.34 | Detailansicht | Zeile „Admurai (Hisui)" angeklickt (echter Mausklick) | Vollbild-Overlay mit Typen, Schwächen/Immunität/Resistenzen, Doppel-/Einzel-Umschalter, Statuswerte-Tabelle Basis/Lv50/Genutzt/Range, Speed-Tiers, Wesen- und SP-Verteilung — Werte plausibel | OK |
| F11.35 | Detail schließen | Escape und `.sqp-d-close` | Beide schließen | OK |
| F11.36–F11.44 | Team-Builder-Slots | Nur Einstiegsansicht gesichtet | Ein vollständiges Team zu bauen, zu speichern und als aktiv zu setzen legt Nutzerdaten an | NICHT GEPRÜFT (würde Nutzerdaten anlegen) |
| F11.45 | Statuszustände | Kopfzeile „Paralyse" auf/zu; „Alles aufklappen" zweimal | Einzelner Block 957 px ⇄ 0 px; „Alle" öffnet alle sieben (957/989/867/718/912/623/…) und schließt sie wieder | OK |
| F11.46 | Suche (Look up) | „Überreste", „Leftovers", „Rocky Helmet" | Deutsch und Englisch finden denselben Eintrag; „Rocky Helmet" ist nicht im Champions-Datensatz und liefert korrekt „Nichts gefunden — andere Schreibweise oder Stichwort probieren." | OK |
| F11.46b | Trefferzeile | Ein Treffer | Text lautet „1 Einträge" statt „1 Eintrag" | FEHLER-niedrig |
| F11.47 | Filterchips (Look up) | Chip „Items 148" | 833 → 148 Einträge, `is-active` gesetzt | OK |
| F11.47b | Chipzähler vs. Schalter | „Nur in Champions" ausgeschaltet | Angezeigt werden 583 Items, der Chip beschriftet sich weiter mit „Items 148" — die Zähler folgen dem Schalter nicht | FEHLER-niedrig |
| F11.48 | „Nur Champions" | Ein-/ausgeschaltet | 148 ⇄ 583 Einträge, `is-on` wechselt | OK |
| **F12 · pocket** | | | | |
| F12.1 | Zurück „← Startseite" | Vorhanden | Knopf da | OK |
| F12.2 | Kopf: Titel + Untertitel | Reiter geöffnet | „Side Quest · Pokémon TCG Pocket" + „Game8s Tier-Liste und die Decks des neuen Sets. Deck antippen, Muster zeigen, zweites Gerät scannt." | OK |
| F12.3 | Quellenzeile | Gelesen und Link geprüft | „Einstufung von Game8, keine von uns gemessene Zahl · game8.co · Stand 07.09.2026"; Link → `https://game8.co/games/Pokemon-TCG-Pocket/archives/477754`, `target="_blank"` | OK |
| F12.4 | Alterswarnung | Datenstand 07.09.2026 = heute | Keine Warnung — korrekt, die Schwelle ist nicht erreicht. Das Verhalten bei überschrittener Schwelle ließ sich nicht auslösen | OK (Warnfall NICHT GEPRÜFT) |
| F12.5 | Filter „Alle" | Startzustand | Voreingestellt (`is-active`), 33 Decks | OK |
| F12.6 | Filter „Tier-Liste" | Geklickt | 23 Decks (S 3, A+ 4, A 6, B 5, C 5) — Summe 23 ✔ | OK |
| F12.7 | Filter „Neues Set" | Geklickt | 21 Decks (S 3, A+ 4, A 2, B 8, C 3) + 1 in Stufe D — Summe 21 ✔ | OK |
| F12.8 | Deckzeile | „Chien-Pao ex and Baxcalibur" angetippt | Overlay öffnet mit den Daten genau dieses Decks | OK |
| F12.9 | Tier-Gruppierung | Reihenfolge geprüft | S(4) → A+(5) → A(6) → B(12) → C(5) → D(1) = 33 ✔; innerhalb der Stufen alphabetisch (S: Chien-Pao, Greninja, Mega Altaria, Mega Lucario) | OK |
| F12.10 | Abweichende Stufen (Dubletten) | Zeile „Greninja ex and Suicune ex" | Trägt die Fußnote „Stufe aus der Set-Tabelle"; eine zweite Zeile trägt „Game8 nennt auch A+" | OK |
| F12.11 | Rechnungsblock | Nachgezählt | „33 von 52 Einträgen bei Game8 — 2 ohne lesbares Muster, 17 als Dublette zusammengelegt" → 52−2−17 = 33 ✔; die beiden fehlenden Decks sind namentlich genannt (Mega Absol ex and Hydreigon, Mega Altaria ex and Greninja) | OK |
| F12.12 | Overlay schließen | `.pk-schliessen` und Escape | Beide schließen, das Overlay wird geleert | OK |
| F12.13 | Overlay: Name + Stufe | Gelesen | „Chien-Pao ex and Baxcalibur · Stufe S · Game8 · Stand 07.09.2026" | OK |
| F12.14 | Overlay: 2D-Muster | Bildschirmfoto | SVG-QR-Code 420×420 px, sauber gezeichnet, hoher Kontrast. Ob ein zweites Gerät ihn einliest, konnte ich nicht ausprobieren | OK (Scanbarkeit NICHT GEPRÜFT — kein zweites Gerät) |
| F12.15 | Hinweis „Bildschirm hell stellen" | Gelesen | „Bildschirm hell stellen und in Pocket abscannen." steht unter dem Muster | OK |
| F12.16 | Overlay: Kartenliste | Nachgezählt | POKÉMON (7): 2+2+2+1 = 7 ✔ · TRAINER (13): 2+1+2+1+1+1+1+2+2 = 13 ✔ · Gesamt 20 Karten, jede mit SET-Nummer (A4a-020, B2a-034 …) | OK |
| F12.17 | Bildschirm-Wachhalten | `navigator.wakeLock` vorhanden | Auf dem Schreibtischrechner nicht beobachtbar | NICHT GEPRÜFT (echtes Mobilgerät nötig) |
| **F13 · calculator** | | | | |
| F13.1 | Zurück „← Startseite" | Geklickt | Wechselt zu `#current-meta` | OK |
| F13.2 | Hilfeknopf | Geklickt | `#helpModal` „🧮 Wahrscheinlichkeitsrechner" | OK |
| F13.3 | Cards in Deck | 0 · 200 · −5 eingegeben | 0 → 1, 200 → 99, −5 → 1, jeweils mit Klemm-Meldung „Wert auf den gültigen Bereich 1–99 gesetzt". Vorgabe 60 ✔ | OK |
| F13.3b | Cards in Deck · leer/Buchstaben | „abc" eingegeben (number-Feld liefert dann `""`) | Feld bleibt **leer**, es erscheint **keine** Klemm-Meldung, und der Rechner rechnet stumm mit 60 weiter (39,95 %). Danach greift die Klemmung von „Gezogene Karten" auf 1–60, obwohl im Deckfeld nichts steht | FEHLER-mittel |
| F13.3c | Klemm-Kaskade | Deck auf 0 gesetzt | Alle vier Felder fallen auf 1/1/1/1 und werden nicht wiederhergestellt, wenn man die Deckgröße wieder hochsetzt | FEHLER-niedrig |
| F13.4 | Copies in Deck (H8) | Deck 99, dann 60 und 99 Kopien | Beide Werte werden übernommen (99/99/7/0 → „100,00 %"). Das Markup sagt `max="60"`, die JS-Klemmung geht bis `deckSize`. Die Diskrepanz ist damit **bestätigt**: über die Pfeiltasten bremst der Browser bei 60, per Einfügen/Tippen kommt jeder Wert bis zur Deckgröße durch | FEHLER-niedrig (H8 bestätigt) |
| F13.5 | Cards Drawn | 100 bei Deck 60 | Klemmt auf 60, Meldung „Wert auf den gültigen Bereich 1–60 gesetzt — gerechnet wird mit 60." Vorgabe 7 ✔ | OK |
| F13.6 | Already in Hand (H8) | 10 bei 4 Kopien; danach Kopien auf 2 gesenkt | 10 → 4 („gültiger Bereich 0–4"); nach Absenken auf 2 Kopien folgt der Wert auf 2 („0–2"). Die JS-Klemmung bindet korrekt an `copies`, das Markup `max="4"` bremst nur die Pfeiltasten | FEHLER-niedrig (H8 bestätigt) |
| F13.7 | Ergebnis „Draw (at least 1)" | 60/4/7/0 und 60/2/7/0 von Hand nachgerechnet | 1 − C(56,7)/C(60,7) = 1 − 0,60050 = **39,95 %** ✔ · 1 − (53·52)/(60·59) = **22,15 %** ✔ · Vorgabefall 1/60/7 → 7/60 = **11,67 %** ✔ | OK |
| F13.8 | Fußzeile Draw | Gelesen | „4 von 60 Karten, 7 gezogen" passt zu den Eingaben | OK |
| F13.9 | Ergebnis „In Prize Cards" | 60/4/7/0 nachgerechnet | 1 − C(49,6)/C(53,6) = 1 − 0,60912 = **39,09 %** ✔; Hinweis „(mindestens 1, nach der Starthand)" korrekt | OK |
| F13.10 | Fußzeile Prize | Gelesen | „4 übrig in 53 ungesehenen Karten, 6 davon Preiskarten" — 60−7 = 53 ✔ | OK |
| F13.11 | Ergebnis „Topdeck Chance" | Nachgerechnet | 4/53 = **7,55 %** ✔ · 1/53 = **1,89 %** ✔; Hinweis „(nächste gezogene Karte)" korrekt | OK |
| F13.12 | Fußzeile Topdeck | Gelesen | „4 von 53 ungesehenen Karten" ✔ | OK |
| F13.13 | Klemm-Rückmeldung | Ungültige Werte eingegeben | `.calc-input-geklemmt` erscheint mit `title` im geforderten Wortlaut „Wert auf den gültigen Bereich a–b gesetzt — gerechnet wird mit c." | OK (Ausnahme: leeres Feld, siehe F13.3b) |
| **F14 · profile** | | | | |
| F14.1 | Hilfeknopf | Geklickt | `#helpModal` „👤 Benutzerprofil" | OK |
| F14.2 | Anmeldewand | — | Der Browser war bereits angemeldet; die Anmeldewand ließ sich ohne Abmelden nicht herbeiführen, und Abmelden hätte in Nutzerdaten eingegriffen | NICHT GEPRÜFT (Sitzung bereits angemeldet, Abmelden nicht zulässig) |
| F14.3 | Inhalt nach Anmeldung | Reiter geöffnet | `profile-content` sichtbar (`display:block`) mit vollem Inhalt | OK |
| F14.4 | Cloud-Sync-Status | Gelesen | „CLOUD-SYNC · Online · Cache nicht aktiv (SDK-Version ohne Offline-Cache)" — Entwicklerjargon in der Nutzeroberfläche | FEHLER-niedrig |
| F14.5 | „Jetzt synchronisieren" | Nicht ausgelöst | Schreibender Vorgang auf echten Nutzerdaten | NICHT GEPRÜFT |
| F14.6–F14.9 | Vier Kopfkennzahlen | Gelesen | Name „CapTheAvenger" · Karten im Besitz 0 · Sammlungswert 0,00 € · Gespeicherte Decks 4 — die 4 stimmt mit dem Untertab „Meine Decks (4)" überein; die Sammlung ist tatsächlich leer | OK |
| F14.10 | Battle-Journal-Kasten | Nur gelesen | „Wartend 0 · Sync-Status Bereit · Match loggen · Jetzt syncen" | OK (Auslösen NICHT GEPRÜFT) |
| F14.11 | Untertab „Meine Sammlung" | Beim Öffnen | Aktiv, Sortierung + Filterleiste + Dex-CSV-Import sichtbar | OK |
| F14.12 | Untertab „Wunschliste" | Geklickt | Wechselt, 146 Karten, Set-Filterleiste, „📋 Liste einfügen", „🛒 Cardmarket" | OK |
| F14.13 | Untertab „Trade List" | Geklickt | Wechselt; Leerzustand „Deine Tauschliste ist leer" mit „Sammlung öffnen" | OK |
| F14.14 | Untertab „Meta Binder" | Geklickt | Wechselt; „Meta-Binder noch nicht generiert", drei Folgeknöpfe vorhanden | OK |
| F14.15 | Untertab „Custom Binder" | Geklickt | Wechselt; Ordner „Hausi Playables · 43 Decks · Stand 24.08.2026", Schwellen „Alle Karten / Kern + Tech (≥30 %) / Nur Kernkarten (>70 %)" | OK |
| F14.16 | Untertab „Meine Decks" | Geklickt | Wechselt; 4 Decks, Ordner „Maulwurf", Filterchip „Nur IRL Gebaute" | OK |
| F14.17 | Untertab „Decklisten vergleichen" | Geklickt | Wechselt; Deck A (Alt) / Deck B (Neu) / „Vergleichen" | OK |
| F14.18 | Untertab „Deck Builder" | Geklickt | Wechselt; Filterleiste META/TYP/SETS, „80+ Treffer", Kartengitter | OK |
| F14.19 | Untertab „Battle Journal" | Geklickt | Wechselt; „10 Matches · 6 Win · 1 Loss · 3 Tie · 60% Win Rate" — 6+1+3 = 10 ✔, 6/10 = 60 % ✔ (Remis im Nenner, nicht als halber Sieg — passt zur Definition in F9) | OK |
| F14.20 | Untertab „Testing Groups" | Geklickt | Wechselt; Gruppe „Buddy Buddy · BESITZER · 1 Mitglieder" | OK |
| F14.21 | „Meta Call →" | Geklickt | Verlässt das Profil, öffnet Reiter `meta-call` | OK |
| F14.22 | Untertab „Einstellungen" | Geklickt | Wechselt; Anzeigename (maxlength 50), Telegram-Preisalarme (Schalter an, Chat-ID gesetzt), Schwelle (number, 0–100, Wert 10) — entspricht der Vorgabe | OK |
| F14.23–F14.119 | Sammlung, Wunschliste, Trade List, Meta Binder, Custom Binder, Meine Decks, Vergleich, Deck Builder, Battle Journal, Testing Groups, Einstellungen — alle schreibenden Vorgänge | Nicht ausgelöst | Import, Leeren, Generieren, Speichern, Löschen, Einladen, Abmelden greifen in echte Nutzerdaten ein | NICHT GEPRÜFT (Verbot, Nutzerdaten zu verändern) |
| F14.x | Sprachfassung | Oberfläche in allen 11 Untertabs gelesen | Deutsch und Englisch durchmischt: „Grid", „Copy", „📂 Load Saved Binder", „Generate the binder to compare current meta staples", „No archetypes selected.", „All", „Nur IRL Gebaute" neben „IRL PTCGL Decklist", „6 Win / 1 Loss / 3 Tie / 60% Win Rate" | FEHLER-mittel |
| **Tieflinks / Hypothesen** | | | | |
| H4 | `#hub` | Adresszeile | Öffnet „Meta & Deck-Analyse", Titel wechselt mit | OK |
| H4 | `#uebersicht` | Adresszeile | Öffnet „Meta & Deck-Analyse" | OK |
| H4 | `#overview` | Adresszeile | **Es passiert nichts** — der Reiter bleibt auf `current-meta` („Startseite"), der Hash `#overview` bleibt aber in der Adresszeile stehen | FEHLER-mittel |
| H4b | Erfundener Hash `#gibtsnicht123` | Adresszeile | Wird stillschweigend übergangen, der falsche Hash bleibt in der Adresszeile; es wird **kein** kanonischer Hash zurückgeschrieben | FEHLER-niedrig |
| H11 | Karten-Legende A–K | `current-analysis`, `city-league-analysis`, `past-meta` angesehen | In `current-analysis` gibt es 11 Legendenschlüssel `.meta-hub-legend-key` (A–K) mit Erklärtexten („A — Max-Anzahl im Deck …"). In `city-league-analysis` und `past-meta` wird im Ausgangszustand (kein Deck gewählt) **überhaupt kein Inhalt** gezeichnet — weder Plaketten noch Legende | NICHT GEPRÜFT (Reiter fremder Gruppen; H11 von hier aus nicht belegbar) |

---

## Befunde im Einzelnen

### FEHLER-mittel

**1. „Alle Drucke" wirkt bei aktiver Namenssuche nicht (F6.16b)**
Ohne Suche schaltet der Knopf sauber von 14.990 auf 20.638 Karten. Sobald aber im Suchfeld ein Name steht, liefern „Standard-Druck" und „Alle Drucke" dieselbe Liste — bei „Excadrill" beide Male exakt 21 Treffer in identischer Reihenfolge, obwohl die Vorschlagsliste für „Excadrill SSP 109" 15 Fassungen ausweist. Nachstellen: Reiter `cards` → „Excadrill" ins Suchfeld → „Alle Drucke" klicken → Trefferzahl bleibt 21. Vermutlich filtert die Namenssuche gegen einen vorberechneten Index, der nur den Standarddruck je Karte enthält; zu suchen im Kartenmodul dort, wo `setPrintView()` und die Suchfilterung zusammenlaufen.

**2. Filterliste „Haupt-Pokémon" besteht teils aus Namensfragmenten (F6.10)**
Die Liste hat nur 43 Einträge, darunter „Basic", „Mega", „Other", „Raging", „Festival", „Cynthia's", „Ethan's", „Hop's", „Lillie's", „N's", „Rocket's", „Steven's". Das sind offensichtlich erste Wörter zusammengesetzter Archetypnamen („Mega Excadrill" → „Mega", „Raging Bolt" → „Raging"). Folge: „Excadrill" — das meistgespielte Deck der Seite — lässt sich über diesen Filter gar nicht finden. Nachstellen: `cards` → Abschnitt „Haupt-Pokémon" aufklappen → „Excadrill" ins Suchfeld → keine Zeile. Ursache liegt in der Ableitung der Hauptpokémon-Liste aus den Archetypnamen (Trennung am ersten Leerzeichen).

**3. Coverage-Wert über 100 % (F6.18b)**
Mit Archetyp-Filter „Mega Excadrill" tragen 8 der ersten 12 Kacheln die Plakette „🔥 125,0 % Coverage · Max: 4x". Ein Prozentwert über 100 ist für eine Abdeckungsquote nicht deutbar. Nachstellen: `cards` → Abschnitt „Archetyp" → „Mega Excadrill" anhaken → erste Kachel (Drilbur PBL 46). Vermutlich wird die Anzahl gespielter Kopien statt des Deckanteils prozentuiert.

**4. „Nur City League" liefert eine leere Kartenliste (F6.5)**
Der dritte Meta-Filter zeigt „0 Karten gefunden" und den Leerzustand „Keine Karten gefunden / Filtereinstellungen anpassen". Der Nutzer erfährt nicht, dass die zugrunde liegende Datei leer ist (bekannt aus `datenfluss.md` §10.1) — er hält es für einen Bedienfehler. Nachstellen: `cards` → Meta/Format → „Nur City League". Entweder die Option sperren (mit `title`-Begründung wie in der Datenraum-Filterzeile) oder eine eigene Meldung zeigen.

**5. Neun tote Verweise in der Anleitung werfen den Leser hinaus (F8.5b)**
Im Anleitungstext stehen 8 Verweise „🛒 Cardmarket" und einer „@TheDipidisBot" mit `href="#"` und ohne `onclick`. Ein Klick setzt den Hash auf leer, worauf die Anwendung auf `current-meta` zurückspringt — der Leser verliert seine Stelle in einem 89.000 Zeichen langen Dokument. Nachstellen: `#tutorial` → im Abschnitt mit den Preisbeispielen („Beedrill ex (CRI 98) Markt 3,96 € · Ziel 4,50 €") auf „🛒 Cardmarket" klicken → Startseite. Entweder echte Cardmarket-Adressen eintragen oder die Verweise zu reinem Text machen.

**6. `#overview` landet im Nichts, die Adresszeile lügt (H4)**
`#hub` und `#uebersicht` öffnen beide die Kachelseite; das englische Gegenstück `#overview` tut nichts — der zuvor offene Reiter bleibt stehen, aber der Hash bleibt in der Adresszeile. Wer den Link teilt oder als Lesezeichen setzt, landet auf einer Seite, die nicht zur Adresse passt. Nachstellen: `https://thedipidis.app/#current-meta` laden, dann `#overview` in die Adresszeile. Gleiches gilt für jeden unbekannten Hash: er wird stillschweigend übergangen und nicht auf den kanonischen Schlüssel zurückgeschrieben. Zu beheben in der Alias-Tabelle des Tieflink-Moduls.

**7. `#quellen-umfang` öffnet weder Reiter noch Abschnitt (H5)**
Der Hash bewirkt gar nichts: der Quellen-Reiter wird nicht sichtbar, der Abschnitt „Worauf die Zahlen beruhen" klappt nicht auf, der Hash bleibt in der Adresszeile stehen. Wichtige Ergänzung: **auf der Seite selbst verweist nichts auf diesen Hash** — die drei vorhandenen Verweise („Quellen & Methodik →" im Datenraum-Kopf, „Wie das gerechnet ist →" in `metaHubAnswer`, „Nenner und Rechenweg →" in `currentMetaContent`) zeigen alle auf `#quellen` und funktionieren. Der Fehler ist also nicht, dass ein Verweis bricht, sondern dass ein sprechender Tieflink auf einen Abschnitt fehlt, obwohl die Abschnitte eigene ids (`qu-umfang`, `qu-begriffe`, …) tragen. Nachstellen: `#quellen-umfang` in die Adresszeile.

**8. Der Umschalter Doppel/Einzel im Reiter „Nutzung" ändert nichts (F11.21)**
Beide Formate zeigen dieselben 85 Pokémon in derselben Reihenfolge mit denselben Zahlen (Kingambit 48, Garchomp 45, Basculegion 40, …). Der Gesamttext des Bereichs unterscheidet sich um 2 Zeichen — das ist nur die Markierung des aktiven Knopfes. Nachstellen: `#side-quest` → „Nutzung" → „Einzel" klicken → Liste vergleichen. Entweder liegen für Einzelkämpfe keine eigenen Zahlen vor (dann sollte der Knopf gesperrt oder beschriftet sein), oder der Formatschlüssel wird beim Neuaufbau nicht durchgereicht.

**9. Leeres Deckgrößen-Feld bleibt ungeklemmt, der Rechner rechnet stumm weiter (F13.3b)**
Löscht man „Karten im Deck" (oder tippt Buchstaben, was ein `number`-Feld auf `""` setzt), bleibt das Feld leer, es erscheint **keine** Klemm-Rückmeldung, und das Ergebnis steht unverändert bei 39,95 % — gerechnet wird still mit 60. Danach klemmt „Gezogene Karten" auf 1–60, obwohl im Deckfeld nichts steht, und über einem leeren Deckfeld steht „100,00 %". Nachstellen: `#calculator` → Deckgröße leeren → Ergebnis bleibt stehen. Der Klemm-Zweig behandelt den Sonderfall „leer" offenbar nicht wie einen Wert außerhalb des Bereichs.

**10. Deutsch und Englisch durchmischt im Profil-Reiter (F14)**
In der deutschen Oberfläche stehen unübersetzte Bedienelemente: „Grid", „Copy", „📂 Load Saved Binder", „No archetypes selected.", „Generate the binder to compare current meta staples", „All", „IRL PTCGL Decklist", „6 Win / 1 Loss / 3 Tie / 60% Win Rate". Nachstellen: `#profile` → Untertabs Wunschliste, Trade List, Meta Binder, Custom Binder, Meine Decks, Battle Journal. Fehlende `data-i18n`-Schlüssel in den Profilbausteinen.

### FEHLER-niedrig

**11. Fußblock „Wie es weitergeht" und Inventarzeit fehlen im Reiter `admin` (F10.12)** — Der gesamte Reitertext umfasst 473 Zeichen und endet mit der Leermeldung. Weder der Fußblock noch eine UTC-Zeit „Inventar erzeugt" ist vorhanden. Damit lässt sich nicht beurteilen, ob „keine offene Lücke" von heute oder von vor Monaten stammt — besonders heikel, weil laut `datenfluss.md` §9.2 kein Ablauf `data/datenluecken.json` erzeugt. Nachstellen: `#admin` aufrufen und bis zum Ende lesen.

**12. Reiter `admin` setzt weder Seitentitel noch Reiter-Abzeichen (F10.2b)** — Nach dem Aufruf von `#admin` bleibt der Browser-Titel „Startseite – Pokémon TCG Hub" und das Abzeichen zeigt „AKTUELLES META (GLOBAL)". In einem Nachbar-Tab war der Titel sogar „Side Quest: Pokémon TCG Pocket", also der jeweils zuvor offene Reiter. Nachstellen: von `#current-meta` nach `#admin` wechseln, Tab-Titel ansehen.

**13. Escape schließt das Hilfemodal nicht (F6.1b)** — Das Kartendetail (`#singleCardModal`) und das Pokédex-Detail schließen mit Escape, `#helpModal` bleibt offen (`display:flex`). Uneinheitlich. Nachstellen: beliebigen Hilfeknopf klicken, Escape drücken.

**14. Anzahl im Proxy-Drucker ohne Obergrenze (F7.8)** — `proxyManualCount` hat `min="1"`, aber kein `max`. Eingabe 999 wird übernommen; die Warteschlange stand danach bei 1.017 Kopien. Nachstellen: `#proxy` → Karte mit Anzahl 999 hinzufügen.

**15. Erfundene Karten werden ungeprüft in die Warteschlange gelegt (F7.9c)** — „Zzzz Fantasiekarte / XYZ / 999" landet in der Liste, die Bild-Adresse `…/XYZ/XYZ_999_R_EN_LG.png` lädt nicht (naturalWidth 0). Im Druckstapel entsteht eine leere Kachel. Nachstellen: `#proxy` → Karte mit erfundenem Set hinzufügen.

**16. Keine Rückmeldung beim Kopieren/Exportieren im Side-Quest-Reiter (F11.2/F11.10)** — Nach Klick auf Replica-Code, Export und den Claude-Knopf bleibt die `aria-live`-Zeile `#sideQuestStatus` leer, es erscheint kein Toast und keine Konsolenmeldung. Das Fenster hatte Fokus (`document.hasFocus()` = true). Blinde und sehende Nutzer erfahren gleichermaßen nicht, ob etwas passiert ist. Nachstellen: `#side-quest` → Teams → auf einen Replica-Code klicken.

**17. Escape schließt die Pokémon-Auswahl nicht (F11.17b)** — Das Overlay `.sq-play-picker-overlay` bleibt bei Escape offen; nur die ✕-Taste schließt. Nachstellen: `#side-quest` → Teams → „＋ Pokémon auswählen" → Escape.

**18. Chipzähler folgen dem Schalter „Nur in Champions" nicht (F11.47b)** — Bei ausgeschaltetem Schalter werden 583 Items angezeigt, der Chip beschriftet sich weiter mit „Items 148". Nachstellen: `#side-quest` → Nachschlagen → „Nur in Champions" ausschalten → Chipbeschriftungen vergleichen.

**19. „1 Einträge" statt „1 Eintrag" (F11.46b)** — Einzahl/Mehrzahl wird nicht unterschieden. Nachstellen: `#side-quest` → Nachschlagen → „Überreste" suchen.

**20. Preis-Warnplakette abgeschnitten (F6.18c)** — „⚠ ohne Zuordnung" wird auf 56 px beschnitten (Inhalt 102 px breit). Die vollständige Erklärung steht nur im `title` und ist per Fingertipp unerreichbar. Nachstellen: `cards` → „Excadrill" suchen → Kachel LTR 82.

**21. Klemm-Kaskade im Rechner setzt alle Felder auf 1 (F13.3c)** — Nach einer 0 in der Deckgröße stehen alle vier Felder auf 1 und bleiben dort, auch wenn die Deckgröße wieder hochgesetzt wird. Die vorher eingegebenen Kopien und gezogenen Karten sind verloren. Nachstellen: `#calculator` → 60/4/7/0 einstellen → Deckgröße auf 0 → wieder auf 60.

**22. Entwicklerjargon im Cloud-Sync-Status (F14.4)** — „Online · Cache nicht aktiv (SDK-Version ohne Offline-Cache)". Für den Spieler ist „SDK-Version ohne Offline-Cache" ohne Bedeutung. Nachstellen: `#profile` → Kopfbereich.

**23. Erfundener Hash bleibt in der Adresszeile stehen (H4b)** — `#gibtsnicht123` wird übergangen, ohne dass auf den kanonischen Hash des tatsächlich offenen Reiters zurückgeschrieben wird. Siehe auch Befund 6.

**24. Autovervollständigung bleibt beim Scrollen offen (F6.3b)** — Die Vorschlagsliste der Kartensuche bleibt am oberen Rand stehen und überlagert das Kartengitter, bis man woanders hinklickt. Nachstellen: `cards` → „Excadrill" tippen → nach unten scrollen.

**25. Matchups-Ansicht friert beim mehrfachen Nachladen ein (F11.28b)** — Zwei Aufrufe liefen über 45 s ohne Antwort des Renderers, danach fing sich die Seite. Nachstellen: `#side-quest` → Matchups → mehrfach hintereinander „+n weitere anzeigen" klicken.

### Beobachtung ohne Fehlerwertung

**Testdaten im Battle Journal.** Im Journal des angemeldeten Kontos steht der Eintrag „CLAUDE AUDIT TEST — bitte loeschen". Er stammt nicht aus dieser Prüfung; offenbar hat ein früherer Durchgang ihn hinterlassen und nicht aufgeräumt. Er verfälscht die Kopfkennzahlen (10 Matches, 60 % Win Rate). Löschen sollte der Kontoinhaber selbst.

**H11 von hier aus nicht belegbar.** Die A–K-Legende (`.meta-hub-legend-key`, 11 Schlüssel mit Erklärtexten) gibt es tatsächlich nur in `current-analysis`. In `city-league-analysis` und `past-meta` wird im Ausgangszustand ohne gewähltes Deck überhaupt kein Inhalt gezeichnet — dort standen weder Plaketten noch Legende. Ob die Plaketten nach Deckauswahl erscheinen, müssen QA-A und QA-C in ihren Gruppen prüfen.

---

## Zählung

| Status | Anzahl Prüfzeilen |
|---|---|
| OK | 84 |
| FEHLER-kritisch | 0 |
| FEHLER-hoch | 0 |
| FEHLER-mittel | 10 |
| FEHLER-niedrig | 15 |
| NICHT GEPRÜFT | 21 |
| ENTFALLEN (Element/Aufbau geändert) | 4 |
| **Summe geprüfter Zeilen** | **134** |

Gründe für „NICHT GEPRÜFT": schreibende Vorgänge auf echten Nutzerdaten (F11.11, F11.15, F11.16, F11.36–44, F14.5, F14.23–F14.119), Zwischenablage bzw. neuer Browser-Tab im geteilten Browser (F11.10, F11.12/13, F11.19), Druckdialog (F7.14), Mobilbreite (F6.4), echtes Mobilgerät (F12.17), zweites Scan-Gerät (F12.14), leeres Lückeninventar (F10.4–F10.11), Reiter fremder Gruppen (F9.9–14, H11), bereits bestehende Anmeldung (F14.2).

## Konsolenfehler

Ein eigener Sammler (`console.error`, `window.onerror`, `unhandledrejection`) lief über den gesamten Durchgang mit.

* **Fehler: 0**
* **Unbehandelte Zurückweisungen: 0**
* **Warnungen: 0**

Einzige Konsolenausgabe war eine reguläre Protokollzeile aus `js/app-meta-call.js`:
`[Predictor 4.5] Concentration-aware boosts | Dominant families: Dragapult 24.5% …` — Entwicklerprotokoll auf der Live-Seite, kein Fehler, aber im Auslieferungsstand entbehrlich.

Zweimal antwortete der Renderer über 45 s nicht (beide Male im Side-Quest-Reiter „Matchups" beim Nachladen weiterer Gegner, siehe Befund 25). Ein Fehler wurde dabei nicht geworfen.
