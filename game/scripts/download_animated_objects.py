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
    # 24 animated object images from chatId 23372
    image_urls = [
        # Desk lamp flicker (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592084491_937b4395-5f4d-4f4a-87ac-83f2b1f7d56d_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592080568_5af9cc9a-3d41-4d5a-afaa-ee11bbb27a88_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592071532_ce3bcdd5-25b0-4f25-bfa9-9278473a2f41_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592083544_5aa9dcf0-a3b5-4e6a-841a-b33561bf03f7_small.webp",
        # Oil lamp flame (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592100258_7bdeac45-d82f-4a23-98af-9cc1f94fc403_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592108171_3a1c6206-5d4b-4fb5-8227-3f9ac10f23cd_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592103627_fdde7559-20c1-4b1d-a4e9-6b10f6373efc_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592101107_346c96f4-6a77-4dab-9bc6-9030341cebdb_small.webp",
        # Candle burning (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592111446_0f10df7d-303e-4d9a-be11-e4305bcb2aef_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592109022_01c49dd1-04cb-45b6-98a0-558a2139b9a7_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592118950_689bf146-a42c-44ba-804e-fcc3f45c72f9_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592115575_694ac9f6-672f-40c4-857c-25d05c1697a9_small.webp",
        # Monitor flicker (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592137324_455c3be3-5c95-48d6-9959-7b2528f3e973_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592141663_faea3f81-ba92-4a44-a354-cb0152e1c878_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592136920_b9c40807-72ae-427c-9602-4fed68b4fab9_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592134148_c867d0b3-7164-4579-9cfd-68153c25c0cd_small.webp",
        # Crack trembling (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592153459_63113057-33a8-4356-bf6e-bdd591b5326c_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592160050_76b5dc06-ad28-4b91-85e3-0f4f52d4cf3e_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592147156_c1e6f551-15b8-4015-b3e9-cf8042e4e127_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592156979_c0f44e92-012b-4688-b4b4-eaca51b19236_small.webp",
        # Rune glowing (4)
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592155261_b92381c1-f90c-428f-b4a1-767598e4398b_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592157512_f5ca9492-2435-42ac-b475-71e2da905fce_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592172960_f028753b-0c09-4b2a-82e6-a15cba392f4d_small.webp",
        "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592170805_e4d3b884-eca2-455e-8fba-2a2193527e1c_small.webp",
    ]

    # Map: category -> directory, filenames
    object_mapping = {
        "lights": {
            "desk_lamp_flicker": [0, 1, 2, 3],
            "oil_lamp_flame": [4, 5, 6, 7],
            "candle_burning": [8, 9, 10, 11],
        },
        "mechanical": {
            "monitor_flicker": [12, 13, 14, 15],
        },
        "environmental": {
            "crack_trembling": [16, 17, 18, 19],
        },
        "mystical": {
            "rune_glowing": [20, 21, 22, 23],
        }
    }

    base_save_dir = r"F:\workspace\github\Footnote\assets\images\objects\animated"

    download_count = 0
    for category, objects in object_mapping.items():
        category_dir = os.path.join(base_save_dir, category)
        os.makedirs(category_dir, exist_ok=True)
        
        for obj_name, indices in objects.items():
            print(f"\n============================================================")
            print(f"Downloading {category}/{obj_name} ({len(indices)} images)")
            print(f"============================================================")
            
            for i, idx in enumerate(indices, start=1):
                url = image_urls[idx]
                filename = f"{obj_name}_{i}.webp"
                save_path = os.path.join(category_dir, filename)
                
                try:
                    download_image(url, save_path)
                    download_count += 1
                except requests.exceptions.RequestException as e:
                    print(f"Error downloading {filename}: {e}")

    print(f"\n============================================================")
    print(f"Download complete! Total: {download_count} images")
    print(f"============================================================")

if __name__ == "__main__":
    main()

