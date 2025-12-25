# UI面板和指示器资产下载脚本
# 阶段6: UI图素 - 面板部分
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
    # 新增的UI图片URLs (索引12-27，按钮之后的)
    # 按顺序: 对话框面板1(4) + 对话框面板2(4) + 卡片面板(4) + 进度条(4)
    image_urls = [
        # 对话框面板 1
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593210505_fc23c6c6-88ec-43c6-b12c-03ff7c55c5b7_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593197310_7f23fe14-17e0-414d-876d-4be7eda40166_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593200613_39135b48-28b1-4eec-983a-6e9cea73f88f_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593201177_e5315349-6b9a-469d-b4b3-d341ee77dfc1_small.webp",
        # 对话框面板 2
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593207925_e2c031a6-6f64-4c48-b378-f9b6def03a79_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593206158_bf4556f3-80fd-405c-a661-48f03bb87b99_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593225263_bf5f4b4e-61fe-49b8-8269-cd3f0be50886_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593221243_bd03be96-1f0b-4414-9cd7-ffd7529bc5c1_small.webp",
        # 卡片面板
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593235998_5634efd6-7940-452d-9c35-6f5890351ab0_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593235096_79c356c9-7cd3-4729-a2e9-eb7276340737_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593245422_a37ccb3f-7b30-467e-8e2a-01b92fba7cc9_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593226145_2d690256-4ce7-4fb9-be9a-55bd75531612_small.webp",
        # 进度条
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593232300_e57ae2f2-0b95-424d-adda-24230be97d53_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593236715_1f7c1750-5a18-46c0-a081-e259fc144b7f_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593234103_a74cb8fe-d872-4922-97ed-7d69cd3368f6_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593232140_5f40895c-076a-4a06-97b9-2bfa4d2c7e50_small.webp",
    ]

    # 面板分类和文件名映射
    panel_mapping = {
        "panels": {
            "panel_dialogue": ["panel_dialogue_1", "panel_dialogue_2", "panel_dialogue_3", "panel_dialogue_4",
                              "panel_dialogue_5", "panel_dialogue_6", "panel_dialogue_7", "panel_dialogue_8"],
            "panel_card": ["panel_card_1", "panel_card_2", "panel_card_3", "panel_card_4"],
        },
        "indicators": {
            "progress_bar": ["progress_bar_1", "progress_bar_2", "progress_bar_3", "progress_bar_4"],
        }
    }

    base_save_dir = r"F:\workspace\github\Footnote\assets\images\ui"

    url_index = 0
    success_count = 0
    fail_count = 0

    for category, panels in panel_mapping.items():
        for panel_type, filenames in panels.items():
            print(f"\n============================================================")
            print(f"Downloading {category}/{panel_type} ({len(filenames)} images)")
            print(f"============================================================")
            
            panel_dir = os.path.join(base_save_dir, category)
            os.makedirs(panel_dir, exist_ok=True)

            for filename in filenames:
                if url_index < len(image_urls):
                    url = image_urls[url_index]
                    save_path = os.path.join(panel_dir, f"{filename}.webp")
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

