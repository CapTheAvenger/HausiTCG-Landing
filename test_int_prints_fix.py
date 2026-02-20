#!/usr/bin/env python3
"""
Quick test: Verify Int. Prints extraction logic with real Limitless data
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
    # Test N's Darumaka (should have ASC-32 and JTG-26)
    url = "https://limitlesstcg.com/cards/ASC/32"
    print(f"Testing: N's Darumaka - {url}")
    driver.get(url)
    time.sleep(3)
    
    # Use the FIXED selector
    int_prints_links = driver.find_elements(By.CSS_SELECTOR, ".card-prints-versions a[href^='/cards/']")
    
    print(f"\nFound {len(int_prints_links)} links in .card-prints-versions table")
    
    # Extract using the new logic
    int_prints = set()
    for link in int_prints_links:
        href = link.get_attribute('href')
        if href:
            print(f"  Processing: {href}")
            # Get path after '/cards/'
            path = href.split('/cards/')[-1].strip()
            # Split by '/' to get parts
            parts = path.split('/')
            
            print(f"    Parts: {parts}")
            
            # Only process if format is SET/NUMBER (2 parts)
            if len(parts) == 2 and parts[1].replace('-', '').isdigit():  # Handle numbers like "26a"
                card_id = f"{parts[0]}-{parts[1]}"
                int_prints.add(card_id)
                print(f"    ✓ Added: {card_id}")
            else:
                print(f"    ✗ Skipped (wrong format or Japanese)")
    
    # Add current card
    current_id = "ASC-32"
    int_prints.add(current_id)
    
    print(f"\n=== RESULT ===")
    print(f"International Prints: {','.join(sorted(list(int_prints)))}")
    print(f"Expected: ASC-32,JTG-26")
    
    if "ASC-32" in int_prints and "JTG-26" in int_prints:
        print("✓ SUCCESS: Found both ASC-32 and JTG-26!")
    else:
        print("✗ FAILED: Missing expected prints")
    
    # Test N's Darmanitan (should have ASC-33, JTG-27, SVP-181)
    print("\n" + "="*60)
    url2 = "https://limitlesstcg.com/cards/ASC/33"
    print(f"\nTesting: N's Darmanitan - {url2}")
    driver.get(url2)
    time.sleep(3)
    
    int_prints_links2 = driver.find_elements(By.CSS_SELECTOR, ".card-prints-versions a[href^='/cards/']")
    print(f"Found {len(int_prints_links2)} links")
    
    int_prints2 = set()
    for link in int_prints_links2:
        href = link.get_attribute('href')
        if href:
            path = href.split('/cards/')[-1].strip()
            parts = path.split('/')
            if len(parts) == 2 and parts[1].replace('-', '').isdigit():
                card_id = f"{parts[0]}-{parts[1]}"
                int_prints2.add(card_id)
    
    int_prints2.add("ASC-33")
    
    print(f"\n=== RESULT ===")
    print(f"International Prints: {','.join(sorted(list(int_prints2)))}")
    print(f"Expected: ASC-33,JTG-27,SVP-181")
    
    expected = {"ASC-33", "JTG-27", "SVP-181"}
    if expected.issubset(int_prints2):
        print("✓ SUCCESS: Found all expected prints!")
    else:
        missing = expected - int_prints2
        print(f"✗ FAILED: Missing {missing}")

finally:
    driver.quit()
