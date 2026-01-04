# -*- coding: utf-8 -*-
"""
下载阶段3场景物件图片 - 第一批（居住环+市政环）
"""
import requests
import os
import time

BASE_URL = "https://artflow.gz4399.com"

# 第一批场景物件URL（从API获取的24张）
OBJECT_URLS = [
    # 床 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591459763_22e9b661-07c5-4b94-8522-bab4dc430d4c_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591465426_843fec78-69cd-4fc4-a9f1-731761bd20ac_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591464228_ea002080-8bff-4ed1-bd59-2e550f685e3a_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591463872_886e5207-e583-42d9-8a36-53d8d98b7ee1_small.webp",
    # 书桌 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591476292_f6f080ed-0601-4b44-9d05-b9f5ca8ef89c_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591474345_544dddd5-c20e-44ee-9707-896934e7ce0b_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591481934_57fff098-2668-4558-9afb-311864ac17ef_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591487478_aad9b0a2-7e7f-41b8-b185-d0a2ab297041_small.webp",
    # 台灯 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591488474_0a5c92fc-dd44-4426-846c-302a316a87b3_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591495626_a6de3347-bf0d-4933-9e97-063c5fc81fd4_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591481638_31418427-94c1-4af6-8786-6584dbfb53dc_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591493467_21f0a62f-1a02-4107-b2ca-7a77d2d80775_small.webp",
    # 木门 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591507441_f88e6393-906f-4d57-92c7-3221d3f4209b_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591496436_522acbe6-959f-4a19-940e-f4e3279d5a8b_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591499113_be7dbbea-03d4-483c-ac1a-a34c1f285884_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591498338_554576f2-ca8c-4bfd-b821-82d7e1d6afd0_small.webp",
    # 盆栽 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591506704_1a2aa201-e7eb-44ce-be58-59628564a9af_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591499418_daf6c317-0fb1-4467-8068-1438de9f63ef_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591500481_163cea20-2273-4145-87fa-56c4c93abc7d_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591502353_f47e9295-3c57-4b6d-89b7-805f3d9aafbb_small.webp",
    # 办公桌 (4张)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591533902_043c0ff8-7c18-40f5-9601-4bcaa52c28fe_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591521593_f12d679f-498d-45d5-9980-5a6f2d7dc5bb_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591532059_a9884980-9483-4d6f-9159-f18ad7616e82_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591522541_0832c484-fe22-440b-a69a-0488ca44eb54_small.webp",
]

# 物件名称映射
OBJECT_NAMES = [
    # 居住环物件
    ("residential", "bed", 4),
    ("residential", "desk", 4),
    ("residential", "lamp", 4),
    ("residential", "door", 4),
    ("residential", "plant", 4),
    # 市政环物件
    ("municipal", "office_desk", 4),
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

