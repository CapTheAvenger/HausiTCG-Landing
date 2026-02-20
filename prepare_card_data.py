#!/usr/bin/env python3
"""
Card Database Updater for landing.html
========================================
Export merged card database to format that landing.html can load.

Creates JavaScript-compatible JSON that includes:
- All English cards (primary)
- All Japanese cards (fallback for City League data)
- Full data with image URLs
"""

import json
import csv
import os
from pathlib import Path
from typing import List, Dict

def load_csv(filepath: str) -> List[Dict]:
    """Load CSV file."""
    cards = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('name'):
                    cards.append(row)
    except FileNotFoundError:
        pass
    return cards

def create_merged_database():
    """Create merged database with both English and Japanese cards."""
    
    print("=" * 80)
    print("UPDATING landing.html CARD DATA")
    print("=" * 80)
    print()
    
    # Load databases
    english_cards = load_csv('data/all_cards_database.csv')
    japanese_cards = load_csv('data/japanese_cards_database.csv')
    
    print(f"[Updater] Loaded {len(english_cards)} English cards")
    print(f"[Updater] Loaded {len(japanese_cards)} Japanese cards")
    
    # Merge with deduplication
    seen_keys = set()
    merged = []
    
    # Add English first (priority)
    for card in english_cards:
        key = (card.get('set', ''), card.get('number', ''))
        if key and key not in seen_keys:
            merged.append(card)
            seen_keys.add(key)
    
    # Add Japanese that aren't in English
    for card in japanese_cards:
        key = (card.get('set', ''), card.get('number', ''))
        if key and key not in seen_keys:
            card['_japanese_only'] = True
            merged.append(card)
            seen_keys.add(key)
    
    print(f"[Updater] Merged to {len(merged)} unique cards")
    
    # Export as JSON for landing.html
    os.makedirs('data', exist_ok=True)
    
    json_output = {
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'total_cards': len(merged),
        'english_count': len(english_cards),
        'japanese_count': sum(1 for c in merged if c.get('_japanese_only')),
        'cards': merged
    }
    
    # Save JSON
    json_path = 'data/all_cards_merged.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_output, f, indent=2, ensure_ascii=False)
    
    print(f"[Updater] ✓ Saved to {json_path}")
    
    # Also save as CSV for other tools
    csv_path = 'data/all_cards_merged.csv'
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['name', 'set', 'number', 'type', 'rarity', 'image_url']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for card in merged:
            writer.writerow({field: card.get(field, '') for field in fieldnames})
    
    print(f"[Updater] ✓ Saved to {csv_path}")
    
    # Summary
    with_images = sum(1 for c in merged if c.get('image_url'))
    print()
    print(f"Database Summary:")
    print(f"  Total cards: {len(merged)}")
    print(f"  Cards with image URLs: {with_images} ({100*with_images//len(merged)}%)" if merged else "")
    print(f"  Unique sets: {len(set(c.get('set') for c in merged if c.get('set')))}")
    
    return True

if __name__ == '__main__':
    try:
        create_merged_database()
        print()
        print("=" * 80)
        print("✓ Card databases updated for landing.html!")
        print("=" * 80)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
