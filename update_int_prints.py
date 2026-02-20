#!/usr/bin/env python3
"""
Update International Prints in existing all_cards_database.csv
Reads existing CSV and updates ONLY the international_prints column
"""

import csv
import sys
import time
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Set working directory to script location
# Handle both frozen (PyInstaller) and normal Python execution
if getattr(sys, 'frozen', False):
    # Running as compiled executable in dist/ folder
    # Need to go to parent directory where data/ folder is
    SCRIPT_DIR = Path(sys.executable).parent.parent.absolute()
else:
    # Running as Python script
    SCRIPT_DIR = Path(__file__).parent.absolute()

os.chdir(SCRIPT_DIR)
print(f"Working directory: {os.getcwd()}")
print()

def create_browser():
    """Create and configure Chrome WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    return webdriver.Chrome(options=chrome_options)

def extract_int_prints(driver, set_code, number):
    """Extract international prints for a card"""
    try:
        # Build URL
        url = f"https://limitlesstcg.com/cards/{set_code}/{number}"
        driver.get(url)
        time.sleep(1)  # Quick wait
        
        # Find Int. Prints table links
        int_prints_links = driver.find_elements(By.CSS_SELECTOR, ".card-prints-versions a[href^='/cards/']")
        
        int_prints = set()
        for link in int_prints_links:
            href = link.get_attribute('href')
            if href:
                path = href.split('/cards/')[-1].strip()
                parts = path.split('/')
                
                # Only process SET/NUMBER format (skip Japanese cards)
                if len(parts) == 2 and parts[1].replace('-', '').replace('a', '').replace('b', '').isdigit():
                    card_id = f"{parts[0]}-{parts[1]}"
                    int_prints.add(card_id)
        
        # Always include current card
        current_id = f"{set_code}-{number}"
        int_prints.add(current_id)
        
        return ','.join(sorted(list(int_prints)))
    
    except Exception as e:
        # Check if it's a session error
        error_msg = str(e).lower()
        if 'invalid session' in error_msg or 'session' in error_msg:
            raise  # Re-raise session errors so they can be handled upstream
        
        print(f"    ERROR: {e}")
        # Fallback to current card only
        return f"{set_code}-{number}"

# Main execution
try:
    print("="*60)
    print("UPDATE INTERNATIONAL PRINTS IN ALL_CARDS_DATABASE.CSV")
    print("="*60)
    print()

    # Read existing CSV
    csv_path = "data/all_cards_database.csv"
    print(f"Reading: {csv_path}")

    cards = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cards.append(row)

    print(f"Loaded {len(cards)} cards")
    print()

    # Create browser
    print("Starting browser...")
    driver = create_browser()
    print("✓ Browser ready")
    print()

    # Update international prints
    print("Updating international prints...")
    print("(This will take a while - ~1-2 seconds per card)")
    print()

    try:
        for i, card in enumerate(cards):
            # Skip if already has multiple prints
            current_prints = card.get('international_prints', '')
            if current_prints and ',' in current_prints:
                print(f"[{i+1}/{len(cards)}] {card['name']} ({card['set']} {card['number']}) - Already has prints: {current_prints}")
                continue
            
            print(f"[{i+1}/{len(cards)}] {card['name']} ({card['set']} {card['number']})...", end='', flush=True)
            
            # Extract int. prints (with retry on session error)
            max_retries = 3
            for retry in range(max_retries):
                try:
                    new_prints = extract_int_prints(driver, card['set'], card['number'])
                    card['international_prints'] = new_prints
                    break  # Success!
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    if 'invalid session' in error_msg or 'session' in error_msg:
                        print(f"\n    ⚠ Session lost! Restarting browser...")
                        try:
                            driver.quit()
                        except:
                            pass
                        driver = create_browser()
                        print(f"    ✓ Browser restarted, retrying card...")
                        if retry < max_retries - 1:
                            continue  # Retry
                        else:
                            # Max retries reached, use fallback
                            print(f"    ✗ Max retries reached, using fallback")
                            card['international_prints'] = f"{card['set']}-{card['number']}"
                    else:
                        # Other error, use fallback
                        card['international_prints'] = f"{card['set']}-{card['number']}"
                        break
            
            # Show result if multiple prints found
            if ',' in card['international_prints']:
                print(f" → {card['international_prints']}")
            else:
                print(f" (only {card['international_prints']})")
            
            # Progressive save every 100 cards
            if (i + 1) % 100 == 0:
                print()
                print(f"CHECKPOINT: Saving progress ({i+1} cards updated)...")
                with open(csv_path, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=['name', 'set', 'number', 'type', 'rarity', 'image_url', 'international_prints'])
                    writer.writeheader()
                    writer.writerows(cards)
                print("✓ Saved!")
                print()
            
            # Restart browser every 1000 cards to prevent session issues
            if (i + 1) % 1000 == 0:
                print()
                print(f"🔄 Preventive browser restart after {i+1} cards...")
                try:
                    driver.quit()
                except:
                    pass
                driver = create_browser()
                print("✓ Browser restarted!")
                print()
            
            # Small delay to be nice to Limitless servers
            time.sleep(0.5)

    finally:
        driver.quit()

    # Final save
    print()
    print("="*60)
    print("FINAL SAVE")
    print("="*60)
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'set', 'number', 'type', 'rarity', 'image_url', 'international_prints'])
        writer.writeheader()
        writer.writerows(cards)

    print(f"✓ Updated {len(cards)} cards")
    print()

    # Show some examples
    print("Sample cards with multiple prints:")
    multi_print_cards = [c for c in cards if ',' in c.get('international_prints', '')]
    for card in multi_print_cards[:10]:
        print(f"  {card['name']} ({card['set']} {card['number']}): {card['international_prints']}")

    print()
    print("="*60)
    print("✓ UPDATE COMPLETE!")
    print("="*60)

except Exception as e:
    print()
    print("="*60)
    print("❌ FEHLER: Update abgebrochen!")
    print("="*60)
    print(f"\nFehler: {e}")
    import traceback
    traceback.print_exc()
    print()
    print("="*60)

finally:
    # ALWAYS keep console open (even on errors when run directly)
    print()
    input("Drücke ENTER zum Beenden...")


