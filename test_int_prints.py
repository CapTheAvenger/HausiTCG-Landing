#!/usr/bin/env python3
"""
Test Script: Check International Prints scraping for N's Darumaka
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Setup Chrome
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=chrome_options)

try:
    # Test N's Darumaka (should have ASC-32 and JTG-26)
    url = "https://limitlesstcg.com/cards/ASC-32"
    print(f"Loading: {url}")
    driver.get(url)
    
    # Wait for page to load
    time.sleep(3)
    
    # Try different selectors
    print("\n=== Testing Selectors ===")
    
    # Original selector
    selector1 = ".card-prints-international a[href^='/cards/']"
    elements1 = driver.find_elements(By.CSS_SELECTOR, selector1)
    print(f"\n1. Selector: {selector1}")
    print(f"   Found: {len(elements1)} elements")
    if elements1:
        for elem in elements1[:5]:
            print(f"   - {elem.get_attribute('href')}")
    
    # Try without class prefix
    selector2 = "a[href^='/cards/']"
    elements2 = driver.find_elements(By.CSS_SELECTOR, selector2)
    print(f"\n2. Selector: {selector2}")
    print(f"   Found: {len(elements2)} elements")
    if elements2:
        for elem in elements2[:5]:
            print(f"   - {elem.get_attribute('href')}")
    
    # Try finding the table by text
    print("\n3. Looking for 'Int. Prints' text on page...")
    page_source = driver.page_source
    if "Int. Prints" in page_source:
        print("   ✓ Found 'Int. Prints' text in page HTML")
    else:
        print("   ✗ 'Int. Prints' text NOT found")
    
    # Try finding prints table by different class names
    selectors = [
        ".card-prints-international",
        ".card-prints",
        "[class*='prints']",
        "[class*='international']"
    ]
    
    print("\n4. Testing various class selectors:")
    for sel in selectors:
        elems = driver.find_elements(By.CSS_SELECTOR, sel)
        print(f"   {sel}: {len(elems)} elements")
        if elems:
            for e in elems[:2]:
                print(f"      Class: {e.get_attribute('class')}")
                print(f"      HTML: {e.get_attribute('outerHTML')[:200]}...")
    
    # Check for h3 headers (Limitless often uses these)
    print("\n5. Looking for section headers (h3, h4):")
    headers = driver.find_elements(By.CSS_SELECTOR, "h3, h4")
    for h in headers:
        text = h.text.strip()
        if text:
            print(f"   - {text}")
    
    # Get all card links and filter
    print("\n6. All /cards/ links on page:")
    all_card_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/cards/']")
    print(f"   Total: {len(all_card_links)}")
    unique_hrefs = set()
    for link in all_card_links:
        href = link.get_attribute('href')
        if href and '/cards/' in href:
            unique_hrefs.add(href)
    
    print(f"   Unique card URLs: {len(unique_hrefs)}")
    for href in sorted(list(unique_hrefs))[:10]:
        print(f"   - {href}")
    
    # Save page HTML for inspection
    print("\n7. Saving page HTML to test_page_source.html...")
    with open("test_page_source.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("   ✓ Saved!")
    
finally:
    driver.quit()

print("\n=== Test Complete ===")
