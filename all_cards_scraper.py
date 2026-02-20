#!/usr/bin/env python3
"""
All Cards Scraper - Scrape ALL Pokemon Cards from Limitless TCG
================================================================
Scrapes complete card data including image URLs and reprints.
Extracts: Name, Set Code, Set Number, Type, Rarity, Image URL
Supports pagination to get all cards.
"""

import csv
import json
import os
import sys
import time
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin

# Fix Windows console encoding for Unicode characters (✓, •, etc.)
if sys.platform == 'win32':
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    if hasattr(sys.stderr, 'reconfigure'):
        try:
            sys.stderr.reconfigure(encoding='utf-8')
        except Exception:
            pass

print("=" * 80)
print("ALL CARDS SCRAPER - Scraping ALL Cards from Limitless TCG")
print("=" * 80)
print()

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("[ERROR] Selenium not available! Install with: pip install selenium")
    exit(1)

DEFAULT_SETTINGS = {
    "start_page": 1,
    "end_page": None,   # None = no limit, or set to e.g. 10 to scrape pages 1-10
    "max_pages": None,  # None = all pages, or set to e.g. 3 for testing (alternative to end_page)
    "set_filter": [],   # Empty = all sets, or e.g. ["ASC", "SVI", "TWM"] for specific sets
    "append": True,
    "rescrape_incomplete": True,  # True = re-scrape cards missing image_url or rarity
    "headless": True,
    "skip_detail_scraping": False,  # True = only scrape list (fast), False = scrape details too
    "list_page_delay_seconds": 1.0,
    "detail_page_wait_seconds": 2.0,
    "detail_request_delay_seconds": 0.5
}


def get_app_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def get_data_dir() -> str:
    """Get the correct data directory path.
    
    Returns:
        - 'data' if running as Python script from root
        - '../data' if running as EXE from dist/ folder (to write to root/data/)
    """
    app_dir = get_app_dir()
    
    # If running as EXE and in 'dist' folder, go up one level
    if getattr(sys, "frozen", False) and app_dir.endswith("dist"):
        return os.path.join(app_dir, "..", "data")
    
    # Otherwise use 'data' relative to current directory
    return "data"


def load_settings() -> Dict[str, object]:
    settings = DEFAULT_SETTINGS.copy()
    app_dir = get_app_dir()
    candidates = [
        os.path.join(app_dir, "all_cards_scraper_settings.json"),
        os.path.join(os.getcwd(), "all_cards_scraper_settings.json"),
        os.path.join(app_dir, "data", "all_cards_scraper_settings.json")
    ]

    settings_path = None
    for path in candidates:
        if os.path.isfile(path):
            settings_path = path
            break

    if settings_path:
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                settings.update(loaded)
            print(f"[All Cards Scraper] Loaded settings: {settings_path}")
        except Exception as e:
            print(f"[All Cards Scraper] WARNING: Failed to load settings: {e}")
    else:
        print("[All Cards Scraper] No settings file found. Using defaults.")

    return settings

