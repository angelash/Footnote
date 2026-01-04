# 特效资产下载脚本
# 阶段5: 特效资产 (Phase 5: Special Effects)
# chatId: 23373

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
    # 特效图片URLs (从API获取)
    # 按顺序对应: 深度感知激活(4), 深度介入(4), 时间干预(4), 系统审判(4), 维度伤痕(4), 数据涟漪(4), 漂移残影(4)
    image_urls = [
        # 深度感知激活 (Depth Perception Activation) - abilities
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592428444_98a099e1-b249-4d61-a788-50dd628d9713_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592422292_7deb8bd7-c01f-4bff-adeb-3fca3d32954f_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592443546_ce0b98ae-fd21-4764-96d7-632bac031b51_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592422881_7693e4bd-2bb7-4385-a78a-08b911dce260_small.webp",
        # 深度介入 (Depth Intervention) - abilities
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592445199_6368efc5-7d13-4731-8c70-9d2883e16359_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592448955_b45506fa-0c91-481b-8010-cb2c203594ec_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592448519_d7ebc2c9-b778-4528-bf69-d8327d07a0fa_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592455412_7bcfaf7d-3522-4dc1-9515-8f3de0253dca_small.webp",
        # 时间干预 (Time Intervention) - abilities
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592472638_f37c6815-340d-4133-b79c-944fc5497b1e_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592464816_fda9c50c-9f5c-419c-8b53-f7eff2d88fcd_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592469910_f2b0c0fb-0dac-4569-ab27-3e29ac81fdf4_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592471873_5d7cd881-96a4-48a3-b83d-6a5d8b389e5f_small.webp",
        # 系统审判 (System Verdict) - system
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592489406_a97ac7dc-9632-45ec-974c-9fe7b1f59e46_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592481032_ebd7db46-b228-4699-801f-b198b319661e_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592476755_9d499045-b66f-48ff-bcb7-dc40f96b6148_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592478707_ed1b0e1f-6121-4766-be98-cdf9ffadf8f2_small.webp",
        # 维度伤痕 (Dimensional Scar) - environmental
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592505834_6c2a8e24-7636-48e0-b459-7b7b518895c6_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592497737_9dd4c6e2-ba13-43c1-b255-c5b943dfff68_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592510525_73a29ad8-08bc-4545-a8b0-93845de1f2af_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592496383_339d45c8-a0a7-4788-95d4-c70960f5964e_small.webp",
        # 数据涟漪 (Data Ripple) - system
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592572699_ef8c7bbf-3430-4976-adee-a6881cb74f71_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592573917_d51f0d12-0438-4bd3-b107-df246645adf8_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592564707_f95e2623-cbf0-43cc-a3a5-cc202387dcb4_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592576564_7775055f-13e3-4b7f-9f46-171e54897bf0_small.webp",
        # 漂移残影 (Drift Afterimage) - abilities
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592580446_7559e560-ddf3-4234-803c-3ffa08dcb6b4_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592584539_97ba0a45-824a-4d34-8bec-41ad11df4c0c_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592576888_d152208e-2968-46a6-b82e-865654204b48_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592580627_9f780e62-81ce-4ea4-8f19-4b96f429e530_small.webp",
    ]

    # 特效分类和文件名映射
    effect_mapping = {
        "abilities": {
            "depth_perception": ["depth_perception_1", "depth_perception_2", "depth_perception_3", "depth_perception_4"],
            "depth_intervention": ["depth_intervention_1", "depth_intervention_2", "depth_intervention_3", "depth_intervention_4"],
            "time_intervention": ["time_intervention_1", "time_intervention_2", "time_intervention_3", "time_intervention_4"],
            "drift_afterimage": ["drift_afterimage_1", "drift_afterimage_2", "drift_afterimage_3", "drift_afterimage_4"],
        },
        "system": {
            "system_verdict": ["system_verdict_1", "system_verdict_2", "system_verdict_3", "system_verdict_4"],
            "data_ripple": ["data_ripple_1", "data_ripple_2", "data_ripple_3", "data_ripple_4"],
        },
        "environmental": {
            "dimensional_scar": ["dimensional_scar_1", "dimensional_scar_2", "dimensional_scar_3", "dimensional_scar_4"],
        }
    }

    base_save_dir = r"F:\workspace\github\Footnote\assets\images\effects"

    # 按顺序分配URLs
    url_index = 0
    download_order = [
        ("abilities", "depth_perception"),
        ("abilities", "depth_intervention"),
        ("abilities", "time_intervention"),
        ("system", "system_verdict"),
        ("environmental", "dimensional_scar"),
        ("system", "data_ripple"),
        ("abilities", "drift_afterimage"),
    ]

    success_count = 0
    fail_count = 0

    for category, effect_name in download_order:
        filenames = effect_mapping[category][effect_name]
        print(f"\n============================================================")
        print(f"Downloading {category}/{effect_name} ({len(filenames)} images)")
        print(f"============================================================")
        
        effect_dir = os.path.join(base_save_dir, category)
        os.makedirs(effect_dir, exist_ok=True)

        for filename in filenames:
            if url_index < len(image_urls):
                url = image_urls[url_index]
                save_path = os.path.join(effect_dir, f"{filename}.webp")
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

