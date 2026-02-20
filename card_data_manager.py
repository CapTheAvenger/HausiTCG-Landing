#!/usr/bin/env python3
"""
Card Data Manager - Unified Card Database Access
==================================================
Central module for all scrapers to access card data.
Combines English + Japanese databases with deduplication and prioritization.

Usage:
    from card_data_manager import CardDataManager
    
    manager = CardDataManager()
    
    # Search for cards
    card = manager.get_card('Boss\'s Orders', 'SP', '251')
    cards = manager.search_cards('Charizard')
    
    # Get all cards
    all_cards = manager.get_all_cards()
"""

import csv
import os
import sys
from typing import List, Dict, Optional, Tuple
from pathlib import Path


def get_data_dir() -> str:
    """Get the correct data directory path.
    
    Returns:
        - 'data' if running as Python script from root
        - '../data' if running as EXE from dist/ folder (to access root/data/)
    """
    # If running as EXE and in 'dist' folder, go up one level
    if getattr(sys, "frozen", False):
        app_dir = os.path.dirname(sys.executable)
        if os.path.basename(app_dir).lower() == "dist":
            return os.path.join(app_dir, "..", "data")
    
    # Otherwise use 'data' relative to current directory
    return "data"


class CardDataManager:
    """Unified access to English and Japanese card databases."""
    
    def __init__(self):
        """Initialize the manager by loading both databases."""
        self.english_cards = []
        self.japanese_cards = []
        self.merged_cards = []
        self.card_index = {}  # (set, number) -> card dict
        
        self._load_databases()
        self._merge_and_deduplicate()
        self._build_index()
    
    def _load_databases(self):
        """Load both English and Japanese card databases."""
        data_dir = get_data_dir()
        
        # Load English cards
        english_path = Path(data_dir) / 'all_cards_database.csv'
        if english_path.exists():
            self.english_cards = self._load_csv(english_path)
            print(f"[CardDataManager] ✓ Loaded {len(self.english_cards)} English cards")
        else:
            print(f"[CardDataManager] ⚠ English database not found at {english_path}")
        
        # Load Japanese cards
        japanese_path = Path(data_dir) / 'japanese_cards_database.csv'
        if japanese_path.exists():
            self.japanese_cards = self._load_csv(japanese_path)
            print(f"[CardDataManager] ✓ Loaded {len(self.japanese_cards)} Japanese cards")
        else:
            print(f"[CardDataManager] ⚠ Japanese database not found at {japanese_path}")
    
    def _load_csv(self, filepath: Path) -> List[Dict[str, str]]:
        """Load cards from CSV file."""
        cards = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('name'):  # Skip empty rows
                        cards.append(row)
        except Exception as e:
            print(f"[CardDataManager] ERROR loading {filepath}: {e}")
        return cards
    
    def _merge_and_deduplicate(self):
        """
        Merge English and Japanese cards with deduplication.
        Priority: English preferred, Japanese as fallback for newer cards.
        """
        seen_keys = set()
        
        # Add English cards first (priority)
        for card in self.english_cards:
            key = (card.get('set', ''), card.get('number', ''))
            if key and key not in seen_keys:
                self.merged_cards.append(card)
                seen_keys.add(key)
        
        # Add Japanese cards not already in English
        for card in self.japanese_cards:
            key = (card.get('set', ''), card.get('number', ''))
            if key and key not in seen_keys:
                # Mark as Japanese-only
                card['_source'] = 'japanese'
                self.merged_cards.append(card)
                seen_keys.add(key)
        
        print(f"[CardDataManager] ✓ Merged to {len(self.merged_cards)} unique cards")
        print(f"[CardDataManager]   - {len(self.english_cards)} from English DB")
        print(f"[CardDataManager]   - {len(self.japanese_cards) - (len(self.merged_cards) - len(self.english_cards))} Japanese-only")
    
    def _build_index(self):
        """Build lookup index for O(1) card access."""
        self.card_index = {}
        for card in self.merged_cards:
            key = (card.get('set', '').upper(), card.get('number', ''))
            if key[0] and key[1]:
                self.card_index[key] = card
    
    def get_card(self, set_code: str, number: str) -> Optional[Dict[str, str]]:
        """
        Get a specific card by set code and number.
        
        Args:
            set_code: Card set code (e.g., 'SP', 'ASC', 'DRI')
            number: Card number in set (e.g., '251', '26')
        
        Returns:
            Card dictionary or None if not found
        """
        key = (set_code.upper(), number)
        return self.card_index.get(key)
    
    def get_card_by_name_and_set(self, name: str, set_code: str) -> Optional[Dict[str, str]]:
        """
        Get a card by name and set code (when number is unknown).
        Returns the first match.
        
        Args:
            name: Card name
            set_code: Card set code
        
        Returns:
            Card dictionary or None if not found
        """
        for card in self.merged_cards:
            if (card.get('name', '').lower() == name.lower() and 
                card.get('set', '').upper() == set_code.upper()):
                return card
        return None
    
    def search_cards(self, query: str, field: str = 'name') -> List[Dict[str, str]]:
        """
        Search for cards by name or other field.
        
        Args:
            query: Search term (case-insensitive substring match)
            field: Field to search in (default: 'name')
        
        Returns:
            List of matching cards
        """
        results = []
        query_lower = query.lower()
        
        for card in self.merged_cards:
            if field in card and query_lower in card[field].lower():
                results.append(card)
        
        return results
    
    def search_cards_advanced(self, name: str = None, set_code: str = None, 
                             card_type: str = None) -> List[Dict[str, str]]:
        """
        Advanced search with multiple criteria.
        
        Args:
            name: Card name (substring, case-insensitive)
            set_code: Set code (case-insensitive)
            card_type: Card type (substring, case-insensitive)
        
        Returns:
            List of matching cards
        """
        results = self.merged_cards
        
        if name:
            results = [c for c in results if name.lower() in c.get('name', '').lower()]
        
        if set_code:
            results = [c for c in results if c.get('set', '').upper() == set_code.upper()]
        
        if card_type:
            results = [c for c in results if card_type.lower() in c.get('type', '').lower()]
        
        return results
    
    def get_all_cards(self) -> List[Dict[str, str]]:
        """Get all merged cards."""
        return self.merged_cards
    
    def get_stats(self) -> Dict[str, int]:
        """Get database statistics."""
        return {
            'total_cards': len(self.merged_cards),
            'english_cards': len(self.english_cards),
            'japanese_cards': len(self.japanese_cards),
            'cards_with_image_url': sum(1 for c in self.merged_cards if c.get('image_url')),
            'unique_sets': len(set(c.get('set') for c in self.merged_cards if c.get('set')))
        }
    
    def export_merged_csv(self, output_path: str = 'data/cards_merged.csv'):
        """Export merged database to CSV."""
        if not self.merged_cards:
            print(f"[CardDataManager] ERROR: No cards to export")
            return False
        
        try:
            os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
            
            fieldnames = ['name', 'set', 'number', 'type', 'rarity', 'image_url']
            
            with open(output_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for card in self.merged_cards:
                    writer.writerow({field: card.get(field, '') for field in fieldnames})
            
            print(f"[CardDataManager] ✓ Exported {len(self.merged_cards)} cards to {output_path}")
            return True
        except Exception as e:
            print(f"[CardDataManager] ERROR exporting CSV: {e}")
            return False


# Example usage / testing
if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("CARD DATA MANAGER - Testing")
    print("=" * 80 + "\n")
    
    # Initialize manager
    manager = CardDataManager()
    
    # Print stats
    stats = manager.get_stats()
    print(f"\nDatabase Statistics:")
    print(f"  Total unique cards: {stats['total_cards']}")
    print(f"  English cards: {stats['english_cards']}")
    print(f"  Japanese cards: {stats['japanese_cards']}")
    print(f"  Cards with image URL: {stats['cards_with_image_url']}")
    print(f"  Unique sets: {stats['unique_sets']}")
    
    # Test search
    print(f"\n\nSearching for 'Boss':")
    results = manager.search_cards("Boss")
    for card in results[:5]:
        print(f"  - {card['name']} ({card['set']} {card['number']})")
    if len(results) > 5:
        print(f"  ... and {len(results) - 5} more")
    
    # Test advanced search
    print(f"\n\nSearching for Supporters:")
    supporters = manager.search_cards_advanced(card_type='Supporter')
    print(f"  Found {len(supporters)} Supporter cards")
    
    # Test specific card lookup
    print(f"\n\nLooking up specific card:")
    card = manager.get_card('SP', '251')
    if card:
        print(f"  ✓ Found: {card['name']} ({card['set']} {card['number']})")
        if card.get('image_url'):
            print(f"    Image: {card['image_url'][:60]}...")
    else:
        print(f"  ✗ Card not found")
    
    # Export merged database
    print(f"\n\nExporting merged database...")
    manager.export_merged_csv()
    
    print("\n" + "=" * 80)
    print("✓ Card Data Manager ready for use!")
    print("=" * 80 + "\n")
