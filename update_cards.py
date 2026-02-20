#!/usr/bin/env python3
"""
Master Card Database Updater
=============================
Unified interface for card database updates:
  python update_cards.py --mode full        (complete redownload, ~3-4 hours)
  python update_cards.py --mode incremental (new cards only, ~5-10 minutes)
  python update_cards.py                    (auto-detect: incremental if exists, full otherwise)
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

def check_database_exists(db_type='english'):
    """Check if card database already exists."""
    if db_type == 'english':
        return Path('data/all_cards_database.csv').exists()
    elif db_type == 'japanese':
        return Path('data/japanese_cards_database.csv').exists()
    return False

def run_full_scrape():
    """Run complete English card scraper."""
    print("\n" + "=" * 80)
    print("STARTING FULL ENGLISH CARD DATABASE SCRAPER")
    print("Warning: This will download ALL English cards - takes ~3-4 hours")
    print("=" * 80)
    
    result = subprocess.run([sys.executable, 'all_cards_scraper.py'])
    return result.returncode == 0

def run_incremental_scrape():
    """Run incremental English card scraper."""
    print("\n" + "=" * 80)
    print("STARTING INCREMENTAL ENGLISH CARD DATABASE UPDATE")
    print("This will only download new English cards - takes ~5-10 minutes per new set")
    print("=" * 80)
    
    if not check_database_exists('english'):
        print("\n[ERROR] No existing English database found!")
        print("[INFO] Run with --mode full for initial download")
        return False
    
    result = subprocess.run([sys.executable, 'all_cards_scraper_incremental.py'])
    return result.returncode == 0

def run_japanese_scrape():
    """Run Japanese card scraper (4 latest sets, full overwrite each time)."""
    print("\n" + "=" * 80)
    print("STARTING JAPANESE CARD DATABASE SCRAPER")
    print("This will download the 4 latest Japanese sets - takes ~30-45 minutes")
    print("(CSV will be completely overwritten, not appended)")
    print("=" * 80)
    
    result = subprocess.run([sys.executable, 'japanese_cards_scraper.py'])
    return result.returncode == 0

def main():
    parser = argparse.ArgumentParser(
        description='Update Pokemon TCG card database from Limitless TCG',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python update_cards.py                         # Auto-detect English (incremental if DB exists)
  python update_cards.py --mode full             # Full English download (3-4 hours)
  python update_cards.py --mode incremental      # Only new English cards (5-10 min)
  python update_cards.py --type japanese         # Japanese 4 latest sets (30-45 min)
  python update_cards.py --type japanese --mode full  # Force Japanese redownload
        '''
    )
    
    parser.add_argument(
        '--type',
        choices=['english', 'japanese'],
        default='english',
        help='Card type to update (default: english)'
    )
    
    parser.add_argument(
        '--mode',
        choices=['full', 'incremental', 'auto'],
        default='auto',
        help='Update mode (default: auto-detect for English, full for Japanese)'
    )
    
    args = parser.parse_args()
    
    # Handle Japanese (always full overwrite)
    if args.type == 'japanese':
        print("[INFO] Japanese cards: Always doing full scrape (4 latest sets overwrite)")
        success = run_japanese_scrape()
    else:
        # English - auto-detect mode if needed
        if args.mode == 'auto':
            if check_database_exists('english'):
                print("[INFO] Existing English database found - using INCREMENTAL mode")
                print("[INFO] (Use --mode full to force complete redownload)")
                mode = 'incremental'
            else:
                print("[INFO] No existing English database - using FULL mode")
                mode = 'full'
        else:
            mode = args.mode
        
        # Run appropriate scraper for English
        success = False
        if mode == 'full':
            success = run_full_scrape()
        elif mode == 'incremental':
            success = run_incremental_scrape()
    
    # Final status
    print("\n" + "=" * 80)
    if success:
        # Try to count cards
        total_cards = 0
        db_file = 'data/japanese_cards_database.csv' if args.type == 'japanese' else 'data/all_cards_database.csv'
        try:
            with open(db_file, 'r') as f:
                total_cards = sum(1 for _ in f) - 1  # Subtract header
        except:
            pass
        
        db_type = 'Japanese' if args.type == 'japanese' else 'English'
        print(f"✓ SUCCESS! {db_type} database now has {total_cards} cards")
        print(f"✓ Location: {db_file}")
    else:
        print("✗ UPDATE FAILED - Check error messages above")
    print("=" * 80)
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
