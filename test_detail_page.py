#!/usr/bin/env python3
"""
Test: Load actual card detail page and check for Int. Prints
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')

driver = webdriver.Chrome(options=chrome_options)

try:
    # Test with correct URL format (ASC/32 instead of ASC-32)
    url = "https://limitlesstcg.com/cards/ASC/32"
    print(f"Loading: {url}")
    driver.get(url)
    
    # Wait for page to load
    time.sleep(3)
    
    # Check for 404
    if "404" in driver.page_source or "not found" in driver.page_source.lower():
        print("✗ 404 Error!")
    else:
        print("✓ Page loaded successfully!")
    
    # Look for card name
    h1 = driver.find_elements(By.CSS_SELECTOR, "h1")
    if h1:
        print(f"Card name: {h1[0].text}")
    
    # Test different selectors for international prints
    print("\n=== Looking for International Prints ===")
    
    # Search for text "Int. Prints" or "International"
    page_source = driver.page_source
    if "Int. Prints" in page_source:
        print("✓ Found 'Int. Prints' in HTML")
    elif "International" in page_source:
        print("✓ Found 'International' in HTML")
    else:
        print("✗ No 'Int. Prints' or 'International' in HTML")
    
    # Look for any card links
    all_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/cards/']")
    print(f"\nFound {len(all_links)} links containing '/cards/'")
    
    # Filter to card links (format: /cards/SET/NUM)
    card_links = []
    for link in all_links:
        href = link.get_attribute('href')
        if href and '/cards/' in href:
            # Extract path after /cards/
            path = href.split('/cards/')[-1]
            # Check if it's SET/NUM format (not 'advanced' or 'syntax')
            if '/' in path and not path.startswith('advanced') and not path.startswith('syntax'):
                card_links.append(href)
    
    print(f"\nFiltered to {len(card_links)} actual card links:")
    for link in sorted(set(card_links))[:10]:
        print(f"  - {link}")
    
    # Try to find the prints table by inspecting HTML structure
    print("\n=== HTML Structure Analysis ===")
    
    # Find all tables
    tables = driver.find_elements(By.CSS_SELECTOR, "table")
    print(f"Found {len(tables)} tables on page")
    
    for i, table in enumerate(tables):
        rows = table.find_elements(By.CSS_SELECTOR, "tr")
        print(f"\nTable {i+1}: {len(rows)} rows")
        # Check if table contains card links
        table_links = table.find_elements(By.CSS_SELECTOR, "a[href*='/cards/']")
        if table_links:
            print(f"  Contains {len(table_links)} card links")
            for link in table_links[:3]:
                print(f"    - {link.get_attribute('href')}")
    
    # Save HTML for inspection
    with open("test_detail_page.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("\n✓ Saved HTML to test_detail_page.html")

finally:
    driver.quit()
