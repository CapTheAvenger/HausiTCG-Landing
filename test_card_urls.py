#!/usr/bin/env python3
"""
Test: Check card URLs from the Limitless cards list page
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
    # Load the cards list page with ASC set filter
    url = "https://limitlesstcg.com/cards?q=set%3AASC&display=list"
    print(f"Loading: {url}")
    driver.get(url)
    
    # Wait for page to load
    time.sleep(3)
    
    # Find table rows
    rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"\nFound {len(rows)} table rows")
    
    # Check first few rows
    print("\nFirst 5 card URLs:")
    for i, row in enumerate(rows[:5]):
        cells = row.find_elements(By.TAG_NAME, "td")
        if len(cells) >= 3:
            # Card name is in 3rd column
            try:
                link = cells[2].find_element(By.TAG_NAME, "a")
                href = link.get_attribute('href')
                text = link.text
                print(f"{i+1}. {text}")
                print(f"   URL: {href}")
            except Exception as e:
                print(f"{i+1}. ERROR: {e}")
    
    # Test if /cards/asc/1 format works
    print("\n\nTesting URL formats:")
    
    formats_to_test = [
        "https://limitlesstcg.com/cards/ASC-1",
        "https://limitlesstcg.com/cards/asc/1",
        "https://limitlesstcg.com/cards/asc-1",
    ]
    
    for test_url in formats_to_test:
        print(f"\nTrying: {test_url}")
        driver.get(test_url)
        time.sleep(2)
        
        # Check for 404
        if "404" in driver.page_source or "not found" in driver.page_source.lower():
            print("  ✗ 404 Error")
        else:
            print("  ✓ Page loaded!")
            # Check for card image
            images = driver.find_elements(By.CSS_SELECTOR, "img[src*='limitlesstcg']")
            if images:
                print(f"  ✓ Found {len(images)} card images")

finally:
    driver.quit()
