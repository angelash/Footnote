# -*- coding: utf-8 -*-
"""
下载阶段2角色头像表情变体图片
牧平(muping)、栖蓝(qilan)、陈匠(chenjiang) 各5张表情
"""
import requests
import os
import time

BASE_URL = "https://artflow.gz4399.com"

# 最新生成的15张头像图片URL（牧平5张 + 栖蓝5张 + 陈匠5张）
# 按ID降序排列，最新的在前面
LATEST_PORTRAIT_URLS = [
    # 陈匠 (chenjiang) - 5张 (最新生成)
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590912526_45c53b87-6ec5-465a-a458-cfb092fffa24_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590914951_ae3c3aa0-ef00-4b70-8539-9262703709de_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590913435_4ba4f0b6-72d8-43e1-ab79-beff912030f5_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590912089_6a7d07e0-7625-47e2-adf7-dbf72be6672a_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590911378_e4318478-5c65-4103-8d41-fa2348f3206a_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590896400_e7c42042-1257-404b-b1d2-600c00ea8d6a_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590897995_dbfad0f3-e20d-41c7-8479-5ee782692a39_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590917098_b35ef21b-ecfc-4a7a-8776-a0e01815d0a1_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590895673_466d3190-ec59-4956-9ace-25dffda76634_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590900385_7a90feda-06e3-4827-b75b-52138c916aa6_small.webp",
    # 栖蓝 (qilan) - 5张
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590889873_776bc399-447f-4a2c-80af-38f7d89f50ce_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590887075_f77796cc-0261-4d22-abb9-51f3db4482b7_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590882718_eb49ed8f-353e-4f57-979a-dd72f2dc66ba_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590883854_778c3994-73f1-4e63-ac86-be452304c4bc_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590890201_fb00d45b-d046-4b3e-a3f7-980d55bd7491_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590877743_6b24ae9d-018c-465c-aa67-a192bf8b1c77_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590877017_6321402b-bfe4-49b0-9409-d78303ac095f_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590886331_2c43b3c9-ebd5-4b95-8b73-a51541d2fbd6_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590884727_b31a298c-28d7-4ece-9343-8c6e1cf39af5_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590878215_af72791a-b957-4be4-a0ee-e381ea738829_small.webp",
    # 牧平 (muping) - 5张
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590868388_47bf4f5e-053c-48d5-a847-b59b7b9ba5fc_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590871022_6de80bd6-c50e-41bf-a9f3-b753d27e47f3_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590879451_13012d96-c9fe-44f8-874c-38e28cd06f9d_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590868856_f2ae7412-3883-4642-8422-30b45141e9bd_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590869582_bbe2a51c-5ab3-42e7-a027-91e5745af582_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590866603_8a53d4a5-77de-4408-af29-1c117bdf43ca_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590870899_bfb45166-ad54-49b0-99de-d9ed2a8a3268_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590866721_e1c6a400-0124-4f2c-a25c-a4b1845f830b_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590862739_5aed160a-508f-46da-8b99-de7d373b49f2_small.webp",
    "/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590868540_afc49a00-2d15-4138-9c3d-2ecbf35e9ea4_small.webp",
]

# 角色目录映射
CHARACTER_DIRS = {
    "muping": "F:/workspace/github/Footnote/assets/images/characters/portraits/muping",
    "qilan": "F:/workspace/github/Footnote/assets/images/characters/portraits/qilan",
    "chenjiang": "F:/workspace/github/Footnote/assets/images/characters/portraits/chenjiang",
}

# 表情名称（每个角色5张）
EXPRESSIONS = ["neutral", "focused", "serene", "devout", "sorrowful"]  # 牧平的表情
QILAN_EXPRESSIONS = ["neutral", "resigned", "longing", "sad", "hopeful"]  # 栖蓝的表情
CHENJIANG_EXPRESSIONS = ["neutral", "hopeful", "determined", "sad", "focused"]  # 陈匠的表情

def download_image(url, save_path):
    """下载单张图片"""
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
    # 确保目录存在
    for dir_path in CHARACTER_DIRS.values():
        os.makedirs(dir_path, exist_ok=True)
    
    downloaded = 0
    failed = 0
    
    # 每个角色提交了2组（每组4张），但我们需要从最新的图片中挑选
    # 由于生成顺序和API返回顺序可能不同，我们先下载所有30张，然后手动整理
    
    print("=" * 60)
    print("下载牧平头像 (10张备选)")
    print("=" * 60)
    for i, url in enumerate(LATEST_PORTRAIT_URLS[20:30]):
        filename = f"muping_portrait_{i+1}.webp"
        save_path = os.path.join(CHARACTER_DIRS["muping"], filename)
        if download_image(url, save_path):
            downloaded += 1
        else:
            failed += 1
        time.sleep(0.2)
    
    print("\n" + "=" * 60)
    print("下载栖蓝头像 (10张备选)")
    print("=" * 60)
    for i, url in enumerate(LATEST_PORTRAIT_URLS[10:20]):
        filename = f"qilan_portrait_{i+1}.webp"
        save_path = os.path.join(CHARACTER_DIRS["qilan"], filename)
        if download_image(url, save_path):
            downloaded += 1
        else:
            failed += 1
        time.sleep(0.2)
    
    print("\n" + "=" * 60)
    print("下载陈匠头像 (10张备选)")
    print("=" * 60)
    for i, url in enumerate(LATEST_PORTRAIT_URLS[0:10]):
        filename = f"chenjiang_portrait_{i+1}.webp"
        save_path = os.path.join(CHARACTER_DIRS["chenjiang"], filename)
        if download_image(url, save_path):
            downloaded += 1
        else:
            failed += 1
        time.sleep(0.2)
    
    print("\n" + "=" * 60)
    print(f"下载完成! 成功: {downloaded}, 失败: {failed}")
    print("=" * 60)

if __name__ == "__main__":
    main()

