# -*- coding: utf-8 -*-
"""
下载阶段3场景物件图片 - 第二批（档案巷/诊疗台/礼堂街/边缘断口）
"""
import requests
import os
import time

BASE_URL = "https://artflow.gz4399.com"

# 第二批场景物件URL（从API获取的20张新增）
OBJECT_URLS = [
    # 书架 (4张) - archive
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591717072_8969ea70-ea20-40c1-9ada-cb7659f80471_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591722888_785414e7-20f4-4e3c-bc16-c5232e6548b6_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591712146_37693d33-5994-4389-8481-8fa2ab521398_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591729842_d8594977-cb4d-4794-a15a-f443463c6049_small.webp",
    # 油灯 (4张) - archive
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591713606_c80f272d-6631-4c48-ad22-eb1819b6112d_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591723728_bfcdd83b-a632-4c85-8e34-05bfb61b2811_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591723633_3bde413c-d83e-4250-89e5-06191fe1e42a_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591729462_daa3d6b4-9b29-49e1-9c54-189df97db954_small.webp",
    # 病床 (4张) - clinic
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591728501_c827b144-48f6-4efe-8336-1e69d456c0a0_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591742164_4be8fb94-9691-4500-abaa-5aa77e5a09a8_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591730468_a1d15285-daed-44df-a7ab-c7f73fdce499_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591737211_6ca27427-2b1c-4ae3-b881-0f45b59883db_small.webp",
    # 祭坛 (4张) - temple
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591743150_9d76708f-724e-42e0-84bf-0fec0634e612_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591738094_6b781aaa-5497-4484-aefc-4e2af6e8ea5f_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591739714_8fcb1271-fee0-44e4-bb00-644ab1fa99c5_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591737598_43cc3d55-5978-4afd-9ac0-c98f5da4bc63_small.webp",
    # 裂隙 (4张) - edge
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591745677_82a2219c-aaf2-406b-a3c6-a08268bd0640_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591743685_2fbf3cf8-a7e9-4a64-969e-c58264b74ca0_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591735450_9e827383-cf42-4a1c-bbc5-6e9072e4caec_small.webp",
]

# 物件名称映射
OBJECT_NAMES = [
    ("archive", "bookshelf", 4),
    ("archive", "oil_lamp", 4),
    ("clinic", "hospital_bed", 4),
    ("temple", "altar", 4),
    ("edge", "crack", 3),  # 只有3张已完成
]

BASE_DIR = "F:/workspace/github/Footnote/assets/images/objects"

def download_image(url, save_path):
    full_url = f"{BASE_URL}{url}" if url.startswith('/') else url
    print(f"Downloading: {os.path.basename(save_path)}")
    
    try:
        response = requests.get(full_url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = os.path.getsize(save_path)
        print(f"  OK - {file_size} bytes")
        return True
    except Exception as e:
        print(f"  FAILED - {e}")
        return False

def main():
    downloaded = 0
    failed = 0
    url_index = 0
    
    for zone, obj_name, count in OBJECT_NAMES:
        zone_dir = os.path.join(BASE_DIR, zone)
        os.makedirs(zone_dir, exist_ok=True)
        
        print(f"\n{'='*60}")
        print(f"Downloading {zone}/{obj_name} ({count} images)")
        print(f"{'='*60}")
        
        for i in range(count):
            if url_index >= len(OBJECT_URLS):
                break
            url = OBJECT_URLS[url_index]
            filename = f"{obj_name}_{i+1}.webp"
            save_path = os.path.join(zone_dir, filename)
            
            if download_image(url, save_path):
                downloaded += 1
            else:
                failed += 1
            
            url_index += 1
            time.sleep(0.2)
    
    print(f"\n{'='*60}")
    print(f"Download complete! Success: {downloaded}, Failed: {failed}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

