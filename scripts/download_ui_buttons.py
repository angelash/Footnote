# UI按钮资产下载脚本
# 阶段6: UI图素 - 按钮部分
# chatId: 23374

import requests
import os

BASE_URL = "https://artflow.gz4399.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_image(image_url, save_path):
    full_url = f"{BASE_URL}{image_url}" if image_url.startswith('/cosres') else image_url
    response = requests.get(full_url, headers=HEADERS, stream=True)
    response.raise_for_status()
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"  OK - {os.path.getsize(save_path)} bytes")

def main():
    # UI按钮图片URLs (从API获取)
    # 按顺序: 主按钮(4), 次按钮(4), 菜单图标按钮(4)
    image_urls = [
        # 主按钮 (Primary Button)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592903483_0c075ed2-975a-4d69-b9a8-96b7189c61e6_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592902375_774ac4cd-189a-4d12-b201-73dc8b654c73_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592907695_e45fea78-5ae1-472a-bd41-f744520ac4ae_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592908420_ea1a6e0d-91c5-410a-b768-87c7e89d4680_small.webp",
        # 次按钮 (Secondary Button)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592991300_13a7daae-5247-46d0-bb4f-c8c5bb897ea1_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592982130_20cda516-282a-4e7f-9841-79fc6fb23c0a_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592980496_f6640492-c9bc-45a8-9c16-7b53bbd821c1_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592993852_7a9def54-2fbe-456e-9528-9fdbd8f69d29_small.webp",
        # 菜单图标按钮 (Menu Icon Button)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593050670_9db1e5ce-82e2-4ab4-a100-b4d2f136bde8_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593043646_a1fed240-b426-4052-81df-f03124e5e3a2_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593052356_3e41ecf6-af97-48d0-b27a-7b041436e0f8_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593047029_dd34d8a1-d8fe-475d-8f82-c74f77121cc3_small.webp",
    ]

    # 按钮分类和文件名映射
    button_mapping = {
        "buttons": {
            "btn_primary": ["btn_primary_1", "btn_primary_2", "btn_primary_3", "btn_primary_4"],
            "btn_secondary": ["btn_secondary_1", "btn_secondary_2", "btn_secondary_3", "btn_secondary_4"],
            "btn_icon_menu": ["btn_icon_menu_1", "btn_icon_menu_2", "btn_icon_menu_3", "btn_icon_menu_4"],
        }
    }

    base_save_dir = r"F:\workspace\github\Footnote\assets\images\ui"

    url_index = 0
    success_count = 0
    fail_count = 0

    for category, buttons in button_mapping.items():
        for button_type, filenames in buttons.items():
            print(f"\n============================================================")
            print(f"Downloading {category}/{button_type} ({len(filenames)} images)")
            print(f"============================================================")
            
            button_dir = os.path.join(base_save_dir, category)
            os.makedirs(button_dir, exist_ok=True)

            for filename in filenames:
                if url_index < len(image_urls):
                    url = image_urls[url_index]
                    save_path = os.path.join(button_dir, f"{filename}.webp")
                    try:
                        print(f"  {filename}.webp ... ", end="")
                        download_image(url, save_path)
                        success_count += 1
                    except requests.exceptions.RequestException as e:
                        print(f"  FAILED - {e}")
                        fail_count += 1
                    url_index += 1
                else:
                    print(f"  {filename}.webp ... NOT ENOUGH URLs")
                    fail_count += 1

    print(f"\n============================================================")
    print(f"Download complete! Success: {success_count}, Failed: {fail_count}")
    print(f"============================================================")

if __name__ == "__main__":
    main()

