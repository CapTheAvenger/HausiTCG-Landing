#!/usr/bin/env python3
"""
Master Card Database Update Orchestrator
==========================================
Coordinates full card database update pipeline:
  1. (Optional) Run card scrapers
  2. Merge English + Japanese databases
  3. Update landing.html data
  4. Generate statistics

Usage:
  python master_update.py                    # Full pipeline
  python master_update.py --scrape-only      # Only run scrapers
  python master_update.py --merge-only       # Only merge existing data
  python master_update.py --stats-only       # Show statistics
"""

import sys
import subprocess
import argparse
import json
from pathlib import Path
from card_data_manager import CardDataManager

def run_scrapers():
    """Run both English and Japanese card scrapers."""
    print("\n" + "=" * 80)
    print("PHASE 1: Running Card Scrapers")
    print("=" * 80 + "\n")
    
    # Ask which scrapers to run
    print("Scrapers to run:")
    print("  1 = English (auto-detect: full if no DB, else incremental)")
    print("  2 = Japanese (4 latest sets)")
    print("  3 = Both")
    print("  0 = Skip scrapers")
    print()
    
    choice = input("Choose (0-3): ").strip()
    
    if choice in ['1', '3']:
        print("\n[Orchestrator] Starting English card scraper...")
        result = subprocess.run([sys.executable, 'update_cards.py', '--type', 'english', '--mode', 'auto'])
        if result.returncode != 0:
            print("[Orchestrator] ✗ English scraper failed!")
            return False
    
    if choice in ['2', '3']:
        print("\n[Orchestrator] Starting Japanese card scraper...")
        result = subprocess.run([sys.executable, 'update_cards.py', '--type', 'japanese'])
        if result.returncode != 0:
            print("[Orchestrator] ✗ Japanese scraper failed!")
            return False
    
    return True

def merge_databases():
    """Merge English and Japanese databases."""
    print("\n" + "=" * 80)
    print("PHASE 2: Merging Databases")
    print("=" * 80 + "\n")
    
    try:
        # Run prepare_card_data
        result = subprocess.run([sys.executable, 'prepare_card_data.py'])
        return result.returncode == 0
    except Exception as e:
        print(f"[Orchestrator] ERROR merging databases: {e}")
        return False

def show_statistics():
    """Display database statistics."""
    print("\n" + "=" * 80)
    print("PHASE 3: Database Statistics")
    print("=" * 80 + "\n")
    
    try:
        manager = CardDataManager()
        stats = manager.get_stats()
        
        print(f"Total unique cards:     {stats['total_cards']:,}")
        print(f"  - English:            {stats['english_cards']:,}")
        print(f"  - Japanese:           {stats['japanese_cards']:,}")
        print(f"  - Japanese-only:      {stats['japanese_cards'] - (stats['total_cards'] - stats['english_cards']):,}")
        print(f"\nCards with image URLs:  {stats['cards_with_image_url']:,} ({100*stats['cards_with_image_url']//stats['total_cards']}%)" if stats['total_cards'] else "N/A")
        print(f"Unique sets:            {stats['unique_sets']}")
        
        # Show file sizes
        for db_file in ['data/all_cards_database.csv', 'data/japanese_cards_database.csv', 'data/all_cards_merged.csv']:
            path = Path(db_file)
            if path.exists():
                size_mb = path.stat().st_size / (1024**2)
                print(f"\n{db_file}:")
                print(f"  Size: {size_mb:.2f} MB")
        
        return True
    except Exception as e:
        print(f"[Orchestrator] ERROR loading statistics: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Master card database update orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python master_update.py                    # Full pipeline (interactive)
  python master_update.py --scrape-only      # Only run scrapers
  python master_update.py --merge-only       # Only merge databases
  python master_update.py --stats-only       # Show statistics only
        '''
    )
    
    parser.add_argument(
        '--scrape-only',
        action='store_true',
        help='Only run scrapers, skip merge and stats'
    )
    
    parser.add_argument(
        '--merge-only',
        action='store_true',
        help='Only merge existing databases, skip scrapers'
    )
    
    parser.add_argument(
        '--stats-only',
        action='store_true',
        help='Only show statistics'
    )
    
    parser.add_argument(
        '--no-interactive',
        action='store_true',
        help='Non-interactive mode (runs all phases)'
    )
    
    args = parser.parse_args()
    
    # Determine what to run
    if args.stats_only:
        return 0 if show_statistics() else 1
    
    if args.merge_only:
        return 0 if merge_databases() else 1
    
    if args.scrape_only:
        return 0 if run_scrapers() else 1
    
    # Full pipeline
    print("\n" + "=" * 80)
    print("MASTER CARD DATABASE UPDATE")
    print("=" * 80)
    
    success = True
    
    # Phase 1: Scrape
    if args.no_interactive:
        print("\n[Orchestrator] Running scrapers (auto-detect English, full Japanese)...")
        # Run both automatically
        subprocess.run([sys.executable, 'update_cards.py', '--type', 'english', '--mode', 'auto'])
        subprocess.run([sys.executable, 'update_cards.py', '--type', 'japanese'])
    else:
        success = run_scrapers()
    
    if not success:
        print("\n[Orchestrator] Scraper failed, continuing with existing data...")
    
    # Phase 2: Merge
    print("\n[Orchestrator] Merging databases...")
    if not merge_databases():
        print("[Orchestrator] ✗ Merge failed!")
        return 1
    
    # Phase 3: Statistics
    print("\n[Orchestrator] Displaying statistics...")
    if not show_statistics():
        print("[Orchestrator] ✗ Statistics failed!")
        return 1
    
    # Summary
    print("\n" + "=" * 80)
    print("✓ MASTER UPDATE COMPLETE!")
    print("=" * 80)
    print("\nNext steps:")
    print("  1. Deployed files:")
    print("     - data/all_cards_database.csv (English)")
    print("     - data/japanese_cards_database.csv (Japanese)")
    print("     - data/all_cards_merged.csv (Merged)")
    print("     - data/all_cards_merged.json (For landing.html)")
    print()
    print("  2. Available tools:")
    print("     - CardDataManager (Python module)")
    print("     - landing.html (Web UI)")
    print("     - Scrapers (city_league_analysis_scraper.py, etc.)")
    print()
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
