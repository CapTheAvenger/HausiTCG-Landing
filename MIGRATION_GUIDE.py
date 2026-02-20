#!/usr/bin/env python3
"""
SCRAPER MIGRATION GUIDE - From Direct CSV to CardDataManager
=============================================================
How to update existing scrapers to use the new unified card database.

BEFORE (Old way - direct CSV):
    import csv
    cards = []
    with open('dist/all_cards_database.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cards.append(row)
    
    card = next((c for c in cards if c['name'] == 'Boss\'s Orders'), None)


AFTER (New way - CardDataManager):
    from card_data_manager import CardDataManager
    
    manager = CardDataManager()
    cards = manager.get_all_cards()
    
    card = manager.search_cards('Boss\'s Orders')
"""

print(__doc__)

# ============================================================================
# EXAMPLE: Updating city_league_analysis_scraper.py
# ============================================================================

BEFORE_EXAMPLE = '''
# OLD CODE (to be replaced)
def load_player_cards():
    import csv
    cards = {}
    with open('dist/all_cards_database.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['card_name']  # WRONG - should be 'name' not 'card_name'
            if name not in cards:
                cards[name] = row
    return cards
'''

AFTER_EXAMPLE = '''
# NEW CODE (recommended)
from card_data_manager import CardDataManager

def load_player_cards():
    manager = CardDataManager()
    return {card['name']: card for card in manager.get_all_cards()}
'''

# ============================================================================
# BENEFITS OF MIGRATION
# ============================================================================

BENEFITS = """
BENEFITS OF USING CardDataManager:
===================================

1. ✅ SINGLE SOURCE OF TRUTH
   - All scrapers use same card data
   - No duplicate CSV loading logic
   - Consistent data across all tools

2. ✅ BETTER PERFORMANCE
   - Cards indexed by (set, number) for O(1) lookups
   - No repeated CSV parsing
   - Optional in-memory caching

3. ✅ AUTOMATIC DEDUPLICATION
   - English cards prioritized over Japanese
   - Japanese cards available as fallback
   - No duplicate handling needed in each scraper

4. ✅ ENHANCED SEARCH
   - manager.search_cards('term')
   - manager.search_cards_advanced(name='', set_code='', type='')
   - Flexible filtering options

5. ✅ FUTURE-PROOF
   - Easy to add new data sources
   - Simple to add caching or optimization
   - Centralized change point

6. ✅ EASIER DEBUGGING
   - manager.get_stats() for quick validation
   - export_merged_csv() for inspection
   - Centralized error handling

7. ✅ PROPER COLUMN NAMES
   - All CSVs use same schema: name, set, number, type, rarity, image_url
   - No more 'card_name' vs 'name' confusion
   - Standard field names across all databases
"""

# ============================================================================
# MIGRATION CHECKLIST
# ============================================================================

CHECKLIST = """
MIGRATION CHECKLIST
===================

For each scraper file:

[ ] 1. Add import at top:
       from card_data_manager import CardDataManager

[ ] 2. Replace CSV loading:
       OLD: cards = load_csv('dist/all_cards_database.csv')
       NEW: manager = CardDataManager()
            cards = manager.get_all_cards()

[ ] 3. Replace card lookups:
       OLD: card = next((c for c in cards if c['name'] == name), None)
       NEW: results = manager.search_cards(name)
            card = results[0] if results else None

[ ] 4. Update column references:
       OLD: row['card_name']  (❌ WRONG)
            row['card_id']    (❌ WRONG)
       NEW: row['name']       (✅ CORRECT)
            row['set']        (✅ CORRECT)
            row['number']     (✅ CORRECT)

[ ] 5. Test with both English and Japanese cards
       - Try lookup of English card (SP 251)
       - Try lookup of Japanese-only card
       - Verify image_url field is populated

[ ] 6. Remove old dist/all_cards_database.csv usage
       - Delete any hardcoded paths to 'dist/'
       - Use 'data/' directory instead
"""

# ============================================================================
# PRIORITY SCRAPERS TO UPDATE
# ============================================================================

PRIORITY = """
SCRAPERS TO UPDATE (by priority):
==================================

HIGH PRIORITY (used by deck builder):
  [ ] landing.html - Update card search/load
  [ ] current_meta_analysis_scraper.py
  [ ] city_league_analysis_scraper.py
  [ ] limitless_online_scraper.py

MEDIUM PRIORITY (City League tracking):
  [ ] tournament_scraper_JH.py

LOW PRIORITY (Utility scripts):
  [ ] debug scripts
  [ ] test scripts
"""

# ============================================================================
# SPECIFIC EXAMPLES FOR COMMON PATTERNS
# ============================================================================

PATTERNS = """
COMMON MIGRATION PATTERNS
=========================

Pattern 1: Loading all cards
  OLD:
    cards = []
    with open('dist/all_cards_database.csv') as f:
        reader = csv.DictReader(f)
        cards = list(reader)
  
  NEW:
    manager = CardDataManager()
    cards = manager.get_all_cards()


Pattern 2: Finding a specific card
  OLD:
    card = next((c for c in cards if c['name'] == 'Boss\'s Orders'), None)
  
  NEW:
    results = manager.search_cards('Boss\'s Orders', field='name')
    card = results[0] if results else None
    
    # Or directly if you have set and number:
    card = manager.get_card('SP', '251')


Pattern 3: Filtering by card type
  OLD:
    supporters = [c for c in cards if c['type'] == 'Supporter']
  
  NEW:
    supporters = manager.search_cards_advanced(card_type='Supporter')


Pattern 4: Finding cards in a specific set
  OLD:
    sp_cards = [c for c in cards if c['set'] == 'SP']
  
  NEW:
    sp_cards = manager.search_cards_advanced(set_code='SP')


Pattern 5: Complex filtering
  OLD:
    results = [c for c in cards if 'Charizard' in c['name'] 
               and c['set'] == 'SVP' and 'Rare' in c['rarity']]
  
  NEW:
    results = manager.search_cards_advanced(
        name='Charizard',
        set_code='SVP'
    )
    # Then filter by rarity if needed:
    results = [c for c in results if 'Rare' in c.get('rarity', '')]


Pattern 6: Getting card count/statistics
  OLD:
    total = len(cards)
    with_images = sum(1 for c in cards if c.get('image_url'))
  
  NEW:
    stats = manager.get_stats()
    total = stats['total_cards']
    with_images = stats['cards_with_image_url']
"""

print(BENEFITS)
print(CHECKLIST)
print(PRIORITY)
print(PATTERNS)

print("\n" + "=" * 80)
print("Next steps:")
print("  1. Review card_data_manager.py")
print("  2. Run it as test: python card_data_manager.py")
print("  3. Update scrapers one by one")
print("  4. Test each scraper after update")
print("=" * 80)
