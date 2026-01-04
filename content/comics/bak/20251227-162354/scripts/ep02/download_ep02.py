#!/usr/bin/env python3
"""下载EP02所有图片"""
import os
import requests
import re

# 创建目录
os.makedirs('../../generated/ep02', exist_ok=True)

# 读取URL文件
with open('ep02-urls.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# 解析每页的URL
pattern = r'## (P\d+) - (.+)\n((?:https?://[^\n]+\n?)+)'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} pages to download")

for page_id, page_title, urls_block in matches:
    urls = [url.strip() for url in urls_block.strip().split('\n') if url.strip()]
    print(f"\n{page_id} - {page_title}: {len(urls)} images")
    
    for i, url in enumerate(urls, 1):
        filename = f"../../generated/ep02/{page_id.lower()}_{i}.webp"
        
        if os.path.exists(filename):
            print(f"  [{i}] Already exists, skipping")
            continue
            
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"  [{i}] Downloaded: {len(response.content)} bytes")
            else:
                print(f"  [{i}] HTTP {response.status_code}")
        except Exception as e:
            print(f"  [{i}] Error: {e}")

print("\n\nDownload complete!")

