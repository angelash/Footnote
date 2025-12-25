#!/usr/bin/env python3
"""批量下载智绘平台生成的图片"""

import requests
import os
import sys

def download_images(urls, output_dir, prefix):
    """下载图片到指定目录"""
    os.makedirs(output_dir, exist_ok=True)
    
    downloaded = []
    for i, url in enumerate(urls):
        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 200:
                filepath = f'{output_dir}/{prefix}_{i+1}.webp'
                with open(filepath, 'wb') as f:
                    f.write(r.content)
                print(f'[OK] Downloaded {i+1}/{len(urls)}: {filepath} ({len(r.content)} bytes)')
                downloaded.append(filepath)
            else:
                print(f'[FAIL] Failed {i+1}: HTTP {r.status_code}')
        except Exception as e:
            print(f'[ERR] Error {i+1}: {e}')
    
    return downloaded

if __name__ == '__main__':
    # P16 整理思绪 - 3张完成（部分成功）
    p16_urls = [
        'https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766667359731_44baa225-eac9-4f77-ac09-75db9f3ee308_small.webp',
        'https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766667364669_ef0bc0a1-a26e-46c0-beb5-c76f028d4d06_small.webp',
        'https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766667367626_f8b2e098-b580-4086-ab2b-435f03d9c7c0_small.webp'
    ]
    
    output_dir = 'comics/generated/ep01/approved'
    download_images(p16_urls, output_dir, 'EP01-P16-organize')
    print('Done!')

