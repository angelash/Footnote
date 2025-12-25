# -*- coding: utf-8 -*-
"""
批量下载角色头像图片
"""

import requests
import os

# 配置
BASE_URL = 'https://artflow.gz4399.com'
API_URL = f'{BASE_URL}/api/nextimage/v1/chat/message/all?chatId=23367&offset=0&limit=200&order=desc&sort=sequence'
HEADERS = {
    'Cookie': '__t_id=8a8f5dc84eed4e80eec16ef53ec7e93d; grey-version=3; gray-split-token=24; token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkYXRhIjp7InVzZXJfaWQiOjEzMCwidXNlcm5hbWUiOiJnYWx5bm4xOSIsImVtYWlsIjoiIiwic3RhdHVzIjoiQUNUSVZFIiwicGhvbmUiOm51bGx9LCJleHAiOjE3MzUwNDE0MTZ9.e5xRYHOdoKiGM4RBVUDGjDPjWlzGSZwXFCUhPHE8LH0',
    'Accept': 'application/json'
}

# 头像保存目录映射
PORTRAIT_DIRS = {
    'muping': r'F:\workspace\github\Footnote\assets\images\characters\portraits\muping',
    'qilan': r'F:\workspace\github\Footnote\assets\images\characters\portraits\qilan',
    'chenjiang': r'F:\workspace\github\Footnote\assets\images\characters\portraits\chenjiang',
    'cenhui': r'F:\workspace\github\Footnote\assets\images\characters\portraits\cenhui',
    'gulin': r'F:\workspace\github\Footnote\assets\images\characters\portraits\gulin',
    'songlan': r'F:\workspace\github\Footnote\assets\images\characters\portraits\songlan',
    'xucheng': r'F:\workspace\github\Footnote\assets\images\characters\portraits\xucheng',
    'atang': r'F:\workspace\github\Footnote\assets\images\characters\portraits\atang'
}

# 创建目录
for dir_path in PORTRAIT_DIRS.values():
    os.makedirs(dir_path, exist_ok=True)

def get_all_images():
    """获取API中所有图片"""
    response = requests.get(API_URL, headers=HEADERS)
    data = response.json()
    
    images = []
    for row in data.get('data', {}).get('rows', []):
        if row.get('role') == 'assistant':
            content = row.get('content', [])
            for item in content:
                if item.get('type') == 'image':
                    img = item.get('image', {})
                    if img.get('status') == 'success':
                        url = img.get('url', '')
                        if url:
                            images.append({
                                'url': BASE_URL + url,
                                'id': img.get('id')
                            })
    return images

def download_image(url, filepath):
    """下载图片"""
    try:
        response = requests.get(url, timeout=60)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f'Downloaded: {filepath} ({len(response.content)} bytes)')
            return True
        else:
            print(f'Failed: {url} - Status {response.status_code}')
            return False
    except Exception as e:
        print(f'Error: {url} - {e}')
        return False

if __name__ == '__main__':
    print('Getting images from API...')
    images = get_all_images()
    print(f'Found {len(images)} images')
    
    # 显示最新的50张图片URL
    print('\n=== Latest 50 images ===')
    for i, img in enumerate(images[:50]):
        print(f"{i+1}. ID:{img['id']} - {img['url']}")

