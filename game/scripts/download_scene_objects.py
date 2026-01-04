#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载场景物件图片
"""

import requests
import os
from pathlib import Path

# 图片URL列表 - 已生成完成的场景物件
IMAGE_URLS = [
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594810443_1afe9085-3667-48ea-859a-3746be3db8fd_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594792511_ae5cde0d-b2b8-4822-91f1-41f994f874f2_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789769_0613057c-ec3c-4c7c-b0db-16d4bac5e5cb_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789832_4778f7e0-c9eb-4358-bc25-d8efedd751ab_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594790936_fc6fd21b-1974-4f4a-aa0a-9f353b210b58_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594805236_fd5c1491-8c11-41c7-b9f8-427657ba056c_small.webp",
    "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594797523_cc02944c-e15f-4817-b041-b0a266f635db_small.webp",
]

# 输出目录
OUTPUT_DIR = Path("assets/images/objects/generated")

def download_images():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Found {len(IMAGE_URLS)} images to download")
    
    for i, url in enumerate(IMAGE_URLS, 1):
        try:
            # 从URL提取文件名
            filename = url.split('/')[-1]
            output_path = OUTPUT_DIR / f"object_{i}_{filename}"
            
            print(f"[{i}/{len(IMAGE_URLS)}] Downloading: {filename}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"  -> Saved to: {output_path} ({len(response.content)} bytes)")
            
        except Exception as e:
            print(f"  -> Error: {e}")
    
    print(f"\nDownload complete! Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    download_images()