def scrape_all_cards_list(settings: Dict[str, object], start_page: int = 1, existing_keys: Optional[set] = None) -> List[Dict[str, str]]:
    """Scrape card names and basic info from the Limitless TCG card list."""
    print("[All Cards Scraper] Starting Selenium WebDriver...")
    
    chrome_options = Options()
    if settings.get("headless", True):
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    all_cards_data = []
    if existing_keys is None:
        existing_keys = set()
    
    # Get settings
    max_pages = settings.get("max_pages")
    end_page = settings.get("end_page")
    set_filter = settings.get("set_filter", [])
    
    if max_pages:
        print(f"[All Cards Scraper] MAX PAGES LIMIT: {max_pages} (for testing)")
    if end_page:
        print(f"[All Cards Scraper] END PAGE: {end_page} (pages {start_page}-{end_page})")
    if set_filter:
        print(f"[All Cards Scraper] SET FILTER ACTIVE: {', '.join(set_filter)}")
    
    try:
        # Use pagination to load all cards reliably
        base_url = "https://limitlesstcg.com/cards?q=lang%3Aen&display=list"
        print(f"[All Cards Scraper] Loading English cards: {base_url}")

        seen_keys = set()
        seen_pages = set()
        page_index = max(1, start_page)
        next_url = base_url if start_page <= 1 else f"{base_url}&page={start_page}"

        while next_url:
            # Check max_pages limit
            if max_pages and page_index > max_pages:
                print(f"[All Cards Scraper] Reached max_pages limit ({max_pages}). Stopping.")
                break
            
            # Check end_page limit
            if end_page and page_index > end_page:
                print(f"[All Cards Scraper] Reached end_page ({end_page}). Stopping.")
                break
            
            if next_url in seen_pages:
                print("[All Cards Scraper] WARNING: Detected repeated page URL. Stopping.")
                break
            seen_pages.add(next_url)

            print(f"[All Cards Scraper] Loading page {page_index}: {next_url}")
            driver.get(next_url)

            # Wait for table rows to appear
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "tbody tr"))
                )
            except Exception:
                print("[All Cards Scraper] ERROR: Table rows not found on this page.")
                break

            # Extract data from table rows
            rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")
            print(f"[All Cards Scraper] Found {len(rows)} cards on page {page_index}")

            new_added_on_page = 0
            filtered_out_on_page = 0

            for idx, row in enumerate(rows):
                try:
                    cells = row.find_elements(By.TAG_NAME, "td")

                    if len(cells) >= 4:
                        # Extract data - column order: Set, No, Name, Type
                        set_code = cells[0].get_attribute('textContent').strip()
                        set_number = cells[1].get_attribute('textContent').strip()
                        card_name = cells[2].get_attribute('textContent').strip()
                        card_type = cells[3].get_attribute('textContent').strip()
                        
                        # Apply set_filter if specified
                        if set_filter and set_code not in set_filter:
                            filtered_out_on_page += 1
                            continue

                        # Try to get card link for detail page
                        try:
                            link_elem = cells[2].find_element(By.TAG_NAME, "a")
                            card_url = link_elem.get_attribute('href')
                        except:
                            card_url = None

                        if card_name:
                            key = f"{card_name}::{set_code}::{set_number}"
                            if key in seen_keys or key in existing_keys:
                                continue
                            seen_keys.add(key)
                            all_cards_data.append({
                                'name': card_name,
                                'set': set_code,
                                'number': set_number,
                                'type': card_type,
                                'card_url': card_url,
                                'image_url': '',
                                'rarity': '',
                                'international_prints': ''
                            })
                            new_added_on_page += 1

                            if (len(all_cards_data)) % 500 == 0:
                                print(f"[All Cards Scraper]   Processed {len(all_cards_data)} cards so far...")
                except Exception:
                    continue
            
            if filtered_out_on_page > 0:
                print(f"[All Cards Scraper]   Filtered out {filtered_out_on_page} cards (not in set_filter)")

            # Find next page link
            next_link = None
            next_selectors = [
                ".pagination a[rel='next']",
                ".pagination .page-item.next a",
                ".pagination a[aria-label='Next']"
            ]
            for selector in next_selectors:
                elems = driver.find_elements(By.CSS_SELECTOR, selector)
                if elems:
                    next_link = elems[0]
                    break

            if not next_link:
                if len(rows) == 0 or new_added_on_page == 0:
                    print("[All Cards Scraper] Reached last page (no next link).")
                    break
                next_url = f"{base_url}&page={page_index + 1}"
                page_index += 1
                time.sleep(float(settings.get("list_page_delay_seconds", 1.0)))
                continue

            parent = next_link.find_element(By.XPATH, "..")
            parent_class = parent.get_attribute("class") or ""
            if "disabled" in parent_class.lower():
                print("[All Cards Scraper] Reached last page (next disabled).")
                break

            href = next_link.get_attribute("href")
            if not href:
                print("[All Cards Scraper] No href on next link. Stopping.")
                break

            next_url = href
            page_index += 1
            time.sleep(float(settings.get("list_page_delay_seconds", 1.0)))
        
    except Exception as e:
        print(f"[All Cards Scraper] ERROR during list scraping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()
    
    print(f"\n[All Cards Scraper] OK: Extracted {len(all_cards_data)} cards from list")
    return all_cards_data


def load_existing_cards(csv_path: str, rescrape_incomplete: bool = True) -> (List[Dict[str, str]], set, List[Dict[str, str]]):
    """Load existing cards from CSV to avoid duplicates and allow append mode.
    
    Returns:
        - existing_cards: Complete cards to keep (will be combined with newly scraped data)
        - existing_keys: Set of unique identifiers for all cards (complete + incomplete)
        - incomplete_cards: Cards missing image_url or rarity that should be re-scraped
    """
    if not os.path.isfile(csv_path):
        return [], set(), []

    complete_cards = []
    incomplete_cards = []
    existing_keys = set()
    
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row:
                continue
            name = (row.get('name') or '').strip()
            set_code = (row.get('set') or '').strip()
            set_number = (row.get('number') or '').strip()
            image_url = (row.get('image_url') or '').strip()
            rarity = (row.get('rarity') or '').strip()
            
            card_data = {
                'name': name,
                'set': set_code,
                'number': set_number,
                'type': (row.get('type') or '').strip(),
                'rarity': rarity,
                'image_url': image_url,
                'international_prints': (row.get('international_prints') or '').strip(),
                'card_url': ''
            }
            
            if name and set_code and set_number:
                key = f"{name}::{set_code}::{set_number}"
                existing_keys.add(key)
                
                # Check if card is complete or incomplete
                is_complete = bool(image_url and rarity)
                
                if is_complete:
                    complete_cards.append(card_data)
                elif rescrape_incomplete:
                    # Add to incomplete list for re-scraping
                    incomplete_cards.append(card_data)
                else:
                    # Keep incomplete cards as-is if not re-scraping
                    complete_cards.append(card_data)

    total_count = len(complete_cards) + len(incomplete_cards)
    complete_count = len(complete_cards)
    incomplete_count = len(incomplete_cards)
    
    print(f"[All Cards Scraper] Loaded {total_count} existing cards from CSV")
    print(f"[All Cards Scraper]   ✓ {complete_count} cards are complete (have image_url + rarity)")
    
    if rescrape_incomplete and incomplete_count > 0:
        print(f"[All Cards Scraper]   ⚠ {incomplete_count} cards are incomplete and will be re-scraped")
    elif incomplete_count > 0:
        print(f"[All Cards Scraper]   ⚠ {incomplete_count} cards are incomplete (kept as-is, rescrape_incomplete=False)")
    
    return complete_cards, existing_keys, incomplete_cards


def scrape_card_details(settings: Dict[str, object], cards: List[Dict[str, str]], 
                        existing_cards: List[Dict[str, str]], csv_path: str, append_mode: bool) -> List[Dict[str, str]]:
    """Scrape detail page for each card to get image URL and rarity.
    
    Writes CSV progressively every 100 cards so other tools can use updated data while scraping continues.
    Browser is restarted every 1000 cards to prevent session timeout issues.
    """
    print(f"\n[All Cards Scraper] Now scraping detail pages for {len(cards)} cards...")
    print("[All Cards Scraper] This may take a while - opening ~1 page per card...")
    print("[All Cards Scraper] CSV will be updated every 100 cards with latest details...")
    print("[All Cards Scraper] Browser will restart every 1000 cards to prevent session issues...")
    
    def create_browser():
        """Create a new Chrome browser instance with standard settings."""
        chrome_options = Options()
        if settings.get("headless", True):
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        return webdriver.Chrome(options=chrome_options)
    
    driver = create_browser()
    restart_counter = 0  # Track cards processed since last restart
    
    def write_csv_batch():
        """Write all cards (existing + new with current details) to CSV."""
        all_data = (existing_cards + cards) if append_mode else cards
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['name', 'set', 'number', 'type', 'rarity', 'image_url', 'international_prints']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for card in all_data:
                writer.writerow({
                    'name': card.get('name', ''),
                    'set': card.get('set', ''),
                    'number': card.get('number', ''),
                    'type': card.get('type', ''),
                    'rarity': card.get('rarity', ''),
                    'image_url': card.get('image_url', ''),
                    'international_prints': card.get('international_prints', '')
                })
    
    try:
        for idx, card in enumerate(cards):
            try:
                if not card.get('card_url'):
                    # Skip cards without URL
                    continue
                
                # Browser restart every 1000 cards to prevent session timeout
                if restart_counter >= 1000:
                    print(f"\n[All Cards Scraper] BROWSER RESTART: Processed {restart_counter} cards, restarting browser...")
                    try:
                        driver.quit()
                    except:
                        pass
                    driver = create_browser()
                    restart_counter = 0
                    print("[All Cards Scraper] Browser restarted successfully!")
                
                # Build full URL if relative
                if card['card_url'].startswith('/'):
                    full_url = f"https://limitlesstcg.com{card['card_url']}"
                else:
                    full_url = card['card_url']
                
                print(f"[All Cards Scraper] [{idx+1}/{len(cards)}] {card['name']} ({card['set']} {card['number']})...")
                
                # Try to load the page with session recovery
                max_retries = 3
                for retry in range(max_retries):
                    try:
                        driver.get(full_url)
                        break  # Success, exit retry loop
                    except Exception as e:
                        error_msg = str(e).lower()
                        if 'invalid session id' in error_msg or 'session' in error_msg:
                            print(f"[All Cards Scraper] SESSION ERROR detected: {e}")
                            if retry < max_retries - 1:
                                print(f"[All Cards Scraper] RECOVERING: Restarting browser (retry {retry+1}/{max_retries})...")
                                try:
                                    driver.quit()
                                except:
                                    pass
                                driver = create_browser()
                                restart_counter = 0
                                time.sleep(2)  # Wait a bit before retrying
                            else:
                                print(f"[All Cards Scraper] FAILED after {max_retries} retries, skipping card")
                                raise
                        else:
                            raise  # Re-raise if it's not a session error
                
                # Wait for image to load
                time.sleep(float(settings.get("detail_page_wait_seconds", 2.0)))
                
                # Extract image URL from <img class="card shadow resp-w">
                try:
                    img_elem = driver.find_element(By.CSS_SELECTOR, "img.card.shadow.resp-w")
                    image_url = img_elem.get_attribute('src')
                    if image_url:
                        card['image_url'] = image_url
                except:
                    pass
                
                # Extract rarity from card-prints div
                try:
                    # Look for rarity in the prints section
                    rarity_elem = driver.find_element(By.CSS_SELECTOR, ".card-prints-current .prints-current-details span.text-lg")
                    rarity_text = rarity_elem.get_attribute('textContent').strip()
                    # Try to find rarity in second span
                    rarity_spans = driver.find_elements(By.CSS_SELECTOR, ".card-prints-current .prints-current-details span")
                    if len(rarity_spans) >= 2:
                        rarity_info = rarity_spans[1].get_attribute('textContent').strip()
                        # Extract rarity from format like "· Double Rare"
                        if '·' in rarity_info:
                            rarity = rarity_info.split('·')[1].strip()
                            card['rarity'] = rarity
                except:
                    pass
                
                # Extract International Prints from "Int. Prints" table (the ONLY reliable source!)
                # This table shows ALL functionally identical cards across sets, regardless of artwork/illustrator
                try:
                    # Find all links in the "Int. Prints" section
                    # The table has class "card-prints-versions" and links like /cards/ASC/113, /cards/MEG/77, etc.
                    int_prints_links = driver.find_elements(By.CSS_SELECTOR, ".card-prints-versions a[href^='/cards/']")
                    
                    if int_prints_links:
                        # Collect all international print set-number combinations
                        int_prints = set()
                        for link in int_prints_links:
                            href = link.get_attribute('href')
                            # Extract card ID from URL:
                            # - '/cards/ASC/32' -> 'ASC-32'
                            # - 'https://limitlesstcg.com/cards/JTG/26' -> 'JTG-26'
                            # - Skip Japanese cards like '/cards/jp/SV9/15'
                            if href:
                                # Get path after '/cards/'
                                path = href.split('/cards/')[-1].strip()
                                # Split by '/' to get parts
                                parts = path.split('/')
                                
                                # Only process if format is SET/NUMBER (2 parts)
                                # Skip Japanese cards (jp/SET/NUMBER = 3 parts)
                                # Skip other paths like 'advanced', 'syntax', 'decklists', etc.
                                if len(parts) == 2 and parts[1].isdigit():
                                    card_id = f"{parts[0]}-{parts[1]}"
                                    int_prints.add(card_id)
                        
                        # Always add current card's ID
                        current_id = f"{card['set']}-{card['number']}"
                        int_prints.add(current_id)
                        
                        # Store as comma-separated string for CSV compatibility
                        card['international_prints'] = ','.join(sorted(list(int_prints)))
                        
                        if len(int_prints) > 1:
                            print(f"   → Found {len(int_prints)} int. prints: {', '.join(sorted(list(int_prints))[:4])}{'...' if len(int_prints) > 4 else ''}")
                    else:
                        # No international prints found - just use current card
                        card['international_prints'] = f"{card['set']}-{card['number']}"
                except Exception as e:
                    # Fallback: use own ID if we can't find int. prints table
                    card['international_prints'] = f"{card['set']}-{card['number']}"
                
                # Be nice to the server - small delay between requests
                time.sleep(float(settings.get("detail_request_delay_seconds", 0.5)))
                
                restart_counter += 1  # Increment counter for browser restart logic
                
                # Progressive CSV update every 100 cards
                if (idx + 1) % 100 == 0:
                    print(f"[All Cards Scraper] OK: Completed {idx + 1} detail pages")
                    print(f"[All Cards Scraper] UPDATING CSV: Writing current progress to {csv_path}...")
                    write_csv_batch()
                    print(f"[All Cards Scraper] CSV updated! Other tools can now use {idx + 1} cards with details.")
                
            except Exception as e:
                print(f"[All Cards Scraper] ERROR scraping {card['name']}: {e}")
                continue
    
    finally:
        try:
            driver.quit()
        except:
            pass
    
    # Count how many got image URLs
    cards_with_images = sum(1 for c in cards if c.get('image_url'))
    print(f"\n[All Cards Scraper] OK: Got image URLs for {cards_with_images}/{len(cards)} cards")
    
    return cards


# Main execution - with error handling to keep console open
try:
    print("\n" + "=" * 80)
    print("PHASE 1: Scraping card list from Limitless...")
    print("=" * 80)
    settings = load_settings()
    data_dir = get_data_dir()
    csv_path = os.path.join(data_dir, 'all_cards_database.csv')
    json_path = os.path.join(data_dir, 'all_cards_database.json')
    append_mode = bool(settings.get("append", True))
    start_page = int(settings.get("start_page", 1))

    print(f"[All Cards Scraper] Data directory: {os.path.abspath(data_dir)}")
    print(f"[All Cards Scraper] Output file: {os.path.abspath(csv_path)}")
    print()

    rescrape_incomplete = bool(settings.get("rescrape_incomplete", True))

    if append_mode:
        existing_cards, existing_keys, incomplete_cards = load_existing_cards(csv_path, rescrape_incomplete)
    else:
        existing_cards, existing_keys, incomplete_cards = [], set(), []

    all_cards = scrape_all_cards_list(settings, start_page=start_page, existing_keys=existing_keys)

    # Combine new cards with incomplete cards that need re-scraping
    if rescrape_incomplete and incomplete_cards:
        print(f"\n[All Cards Scraper] Adding {len(incomplete_cards)} incomplete cards for detail re-scraping...")
        # Add card_urls to incomplete cards for detail scraping
        for ic in incomplete_cards:
            # Try to build URL from card data
            if ic.get('name') and ic.get('set') and ic.get('number'):
                # Build approximate URL (may not always work, but we'll handle errors)
                card_name_slug = ic['name'].lower().replace(' ', '-').replace("'", '')
                ic['card_url'] = f"/cards/{ic['set'].upper()}/{ic['number']}/{card_name_slug}"
        all_cards = incomplete_cards + all_cards
        print(f"[All Cards Scraper] Total cards to detail-scrape: {len(all_cards)} ({len(incomplete_cards)} incomplete + {len(all_cards) - len(incomplete_cards)} new)")

    if not all_cards:
        print("[All Cards Scraper] No new cards extracted and no incomplete cards to repair. Exiting.")
        exit(0)

    # Write CSV after Phase 1 (list scraping) - so other tools can use partial data immediately
    print("\n" + "=" * 80)
    print("WRITING PARTIAL CSV: Saving cards from list scraping...")
    print("=" * 80)

    # Ensure output directory exists
    os.makedirs(data_dir, exist_ok=True)

    # Save to CSV (append or overwrite)
    file_exists = os.path.isfile(csv_path) and os.path.getsize(csv_path) > 0
    file_mode = 'a' if append_mode else 'w'
    with open(csv_path, file_mode, encoding='utf-8', newline='') as f:
        fieldnames = ['name', 'set', 'number', 'type', 'rarity', 'image_url', 'international_prints']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists or not append_mode:
            writer.writeheader()
        for card in all_cards:
            writer.writerow({
                'name': card.get('name', ''),
                'set': card.get('set', ''),
                'number': card.get('number', ''),
                'type': card.get('type', ''),
                'rarity': card.get('rarity', ''),
                'image_url': card.get('image_url', ''),
                'international_prints': card.get('international_prints', '')
            })

    print(f"[All Cards Scraper] OK: Partial CSV saved to {csv_path}")
    print(f"[All Cards Scraper] {len(all_cards)} new cards are now available for other tools!")
    print("[All Cards Scraper] Will continue with detail scraping and update CSV with images/rarity...")

    # PHASE 2: Scrape detail pages (optional - can be skipped for fast testing)
    skip_details = bool(settings.get("skip_detail_scraping", False))
    if skip_details:
        print("\n" + "=" * 80)
        print("PHASE 2: SKIPPED (skip_detail_scraping = true)")
        print("=" * 80)
        print("[All Cards Scraper] Detail scraping skipped. Cards will have no image_url or rarity.")
    else:
        print("\n" + "=" * 80)
        print("PHASE 2: Scraping detail pages for image URLs and rarity...")
        print("=" * 80)
        all_cards = scrape_card_details(settings, all_cards, existing_cards, csv_path, append_mode)

    # Final CSV write to ensure all data is saved (in case last batch was < 100 cards)
    print("\n" + "=" * 80)
    print("FINAL CSV WRITE: Saving all cards with latest details...")
    print("=" * 80)

    # Ensure output directory exists
    os.makedirs(data_dir, exist_ok=True)

    # Save to CSV (append or overwrite mode is determined by first write, now we always overwrite for final)
    all_data = (existing_cards + all_cards) if append_mode else all_cards
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['name', 'set', 'number', 'type', 'rarity', 'image_url', 'international_prints']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for card in all_data:
            writer.writerow({
                'name': card.get('name', ''),
                'set': card.get('set', ''),
                'number': card.get('number', ''),
                'type': card.get('type', ''),
                'rarity': card.get('rarity', ''),
                'image_url': card.get('image_url', ''),
                'international_prints': card.get('international_prints', '')
            })

    print(f"\n[All Cards Scraper] OK: Saved to {csv_path}")

    # Also save to JSON for easy access
    all_data_for_json = (existing_cards + all_cards) if append_mode else all_cards
    json_data = {
        'timestamp': datetime.now().isoformat(),
        'source': 'https://limitlesstcg.com/cards?q=lang%3Aen',
        'total_count': len(all_data_for_json),
        'cards': all_data_for_json
    }

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    print(f"[All Cards Scraper] OK: Saved to {json_path}")

    print()
    print("Sample data (first 10):")
    for card in all_data_for_json[:10]:
        img_status = "OK" if card['image_url'] else "NO"
        print(f"  {img_status} {card['name']} ({card['set']} {card['number']}) - {card['type']}")
        if card['image_url']:
            print(f"      └─ {card['image_url']}")
    if len(all_data_for_json) > 10:
        print(f"  ... and {len(all_data_for_json) - 10} more")
    print()
    print("=" * 80)
    print("SUCCESS: All cards database ready!")
    print("=" * 80)
    print()

except Exception as e:
    print("\n" + "=" * 80)
    print("❌ FEHLER: Scraper abgebrochen!")
    print("=" * 80)
    print(f"\nFehler: {e}")
    import traceback
    traceback.print_exc()
    print("\n" + "=" * 80)
    
finally:
    # ALWAYS keep console open (even after errors)
    if getattr(sys, "frozen", False):
        print("\n")
        input("Drücke ENTER zum Beenden...")
