#!/usr/bin/env python3
"""
CardMarket Price Scraper with Playwright
Generates URLs and scrapes prices for all 3 rarity versions of each card
"""

import csv
import asyncio
import re
import logging
from pathlib import Path
from datetime import datetime

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("❌ Playwright not installed. Run: pip install playwright")
    print("   Then run: playwright install")
    exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cardmarket_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_sets_mapping(file_path):
    """Load set code to set name mapping"""
    mapping = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                mapping[row['set_code'].strip()] = row['set_name'].strip()
    except Exception as e:
        logger.error(f"Error loading sets mapping: {e}")
    return mapping

def generate_cardmarket_url(card_name, set_code, card_number, set_name, version):
    """Generate CardMarket URL for a card with specific version"""
    # Format card name for URL
    url_card_name = re.sub(r'[^\w\s-]', '', card_name)
    url_card_name = url_card_name.replace(' ', '-').replace("'", '')
    
    # Format set name for URL
    url_set_name = set_name.strip().replace(' ', '-')
    
    # Special handling for Boss's Orders: Add boss-name slug
    boss_mapping = {
        'RCL': 'giovanni',
        'SHF': 'lysandre',
        'LOR': 'lysandre',
        'BRS': 'cyrus',
        'SP': 'cyrus',
        'PAL': 'ghetsis',
        'MEG': 'ghetsis',
        'ASC': 'corbeau'
    }
    
    if "Boss's Orders" in card_name or "Bosss Orders" in card_name:
        boss_slug = boss_mapping.get(set_code, '')
        if boss_slug:
            url = f"https://www.cardmarket.com/de/Pokemon/Products/Singles/{url_set_name}/bosss-orders-{boss_slug}-V{version}-{set_code}{card_number}"
            return url
    
    # Construct CardMarket URL: SET_NAME/CARD_NAME-V{VERSION}-{SET_CODE}{NUMBER}
    url = f"https://www.cardmarket.com/de/Pokemon/Products/Singles/{url_set_name}/{url_card_name}-V{version}-{set_code}{card_number}"
    
    return url

async def get_cardmarket_price(page, url, card_name, set_code, card_number, version):
    """
    Fetch cheapest price from CardMarket using Playwright
    Returns: (price_str, success_flag)
    """
    try:
        logger.debug(f"[V{version}] Fetching {card_name} ({set_code}/{card_number})")
        logger.debug(f"         URL: {url}")
        
        # Navigate to page with timeout
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=10000)
        except Exception as nav_error:
            logger.warning(f"[V{version}] Navigation error: {nav_error}")
            return None, False
        
        # Wait a bit for content to load
        await page.wait_for_timeout(1000)
        
        # Try to find price elements
        try:
            # Look for price in various possible elements
            price_text = await page.evaluate("""
                () => {
                    // Try multiple selectors
                    let price = null;
                    
                    // Method 1: Look for any element containing €
                    const elements = document.querySelectorAll('*');
                    for (let el of elements) {
                        const text = el.textContent;
                        if (text && text.includes('€') && text.length < 20) {
                            const match = text.match(/([0-9,]+)/);
                            if (match) {
                                price = match[1];
                                break;
                            }
                        }
                    }
                    
                    return price;
                }
            """)
            
            if price_text:
                price = price_text.replace(',', '.')
                logger.info(f"[V{version}] ✓ Found price: €{price}")
                return price, True
            else:
                logger.warning(f"[V{version}] No price found on page")
                return None, True
                
        except Exception as e:
            logger.warning(f"[V{version}] Error extracting price: {e}")
            return None, True
            
    except Exception as e:
        logger.error(f"[V{version}] Unexpected error: {e}")
        return None, False

async def main():
    """Main async function"""
    logger.info("=" * 80)
    logger.info("CardMarket Price Scraper - Started")
    logger.info("=" * 80)
    
    # Load set mappings
    sets_mapping = load_sets_mapping('pokemon_sets_mapping.csv')
    logger.info(f"✓ Loaded {len(sets_mapping)} set mappings")
    
    # Load cards database
    cards_data = []
    try:
        with open('all_cards_database.csv', 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f, delimiter=';')
            cards_data = list(reader)
        logger.info(f"✓ Loaded {len(cards_data)} cards from all_cards_database.csv")
    except Exception as e:
        logger.error(f"Error loading cards: {e}")
        return
    
    # Launch browser
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        # Create output CSV
        base_dir = Path(__file__).resolve().parent
        data_dir = base_dir / 'data'
        data_dir.mkdir(parents=True, exist_ok=True)
        output_file = str(data_dir / 'cardmarket_prices.csv')
        processed = 0
        total_urls = 0
        
        with open(output_file, 'w', encoding='utf-8', newline='') as outf:
            writer = csv.DictWriter(outf, fieldnames=['set', 'number', 'name', 'rarity', 'version', 'price_eur', 'cardmarket_url'])
            writer.writeheader()
            
            logger.info("Starting to process cards...")
            logger.info("-" * 80)
            
            # Process first 50 cards for testing
            for i, card in enumerate(cards_data[:50]):
                set_code = card.get('set', '').strip().upper()
                card_number = card.get('number', '').strip()
                card_name = card.get('name', '').strip()
                rarity = card.get('rarity', '').strip().lower()
                
                # Validate card data
                if not set_code or not card_number or not card_name:
                    continue
                
                # Skip Japanese cards
                if set_code not in sets_mapping:
                    logger.debug(f"Skipping Japanese card: {card_name} ({set_code})")
                    continue
                
                set_name = sets_mapping[set_code]
                
                logger.info(f"\n[Card {i+1}/50] {card_name} ({set_code}/{card_number})")
                logger.info(f"        Rarity: {rarity}")
                
                # Process all 3 versions
                for version in ['1', '2', '3']:
                    total_urls += 1
                    
                    # Generate URL
                    url = generate_cardmarket_url(card_name, set_code, card_number, set_name, version)
                    
                    # Fetch price
                    price, success = await get_cardmarket_price(page, url, card_name, set_code, card_number, version)
                    
                    # Write to CSV
                    writer.writerow({
                        'set': set_code,
                        'number': card_number,
                        'name': card_name,
                        'rarity': rarity,
                        'version': version,
                        'price_eur': price if price else '',
                        'cardmarket_url': url
                    })
                    
                    # Log result
                    if price:
                        logger.info(f"[V{version}] ✓ €{price} -> {url}")
                    else:
                        logger.info(f"[V{version}] ⚠ No price -> {url}")
                    
                    # Delay between requests
                    await page.wait_for_timeout(2000)
                
                processed += 1
        
        await context.close()
        await browser.close()
    
    logger.info("\n" + "=" * 80)
    logger.info(f"CardMarket Price Scraper - Completed")
    logger.info(f"✓ Processed: {processed} cards")
    logger.info(f"✓ Generated: {total_urls} URLs")
    logger.info(f"✓ Output: {output_file}")
    logger.info("=" * 80)

if __name__ == '__main__':
    asyncio.run(main())
